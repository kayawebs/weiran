import assert from "node:assert/strict";
import test from "node:test";
import { DreaminaExtractor, JimengExtractor, parseCreatorWorkHtml } from "./creator-work.extractor.js";

function pageHtml(videoUrl = "https://v16-cc.capcut.com/source/video.mp4?download=1"): string {
  const payload = {
    loaderData: {
      "ai-tool/work-detail/(id$)/page": {
        workDetail: {
          ok: true,
          value: {
            commonAttr: {
              id: "7622480873543273744",
              title: "Ice apocalypse",
              coverUrl: "https://p16-common-sign.tiktokcdn.com/cover.webp"
            },
            author: { name: "creator" },
            video: {
              duration: 15.07,
              videoId: "v-test",
              originVideo: {
                width: 1470,
                height: 630,
                definition: "origin",
                videoUrl
              }
            }
          }
        }
      }
    }
  };
  return `<html><body><script type="application/json" id="__MODERN_ROUTER_DATA__">${JSON.stringify(payload)}</script></body></html>`;
}

function jimengPageHtml(): string {
  const payload = {
    loaderData: {
      "ai-tool/work-detail/(id$)/page": {
        workDetail: {
          ok: true,
          value: {
            commonAttr: { id: "7609030194833263881", coverUrl: "https://p11-dreamina-sign.byteimg.com/cover.jpeg" },
            video: {
              duration: 10,
              originVideo: {
                width: 720,
                height: 1280,
                definition: "origin",
                videoUrl: "https://v3-artist.vlabvod.com/video/source.mp4"
              }
            }
          }
        }
      }
    }
  };
  return `<html><body><script nonce="argus">window._ROUTER_DATA = ${JSON.stringify(payload)}</script></body></html>`;
}

test("parses a Dreamina work-detail origin video", () => {
  const source = parseCreatorWorkHtml(pageHtml(), "https://dreamina.capcut.com/ai-tool/work-detail/7622480873543273744", {
    extractorId: "dreamina",
    platformName: "Dreamina",
    allowedMediaHosts: ["capcut.com", "tiktokcdn.com"],
    referer: "https://dreamina.capcut.com/"
  });

  assert.equal(source.extractorId, "dreamina");
  assert.equal(source.title, "Ice apocalypse · creator");
  assert.equal(source.items.length, 1);
  assert.equal(source.items[0]?.duration, 15.07);
  assert.equal(source.items[0]?.cover, "https://p16-common-sign.tiktokcdn.com/cover.webp");
  assert.deepEqual(source.items[0]?.streams[0], {
    url: "https://v16-cc.capcut.com/source/video.mp4?download=1",
    mimeType: "video/mp4",
    quality: "origin",
    width: 1470,
    height: 630,
    requestHeaders: {
      Referer: "https://dreamina.capcut.com/",
      "User-Agent": "Mozilla/5.0 (compatible; WeiranLab/1.0; +https://weiran.art/)"
    },
    watermarked: false
  });
});

test("rejects media hosts outside the platform allow-list", () => {
  assert.throws(
    () => parseCreatorWorkHtml(pageHtml("https://example.com/video.mp4"), "https://dreamina.capcut.com/ai-tool/work-detail/1", {
      extractorId: "dreamina",
      platformName: "Dreamina",
      allowedMediaHosts: ["capcut.com"],
      referer: "https://dreamina.capcut.com/"
    }),
    (error: unknown) => (error as { code?: string }).code === "CLEAN_SOURCE_UNAVAILABLE"
  );
});

test("parses Jimeng window._ROUTER_DATA without executing inline JavaScript", () => {
  const source = parseCreatorWorkHtml(jimengPageHtml(), "https://jimeng.jianying.com/ai-tool/work-detail/7609030194833263881", {
    extractorId: "jimeng",
    platformName: "Jimeng",
    allowedMediaHosts: ["byteimg.com", "vlabvod.com"],
    referer: "https://jimeng.jianying.com/"
  });

  assert.equal(source.items.length, 1);
  assert.equal(source.items[0]?.duration, 10);
  assert.equal(source.items[0]?.streams[0]?.url, "https://v3-artist.vlabvod.com/video/source.mp4");
  assert.equal(source.items[0]?.streams[0]?.watermarked, false);
});

test("matches only supported Dreamina and Jimeng public URLs", () => {
  const dreamina = new DreaminaExtractor();
  const jimeng = new JimengExtractor();

  assert.equal(dreamina.canHandle(new URL("https://dreamina.capcut.com/ai-tool/work-detail/7622480873543273744?isShared=1")), true);
  assert.equal(dreamina.canHandle(new URL("https://example.com/ai-tool/work-detail/7622480873543273744")), false);
  assert.equal(jimeng.canHandle(new URL("https://jimeng.jianying.com/s/abcDEF123/")), true);
  assert.equal(jimeng.canHandle(new URL("https://jimeng.jianying.com/ai-tool/work-detail/123456")), true);
  assert.equal(jimeng.canHandle(new URL("http://jimeng.jianying.com/s/abcDEF123")), false);
});
