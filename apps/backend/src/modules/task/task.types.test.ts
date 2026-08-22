import assert from "node:assert/strict";
import test from "node:test";
import { createTaskSchema } from "./task.types.js";

test("accepts a public Dola thread task", () => {
  const value = createTaskSchema.parse({
    taskType: "VIDEO_WATERMARK_REMOVE",
    input: { platform: "dola", url: "https://www.dola.com/thread/xL02pFHSUcQEQa3ME" }
  });
  assert.equal(value.taskType, "VIDEO_WATERMARK_REMOVE");
  if (value.taskType === "VIDEO_WATERMARK_REMOVE") assert.equal(value.input.platform, "dola");
});

test("rejects a non-Dola URL for the Dola platform", () => {
  assert.equal(createTaskSchema.safeParse({
    taskType: "VIDEO_WATERMARK_REMOVE",
    input: { platform: "dola", url: "https://example.com/thread/xL02pFHSUcQEQa3ME" }
  }).success, false);
});

test("accepts Dreamina and Jimeng public share URLs", () => {
  assert.equal(createTaskSchema.safeParse({
    taskType: "VIDEO_WATERMARK_REMOVE",
    input: { platform: "dreamina", url: "https://dreamina.capcut.com/ai-tool/work-detail/7622480873543273744?isShared=1" }
  }).success, true);
  assert.equal(createTaskSchema.safeParse({
    taskType: "VIDEO_WATERMARK_REMOVE",
    input: { platform: "jimeng", url: "https://jimeng.jianying.com/s/abcDEF123/" }
  }).success, true);
});

test("rejects a share URL assigned to the wrong platform", () => {
  assert.equal(createTaskSchema.safeParse({
    taskType: "VIDEO_WATERMARK_REMOVE",
    input: { platform: "jimeng", url: "https://dreamina.capcut.com/ai-tool/work-detail/7622480873543273744" }
  }).success, false);
});
