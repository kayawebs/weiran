import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import { closeDatabase, pool } from "./db/client.js";
import { DownloaderService, DownloadError } from "./modules/downloader/downloader.service.js";
import { DirectMediaExtractor } from "./modules/extractor/direct-media.extractor.js";
import { DolaExtractor } from "./modules/extractor/dola.extractor.js";
import { ExtractorRegistry, type MediaItem, type MediaSource, type MediaStream } from "./modules/extractor/source-extractor.js";
import { getVideoPlatform } from "./modules/platform/video-platforms.js";
import { ImageWatermarkProcessor } from "./modules/processor/image/image.processor.js";
import { VideoWatermarkProcessor } from "./modules/processor/video/video.processor.js";
import { AssetRepository } from "./modules/storage/asset.repository.js";
import { StorageService } from "./modules/storage/storage.service.js";
import { mediaTypeFromMime, type MediaAsset } from "./modules/storage/storage.types.js";
import { MEDIA_QUEUE } from "./modules/task/task.constants.js";
import { TaskRepository } from "./modules/task/task.repository.js";
import { createTaskSchema, type CreateTaskRequest, type TaskRecord } from "./modules/task/task.types.js";

const storage = new StorageService();
const assets = new AssetRepository(pool);
const tasks = new TaskRepository(pool);
const downloader = new DownloaderService();
const extractors = new ExtractorRegistry([new DolaExtractor(), new DirectMediaExtractor()]);
const imageProcessor = new ImageWatermarkProcessor();
const videoProcessor = new VideoWatermarkProcessor();

const extensionsByMime: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm"
};

function extensionFor(mimeType: string, fallback = ""): string {
  return extensionsByMime[mimeType] ?? fallback;
}

function taskInput(task: TaskRecord): CreateTaskRequest {
  return createTaskSchema.parse({ taskType: task.taskType, input: task.input });
}

function selectStream(item: MediaItem, preferredQuality = "source"): MediaStream | undefined {
  return item.streams.find((stream) => stream.watermarked === false && stream.quality === preferredQuality)
    ?? item.streams.find((stream) => stream.watermarked === false)
    ?? item.streams.find((stream) => stream.quality === preferredQuality)
    ?? item.streams[0];
}

type DownloadedSource = { asset: MediaAsset; localFile: string; item: MediaItem; stream: MediaStream };

async function downloadSourceItem(
  userId: string,
  source: MediaSource,
  item: MediaItem,
  workingDirectory: string,
  index: number,
  preferredQuality = "source"
): Promise<DownloadedSource> {
  const stream = selectStream(item, preferredQuality);
  if (!stream) throw new Error("Extractor returned no downloadable stream");
  const extension = extensionFor(stream.mimeType, extname(new URL(stream.url).pathname));
  const localFile = join(workingDirectory, `source-${index + 1}${extension || ".bin"}`);
  const downloaded = await downloader.downloadToFile(stream.url, localFile, stream.requestHeaders);
  const assetId = randomUUID();
  const storageKey = `uploads/${userId}/${assetId}${extension || extensionFor(downloaded.mimeType, ".bin")}`;
  await storage.uploadFile(storageKey, localFile, downloaded.mimeType);
  const asset = await assets.create({
    id: assetId,
    userId,
    storageKey,
    mediaType: item.mediaType === "unknown" ? mediaTypeFromMime(downloaded.mimeType) : item.mediaType,
    mimeType: downloaded.mimeType,
    byteSize: downloaded.byteSize,
    originalFilename: `${source.extractorId}-${index + 1}${extension || extensionFor(downloaded.mimeType, ".bin")}`,
    metadata: {
      source: {
        extractor: source.extractorId,
        originalUrl: source.originalUrl,
        sourceId: item.id,
        title: item.title,
        cover: item.cover,
        duration: item.duration,
        quality: stream.quality,
        watermarked: stream.watermarked ?? null
      }
    }
  });
  const ready = await assets.markReady(asset.id, userId, downloaded.byteSize);
  if (!ready) throw new Error("Downloaded source asset could not be finalized");
  return { asset: ready, localFile, item, stream };
}

async function materializeAsset(asset: MediaAsset, workingDirectory: string): Promise<string> {
  const localFile = join(workingDirectory, `input${extensionFor(asset.mimeType, extname(asset.originalFilename ?? "")) || ".bin"}`);
  await storage.downloadToFile(asset.storageKey, localFile);
  return localFile;
}

async function persistResult(
  task: TaskRecord,
  localFile: string,
  mimeType: string,
  originalFilename: string,
  metadata: Record<string, unknown> = {}
): Promise<MediaAsset> {
  const resultId = randomUUID();
  const storageKey = `results/${task.userId}/${task.id}/${resultId}${extensionFor(mimeType)}`;
  const resultStat = await stat(localFile);
  await storage.uploadFile(storageKey, localFile, mimeType);
  const asset = await assets.create({
    id: resultId, userId: task.userId, storageKey, mediaType: mediaTypeFromMime(mimeType), mimeType,
    byteSize: resultStat.size,
    originalFilename,
    metadata: { producedByTaskId: task.id, taskType: task.taskType, ...metadata }
  });
  const ready = await assets.markReady(asset.id, task.userId, resultStat.size);
  if (!ready) throw new Error("Result asset could not be finalized");
  return ready;
}

async function execute(task: TaskRecord): Promise<Record<string, unknown>> {
  const input = taskInput(task);
  const directory = await mkdtemp(join(tmpdir(), "creator-task-"));
  try {
    if (input.taskType === "SOURCE_DOWNLOAD") {
      const source = await extractors.extract(input.input.url);
      const downloaded: DownloadedSource[] = [];
      for (let index = 0; index < source.items.length; index += 1) {
        const item = source.items[index]!;
        downloaded.push(await downloadSourceItem(task.userId, source, item, directory, index, input.input.preferredQuality));
      }
      const results = downloaded.map(({ asset, item }, index) => ({
        assetId: asset.id, title: item.title, cover: item.cover, duration: item.duration, index
      }));
      return {
        resultAssetId: results[0]?.assetId,
        resultAssetIds: results.map((result) => result.assetId),
        results,
        mediaType: downloaded[0]?.asset.mediaType ?? "unknown",
        originalUrl: input.input.url,
        extractor: source.extractorId
      };
    }

    if (input.taskType === "IMAGE_WATERMARK_REMOVE") {
      const source = await assets.findById(input.input.sourceAssetId, task.userId);
      if (!source) throw new Error("Input image asset disappeared before processing");
      const inputFile = await materializeAsset(source, directory);
      const outputFile = join(directory, "watermark-removed.png");
      await imageProcessor.remove(inputFile, outputFile, input.input.regions, input.input.mode);
      const result = await persistResult(task, outputFile, "image/png", "watermark-removed.png");
      return { resultAssetId: result.id, sourceAssetId: source.id };
    }

    if (input.taskType === "VIDEO_WATERMARK_REMOVE") {
      const platform = getVideoPlatform(input.input.platform);
      const source = await extractors.extract(input.input.url);
      if (source.extractorId !== platform.extractorId) throw new Error("The URL does not match the selected platform");
      const videoItems = source.items.filter((item) => item.mediaType === "video");
      if (videoItems.length === 0) throw new Error("No videos were found at this URL");
      await tasks.addEvent(task.id, "PROCESSING", `已发现 ${videoItems.length} 个视频，开始处理`, {
        platform: platform.id, count: videoItems.length
      });

      const results: Array<Record<string, unknown>> = [];
      for (let index = 0; index < videoItems.length; index += 1) {
        const item = videoItems[index]!;
        if (platform.requiresCleanSource && !item.streams.some((stream) => stream.watermarked === false)) {
          throw Object.assign(new Error(`${platform.name} 原画视频暂时不可用`), { code: "CLEAN_SOURCE_UNAVAILABLE" });
        }
        const downloaded = await downloadSourceItem(task.userId, source, item, directory, index);
        let resultFile = downloaded.localFile;
        let deliveryMode = downloaded.stream.watermarked === false ? "clean-source" : "platform-source";
        if (downloaded.stream.watermarked !== false) {
          resultFile = join(directory, `watermark-removed-${index + 1}.mp4`);
          await videoProcessor.remove(downloaded.localFile, resultFile, platform.watermarkRegions);
          deliveryMode = "platform-preset";
        }
        const result = await persistResult(
          task,
          resultFile,
          "video/mp4",
          `${platform.id}-${index + 1}.mp4`,
          { platform: platform.id, sourceAssetId: downloaded.asset.id, sourceTitle: item.title, deliveryMode }
        );
        results.push({
          assetId: result.id,
          sourceAssetId: downloaded.asset.id,
          title: item.title,
          cover: item.cover,
          duration: item.duration,
          deliveryMode,
          index
        });
        await tasks.addEvent(task.id, "PROCESSING", `第 ${index + 1}/${videoItems.length} 个视频处理完成`, {
          platform: platform.id, index
        });
      }
      return {
        resultAssetId: results[0]?.assetId,
        resultAssetIds: results.map((result) => result.assetId),
        results,
        platform: platform.id,
        sourceTitle: source.title,
        sourceUrl: input.input.url
      };
    }

    throw new Error(`No worker handler for ${input.taskType}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function processTask(job: Job<{ taskId: string }>): Promise<void> {
  const task = await tasks.markProcessing(job.data.taskId);
  // BullMQ can redeliver a job whose previous Worker died while the database
  // still says PROCESSING. The queue lock prevents concurrent execution, so a
  // redelivery may safely resume; only terminal or missing tasks are skipped.
  if (!task) return;
  await tasks.addEvent(task.id, "PROCESSING", "Worker started processing", { attempt: task.attemptCount });
  try {
    const output = await execute(task);
    await tasks.markSuccess(task.id, output);
    await tasks.addEvent(task.id, "SUCCESS", "Processing completed", output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error";
    await tasks.markPendingRetry(task.id, message);
    await tasks.addEvent(task.id, "PENDING", "Processing attempt failed; retry scheduled", { message });
    throw error;
  }
}

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const worker = new Worker<{ taskId: string }>(MEDIA_QUEUE, processTask, { connection, concurrency: env.WORKER_CONCURRENCY });

worker.on("failed", async (job, error) => {
  if (!job || job.attemptsMade < env.TASK_MAX_ATTEMPTS) return;
  const codedError = error as Error & { code?: unknown };
  const code = error instanceof DownloadError
    ? error.code
    : typeof codedError.code === "string"
      ? codedError.code
      : "PROCESSING_FAILED";
  const message = error instanceof Error ? error.message : "Unknown processing error";
  await tasks.markFailed(job.data.taskId, code, message);
  await tasks.addEvent(job.data.taskId, "FAILED", "Processing failed permanently", { code, message });
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; closing worker`);
  await worker.close();
  await connection.quit();
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

storage.ensureBucket()
  .then(() => console.log(`Worker ready: queue=${MEDIA_QUEUE}, concurrency=${env.WORKER_CONCURRENCY}`))
  .catch(async (error: unknown) => {
    console.error("Worker bootstrap failed", error);
    await shutdown("bootstrap failure");
  });
