import { z } from "zod";
import { getVideoPlatform, matchesVideoPlatformUrl, videoPlatformIds } from "../platform/video-platforms.js";

export const taskTypes = ["SOURCE_DOWNLOAD", "VIDEO_WATERMARK_REMOVE", "IMAGE_WATERMARK_REMOVE", "IMAGE_PROCESS"] as const;
export type TaskType = (typeof taskTypes)[number];

export const taskStatuses = ["PENDING", "PROCESSING", "SUCCESS", "FAILED"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const watermarkRegionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1)
}).refine((region) => region.x + region.width <= 1 && region.y + region.height <= 1, {
  message: "Watermark region must fit within the media bounds"
});

const imageWatermarkInputSchema = z.object({
  sourceAssetId: z.string().uuid(),
  regions: z.array(watermarkRegionSchema).min(1).max(10),
  mode: z.enum(["inpaint", "blur"]).default("inpaint")
});

const videoWatermarkInputSchema = z.object({
  platform: z.enum(videoPlatformIds),
  url: z.string().url()
}).superRefine((input, context) => {
  if (!matchesVideoPlatformUrl(input.platform, input.url)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["url"],
      message: getVideoPlatform(input.platform).invalidUrlMessage
    });
  }
});

const sourceDownloadInputSchema = z.object({
  url: z.string().url(),
  preferredQuality: z.enum(["source", "high", "medium"]).default("source")
});

const imageProcessInputSchema = z.object({
  sourceAssetId: z.string().uuid(),
  operation: z.enum(["compress", "convert"]),
  outputFormat: z.enum(["jpeg", "png", "webp"]).default("jpeg")
});

export const createTaskSchema = z.discriminatedUnion("taskType", [
  z.object({ taskType: z.literal("IMAGE_WATERMARK_REMOVE"), input: imageWatermarkInputSchema }),
  z.object({ taskType: z.literal("VIDEO_WATERMARK_REMOVE"), input: videoWatermarkInputSchema }),
  z.object({ taskType: z.literal("SOURCE_DOWNLOAD"), input: sourceDownloadInputSchema }),
  z.object({ taskType: z.literal("IMAGE_PROCESS"), input: imageProcessInputSchema })
]);

export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type WatermarkRegion = z.infer<typeof watermarkRegionSchema>;

export type TaskRecord = {
  id: string;
  userId: string;
  taskType: TaskType;
  status: TaskStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskEvent = {
  id: string;
  taskId: string;
  status: TaskStatus;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};
