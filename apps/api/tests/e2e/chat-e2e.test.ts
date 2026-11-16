import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { io as ClientSocket, type Socket as ClientSocketType } from "socket.io-client";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";
import {
  initializeSocketServer,
  closeSocketServer,
} from "../../src/sockets/socket.server.js";

test("Full End-to-End Multi-Client Real-Time Chat & Collaboration Verification", async (t) => {
  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;
  const memberEmail = "vignesh@gmail.com";
  const memberPassword = "orvexa@123";

  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: memberEmail },
  });
  assert.ok(memberUser, "Member user must exist");

  const httpServer = http.createServer(app);
  initializeSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  const socketUrl = `http://127.0.0.1:${port}`;
  const restBaseUrl = `http://127.0.0.1:${port}/api`;

  let adminToken: string;
  let memberToken: string;
  let clientSocketAdmin: ClientSocketType;
  let clientSocketMember: ClientSocketType;

  let directConvId: string;
  let groupConvId: string;
  let sentMessageId: string;
  let uploadedAssetId: string;

  t.after(async () => {
    clientSocketAdmin?.disconnect();
    clientSocketMember?.disconnect();
    await closeSocketServer();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    // Cleanup conversations
    if (directConvId) {
      await prisma.conversation.deleteMany({
        where: { id: BigInt(directConvId) },
      });
    }
    if (groupConvId) {
      await prisma.conversation.deleteMany({
        where: { id: BigInt(groupConvId) },
      });
    }
    if (uploadedAssetId) {
      await prisma.fileAsset.deleteMany({
        where: { id: BigInt(uploadedAssetId) },
      });
    }
  });

  await t.test("1. Users authenticate via REST API login", async () => {
    // Admin login
    const adminLoginRes = await fetch(`${restBaseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        deviceName: "E2E Test Admin Device",
      }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminJson = await adminLoginRes.json();
    adminToken = adminJson.data.accessToken;
    assert.ok(adminToken, "Admin accessToken must be returned");

    // Member login
    const memberLoginRes = await fetch(`${restBaseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: memberEmail,
        password: memberPassword,
        deviceName: "E2E Test Member Device",
      }),
    });
    assert.equal(memberLoginRes.status, 200);
    const memberJson = await memberLoginRes.json();
    memberToken = memberJson.data.accessToken;
    assert.ok(memberToken, "Member accessToken must be returned");
  });

  await t.test("2. Both users connect WebSocket clients and register presence", async () => {
    clientSocketAdmin = ClientSocket(socketUrl, {
      auth: { token: adminToken },
      transports: ["websocket"],
      forceNew: true,
    });

    clientSocketMember = ClientSocket(socketUrl, {
      auth: { token: memberToken },
      transports: ["websocket"],
      forceNew: true,
    });

    await Promise.all([
      new Promise<void>((resolve) => clientSocketAdmin.on("connect", resolve)),
      new Promise<void>((resolve) => clientSocketMember.on("connect", resolve)),
    ]);

    assert.ok(clientSocketAdmin.connected);
    assert.ok(clientSocketMember.connected);

    // Verify REST presence returns both online users
    const presenceRes = await fetch(`${restBaseUrl}/chat/presence`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(presenceRes.status, 200);
    const presenceJson = await presenceRes.json();
    assert.ok(presenceJson.data.onlineUserIds.includes(String(adminUser.id)));
    assert.ok(presenceJson.data.onlineUserIds.includes(String(memberUser.id)));
  });

  await t.test("3. Canonical Direct Conversation resolution & idempotency", async () => {
    // Admin initiates direct conversation with Member
    const createRes1 = await fetch(`${restBaseUrl}/chat/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ recipientId: String(memberUser.id) }),
    });
    assert.equal(createRes1.status, 201);
    const json1 = await createRes1.json();
    directConvId = String(json1.data.id);
    assert.ok(directConvId);

    // Member initiates direct conversation with Admin -> must return identical conversation
    const createRes2 = await fetch(`${restBaseUrl}/chat/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ recipientId: String(adminUser.id) }),
    });
    assert.equal(createRes2.status, 201);
    const json2 = await createRes2.json();
    assert.equal(String(json2.data.id), directConvId);
  });

  await t.test("4. Real-time typing indicators & message exchange with attachment", async () => {
    // Both join conversation room
    await new Promise<void>((resolve) => {
      clientSocketAdmin.emit("chat:join", { conversationId: directConvId }, () => resolve());
    });
    await new Promise<void>((resolve) => {
      clientSocketMember.emit("chat:join", { conversationId: directConvId }, () => resolve());
    });

    // Test typing start
    const typingPromise = new Promise<{ conversationId: string; userId: string; isTyping: boolean }>((resolve) => {
      clientSocketMember.once("typing:user_typing", resolve);
    });
    clientSocketAdmin.emit("typing:start", { conversationId: directConvId });
    const typingData = await typingPromise;
    assert.equal(typingData.isTyping, true);
    assert.equal(typingData.userId, String(adminUser.id));

    // Upload attachment
    const formData = new FormData();
    const blob = new Blob(["E2E Spec Sheet Data"], { type: "text/plain" });
    formData.append("files", blob, "specs.txt");
    const uploadRes = await fetch(`${restBaseUrl}/chat/attachments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });
    assert.equal(uploadRes.status, 201);
    const uploadJson = await uploadRes.json();
    uploadedAssetId = uploadJson.data.assets[0].assetId;

    // Send message with attachment via REST and assert Member receives it via WebSocket
    const messagePromise = new Promise<any>((resolve) => {
      clientSocketMember.once("message:received", resolve);
    });

    const sendRes = await fetch(`${restBaseUrl}/chat/conversations/${directConvId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        content: "Here are the project specifications for review",
        attachmentIds: [uploadedAssetId],
      }),
    });
    assert.equal(sendRes.status, 201);
    const sendJson = await sendRes.json();
    sentMessageId = String(sendJson.data.id);

    const receivedMessage = await messagePromise;
    assert.equal(String(receivedMessage.id), sentMessageId);
    assert.equal(receivedMessage.content, "Here are the project specifications for review");
    assert.equal(receivedMessage.messageType, "FILE");
    assert.equal(receivedMessage.attachments?.length, 1);
    assert.equal(receivedMessage.attachments[0].asset?.originalFilename, "specs.txt");
  });

  await t.test("5. Read receipts, emoji reactions, and message pinning", async () => {
    // Member marks message as read
    const readReceiptPromise = new Promise<any>((resolve) => {
      clientSocketAdmin.once("message:read_receipt", resolve);
    });

    clientSocketMember.emit("message:read", {
      conversationId: directConvId,
      messageId: sentMessageId,
    });

    const receipt = await readReceiptPromise;
    assert.equal(receipt.conversationId, directConvId);
    assert.equal(receipt.userId, String(memberUser.id));
    assert.equal(receipt.messageId, sentMessageId);

    // Member adds reaction ❤️
    const reactionPromise = new Promise<any>((resolve) => {
      clientSocketAdmin.once("message:reaction_updated", resolve);
    });

    const reactRes = await fetch(
      `${restBaseUrl}/chat/conversations/${directConvId}/messages/${sentMessageId}/reactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ emoji: "❤️" }),
      },
    );
    assert.equal(reactRes.status, 200);

    const reactionData = await reactionPromise;
    assert.equal(reactionData.messageId, sentMessageId);
    assert.ok(reactionData.reactions.some((r: any) => r.emoji === "❤️"));

    // Admin pins message
    const pinPromise = new Promise<any>((resolve) => {
      clientSocketMember.once("message:pinned_updated", resolve);
    });

    const pinRes = await fetch(
      `${restBaseUrl}/chat/conversations/${directConvId}/messages/${sentMessageId}/pin`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    assert.equal(pinRes.status, 200);

    const pinData = await pinPromise;
    assert.equal(pinData.messageId, sentMessageId);
    assert.equal(pinData.isPinned, true);

    // Member fetches pins
    const getPinsRes = await fetch(`${restBaseUrl}/chat/conversations/${directConvId}/pins`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(getPinsRes.status, 200);
    const getPinsJson = await getPinsRes.json();
    assert.equal(getPinsJson.data.length, 1);
    assert.equal(String(getPinsJson.data[0].messageId), sentMessageId);
  });

  await t.test("6. Multi-user Group Space creation & broadcast messaging", async () => {
    // Admin creates Tech Core Space
    const createSpaceRes = await fetch(`${restBaseUrl}/chat/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Tech Core",
        description: "Core technical development channel",
        type: "GROUP",
        participantIds: [String(memberUser.id)],
      }),
    });
    assert.equal(createSpaceRes.status, 201);
    const spaceJson = await createSpaceRes.json();
    groupConvId = String(spaceJson.data.id);

    // Both join Space room
    await new Promise<void>((resolve) => {
      clientSocketAdmin.emit("chat:join", { conversationId: groupConvId }, () => resolve());
    });
    await new Promise<void>((resolve) => {
      clientSocketMember.emit("chat:join", { conversationId: groupConvId }, () => resolve());
    });

    // Member sends message via socket chat:send
    const groupMsgPromise = new Promise<any>((resolve) => {
      clientSocketAdmin.once("message:received", resolve);
    });

    clientSocketMember.emit(
      "chat:send",
      {
        conversationId: groupConvId,
        content: "Good evening sir, Today, I resolved the merge conflicts.",
      },
      (ack) => {
        assert.equal(ack.success, true);
      },
    );

    const receivedGroupMsg = await groupMsgPromise;
    assert.equal(
      receivedGroupMsg.content,
      "Good evening sir, Today, I resolved the merge conflicts.",
    );
    assert.equal(String(receivedGroupMsg.senderId), String(memberUser.id));
  });

  await t.test("7. Disconnect notification & clean presence state transition", async () => {
    const offlinePromise = new Promise<any>((resolve) => {
      clientSocketAdmin.once("presence:state", resolve);
    });

    clientSocketMember.disconnect();

    const offlineState = await offlinePromise;
    assert.equal(offlineState.userId, String(memberUser.id));
    assert.equal(offlineState.isOnline, false);
  });
});
