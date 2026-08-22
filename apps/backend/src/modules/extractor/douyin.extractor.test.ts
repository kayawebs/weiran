import assert from "node:assert/strict";
import test from "node:test";
import { douyinAwemeId, DouyinExtractor, parseDouyinAweme } from "./douyin.extractor.js";
import { generateDouyinABogus, generateDouyinMsToken } from "./douyin-signature.js";

test("recognizes Douyin short and full video links", () => {
  const extractor = new DouyinExtractor();
  assert.equal(extractor.canHandle(new URL("https://v.douyin.com/X_Bk1Ya5o9c/")), true);
  assert.equal(extractor.canHandle(new URL("https://www.douyin.com/video/7676688126286593201")), true);
  assert.equal(extractor.canHandle(new URL("https://example.com/video/7676688126286593201")), false);
  assert.equal(douyinAwemeId(new URL("https://www.douyin.com/video/7676688126286593201")), "7676688126286593201");
});

test("parses clean video qualities and original audio without using download_addr", () => {
  const source = parseDouyinAweme({
    aweme_id: "7676688126286593201",
    desc: "《剪狗后续》",
    author: { nickname: "一字马投奔熊仔" },
    video: {
      duration: 86_800,
      width: 1080,
      height: 1920,
      origin_cover: { url_list: ["https://p3-pc-sign.douyinpic.com/cover.jpeg"] },
      play_addr: { url_list: ["https://v26-web.douyinvod.com/clean-h264.mp4"] },
      download_addr: { url_list: ["https://v26-web.douyinvod.com/watermarked.mp4"] },
      bit_rate: [{
        bit_rate: 4_000_000,
        gear_name: "normal_2160_h265",
        play_addr: { width: 2160, height: 3840, url_list: ["https://v3-web.douyinvod.com/original-h265.mp4"] },
        video_extra: "h265"
      }]
    },
    music: {
      title: "剪狗后续原声",
      play_url: { url_list: ["https://lf9-music-east.douyinstatic.com/audio.mp3"] }
    }
  }, "https://v.douyin.com/X_Bk1Ya5o9c/");

  assert.equal(source.extractorId, "douyin");
  assert.equal(source.title, "《剪狗后续》 · 一字马投奔熊仔");
  assert.equal(source.items[0]?.duration, 86.8);
  assert.equal(source.items[0]?.cover, "https://p3-pc-sign.douyinpic.com/cover.jpeg");
  assert.equal(source.items[0]?.streams.length, 2);
  assert.equal(source.items[0]?.streams[0]?.url, "https://v26-web.douyinvod.com/clean-h264.mp4");
  assert.equal(source.items[0]?.streams.some((stream) => stream.url.includes("watermarked")), false);
  assert.equal(source.items[1]?.mediaType, "audio");
  assert.equal(source.items[1]?.streams[0]?.mimeType, "audio/mpeg");
});

test("generates correctly shaped Douyin request tokens", () => {
  assert.equal(generateDouyinMsToken().length, 107);
  const signature = generateDouyinABogus("device_platform=webapp&aid=6383&aweme_id=1", "Mozilla/5.0");
  assert.equal(signature.endsWith("="), true);
  assert.equal(signature.length > 100, true);
});
