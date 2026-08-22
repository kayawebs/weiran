import type { MediaItem, MediaSource, MediaStream, SourceExtractor } from "./source-extractor.js";
import { generateDouyinABogus, generateDouyinMsToken } from "./douyin-signature.js";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
const SOURCE_HOSTS = ["douyin.com", "v.douyin.com", "iesdouyin.com"] as const;
const MEDIA_HOSTS = ["douyinvod.com", "douyinpic.com", "douyinstatic.com", "byteimg.com"] as const;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 8;

type UnknownRecord = Record<string, unknown>;

export class DouyinExtractionError extends Error {
  readonly statusCode: number;

  constructor(message: string, readonly code = "DOUYIN_EXTRACTION_FAILED", statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hostMatches(hostname: string, expected: string): boolean {
  return hostname === expected || hostname.endsWith(`.${expected}`);
}

function sourceHostAllowed(url: URL): boolean {
  return url.protocol === "https:" && SOURCE_HOSTS.some((host) => hostMatches(url.hostname.toLowerCase(), host));
}

function safeMediaUrl(rawValue: unknown): string | null {
  const raw = text(rawValue).replace(/^http:\/\//i, "https://");
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || /playwm/i.test(url.pathname)) return null;
    const hostname = url.hostname.toLowerCase();
    const cdnAllowed = MEDIA_HOSTS.some((host) => hostMatches(hostname, host));
    const officialPlayEndpoint = hostMatches(hostname, "douyin.com") && /^\/aweme\/v1\/play\/?$/.test(url.pathname);
    const legacyPlayEndpoint = hostMatches(hostname, "snssdk.com") && /^\/aweme\/v1\/play\/?$/.test(url.pathname);
    if (!cdnAllowed && !officialPlayEndpoint && !legacyPlayEndpoint) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function urlList(value: unknown): string[] {
  if (typeof value === "string") {
    const url = safeMediaUrl(value);
    return url ? [url] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((candidate) => {
      if (typeof candidate === "string") return safeMediaUrl(candidate) ?? [];
      const source = record(candidate);
      return safeMediaUrl(source.src) ?? [];
    });
  }
  const source = record(value);
  const candidates = list(source.url_list).length > 0 ? list(source.url_list) : list(source.urlList);
  return candidates.flatMap((candidate) => {
    if (typeof candidate === "string") return safeMediaUrl(candidate) ?? [];
    return safeMediaUrl(record(candidate).src) ?? [];
  });
}

function preferredMediaUrl(value: unknown): string | null {
  const candidates = urlList(value);
  if (candidates.length === 0) return null;
  return candidates.find((candidate) => {
    const hostname = new URL(candidate).hostname;
    return /^(?:v\d+|v3)-web\./i.test(hostname);
  }) ?? candidates[0] ?? null;
}

function firstPreferredMediaUrl(...values: unknown[]): string | null {
  for (const value of values) {
    const url = preferredMediaUrl(value);
    if (url) return url;
  }
  return null;
}

function playUrlFromUri(value: unknown): string | null {
  const uri = text(value).trim();
  if (!/^[A-Za-z0-9._~-]{8,200}$/.test(uri)) return null;
  return `https://aweme.snssdk.com/aweme/v1/play/?video_id=${encodeURIComponent(uri)}&ratio=1080p&line=0`;
}

function coverUrl(detail: UnknownRecord): string | null {
  const video = record(detail.video);
  for (const candidate of [video.origin_cover, video.cover, video.dynamic_cover, detail.cover]) {
    const url = preferredMediaUrl(candidate);
    if (url) return url;
  }
  return null;
}

function qualityFromDimensions(width: number | null, height: number | null): string {
  const shortEdge = width && height ? Math.min(width, height) : height ?? width;
  return shortEdge ? `${shortEdge}p` : "source";
}

function videoHeaders(awemeId: string): Record<string, string> {
  return {
    Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
    Origin: "https://www.douyin.com",
    Referer: `https://www.douyin.com/video/${awemeId}`,
    "User-Agent": USER_AGENT
  };
}

function streamKey(stream: MediaStream): string {
  try {
    const url = new URL(stream.url);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return stream.url;
  }
}

function parseVideoStreams(detail: UnknownRecord, awemeId: string): MediaStream[] {
  const video = record(detail.video);
  const videoWidth = finiteNumber(video.width);
  const videoHeight = finiteNumber(video.height);
  const primaryAddress = record(video.play_addr);
  const primaryUrl = firstPreferredMediaUrl(
    video.play_addr_h264,
    video.play_addr,
    video.playAddr,
    video.playApi
  ) ?? playUrlFromUri(primaryAddress.uri ?? video.uri);
  const streams: MediaStream[] = [];

  if (primaryUrl) {
    streams.push({
      url: primaryUrl,
      mimeType: "video/mp4",
      quality: "source",
      label: "HD · H.264",
      width: videoWidth ?? undefined,
      height: videoHeight ?? undefined,
      requestHeaders: videoHeaders(awemeId),
      watermarked: false
    });
  }

  const bitrateSource = list(video.bit_rate).length > 0 ? list(video.bit_rate) : list(video.bitRateList);
  const bitrateItems = bitrateSource.map(record).sort((left, right) =>
    (finiteNumber(right.bit_rate) ?? 0) - (finiteNumber(left.bit_rate) ?? 0));
  for (const bitrate of bitrateItems) {
    const playAddress = record(bitrate.play_addr);
    const url = firstPreferredMediaUrl(bitrate.play_addr, bitrate.playAddr)
      ?? playUrlFromUri(playAddress.uri ?? bitrate.uri);
    if (!url) continue;
    const width = finiteNumber(playAddress.width) ?? finiteNumber(bitrate.width) ?? videoWidth;
    const height = finiteNumber(playAddress.height) ?? finiteNumber(bitrate.height) ?? videoHeight;
    const gear = text(bitrate.gear_name).toLowerCase();
    const format = `${text(bitrate.format)} ${text(bitrate.video_extra)}`.toLowerCase();
    const codec = format.includes("265") || gear.includes("h265") ? "H.265" : "H.264";
    streams.push({
      url,
      mimeType: "video/mp4",
      quality: qualityFromDimensions(width, height),
      label: `${qualityFromDimensions(width, height).toUpperCase()} · ${codec}`,
      width: width ?? undefined,
      height: height ?? undefined,
      requestHeaders: videoHeaders(awemeId),
      watermarked: false
    });
  }

  const h265Url = preferredMediaUrl(video.play_addr_265);
  if (h265Url) {
    const address = record(video.play_addr_265);
    const width = finiteNumber(address.width) ?? videoWidth;
    const height = finiteNumber(address.height) ?? videoHeight;
    streams.push({
      url: h265Url,
      mimeType: "video/mp4",
      quality: qualityFromDimensions(width, height),
      label: `${qualityFromDimensions(width, height).toUpperCase()} · H.265`,
      width: width ?? undefined,
      height: height ?? undefined,
      requestHeaders: videoHeaders(awemeId),
      watermarked: false
    });
  }

  const unique = new Map<string, MediaStream>();
  for (const stream of streams) {
    const key = streamKey(stream);
    if (!unique.has(key)) unique.set(key, stream);
  }
  return [...unique.values()].slice(0, 4);
}

export function parseDouyinAweme(detailValue: unknown, originalUrl: string, fallbackId?: string): MediaSource {
  const detail = record(detailValue);
  const awemeId = text(detail.aweme_id) || fallbackId || "";
  const title = text(detail.desc).trim() || "Douyin video";
  const author = record(detail.author);
  const authorName = text(author.nickname).trim();
  const video = record(detail.video);
  const durationMilliseconds = finiteNumber(video.duration);
  const duration = durationMilliseconds == null ? null : durationMilliseconds / 1000;
  const cover = coverUrl(detail);
  const streams = parseVideoStreams(detail, awemeId);
  if (!awemeId || streams.length === 0) {
    throw new DouyinExtractionError("No clean public Douyin video stream was found", "DOUYIN_NO_VIDEO", 404);
  }

  const items: MediaItem[] = [{
    id: awemeId,
    mediaType: "video",
    title,
    cover,
    duration,
    streams
  }];

  const music = record(detail.music);
  const audioUrl = preferredMediaUrl(music.play_url);
  if (audioUrl) {
    items.push({
      id: `${awemeId}-audio`,
      mediaType: "audio",
      title: text(music.title).trim() || "Original audio",
      cover,
      duration,
      streams: [{
        url: audioUrl,
        mimeType: "audio/mpeg",
        quality: "audio",
        label: "Audio MP3",
        requestHeaders: videoHeaders(awemeId),
        watermarked: false
      }]
    });
  }

  return {
    extractorId: "douyin",
    originalUrl,
    title: authorName ? `${title} · ${authorName}` : title,
    items
  };
}

export function douyinAwemeId(url: URL): string | null {
  for (const key of ["aweme_id", "modal_id", "vid", "id"]) {
    const value = url.searchParams.get(key);
    if (value && /^\d{10,24}$/.test(value)) return value;
  }
  const match = url.pathname.match(/\/(?:video|share\/video)\/(\d{10,24})(?:\/|$)/);
  return match?.[1] ?? null;
}

async function resolveShareUrl(startUrl: URL): Promise<URL> {
  let current = new URL(startUrl);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (!sourceHostAllowed(current)) {
      throw new DouyinExtractionError("Douyin redirected to an unsupported host", "INVALID_SOURCE_URL", 422);
    }
    if (douyinAwemeId(current)) return current;
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "User-Agent": USER_AGENT
      },
      signal: AbortSignal.timeout(15_000)
    });
    if (!REDIRECT_STATUSES.has(response.status)) {
      void response.body?.cancel();
      throw new DouyinExtractionError("The Douyin share link did not resolve to a public video", "INVALID_SOURCE_URL", 422);
    }
    const location = response.headers.get("location");
    void response.body?.cancel();
    if (!location) throw new DouyinExtractionError("Douyin returned an invalid redirect");
    current = new URL(location, current);
  }
  throw new DouyinExtractionError("The Douyin share link redirected too many times");
}

function browserHeaders(referer: string): Record<string, string> {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    Referer: referer,
    "User-Agent": USER_AGENT,
    "Sec-CH-UA": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin"
  };
}

async function getTtwid(): Promise<string | null> {
  try {
    const response = await fetch("https://ttwid.bytedance.com/ttwid/union/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({
        region: "cn",
        aid: 6383,
        need_t: 1,
        service: "www.douyin.com",
        migrate_priority: 0,
        cb_url_protocol: "https",
        domain: ".douyin.com"
      }),
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) return null;
    const match = (response.headers.get("set-cookie") ?? "").match(/(?:^|,\s*)ttwid=([^;\s]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function fetchAwemeDetail(awemeId: string): Promise<unknown> {
  const referer = `https://www.douyin.com/video/${awemeId}?previous_page=web_code_link`;
  try {
    const warmup = await fetch(referer, { headers: browserHeaders(referer), signal: AbortSignal.timeout(12_000) });
    void warmup.body?.cancel();
  } catch {
    // The signed detail API may still succeed when the optional warm-up is blocked.
  }

  let failure = "Douyin did not return public video metadata";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ttwid = await getTtwid();
    const search = new URLSearchParams({
      device_platform: "webapp",
      aid: "6383",
      channel: "channel_pc_web",
      aweme_id: awemeId,
      msToken: generateDouyinMsToken()
    });
    const query = search.toString();
    const apiUrl = `https://www.douyin.com/aweme/v1/web/aweme/detail/?${query}&a_bogus=${encodeURIComponent(generateDouyinABogus(query, USER_AGENT))}`;
    try {
      const headers = browserHeaders(referer);
      if (ttwid) headers.Cookie = `ttwid=${ttwid}`;
      const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(20_000) });
      if (!response.ok) {
        failure = `Douyin detail request returned HTTP ${response.status}`;
        continue;
      }
      const payload = await response.json() as UnknownRecord;
      if (record(payload).aweme_detail) return record(payload).aweme_detail;
      const statusMessage = text(record(payload).status_msg);
      failure = statusMessage || `Douyin detail response did not include a public item (status ${text(record(payload).status_code) || "unknown"})`;
    } catch (error) {
      failure = error instanceof Error ? error.message : failure;
    }
  }
  throw new DouyinExtractionError(failure);
}

export class DouyinExtractor implements SourceExtractor {
  readonly id = "douyin";

  canHandle(url: URL): boolean {
    return sourceHostAllowed(url);
  }

  async extract(url: URL): Promise<MediaSource> {
    if (!this.canHandle(url)) throw new DouyinExtractionError("Invalid Douyin URL", "INVALID_SOURCE_URL", 422);
    const resolved = await resolveShareUrl(url);
    const awemeId = douyinAwemeId(resolved);
    if (!awemeId) throw new DouyinExtractionError("The Douyin video ID could not be identified", "INVALID_SOURCE_URL", 422);
    const detail = await fetchAwemeDetail(awemeId);
    return parseDouyinAweme(detail, url.toString(), awemeId);
  }
}
