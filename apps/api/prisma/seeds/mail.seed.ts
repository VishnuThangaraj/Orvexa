import prisma from "../../src/config/prisma.js";
import type { User } from "../../src/generated/prisma/client.js";

type SeedUser = {
  id: bigint;
  fullName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
};

const EMAIL_TEMPLATES = [
  {
    subject: "Q4 Roadmap & Engineering Goals Discussion",
    body: "Hi team,\n\nPlease find the notes from our recent sprint planning session. We need to align on our key deliverables for the upcoming quarter.\n\nBest regards,\nEngineering Team",
  },
  {
    subject: "Security Audit and Penetration Test Results",
    body: "Team,\n\nThe quarterly security assessment has concluded. Please review the findings and prioritize the low-hanging fruit in the upcoming sprint.\n\nThanks,\nSecurity Team",
  },
  {
    subject: "New Team Member Onboarding - Welcome!",
    body: "Hello everyone,\n\nPlease join me in welcoming our newest team members to Orvexa. Let's make sure their dev environment is set up smoothly.\n\nCheers,\nHR Operations",
  },
  {
    subject: "Database Performance Tuning & Index Optimizations",
    body: "Hey folks,\n\nWe noticed some slow queries on the mail messages table during peak hours. Added composite indexes and saw query times drop by 80%.\n\nCheck out the metrics in the dashboard.",
  },
  {
    subject: "Weekly Standup Notes & Key Action Items",
    body: "Hi all,\n\nHere are the action items from today's standup:\n1. Complete auth flow tests\n2. Review PR #42\n3. Deploy staging update.\n\nLet me know if I missed anything.",
  },
  {
    subject: "Design System 2.0 Released in Figma",
    body: "Hi designers and frontend devs,\n\nThe new color tokens, typography, and button components are now live in our shared library. Please update your local copies.\n\nBest,\nDesign Lead",
  },
  {
    subject: "Quarterly Budget Forecast & Expense Approvals",
    body: "Dear colleagues,\n\nKindly submit all pending reimbursement requests by the end of this week for processing. Reach out if you have questions.\n\nFinance Department",
  },
  {
    subject: "Architecture Decision Record: Mail Service V2",
    body: "Hello Architecture Committee,\n\nWe drafted an ADR for threading and draft syncing in the mail module. Your feedback is requested before Friday EOD.\n\nRegards,\nTech Lead",
  },
  {
    subject: "Client Feedback on Recent Beta Release",
    body: "Team,\n\nThe client loved the new responsive layout and real-time notifications! Special shoutout to everyone who burned the midnight oil.\n\nProduct Manager",
  },
  {
    subject: "Upcoming System Maintenance Window (Sunday 2 AM)",
    body: "Dear team,\n\nWe will be upgrading the primary database cluster this Sunday from 2:00 AM to 4:00 AM UTC. Services might experience brief downtime.\n\nDevOps Team",
  },
  {
    subject: "Invitation: All-Hands Company Sync",
    body: "Hi everyone,\n\nYou are invited to our monthly all-hands sync. We will share company updates, celebrate milestones, and host an open Q&A.\n\nExecutive Team",
  },
  {
    subject: "API Rate Limiting Policy Updates",
    body: "Developers,\n\nPlease note that our public API rate limits have been updated to 100 requests per minute per IP. Update your integration tests accordingly.\n\nAPI Platform Team",
  },
  {
    subject: "Cloudinary Upload Pipeline Optimizations",
    body: "Hi,\n\nWe implemented chunked direct uploads and automatic thumbnail generation for image and video assets. Attachment uploads should now be twice as fast.\n\nBackend Team",
  },
  {
    subject: "Lunch & Learn: Multi-Agent AI Systems",
    body: "Hey everyone,\n\nJoin us this Thursday in the cafeteria or on LiveKit for a presentation on orchestrating autonomous coding agents. Pizza provided!\n\nAI Working Group",
  },
  {
    subject: "Office Facilities Update & New Parking Badges",
    body: "Dear staff,\n\nNew RFID access badges are ready at reception. Please collect yours before the end of the month.\n\nWorkplace Operations",
  },
  {
    subject: "Code Freeze for Upcoming Major Release",
    body: "Engineering,\n\nCode freeze begins tomorrow at 6 PM. Only critical bug fixes with two approvals will be merged until release day.\n\nRelease Manager",
  },
  {
    subject: "Customer Support Escalation: Ticket #9182",
    body: "Hi Support & Dev,\n\nAn enterprise customer reported an issue loading attachment previews on mobile browsers. Please investigate urgently.\n\nCustomer Success",
  },
  {
    subject: "Remote Work Policy & Guidelines Update",
    body: "Hi team,\n\nOur revised hybrid working guidelines are now published on the company portal. Feel free to reach out to HR if you need clarifications.\n\nPeople Team",
  },
  {
    subject: "Happy Birthday from the Orvexa Team!",
    body: "Wishing you a very happy birthday and a wonderful year ahead from all of us at Orvexa! Enjoy your day!\n\nWarm regards,\nOrvexa People Team",
  },
  {
    subject: "Retrospective Notes: October Milestones",
    body: "Team,\n\nThank you for participating in the sprint retro. The top three action items have been created as issues on our project board.\n\nScrum Master",
  },
  {
    subject: "Contract Agreement & NDA Renewal",
    body: "Hi,\n\nPlease review and e-sign the attached updated agreement at your earliest convenience.\n\nBest regards,\nLegal Department",
  },
  {
    subject: "Server Health Report & SLA Compliance",
    body: "Operations update:\n\nOur service uptime for the past 30 days reached 99.98%, well exceeding our SLA target of 99.9%. Great work everyone!\n\nInfrastructure Team",
  },
];

const DRAFT_TEMPLATES = [
  {
    subject: "Draft: Q1 Proposed Engineering Headcount",
    body: "Hi Leadership,\n\nHere is the proposed head-count expansion for engineering and product design in Q1...",
  },
  {
    subject: "Draft: Self-Assessment for Annual Performance Review",
    body: "Key Achievements:\n- Completed mail module overhaul and performance tuning\n- Mentored 2 onboarding engineers...",
  },
  {
    subject: "Draft: Vendor Comparison for Telemetry & Monitoring",
    body: "Evaluating Prometheus + Grafana vs Datadog for our Kubernetes clusters...",
  },
  {
    subject: "Draft: Re: Sprint Retrospective Action Items",
    body: "Regarding the automated test pipeline, I suggest we parallelize the integration suites...",
  },
  {
    subject: "Draft: RFC: Realtime Collaboration with LiveKit",
    body: "Proposal to integrate audio rooms and screen sharing directly inside conversation threads...",
  },
];

const LABELS_CONFIG = [
  { name: "Work", color: "#2563EB" },
  { name: "Important", color: "#DC2626" },
  { name: "Personal", color: "#16A34A" },
  { name: "Finance", color: "#D97706" },
  { name: "Urgent", color: "#9333EA" },
];

const FOLDERS_CONFIG = ["Projects", "Finance", "Archived"];

export const seedMails = async (users: SeedUser[]) => {
  if (users.length === 0) {
    console.log("[SEED] No users provided for mail seeding.");
    return;
  }

  console.log(`[SEED] Starting mail seeding for ${users.length} users...`);

  // 1. Clean existing mail records to ensure idempotent seed execution
  await prisma.mailMessage.deleteMany();
  await prisma.mailDraft.deleteMany();
  await prisma.mailFolder.deleteMany();
  await prisma.mailLabel.deleteMany();

  // 2. Seed single shared FileAsset for attachments
  const seedAsset = await prisma.fileAsset.upsert({
    where: {
      resourceType_deliveryType_publicId: {
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        publicId: "orvexa/mail/seed/sample-attachment.pdf",
      },
    },
    update: {},
    create: {
      publicId: "orvexa/mail/seed/sample-attachment.pdf",
      cloudinaryAssetId: "seed-sample-asset-1",
      resourceType: "RAW",
      deliveryType: "AUTHENTICATED",
      version: 1,
      format: "pdf",
      originalFilename: "quarterly-report-2026.pdf",
      mimeType: "application/pdf",
      bytes: BigInt(1048576), // 1 MB
      secureUrl:
        "https://res.cloudinary.com/orvexa/raw/upload/v1/orvexa/mail/seed/sample-attachment.pdf",
      uploadedBy: users[0]?.id ?? null,
    },
  });

  console.log(
    `[SEED] Seeded shared FileAsset: ${seedAsset.originalFilename} (ID: ${seedAsset.id})`,
  );

  // 3. Seed Labels and Folders for each user
  const userLabelsMap = new Map<string, { [name: string]: bigint }>();
  const userFoldersMap = new Map<string, { [name: string]: bigint }>();

  for (const user of users) {
    const labelIdObj: { [name: string]: bigint } = {};
    for (const lbl of LABELS_CONFIG) {
      const createdLabel = await prisma.mailLabel.create({
        data: {
          userId: user.id,
          name: lbl.name,
          color: lbl.color,
        },
      });
      labelIdObj[lbl.name] = createdLabel.id;
    }
    userLabelsMap.set(user.id.toString(), labelIdObj);

    const folderIdObj: { [name: string]: bigint } = {};
    for (const folderName of FOLDERS_CONFIG) {
      const createdFolder = await prisma.mailFolder.create({
        data: {
          userId: user.id,
          name: folderName,
        },
      });
      folderIdObj[folderName] = createdFolder.id;
    }
    userFoldersMap.set(user.id.toString(), folderIdObj);
  }

  console.log(`[SEED] Created default folders and labels for all users.`);

  // 4. Generate ~20 sent messages per user (each with receivers in Inbox, Starred, Archive, Trash)
  // Overall message count: users.length * 20 = ~420 messages
  // Each user sends 20, and receives ~25-30 messages -> total ~50 messages per user!
  const now = Date.now();
  let totalCreatedMessages = 0;

  for (let uIdx = 0; uIdx < users.length; uIdx++) {
    const sender = users[uIdx];
    const userCount = users.length;

    for (let m = 0; m < 20; m++) {
      const template =
        EMAIL_TEMPLATES[(uIdx * 20 + m) % EMAIL_TEMPLATES.length]!;

      // Stagger sent timestamps back across 30 days
      const minutesAgo = (uIdx * 20 + m) * 45;
      const sentAt = new Date(now - minutesAgo * 60 * 1000);

      // Determine recipients safely from the other users
      const toIndex = (uIdx + 1 + (m % (userCount - 1))) % userCount;
      const toUser = users[toIndex]!;

      const recipientsToCreate: Array<{
        userId: bigint;
        recipientType: "TO" | "CC" | "BCC";
      }> = [{ userId: toUser.id, recipientType: "TO" }];

      let ccUser: SeedUser | null = null;
      if (m % 3 === 0) {
        const ccIndex = (uIdx + 2 + (m % (userCount - 2))) % userCount;
        if (ccIndex !== toIndex && ccIndex !== uIdx) {
          ccUser = users[ccIndex]!;
          recipientsToCreate.push({ userId: ccUser.id, recipientType: "CC" });
        }
      }

      let bccUser: SeedUser | null = null;
      if (m % 5 === 0) {
        const bccIndex = (uIdx + 3 + (m % (userCount - 3))) % userCount;
        if (bccIndex !== toIndex && bccIndex !== uIdx && (ccUser ? bccIndex !== users.indexOf(ccUser) : true)) {
          bccUser = users[bccIndex]!;
          recipientsToCreate.push({ userId: bccUser.id, recipientType: "BCC" });
        }
      }

      // Create MailMessage
      const message = await prisma.mailMessage.create({
        data: {
          senderId: sender.id,
          subject: template.subject,
          body: template.body,
          sentAt,
          createdAt: sentAt,
          updatedAt: sentAt,
        },
      });

      // Self-reference threadId
      await prisma.mailMessage.update({
        where: { id: message.id },
        data: { threadId: message.id },
      });

      // Create MailRecipients
      await prisma.mailRecipient.createMany({
        data: recipientsToCreate.map((r) => ({
          messageId: message.id,
          userId: r.userId,
          recipientType: r.recipientType,
          createdAt: sentAt,
        })),
        skipDuplicates: true,
      });

      // Create MailUserStates
      const states: Array<{
        messageId: bigint;
        userId: bigint;
        isRead: boolean;
        readAt: Date | null;
        isStarred: boolean;
        isArchived: boolean;
        isTrashed: boolean;
        trashedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }> = [];

      // Sender State (Sent Mail)
      states.push({
        messageId: message.id,
        userId: sender.id,
        isRead: true,
        readAt: sentAt,
        isStarred: m % 7 === 0,
        isArchived: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: sentAt,
        updatedAt: sentAt,
      });

      // TO User State (Inbox / Archived / Trash / Starred distribution)
      const isArchived = m % 8 === 0;
      const isTrashed = !isArchived && m % 9 === 0;
      const isRead = isArchived || isTrashed || m % 2 !== 0;
      const isStarred = !isTrashed && m % 4 === 0;

      states.push({
        messageId: message.id,
        userId: toUser.id,
        isRead,
        readAt: isRead ? new Date(sentAt.getTime() + 60000) : null,
        isStarred,
        isArchived,
        isTrashed,
        trashedAt: isTrashed ? new Date(sentAt.getTime() + 120000) : null,
        createdAt: sentAt,
        updatedAt: sentAt,
      });

      // CC User State
      if (ccUser) {
        states.push({
          messageId: message.id,
          userId: ccUser.id,
          isRead: m % 2 === 0,
          readAt: m % 2 === 0 ? new Date(sentAt.getTime() + 90000) : null,
          isStarred: m % 5 === 0,
          isArchived: false,
          isTrashed: false,
          trashedAt: null,
          createdAt: sentAt,
          updatedAt: sentAt,
        });
      }

      // BCC User State
      if (bccUser) {
        states.push({
          messageId: message.id,
          userId: bccUser.id,
          isRead: false,
          readAt: null,
          isStarred: false,
          isArchived: false,
          isTrashed: false,
          trashedAt: null,
          createdAt: sentAt,
          updatedAt: sentAt,
        });
      }

      await prisma.mailUserState.createMany({
        data: states,
        skipDuplicates: true,
      });

      // Attach file to selected messages (every 4th message) using the single shared FileAsset
      if (m % 4 === 0) {
        await prisma.mailAttachment.create({
          data: {
            messageId: message.id,
            assetId: seedAsset.id,
            createdAt: sentAt,
          },
        });
      }

      // Assign labels for toUser (e.g. Work or Important)
      const toUserLabels = userLabelsMap.get(toUser.id.toString());
      if (toUserLabels) {
        if (m % 3 === 0 && toUserLabels["Work"]) {
          await prisma.mailMessageLabel.create({
            data: {
              userId: toUser.id,
              messageId: message.id,
              labelId: toUserLabels["Work"]!,
              createdAt: sentAt,
            },
          });
        } else if (m % 5 === 0 && toUserLabels["Important"]) {
          await prisma.mailMessageLabel.create({
            data: {
              userId: toUser.id,
              messageId: message.id,
              labelId: toUserLabels["Important"]!,
              createdAt: sentAt,
            },
          });
        }
      }

      // Assign folder for toUser
      const toUserFolders = userFoldersMap.get(toUser.id.toString());
      if (toUserFolders && m % 6 === 0 && toUserFolders["Projects"]) {
        await prisma.mailFolderMessage.create({
          data: {
            folderId: toUserFolders["Projects"]!,
            messageId: message.id,
            createdAt: sentAt,
          },
        });
      }

      totalCreatedMessages++;
    }
  }

  console.log(
    `[SEED] Seeded ${totalCreatedMessages} mail messages across inbox, sent, archive, trash, and labels.`,
  );

  // 5. Seed 5 Drafts for each user
  let totalCreatedDrafts = 0;
  for (let uIdx = 0; uIdx < users.length; uIdx++) {
    const user = users[uIdx]!;
    const nextUser = users[(uIdx + 1) % users.length]!;

    for (let d = 0; d < DRAFT_TEMPLATES.length; d++) {
      const draftTpl = DRAFT_TEMPLATES[d]!;
      const draftDate = new Date(now - (d + 1) * 3600 * 1000);

      const draft = await prisma.mailDraft.create({
        data: {
          userId: user.id,
          subject: draftTpl.subject,
          body: draftTpl.body,
          createdAt: draftDate,
          updatedAt: draftDate,
        },
      });

      // Add draft recipient
      await prisma.mailDraftRecipient.create({
        data: {
          draftId: draft.id,
          userId: nextUser.id,
          recipientType: "TO",
          createdAt: draftDate,
        },
      });

      // Add attachment to the first draft of each user using the shared FileAsset
      if (d === 0) {
        await prisma.mailDraftAttachment.create({
          data: {
            draftId: draft.id,
            assetId: seedAsset.id,
            createdAt: draftDate,
          },
        });
      }

      totalCreatedDrafts++;
    }
  }

  console.log(`[SEED] Seeded ${totalCreatedDrafts} drafts across all users.`);
  console.log(`[SEED] Mail seeding completed successfully!`);
};
