import { createWriteStream } from "node:fs";
import { lookup } from "node:dns/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { isIP } from "node:net";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { env } from "../../config/env.js";

export class DownloadError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}

function isPrivateAddress(address: string): boolean {
  if (address === "::1" || address === "::" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:" )) return true;
  if (isIP(address) !== 4) return false;
  const [first, second] = address.split(".").map(Number);
  return first === 10 || first === 127 || first === 0 ||
    (first === 169 && second === 254) || (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new DownloadError("Only HTTPS source URLs are allowed", "UNSAFE_SOURCE_URL");
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some((record) => isPrivateAddress(record.address))) {
    throw new DownloadError("Private network source URLs are not allowed", "UNSAFE_SOURCE_URL");
  }
  return url;
}

export type DownloadedFile = { byteSize: number; mimeType: string };

export class DownloaderService {
  async downloadToFile(rawUrl: string, destination: string, requestHeaders: Record<string, string> = {}): Promise<DownloadedFile> {
    const url = await assertPublicHttpsUrl(rawUrl);
    const allowedHeaders = new Set(["accept", "origin", "referer", "user-agent"]);
    const headers = Object.fromEntries(Object.entries(requestHeaders).filter(([name]) => allowedHeaders.has(name.toLowerCase())));
    const response = await fetch(url, { redirect: "error", headers, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new DownloadError(`Source returned HTTP ${response.status}`, "SOURCE_DOWNLOAD_FAILED");
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > env.MAX_UPLOAD_BYTES) throw new DownloadError("Source media exceeds size limit", "SOURCE_TOO_LARGE");
    if (!response.body) throw new DownloadError("Source response body is empty", "SOURCE_DOWNLOAD_FAILED");

    let byteSize = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        byteSize += chunk.length;
        if (byteSize > env.MAX_UPLOAD_BYTES) callback(new DownloadError("Source media exceeds size limit", "SOURCE_TOO_LARGE"));
        else callback(null, chunk);
      }
    });
    await mkdir(dirname(destination), { recursive: true });
    await pipeline(Readable.fromWeb(response.body as never), limit, createWriteStream(destination));
    return { byteSize, mimeType: response.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream" };
  }
}
