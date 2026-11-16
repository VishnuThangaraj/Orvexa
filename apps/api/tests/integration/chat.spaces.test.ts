import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";
import {
  initializeSocketServer,
  closeSocketServer,
} from "../../src/sockets/socket.server.js";

test("Task 2.2 & 2.3: Space Management, Member Roles, Archive & Public Discovery", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const outsideUser = await prisma.user.findFirst({
    where: {
      email: { notIn: [env.ADMIN_EMAIL, "vignesh@gmail.com"] },
    },
  });
  assert.ok(outsideUser, "An outside user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const outsideToken = generateAccessToken({
    id: outsideUser.id,
    role: outsideUser.role,
  });

  const httpServer = http.createServer(app);
  initializeSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  const restBaseUrl = `http://127.0.0.1:${port}/api/chat`;

  let publicSpaceId: string;
  let privateSpaceId: string;

  // 1. Create a Public Space
  const publicRes = await fetch(`${restBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Public Engineers Space",
      description: "A public space for all engineers",
      type: "CHANNEL",
      visibility: "PUBLIC",
      participantIds: [String(memberUser.id)],
    }),
  });
  assert.equal(publicRes.status, 201);
  const publicData = await publicRes.json();
  publicSpaceId = String(publicData.data.id);

  // 2. Create a Private Space
  const privateRes = await fetch(`${restBaseUrl}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Executive Leadership Private",
      description: "Private discussions",
      type: "CHANNEL",
      visibility: "PRIVATE",
      participantIds: [String(memberUser.id)],
    }),
  });
  assert.equal(privateRes.status, 201);
  const privateData = await privateRes.json();
  privateSpaceId = String(privateData.data.id);

  await t.test("1. Space Settings: Manager can rename & update description", async () => {
    const updateRes = await fetch(`${restBaseUrl}/conversations/${publicSpaceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Renamed Public Engineers Space",
        description: "Updated description for public collaboration",
      }),
    });
    assert.equal(updateRes.status, 200);
    const body = await updateRes.json();
    assert.equal(body.data.name, "Renamed Public Engineers Space");
    assert.equal(body.data.description, "Updated description for public collaboration");
  });

  await t.test("2. Non-manager cannot update space settings", async () => {
    const failRes = await fetch(`${restBaseUrl}/conversations/${publicSpaceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${memberToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Malicious Member Rename",
      }),
    });
    assert.equal(failRes.status, 403);
  });

  await t.test("3. Role Management: Owner can promote to ADMIN and demote to MEMBER", async () => {
    // Promote member to ADMIN
    const promoteRes = await fetch(
      `${restBaseUrl}/conversations/${publicSpaceId}/participants/${memberUser.id}/role`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberRole: "ADMIN" }),
      },
    );
    assert.equal(promoteRes.status, 200);

    const checkAdmin = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: BigInt(publicSpaceId),
          userId: memberUser.id,
        },
      },
    });
    assert.equal(checkAdmin?.memberRole, "ADMIN");

    // Demote back to MEMBER
    const demoteRes = await fetch(
      `${restBaseUrl}/conversations/${publicSpaceId}/participants/${memberUser.id}/role`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberRole: "MEMBER" }),
      },
    );
    assert.equal(demoteRes.status, 200);
  });

  await t.test("4. Public Space Discovery lists public spaces with membership status", async () => {
    const discoverRes = await fetch(`${restBaseUrl}/spaces/discover`, {
      headers: {
        Authorization: `Bearer ${outsideToken}`,
      },
    });
    assert.equal(discoverRes.status, 200);
    const body = await discoverRes.json();
    assert.ok(body.data.spaces.length > 0);

    const publicSpaceItem = body.data.spaces.find(
      (s: any) => String(s.id) === publicSpaceId,
    );
    assert.ok(publicSpaceItem, "Public space must appear in discovery");
    assert.equal(publicSpaceItem.isMember, false);
    assert.equal(publicSpaceItem.visibility, "PUBLIC");

    // Private space should NOT appear in discovery
    const privateSpaceItem = body.data.spaces.find(
      (s: any) => String(s.id) === privateSpaceId,
    );
    assert.equal(privateSpaceItem, undefined, "Private space must NOT be discoverable");
  });

  await t.test("5. Joining Public Space: user can join public space but not private space", async () => {
    // Joining private space should fail with 403
    const failJoinPrivate = await fetch(
      `${restBaseUrl}/conversations/${privateSpaceId}/join`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${outsideToken}`,
        },
      },
    );
    assert.equal(failJoinPrivate.status, 403);

    // Joining public space succeeds
    const joinRes = await fetch(
      `${restBaseUrl}/conversations/${publicSpaceId}/join`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${outsideToken}`,
        },
      },
    );
    assert.equal(joinRes.status, 200);

    const participantInDb = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: BigInt(publicSpaceId),
          userId: outsideUser.id,
        },
      },
    });
    assert.ok(participantInDb, "Joined user must be in conversation_participants");
    assert.equal(participantInDb.memberRole, "MEMBER");
    assert.equal(participantInDb.leftAt, null);
  });

  await t.test("6. Leave Space: member can leave, updating leftAt", async () => {
    const leaveRes = await fetch(
      `${restBaseUrl}/conversations/${publicSpaceId}/participants/${outsideUser.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${outsideToken}`,
        },
      },
    );
    assert.equal(leaveRes.status, 200);

    const participantAfterLeave = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: BigInt(publicSpaceId),
          userId: outsideUser.id,
        },
      },
    });
    assert.ok(participantAfterLeave?.leftAt !== null, "leftAt must be set on leaving");
  });

  await t.test("7. Space Archive: manager can archive space setting archivedAt", async () => {
    const archiveRes = await fetch(`${restBaseUrl}/conversations/${publicSpaceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isArchived: true }),
    });
    assert.equal(archiveRes.status, 200);

    const archivedInDb = await prisma.conversation.findUnique({
      where: { id: BigInt(publicSpaceId) },
    });
    assert.ok(archivedInDb?.archivedAt !== null, "archivedAt must be set on archive");
  });

  t.after(async () => {
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });
});
