import AppError from "../../common/errors/AppError.js";
import prisma from "../../infrastructure/database/prisma.js";
import type {
  CreateGroupOrChannelDto,
  FetchConversationsQueryDto,
  UpdateConversationDto,
  UpdateParticipantSettingsDto,
  ConversationMemberRole,
  SendMessageDto,
  FetchMessagesQueryDto,
  CreateAssetData,
  GlobalSearchQueryDto,
  GlobalSearchResult,
} from "./chat.types.js";

const userSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  role: true,
  profileImage: {
    select: {
      id: true,
      secureUrl: true,
    },
  },
};

const messageInclude = {
  sender: { select: userSelect },
  attachments: {
    include: {
      asset: {
        select: {
          id: true,
          originalFilename: true,
          mimeType: true,
          bytes: true,
          secureUrl: true,
          format: true,
          resourceType: true,
        },
      },
    },
  },
  reactions: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
    },
  },
  mentions: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
    },
  },
  parentMessage: {
    select: {
      id: true,
      content: true,
      messageType: true,
      sender: { select: userSelect },
    },
  },
  _count: {
    select: {
      replies: true,
    },
  },
};

export class ChatRepository {
  private getCanonicalDirectIds(userA: bigint, userB: bigint) {
    return userA < userB
      ? { low: userA, high: userB }
      : { low: userB, high: userA };
  }

  async findDirectConversation(userA: bigint, userB: bigint) {
    const { low, high } = this.getCanonicalDirectIds(userA, userB);

    return prisma.conversation.findUnique({
      where: {
        directUserLowId_directUserHighId: {
          directUserLowId: low,
          directUserHighId: high,
        },
      },
      include: {
        participants: {
          include: {
            user: { select: userSelect },
          },
        },
        image: true,
      },
    });
  }

  async createDirectConversation(creatorId: bigint, recipientId: bigint) {
    const { low, high } = this.getCanonicalDirectIds(creatorId, recipientId);

    return prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          type: "DIRECT",
          directUserLowId: low,
          directUserHighId: high,
          createdBy: creatorId,
          participants: {
            create: [
              { userId: creatorId, memberRole: "MEMBER" },
              { userId: recipientId, memberRole: "MEMBER" },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: { select: userSelect },
            },
          },
          image: true,
        },
      });

      return conversation;
    });
  }

  async createGroupOrChannel(
    creatorId: bigint,
    dto: CreateGroupOrChannelDto,
  ) {
    const participantIds = (dto.participantIds || []).map((id) => BigInt(id));
    const uniqueParticipantIds = Array.from(
      new Set(participantIds.filter((id) => id !== creatorId)),
    );

    return prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          type: dto.type,
          name: dto.name,
          description: dto.description ?? null,
          visibility: dto.visibility ?? (dto.type === "CHANNEL" ? "PUBLIC" : null),
          createdBy: creatorId,
          participants: {
            create: [
              { userId: creatorId, memberRole: "OWNER" },
              ...uniqueParticipantIds.map((id) => ({
                userId: id,
                memberRole: "MEMBER" as const,
              })),
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: { select: userSelect },
            },
          },
          image: true,
        },
      });

      return conversation;
    });
  }

  async getConversationById(conversationId: bigint) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: userSelect },
          },
        },
        image: true,
        creator: { select: userSelect },
        _count: {
          select: {
            messages: true,
            pinnedMessages: true,
          },
        },
      },
    });
  }

  async getUserConversations(
    userId: bigint,
    options: FetchConversationsQueryDto,
  ) {
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const whereClause: any = {
      archivedAt: null,
      participants: {
        some: {
          userId,
          leftAt: null,
          ...(options.isArchived !== undefined && {
            isArchived: options.isArchived,
          }),
          ...(options.isPinned !== undefined && {
            isPinned: options.isPinned,
          }),
        },
      },
    };

    if (options.type) {
      whereClause.type = options.type;
    }

    if (options.hasMentions) {
      whereClause.mentions = {
        some: {
          OR: [{ userId }, { isAll: true }],
        },
      };
    }

    if (options.search) {
      whereClause.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        {
          participants: {
            some: {
              user: {
                OR: [
                  { fullName: { contains: options.search, mode: "insensitive" } },
                  { username: { contains: options.search, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: [
          { lastMessageAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: {
          image: true,
          participants: {
            where: { leftAt: null },
            include: {
              user: { select: userSelect },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              sender: { select: userSelect },
              mentions: {
                select: {
                  id: true,
                  userId: true,
                  isAll: true,
                },
              },
            },
          },
        },
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    return { conversations, totalCount, limit, offset };
  }

  async getParticipant(conversationId: bigint, userId: bigint) {
    return prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
  }

  async addParticipants(conversationId: bigint, userIds: bigint[]) {
    return prisma.$transaction(
      userIds.map((userId) =>
        prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
          update: {
            leftAt: null,
            joinedAt: new Date(),
          },
          create: {
            conversationId,
            userId,
            memberRole: "MEMBER",
          },
          include: {
            user: { select: userSelect },
          },
        }),
      ),
    );
  }

  async removeParticipant(conversationId: bigint, userId: bigint) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  async updateParticipantRole(
    conversationId: bigint,
    userId: bigint,
    role: ConversationMemberRole,
  ) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        memberRole: role,
      },
      include: {
        user: { select: userSelect },
      },
    });
  }

  async updateParticipantSettings(
    conversationId: bigint,
    userId: bigint,
    settings: UpdateParticipantSettingsDto,
  ) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        ...(settings.isMuted !== undefined && { isMuted: settings.isMuted }),
        ...(settings.isArchived !== undefined && {
          isArchived: settings.isArchived,
        }),
        ...(settings.isPinned !== undefined && { isPinned: settings.isPinned }),
      },
    });
  }

  async updateConversation(
    conversationId: bigint,
    data: UpdateConversationDto,
  ) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.imageId !== undefined && {
          imageId: data.imageId ? BigInt(data.imageId) : null,
        }),
        ...(data.isArchived !== undefined && {
          archivedAt: data.isArchived ? new Date() : null,
        }),
      },
      include: {
        image: true,
        participants: {
          where: { leftAt: null },
          include: {
            user: { select: userSelect },
          },
        },
      },
    });
  }

  async discoverPublicSpaces(
    userId: bigint,
    search?: string,
    limit = 30,
    offset = 0,
  ) {
    const whereClause: any = {
      visibility: "PUBLIC",
      archivedAt: null,
      type: { in: ["CHANNEL", "GROUP"] },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [spaces, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: [
          { lastMessageAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: {
          image: true,
          participants: {
            where: { leftAt: null },
            select: {
              userId: true,
              memberRole: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    const formatted = spaces.map((space) => {
      const isMember = space.participants.some((p) => p.userId === userId);
      return {
        id: space.id,
        name: space.name,
        description: space.description,
        type: space.type,
        visibility: space.visibility,
        image: space.image,
        memberCount: space.participants.length,
        isMember,
        createdAt: space.createdAt,
        lastMessageAt: space.lastMessageAt,
      };
    });

    return { spaces: formatted, totalCount, limit, offset };
  }

  // Messaging Engine Repository Methods
  async createMessage(senderId: bigint, dto: SendMessageDto) {
    const conversationId = BigInt(dto.conversationId);
    const parentMessageId = dto.parentMessageId
      ? BigInt(dto.parentMessageId)
      : null;
    const attachmentIds = (dto.attachmentIds || []).map((id) => BigInt(id));
    const mentionedUserIds = (dto.mentionedUserIds || []).map((id) => BigInt(id));
    const isMentionAll = Boolean(dto.isMentionAll);

    // Task 6.1: Idempotency check with clientMessageId
    if (dto.clientMessageId) {
      const existing = await prisma.chatMessage.findFirst({
        where: {
          conversationId,
          senderId,
          clientMessageId: dto.clientMessageId,
        },
        include: messageInclude,
      });
      if (existing) {
        return Object.assign(existing, { isDuplicate: true });
      }
    }

    return prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId,
          clientMessageId: dto.clientMessageId || null,
          content: dto.content,
          messageType: dto.messageType ?? "TEXT",
          parentMessageId,
          ...(attachmentIds.length > 0 && {
            attachments: {
              create: attachmentIds.map((assetId) => ({ assetId })),
            },
          }),
          ...((mentionedUserIds.length > 0 || isMentionAll) && {
            mentions: {
              create: [
                ...(isMentionAll ? [{ conversationId, isAll: true }] : []),
                ...mentionedUserIds.map((userId) => ({
                  conversationId,
                  userId,
                  isAll: false,
                })),
              ],
            },
          }),
        },
        include: messageInclude,
      });

      // Update conversation's last message timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });
  }

  async getMessageById(messageId: bigint) {
    return prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
  }

  async getConversationMessages(
    conversationId: bigint,
    options: FetchMessagesQueryDto,
  ) {
    const limit = options.limit ?? 50;
    const cursor = options.cursor ? BigInt(options.cursor) : null;
    
    let parentMessageWhere: { parentMessageId?: bigint | null } = {
      parentMessageId: null,
    };

    if (options.parentMessageId === "all") {
      parentMessageWhere = {};
    } else if (
      options.parentMessageId &&
      options.parentMessageId !== "null"
    ) {
      parentMessageWhere = {
        parentMessageId: BigInt(options.parentMessageId),
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...parentMessageWhere,
        ...(cursor && { id: { lt: cursor } }),
      },
      take: limit,
      orderBy: { id: "desc" },
      include: messageInclude,
    });

    return messages.reverse();
  }

  async editMessage(
    messageId: bigint,
    content: string,
    mentions?: { mentionedUserIds?: bigint[]; isMentionAll?: boolean },
  ) {
    return prisma.$transaction(async (tx) => {
      if (mentions) {
        await tx.chatMention.deleteMany({
          where: { messageId },
        });

        const isMentionAll = Boolean(mentions.isMentionAll);
        const mentionedUserIds = (mentions.mentionedUserIds || []).map((id) =>
          BigInt(id),
        );

        const existing = await tx.chatMessage.findUnique({
          where: { id: messageId },
          select: { conversationId: true },
        });

        if (existing && (mentionedUserIds.length > 0 || isMentionAll)) {
          await tx.chatMention.createMany({
            data: [
              ...(isMentionAll
                ? [{ messageId, conversationId: existing.conversationId, isAll: true }]
                : []),
              ...mentionedUserIds.map((userId) => ({
                messageId,
                conversationId: existing.conversationId,
                userId,
                isAll: false,
              })),
            ],
          });
        }
      }

      return tx.chatMessage.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
          editedAt: new Date(),
        },
        include: messageInclude,
      });
    });
  }

  async softDeleteMessage(messageId: bigint, deletedBy: bigint) {
    return prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedBy,
        content: "This message was deleted",
      },
      include: messageInclude,
    });
  }

  // Read Receipts & Reactions & Pins
  async markConversationAsRead(
    conversationId: bigint,
    userId: bigint,
    messageId: bigint,
  ) {
    const existing = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!existing || existing.leftAt !== null) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    // Never move the read cursor backwards if an older message ID arrives
    if (
      existing.lastReadMessageId !== null &&
      existing.lastReadMessageId >= messageId
    ) {
      return existing;
    }

    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadMessageId: messageId,
        lastReadAt: new Date(),
      },
    });
  }

  async toggleReaction(messageId: bigint, userId: bigint, emoji: string) {
    const existing = await prisma.chatReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.chatReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.chatReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    return prisma.chatReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });
  }

  async togglePinMessage(
    conversationId: bigint,
    messageId: bigint,
    userId: bigint,
  ) {
    const existing = await prisma.chatPinnedMessage.findUnique({
      where: {
        conversationId_messageId: {
          conversationId,
          messageId,
        },
      },
    });

    if (existing) {
      await prisma.chatPinnedMessage.delete({
        where: { id: existing.id },
      });
      return { isPinned: false, pinnedBy: userId };
    } else {
      await prisma.chatPinnedMessage.create({
        data: {
          conversationId,
          messageId,
          pinnedBy: userId,
        },
      });
      return { isPinned: true, pinnedBy: userId };
    }
  }

  async getPinnedMessages(conversationId: bigint) {
    return prisma.chatPinnedMessage.findMany({
      where: { conversationId },
      include: {
        message: {
          include: messageInclude,
        },
        pinnedByUser: {
          select: userSelect,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // File Asset Storage Methods
  async createAsset(data: CreateAssetData) {
    return prisma.fileAsset.create({
      data: {
        publicId: data.publicId,
        cloudinaryAssetId: data.cloudinaryAssetId ?? null,
        resourceType: data.resourceType,
        deliveryType: data.deliveryType ?? "UPLOAD",
        version: data.version ?? null,
        format: data.format ?? null,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        bytes: data.bytes,
        secureUrl: data.secureUrl ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        durationSeconds: data.durationSeconds ?? null,
        uploadedBy: data.uploadedBy ?? null,
      },
    });
  }

  async findAssetById(id: bigint) {
    return prisma.fileAsset.findUnique({
      where: { id },
    });
  }

  async deleteUnlinkedAsset(id: bigint, userId: bigint) {
    return prisma.fileAsset.deleteMany({
      where: {
        id,
        uploadedBy: userId,
        chatAttachments: { none: {} },
        mailAttachments: { none: {} },
      },
    });
  }

  async searchUsers(query?: string, excludeUserId?: bigint) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        ...(excludeUserId && { id: { not: excludeUserId } }),
        ...(query && query.trim().length > 0 && {
          OR: [
            { fullName: { contains: query.trim(), mode: "insensitive" } },
            { username: { contains: query.trim(), mode: "insensitive" } },
            { email: { contains: query.trim(), mode: "insensitive" } },
          ],
        }),
      },
      take: 50,
      select: userSelect,
      orderBy: { fullName: "asc" },
    });
  }

  async searchGlobal(
    userId: bigint,
    dto: GlobalSearchQueryDto,
  ): Promise<GlobalSearchResult> {
    const q = dto.q.trim();
    const type = dto.type || "ALL";
    const limit = dto.limit || 20;

    const shouldSearchMessages = type === "ALL" || type === "MESSAGES";
    const shouldSearchPeople = type === "ALL" || type === "PEOPLE";
    const shouldSearchSpaces = type === "ALL" || type === "SPACES";

    const [messages, people, spaces] = await Promise.all([
      shouldSearchMessages
        ? prisma.chatMessage.findMany({
            where: {
              deletedAt: null,
              content: { contains: q, mode: "insensitive" },
              conversation: {
                archivedAt: null,
                OR: [
                  { visibility: "PUBLIC" },
                  { participants: { some: { userId, leftAt: null } } },
                ],
              },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              sender: { select: userSelect },
              conversation: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  visibility: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      shouldSearchPeople
        ? prisma.user.findMany({
            where: {
              isActive: true,
              id: { not: userId },
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
            take: limit,
            select: userSelect,
            orderBy: { fullName: "asc" },
          })
        : Promise.resolve([]),

      shouldSearchSpaces
        ? prisma.conversation.findMany({
            where: {
              type: { in: ["GROUP", "CHANNEL"] },
              archivedAt: null,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
              AND: [
                {
                  OR: [
                    { visibility: "PUBLIC" },
                    { participants: { some: { userId, leftAt: null } } },
                  ],
                },
              ],
            },
            take: limit,
            include: {
              image: true,
              _count: {
                select: {
                  participants: {
                    where: { leftAt: null },
                  },
                },
              },
              participants: {
                where: { userId, leftAt: null },
                select: { memberRole: true },
              },
            },
            orderBy: { lastMessageAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const formattedSpaces = spaces.map((space) => ({
      id: space.id,
      name: space.name,
      description: space.description,
      type: space.type,
      visibility: space.visibility,
      imageUrl: space.image?.secureUrl || null,
      memberCount: space._count.participants,
      isMember: space.participants.length > 0,
      myRole: space.participants[0]?.memberRole || null,
      lastMessageAt: space.lastMessageAt,
    }));

    return {
      messages,
      people,
      spaces: formattedSpaces,
    };
  }

  async getUnreadCount(userId: bigint): Promise<number> {
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        leftAt: null,
        isArchived: false,
        conversation: {
          archivedAt: null,
          lastMessageAt: { not: null },
        },
      },
      select: {
        lastReadMessageId: true,
        lastReadAt: true,
        conversation: {
          select: {
            messages: {
              take: 1,
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              select: {
                id: true,
                senderId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    let count = 0;
    for (const p of participants) {
      const lastMsg = p.conversation.messages[0];
      if (!lastMsg) continue;
      if (lastMsg.senderId === userId) continue;
      if (p.lastReadMessageId !== null && p.lastReadMessageId >= lastMsg.id) {
        continue;
      }
      if (!p.lastReadAt || lastMsg.createdAt > p.lastReadAt) {
        count++;
      }
    }
    return count;
  }
}

export default ChatRepository;
