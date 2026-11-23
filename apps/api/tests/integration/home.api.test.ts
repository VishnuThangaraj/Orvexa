import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Home Dashboard REST API Routes Integration Tests", async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/home`;

  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  t.after(async () => {
    // Reset preferences for clean state
    await prisma.userDashboardPreference.deleteMany({
      where: { userId: adminUser.id },
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  await t.test("1. Unauthorized request rejected with 401", async () => {
    const res = await fetch(`${baseUrl}/overview`);
    assert.equal(res.status, 401);
  });

  await t.test("2. GET /overview returns complete dashboard aggregation with real data", async () => {
    const res = await fetch(`${baseUrl}/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data, "Response data must exist");

    const { summary, mail, chat, calendar, meet, drive, tasks, activity } = body.data;

    // Verify Summary Strip numbers
    assert.ok(summary, "Summary strip must exist");
    assert.equal(typeof summary.unreadMailCount, "number");
    assert.equal(typeof summary.unreadChatCount, "number");
    assert.equal(typeof summary.todayEventsCount, "number");
    assert.equal(typeof summary.todayMeetingsCount, "number");
    assert.equal(typeof summary.storageUsedBytes, "string");
    assert.equal(typeof summary.storageTotalBytes, "string");

    // Verify Mail slice
    assert.equal(mail.status, "success");
    assert.ok(mail.data);
    assert.equal(typeof mail.data.counts.inboxUnread, "number");
    assert.ok(Array.isArray(mail.data.recentThreads));

    // Verify Chat slice
    assert.equal(chat.status, "success");
    assert.ok(chat.data);
    assert.equal(typeof chat.data.unreadTotal, "number");
    assert.ok(Array.isArray(chat.data.conversations));

    // Verify Calendar slice
    assert.equal(calendar.status, "success");
    assert.ok(calendar.data);
    assert.ok(Array.isArray(calendar.data.todayEvents));
    assert.ok(Array.isArray(calendar.data.monthEventDates));

    // Verify Meet slice
    assert.equal(meet.status, "success");
    assert.ok(meet.data);
    assert.ok(Array.isArray(meet.data.activeMeetings));
    assert.ok(Array.isArray(meet.data.upcomingMeetings));
    assert.ok(Array.isArray(meet.data.recentMeetings));

    // Verify Drive slice
    assert.equal(drive.status, "success");
    assert.ok(drive.data);
    assert.ok(drive.data.storage);
    assert.equal(typeof drive.data.storage.usedBytes, "string");
    assert.ok(Array.isArray(drive.data.recentFiles));

    // Verify Tasks & Activity
    assert.equal(tasks.status, "success");
    assert.ok(Array.isArray(tasks.data));

    assert.equal(activity.status, "success");
    assert.ok(Array.isArray(activity.data));
  });

  await t.test("3. Per-widget endpoints return correct isolated data slices", async () => {
    // 3a. Mail
    const mailRes = await fetch(`${baseUrl}/mail`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(mailRes.status, 200);
    const mailBody = await mailRes.json();
    assert.ok(mailBody.data.counts);

    // 3b. Chat
    const chatRes = await fetch(`${baseUrl}/chat`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(chatRes.status, 200);
    const chatBody = await chatRes.json();
    assert.equal(typeof chatBody.data.unreadTotal, "number");

    // 3c. Calendar
    const calRes = await fetch(`${baseUrl}/calendar`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(calRes.status, 200);
    const calBody = await calRes.json();
    assert.ok(Array.isArray(calBody.data.todayEvents));

    // 3d. Meet
    const meetRes = await fetch(`${baseUrl}/meet`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(meetRes.status, 200);
    const meetBody = await meetRes.json();
    assert.ok(Array.isArray(meetBody.data.upcomingMeetings));

    // 3e. Drive
    const driveRes = await fetch(`${baseUrl}/drive`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(driveRes.status, 200);
    const driveBody = await driveRes.json();
    assert.ok(driveBody.data.storage);

    // 3f. Tasks
    const taskRes = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(taskRes.status, 200);
    const taskBody = await taskRes.json();
    assert.ok(Array.isArray(taskBody.data));

    // 3g. Activity
    const actRes = await fetch(`${baseUrl}/activity`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(actRes.status, 200);
    const actBody = await actRes.json();
    assert.ok(Array.isArray(actBody.data));
  });

  await t.test("4. Cross-module federated search returns categorized hits", async () => {
    const res = await fetch(`${baseUrl}/search?q=test&limit=3`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.query, "test");
    assert.ok(body.data.results);
    assert.ok(Array.isArray(body.data.results.mail));
    assert.ok(Array.isArray(body.data.results.chat));
    assert.ok(Array.isArray(body.data.results.calendar));
    assert.ok(Array.isArray(body.data.results.drive));
  });

  await t.test("5. Preferences GET and PUT update dashboard widget configuration", async () => {
    // Default preferences
    const getRes = await fetch(`${baseUrl}/preferences`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.ok(Array.isArray(getBody.data.widgetOrder));
    assert.equal(getBody.data.summaryStrip, true);

    // Update preferences
    const newOrder = ["calendar", "mail", "drive", "chat", "meet", "tasks", "activity"];
    const putRes = await fetch(`${baseUrl}/preferences`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        widgetOrder: newOrder,
        hiddenWidgets: ["tasks"],
        summaryStrip: false,
      }),
    });
    assert.equal(putRes.status, 200);
    const putBody = await putRes.json();
    assert.deepEqual(putBody.data.widgetOrder, newOrder);
    assert.deepEqual(putBody.data.hiddenWidgets, ["tasks"]);
    assert.equal(putBody.data.summaryStrip, false);

    // Verify persistence
    const reGetRes = await fetch(`${baseUrl}/preferences`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reGetBody = await reGetRes.json();
    assert.deepEqual(reGetBody.data.widgetOrder, newOrder);
    assert.deepEqual(reGetBody.data.hiddenWidgets, ["tasks"]);
    assert.equal(reGetBody.data.summaryStrip, false);
  });
});
