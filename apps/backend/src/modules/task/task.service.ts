import { randomUUID } from "node:crypto";
import { pool, withTransaction } from "../../db/client.js";
import { AssetRepository } from "../storage/asset.repository.js";
import { enqueueTask } from "./task.queue.js";
import { TaskRepository } from "./task.repository.js";
import type { CreateTaskRequest, TaskRecord } from "./task.types.js";
import { ensureUser } from "../../shared/users.js";
import { publicErrorCode } from "../../shared/public-errors.js";

export class TaskValidationError extends Error {}

export class TaskService {
  async create(userId: string, request: CreateTaskRequest): Promise<TaskRecord> {
    const task = await withTransaction(async (client) => {
      await ensureUser(client, userId);
      const assets = new AssetRepository(client);
      const sourceAssetId = "sourceAssetId" in request.input ? request.input.sourceAssetId : undefined;
      if (sourceAssetId) {
        const asset = await assets.findById(sourceAssetId, userId);
        if (!asset) throw new TaskValidationError("Input asset does not exist or is not owned by this user");
        if (asset.uploadStatus !== "READY") throw new TaskValidationError("Input asset upload has not completed");
        if (request.taskType === "IMAGE_WATERMARK_REMOVE" && asset.mediaType !== "image") {
          throw new TaskValidationError("IMAGE_WATERMARK_REMOVE requires an image asset");
        }
        if (request.taskType === "VIDEO_WATERMARK_REMOVE" && asset.mediaType !== "video") {
          throw new TaskValidationError("VIDEO_WATERMARK_REMOVE requires a video asset");
        }
      }
      const tasks = new TaskRepository(client);
      const created = await tasks.create({
        id: randomUUID(), userId, taskType: request.taskType, input: request.input
      });
      await tasks.addEvent(created.id, "PENDING", "Task accepted and queued");
      return created;
    });

    try {
      await enqueueTask(task.id);
    } catch (error) {
      // The row deliberately remains PENDING so a reconciliation job can enqueue it later.
      const code = publicErrorCode(error);
      console.error("Task queue submission failed", { taskId: task.id, code, error });
      await new TaskRepository(pool).addEvent(task.id, "PENDING", "Queue submission delayed", {
        code
      });
      throw error;
    }
    return task;
  }

  async get(userId: string, taskId: string): Promise<TaskRecord | null> {
    return new TaskRepository(pool).findById(taskId, userId);
  }

  async list(userId: string, limit: number): Promise<TaskRecord[]> {
    return new TaskRepository(pool).listForUser(userId, limit);
  }
}
