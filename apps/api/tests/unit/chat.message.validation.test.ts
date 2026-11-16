import test from "node:test";
import assert from "node:assert/strict";
import {
  sendMessageSchema,
  editMessageSchema,
  messageIdParamSchema,
  fetchMessagesQuerySchema,
} from "../../src/modules/chat/chat.validation.js";

test("Chat Message Validation Schemas Unit Tests", async (t) => {
  await t.test("sendMessageSchema validates valid message content", () => {
    const valid = sendMessageSchema.parse({
      content: "Hello everyone!",
      messageType: "TEXT",
    });
    assert.equal(valid.content, "Hello everyone!");
    assert.equal(valid.messageType, "TEXT");

    // Defaults messageType to TEXT
    const defaultType = sendMessageSchema.parse({
      content: "Default type message",
    });
    assert.equal(defaultType.messageType, "TEXT");
  });

  await t.test("sendMessageSchema rejects empty content", () => {
    assert.throws(() => {
      sendMessageSchema.parse({
        content: "   ",
      });
    });
  });

  await t.test("sendMessageSchema validates threading and attachments", () => {
    const threaded = sendMessageSchema.parse({
      content: "Replying to previous message",
      parentMessageId: "123",
      attachmentIds: ["456", "789"],
    });
    assert.equal(threaded.parentMessageId, "123");
    assert.equal(threaded.attachmentIds?.length, 2);
  });

  await t.test("editMessageSchema requires valid non-empty content", () => {
    const edited = editMessageSchema.parse({
      content: "Corrected spelling",
    });
    assert.equal(edited.content, "Corrected spelling");

    assert.throws(() => {
      editMessageSchema.parse({
        content: "  ",
      });
    });
  });

  await t.test("messageIdParamSchema validates numeric id parameters", () => {
    assert.doesNotThrow(() => {
      messageIdParamSchema.parse({ id: "10", messageId: "20" });
    });

    assert.throws(() => {
      messageIdParamSchema.parse({ id: "10", messageId: "abc" });
    });
  });

  await t.test("fetchMessagesQuerySchema validates cursor and limit", () => {
    const query = fetchMessagesQuerySchema.parse({
      cursor: "500",
      limit: "25",
    });
    assert.equal(query.cursor, "500");
    assert.equal(query.limit, 25);
  });
});
