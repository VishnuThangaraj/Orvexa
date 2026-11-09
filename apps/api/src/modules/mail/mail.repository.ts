import { prisma } from "../../config/prisma.js";
import type {
  CreateAssetData,
  CreateMailRecordData,
} from "./mail.types.js";

class MailRepository {
  // Find a single user by ID
  async findUserById(id: bigint) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        isActive: true,
      },
    });
  }

  // Find users by usernames, emails, or numeric IDs
  async findUsersByIdentifiers(identifiers: string[]) {
    if (!identifiers.length) return [];

    const cleaned = identifiers.map((i) => i.trim().toLowerCase());
    const strippedUsernames = cleaned.map((i) =>
      i.replace(/@orvexa\.com$/i, ""),
    );
    const numericIds = cleaned
      .filter((i) => /^\d+$/.test(i))
      .map((i) => BigInt(i));

    return prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { email: { in: cleaned, mode: "insensitive" } },
          { username: { in: cleaned, mode: "insensitive" } },
          { username: { in: strippedUsernames, mode: "insensitive" } },
          ...(numericIds.length > 0 ? [{ id: { in: numericIds } }] : []),
        ],
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
      },
    });
  }

  // Find message by ID with thread and participants
  async findMessageById(id: bigint) {
    return prisma.mailMessage.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
          },
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
              },
            },
          },
        },
        attachments: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  // Find existing file assets by IDs
  async findAssetsByIds(ids: bigint[]) {
    if (!ids.length) return [];
    return prisma.fileAsset.findMany({
      where: {
        id: { in: ids },
        cloudDeletedAt: null,
      },
    });
  }

  // Find single file asset by ID
  async findAssetById(id: bigint) {
    return prisma.fileAsset.findFirst({
      where: {
        id,
        cloudDeletedAt: null,
      },
    });
  }

  // Create a new FileAsset record
  async createAsset(data: CreateAssetData) {
    return prisma.fileAsset.create({
      data: {
        publicId: data.publicId,
        cloudinaryAssetId: data.cloudinaryAssetId ?? null,
        resourceType: data.resourceType,
        deliveryType: data.deliveryType ?? "AUTHENTICATED",
        version: data.version ?? null,
        format: data.format ?? null,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        bytes: data.bytes,
        secureUrl: data.secureUrl ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        uploadedBy: data.uploadedBy ?? null,
      },
    });
  }

  // Create mail message with recipients, states, attachments in a transaction
  async createMail(data: CreateMailRecordData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the mail message
      const message = await tx.mailMessage.create({
        data: {
          senderId: data.senderId,
          threadId: data.threadId ?? null,
          parentMessageId: data.parentMessageId ?? null,
          subject: data.subject,
          body: data.body,
        },
      });

      // 2. Set threadId to message.id if this is the start of a thread
      const effectiveThreadId = data.threadId ?? message.id;
      if (!data.threadId) {
        await tx.mailMessage.update({
          where: { id: message.id },
          data: { threadId: effectiveThreadId },
        });
      }

      // 3. Create mail recipients
      if (data.recipients.length > 0) {
        await tx.mailRecipient.createMany({
          data: data.recipients.map((r) => ({
            messageId: message.id,
            userId: r.userId,
            recipientType: r.recipientType,
          })),
          skipDuplicates: true,
        });
      }

      // 4. Create user states for sender and recipients
      const statesToCreate: Array<{
        messageId: bigint;
        userId: bigint;
        isRead: boolean;
        readAt: Date | null;
      }> = [];

      // Sender state: marked as read
      statesToCreate.push({
        messageId: message.id,
        userId: data.senderId,
        isRead: true,
        readAt: new Date(),
      });

      // Recipients states: marked as unread (unless recipient is also the sender)
      for (const recipient of data.recipients) {
        if (recipient.userId !== data.senderId) {
          statesToCreate.push({
            messageId: message.id,
            userId: recipient.userId,
            isRead: false,
            readAt: null,
          });
        }
      }

      await tx.mailUserState.createMany({
        data: statesToCreate,
        skipDuplicates: true,
      });

      // 5. Create mail attachments
      if (data.assetIds && data.assetIds.length > 0) {
        await tx.mailAttachment.createMany({
          data: data.assetIds.map((assetId) => ({
            messageId: message.id,
            assetId,
          })),
          skipDuplicates: true,
        });
      }

      // 6. If a draftId was passed, delete the draft
      if (data.draftId) {
        await tx.mailDraft.deleteMany({
          where: {
            id: data.draftId,
            userId: data.senderId,
          },
        });
      }

      // 7. Fetch and return complete message record with relations
      return tx.mailMessage.findUniqueOrThrow({
        where: { id: message.id },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
            },
          },
          recipients: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  publicId: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  secureUrl: true,
                  resourceType: true,
                  format: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });
    });
  }
}

export default MailRepository;
