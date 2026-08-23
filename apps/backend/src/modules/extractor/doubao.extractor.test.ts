import assert from "node:assert/strict";
import test from "node:test";
import { DoubaoExtractor, parseDoubaoThreadHtml } from "./doubao.extractor.js";

function encodeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function threadHtml(payload: unknown): string {
  return `<html><script data-fn-args="${encodeAttribute(JSON.stringify(payload))}"></script></html>`;
}

test("parses generated videos and prompts from a Doubao thread payload", () => {
  const videoModel = JSON.stringify({
    fallback_api: "https://vas-lf-x.snssdk.com/video/fplay/1/47028cd55512217df3cb8dcb15db6f23/v0369cg10004da5414i7dld6uj8id70g?codec_type=5&logo_type=video_gen_watermark_dyn"
  });
  const payload = ["/thread/test", [{
    routerDataFnArgs: [JSON.stringify({
      data: {
        message_snapshot: {
          message_list: [{
            ext: {
              creation_material_info: JSON.stringify({
                material: {
                  creation_prompt: "安静的夏日窗景",
                  result: {
                    video: {
                      vid: "v0369cg10004da5414i7dld6uj8id70g",
                      duration: 10.08,
                      video_model: videoModel,
                      cover_image: {
                        image_thumb: { url: "https://p11-flow-imagex-sign.byteimg.com/cover.png" }
                      }
                    }
                  }
                }
              })
            }
          }]
        }
      }
    })]
  }]];

  const source = parseDoubaoThreadHtml(threadHtml(payload), "https://www.doubao.com/thread/test");

  assert.equal(source.extractorId, "doubao");
  assert.equal(source.title, "安静的夏日窗景");
  assert.equal(source.items.length, 1);
  assert.equal(source.items[0]?.id, "v0369cg10004da5414i7dld6uj8id70g");
  assert.equal(source.items[0]?.title, "安静的夏日窗景");
  assert.equal(source.items[0]?.duration, 10.08);
  assert.equal(source.items[0]?.cover, "https://p11-flow-imagex-sign.byteimg.com/cover.png");
  assert.deepEqual(source.items[0]?.streams, []);
});

test("rejects Doubao thread payloads without resolvable generated videos", () => {
  const html = threadHtml(["/thread/test", { data: { message_snapshot: {} } }]);
  assert.throws(
    () => parseDoubaoThreadHtml(html, "https://www.doubao.com/thread/test"),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "DOUBAO_NO_VIDEO"
  );
});

test("only handles public Doubao thread URLs", () => {
  const extractor = new DoubaoExtractor();
  assert.equal(extractor.canHandle(new URL("https://www.doubao.com/thread/xDwHsY4OBRM5w2xCe")), true);
  assert.equal(extractor.canHandle(new URL("https://www.doubao.com/chat/123")), false);
  assert.equal(extractor.canHandle(new URL("https://example.com/thread/xDwHsY4OBRM5w2xCe")), false);
});
