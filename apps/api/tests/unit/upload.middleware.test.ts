import test from "node:test";
import assert from "node:assert/strict";
import {
  createUploadMiddleware,
  mailAttachmentUpload,
  imageUploadMiddleware,
  uploadMiddleware,
} from "../../src/middleware/upload.middleware.js";

test("upload middleware factory creates configured middlewares", () => {
  const custom = createUploadMiddleware({
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
  });

  assert.equal(typeof custom, "function");
  assert.equal(typeof uploadMiddleware, "function");
  assert.equal(typeof mailAttachmentUpload, "function");
  assert.equal(typeof imageUploadMiddleware, "function");
});
