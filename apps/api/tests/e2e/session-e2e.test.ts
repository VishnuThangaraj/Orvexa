import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma, { disconnectDatabase } from "../../src/infrastructure/database/prisma.js";
import env from "../../src/config/env.js";

test("Phase 4 (Task 4.1): Comprehensive End-to-End Session & Multi-Device Verification", async (t) => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;

  const memberEmail = "vignesh@orvexa.com";
  const memberPassword = "orvexa@123";

  // Pre-test DB cleanup for these users
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  const memberUser = await prisma.user.findUnique({ where: { email: memberEmail } });
  assert.ok(adminUser, "Seeded admin must exist");
  assert.ok(memberUser, "Seeded member must exist");

  await prisma.userSession.deleteMany({
    where: { userId: { in: [adminUser.id, memberUser.id] } },
  });

  // Device session tokens for admin
  let desktopSession: { accessToken: string; refreshToken: string; sessionId: string };
  let mobileSession: { accessToken: string; refreshToken: string; sessionId: string };
  let tabletSession: { accessToken: string; refreshToken: string; sessionId: string };

  // Member session
  let memberSession: { accessToken: string; refreshToken: string; sessionId: string };

  await t.test("1. Admin logs in from 3 distinct devices concurrently", async () => {
    // Desktop login
    const desktopRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        deviceName: "MacBook Pro M2",
      }),
    });
    const desktopData = (await desktopRes.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string; sessionId: string };
    };
    assert.equal(desktopRes.status, 200);
    desktopSession = desktopData.data;

    // Mobile login
    const mobileRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        deviceName: "iPhone 15 Pro",
      }),
    });
    const mobileData = (await mobileRes.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string; sessionId: string };
    };
    assert.equal(mobileRes.status, 200);
    mobileSession = mobileData.data;

    // Tablet login
    const tabletRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        deviceName: "iPad Air",
      }),
    });
    const tabletData = (await tabletRes.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string; sessionId: string };
    };
    assert.equal(tabletRes.status, 200);
    tabletSession = tabletData.data;

    // Verify all 3 sessions have distinct session IDs and tokens
    assert.notEqual(desktopSession.sessionId, mobileSession.sessionId);
    assert.notEqual(mobileSession.sessionId, tabletSession.sessionId);
    assert.notEqual(desktopSession.refreshToken, mobileSession.refreshToken);
  });

  await t.test("2. Member logs in from their own device", async () => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Linux; Android 14)",
      },
      body: JSON.stringify({
        email: memberEmail,
        password: memberPassword,
        deviceName: "Pixel 8",
      }),
    });
    const body = (await res.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string; sessionId: string };
    };
    assert.equal(res.status, 200);
    memberSession = body.data;
  });

  await t.test("3. Admin lists active sessions and confirms metadata & isCurrent flag", async () => {
    const res = await fetch(`${baseUrl}/sessions`, {
      headers: {
        Authorization: `Bearer ${mobileSession.accessToken}`,
        "x-refresh-token": mobileSession.refreshToken,
      },
    });
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ id: string; deviceName: string; isCurrent: boolean }>;
    };

    assert.equal(res.status, 200);
    assert.equal(body.data.length, 3, "Admin should see exactly 3 active sessions");

    const current = body.data.find((s) => s.id === mobileSession.sessionId);
    assert.ok(current);
    assert.equal(current.isCurrent, true);
    assert.equal(current.deviceName, "iPhone 15 Pro");

    const desktop = body.data.find((s) => s.id === desktopSession.sessionId);
    assert.ok(desktop);
    assert.equal(desktop.isCurrent, false);
    assert.equal(desktop.deviceName, "MacBook Pro M2");
  });

  await t.test("4. Token rotation on Desktop session & token reuse attack detection", async () => {
    const oldDesktopRefreshToken = desktopSession.refreshToken;

    // Refresh Desktop token
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldDesktopRefreshToken }),
    });
    const refreshBody = (await refreshRes.json()) as {
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    };
    assert.equal(refreshRes.status, 200);
    assert.notEqual(refreshBody.data.refreshToken, oldDesktopRefreshToken);

    // Update desktopSession with fresh rotated tokens
    desktopSession.accessToken = refreshBody.data.accessToken;
    desktopSession.refreshToken = refreshBody.data.refreshToken;

    // Attacker attempts to replay old Desktop refresh token -> must be rejected (401)
    const attackerRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldDesktopRefreshToken }),
    });
    assert.equal(attackerRes.status, 401);
  });

  await t.test("5. Cross-user session security: Member cannot revoke Admin's session", async () => {
    // Member attempts to revoke Admin's tablet session
    const hackAttemptRes = await fetch(`${baseUrl}/sessions/${tabletSession.sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${memberSession.accessToken}`,
      },
    });

    // Should return 404 (or 403) — user does not own this session
    assert.equal(hackAttemptRes.status, 404);

    // Admin's tablet session must remain fully intact and active
    const tabletRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tabletSession.refreshToken }),
    });
    assert.equal(tabletRefreshRes.status, 200);
    const tabletRefreshBody = (await tabletRefreshRes.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    tabletSession.accessToken = tabletRefreshBody.data.accessToken;
    tabletSession.refreshToken = tabletRefreshBody.data.refreshToken;
  });

  await t.test("6. Admin revokes Mobile device; Desktop and Tablet remain valid", async () => {
    // Admin revokes Mobile session
    const revokeRes = await fetch(`${baseUrl}/sessions/${mobileSession.sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${desktopSession.accessToken}`,
      },
    });
    assert.equal(revokeRes.status, 200);

    // Mobile refresh must fail
    const mobileRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: mobileSession.refreshToken }),
    });
    assert.equal(mobileRefreshRes.status, 401);

    // Desktop refresh must succeed
    const desktopRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: desktopSession.refreshToken }),
    });
    assert.equal(desktopRefreshRes.status, 200);
    const desktopRefreshBody = (await desktopRefreshRes.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    desktopSession.accessToken = desktopRefreshBody.data.accessToken;
    desktopSession.refreshToken = desktopRefreshBody.data.refreshToken;

    // Tablet refresh must succeed and rotate token
    const tabletRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tabletSession.refreshToken }),
    });
    assert.equal(tabletRefreshRes.status, 200);
    const tabletRefreshData = (await tabletRefreshRes.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    tabletSession.accessToken = tabletRefreshData.data.accessToken;
    tabletSession.refreshToken = tabletRefreshData.data.refreshToken;
  });

  await t.test("7. Single session logout on Tablet", async () => {
    // Tablet logs out
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tabletSession.refreshToken }),
    });
    assert.equal(logoutRes.status, 200);

    // Tablet refresh must fail
    const tabletRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tabletSession.refreshToken }),
    });
    assert.equal(tabletRefreshRes.status, 401);

    // Desktop is still active
    const listRes = await fetch(`${baseUrl}/sessions`, {
      headers: { Authorization: `Bearer ${desktopSession.accessToken}` },
    });
    const listBody = (await listRes.json()) as { data: Array<{ id: string }> };
    assert.equal(listBody.data.length, 1);
    assert.equal(listBody.data[0].id, desktopSession.sessionId);
  });

  await t.test("8. Revoke all sessions (Logout all devices) for Admin", async () => {
    const revokeAllRes = await fetch(`${baseUrl}/sessions`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${desktopSession.accessToken}` },
    });
    assert.equal(revokeAllRes.status, 200);

    // Desktop refresh must fail now
    const desktopRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: desktopSession.refreshToken }),
    });
    assert.equal(desktopRefreshRes.status, 401);

    // Member session was not affected!
    const memberRefreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: memberSession.refreshToken }),
    });
    assert.equal(memberRefreshRes.status, 200);
  });

  await t.test("9. Second seeded member thilakeshwaran@orvexa.com can log in and view profile", async () => {
    const member2Email = "thilakeshwaran@orvexa.com";
    const member2Password = "orvexa@123";

    const loginRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: member2Email, password: member2Password }),
    });
    const loginBody = (await loginRes.json()) as {
      success: boolean;
      data: { accessToken: string; user: { email: string; fullName: string } };
    };
    assert.equal(loginRes.status, 200);
    assert.equal(loginBody.data.user.email, member2Email);
    assert.equal(loginBody.data.user.fullName, "Thilakeshwaran");

    // Profile query
    const profileRes = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${loginBody.data.accessToken}` },
    });
    const profileBody = (await profileRes.json()) as {
      success: boolean;
      data: { email: string; role: string };
    };
    assert.equal(profileRes.status, 200);
    assert.equal(profileBody.data.email, member2Email);
    assert.equal(profileBody.data.role, "MEMBER");
  });

  // Final cleanup
  await prisma.userSession.deleteMany({
    where: { userId: { in: [adminUser.id, memberUser.id] } },
  });
  server.close();
  await disconnectDatabase();
});
