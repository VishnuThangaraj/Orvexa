import "../src/common/utils/bigint.js";
import prisma from "../src/infrastructure/database/prisma.js";

async function runVerification() {
  console.log("=== ORVEXA SCHEMA & CLOUDINARY VERIFICATION SUITE ===\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetails?: unknown) {
    if (condition) {
      console.log(`✔ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${testName}`);
      if (errorDetails) console.error("   Details:", errorDetails);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: BigInt JSON Serialization
    // -------------------------------------------------------------
    const sampleBigIntObj = { id: 987654321012345678n, name: "BigInt Test" };
    const jsonStr = JSON.stringify(sampleBigIntObj);
    assert(
      jsonStr === '{"id":"987654321012345678","name":"BigInt Test"}',
      "BigInt JSON serialization converts BigInt to string without error"
    );

    // -------------------------------------------------------------
    // Setup Test Fixtures: Create Users
    // -------------------------------------------------------------
    const testTimestamp = Date.now();
    const userA = await prisma.user.create({
      data: {
        fullName: "Alice User",
        username: `alice_${testTimestamp}`,
        email: `alice_${testTimestamp}@example.com`,
        phone: "+1234567890",
        dob: new Date("1995-05-15"),
        gender: "Female",
        address: "123 Tech Avenue",
        role: "MEMBER",
        preferences: {
          create: {
            theme: "dark",
            language: "en",
            timezone: "America/New_York",
            notificationPreferences: { email: true, push: false },
          },
        },
      },
    });

    const userB = await prisma.user.create({
      data: {
        fullName: "Bob User",
        username: `bob_${testTimestamp}`,
        email: `bob_${testTimestamp}@example.com`,
        role: "MEMBER",
      },
    });

    assert(
      typeof userA.id === "bigint" && userA.fullName === "Alice User",
      "User creation with preferences and BIGINT PK succeeded"
    );

    // -------------------------------------------------------------
    // Test 2: File Assets Creation (Cloudinary Storage Schema)
    // -------------------------------------------------------------
    const asset1 = await prisma.fileAsset.create({
      data: {
        cloudinaryAssetId: `cld_asset_${testTimestamp}_1`,
        publicId: `orvexa/uploads/${testTimestamp}/document.pdf`,
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        version: 1,
        format: "pdf",
        originalFilename: "Contract_2026.pdf",
        mimeType: "application/pdf",
        bytes: 1048576n, // 1MB
        secureUrl: "https://res.cloudinary.com/demo/raw/authenticated/contract.pdf",
        uploadedBy: userA.id,
      },
    });

    const assetAvatar = await prisma.fileAsset.create({
      data: {
        cloudinaryAssetId: `cld_asset_${testTimestamp}_avatar`,
        publicId: `orvexa/avatars/${testTimestamp}/alice.jpg`,
        resourceType: "IMAGE",
        deliveryType: "UPLOAD",
        version: 1,
        format: "jpg",
        originalFilename: "alice_headshot.jpg",
        mimeType: "image/jpeg",
        bytes: 204800n,
        width: 400,
        height: 400,
        secureUrl: "https://res.cloudinary.com/demo/image/upload/alice.jpg",
        uploadedBy: userA.id,
      },
    });

    assert(
      asset1.deliveryType === "AUTHENTICATED" && asset1.resourceType === "RAW" && asset1.bytes === 1048576n,
      "FileAsset created with full Cloudinary identifiers and metadata"
    );

    // -------------------------------------------------------------
    // Test 3: Asset Reuse Across Features (Avatar, Org Logo, Mail, Chat, Drive, Meeting)
    // -------------------------------------------------------------
    // 3a: User avatar
    await prisma.user.update({
      where: { id: userA.id },
      data: { profileImageId: assetAvatar.id },
    });

    // 3b: Mail attachment reuse
    const mailMsg = await prisma.mailMessage.create({
      data: {
        senderId: userA.id,
        subject: "Contract for Review",
        body: "Please find the attached document.",
        recipients: {
          create: {
            userId: userB.id,
            recipientType: "TO",
          },
        },
        attachments: {
          create: {
            assetId: asset1.id,
          },
        },
      },
    });

    // 3c: Chat message attachment reuse
    const lowId = userA.id < userB.id ? userA.id : userB.id;
    const highId = userA.id < userB.id ? userB.id : userA.id;

    const conv = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        directUserLowId: lowId,
        directUserHighId: highId,
        createdBy: userA.id,
        participants: {
          createMany: {
            data: [
              { userId: userA.id, memberRole: "ADMIN" },
              { userId: userB.id, memberRole: "MEMBER" },
            ],
          },
        },
      },
    });

    const chatMsg = await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: userA.id,
        content: "Shared document in chat",
        messageType: "FILE",
        attachments: {
          create: {
            assetId: asset1.id,
          },
        },
      },
    });

    // 3d: Drive File with same asset
    const driveFolder = await prisma.driveFolder.create({
      data: {
        name: "Contracts",
        ownerId: userA.id,
      },
    });

    const driveFile = await prisma.driveFile.create({
      data: {
        name: "Signed_Contract.pdf",
        ownerId: userA.id,
        folderId: driveFolder.id,
        assetId: asset1.id,
        currentVersion: 1,
        versions: {
          create: {
            versionNumber: 1,
            assetId: asset1.id,
            uploadedBy: userA.id,
          },
        },
      },
    });

    // 3e: Meeting Recording with video asset
    const recordingAsset = await prisma.fileAsset.create({
      data: {
        publicId: `orvexa/recordings/${testTimestamp}/meeting_rec.mp4`,
        resourceType: "VIDEO",
        deliveryType: "AUTHENTICATED",
        originalFilename: "meeting_recording.mp4",
        mimeType: "video/mp4",
        bytes: 52428800n, // 50MB
        durationSeconds: 1845.5,
      },
    });

    const meeting = await prisma.meeting.create({
      data: {
        title: "Sprint Review",
        hostId: userA.id,
        roomName: `room_${testTimestamp}`,
        meetingCode: `meet_${testTimestamp}`,
        recordings: {
          create: {
            assetId: recordingAsset.id,
            startedBy: userA.id,
          },
        },
      },
    });

    assert(
      Boolean(mailMsg.id && chatMsg.id && driveFile.id && meeting.id),
      "Asset reuse verified across User Avatar, Mail, Chat, Drive, and Meeting"
    );

    // -------------------------------------------------------------
    // Test 4: Delete Rules (Restrict Asset Deletion & Cascade)
    // -------------------------------------------------------------
    let deleteRestricted = false;
    try {
      // Attempt to delete asset1 while referenced by mail_attachments, chat_attachments, and drive_files
      await prisma.fileAsset.delete({
        where: { id: asset1.id },
      });
    } catch {
      deleteRestricted = true;
    }
    assert(
      deleteRestricted,
      "Referential Integrity: Deleting file_asset referenced by other tables is RESTRICTED"
    );

    // Test Cascade: deleting conversation cascades to chat_messages and chat_attachments
    await prisma.conversation.delete({
      where: { id: conv.id },
    });
    const orphanedMessages = await prisma.chatMessage.findMany({
      where: { id: chatMsg.id },
    });
    assert(
      orphanedMessages.length === 0,
      "Delete Cascade: Deleting conversation cascaded and removed child messages and attachments"
    );

    // -------------------------------------------------------------
    // Test 5: Raw SQL Constraints Verification
    // -------------------------------------------------------------

    // 5a: calendar_events start_time < end_time
    let invalidCalendarRejected = false;
    try {
      await prisma.calendarEvent.create({
        data: {
          title: "Invalid Window Event",
          createdBy: userA.id,
          startTime: new Date("2026-12-01T15:00:00Z"),
          endTime: new Date("2026-12-01T14:00:00Z"), // end before start!
        },
      });
    } catch {
      invalidCalendarRejected = true;
    }
    assert(
      invalidCalendarRejected,
      "Raw SQL CHECK constraint: calendar_events rejects start_time >= end_time"
    );

    // 5b: conversations DIRECT user low < high check
    let invalidDirectConvRejected = false;
    try {
      await prisma.conversation.create({
        data: {
          type: "DIRECT",
          directUserLowId: highId, // inverted low >= high!
          directUserHighId: lowId,
          createdBy: userA.id,
        },
      });
    } catch {
      invalidDirectConvRejected = true;
    }
    assert(
      invalidDirectConvRejected,
      "Raw SQL CHECK constraint: conversations rejects DIRECT where low >= high"
    );

    // 5c: conversations CHANNEL visibility check
    let invalidChannelRejected = false;
    try {
      await prisma.conversation.create({
        data: {
          type: "CHANNEL",
          visibility: null, // CHANNEL requires visibility!
          createdBy: userA.id,
        },
      });
    } catch {
      invalidChannelRejected = true;
    }
    assert(
      invalidChannelRejected,
      "Raw SQL CHECK constraint: conversations rejects CHANNEL without visibility"
    );

    // 5d: drive_permissions exactly-one target check
    let invalidDrivePermRejected = false;
    try {
      await prisma.drivePermission.create({
        data: {
          userId: userB.id,
          fileId: driveFile.id,
          folderId: driveFolder.id, // BOTH file and folder set!
          accessLevel: "VIEWER",
          grantedBy: userA.id,
        },
      });
    } catch {
      invalidDrivePermRejected = true;
    }
    assert(
      invalidDrivePermRejected,
      "Raw SQL CHECK constraint: drive_permissions rejects both file_id and folder_id set"
    );

    // 5e: drive_favorites partial unique index
    await prisma.driveFavorite.create({
      data: {
        userId: userA.id,
        fileId: driveFile.id,
      },
    });

    let duplicateFavoriteRejected = false;
    try {
      await prisma.driveFavorite.create({
        data: {
          userId: userA.id,
          fileId: driveFile.id, // Duplicate file favorite for userA
        },
      });
    } catch {
      duplicateFavoriteRejected = true;
    }
    assert(
      duplicateFavoriteRejected,
      "Raw SQL Partial Unique Index: drive_favorites rejects duplicate (file_id, user_id)"
    );

    console.log(`\n=== RESULTS: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Unexpected error during verification run:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
