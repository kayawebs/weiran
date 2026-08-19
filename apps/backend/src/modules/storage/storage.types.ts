export type MediaType = "image" | "video" | "audio" | "unknown";
export type AssetUploadStatus = "PENDING" | "READY";

export type MediaAsset = {
  id: string;
  userId: string;
  storageKey: string;
  mediaType: MediaType;
  mimeType: string;
  byteSize: number | null;
  originalFilename: string | null;
  uploadStatus: AssetUploadStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export function mediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "unknown";
}
