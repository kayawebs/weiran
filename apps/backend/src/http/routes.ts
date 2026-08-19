import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { pool } from "../db/client.js";
import { requireAuthentication } from "./auth.js";
import { AuthService, AuthenticationError } from "../modules/auth/auth.service.js";
import { listVideoPlatforms } from "../modules/platform/video-platforms.js";
import { AssetRepository } from "../modules/storage/asset.repository.js";
import { StorageService } from "../modules/storage/storage.service.js";
import { mediaTypeFromMime } from "../modules/storage/storage.types.js";
import { TaskRepository } from "../modules/task/task.repository.js";
import { TaskService, TaskValidationError } from "../modules/task/task.service.js";
import { createTaskSchema, type TaskRecord } from "../modules/task/task.types.js";
import { ensureUser } from "../shared/users.js";

const uploadSchema = z.object({
  filename: z.string().min(1).max(180).regex(/^[^/\\]+$/, "filename must not contain a path"),
  mimeType: z.string().min(3).max(100).refine((value) => value.startsWith("image/") || value.startsWith("video/"), "Only image and video uploads are accepted"),
  byteSize: z.number().int().positive().max(env.MAX_UPLOAD_BYTES)
});
const idParams = z.object({ taskId: z.string().uuid() });
const assetParams = z.object({ assetId: z.string().uuid() });
const wechatLoginSchema = z.object({ code: z.string().min(1).max(512) });
const taskListQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });
const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/heic": ".heic",
  "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm"
};

function presentTask(task: TaskRecord, events?: Awaited<ReturnType<TaskRepository["listEvents"]>>) {
  return {
    id: task.id, taskType: task.taskType, status: task.status, input: task.input, output: task.output,
    error: task.errorCode ? { code: task.errorCode, message: task.errorMessage } : null,
    attemptCount: task.attemptCount, createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString(),
    events: events?.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() }))
  };
}

type ResultDescriptor = {
  assetId: string;
  title: string | null;
  cover: string | null;
  duration: number | null;
  index: number;
};

function resultDescriptors(task: TaskRecord): ResultDescriptor[] {
  const declaredResults = Array.isArray(task.output?.results) ? task.output.results : [];
  const parsed = declaredResults.flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const result = value as Record<string, unknown>;
    return typeof result.assetId === "string"
      ? [{
          assetId: result.assetId,
          title: typeof result.title === "string" ? result.title : null,
          cover: typeof result.cover === "string" ? result.cover : null,
          duration: typeof result.duration === "number" ? result.duration : null,
          index
        }]
      : [];
  });
  if (parsed.length > 0) return parsed;
  const resultAssetIds = Array.isArray(task.output?.resultAssetIds)
    ? task.output.resultAssetIds.filter((value): value is string => typeof value === "string")
    : [];
  if (resultAssetIds.length > 0) return resultAssetIds.map((assetId, index) => ({ assetId, title: null, cover: null, duration: null, index }));
  return typeof task.output?.resultAssetId === "string"
    ? [{ assetId: task.output.resultAssetId, title: null, cover: null, duration: null, index: 0 }]
    : [];
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  const storage = new StorageService();
  const assets = new AssetRepository(pool);
  const tasks = new TaskRepository(pool);
  const taskService = new TaskService();
  const authService = new AuthService();

  app.get("/health", async () => {
    await pool.query("SELECT 1");
    return { ok: true, service: "creator-tools-api" };
  });

  app.get("/v1/capabilities", async () => ({
    taskTypes: ["IMAGE_WATERMARK_REMOVE", "VIDEO_WATERMARK_REMOVE", "SOURCE_DOWNLOAD"],
    videoWatermarkPlatforms: listVideoPlatforms().map((platform) => ({
      id: platform.id,
      name: platform.name,
      description: platform.description,
      urlPlaceholder: platform.urlPlaceholder
    })),
    limits: { maxUploadBytes: env.MAX_UPLOAD_BYTES, maxWatermarkRegions: 10 },
    adSlot: { enabled: false, placement: "home-footer" }
  }));

  app.post("/v1/auth/wechat", async (request, reply) => {
    const { code } = wechatLoginSchema.parse(request.body);
    const session = await authService.loginWithWechatCode(code);
    reply.code(200);
    return { accessToken: session.accessToken, expiresInSeconds: session.expiresInSeconds };
  });

  app.post("/v1/assets/upload-url", { preHandler: requireAuthentication }, async (request, reply) => {
    const body = uploadSchema.parse(request.body);
    const assetId = randomUUID();
    const extension = extensionByMime[body.mimeType] ?? "";
    const storageKey = `uploads/${request.userId}/${assetId}${extension}`;
    await ensureUser(pool, request.userId);
    const asset = await assets.create({
      id: assetId, userId: request.userId, storageKey, mediaType: mediaTypeFromMime(body.mimeType),
      mimeType: body.mimeType, byteSize: body.byteSize, originalFilename: body.filename, metadata: { upload: { state: "pending" } }
    });
    const upload = await storage.createUploadPost(storageKey, body.mimeType);
    reply.code(201);
    return { assetId: asset.id, upload, expiresInSeconds: env.UPLOAD_URL_TTL_SECONDS };
  });

  app.post("/v1/assets/:assetId/complete", { preHandler: requireAuthentication }, async (request, reply) => {
    const { assetId } = assetParams.parse(request.params);
    const asset = await assets.findById(assetId, request.userId);
    if (!asset) return reply.code(404).send({ code: "ASSET_NOT_FOUND", message: "Asset not found" });
    if (asset.uploadStatus === "READY") return { assetId: asset.id, status: asset.uploadStatus };
    const object = await storage.headObject(asset.storageKey);
    if (object.byteSize > env.MAX_UPLOAD_BYTES) return reply.code(413).send({ code: "UPLOAD_TOO_LARGE", message: "Uploaded file exceeds the size limit" });
    const ready = await assets.markReady(asset.id, request.userId, object.byteSize);
    if (!ready) return reply.code(409).send({ code: "ASSET_STATE_CONFLICT", message: "Asset upload state changed" });
    return { assetId: ready.id, status: ready.uploadStatus };
  });

  app.post("/v1/tasks", { preHandler: requireAuthentication }, async (request, reply) => {
    const body = createTaskSchema.parse(request.body);
    const task = await taskService.create(request.userId, body);
    reply.code(202);
    return presentTask(task);
  });

  app.get("/v1/tasks", { preHandler: requireAuthentication }, async (request) => {
    const { limit } = taskListQuery.parse(request.query);
    const taskList = await taskService.list(request.userId, limit);
    return { tasks: taskList.map((task) => presentTask(task)) };
  });

  app.get("/v1/tasks/:taskId", { preHandler: requireAuthentication }, async (request, reply) => {
    const { taskId } = idParams.parse(request.params);
    const task = await taskService.get(request.userId, taskId);
    if (!task) return reply.code(404).send({ code: "TASK_NOT_FOUND", message: "Task not found" });
    const events = await tasks.listEvents(task.id);
    return presentTask(task, events);
  });

  app.get("/v1/tasks/:taskId/result-url", { preHandler: requireAuthentication }, async (request, reply) => {
    const { taskId } = idParams.parse(request.params);
    const task = await taskService.get(request.userId, taskId);
    if (!task) return reply.code(404).send({ code: "TASK_NOT_FOUND", message: "Task not found" });
    if (task.status !== "SUCCESS") return reply.code(409).send({ code: "TASK_NOT_READY", message: "Task has not completed" });
    const descriptors = resultDescriptors(task);
    if (descriptors.length === 0) return reply.code(500).send({ code: "TASK_RESULT_INVALID", message: "Task has no result asset" });
    const files = await Promise.all(descriptors.map(async (descriptor) => {
      const asset = await assets.findById(descriptor.assetId, request.userId);
      if (!asset) throw Object.assign(new Error("Result asset is unavailable"), { code: "RESULT_ASSET_MISSING" });
      return {
        assetId: asset.id,
        mimeType: asset.mimeType,
        filename: asset.originalFilename,
        title: descriptor.title,
        cover: descriptor.cover,
        duration: descriptor.duration,
        index: descriptor.index,
        downloadUrl: await storage.createDownloadUrl(asset.storageKey),
        expiresInSeconds: env.DOWNLOAD_URL_TTL_SECONDS
      };
    }));
    const first = files[0]!;
    return {
      assetId: first.assetId,
      mimeType: first.mimeType,
      downloadUrl: first.downloadUrl,
      expiresInSeconds: first.expiresInSeconds,
      files
    };
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) return reply.code(400).send({ code: "VALIDATION_ERROR", message: "Invalid request", details: error.flatten() });
    if (error instanceof AuthenticationError) return reply.code(401).send({ code: error.code, message: error.message });
    if (error instanceof TaskValidationError) return reply.code(422).send({ code: "INVALID_TASK_INPUT", message: error.message });
    const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number" ? (error as { statusCode: number }).statusCode : 500;
    const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "INTERNAL_ERROR";
    app.log.error(error);
    const message = error instanceof Error ? error.message : "Request failed";
    return reply.code(statusCode).send({ code, message: statusCode >= 500 ? "Internal server error" : message });
  });
}
