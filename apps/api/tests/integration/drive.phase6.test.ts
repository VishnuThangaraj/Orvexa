import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../src/infrastructure/database/prisma.js";
import { driveService } from "../../src/modules/drive/drive.service.js";
import CalendarService from "../../src/modules/calendar/calendar.service.js";

const calendarService = new CalendarService();

describe("Phase 6: Cross-Module Integrations (Mail, Chat, Calendar, Meet & DrivePicker)", () => {
  let user1: any;
  let user2: any;
  let sampleAsset: any;
  let driveFile: any;

  before(async () => {
    const unique = Date.now();

    user1 = await prisma.user.create({
      data: {
        fullName: "Cross Module User 1",
        username: `cross_u1_${unique}`,
        email: `cross_u1_${unique}@test.com`,
      },
    });

    user2 = await prisma.user.create({
      data: {
        fullName: "Cross Module User 2",
        username: `cross_u2_${unique}`,
        email: `cross_u2_${unique}@test.com`,
      },
    });

    // Create an existing FileAsset as if uploaded in Mail or Chat
    sampleAsset = await prisma.fileAsset.create({
      data: {
        publicId: `mail_asset_${unique}`,
        originalFilename: "quarterly_budget_plan.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        bytes: BigInt(4096),
        resourceType: "RAW",
        format: "xlsx",
        secureUrl: "http://localhost:5155/uploads/quarterly_budget_plan.xlsx",
        uploadedBy: user1.id,
      },
    });

    // Also upload a regular Drive file for sharing and calendar tests
    const [file] = await driveService.uploadFiles(
      user1.id,
      [
        {
          originalname: "project_charter.pdf",
          buffer: Buffer.from("Charter contents for project alpha"),
          mimetype: "application/pdf",
          size: 34,
        },
      ],
      null,
    );
    driveFile = file;
  });

  after(async () => {
    await prisma.calendarEventAttachment.deleteMany();
    await prisma.calendarParticipant.deleteMany();
    await prisma.calendarEvent.deleteMany();
    await prisma.userCalendar.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.drivePermission.deleteMany();
    await prisma.driveActivity.deleteMany();
    await prisma.driveRecentItem.deleteMany();
    await prisma.driveFileVersion.deleteMany();
    await prisma.driveFile.deleteMany();
    await prisma.driveFolder.deleteMany();
    await prisma.fileAsset.deleteMany({
      where: {
        uploadedBy: { in: [user1.id, user2.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [user1.id, user2.id] },
      },
    });
  });

  it("1. Save Asset to Drive (from Mail/Chat attachment): creates DriveFile and audit log", async () => {
    const savedFile = await driveService.saveAssetToDrive(user2.id, {
      assetId: String(sampleAsset.id),
      filename: "custom_saved_name.xlsx",
    });

    assert.ok(savedFile, "Saved file should exist");
    assert.equal(savedFile.name, "custom_saved_name.xlsx");
    assert.equal(String(savedFile.owner.id), String(user2.id));
    assert.equal(String(savedFile.asset.id), String(sampleAsset.id));

    // Check activity log
    const activities = await driveService.listActivities(user2.id, { fileId: savedFile.id });
    assert.ok(activities.length > 0, "Activity should be recorded");
    assert.equal(activities[0].action, "UPLOADED");
  });

  it("2. Batch Share with Recipients: grants access and creates real notifications", async () => {
    const result = await driveService.batchEnsureRecipientsAccess(user1.id, {
      fileIds: [driveFile.id],
      recipientEmails: [user2.email, "external_invitee@company.org"],
      role: "VIEWER",
    });

    assert.ok(result.length > 0, "Should return result array");
    const user2Res = result.find((r) => r.email === user2.email.toLowerCase());
    assert.ok(user2Res && user2Res.granted, "User 2 should have granted access");

    // Verify user2 permission exists in database
    const permResult = await driveService.listPermissions(user1.id, { fileId: BigInt(driveFile.id) });
    const user2Perm = permResult.permissions.find((p) => p.user.id === String(user2.id));
    assert.ok(user2Perm, "User 2 should have permission record");
    assert.equal(user2Perm.accessLevel, "VIEWER");

    // Verify notification was created for user2
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user2.id,
        type: "DRIVE",
      },
    });
    assert.ok(notifications.length > 0, "User 2 should receive a notification");
    assert.match(notifications[0].title, /shared/i);
  });

  it("3. Calendar Integration: Event attachments and automatic guest permission grant", async () => {
    // Setup primary calendar for user1
    const primaryCal = await prisma.userCalendar.create({
      data: {
        userId: user1.id,
        name: "Personal",
        color: "#039be5",
        isVisible: true,
        isPrimary: true,
        isSystem: false,
      },
    });

    // Create event with Drive file attached and user2 as guest
    const event = await calendarService.createEvent(
      user1.id,
      {
        title: "Project Alpha Kickoff",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        calendarId: String(primaryCal.id),
        guestUserIds: [user2.id],
        attachments: [
          {
            fileId: driveFile.id,
            title: driveFile.name,
            mimeType: "application/pdf",
            sizeBytes: 34,
          },
        ],
      },
    );

    assert.ok(event, "Event should be created");
    assert.ok(event.attachments && event.attachments.length === 1, "Attachment should be present on event");
    assert.equal(event.attachments[0].title, driveFile.name);
    assert.equal(event.attachments[0].fileId, driveFile.id);

    // Check calendar_event_attachments row in DB
    const dbAttachment = await prisma.calendarEventAttachment.findFirst({
      where: { eventId: BigInt(event.id) },
    });
    assert.ok(dbAttachment, "Attachment row must exist in calendar_event_attachments");
    assert.equal(String(dbAttachment.driveFileId), driveFile.id);

    // Verify user2 has access to driveFile
    const user2File = await driveService.getFile(user2.id, BigInt(driveFile.id));
    assert.ok(user2File, "User 2 (guest) should be able to get attached Drive file details");
    assert.equal(user2File.id, driveFile.id);
  });

  it("4. Meet Recording Service Hook: saves recording into Meet Recordings folder", async () => {
    // Create an asset representing a Meet recording
    const recordingAsset = await prisma.fileAsset.create({
      data: {
        publicId: `meet_recording_${Date.now()}`,
        originalFilename: "meeting_standup_rec.mp4",
        mimeType: "video/mp4",
        bytes: BigInt(10485760), // 10MB
        resourceType: "VIDEO",
        format: "mp4",
        secureUrl: "http://localhost:5155/recordings/meeting_standup_rec.mp4",
        uploadedBy: user1.id,
      },
    });

    const recordedFile = await driveService.storeMeetingRecordingInDrive(user1.id, {
      meetingId: "meet-test-123",
      title: "Weekly Standup Recording",
      assetId: String(recordingAsset.id),
    });

    assert.ok(recordedFile, "Recorded file should be created");
    assert.ok(recordedFile.name.startsWith("Weekly Standup Recording"), "File name should start with meeting title");
    assert.ok(recordedFile.name.endsWith(".mp4"), "File name should end with .mp4");

    // Verify the folder "Meet Recordings" was automatically created
    const parentFolder = await prisma.driveFolder.findUnique({
      where: { id: BigInt(recordedFile.folderId) },
    });
    assert.ok(parentFolder, "Folder must exist");
    assert.equal(parentFolder.name, "Meet Recordings");
  });
});
