import prisma from "../../src/config/prisma.js";

type SeedUser = {
  id: bigint;
  fullName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
};

const INBOX_TEMPLATES = [
  {
    subject: "Your Google Play Order Receipt from Sep 24, 2026",
    body: "Google Play\n\nThank you. You've made a purchase from Google Play on Sep 24, 2026. Order number: GPA.3341-9821-4491-09182.\n\nItem: Cloud Storage Expansion (100GB)\nAmount: $1.99\nPayment Method: Visa •••• 4242\n\nIf you have any questions, visit our support center.",
    hasAttachments: false,
  },
  {
    subject: "Shnoor International LLC Confirmation of Joining and Document Submission",
    body: "Hello Vishnu,\n\nWelcome to Shnoor International LLC! We are excited to have you join our engineering team. Please submit the signed offer letter, identification proof, and emergency contact form before Monday.\n\nWarm regards,\nHuman Resources Team\nShnoor International LLC",
    hasAttachments: true,
  },
  {
    subject: "Shnoor International LLC Submission of No Objection Certificate (NOC) for Internship",
    body: "Hello Hiring Team,\n\nPlease find attached my official No Objection Certificate (NOC) issued by KPR Institute of Engineering and Technology for the Summer Internship duration.\n\nKindly acknowledge receipt of the document.\n\nBest regards,\nVishnu Thangaraj",
    hasAttachments: true,
  },
  {
    subject: "Submission of Summer Internship Program 2026 – Assignments 1 to 10 (Enrollment No. 845488)",
    body: "Hello Sir/Madam,\n\nPlease find attached the consolidated report for Assignments 1 through 10 completed during the Summer Internship Program 2026.\n\nCandidate: Vishnu Thangaraj\nEnrollment: 845488\nTrack: Fullstack & Distributed Systems\n\nLooking forward to your evaluation.",
    hasAttachments: true,
  },
  {
    subject: "Shnoor International LLC Acceptance of Offer – Software Engineer Intern",
    body: "Dear HR Team,\n\nI am thrilled to formally accept the offer for the Software Engineer Intern role at Shnoor International LLC. I have reviewed the terms and conditions outlined in the agreement.\n\nThank you for this wonderful opportunity.\n\nSincerely,\nVishnu Thangaraj",
    hasAttachments: true,
  },
  {
    subject: "Sync Failure and Authentication Server Issue Across Devices",
    body: "Hi Vishnu,\n\nThank you for reaching out. The issue you encountered with token refreshes across secondary mobile sessions has been identified in the redis cluster failover handler. A hotfix has been pushed to staging.\n\nPlease verify when possible.\n\nBest,\nPlatform Support",
    hasAttachments: false,
  },
  {
    subject: "Image & Video Date Fixer - Release v2.4 Notes",
    body: "Hey,\n\nOn start of the app it should restore the premium version itself if installed on the same Google account. We also improved EXIF metadata extraction for HEIC and WebP formats.\n\nCheck out the full release changelog attached.",
    hasAttachments: false,
  },
  {
    subject: "Annual reminder about Google Pay's Terms of Service, Consumer Policy and Privacy Policy",
    body: "Hello Vishnu,\n\nWe wish you a great 2026! As part of our commitment to transparency, we are sending you this annual reminder regarding Google Pay's Terms of Service and Privacy Policy.\n\nNo action is required if you agree with the terms.",
    hasAttachments: false,
  },
  {
    subject: "Q4 Roadmap & Engineering Goals Discussion",
    body: "Hi team,\n\nPlease find the notes from our recent sprint planning session. We need to align on our key deliverables for the upcoming quarter including the mail client improvements.\n\nBest regards,\nEngineering Team",
    hasAttachments: true,
  },
  {
    subject: "Security Audit and Penetration Test Results",
    body: "Team,\n\nThe quarterly security assessment has concluded. Please review the findings and prioritize the low-hanging fruit in the upcoming sprint.\n\nThanks,\nSecurity Team",
    hasAttachments: true,
  },
  {
    subject: "New Team Member Onboarding - Welcome!",
    body: "Hello everyone,\n\nPlease join me in welcoming our newest team members to Orvexa. Let's make sure their dev environment is set up smoothly.\n\nCheers,\nHR Operations",
    hasAttachments: false,
  },
  {
    subject: "Database Performance Tuning & Index Optimizations",
    body: "Hey folks,\n\nWe noticed some slow queries on the mail messages table during peak hours. Added composite indexes and saw query times drop by 80%.\n\nCheck out the metrics in the dashboard.",
    hasAttachments: false,
  },
  {
    subject: "Weekly Standup Notes & Key Action Items",
    body: "Hi all,\n\nHere are the action items from today's standup:\n1. Complete auth flow tests\n2. Review PR #42\n3. Deploy staging update.\n\nLet me know if I missed anything.",
    hasAttachments: false,
  },
  {
    subject: "Design System 2.0 Released in Figma",
    body: "Hi designers and frontend devs,\n\nThe new color tokens, typography, and button components are now live in our shared library. Please update your local copies.\n\nBest,\nDesign Lead",
    hasAttachments: true,
  },
  {
    subject: "Quarterly Budget Forecast & Expense Approvals",
    body: "Dear colleagues,\n\nKindly submit all pending reimbursement requests by the end of this week for processing. Reach out if you have questions.\n\nFinance Department",
    hasAttachments: true,
  },
  {
    subject: "Architecture Decision Record: Mail Service V2",
    body: "Hello Architecture Committee,\n\nWe drafted an ADR for threading and draft syncing in the mail module. Your feedback is requested before Friday EOD.\n\nRegards,\nTech Lead",
    hasAttachments: true,
  },
  {
    subject: "Client Feedback on Recent Beta Release",
    body: "Team,\n\nThe client loved the new responsive layout and real-time notifications! Special shoutout to everyone who burned the midnight oil.\n\nProduct Manager",
    hasAttachments: false,
  },
  {
    subject: "Upcoming System Maintenance Window (Sunday 2 AM)",
    body: "Dear team,\n\nWe will be upgrading the primary database cluster this Sunday from 2:00 AM to 4:00 AM UTC. Services might experience brief downtime.\n\nDevOps Team",
    hasAttachments: false,
  },
  {
    subject: "Invitation: All-Hands Company Sync",
    body: "Hi everyone,\n\nYou are invited to our monthly all-hands sync. We will share company updates, celebrate milestones, and host an open Q&A.\n\nExecutive Team",
    hasAttachments: false,
  },
  {
    subject: "API Rate Limiting Policy Updates",
    body: "Developers,\n\nPlease note that our public API rate limits have been updated to 100 requests per minute per IP. Update your integration tests accordingly.\n\nAPI Platform Team",
    hasAttachments: false,
  },
  {
    subject: "Cloudinary Upload Pipeline Optimizations",
    body: "Hi,\n\nWe implemented chunked direct uploads and automatic thumbnail generation for image and video assets. Attachment uploads should now be twice as fast.\n\nBackend Team",
    hasAttachments: false,
  },
  {
    subject: "Lunch & Learn: Multi-Agent AI Systems",
    body: "Hey everyone,\n\nJoin us this Thursday in the cafeteria or on LiveKit for a presentation on orchestrating autonomous coding agents. Pizza provided!\n\nAI Working Group",
    hasAttachments: false,
  },
  {
    subject: "Office Facilities Update & New Parking Badges",
    body: "Dear staff,\n\nNew RFID access badges are ready at reception. Please collect yours before the end of the month.\n\nWorkplace Operations",
    hasAttachments: false,
  },
  {
    subject: "Code Freeze for Upcoming Major Release",
    body: "Engineering,\n\nCode freeze begins tomorrow at 6 PM. Only critical bug fixes with two approvals will be merged until release day.\n\nRelease Manager",
    hasAttachments: false,
  },
  {
    subject: "Customer Support Escalation: Ticket #9182",
    body: "Hi Support & Dev,\n\nAn enterprise customer reported an issue loading attachment previews on mobile browsers. Please investigate urgently.\n\nCustomer Success",
    hasAttachments: true,
  },
  {
    subject: "Remote Work Policy & Guidelines Update",
    body: "Hi team,\n\nOur revised hybrid working guidelines are now published on the company portal. Feel free to reach out to HR if you need clarifications.\n\nPeople Team",
    hasAttachments: false,
  },
  {
    subject: "Happy Birthday from the Orvexa Team!",
    body: "Wishing you a very happy birthday and a wonderful year ahead from all of us at Orvexa! Enjoy your day!\n\nWarm regards,\nOrvexa People Team",
    hasAttachments: false,
  },
  {
    subject: "Retrospective Notes: October Milestones",
    body: "Team,\n\nThank you for participating in the sprint retro. The top three action items have been created as issues on our project board.\n\nScrum Master",
    hasAttachments: false,
  },
  {
    subject: "Contract Agreement & NDA Renewal",
    body: "Hi,\n\nPlease review and e-sign the attached updated agreement at your earliest convenience.\n\nBest regards,\nLegal Department",
    hasAttachments: true,
  },
  {
    subject: "Server Health Report & SLA Compliance",
    body: "Operations update:\n\nOur service uptime for the past 30 days reached 99.98%, well exceeding our SLA target of 99.9%. Great work everyone!\n\nInfrastructure Team",
    hasAttachments: true,
  },
  {
    subject: "GitHub: [Orvexa/web] Pull Request #88: Mail Layout Polish",
    body: "Vignesh opened a new pull request: 'feat: add attachment chips and responsive row layout'.\n\nReview requested from: vishnuthangaraj.\n\nView diff and commit history on GitHub.",
    hasAttachments: false,
  },
  {
    subject: "Vercel: Deployment Successful for orvexa-preview",
    body: "Your project orvexa-web was successfully deployed to production.\n\nDomains: orvexa.app, preview-orvexa.vercel.app\nBuild time: 38s\nStatus: Ready",
    hasAttachments: false,
  },
  {
    subject: "Linear: 4 issues completed in Sprint 47",
    body: "Sprint 47 summary:\n- 4 issues closed\n- 1 issue moved to backlog\n- Velocity: 24 points\n\nNice work closing out the milestones ahead of schedule!",
    hasAttachments: false,
  },
  {
    subject: "LiveKit Room Analytics & Connection Quality Report",
    body: "Weekly telemetry report for LiveKit SFU clusters:\n- Peak concurrent participants: 142\n- Average packet loss: 0.12%\n- Average latency: 34ms\n\nSystem running well within healthy thresholds.",
    hasAttachments: true,
  },
  {
    subject: "Stripe: Payout Processed Successfully",
    body: "A payout of $3,500.00 has been sent to your bank account ending in 4102. It should arrive in 1-2 business days.\n\nView details in your Stripe dashboard.",
    hasAttachments: false,
  },
  {
    subject: "AWS CloudWatch: Alarm 'HighMemoryUtilization' Cleared",
    body: "Alarm 'WorkerHighMemory' in us-east-1 transitioned from ALARM to OK at 14:22 UTC. Metric memory_used fell below 70% threshold.",
    hasAttachments: false,
  },
  {
    subject: "Figma: Comment from Priya Raman on 'Inbox Component'",
    body: "Priya Raman commented on Orvexa Design System:\n'The hover elevation on row items looks super clean now! Can we also make sure the star icon matches the active blue?'",
    hasAttachments: false,
  },
  {
    subject: "KPR Institute: Campus Placement Drive Schedule 2026",
    body: "Dear Students,\n\nThe schedule for the upcoming campus recruitment drive has been finalized. Please check the attached document for company visiting dates and eligibility criteria.\n\nPlacement Cell\nKPR Institute of Engineering and Technology",
    hasAttachments: true,
  },
  {
    subject: "Your Google Cloud Platform monthly statement is ready",
    body: "Hello Vishnu,\n\nYour invoice for project orvexa-prod-9182 is now available. Total amount: $48.20. Your credit card ending in 4242 will be charged automatically on the due date.",
    hasAttachments: true,
  },
  {
    subject: "Hackathon 2026: Team Registration Confirmation",
    body: "Congratulations! Your team 'QuantumCoders' has been registered for the National AI & Cloud Hackathon 2026. Preliminary round begins this Saturday.\n\nOrganizing Committee",
    hasAttachments: false,
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

  // Identify Vishnu Thangaraj
  const vishnu =
    users.find(
      (u) =>
        u.username.toLowerCase() === "vishnuthangaraj" ||
        u.email.toLowerCase().includes("vishnuthangaraj"),
    ) || users[0]!;

  const otherUsers = users.filter((u) => u.id !== vishnu.id);
  const otherUsersList = otherUsers.length > 0 ? otherUsers : users;

  console.log(
    `[SEED] Starting mail seeding (Target user: ${vishnu.fullName} / ${vishnu.username})...`,
  );

  // 1. Clean existing mail records to ensure idempotent seed execution
  await prisma.mailMessage.deleteMany();
  await prisma.mailDraft.deleteMany();
  await prisma.mailFolder.deleteMany();
  await prisma.mailLabel.deleteMany();

  // 2. Seed diverse FileAssets for attachments
  const assetPdfs = await Promise.all([
    prisma.fileAsset.upsert({
      where: {
        resourceType_deliveryType_publicId: {
          resourceType: "RAW",
          deliveryType: "AUTHENTICATED",
          publicId: "orvexa/mail/seed/quarterly-report-2026.pdf",
        },
      },
      update: {},
      create: {
        publicId: "orvexa/mail/seed/quarterly-report-2026.pdf",
        cloudinaryAssetId: "seed-asset-pdf-1",
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        version: 1,
        format: "pdf",
        originalFilename: "quarterly-report-2026.pdf",
        mimeType: "application/pdf",
        bytes: BigInt(1048576),
        secureUrl:
          "https://res.cloudinary.com/orvexa/raw/upload/v1/orvexa/mail/seed/quarterly-report-2026.pdf",
        uploadedBy: vishnu.id,
      },
    }),
    prisma.fileAsset.upsert({
      where: {
        resourceType_deliveryType_publicId: {
          resourceType: "RAW",
          deliveryType: "AUTHENTICATED",
          publicId: "orvexa/mail/seed/internship-offer.pdf",
        },
      },
      update: {},
      create: {
        publicId: "orvexa/mail/seed/internship-offer.pdf",
        cloudinaryAssetId: "seed-asset-pdf-2",
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        version: 1,
        format: "pdf",
        originalFilename: "Internship_Offer_Letter.pdf",
        mimeType: "application/pdf",
        bytes: BigInt(524288),
        secureUrl:
          "https://res.cloudinary.com/orvexa/raw/upload/v1/orvexa/mail/seed/internship-offer.pdf",
        uploadedBy: vishnu.id,
      },
    }),
  ]);

  const assetDocs = await Promise.all([
    prisma.fileAsset.upsert({
      where: {
        resourceType_deliveryType_publicId: {
          resourceType: "RAW",
          deliveryType: "AUTHENTICATED",
          publicId: "orvexa/mail/seed/project-specs.docx",
        },
      },
      update: {},
      create: {
        publicId: "orvexa/mail/seed/project-specs.docx",
        cloudinaryAssetId: "seed-asset-doc-1",
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        version: 1,
        format: "docx",
        originalFilename: "Project_Specifications.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        bytes: BigInt(348160),
        secureUrl:
          "https://res.cloudinary.com/orvexa/raw/upload/v1/orvexa/mail/seed/project-specs.docx",
        uploadedBy: vishnu.id,
      },
    }),
    prisma.fileAsset.upsert({
      where: {
        resourceType_deliveryType_publicId: {
          resourceType: "RAW",
          deliveryType: "AUTHENTICATED",
          publicId: "orvexa/mail/seed/financial-forecast.xlsx",
        },
      },
      update: {},
      create: {
        publicId: "orvexa/mail/seed/financial-forecast.xlsx",
        cloudinaryAssetId: "seed-asset-xls-1",
        resourceType: "RAW",
        deliveryType: "AUTHENTICATED",
        version: 1,
        format: "xlsx",
        originalFilename: "Financial_Forecast_2026.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        bytes: BigInt(819200),
        secureUrl:
          "https://res.cloudinary.com/orvexa/raw/upload/v1/orvexa/mail/seed/financial-forecast.xlsx",
        uploadedBy: vishnu.id,
      },
    }),
  ]);

  const assetImages = await Promise.all([
    prisma.fileAsset.upsert({
      where: {
        resourceType_deliveryType_publicId: {
          resourceType: "IMAGE",
          deliveryType: "AUTHENTICATED",
          publicId: "orvexa/mail/seed/architecture-diagram.png",
        },
      },
      update: {},
      create: {
        publicId: "orvexa/mail/seed/architecture-diagram.png",
        cloudinaryAssetId: "seed-asset-img-1",
        resourceType: "IMAGE",
        deliveryType: "AUTHENTICATED",
        version: 1,
        format: "png",
        originalFilename: "Architecture_Diagram.png",
        mimeType: "image/png",
        bytes: BigInt(655360),
        secureUrl:
          "https://res.cloudinary.com/orvexa/image/upload/v1/orvexa/mail/seed/architecture-diagram.png",
        uploadedBy: vishnu.id,
      },
    }),
  ]);

  const allSeedAssets = [
    ...assetPdfs,
    ...assetDocs,
    ...assetImages,
  ];

  console.log(
    `[SEED] Seeded ${allSeedAssets.length} shared FileAssets for attachments.`,
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

  // 4. Seed EXACTLY 200 inbox messages for vishnuthangaraj
  const now = Date.now();
  const TOTAL_INBOX_MAILS = 200;
  console.log(
    `[SEED] Generating ${TOTAL_INBOX_MAILS} inbox messages for ${vishnu.username}...`,
  );

  for (let i = 0; i < TOTAL_INBOX_MAILS; i++) {
    const baseTpl = INBOX_TEMPLATES[i % INBOX_TEMPLATES.length]!;
    const cycle = Math.floor(i / INBOX_TEMPLATES.length);

    const subject =
      cycle === 0
        ? baseTpl.subject
        : cycle === 1
          ? `${baseTpl.subject} (Update #${i + 1})`
          : cycle === 2
            ? `Re: ${baseTpl.subject} [Ref: #${1000 + i}]`
            : `[Follow-up] ${baseTpl.subject} - Phase ${((i % 4) + 1)}`;

    const body = baseTpl.body;

    // Distribute timestamps smoothly backwards over the last ~120 days
    // i = 0 is 15 minutes ago, i = 199 is ~120 days ago
    const minutesAgo = 15 + Math.round(i * 860);
    const sentAt = new Date(now - minutesAgo * 60 * 1000);

    // Rotate sender among the other team members
    const sender = otherUsersList[i % otherUsersList.length]!;

    // Recipients to create: Vishnu is TO
    const recipientsToCreate: Array<{
      userId: bigint;
      recipientType: "TO" | "CC" | "BCC";
    }> = [{ userId: vishnu.id, recipientType: "TO" }];

    // Occasionally add a CC recipient
    if (i % 6 === 0) {
      const ccUser = otherUsersList[(i + 3) % otherUsersList.length]!;
      if (ccUser.id !== sender.id && ccUser.id !== vishnu.id) {
        recipientsToCreate.push({ userId: ccUser.id, recipientType: "CC" });
      }
    }

    // Create MailMessage
    const message = await prisma.mailMessage.create({
      data: {
        senderId: sender.id,
        subject,
        body,
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

    // Decide read / starred status for Vishnu
    // Most recent 20 emails have more unread (~50%), older emails have ~30% unread
    const isRead = i < 20 ? i % 2 !== 0 : i % 3 !== 0;
    const readAt = isRead ? new Date(sentAt.getTime() + 120000) : null;
    const isStarred = i % 6 === 0;

    // Build user states:
    // 1. Sender user state (Sent mail)
    // 2. Vishnu user state (INBOX: isTrashed: false, isArchived: false)
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
    }> = [
      {
        messageId: message.id,
        userId: sender.id,
        isRead: true,
        readAt: sentAt,
        isStarred: false,
        isArchived: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: sentAt,
        updatedAt: sentAt,
      },
      {
        messageId: message.id,
        userId: vishnu.id,
        isRead,
        readAt,
        isStarred,
        isArchived: false,
        isTrashed: false,
        trashedAt: null,
        createdAt: sentAt,
        updatedAt: sentAt,
      },
    ];

    await prisma.mailUserState.createMany({
      data: states,
      skipDuplicates: true,
    });

    // Attachments for Vishnu's inbox emails:
    // ~25% of messages have attachments (like in the Gmail screenshot)
    const shouldHaveAttachment =
      Boolean(baseTpl.hasAttachments) || i % 4 === 0;

    if (shouldHaveAttachment) {
      if (i % 12 === 0) {
        // 2 attachments on some rows (e.g. PDF + DOCX)
        await prisma.mailAttachment.createMany({
          data: [
            {
              messageId: message.id,
              assetId: assetPdfs[1]!.id,
              createdAt: sentAt,
            },
            {
              messageId: message.id,
              assetId: assetDocs[0]!.id,
              createdAt: sentAt,
            },
          ],
          skipDuplicates: true,
        });
      } else {
        // 1 attachment
        const asset = allSeedAssets[i % allSeedAssets.length]!;
        await prisma.mailAttachment.create({
          data: {
            messageId: message.id,
            assetId: asset.id,
            createdAt: sentAt,
          },
        });
      }
    }

    // Assign labels for Vishnu
    const vishnuLabels = userLabelsMap.get(vishnu.id.toString());
    if (vishnuLabels) {
      if (i % 7 === 0 && vishnuLabels["Work"]) {
        await prisma.mailMessageLabel.create({
          data: {
            userId: vishnu.id,
            messageId: message.id,
            labelId: vishnuLabels["Work"]!,
            createdAt: sentAt,
          },
        });
      } else if (i % 11 === 0 && vishnuLabels["Important"]) {
        await prisma.mailMessageLabel.create({
          data: {
            userId: vishnu.id,
            messageId: message.id,
            labelId: vishnuLabels["Important"]!,
            createdAt: sentAt,
          },
        });
      }
    }
  }

  console.log(
    `[SEED] Successfully seeded ${TOTAL_INBOX_MAILS} inbox messages for ${vishnu.username}!`,
  );

  // 5. Seed ~20 sent messages by Vishnu to other users
  const TOTAL_SENT_MAILS = 20;
  for (let s = 0; s < TOTAL_SENT_MAILS; s++) {
    const sentDate = new Date(now - (s + 1) * 3 * 3600 * 1000);
    const toMember = otherUsersList[s % otherUsersList.length]!;
    const tpl = INBOX_TEMPLATES[(s + 5) % INBOX_TEMPLATES.length]!;

    const sentMessage = await prisma.mailMessage.create({
      data: {
        senderId: vishnu.id,
        subject: `Re: ${tpl.subject}`,
        body: `Hi ${toMember.fullName},\n\nFollowing up on our earlier discussion. Let me know if you need anything else.\n\nBest,\nVishnu`,
        sentAt: sentDate,
        createdAt: sentDate,
        updatedAt: sentDate,
      },
    });

    await prisma.mailMessage.update({
      where: { id: sentMessage.id },
      data: { threadId: sentMessage.id },
    });

    await prisma.mailRecipient.create({
      data: {
        messageId: sentMessage.id,
        userId: toMember.id,
        recipientType: "TO",
        createdAt: sentDate,
      },
    });

    await prisma.mailUserState.createMany({
      data: [
        {
          messageId: sentMessage.id,
          userId: vishnu.id,
          isRead: true,
          readAt: sentDate,
          isStarred: s % 5 === 0,
          isArchived: false,
          isTrashed: false,
          createdAt: sentDate,
          updatedAt: sentDate,
        },
        {
          messageId: sentMessage.id,
          userId: toMember.id,
          isRead: s % 2 === 0,
          readAt: s % 2 === 0 ? sentDate : null,
          isStarred: false,
          isArchived: false,
          isTrashed: false,
          createdAt: sentDate,
          updatedAt: sentDate,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log(
    `[SEED] Seeded ${TOTAL_SENT_MAILS} sent messages for ${vishnu.username}.`,
  );

  // 6. Seed 5 Drafts for each user
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

      // Add attachment to the first draft of each user using a shared FileAsset
      if (d === 0) {
        await prisma.mailDraftAttachment.create({
          data: {
            draftId: draft.id,
            assetId: assetPdfs[0]!.id,
            createdAt: draftDate,
          },
        });
      }

      totalCreatedDrafts++;
    }
  }

  console.log(`[SEED] Seeded ${totalCreatedDrafts} drafts across all users.`);

  // 7. Seed 10 trashed messages for Vishnu
  const TOTAL_TRASH_MAILS = 10;
  for (let t = 0; t < TOTAL_TRASH_MAILS; t++) {
    const trashDate = new Date(now - (t + 1) * 8 * 3600 * 1000);
    const sender = otherUsersList[t % otherUsersList.length]!;

    const trashMessage = await prisma.mailMessage.create({
      data: {
        senderId: sender.id,
        subject: `[Discarded] Old notice #${t + 1}`,
        body: `Hi Vishnu,\n\nThis is an expired notice or discarded communication.\n\nRegards,\n${sender.fullName}`,
        sentAt: trashDate,
        createdAt: trashDate,
        updatedAt: trashDate,
      },
    });

    await prisma.mailMessage.update({
      where: { id: trashMessage.id },
      data: { threadId: trashMessage.id },
    });

    await prisma.mailRecipient.create({
      data: {
        messageId: trashMessage.id,
        userId: vishnu.id,
        recipientType: "TO",
        createdAt: trashDate,
      },
    });

    await prisma.mailUserState.create({
      data: {
        messageId: trashMessage.id,
        userId: vishnu.id,
        isRead: true,
        readAt: trashDate,
        isStarred: false,
        isArchived: false,
        isTrashed: true,
        trashedAt: trashDate,
        createdAt: trashDate,
        updatedAt: trashDate,
      },
    });
  }

  console.log(`[SEED] Seeded ${TOTAL_TRASH_MAILS} trashed messages for ${vishnu.username}.`);

  // 8. Seed 5 snoozed messages for Vishnu
  const TOTAL_SNOOZED_MAILS = 5;
  for (let z = 0; z < TOTAL_SNOOZED_MAILS; z++) {
    const snoozeDate = new Date(now - (z + 1) * 5 * 3600 * 1000);
    const sender = otherUsersList[(z + 2) % otherUsersList.length]!;

    const snoozedMessage = await prisma.mailMessage.create({
      data: {
        senderId: sender.id,
        subject: `[Snoozed Reminder] Follow up on task #${z + 1}`,
        body: `Hi Vishnu,\n\nThis reminder is snoozed until later this week.\n\nBest,\n${sender.fullName}`,
        sentAt: snoozeDate,
        createdAt: snoozeDate,
        updatedAt: snoozeDate,
      },
    });

    await prisma.mailMessage.update({
      where: { id: snoozedMessage.id },
      data: { threadId: snoozedMessage.id },
    });

    await prisma.mailRecipient.create({
      data: {
        messageId: snoozedMessage.id,
        userId: vishnu.id,
        recipientType: "TO",
        createdAt: snoozeDate,
      },
    });

    await prisma.mailUserState.create({
      data: {
        messageId: snoozedMessage.id,
        userId: vishnu.id,
        isRead: false,
        readAt: null,
        isStarred: false,
        isArchived: true,
        isTrashed: false,
        createdAt: snoozeDate,
        updatedAt: snoozeDate,
      },
    });
  }

  console.log(`[SEED] Seeded ${TOTAL_SNOOZED_MAILS} snoozed messages for ${vishnu.username}.`);
  console.log(`[SEED] Mail seeding completed successfully!`);
};
