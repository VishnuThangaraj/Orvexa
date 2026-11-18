import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import env from "../../src/config/env.js";
import { generateAccessToken } from "../../src/common/utils/jwt.js";

test("Calendar REST API Routes Integration Tests", async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}/api/calendar`;

  const adminUser = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });
  assert.ok(adminUser, "Admin user must exist");

  const memberUser = await prisma.user.findFirst({
    where: { email: "vignesh@gmail.com" },
  });
  assert.ok(memberUser, "Member user must exist");

  const adminToken = generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
  });

  const memberToken = generateAccessToken({
    id: memberUser.id,
    role: memberUser.role,
  });

  const cleanupEventIds: bigint[] = [];
  const cleanupCalendarIds: bigint[] = [];
  const cleanupTaskIds: bigint[] = [];

  t.after(async () => {
    if (cleanupEventIds.length > 0) {
      await prisma.calendarEvent.deleteMany({
        where: { id: { in: cleanupEventIds } },
      });
    }
    if (cleanupCalendarIds.length > 0) {
      await prisma.userCalendar.deleteMany({
        where: { id: { in: cleanupCalendarIds } },
      });
    }
    if (cleanupTaskIds.length > 0) {
      await prisma.calendarTask.deleteMany({
        where: { id: { in: cleanupTaskIds } },
      });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  let customCalendarId: string;
  let testEventId: string;
  let recurringEventId: string;
  let testTaskId: string;

  await t.test("1. GET /calendars auto-provisions default user calendars", async () => {
    const res = await fetch(`${baseUrl}/calendars`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 4);

    const primary = json.data.find((c: any) => c.isPrimary);
    assert.ok(primary, "Primary calendar must exist");
    const holidays = json.data.find((c: any) => c.systemType === "HOLIDAYS");
    assert.ok(holidays, "Holidays calendar must exist");
  });

  await t.test("2. POST /calendars creates a new custom calendar", async () => {
    const res = await fetch(`${baseUrl}/calendars`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Project Sprint Reviews",
        color: "#8e24aa",
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.name, "Project Sprint Reviews");
    assert.equal(json.data.color, "#8e24aa");

    customCalendarId = json.data.id;
    cleanupCalendarIds.push(BigInt(customCalendarId));
  });

  await t.test("3. PATCH /calendars/:id updates calendar properties", async () => {
    const res = await fetch(`${baseUrl}/calendars/${customCalendarId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        color: "#d81b60",
        isVisible: false,
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.color, "#d81b60");
    assert.equal(json.data.isVisible, false);
  });

  await t.test("4. POST /events creates a calendar event with participants and reminders", async () => {
    const startTime = "2026-11-18T10:00:00.000Z";
    const endTime = "2026-11-18T11:00:00.000Z";

    const res = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Architecture Planning Sync",
        description: "Review calendar module architecture and UI specs",
        startTime,
        endTime,
        location: "Virtual Meeting Room 1",
        calendarId: customCalendarId,
        color: "#0288d1",
        guestUserIds: [String(memberUser.id)],
        reminders: [{ minutesBefore: 15 }, { minutesBefore: 30 }],
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.title, "Architecture Planning Sync");
    assert.equal(json.data.calendarId, customCalendarId);
    assert.equal(json.data.participants.length, 2); // Admin (accepted) + Member (pending)
    assert.equal(json.data.reminders.length, 2);

    testEventId = json.data.id;
    cleanupEventIds.push(BigInt(testEventId));
  });

  await t.test("5. GET /events returns events within visible date range", async () => {
    const res = await fetch(
      `${baseUrl}/events?start=2026-11-18T00:00:00.000Z&end=2026-11-18T23:59:59.000Z`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));

    const found = json.data.find((e: any) => e.id === testEventId);
    assert.ok(found, "Created event should be in range");
  });

  await t.test("6. PATCH /events/:id/rsvp updates participant RSVP response", async () => {
    const res = await fetch(`${baseUrl}/events/${testEventId}/rsvp`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ responseStatus: "ACCEPTED" }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.responseStatus, "ACCEPTED");
  });

  await t.test("7. GET /events with includeDeclined=false filters declined events", async () => {
    // Member changes RSVP to DECLINED
    await fetch(`${baseUrl}/events/${testEventId}/rsvp`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ responseStatus: "DECLINED" }),
    });

    // Query with includeDeclined=false
    const res = await fetch(
      `${baseUrl}/events?start=2026-11-18T00:00:00.000Z&end=2026-11-18T23:59:59.000Z&includeDeclined=false`,
      {
        headers: { Authorization: `Bearer ${memberToken}` },
      },
    );

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    const found = json.data.find((e: any) => e.id === testEventId);
    assert.equal(found, undefined, "Declined event should be filtered out");
  });

  await t.test("8. POST /events creates a recurring event and expands occurrences", async () => {
    const res = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Daily Standup",
        startTime: "2026-11-01T09:00:00.000Z",
        endTime: "2026-11-01T09:30:00.000Z",
        recurrenceRule: "FREQ=DAILY;INTERVAL=1",
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    recurringEventId = json.data.id;
    cleanupEventIds.push(BigInt(recurringEventId));

    // Query 5 days range
    const rangeRes = await fetch(
      `${baseUrl}/events?start=2026-11-10T00:00:00.000Z&end=2026-11-14T23:59:59.000Z`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    assert.equal(rangeRes.status, 200);
    const rangeJson = await rangeRes.json();
    const instances = rangeJson.data.filter(
      (e: any) => e.masterEventId === recurringEventId,
    );
    assert.equal(instances.length, 5, "5 daily occurrences should be expanded");
  });

  await t.test("9. DELETE /events/:id?recurrenceMode=SINGLE excludes specific date", async () => {
    const targetDate = "2026-11-12T09:00:00.000Z";
    const res = await fetch(
      `${baseUrl}/events/${recurringEventId}?recurrenceMode=SINGLE&targetInstanceDate=${targetDate}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    assert.equal(res.status, 200);

    // Verify 12th is excluded
    const rangeRes = await fetch(
      `${baseUrl}/events?start=2026-11-10T00:00:00.000Z&end=2026-11-14T23:59:59.000Z`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    const rangeJson = await rangeRes.json();
    const instances = rangeJson.data.filter(
      (e: any) => e.masterEventId === recurringEventId,
    );
    assert.equal(instances.length, 4, "Should have 4 occurrences (12th skipped)");
    const has12th = instances.some(
      (e: any) => e.startTime.startsWith("2026-11-12"),
    );
    assert.equal(has12th, false, "12th November should be excluded");
  });

  await t.test("10. Tasks CRUD endpoints", async () => {
    // Create Task
    const createRes = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Ship Calendar UI",
        details: "Complete month and week views",
        dueDate: "2026-11-20T18:00:00.000Z",
      }),
    });

    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    assert.equal(createJson.data.title, "Ship Calendar UI");
    assert.equal(createJson.data.isCompleted, false);

    testTaskId = createJson.data.id;
    cleanupTaskIds.push(BigInt(testTaskId));

    // Get Tasks
    const getRes = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    const taskFound = getJson.data.find((t: any) => t.id === testTaskId);
    assert.ok(taskFound);

    // Update Task (complete)
    const updateRes = await fetch(`${baseUrl}/tasks/${testTaskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isCompleted: true }),
    });

    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.data.isCompleted, true);
    assert.ok(updateJson.data.completedAt);

    // Delete Task
    const deleteRes = await fetch(`${baseUrl}/tasks/${testTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteRes.status, 200);
  });

  await t.test("11. Settings GET & PATCH endpoints", async () => {
    const getRes = await fetch(`${baseUrl}/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.success, true);
    assert.ok(getJson.data.defaultView);

    const patchRes = await fetch(`${baseUrl}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        defaultView: "month",
        showWeekends: false,
        timezone: "Asia/Kolkata",
      }),
    });

    assert.equal(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.equal(patchJson.data.defaultView, "month");
    assert.equal(patchJson.data.showWeekends, false);
  });

  await t.test("12. DELETE /calendars/:id rejects deleting primary calendar", async () => {
    const getCals = await fetch(`${baseUrl}/calendars`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const calsJson = await getCals.json();
    const primary = calsJson.data.find((c: any) => c.isPrimary);

    const deleteRes = await fetch(`${baseUrl}/calendars/${primary.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(deleteRes.status, 400);
    const deleteJson = await deleteRes.json();
    assert.match(deleteJson.message, /primary/i);
  });
});
