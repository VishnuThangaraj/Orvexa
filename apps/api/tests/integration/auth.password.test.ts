import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import prisma from "../../src/infrastructure/database/prisma.js";

test("Password Reset and Change Password Integration", async (t) => {
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const memberEmail = "thilakeshwaran@orvexa.com";
  let currentPassword = "orvexa@123";

  const memberUser = await prisma.user.findUnique({
    where: { email: memberEmail },
    include: { credentials: true },
  });
  assert.ok(memberUser, "Seeded member thilakeshwaran@orvexa.com must exist");

  // Reset state
  await prisma.credentials.update({
    where: { userId: memberUser.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await prisma.userSession.deleteMany({ where: { userId: memberUser.id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: memberUser.id } });

  let resetToken = "";

  await t.test("1. POST /forgot-password - Non-existent email returns generic success", async () => {
    const res = await fetch(`${baseUrl}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ghost@orvexa.com" }),
    });

    const body = (await res.json()) as { success: boolean; message: string; data?: { resetToken?: string } };
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.match(body.message, /If that email is registered/);
    assert.equal(body.data?.resetToken, undefined);
  });

  await t.test("2. POST /forgot-password - Existing email generates reset token", async () => {
    const res = await fetch(`${baseUrl}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail }),
    });

    const body = (await res.json()) as { success: boolean; data: { resetToken: string } };
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.resetToken);
    resetToken = body.data.resetToken;

    // Verify token exists in database
    const dbToken = await prisma.passwordResetToken.findFirst({
      where: { userId: memberUser.id },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(dbToken);
    assert.equal(dbToken.usedAt, null);
    assert.ok(dbToken.expiresAt > new Date());
  });

  await t.test("3. POST /reset-password - Invalid token returns 400", async () => {
    const res = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "invalid-token-12345",
        newPassword: "BrandNewPassword123!",
      }),
    });

    assert.equal(res.status, 400);
  });

  await t.test("4. POST /reset-password - Valid token resets password and revokes sessions", async () => {
    // Create an active session first to verify revocation
    const loginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: currentPassword }),
    });
    assert.equal(loginRes.status, 200);
    let activeSessions = await prisma.userSession.findMany({
      where: { userId: memberUser.id, revokedAt: null },
    });
    assert.ok(activeSessions.length > 0);

    const newPassword = "ResetNewPassword@456";
    const res = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: resetToken,
        newPassword,
      }),
    });

    const body = (await res.json()) as { success: boolean; message: string };
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.match(body.message, /Password has been reset successfully/);

    // Verify all active sessions are revoked
    activeSessions = await prisma.userSession.findMany({
      where: { userId: memberUser.id, revokedAt: null },
    });
    assert.equal(activeSessions.length, 0);

    // Old password should fail
    const oldLoginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: currentPassword }),
    });
    assert.equal(oldLoginRes.status, 401);

    // New password should succeed
    const newLoginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: newPassword }),
    });
    assert.equal(newLoginRes.status, 200);

    // Replay same reset token should now fail
    const replayRes = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword: "AnotherPassword123!" }),
    });
    assert.equal(replayRes.status, 400);

    currentPassword = newPassword;
  });

  await t.test("5. POST /change-password - Authenticated password change", async () => {
    // 1. Log in to get accessToken
    const loginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: currentPassword }),
    });
    const loginBody = (await loginRes.json()) as {
      data: { accessToken: string };
    };
    const token = loginBody.data.accessToken;

    // 2. Incorrect current password returns 400
    const wrongRes = await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: "WrongCurrentPassword!",
        newPassword: "BrandNewPassword789!",
      }),
    });
    assert.equal(wrongRes.status, 400);

    // 3. Same password for current and new returns 400
    const sameRes = await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: currentPassword,
      }),
    });
    assert.equal(sameRes.status, 400);

    // 4. Valid password change
    const finalPassword = "orvexa@123"; // Restore original default for future test runs
    const changeRes = await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: finalPassword,
      }),
    });

    const changeBody = (await changeRes.json()) as { success: boolean; message: string };
    assert.equal(changeRes.status, 200);
    assert.equal(changeBody.success, true);
    assert.match(changeBody.message, /Password changed successfully/);

    // 5. Login with updated password succeeds
    const finalLoginRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, password: finalPassword }),
    });
    assert.equal(finalLoginRes.status, 200);
  });

  // Final Cleanup
  await prisma.userSession.deleteMany({ where: { userId: memberUser.id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: memberUser.id } });
  server.close();
});
