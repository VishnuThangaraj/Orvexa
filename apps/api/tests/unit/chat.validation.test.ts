import test from "node:test";
import assert from "node:assert/strict";
import {
  createDirectConversationSchema,
  createGroupOrChannelSchema,
  updateConversationSchema,
  addParticipantsSchema,
  updateParticipantRoleSchema,
  updateParticipantSettingsSchema,
  conversationIdParamSchema,
  fetchConversationsQuerySchema,
} from "../../src/modules/chat/chat.validation.js";

test("Chat Validation Schemas Unit Tests", async (t) => {
  await t.test("createDirectConversationSchema validates numeric recipientId", () => {
    assert.doesNotThrow(() => {
      createDirectConversationSchema.parse({ recipientId: "123" });
      createDirectConversationSchema.parse({ recipientId: 123 });
      createDirectConversationSchema.parse({ recipientId: 123n });
    });

    assert.throws(() => {
      createDirectConversationSchema.parse({ recipientId: "abc" });
    });
  });

  await t.test("createGroupOrChannelSchema validates group and channel requirements", () => {
    // Valid group without explicit visibility
    const validGroup = createGroupOrChannelSchema.parse({
      name: "Engineering Team",
      type: "GROUP",
    });
    assert.equal(validGroup.name, "Engineering Team");
    assert.equal(validGroup.type, "GROUP");

    // Valid channel with visibility
    const validChannel = createGroupOrChannelSchema.parse({
      name: "General Announcements",
      type: "CHANNEL",
      visibility: "PUBLIC",
    });
    assert.equal(validChannel.visibility, "PUBLIC");

    // Invalid: channel without visibility
    assert.throws(() => {
      createGroupOrChannelSchema.parse({
        name: "General Announcements",
        type: "CHANNEL",
      });
    });

    // Invalid: empty name
    assert.throws(() => {
      createGroupOrChannelSchema.parse({
        name: "   ",
        type: "GROUP",
      });
    });
  });

  await t.test("updateConversationSchema validates optional fields", () => {
    const parsed = updateConversationSchema.parse({
      name: "Updated Group Name",
      description: "New description",
    });
    assert.equal(parsed.name, "Updated Group Name");
    assert.equal(parsed.description, "New description");
  });

  await t.test("addParticipantsSchema requires non-empty userIds array", () => {
    assert.doesNotThrow(() => {
      addParticipantsSchema.parse({ userIds: ["1", "2"] });
    });

    assert.throws(() => {
      addParticipantsSchema.parse({ userIds: [] });
    });

    assert.throws(() => {
      addParticipantsSchema.parse({ userIds: ["invalid"] });
    });
  });

  await t.test("updateParticipantRoleSchema validates role enum", () => {
    assert.doesNotThrow(() => {
      updateParticipantRoleSchema.parse({ memberRole: "ADMIN" });
      updateParticipantRoleSchema.parse({ memberRole: "MEMBER" });
    });

    assert.throws(() => {
      updateParticipantRoleSchema.parse({ memberRole: "SUPERUSER" });
    });
  });

  await t.test("updateParticipantSettingsSchema accepts boolean toggles", () => {
    const parsed = updateParticipantSettingsSchema.parse({
      isMuted: true,
      isPinned: false,
    });
    assert.equal(parsed.isMuted, true);
    assert.equal(parsed.isPinned, false);
  });

  await t.test("conversationIdParamSchema validates numeric id string", () => {
    assert.doesNotThrow(() => {
      conversationIdParamSchema.parse({ id: "42" });
    });

    assert.throws(() => {
      conversationIdParamSchema.parse({ id: "xyz" });
    });
  });

  await t.test("fetchConversationsQuerySchema parses query parameters safely", () => {
    const parsed = fetchConversationsQuerySchema.parse({
      type: "DIRECT",
      isArchived: "true",
      limit: "15",
      offset: "30",
    });
    assert.equal(parsed.type, "DIRECT");
    assert.equal(parsed.isArchived, true);
    assert.equal(parsed.limit, 15);
    assert.equal(parsed.offset, 30);
  });
});
