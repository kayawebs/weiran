import { env } from "../../config/env.js";
import { DreaminaExtractor, JimengExtractor } from "../extractor/creator-work.extractor.js";
import { DolaExtractor } from "../extractor/dola.extractor.js";
import { ExtractorRegistry, type MediaItem, type MediaStream } from "../extractor/source-extractor.js";
import { getVideoPlatform, type VideoPlatformId } from "../platform/video-platforms.js";
import { SourceTicketService } from "./source-ticket.service.js";

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

function selectCleanStream(item: MediaItem): MediaStream | undefined {
  return item.streams.find((stream) => stream.watermarked === false && stream.quality === "source")
    ?? item.streams.find((stream) => stream.watermarked === false);
}

function safeFilename(platform: string, index: number): string {
  return `${platform}-${String(index + 1).padStart(2, "0")}.mp4`;
}

function ticketPath(ticket: string, download = false): string {
  return `/v1/source-media/${encodeURIComponent(ticket)}${download ? "?download=1" : ""}`;
}

export class SourceResolutionService {
  private readonly extractors = new ExtractorRegistry([
    new DolaExtractor(),
    new DreaminaExtractor(),
    new JimengExtractor()
  ]);

  constructor(private readonly tickets: SourceTicketService) {}

  async resolve(platformId: VideoPlatformId, url: string): Promise<ResolvedSource> {
    const platform = getVideoPlatform(platformId);
    const source = await this.extractors.extract(url);
    if (source.extractorId !== platform.extractorId) {
      throw Object.assign(new Error("The URL does not match the selected platform"), { code: "INVALID_SOURCE_URL", statusCode: 422 });
    }
    const items = source.items.filter((item) => item.mediaType === "video");
    if (items.length === 0) throw Object.assign(new Error("No videos were found"), { code: "SOURCE_NO_VIDEO", statusCode: 404 });

    const videos = await Promise.all(items.map(async (item, index): Promise<ResolvedSourceVideo> => {
      const stream = selectCleanStream(item);
      if (!stream) throw Object.assign(new Error("A clean source stream is unavailable"), { code: "CLEAN_SOURCE_UNAVAILABLE", statusCode: 422 });
      const filename = safeFilename(platform.id, index);
      const mediaTicket = await this.tickets.create({
        sourceUrl: stream.url,
        requestHeaders: stream.requestHeaders ?? {},
        mimeType: stream.mimeType,
        filename
      });
      let coverUrl: string | null = null;
      if (item.cover?.startsWith("https://")) {
        const coverTicket = await this.tickets.create({
          sourceUrl: item.cover,
          requestHeaders: stream.requestHeaders ?? {},
          mimeType: "image/jpeg",
          filename: `${platform.id}-${String(index + 1).padStart(2, "0")}-cover.jpg`
        });
        coverUrl = ticketPath(coverTicket);
      }
      return {
        id: item.id,
        title: item.title ?? `${platform.name} video ${index + 1}`,
        coverUrl,
        duration: item.duration,
        quality: stream.quality ?? "source",
        width: stream.width ?? null,
        height: stream.height ?? null,
        mimeType: stream.mimeType,
        filename,
        previewPath: ticketPath(mediaTicket),
        downloadPath: ticketPath(mediaTicket, true)
      };
    }));

    return {
      platform: platform.id,
      title: source.title,
      videoCount: videos.length,
      expiresInSeconds: env.DOWNLOAD_URL_TTL_SECONDS,
      videos
    };
  }
}
