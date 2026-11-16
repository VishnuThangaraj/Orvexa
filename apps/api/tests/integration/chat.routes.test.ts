import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Chat REST API Routes Integration Tests", async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/chat`;

  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const thirdUser = await prisma.user.findFirst({
    where: { email: "thilakeshwaran@gmail.com" },
  });
  assert.ok(thirdUser, "Third user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const thirdUserToken = generateAccessToken({
    id: thirdUser.id,
    role: thirdUser.role,
  });

  const createdConversationIds: bigint[] = [];

  t.after(async () => {
    if (createdConversationIds.length > 0) {
      await prisma.conversation.deleteMany({
        where: { id: { in: createdConversationIds } },
      });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  let directConversationId: string;
  let groupConversationId: string;

  await t.test("POST /direct creates a direct conversation", async () => {
    const res = await fetch(`${baseUrl}/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ recipientId: String(memberUser.id) }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.type, "DIRECT");
    assert.equal(json.data.participants.length, 2);

    directConversationId = String(json.data.id);
    createdConversationIds.push(BigInt(json.data.id));
  });

  await t.test(
    "POST /direct is idempotent and returns existing conversation",
    async () => {
      const res = await fetch(`${baseUrl}/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ recipientId: String(memberUser.id) }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(String(json.data.id), directConversationId);
    },
  );

  await t.test("POST /direct rejects self-conversation with 400", async () => {
    const res = await fetch(`${baseUrl}/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ recipientId: String(adminUser.id) }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /yourself/i);
  });

  await t.test(
    "POST /conversations creates a group conversation with owner and members",
    async () => {
      const res = await fetch(`${baseUrl}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Project Phoenix",
          type: "GROUP",
          description: "Confidential R&D channel",
          participantIds: [String(memberUser.id)],
        }),
      });

      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.name, "Project Phoenix");
      assert.equal(json.data.type, "GROUP");

      groupConversationId = String(json.data.id);
      createdConversationIds.push(BigInt(json.data.id));

      const ownerParticipant = json.data.participants.find(
        (p: any) => String(p.userId) === String(adminUser.id),
      );
      assert.equal(ownerParticipant?.memberRole, "OWNER");
    },
  );

  await t.test("GET /conversations lists user conversations", async () => {
    const res = await fetch(`${baseUrl}/conversations`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data.conversations));
    assert.ok(json.data.conversations.length >= 2);
  });

  await t.test("GET /conversations/:id fetches conversation details", async () => {
    const res = await fetch(`${baseUrl}/conversations/${groupConversationId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(String(json.data.id), groupConversationId);
    assert.equal(json.data.name, "Project Phoenix");
  });

  await t.test(
    "GET /conversations/:id blocks non-participant on private conversation with 403",
    async () => {
      const res = await fetch(`${baseUrl}/conversations/${groupConversationId}`, {
        headers: {
          Authorization: `Bearer ${thirdUserToken}`,
        },
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /not a participant/i);
    },
  );

  await t.test("PATCH /conversations/:id updates group metadata", async () => {
    const res = await fetch(`${baseUrl}/conversations/${groupConversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Project Phoenix Alpha",
        description: "Updated description",
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.name, "Project Phoenix Alpha");
    assert.equal(json.data.description, "Updated description");
  });

  await t.test("PATCH /conversations/:id/settings updates user settings", async () => {
    const res = await fetch(
      `${baseUrl}/conversations/${groupConversationId}/settings`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isMuted: true,
          isPinned: true,
        }),
      },
    );

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.isMuted, true);
    assert.equal(json.data.isPinned, true);
  });

  await t.test(
    "POST /conversations/:id/participants adds a new participant",
    async () => {
      const res = await fetch(
        `${baseUrl}/conversations/${groupConversationId}/participants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            userIds: [String(thirdUser.id)],
          }),
        },
      );

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      // Now thirdUser should be able to view details
      const viewRes = await fetch(
        `${baseUrl}/conversations/${groupConversationId}`,
        {
          headers: {
            Authorization: `Bearer ${thirdUserToken}`,
          },
        },
      );
      assert.equal(viewRes.status, 200);
    },
  );

  await t.test(
    "DELETE /conversations/:id/participants/:userId removes participant",
    async () => {
      const res = await fetch(
        `${baseUrl}/conversations/${groupConversationId}/participants/${thirdUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      // Now thirdUser should be blocked again
      const viewRes = await fetch(
        `${baseUrl}/conversations/${groupConversationId}`,
        {
          headers: {
            Authorization: `Bearer ${thirdUserToken}`,
          },
        },
      );
      assert.equal(viewRes.status, 403);
    },
  );
});
