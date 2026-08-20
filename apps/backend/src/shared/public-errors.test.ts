import assert from "node:assert/strict";
import test from "node:test";
import { publicErrorCode, publicErrorMessage } from "./public-errors.js";

test("keeps supported public error codes", () => {
  assert.equal(publicErrorCode({ code: "DOLA_NO_VIDEO" }), "DOLA_NO_VIDEO");
  assert.match(publicErrorMessage("DOLA_NO_VIDEO"), /No downloadable videos/);
});

test("replaces internal SDK error names and messages", () => {
  const code = publicErrorCode({ code: "ConnectionTimeoutError", message: "ali-oss internal endpoint" });
  assert.equal(code, "PROCESSING_FAILED");
  assert.doesNotMatch(publicErrorMessage(code), /ali-oss|timeout/i);
});
