import test from "node:test";
import assert from "node:assert/strict";
import env from "../../src/config/env.js";
import { prisma } from "../../src/config/prisma.js";
import MeetService from "../../src/modules/meet/meet.service.js";
import {
  postSignalSchema,
  knockMeetingSchema,
} from "../../src/modules/meet/meet.validation.js";

test("Meet WebRTC Fallback & Signaling Unit Tests", async (t) => {
  await t.test("postSignalSchema and knockMeetingSchema validate inputs accurately", () => {
    const validOffer = postSignalSchema.parse({
      toUserId: "22",
      kind: "offer",
      payload: { sdp: { type: "offer", sdp: "v=0..." } },
    });
    assert.equal(validOffer.kind, "offer");
    assert.equal(validOffer.toUserId, "22");

    const broadcastState = postSignalSchema.parse({
      kind: "media_state",
      payload: { isMicEnabled: false, isCameraEnabled: true },
    });
    assert.equal(broadcastState.kind, "media_state");

    assert.throws(() => {
      postSignalSchema.parse({ kind: "unknown_kind", payload: {} });
    });

    const knock = knockMeetingSchema.parse({ displayName: "Divya" });
    assert.equal(knock.displayName, "Divya");
  });

  await t.test("env.isLiveKitConfigured is false when LIVEKIT_URL is unset", () => {
    // In this workspace .env has no LIVEKIT_URL configured
    if (!process.env.LIVEKIT_URL) {
      assert.equal(env.isLiveKitConfigured, false);
    }
  });

  await t.test("MeetService returns mode and supports knock, signal post/poll, and leave", async (sub) => {
    const meetService = new MeetService();
    const meetingId = 5001n;
    const hostId = 11n;
    const guestId = 22n;
    const code = "abc-defg-hij";

    const fakeMeeting = {
      id: meetingId,
      title: "Sync Call",
      description: null,
      hostId,
      meetingCode: code,
      roomName: `orvexa-${code}`,
      conversationId: null,
      scheduledStart: null,
      scheduledEnd: null,
      startedAt: new Date("2026-11-27T10:00:00Z"),
      endedAt: null,
      status: "LIVE",
      isLocked: false,
      requireApproval: true,
      allowScreenShare: true,
      allowChat: true,
      allowReactions: true,
      createdAt: new Date("2026-11-27T10:00:00Z"),
      updatedAt: new Date("2026-11-27T10:00:00Z"),
      host: {
        id: hostId,
        fullName: "Divya Krishnan",
        username: "divya",
        email: "divya@gmail.com",
        profileImage: null,
      },
      participants: [
        {
          id: 1n,
          meetingId,
          userId: hostId,
          meetingRole: "HOST",
          invitationStatus: "ACCEPTED",
          joinedAt: new Date("2026-11-27T10:00:00Z"),
          leftAt: null,
          createdAt: new Date("2026-11-27T10:00:00Z"),
          user: {
            id: hostId,
            fullName: "Divya Krishnan",
            username: "divya",
            email: "divya@gmail.com",
            profileImage: null,
          },
        },
        {
          id: 2n,
          meetingId,
          userId: guestId,
          meetingRole: "PARTICIPANT",
          invitationStatus: "ACCEPTED",
          joinedAt: new Date("2026-11-27T10:01:00Z"),
          leftAt: null,
          createdAt: new Date("2026-11-27T10:00:30Z"),
          user: {
            id: guestId,
            fullName: "Vignesh",
            username: "vignesh",
            email: "vignesh@gmail.com",
            profileImage: null,
          },
        },
      ],
    };

    const repo = (meetService as any).meetRepository;
    sub.mock.method(repo, "findByCode", async () => fakeMeeting);
    sub.mock.method(repo, "recordParticipantJoin", async () => ({}));
    sub.mock.method(repo, "recordParticipantLeave", async () => ({ count: 1 }));
    sub.mock.method(repo, "upsertParticipant", async (_mId: bigint, uId: bigint, data: any) => ({
      id: 99n,
      meetingId,
      userId: uId,
      invitationStatus: data.invitationStatus,
      user: { fullName: "Pending User", profileImage: null },
    }));

    const createdLogs: any[] = [];
    const origUserFindUnique = prisma.user.findUnique.bind(prisma.user);
    const origAuditCreate = prisma.auditLog.create.bind(prisma.auditLog);
    const origAuditDeleteMany = prisma.auditLog.deleteMany.bind(prisma.auditLog);
    const origAuditFindMany = prisma.auditLog.findMany.bind(prisma.auditLog);

    sub.after(() => {
      (prisma.user as any).findUnique = origUserFindUnique;
      (prisma.auditLog as any).create = origAuditCreate;
      (prisma.auditLog as any).deleteMany = origAuditDeleteMany;
      (prisma.auditLog as any).findMany = origAuditFindMany;
    });

    (prisma.user as any).findUnique = async ({ where }: any) => {
      if (where.id === hostId) {
        return {
          id: hostId,
          fullName: "Divya Krishnan",
          username: "divya",
          email: "divya@gmail.com",
          profileImage: null,
        };
      }
      return {
        id: guestId,
        fullName: "Vignesh",
        username: "vignesh",
        email: "vignesh@gmail.com",
        profileImage: null,
      };
    };

    (prisma.auditLog as any).create = async ({ data }: any) => {
      const row = {
        id: BigInt(100 + createdLogs.length + 1),
        ...data,
        createdAt: new Date(),
      };
      createdLogs.push(row);
      return row;
    };
    (prisma.auditLog as any).deleteMany = async () => ({ count: 0 });
    (prisma.auditLog as any).findMany = async () => createdLogs;

    // 1. Token response returns webrtc mode when LiveKit is unconfigured
    const origLiveKit = env.isLiveKitConfigured;
    env.isLiveKitConfigured = false;
    try {
      const tokenRes = await meetService.generateLiveKitToken(hostId, code);
      assert.equal(tokenRes.mode, "webrtc");
      assert.equal(tokenRes.url, "");
      assert.ok(tokenRes.token.length > 20);
      assert.equal(tokenRes.participantId, String(hostId));
    } finally {
      env.isLiveKitConfigured = origLiveKit;
    }

    // 2. Guest posts offer targeted to host, plus an offer targeted to user 99 (should be filtered out for host)
    await meetService.postSignal(guestId, code, {
      toUserId: String(hostId),
      kind: "offer",
      payload: { sdp: { type: "offer", sdp: "sdp-for-host" } },
    });
    await meetService.postSignal(guestId, code, {
      toUserId: "99",
      kind: "offer",
      payload: { sdp: { type: "offer", sdp: "sdp-for-someone-else" } },
    });
    await meetService.postSignal(hostId, code, {
      toUserId: null,
      kind: "media_state",
      payload: { isMicEnabled: true, isCameraEnabled: true },
    });

    const hostPoll = await meetService.getSignals(hostId, code);
    assert.equal(hostPoll.signals.length, 1);
    assert.equal(hostPoll.signals[0].kind, "offer");
    assert.equal(hostPoll.signals[0].fromUserId, String(guestId));
    assert.equal(hostPoll.activeParticipants.length, 2);
    assert.equal(hostPoll.latestId, "103");

    // 3. Leave records leave signal
    const leaveRes = await meetService.leaveMeeting(guestId, code);
    assert.equal(leaveRes.success, true);
    assert.equal(createdLogs[createdLogs.length - 1].action, "leave");

    // 4. Knock for unknown user inserts PENDING state
    const knockRes = await meetService.knockMeeting(33n, code);
    assert.equal(knockRes.status, "PENDING");
  });
});
