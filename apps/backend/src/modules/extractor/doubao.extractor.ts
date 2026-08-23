import { decryptByteDanceFplayUrl } from "./bytedance-fplay.js";
import type { MediaItem, MediaSource, MediaStream, SourceExtractor } from "./source-extractor.js";

const MAX_THREAD_HTML_BYTES = 6 * 1024 * 1024;
const MAX_FPLAY_JSON_BYTES = 1024 * 1024;
const DOUBAO_REFERER = "https://www.doubao.com/";
const DOUBAO_USER_AGENT = "Mozilla/5.0 (compatible; WeiranLab/1.0; +https://weiran.art)";

type UnknownRecord = Record<string, unknown>;
type VideoCandidate = { video: UnknownRecord; title: string | null };

export class DoubaoExtractionError extends Error {
  readonly code: string;

  constructor(message: string, code = "DOUBAO_EXTRACTION_FAILED") {
    super(message);
    this.code = code;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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
    try { payloads.push(JSON.parse(decodeHtmlAttribute(raw)) as unknown); } catch { /* unrelated payload */ }
  }
  return payloads;
}

function looksLikeVideo(value: UnknownRecord): boolean {
  return typeof value.vid === "string" && value.video_model !== undefined;
}

function collectCandidates(value: unknown, output: Map<string, VideoCandidate>, depth = 0): void {
  if (depth > 28) return;
  const parsed = parseJson(value);
  if (parsed !== value) return collectCandidates(parsed, output, depth + 1);
  if (Array.isArray(parsed)) {
    for (const item of parsed) collectCandidates(item, output, depth + 1);
    return;
  }
  if (!isRecord(parsed)) return;

  const result = isRecord(parsed.result) ? parsed.result : null;
  const resultVideo = result && isRecord(result.video) ? result.video : null;
  const contextualTitle = stringValue(parsed.creation_prompt) ?? stringValue(parsed.prompt);
  if (resultVideo && looksLikeVideo(resultVideo)) {
    output.set(String(resultVideo.vid), { video: resultVideo, title: contextualTitle });
  }
  if (looksLikeVideo(parsed)) {
    const id = String(parsed.vid);
    const existing = output.get(id);
    if (!existing) output.set(id, { video: parsed, title: null });
  }
  for (const child of Object.values(parsed)) collectCandidates(child, output, depth + 1);
}

function nestedImageUrl(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return stringValue(value.url)
    ?? nestedImageUrl(value.image_thumb)
    ?? nestedImageUrl(value.image_preview)
    ?? nestedImageUrl(value.image_large);
}

function safeCoverUrl(video: UnknownRecord): string | null {
  const raw = nestedImageUrl(video.cover_image) ?? nestedImageUrl(video.cover);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const allowedHost = url.hostname === "byteimg.com"
      || url.hostname.endsWith(".byteimg.com")
      || url.hostname === "douyinpic.com"
      || url.hostname.endsWith(".douyinpic.com");
    return url.protocol === "https:" && allowedHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function fallbackApiForVideo(video: UnknownRecord): string | null {
  const model = parseJson(video.video_model);
  return isRecord(model) ? stringValue(model.fallback_api) : null;
}

function cleanFallbackUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  const allowedHost = /^vas-[a-z0-9-]+\.snssdk\.com$/i.test(url.hostname);
  const allowedPath = /^\/video\/fplay\/1\/[0-9a-f]{32}\/v[A-Za-z0-9]+$/i.test(url.pathname);
  if (url.protocol !== "https:" || !allowedHost || !allowedPath) {
    throw new DoubaoExtractionError("Doubao returned an unsafe media resolver URL");
  }
  url.searchParams.set("codec_type", "0");
  url.searchParams.delete("logo_type");
  return url;
}

function normalizeMediaUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const allowedHost = /^v\d+(?:-[a-z0-9]+)*\.douyin\.com$/i.test(url.hostname)
      || /(^|\.)douyinvod\.com$/i.test(url.hostname);
    const watermarkMarker = `${url.pathname} ${url.search}`.toLowerCase();
    if (url.protocol !== "https:" || !allowedHost || /watermark|logo_type/.test(watermarkMarker)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseFplayResponse(payload: unknown): MediaStream[] {
  const root = isRecord(payload) ? payload : null;
  const videoInfo = root && isRecord(root.video_info) ? root.video_info : null;
  const data = videoInfo && isRecord(videoInfo.data) ? videoInfo.data : null;
  const keySeed = stringValue(data?.key_seed);
  const videoList = data && isRecord(data.video_list) ? data.video_list : null;
  if (!keySeed || !videoList) throw new DoubaoExtractionError("Doubao did not return original video metadata");

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
      let decrypted: string;
      try { decrypted = decryptByteDanceFplayUrl(encoded, keySeed); } catch { continue; }
      const url = normalizeMediaUrl(decrypted);
      if (!url) continue;
      streams.push({
        url,
        mimeType: "video/mp4",
        quality: attributes.quality,
        width: attributes.width,
        height: attributes.height,
        requestHeaders: { Referer: DOUBAO_REFERER, "User-Agent": DOUBAO_USER_AGENT },
        watermarked: false
      });
    }
  }
  return [...new Map(streams.map((stream) => [stream.url, stream])).values()];
}

async function resolveCleanStreams(rawFallbackUrl: string): Promise<MediaStream[]> {
  const fallbackUrl = cleanFallbackUrl(rawFallbackUrl);
  const response = await fetch(fallbackUrl, {
    redirect: "error",
    headers: { Accept: "application/json", Referer: DOUBAO_REFERER, "User-Agent": DOUBAO_USER_AGENT },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new DoubaoExtractionError(`Doubao media resolver returned HTTP ${response.status}`);
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_FPLAY_JSON_BYTES) throw new DoubaoExtractionError("Doubao media metadata is unexpectedly large");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_FPLAY_JSON_BYTES) throw new DoubaoExtractionError("Doubao media metadata is unexpectedly large");
  let payload: unknown;
  try { payload = JSON.parse(buffer.toString("utf8")) as unknown; } catch { throw new DoubaoExtractionError("Doubao returned invalid media metadata"); }
  return parseFplayResponse(payload);
}

type ParsedDoubaoThread = { source: MediaSource; fallbackApis: Map<string, string> };

function parseDoubaoThread(html: string, originalUrl: string): ParsedDoubaoThread {
  const candidates = new Map<string, VideoCandidate>();
  for (const payload of routePayloads(html)) collectCandidates(payload, candidates);

  const items: MediaItem[] = [];
  const fallbackApis = new Map<string, string>();
  for (const [videoId, candidate] of candidates) {
    const fallbackApi = fallbackApiForVideo(candidate.video);
    if (!fallbackApi) continue;
    const index = items.length + 1;
    items.push({
      id: videoId,
      mediaType: "video",
      title: candidate.title ?? `Doubao 视频 ${index}`,
      cover: safeCoverUrl(candidate.video),
      duration: numberValue(candidate.video.duration),
      streams: []
    });
    fallbackApis.set(videoId, fallbackApi);
  }
  if (items.length === 0) {
    throw new DoubaoExtractionError("No downloadable videos were found in this public Doubao thread", "DOUBAO_NO_VIDEO");
  }
  return {
    source: { extractorId: "doubao", originalUrl, title: items[0]?.title ?? null, items },
    fallbackApis
  };
}

export function parseDoubaoThreadHtml(html: string, originalUrl: string): MediaSource {
  return parseDoubaoThread(html, originalUrl).source;
}

export class DoubaoExtractor implements SourceExtractor {
  readonly id = "doubao";

  canHandle(url: URL): boolean {
    const allowedHost = url.hostname === "doubao.com" || url.hostname === "www.doubao.com";
    return url.protocol === "https:" && allowedHost && /^\/thread\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
  }

  async extract(url: URL): Promise<MediaSource> {
    if (!this.canHandle(url)) throw new DoubaoExtractionError("Invalid Doubao thread URL", "INVALID_DOUBAO_URL");
    const canonicalUrl = new URL(url.toString());
    canonicalUrl.hostname = "www.doubao.com";
    const response = await fetch(canonicalUrl, {
      redirect: "error",
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": DOUBAO_USER_AGENT },
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) throw new DoubaoExtractionError(`Doubao returned HTTP ${response.status}`);
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_THREAD_HTML_BYTES) throw new DoubaoExtractionError("Doubao thread page is unexpectedly large");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_THREAD_HTML_BYTES) throw new DoubaoExtractionError("Doubao thread page is unexpectedly large");
    const parsed = parseDoubaoThread(buffer.toString("utf8"), url.toString());
    await Promise.all(parsed.source.items.map(async (item) => {
      const fallbackApi = parsed.fallbackApis.get(item.id);
      if (!fallbackApi) throw new DoubaoExtractionError("Doubao did not expose an original video stream", "DOUBAO_CLEAN_SOURCE_UNAVAILABLE");
      const cleanStreams = await resolveCleanStreams(fallbackApi);
      if (cleanStreams.length === 0) throw new DoubaoExtractionError("Doubao original video stream is temporarily unavailable", "DOUBAO_CLEAN_SOURCE_UNAVAILABLE");
      item.streams = cleanStreams;
    }));
    return parsed.source;
  }
}
