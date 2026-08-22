import { env } from "../../config/env.js";
import { DreaminaExtractor, JimengExtractor } from "../extractor/creator-work.extractor.js";
import { DolaExtractor } from "../extractor/dola.extractor.js";
import { DouyinExtractor } from "../extractor/douyin.extractor.js";
import { ExtractorRegistry, type MediaItem, type MediaStream } from "../extractor/source-extractor.js";
import { extractFirstPublicUrl, getVideoPlatform, type VideoPlatformId } from "../platform/video-platforms.js";
import { SourceTicketService } from "./source-ticket.service.js";

export type ResolvedSourceDownload = {
  id: string;
  mediaType: "video" | "audio";
  label: string;
  quality: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  filename: string;
  downloadPath: string;
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
  downloads: ResolvedSourceDownload[];
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

function extensionForMime(mimeType: string): string {
  if (mimeType === "audio/mpeg") return "mp3";
  if (mimeType === "audio/mp4") return "m4a";
  return "mp4";
}

function ticketPath(ticket: string, download = false): string {
  return `/v1/source-media/${encodeURIComponent(ticket)}${download ? "?download=1" : ""}`;
}

export class SourceResolutionService {
  private readonly extractors = new ExtractorRegistry([
    new DolaExtractor(),
    new DreaminaExtractor(),
    new JimengExtractor(),
    new DouyinExtractor()
  ]);

  constructor(private readonly tickets: SourceTicketService) {}

  async resolve(platformId: VideoPlatformId, url: string): Promise<ResolvedSource> {
    const platform = getVideoPlatform(platformId);
    const normalizedUrl = extractFirstPublicUrl(url);
    if (!normalizedUrl || normalizedUrl.protocol !== "https:") {
      throw Object.assign(new Error("The input does not contain a valid public URL"), { code: "INVALID_SOURCE_URL", statusCode: 422 });
    }
    const source = await this.extractors.extract(normalizedUrl.toString());
    if (source.extractorId !== platform.extractorId) {
      throw Object.assign(new Error("The URL does not match the selected platform"), { code: "INVALID_SOURCE_URL", statusCode: 422 });
    }
    const items = source.items.filter((item) => item.mediaType === "video");
    const audioItems = source.items.filter((item) => item.mediaType === "audio");
    if (items.length === 0) throw Object.assign(new Error("No videos were found"), { code: "SOURCE_NO_VIDEO", statusCode: 404 });

    const videos = await Promise.all(items.map(async (item, index): Promise<ResolvedSourceVideo> => {
      const stream = selectCleanStream(item);
      if (!stream) throw Object.assign(new Error("A clean source stream is unavailable"), { code: "CLEAN_SOURCE_UNAVAILABLE", statusCode: 422 });
      const filename = safeFilename(platform.id, index);
      const videoStreams = [stream, ...item.streams.filter((candidate) => candidate !== stream && candidate.watermarked === false)];
      const downloads: ResolvedSourceDownload[] = [];
      for (const [streamIndex, candidate] of videoStreams.entries()) {
        const optionFilename = streamIndex === 0
          ? filename
          : `${platform.id}-${String(index + 1).padStart(2, "0")}-${streamIndex + 1}.${extensionForMime(candidate.mimeType)}`;
        const ticket = await this.tickets.create({
          sourceUrl: candidate.url,
          requestHeaders: candidate.requestHeaders ?? {},
          mimeType: candidate.mimeType,
          filename: optionFilename
        });
        downloads.push({
          id: `${item.id}-video-${streamIndex + 1}`,
          mediaType: "video",
          label: candidate.label ?? (streamIndex === 0 ? "No-watermark video" : candidate.quality ?? `Quality ${streamIndex + 1}`),
          quality: candidate.quality ?? "source",
          width: candidate.width ?? null,
          height: candidate.height ?? null,
          mimeType: candidate.mimeType,
          filename: optionFilename,
          downloadPath: ticketPath(ticket, true)
        });
      }
      if (index === 0) {
        for (const [audioIndex, audioItem] of audioItems.entries()) {
          const audioStream = audioItem.streams.find((candidate) => candidate.watermarked === false) ?? audioItem.streams[0];
          if (!audioStream) continue;
          const audioFilename = `${platform.id}-${String(index + 1).padStart(2, "0")}-audio-${audioIndex + 1}.${extensionForMime(audioStream.mimeType)}`;
          const audioTicket = await this.tickets.create({
            sourceUrl: audioStream.url,
            requestHeaders: audioStream.requestHeaders ?? {},
            mimeType: audioStream.mimeType,
            filename: audioFilename
          });
          downloads.push({
            id: audioItem.id,
            mediaType: "audio",
            label: audioStream.label ?? "Audio",
            quality: audioStream.quality ?? "audio",
            width: null,
            height: null,
            mimeType: audioStream.mimeType,
            filename: audioFilename,
            downloadPath: ticketPath(audioTicket, true)
          });
        }
      }
      const primaryDownload = downloads[0];
      if (!primaryDownload) throw Object.assign(new Error("A clean source stream is unavailable"), { code: "CLEAN_SOURCE_UNAVAILABLE", statusCode: 422 });
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
        previewPath: primaryDownload.downloadPath.replace("?download=1", ""),
        downloadPath: primaryDownload.downloadPath,
        downloads
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
