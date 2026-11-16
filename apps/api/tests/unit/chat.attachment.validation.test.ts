import test from "node:test";
import assert from "node:assert/strict";
import { attachmentIdParamSchema } from "../../src/modules/chat/chat.validation.js";
import { sendMessageSchema } from "../../src/modules/chat/chat.validation.js";

test("Chat Attachment Validation Schemas & Types Unit Tests", async (t) => {
  await t.test("attachmentIdParamSchema validates numeric id parameter", () => {
    const valid = attachmentIdParamSchema.safeParse({ id: "987654" });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.id, "987654");
    }
  });

  await t.test("attachmentIdParamSchema rejects invalid id strings", () => {
    const invalidAlpha = attachmentIdParamSchema.safeParse({ id: "invalid-id" });
    assert.equal(invalidAlpha.success, false);

    const invalidEmpty = attachmentIdParamSchema.safeParse({ id: "" });
    assert.equal(invalidEmpty.success, false);

    const invalidNegative = attachmentIdParamSchema.safeParse({ id: "-5" });
    assert.equal(invalidNegative.success, false);
  });

  await t.test("sendMessageSchema accepts valid attachmentIds array", () => {
    const valid = sendMessageSchema.safeParse({
      content: "Message with attachments",
      attachmentIds: ["1", "2", 3],
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.attachmentIds?.length, 3);
      assert.deepEqual(valid.data.attachmentIds, ["1", "2", 3]);
    }
  });

  await t.test("sendMessageSchema rejects invalid attachmentIds", () => {
    const invalid = sendMessageSchema.safeParse({
      content: "Invalid attachment ids",
      attachmentIds: ["not-a-number"],
    });
    assert.equal(invalid.success, false);
  });
});
