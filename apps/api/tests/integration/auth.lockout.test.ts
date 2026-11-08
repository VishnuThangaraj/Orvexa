import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";

test("Phase 2 & 3: Account lockout, email normalization, and timing attack defense", async (t) => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const memberEmail = "thilakeshwaran@orvexa.com";
  const memberPassword = "orvexa@123";

  const memberUser = await prisma.user.findUnique({
    where: { email: memberEmail },
    include: { credentials: true },
  });
  assert.ok(memberUser, "Seeded member thilakeshwaran@orvexa.com must exist");
  assert.ok(memberUser.credentials, "Member credentials must exist");

  // Reset state for this user
  await prisma.credentials.update({
    where: { userId: memberUser.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  await prisma.userSession.deleteMany({ where: { userId: memberUser.id } });

  await t.test("1. Timing attack defense on nonexistent user returns 401", async () => {
    const res = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent-user@orvexa.com",
        password: "WrongPassword123!",
      }),
    });

    const body = (await res.json()) as { success: boolean; message: string };
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid Credentials");
  });

  await t.test("2. Email normalization handles mixed-case and whitespace", async () => {
    const res = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "   THILAKESHWARAN@ORVEXA.COM   ",
        password: memberPassword,
        deviceName: "Normalization Test Device",
      }),
    });

    const body = (await res.json()) as {
      success: boolean;
      data: {
        user: { email: string };
        accessToken: string;
        sessionId: string;
      };
    };

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, memberEmail);
    assert.ok(body.data.accessToken);

    // Verify session was created
    const session = await prisma.userSession.findUnique({
      where: { id: BigInt(body.data.sessionId) },
    });
    assert.ok(session);
    assert.equal(session.userId, memberUser.id);
  });

  await t.test("3. Brute-force lockout enforces 5-attempt limit with 423 status", async () => {
    // Ensure clean slate
    await prisma.credentials.update({
      where: { userId: memberUser.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // Attempts 1-4 should return 401 and increment failedLoginAttempts
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: memberEmail,
          password: `IncorrectPasswordAttempt_${attempt}`,
        }),
      });

      const body = (await res.json()) as { success: boolean; message: string };
      assert.equal(res.status, 401, `Attempt ${attempt} should return 401`);
      assert.equal(body.message, "Invalid Credentials");

      const creds = await prisma.credentials.findUnique({
        where: { userId: memberUser.id },
      });
      assert.equal(creds?.failedLoginAttempts, attempt);
      assert.equal(creds?.lockedUntil, null);
    }

    // Attempt 5 hits threshold -> locks account and returns 423
    const fifthRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: memberEmail,
        password: "IncorrectPasswordAttempt_5",
      }),
    });

    const fifthBody = (await fifthRes.json()) as { success: boolean; message: string };
    assert.equal(fifthRes.status, 423, "5th attempt must return 423 Locked");
    assert.match(fifthBody.message, /Account is temporarily locked/);

    const lockedCreds = await prisma.credentials.findUnique({
      where: { userId: memberUser.id },
    });
    assert.equal(lockedCreds?.failedLoginAttempts, 5);
    assert.ok(lockedCreds?.lockedUntil, "lockedUntil timestamp must be populated");
    assert.ok(
      lockedCreds.lockedUntil > new Date(),
      "lockedUntil must be in the future",
    );

    // Attempt 6 with CORRECT password during active lockout must still be rejected with 423
    const lockedValidRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: memberEmail,
        password: memberPassword,
      }),
    });

    const lockedValidBody = (await lockedValidRes.json()) as {
      success: boolean;
      message: string;
    };
    assert.equal(lockedValidRes.status, 423);
    assert.match(lockedValidBody.message, /Account is temporarily locked/);
  });

  await t.test("4. Lockout expiry and reset on successful authentication", async () => {
    // Simulate expired lockout timestamp (1 minute in the past)
    await prisma.credentials.update({
      where: { userId: memberUser.id },
      data: {
        lockedUntil: new Date(Date.now() - 60 * 1000),
      },
    });

    // Login with correct password after lockout expiration
    const res = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: memberEmail,
        password: memberPassword,
      }),
    });

    const body = (await res.json()) as {
      success: boolean;
      data: { accessToken: string };
    };
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.accessToken);

    // Verify credentials state has been reset
    const resetCreds = await prisma.credentials.findUnique({
      where: { userId: memberUser.id },
    });
    assert.equal(resetCreds?.failedLoginAttempts, 0);
    assert.equal(resetCreds?.lockedUntil, null);
  });

  await t.test("5. Audit log recorded for API calls", async () => {
    const logs = await prisma.auditLog.findMany({
      where: { userId: memberUser.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    assert.ok(logs.length > 0, "Audit logs should be created for user actions");
  });

  // Final Cleanup
  await prisma.credentials.update({
    where: { userId: memberUser.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await prisma.userSession.deleteMany({ where: { userId: memberUser.id } });
  server.close();
});
