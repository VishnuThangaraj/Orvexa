import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Task 4.2: Global Chat Search Integration Tests", async (t) => {
  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const outsideUser = await prisma.user.findFirst({
    where: { email: "thilakeshwaran@gmail.com" },
  });
  assert.ok(outsideUser, "Outside user must exist");

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
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  const restBaseUrl = `http://127.0.0.1:${port}/api/chat`;

  let sharedSpaceId: string;
  let privateSpaceId: string;
  let searchableMessageId: string;

  try {
    // 1. Create a shared space with admin and member
    const sharedRes = await fetch(`${restBaseUrl}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        type: "GROUP",
        name: "Searchable Shared Space",
        description: "Space for verifying global chat search queries",
        participantIds: [String(memberUser.id)],
      }),
    });
    assert.equal(sharedRes.status, 201);
    const sharedJson = (await sharedRes.json()) as any;
    sharedSpaceId = String(sharedJson.data.id);

    // 2. Create a private channel with admin only
    const privateRes = await fetch(`${restBaseUrl}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        type: "CHANNEL",
        name: "Top Secret Private Space",
        visibility: "PRIVATE",
      }),
    });
    assert.equal(privateRes.status, 201);
    const privateJson = (await privateRes.json()) as any;
    privateSpaceId = String(privateJson.data.id);

    // 3. Post a searchable message in shared space
    const msgRes = await fetch(
      `${restBaseUrl}/conversations/${sharedSpaceId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: "AlphaBravoCharlie unique searchable keyword for testing",
        }),
      },
    );
    assert.equal(msgRes.status, 201);
    const msgJson = (await msgRes.json()) as any;
    searchableMessageId = String(msgJson.data.id);

    // 4. Post a confidential message in private space
    await fetch(
      `${restBaseUrl}/conversations/${privateSpaceId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: "ConfidentialAlpha secret keyword only admin should see",
        }),
      },
    );

    await t.test("1. Validation: Rejects empty search query with 400", async () => {
      const res = await fetch(`${restBaseUrl}/search?q=`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 400);
    });

    await t.test("2. Message Search: Returns messages matching query for authorized participants", async () => {
      // Member is a participant in shared space -> can find the message
      const res = await fetch(`${restBaseUrl}/search?q=AlphaBravoCharlie`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const messages = json.data.messages;

      assert.ok(messages.length >= 1, "Should return at least 1 message");
      const found = messages.find((m: any) => String(m.id) === searchableMessageId);
      assert.ok(found, "The shared message must be returned");
      assert.match(found.content, /AlphaBravoCharlie/);
      assert.equal(found.conversation.id, sharedSpaceId);
    });

    await t.test("3. Security / Authorization: Outside users cannot search messages in private conversations", async () => {
      // Outside user searches for the shared space message (they are NOT a member of shared space)
      const res = await fetch(`${restBaseUrl}/search?q=AlphaBravoCharlie`, {
        headers: { Authorization: `Bearer ${outsideToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const found = json.data.messages.find((m: any) => String(m.id) === searchableMessageId);
      assert.equal(found, undefined, "Non-participant must NOT see message in search");

      // Member searches for confidential message in private space
      const memberRes = await fetch(`${restBaseUrl}/search?q=ConfidentialAlpha`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      assert.equal(memberRes.status, 200);
      const memberJson = (await memberRes.json()) as any;
      assert.equal(memberJson.data.messages.length, 0, "Member must not see messages from admin private space");
    });

    await t.test("4. People Search: Resolves users by fullName or username excluding self", async () => {
      const res = await fetch(`${restBaseUrl}/search?q=${memberUser.username}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const people = json.data.people;

      const foundMember = people.find((p: any) => String(p.id) === String(memberUser.id));
      assert.ok(foundMember, "Member should appear in people search");
      assert.equal(foundMember.username, memberUser.username);

      // Searching user (admin) should not be returned in people results
      const selfFound = people.find((p: any) => String(p.id) === String(adminUser.id));
      assert.equal(selfFound, undefined, "Searcher should not appear in their own people results");
    });

    await t.test("5. Spaces Search: Matches space name and description", async () => {
      const res = await fetch(`${restBaseUrl}/search?q=Searchable+Shared+Space`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;
      const spaces = json.data.spaces;

      const foundSpace = spaces.find((s: any) => String(s.id) === sharedSpaceId);
      assert.ok(foundSpace, "Should find the space by name");
      assert.equal(foundSpace.name, "Searchable Shared Space");
      assert.equal(foundSpace.isMember, true);
    });

    await t.test("6. Type Filter: type=MESSAGES restricts results to messages only", async () => {
      const res = await fetch(`${restBaseUrl}/search?q=AlphaBravoCharlie&type=MESSAGES`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as any;

      assert.ok(json.data.messages.length > 0, "Messages should be returned");
      assert.equal(json.data.people.length, 0, "People array must be empty when type=MESSAGES");
      assert.equal(json.data.spaces.length, 0, "Spaces array must be empty when type=MESSAGES");
    });
  } finally {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    if (sharedSpaceId!) {
      await prisma.conversation.delete({
        where: { id: BigInt(sharedSpaceId) },
      }).catch(() => {});
    }

    if (privateSpaceId!) {
      await prisma.conversation.delete({
        where: { id: BigInt(privateSpaceId) },
      }).catch(() => {});
    }
  }
});
