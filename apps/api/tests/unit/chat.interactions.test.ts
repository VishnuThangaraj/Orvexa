import test from "node:test";
import assert from "node:assert/strict";
import {
  reactionSchema,
  markReadSchema,
  updatePresenceSchema,
} from "../../src/modules/chat/chat.validation.js";
import presenceService from "../../src/sockets/presence.service.js";

test("Chat Interactions & Presence Unit Tests", async (t) => {
  await t.test("reactionSchema validates non-empty emoji strings", () => {
    const valid = reactionSchema.parse({ emoji: "👍" });
    assert.equal(valid.emoji, "👍");

    assert.throws(() => {
      reactionSchema.parse({ emoji: "   " });
    });
  });

  await t.test("markReadSchema validates numeric messageId", () => {
    assert.doesNotThrow(() => {
      markReadSchema.parse({ messageId: "12345" });
      markReadSchema.parse({ messageId: 12345 });
      markReadSchema.parse({ messageId: 12345n });
    });

    assert.throws(() => {
      markReadSchema.parse({ messageId: "abc" });
    });
  });

  await t.test("presenceService accurately tracks user online/offline status", () => {
    presenceService.clear();

    const userId = "42";
    const socketId1 = "socket_tab_1";
    const socketId2 = "socket_tab_2";

    assert.equal(presenceService.isUserOnline(userId), false);

    // Add first tab
    presenceService.addUserSocket(userId, socketId1);
    assert.equal(presenceService.isUserOnline(userId), true);
    assert.deepEqual(presenceService.getOnlineUserIds(), [userId]);

    // Add second tab
    presenceService.addUserSocket(userId, socketId2);
    assert.equal(presenceService.isUserOnline(userId), true);

    // Close first tab
    presenceService.removeUserSocket(userId, socketId1);
    assert.equal(presenceService.isUserOnline(userId), true);

    // Close second tab
    presenceService.removeUserSocket(userId, socketId2);
    assert.equal(presenceService.isUserOnline(userId), false);
    assert.deepEqual(presenceService.getOnlineUserIds(), []);
  });

  await t.test("presenceService tracks ACTIVE, AWAY, and DND statuses in presenceMap", () => {
    presenceService.clear();

    const userId = "99";
    presenceService.addUserSocket(userId, "sock-1");
    assert.equal(presenceService.getUserStatus(userId), "ACTIVE");

    presenceService.setUserStatus(userId, "DND");
    assert.equal(presenceService.getPresenceMap()[userId]?.status, "DND");

    presenceService.setUserStatus(userId, "AWAY");
    assert.equal(presenceService.getPresenceMap()[userId]?.status, "AWAY");

    presenceService.removeUserSocket(userId, "sock-1");
    assert.equal(presenceService.getPresenceMap()[userId], undefined);
  });

  await t.test("updatePresenceSchema validates ACTIVE, AWAY, DND, OFFLINE", () => {
    assert.equal(updatePresenceSchema.parse({ status: "DND" }).status, "DND");
    assert.equal(updatePresenceSchema.parse({ status: "AWAY" }).status, "AWAY");
    assert.equal(updatePresenceSchema.parse({ status: "ACTIVE" }).status, "ACTIVE");
    assert.equal(updatePresenceSchema.parse({ status: "OFFLINE" }).status, "OFFLINE");
    assert.throws(() => updatePresenceSchema.parse({ status: "BUSY" }));
  });
});
