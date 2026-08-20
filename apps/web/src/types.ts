export type TaskStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
export type TaskType = "IMAGE_WATERMARK_REMOVE" | "VIDEO_WATERMARK_REMOVE" | "SOURCE_DOWNLOAD" | "IMAGE_PROCESS";

export type TaskEvent = {
  id: string;
  status: TaskStatus;
  message: string;
  createdAt: string;
};

export type Task = {
  id: string;
  taskType: TaskType;
  status: TaskStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: { code: string; message: string } | null;
  createdAt: string;
  updatedAt: string;
  events?: TaskEvent[];
};

export type ResultFile = {
  assetId: string;
  mimeType: string;
  filename: string | null;
  title: string | null;
  cover: string | null;
  duration: number | null;
  index: number;
  downloadUrl: string;
  expiresInSeconds: number;
};

export type ResultResponse = {
  assetId: string;
  mimeType: string;
  downloadUrl: string;
  expiresInSeconds: number;
  files: ResultFile[];
};

export type ResolvedSourceVideo = {
  id: string;
  title: string;
  coverUrl: string | null;
  duration: number | null;
  quality: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  filename: string;
  previewPath: string;
  downloadPath: string;
};

export type ResolvedSource = {
  platform: string;
  title: string | null;
  videoCount: number;
  expiresInSeconds: number;
  videos: ResolvedSourceVideo[];
};

export type WatermarkRegion = { x: number; y: number; width: number; height: number };
