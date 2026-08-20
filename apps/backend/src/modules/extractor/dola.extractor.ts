import { createDecipheriv, createHash } from "node:crypto";
import type { MediaItem, MediaSource, MediaStream, SourceExtractor } from "./source-extractor.js";

const MAX_THREAD_HTML_BYTES = 5 * 1024 * 1024;
const MAX_FPLAY_JSON_BYTES = 1024 * 1024;
const DOLA_REFERER = "https://www.dola.com/";
const DOLA_USER_AGENT = "Mozilla/5.0 (compatible; WeiranLab/1.0; +https://www.dola.com/)";
const FPLAY_KDF_SALT = Buffer.from(
  "TdTC5rgxYgkOUrPHpnM7pByyRiuCmrWKGWs521cXdST0m69/COjWjSanLjfBqVovHwWlGJKu8pSXMrYqOKrdWA==",
  "base64"
);

type UnknownRecord = Record<string, unknown>;

export class DolaExtractionError extends Error {
  readonly code: string;

  constructor(message: string, code = "DOLA_EXTRACTION_FAILED") {
    super(message);
    this.code = code;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try { return JSON.parse(trimmed) as unknown; } catch { return value; }
}

function decodeHtmlAttribute(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|quot|amp|apos|lt|gt);/gi, (entity, code: string) => {
    const normalized = code.toLowerCase();
    if (normalized === "quot") return "\"";
    if (normalized === "amp") return "&";
    if (normalized === "apos") return "'";
    if (normalized === "lt") return "<";
    if (normalized === "gt") return ">";
    const radix = normalized.startsWith("#x") ? 16 : 10;
    const digits = normalized.replace(/^#x?/, "");
    const point = Number.parseInt(digits, radix);
    return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
  });
}

function routePayloads(html: string): unknown[] {
  const payloads: unknown[] = [];
  const pattern = /<script\b[^>]*\bdata-fn-args=(['"])([\s\S]*?)\1[^>]*>/gi;
  for (const match of html.matchAll(pattern)) {
    const raw = match[2];
    if (!raw) continue;
    try { payloads.push(JSON.parse(decodeHtmlAttribute(raw)) as unknown); } catch { /* unrelated router payload */ }
  }
  return payloads;
}

function looksLikeVideo(value: UnknownRecord): boolean {
  return typeof value.vid === "string" && (typeof value.download_url === "string" || value.video_model !== undefined);
}

function collectVideos(value: unknown, output: Map<string, UnknownRecord>, depth = 0): void {
  if (depth > 24) return;
  const parsed = parseJson(value);
  if (parsed !== value) return collectVideos(parsed, output, depth + 1);
  if (Array.isArray(parsed)) {
    for (const item of parsed) collectVideos(item, output, depth + 1);
    return;
  }
  if (!isRecord(parsed)) return;
  if (looksLikeVideo(parsed)) output.set(String(parsed.vid), parsed);
  for (const child of Object.values(parsed)) collectVideos(child, output, depth + 1);
}

function decodeUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (/^https?:\/\//i.test(value)) return value;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return /^https?:\/\//i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function base64Bytes(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

export function decryptDolaStreamUrl(encryptedValue: string, keySeed: string): string {
  const encrypted = base64Bytes(encryptedValue);
  if (encrypted.length <= 20 || !encrypted.subarray(0, 4).equals(Buffer.from([0xa8, 0x00, 0x01, 0x00]))) {
    throw new DolaExtractionError("Dola returned an unsupported encrypted media URL");
  }
  const seed = base64Bytes(keySeed);
  const firstHash = createHash("sha512").update(seed).digest();
  const derived = createHash("sha512").update(Buffer.concat([firstHash, FPLAY_KDF_SALT])).digest();
  const decipher = createDecipheriv("aes-128-cbc", derived.subarray(0, 16), derived.subarray(16, 32));
  const decrypted = Buffer.concat([decipher.update(encrypted.subarray(4)), decipher.final()]).toString("utf8");
  if (!/^https?:\/\//i.test(decrypted)) throw new DolaExtractionError("Dola returned an invalid decrypted media URL");
  return decrypted;
}

function normalizeMediaUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const allowedHost = /^v\d+-dola\.dola\.com$/i.test(url.hostname);
    if (!allowedHost || (url.protocol !== "http:" && url.protocol !== "https:")) return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function streamHeaders(): Record<string, string> {
  return { Referer: DOLA_REFERER, "User-Agent": DOLA_USER_AGENT };
}

function makeStream(rawUrl: string, attributes: { quality?: string; width?: number; height?: number }): MediaStream | null {
  const url = normalizeMediaUrl(rawUrl);
  if (!url) return null;
  return {
    url,
    mimeType: "video/mp4",
    quality: attributes.quality,
    width: attributes.width,
    height: attributes.height,
    requestHeaders: streamHeaders(),
    watermarked: /watermark|logo_type/i.test(url)
  };
}

function coverUrl(video: UnknownRecord): string | null {
  const cover = isRecord(video.cover) ? video.cover : null;
  const preview = cover && isRecord(cover.image_preview) ? cover.image_preview : null;
  const thumb = cover && isRecord(cover.image_thumb) ? cover.image_thumb : null;
  // Dola's large preview is often HEIC, which many desktop browsers cannot
  // render. Prefer the thumbnail rendition and keep HEIC only as a fallback.
  return stringValue(thumb?.url) ?? stringValue(preview?.url);
}

function streamsForVideo(video: UnknownRecord): MediaStream[] {
  const streams: MediaStream[] = [];
  const width = numberValue(video.width) ?? undefined;
  const height = numberValue(video.height) ?? undefined;
  const downloadUrl = stringValue(video.download_url);
  if (downloadUrl) {
    const stream = makeStream(downloadUrl, { quality: "source", width, height });
    if (stream) streams.push(stream);
  }

  const model = parseJson(video.video_model);
  const videoList = isRecord(model) && isRecord(model.video_list) ? model.video_list : null;
  if (videoList) {
    for (const rendition of Object.values(videoList)) {
      if (!isRecord(rendition)) continue;
      const attributes = {
        quality: stringValue(rendition.definition) ?? stringValue(rendition.quality) ?? undefined,
        width: numberValue(rendition.vwidth) ?? undefined,
        height: numberValue(rendition.vheight) ?? undefined
      };
      for (const field of ["main_url", "backup_url_1", "backup_url_2", "backup_url_3"] as const) {
        const decoded = decodeUrl(rendition[field]);
        if (!decoded) continue;
        const stream = makeStream(decoded, attributes);
        if (stream) streams.push(stream);
      }
    }
  }

  const deduplicated = [...new Map(streams.map((stream) => [stream.url, stream])).values()];
  return deduplicated.sort((left, right) => {
    if (left.watermarked !== right.watermarked) return left.watermarked ? 1 : -1;
    return (right.width ?? 0) * (right.height ?? 0) - (left.width ?? 0) * (left.height ?? 0);
  });
}

function fallbackApiForVideo(video: UnknownRecord): string | null {
  const model = parseJson(video.video_model);
  return isRecord(model) ? stringValue(model.fallback_api) : null;
}

function cleanFallbackUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  const allowedHost = /^vod-urls-[a-z0-9-]+\.byteintlapi\.com$/i.test(url.hostname);
  const allowedPath = /^\/video\/fplay\/1\/[0-9a-f]{32}\/v[A-Za-z0-9]+$/i.test(url.pathname);
  if (url.protocol !== "https:" || !allowedHost || !allowedPath) {
    throw new DolaExtractionError("Dola returned an unsafe media resolver URL");
  }
  // codec_type=0 requests the original H.264 rendition. Omitting logo_type keeps
  // the platform's dynamic watermark template out of the generated stream.
  url.searchParams.set("codec_type", "0");
  url.searchParams.delete("logo_type");
  return url;
}

export function parseDolaFplayResponse(payload: unknown): MediaStream[] {
  const root = isRecord(payload) ? payload : null;
  const videoInfo = root && isRecord(root.video_info) ? root.video_info : null;
  const data = videoInfo && isRecord(videoInfo.data) ? videoInfo.data : null;
  const keySeed = stringValue(data?.key_seed);
  const videoList = data && isRecord(data.video_list) ? data.video_list : null;
  if (!keySeed || !videoList) throw new DolaExtractionError("Dola did not return original video metadata");

  const streams: MediaStream[] = [];
  for (const rendition of Object.values(videoList)) {
    if (!isRecord(rendition)) continue;
    const attributes = {
      quality: stringValue(rendition.definition) ?? stringValue(rendition.quality) ?? "source",
      width: numberValue(rendition.vwidth) ?? undefined,
      height: numberValue(rendition.vheight) ?? undefined
    };
    for (const field of ["main_url", "backup_url_1", "backup_url_2", "backup_url_3"] as const) {
      const encoded = stringValue(rendition[field]);
      if (!encoded) continue;
      let rawUrl = decodeUrl(encoded);
      if (!rawUrl) {
        try { rawUrl = decryptDolaStreamUrl(encoded, keySeed); } catch { continue; }
      }
      const stream = makeStream(rawUrl, attributes);
      if (stream) streams.push({ ...stream, watermarked: false });
    }
  }
  return [...new Map(streams.map((stream) => [stream.url, stream])).values()];
}

async function resolveCleanStreams(rawFallbackUrl: string): Promise<MediaStream[]> {
  const fallbackUrl = cleanFallbackUrl(rawFallbackUrl);
  const response = await fetch(fallbackUrl, {
    redirect: "error",
    headers: { Accept: "application/json", Referer: DOLA_REFERER, "User-Agent": DOLA_USER_AGENT },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new DolaExtractionError(`Dola media resolver returned HTTP ${response.status}`);
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_FPLAY_JSON_BYTES) throw new DolaExtractionError("Dola media metadata is unexpectedly large");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_FPLAY_JSON_BYTES) throw new DolaExtractionError("Dola media metadata is unexpectedly large");
  let payload: unknown;
  try { payload = JSON.parse(buffer.toString("utf8")) as unknown; } catch { throw new DolaExtractionError("Dola returned invalid media metadata"); }
  return parseDolaFplayResponse(payload);
}

function findThreadTitle(payloads: unknown[]): string | null {
  for (const payload of payloads) {
    if (!Array.isArray(payload)) continue;
    for (const value of payload) {
      if (!isRecord(value)) continue;
      const data = isRecord(value.data) ? value.data : null;
      const shareInfo = data && isRecord(data.share_info) ? data.share_info : null;
      const title = stringValue(shareInfo?.share_name);
      if (title) return title;
    }
  }
  return null;
}

type ParsedDolaThread = { source: MediaSource; fallbackApis: Map<string, string> };

function parseDolaThread(html: string, originalUrl: string): ParsedDolaThread {
  const payloads = routePayloads(html);
  const videos = new Map<string, UnknownRecord>();
  for (const payload of payloads) collectVideos(payload, videos);
  const threadTitle = findThreadTitle(payloads);
  const items: MediaItem[] = [];
  const fallbackApis = new Map<string, string>();

  for (const [videoId, video] of videos) {
    const streams = streamsForVideo(video);
    if (streams.length === 0) continue;
    const index = items.length + 1;
    items.push({
      id: videoId,
      mediaType: "video",
      title: threadTitle ? `${threadTitle} ${index}` : `Dola 视频 ${index}`,
      cover: coverUrl(video),
      duration: numberValue(video.duration),
      streams
    });
    const fallbackApi = fallbackApiForVideo(video);
    if (fallbackApi) fallbackApis.set(videoId, fallbackApi);
  }

  if (items.length === 0) {
    throw new DolaExtractionError("No downloadable videos were found in this public Dola thread", "DOLA_NO_VIDEO");
  }
  return { source: { extractorId: "dola", originalUrl, title: threadTitle, items }, fallbackApis };
}

export function parseDolaThreadHtml(html: string, originalUrl: string): MediaSource {
  return parseDolaThread(html, originalUrl).source;
}

export class DolaExtractor implements SourceExtractor {
  readonly id = "dola";

  canHandle(url: URL): boolean {
    const allowedHost = url.hostname === "dola.com" || url.hostname === "www.dola.com";
    return url.protocol === "https:" && allowedHost && /^\/thread\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
  }

  async extract(url: URL): Promise<MediaSource> {
    if (!this.canHandle(url)) throw new DolaExtractionError("Invalid Dola thread URL", "INVALID_DOLA_URL");
    const canonicalUrl = new URL(url.toString());
    canonicalUrl.hostname = "www.dola.com";
    const response = await fetch(canonicalUrl, {
      redirect: "error",
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": DOLA_USER_AGENT },
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) throw new DolaExtractionError(`Dola returned HTTP ${response.status}`);
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_THREAD_HTML_BYTES) throw new DolaExtractionError("Dola thread page is unexpectedly large");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_THREAD_HTML_BYTES) throw new DolaExtractionError("Dola thread page is unexpectedly large");
    const parsed = parseDolaThread(buffer.toString("utf8"), url.toString());
    await Promise.all(parsed.source.items.map(async (item) => {
      const fallbackApi = parsed.fallbackApis.get(item.id);
      if (!fallbackApi) {
        throw new DolaExtractionError("Dola did not expose an original stream for one of the videos", "DOLA_CLEAN_SOURCE_UNAVAILABLE");
      }
      const cleanStreams = await resolveCleanStreams(fallbackApi);
      if (cleanStreams.length === 0) {
        throw new DolaExtractionError("Dola original video stream is temporarily unavailable", "DOLA_CLEAN_SOURCE_UNAVAILABLE");
      }
      item.streams = [...cleanStreams, ...item.streams];
    }));
    return parsed.source;
  }
}
