import type { MediaItem, MediaSource, SourceExtractor } from "./source-extractor.js";

const extensions: Record<string, { mediaType: MediaItem["mediaType"]; mimeType: string }> = {
  ".mp4": { mediaType: "video", mimeType: "video/mp4" },
  ".mov": { mediaType: "video", mimeType: "video/quicktime" },
  ".webm": { mediaType: "video", mimeType: "video/webm" },
  ".jpg": { mediaType: "image", mimeType: "image/jpeg" },
  ".jpeg": { mediaType: "image", mimeType: "image/jpeg" },
  ".png": { mediaType: "image", mimeType: "image/png" },
  ".webp": { mediaType: "image", mimeType: "image/webp" }
};

export class DirectMediaExtractor implements SourceExtractor {
  readonly id = "direct-media";

  canHandle(url: URL): boolean {
    return url.protocol === "https:" && Object.keys(extensions).some((extension) => url.pathname.toLowerCase().endsWith(extension));
  }

  async extract(url: URL): Promise<MediaSource> {
    const match = Object.entries(extensions).find(([extension]) => url.pathname.toLowerCase().endsWith(extension));
    if (!match) throw new Error("Unsupported direct media URL");
    const [, type] = match;
    return {
      extractorId: this.id,
      originalUrl: url.toString(),
      title: null,
      items: [{
        id: "source",
        mediaType: type.mediaType,
        title: null,
        cover: null,
        duration: null,
        streams: [{ url: url.toString(), mimeType: type.mimeType, quality: "source", watermarked: false }]
      }]
    };
  }
}
