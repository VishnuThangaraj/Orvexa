import { prisma } from "../../config/prisma.js";
import type {
  CreateAssetData,
  CreateMailRecordData,
  FetchInboxOptions,
  MessageStateUpdate,
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

  // Fetch inbox messages for a user with userState filtering (excluding trashed/archived), sender/recipients/attachment relations, and pagination
  async fetchInbox(userId: bigint, options: FetchInboxOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const userStateFilter: {
      userId: bigint;
      isTrashed: boolean;
      isArchived: boolean;
      isRead?: boolean;
      isStarred?: boolean;
    } = {
      userId,
      isTrashed: false,
      isArchived: false,
    };

    if (options.isRead !== undefined) {
      userStateFilter.isRead = options.isRead;
    }

    if (options.isStarred !== undefined) {
      userStateFilter.isStarred = options.isStarred;
    }

    const where: any = {
      recipients: {
        some: { userId },
      },
      userStates: {
        some: userStateFilter,
      },
    };

    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { body: { contains: searchTerm, mode: "insensitive" } },
        { sender: { fullName: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { email: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { username: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const [total, messages] = await prisma.$transaction([
      prisma.mailMessage.count({ where }),
      prisma.mailMessage.findMany({
        where,
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
          userStates: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
              isStarred: true,
              isArchived: true,
              isTrashed: true,
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  resourceType: true,
                  format: true,
                  secureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      messages,
    };
  }

  // Fetch starred messages
  async fetchStarred(userId: bigint, options: FetchInboxOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      userStates: {
        some: {
          userId,
          isStarred: true,
          isTrashed: false,
        },
      },
    };

    if (options.isRead !== undefined) {
      where.userStates.some.isRead = options.isRead;
    }

    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { body: { contains: searchTerm, mode: "insensitive" } },
        { sender: { fullName: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { email: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { username: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const [total, messages] = await prisma.$transaction([
      prisma.mailMessage.count({ where }),
      prisma.mailMessage.findMany({
        where,
        include: {
          sender: {
            select: { id: true, fullName: true, username: true, email: true },
          },
          recipients: {
            include: {
              user: {
                select: { id: true, fullName: true, username: true, email: true },
              },
            },
          },
          userStates: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
              isStarred: true,
              isArchived: true,
              isTrashed: true,
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  resourceType: true,
                  format: true,
                  secureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, messages };
  }

  // Fetch sent messages
  async fetchSent(userId: bigint, options: FetchInboxOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      senderId: userId,
      userStates: {
        some: {
          userId,
          isTrashed: false,
        },
      },
    };

    if (options.isStarred !== undefined) {
      where.userStates.some.isStarred = options.isStarred;
    }

    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { body: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [total, messages] = await prisma.$transaction([
      prisma.mailMessage.count({ where }),
      prisma.mailMessage.findMany({
        where,
        include: {
          sender: {
            select: { id: true, fullName: true, username: true, email: true },
          },
          recipients: {
            include: {
              user: {
                select: { id: true, fullName: true, username: true, email: true },
              },
            },
          },
          userStates: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
              isStarred: true,
              isArchived: true,
              isTrashed: true,
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  resourceType: true,
                  format: true,
                  secureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, messages };
  }

  // Fetch drafts
  async fetchDrafts(userId: bigint, options: FetchInboxOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { body: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [total, drafts] = await prisma.$transaction([
      prisma.mailDraft.count({ where }),
      prisma.mailDraft.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, username: true, email: true },
          },
          recipients: {
            include: {
              user: {
                select: { id: true, fullName: true, username: true, email: true },
              },
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  resourceType: true,
                  format: true,
                  secureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, drafts };
  }

  // Fetch snoozed (archived) messages
  async fetchSnoozed(userId: bigint, options: FetchInboxOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      userStates: {
        some: {
          userId,
          isArchived: true,
          isTrashed: false,
        },
      },
    };

    if (options.isStarred !== undefined) {
      where.userStates.some.isStarred = options.isStarred;
    }

    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { body: { contains: searchTerm, mode: "insensitive" } },
        { sender: { fullName: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { email: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { username: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const [total, messages] = await prisma.$transaction([
      prisma.mailMessage.count({ where }),
      prisma.mailMessage.findMany({
        where,
        include: {
          sender: {
            select: { id: true, fullName: true, username: true, email: true },
          },
          recipients: {
            include: {
              user: {
                select: { id: true, fullName: true, username: true, email: true },
              },
            },
          },
          userStates: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
              isStarred: true,
              isArchived: true,
              isTrashed: true,
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  resourceType: true,
                  format: true,
                  secureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, messages };
  }

  // Fetch trash messages
  async fetchTrash(userId: bigint, options: FetchInboxOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      userStates: {
        some: {
          userId,
          isTrashed: true,
        },
      },
    };

    if (options.search && options.search.trim().length > 0) {
      const searchTerm = options.search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { body: { contains: searchTerm, mode: "insensitive" } },
        { sender: { fullName: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { email: { contains: searchTerm, mode: "insensitive" } } },
        { sender: { username: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const [total, messages] = await prisma.$transaction([
      prisma.mailMessage.count({ where }),
      prisma.mailMessage.findMany({
        where,
        include: {
          sender: {
            select: { id: true, fullName: true, username: true, email: true },
          },
          recipients: {
            include: {
              user: {
                select: { id: true, fullName: true, username: true, email: true },
              },
            },
          },
          userStates: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
              isStarred: true,
              isArchived: true,
              isTrashed: true,
            },
          },
          attachments: {
            include: {
              asset: {
                select: {
                  id: true,
                  originalFilename: true,
                  mimeType: true,
                  bytes: true,
                  resourceType: true,
                  format: true,
                  secureUrl: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, messages };
  }

  // Fetch category counts for sidebar badges
  async fetchCounts(userId: bigint) {
    const [inboxUnread, drafts, trash, starred, snoozed, sent] =
      await prisma.$transaction([
        prisma.mailMessage.count({
          where: {
            recipients: { some: { userId } },
            userStates: {
              some: {
                userId,
                isRead: false,
                isTrashed: false,
                isArchived: false,
              },
            },
          },
        }),
        prisma.mailDraft.count({
          where: { userId },
        }),
        prisma.mailMessage.count({
          where: {
            userStates: { some: { userId, isTrashed: true } },
          },
        }),
        prisma.mailMessage.count({
          where: {
            userStates: { some: { userId, isStarred: true, isTrashed: false } },
          },
        }),
        prisma.mailMessage.count({
          where: {
            userStates: {
              some: { userId, isArchived: true, isTrashed: false },
            },
          },
        }),
        prisma.mailMessage.count({
          where: {
            senderId: userId,
            userStates: { some: { userId, isTrashed: false } },
          },
        }),
      ]);

    return {
      inboxUnread,
      drafts,
      trash,
      starred,
      snoozed,
      sent,
    };
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

  // Delete an unlinked file asset (only if not attached to an existing sent message)
  async deleteUnlinkedAsset(id: bigint, userId: bigint) {
    return prisma.fileAsset.deleteMany({
      where: {
        id,
        uploadedBy: userId,
        mailAttachments: { none: {} },
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

  // Find all messages in a conversation thread by thread ID or message ID
  async findThreadMessages(userId: bigint, targetId: bigint) {
    const baseMessage = await prisma.mailMessage.findFirst({
      where: {
        OR: [{ id: targetId }, { threadId: targetId }],
      },
      select: { id: true, threadId: true, subject: true },
    });

    if (!baseMessage) {
      return null;
    }

    const effectiveThreadId = baseMessage.threadId ?? baseMessage.id;

    const messages = await prisma.mailMessage.findMany({
      where: {
        OR: [{ threadId: effectiveThreadId }, { id: effectiveThreadId }],
      },
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
        userStates: {
          where: { userId },
          select: {
            isRead: true,
            readAt: true,
            isStarred: true,
            isArchived: true,
            isTrashed: true,
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
                resourceType: true,
                format: true,
                secureUrl: true,
              },
            },
          },
        },
        messageLabels: {
          include: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: "asc" },
    });

    return {
      threadId: effectiveThreadId,
      subject: baseMessage.subject,
      messages,
    };
  }

  // Mark all given messages as read for a specific user
  async markMessagesAsRead(userId: bigint, messageIds: bigint[]) {
    if (messageIds.length === 0) return;

    await prisma.mailUserState.updateMany({
      where: {
        userId,
        messageId: { in: messageIds },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // Upsert user state for a single message
  async updateMessageUserState(
    userId: bigint,
    messageId: bigint,
    updates: MessageStateUpdate,
  ) {
    const dataToUpdate: any = {};
    if (updates.isStarred !== undefined) dataToUpdate.isStarred = updates.isStarred;
    if (updates.isRead !== undefined) {
      dataToUpdate.isRead = updates.isRead;
      dataToUpdate.readAt = updates.isRead ? new Date() : null;
    }
    if (updates.isArchived !== undefined)
      dataToUpdate.isArchived = updates.isArchived;
    if (updates.isTrashed !== undefined) {
      dataToUpdate.isTrashed = updates.isTrashed;
      dataToUpdate.trashedAt = updates.isTrashed ? new Date() : null;
    }

    return prisma.mailUserState.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
        isStarred: updates.isStarred ?? false,
        isRead: updates.isRead ?? false,
        readAt: updates.isRead ? new Date() : null,
        isArchived: updates.isArchived ?? false,
        isTrashed: updates.isTrashed ?? false,
        trashedAt: updates.isTrashed ? new Date() : null,
      },
      update: dataToUpdate,
    });
  }

  // Batch update user states for multiple messages
  async batchUpdateMessageStates(
    userId: bigint,
    messageIds: bigint[],
    updates: MessageStateUpdate,
  ) {
    if (messageIds.length === 0) return { count: 0 };

    const dataToUpdate: any = {};
    if (updates.isStarred !== undefined) dataToUpdate.isStarred = updates.isStarred;
    if (updates.isRead !== undefined) {
      dataToUpdate.isRead = updates.isRead;
      dataToUpdate.readAt = updates.isRead ? new Date() : null;
    }
    if (updates.isArchived !== undefined)
      dataToUpdate.isArchived = updates.isArchived;
    if (updates.isTrashed !== undefined) {
      dataToUpdate.isTrashed = updates.isTrashed;
      dataToUpdate.trashedAt = updates.isTrashed ? new Date() : null;
    }

    return prisma.mailUserState.updateMany({
      where: {
        userId,
        messageId: { in: messageIds },
      },
      data: dataToUpdate,
    });
  }
}

export default MailRepository;
