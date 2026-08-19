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
