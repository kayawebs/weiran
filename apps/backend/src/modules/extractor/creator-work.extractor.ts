import type { MediaSource, MediaStream, SourceExtractor } from "./source-extractor.js";

const MAX_PAGE_BYTES = 6 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const CREATOR_USER_AGENT = "Mozilla/5.0 (compatible; WeiranLab/1.0; +https://weiran.art/)";

type UnknownRecord = Record<string, unknown>;

export class CreatorWorkExtractionError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "SOURCE_RESOLVE_FAILED", statusCode = 422) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
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

function scriptJson(html: string): unknown[] {
  const payloads: unknown[] = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const attributes = match[1] ?? "";
    let raw = match[2]?.trim();
    if (!raw) continue;
    const isJsonScript = /\btype=(['"])application\/json\1/i.test(attributes);
    const routerAssignment = raw.match(/^window\._ROUTER_DATA\s*=\s*([\s\S]+?)\s*;?$/);
    if (routerAssignment) {
      const assignedJson = routerAssignment[1]?.trim();
      if (!assignedJson) continue;
      raw = assignedJson;
    }
    else if (!isJsonScript) continue;
    try { payloads.push(JSON.parse(raw) as unknown); } catch { /* unrelated JSON payload */ }
  }
  return payloads;
}

function findWork(value: unknown, depth = 0): UnknownRecord | null {
  if (depth > 24) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findWork(item, depth + 1);
      if (match) return match;
    }
    return null;
  }
  if (!isRecord(value)) return null;

  const video = isRecord(value.video) ? value.video : null;
  const originVideo = video && (isRecord(video.originVideo) ? video.originVideo : isRecord(video.origin_video) ? video.origin_video : null);
  if (originVideo && (stringValue(originVideo.videoUrl) || stringValue(originVideo.video_url))) return value;

  for (const child of Object.values(value)) {
    const match = findWork(child, depth + 1);
    if (match) return match;
  }
  return null;
}

function hostMatches(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

function safeHttpsUrl(rawUrl: string | null, allowedHosts: readonly string[]): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl.replace(/^http:/, "https:"));
    if (url.protocol !== "https:" || !allowedHosts.some((host) => hostMatches(url.hostname.toLowerCase(), host))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function videoStream(work: UnknownRecord, allowedMediaHosts: readonly string[], referer: string): MediaStream | null {
  const video = isRecord(work.video) ? work.video : null;
  const origin = video && (isRecord(video.originVideo) ? video.originVideo : isRecord(video.origin_video) ? video.origin_video : null);
  if (!origin) return null;
  const url = safeHttpsUrl(stringValue(origin.videoUrl) ?? stringValue(origin.video_url), allowedMediaHosts);
  if (!url) return null;
  return {
    url,
    mimeType: "video/mp4",
    quality: stringValue(origin.definition) ?? "source",
    width: numberValue(origin.width) ?? undefined,
    height: numberValue(origin.height) ?? undefined,
    requestHeaders: { Referer: referer, "User-Agent": CREATOR_USER_AGENT },
    watermarked: false
  };
}

export type CreatorWorkParserOptions = {
  extractorId: string;
  platformName: string;
  allowedMediaHosts: readonly string[];
  referer: string;
};

export function parseCreatorWorkHtml(html: string, originalUrl: string, options: CreatorWorkParserOptions): MediaSource {
  let work: UnknownRecord | null = null;
  for (const payload of scriptJson(html)) {
    work = findWork(payload);
    if (work) break;
  }
  if (!work) throw new CreatorWorkExtractionError(`${options.platformName} did not expose public work metadata`, "SOURCE_NO_VIDEO", 404);

  const stream = videoStream(work, options.allowedMediaHosts, options.referer);
  if (!stream) throw new CreatorWorkExtractionError(`${options.platformName} did not expose a clean source video`, "CLEAN_SOURCE_UNAVAILABLE");

  const common = isRecord(work.commonAttr) ? work.commonAttr : isRecord(work.common_attr) ? work.common_attr : null;
  const author = isRecord(work.author) ? work.author : null;
  const video = isRecord(work.video) ? work.video : null;
  const id = stringValue(common?.id)
    ?? stringValue(common?.publishedItemId)
    ?? stringValue(common?.published_item_id)
    ?? stringValue(video?.videoId)
    ?? stringValue(video?.video_id)
    ?? "video-1";
  const title = stringValue(common?.title) ?? stringValue(work.title) ?? `${options.platformName} video`;
  const cover = safeHttpsUrl(
    stringValue(common?.coverUrl) ?? stringValue(common?.cover_url) ?? stringValue(video?.coverUrl) ?? stringValue(video?.cover_url),
    options.allowedMediaHosts
  );
  const duration = numberValue(video?.duration)
    ?? ((numberValue(video?.durationMs) ?? numberValue(video?.duration_ms)) != null
      ? (numberValue(video?.durationMs) ?? numberValue(video?.duration_ms))! / 1000
      : null);
  const creator = stringValue(author?.name) ?? stringValue(author?.nickname);

  return {
    extractorId: options.extractorId,
    originalUrl,
    title: creator ? `${title} · ${creator}` : title,
    items: [{ id, mediaType: "video", title, cover, duration, streams: [stream] }]
  };
}

type CreatorWorkExtractorOptions = CreatorWorkParserOptions & {
  sourceHosts: readonly string[];
  sourcePath: RegExp;
};

export class CreatorWorkExtractor implements SourceExtractor {
  readonly id: string;

  constructor(private readonly options: CreatorWorkExtractorOptions) {
    this.id = options.extractorId;
  }

  canHandle(url: URL): boolean {
    return url.protocol === "https:"
      && this.options.sourceHosts.some((host) => hostMatches(url.hostname.toLowerCase(), host))
      && this.options.sourcePath.test(url.pathname);
  }

  private sourceHostAllowed(url: URL): boolean {
    return url.protocol === "https:" && this.options.sourceHosts.some((host) => hostMatches(url.hostname.toLowerCase(), host));
  }

  async extract(url: URL): Promise<MediaSource> {
    if (!this.canHandle(url)) throw new CreatorWorkExtractionError(`Invalid ${this.options.platformName} share URL`, "INVALID_SOURCE_URL");
    let current = new URL(url.toString());
    let response: Response | null = null;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      response = await fetch(current, {
        redirect: "manual",
        headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": CREATOR_USER_AGENT },
        signal: AbortSignal.timeout(20_000)
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      void response.body?.cancel();
      if (!location) throw new CreatorWorkExtractionError(`${this.options.platformName} returned an invalid redirect`);
      current = new URL(location, current);
      if (!this.sourceHostAllowed(current)) throw new CreatorWorkExtractionError(`${this.options.platformName} redirected to an unsupported host`, "INVALID_SOURCE_URL");
      response = null;
    }

    if (!response) throw new CreatorWorkExtractionError(`${this.options.platformName} redirected too many times`);
    if (!response.ok) throw new CreatorWorkExtractionError(`${this.options.platformName} returned HTTP ${response.status}`);
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_PAGE_BYTES) throw new CreatorWorkExtractionError(`${this.options.platformName} page is unexpectedly large`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_PAGE_BYTES) throw new CreatorWorkExtractionError(`${this.options.platformName} page is unexpectedly large`);
    return parseCreatorWorkHtml(buffer.toString("utf8"), url.toString(), this.options);
  }
}

const sharedByteDanceMediaHosts = [
  "capcut.com",
  "tiktokcdn.com",
  "ibyteimg.com",
  "byteimg.com",
  "byteicdn.com",
  "douyinvod.com",
  "douyinpic.com",
  "365yg.com",
  "vlabvod.com",
  "jianying.com"
] as const;

export class DreaminaExtractor extends CreatorWorkExtractor {
  constructor() {
    super({
      extractorId: "dreamina",
      platformName: "Dreamina",
      sourceHosts: ["dreamina.capcut.com"],
      sourcePath: /^\/ai-tool\/work-detail\/[A-Za-z0-9_-]+\/?$/,
      allowedMediaHosts: sharedByteDanceMediaHosts,
      referer: "https://dreamina.capcut.com/"
    });
  }
}

export class JimengExtractor extends CreatorWorkExtractor {
  constructor() {
    super({
      extractorId: "jimeng",
      platformName: "Jimeng",
      sourceHosts: ["jimeng.jianying.com"],
      sourcePath: /^(?:\/s\/[A-Za-z0-9_-]+|\/ai-tool\/work-detail\/[A-Za-z0-9_-]+)\/?$/,
      allowedMediaHosts: sharedByteDanceMediaHosts,
      referer: "https://jimeng.jianying.com/"
    });
  }
}
