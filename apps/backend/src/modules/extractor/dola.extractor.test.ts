import assert from "node:assert/strict";
import { createCipheriv, createHash } from "node:crypto";
import test from "node:test";
import { decryptDolaStreamUrl, parseDolaFplayResponse, parseDolaThreadHtml } from "./dola.extractor.js";

const salt = Buffer.from(
  "TdTC5rgxYgkOUrPHpnM7pByyRiuCmrWKGWs521cXdST0m69/COjWjSanLjfBqVovHwWlGJKu8pSXMrYqOKrdWA==",
  "base64"
);

function encodeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function encodedUrl(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function encryptFplayUrl(value: string, keySeed: string): string {
  const firstHash = createHash("sha512").update(Buffer.from(keySeed, "base64")).digest();
  const derived = createHash("sha512").update(Buffer.concat([firstHash, salt])).digest();
  const cipher = createCipheriv("aes-128-cbc", derived.subarray(0, 16), derived.subarray(16, 32));
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([Buffer.from([0xa8, 0x00, 0x01, 0x00]), ciphertext]).toString("base64url");
}

test("parses every video from a Dola thread router payload", () => {
  const firstCleanUrl = "https://v16-dola.dola.com/video/clean-first.mp4";
  const firstWatermarkedUrl = "https://v16-dola.dola.com/video/video_gen_watermark_dyn-first.mp4";
  const secondUrl = "https://v17-dola.dola.com/video/video_gen_watermark_dyn-second.mp4";
  const payload = [
    "/thread/test",
    {
      data: {
        share_info: { share_name: "测试 Thread" },
        message_snapshot: {
          content: {
            creation_block: {
              creations: [
                {
                  video: {
                    vid: "video-one",
                    width: 1080,
                    height: 1920,
                    duration: 4.2,
                    download_url: firstWatermarkedUrl,
                    cover: { image_preview: { url: "https://example.com/cover-one.jpg" } },
                    video_model: JSON.stringify({
                      video_list: {
                        origin: { definition: "source", vwidth: 1080, vheight: 1920, main_url: encodedUrl(firstCleanUrl) }
                      }
                    })
                  }
                },
                {
                  video: { vid: "video-two", duration: "5.5", download_url: secondUrl }
                }
              ]
            }
          }
        }
      }
    }
  ];
  const html = `<html><script data-fn-args="${encodeAttribute(JSON.stringify(payload))}"></script></html>`;

  const source = parseDolaThreadHtml(html, "https://www.dola.com/thread/test");

  assert.equal(source.extractorId, "dola");
  assert.equal(source.title, "测试 Thread");
  assert.equal(source.items.length, 2);
  assert.equal(source.items[0]?.title, "测试 Thread 1");
  assert.equal(source.items[0]?.streams[0]?.url, firstCleanUrl);
  assert.equal(source.items[0]?.streams[0]?.watermarked, false);
  assert.equal(source.items[0]?.streams[1]?.watermarked, true);
  assert.equal(source.items[1]?.duration, 5.5);
});

test("rejects router payloads without downloadable Dola videos", () => {
  const html = `<script data-fn-args="${encodeAttribute(JSON.stringify(["/thread/test", { data: {} }]))}"></script>`;
  assert.throws(
    () => parseDolaThreadHtml(html, "https://www.dola.com/thread/test"),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "DOLA_NO_VIDEO"
  );
});

test("decrypts and parses Dola original H.264 stream metadata", () => {
  const keySeed = Buffer.alloc(32, 7).toString("base64");
  const cleanUrl = "https://v19-dola.dola.com/original/video.mp4?a=489823";
  const encryptedUrl = encryptFplayUrl(cleanUrl, keySeed);

  assert.equal(decryptDolaStreamUrl(encryptedUrl, keySeed), cleanUrl);
  const streams = parseDolaFplayResponse({
    video_info: {
      data: {
        key_seed: keySeed,
        video_list: {
          video_1: {
            definition: "1080p",
            vwidth: 1280,
            vheight: 720,
            main_url: encryptedUrl
          }
        }
      }
    }
  });
  assert.equal(streams.length, 1);
  assert.equal(streams[0]?.url, cleanUrl);
  assert.equal(streams[0]?.watermarked, false);
  assert.equal(streams[0]?.quality, "1080p");
});
