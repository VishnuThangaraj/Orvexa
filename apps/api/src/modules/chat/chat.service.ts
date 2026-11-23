import AppError from "../../common/errors/AppError.js";
import prisma from "../../infrastructure/database/prisma.js";
import { uploadBufferToCloudinary } from "../../infrastructure/cloudinary/cloudinary.service.js";
import { getIO } from "../../sockets/socket.instance.js";
import ChatRepository from "./chat.repository.js";
import type {
  CreateGroupOrChannelDto,
  FetchConversationsQueryDto,
  UpdateConversationDto,
  UpdateParticipantSettingsDto,
  ConversationMemberRole,
  SendMessageDto,
  FetchMessagesQueryDto,
  CloudinaryResourceType,
  UploadAttachmentsResponse,
  GlobalSearchQueryDto,
} from "./chat.types.js";

export class ChatService {
  private chatRepository: ChatRepository;

  constructor() {
    this.chatRepository = new ChatRepository();
  }

  async getOrCreateDirectConversation(userId: bigint, recipientId: bigint) {
    if (userId === recipientId) {
      throw new AppError("Cannot create a direct conversation with yourself", 400);
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isActive: true },
    });

    if (!recipient) {
      throw new AppError("Recipient user not found", 404);
    }

    if (!recipient.isActive) {
      throw new AppError("Recipient account is deactivated", 400);
    }

    const existing = await this.chatRepository.findDirectConversation(
      userId,
      recipientId,
    );

    if (existing) {
      return existing;
    }

    return this.chatRepository.createDirectConversation(userId, recipientId);
  }

  async createGroupOrChannel(creatorId: bigint, dto: CreateGroupOrChannelDto) {
    if (dto.participantIds && dto.participantIds.length > 0) {
      const numericIds = dto.participantIds.map((id) => BigInt(id));
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: numericIds } },
        select: { id: true },
      });

      if (existingUsers.length !== numericIds.length) {
        throw new AppError("One or more participant users do not exist", 400);
      }
    }

    return this.chatRepository.createGroupOrChannel(creatorId, dto);
  }

  async getConversationDetails(conversationId: bigint, userId: bigint) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    // Public channels can be viewed by anyone; otherwise must be an active participant
    const isPublicChannel =
      conversation.type === "CHANNEL" && conversation.visibility === "PUBLIC";

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isPublicChannel && !isParticipant) {
      throw new AppError(
        "Access denied: You are not a participant in this conversation",
        403,
      );
    }

    return conversation;
  }

  async getUserConversations(
    userId: bigint,
    options: FetchConversationsQueryDto,
  ) {
    return this.chatRepository.getUserConversations(userId, options);
  }

  async addParticipants(
    conversationId: bigint,
    requesterId: bigint,
    userIds: (bigint | string)[],
  ) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.type === "DIRECT") {
      throw new AppError(
        "Cannot add participants to a direct conversation",
        400,
      );
    }

    // Check authorization: must be OWNER or ADMIN (or member in a public channel)
    const requesterParticipant = conversation.participants.find(
      (p) => p.userId === requesterId,
    );

    const isOwnerOrAdmin =
      requesterParticipant?.memberRole === "OWNER" ||
      requesterParticipant?.memberRole === "ADMIN";

    const isPublicChannel =
      conversation.type === "CHANNEL" && conversation.visibility === "PUBLIC";

    if (!isOwnerOrAdmin && !isPublicChannel) {
      throw new AppError(
        "Only conversation owners and admins can add participants",
        403,
      );
    }

    const numericIds = userIds.map((id) => BigInt(id));
    const validUsers = await prisma.user.findMany({
      where: { id: { in: numericIds } },
      select: { id: true },
    });

    if (validUsers.length !== numericIds.length) {
      throw new AppError("One or more user IDs do not exist", 400);
    }

    return this.chatRepository.addParticipants(conversationId, numericIds);
  }

  async removeParticipant(
    conversationId: bigint,
    requesterId: bigint,
    targetUserId: bigint,
  ) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.type === "DIRECT") {
      throw new AppError(
        "Cannot remove participants from a direct conversation",
        400,
      );
    }

    const requesterParticipant = conversation.participants.find(
      (p) => p.userId === requesterId,
    );

    if (!requesterParticipant) {
      throw new AppError("You are not a participant in this conversation", 403);
    }

    const targetParticipant = conversation.participants.find(
      (p) => p.userId === targetUserId,
    );

    if (!targetParticipant) {
      throw new AppError(
        "Target user is not an active participant in this conversation",
        404,
      );
    }

    if (targetParticipant.memberRole === "OWNER") {
      throw new AppError(
        "Cannot remove the owner of the conversation",
        400,
      );
    }

    // A user can leave themselves, OR owner/admin can remove a member
    const isSelfLeaving = requesterId === targetUserId;
    const isOwnerOrAdmin =
      requesterParticipant.memberRole === "OWNER" ||
      requesterParticipant.memberRole === "ADMIN";

    if (!isSelfLeaving && !isOwnerOrAdmin) {
      throw new AppError(
        "Only owners and admins can remove other participants",
        403,
      );
    }

    return this.chatRepository.removeParticipant(conversationId, targetUserId);
  }

  async updateParticipantRole(
    conversationId: bigint,
    requesterId: bigint,
    targetUserId: bigint,
    role: ConversationMemberRole,
  ) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const requesterParticipant = conversation.participants.find(
      (p) => p.userId === requesterId,
    );

    if (requesterParticipant?.memberRole !== "OWNER") {
      throw new AppError(
        "Only the conversation owner can change member roles",
        403,
      );
    }

    const targetParticipant = conversation.participants.find(
      (p) => p.userId === targetUserId,
    );

    if (!targetParticipant) {
      throw new AppError("Target participant not found", 404);
    }

    if (targetParticipant.memberRole === "OWNER") {
      throw new AppError("Cannot change role of the owner", 400);
    }

    return this.chatRepository.updateParticipantRole(
      conversationId,
      targetUserId,
      role,
    );
  }

  async updateParticipantSettings(
    conversationId: bigint,
    userId: bigint,
    settings: UpdateParticipantSettingsDto,
  ) {
    const participant = await this.chatRepository.getParticipant(
      conversationId,
      userId,
    );

    if (!participant || participant.leftAt !== null) {
      throw new AppError("You are not an active participant in this conversation", 403);
    }

    return this.chatRepository.updateParticipantSettings(
      conversationId,
      userId,
      settings,
    );
  }

  async updateConversation(
    conversationId: bigint,
    requesterId: bigint,
    data: UpdateConversationDto,
  ) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const requesterParticipant = conversation.participants.find(
      (p) => p.userId === requesterId,
    );

    const isOwnerOrAdmin =
      requesterParticipant?.memberRole === "OWNER" ||
      requesterParticipant?.memberRole === "ADMIN";

    if (!isOwnerOrAdmin) {
      throw new AppError(
        "Only conversation owners and admins can update conversation settings",
        403,
      );
    }

    return this.chatRepository.updateConversation(conversationId, data);
  }

  async discoverPublicSpaces(
    userId: bigint,
    search?: string,
    limit?: number,
    offset?: number,
  ) {
    return this.chatRepository.discoverPublicSpaces(
      userId,
      search,
      limit,
      offset,
    );
  }

  async joinPublicSpace(conversationId: bigint, userId: bigint) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throw new AppError("Space not found", 404);
    }

    if (conversation.type === "DIRECT") {
      throw new AppError("Cannot join a direct conversation", 400);
    }

    if (conversation.visibility !== "PUBLIC") {
      throw new AppError(
        "Cannot join a private space without an invitation",
        403,
      );
    }

    const activeParticipant = conversation.participants.find(
      (p) => p.userId === userId && p.leftAt === null,
    );
    if (activeParticipant) {
      return conversation;
    }

    await this.chatRepository.addParticipants(conversationId, [userId]);
    return this.chatRepository.getConversationById(conversationId);
  }

  // Messaging Engine Services
  async sendMessage(senderId: bigint, dto: SendMessageDto) {
    const conversationId = BigInt(dto.conversationId);
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const isPublicChannel =
      conversation.type === "CHANNEL" && conversation.visibility === "PUBLIC";

    const senderParticipant = conversation.participants.find(
      (p) => p.userId === senderId,
    );

    if (!isPublicChannel && !senderParticipant) {
      throw new AppError(
        "You must be a participant to send messages in this conversation",
        403,
      );
    }

    // MANDATORY FIX 3: Enforce Space-only mentions
    const isDirect = conversation.type === "DIRECT";
    if (isDirect) {
      if (
        (dto.mentionedUserIds && dto.mentionedUserIds.length > 0) ||
        dto.isMentionAll
      ) {
        throw new AppError("Mentions are not allowed in direct messages", 400);
      }
      dto.mentionedUserIds = [];
      dto.isMentionAll = false;
    } else {
      // Space conversation (GROUP or CHANNEL)
      const isManager =
        senderParticipant?.memberRole === "OWNER" ||
        senderParticipant?.memberRole === "ADMIN";

      // Detect @all or @everyone in text if not explicitly flagged
      if (!dto.isMentionAll && /(?:^|\s)@(all|everyone)\b/i.test(dto.content)) {
        dto.isMentionAll = true;
      }

      if (dto.isMentionAll && !isManager) {
        throw new AppError(
          "Only space managers can mention @all or @everyone",
          403,
        );
      }

      const activeParticipants = conversation.participants.filter(
        (p) => p.leftAt === null,
      );
      const activeParticipantMap = new Map(
        activeParticipants.map((p) => [String(p.userId), p]),
      );

      if (dto.mentionedUserIds && dto.mentionedUserIds.length > 0) {
        for (const uid of dto.mentionedUserIds) {
          if (!activeParticipantMap.has(String(uid))) {
            throw new AppError(
              "Cannot mention a user who is not a member of this space",
              400,
            );
          }
        }
      } else {
        // Automatically extract @username mentions matching active space members
        const usernameMatches = dto.content.match(/(?:^|\s)@([a-zA-Z0-9_.-]+)\b/g);
        if (usernameMatches) {
          const mentionedIds: bigint[] = [];
          for (const match of usernameMatches) {
            const raw = match.trim().replace(/^@/, "").toLowerCase();
            if (raw === "all" || raw === "everyone") continue;
            const found = activeParticipants.find(
              (p) =>
                p.user.username.toLowerCase() === raw ||
                p.user.fullName.toLowerCase().replace(/\s+/g, "") === raw,
            );
            if (found && !mentionedIds.includes(found.userId)) {
              mentionedIds.push(found.userId);
            }
          }
          if (mentionedIds.length > 0) {
            dto.mentionedUserIds = mentionedIds;
          }
        }
      }

      if (dto.mentionedUserIds && dto.mentionedUserIds.length > 0) {
        dto.mentionedUserIds = Array.from(
          new Set(dto.mentionedUserIds.map((id) => String(id))),
        ).map((id) => BigInt(id));
      }
    }

    if (dto.parentMessageId) {
      const parent = await this.chatRepository.getMessageById(
        BigInt(dto.parentMessageId),
      );
      if (!parent || parent.conversationId !== conversationId) {
        throw new AppError("Parent message not found in this conversation", 404);
      }
    }

    // Process & validate attachments if provided
    let messageType = dto.messageType;
    if (dto.attachmentIds && dto.attachmentIds.length > 0) {
      const assets = await Promise.all(
        dto.attachmentIds.map(async (id) => {
          const asset = await this.chatRepository.findAssetById(BigInt(id));
          if (!asset) {
            throw new AppError(`Attachment with ID ${id} not found`, 404);
          }
          return asset;
        }),
      );

      // Automatically infer messageType if default/unspecified
      if (!messageType || messageType === "TEXT") {
        const allImages = assets.every((a) => a.resourceType === "IMAGE");
        const allAudio = assets.every((a) => a.mimeType.toLowerCase().startsWith("audio/"));
        if (allImages) {
          messageType = "IMAGE";
        } else if (allAudio) {
          messageType = "AUDIO";
        } else {
          messageType = "FILE";
        }
      }
    }

    const message = await this.chatRepository.createMessage(senderId, {
      ...dto,
      messageType,
    });

    // Task 6.1: If duplicate clientMessageId was detected, return existing message idempotently
    if ((message as any).isDuplicate) {
      return message;
    }

    // Create notifications for mentioned users
    if (
      !isDirect &&
      (dto.isMentionAll ||
        (dto.mentionedUserIds && dto.mentionedUserIds.length > 0))
    ) {
      try {
        const activeParticipants = conversation.participants.filter(
          (p) => p.leftAt === null,
        );
        const senderUser = conversation.participants.find(
          (p) => p.userId === senderId,
        )?.user;
        const senderName = senderUser?.fullName || "A user";
        const spaceName = conversation.name || "Space";

        let userIdsToNotify: bigint[] = [];
        if (dto.isMentionAll) {
          userIdsToNotify = activeParticipants
            .map((p) => p.userId)
            .filter((id) => id !== senderId);
        } else if (dto.mentionedUserIds) {
          userIdsToNotify = (dto.mentionedUserIds as bigint[]).filter(
            (id) => id !== senderId,
          );
        }

        if (userIdsToNotify.length > 0) {
          await prisma.notification.createMany({
            data: userIdsToNotify.map((userId) => ({
              userId,
              actorId: senderId,
              title: dto.isMentionAll
                ? `${senderName} mentioned @all in ${spaceName}`
                : `${senderName} mentioned you in ${spaceName}`,
              message: dto.content.slice(0, 200),
              type: "CHAT" as any,
              referenceId: message.id,
              referenceType: "CHAT_MENTION",
              actionUrl: `/chat?c=${conversationId}&m=${message.id}`,
            })),
          });
        }
      } catch (err) {
        console.error("Failed to generate mention notifications:", err);
      }
    }

    // Broadcast to conversation room & each participant's room via WebSockets
    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:received", message);
      if (conversation?.participants) {
        for (const p of conversation.participants) {
          if (p.leftAt === null) {
            io.to(`user:${p.userId}`).emit("message:received", message);
          }
        }
      }
    } catch {
      // In case WebSocket server is not running in test context
    }

    return message;
  }

  async getMessages(
    conversationId: bigint,
    userId: bigint,
    options: FetchMessagesQueryDto,
  ) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const isPublicChannel =
      conversation.type === "CHANNEL" && conversation.visibility === "PUBLIC";

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isPublicChannel && !isParticipant) {
      throw new AppError(
        "Access denied: You are not a participant in this conversation",
        403,
      );
    }

    return this.chatRepository.getConversationMessages(conversationId, options);
  }

  async editMessage(
    conversationId: bigint,
    messageId: bigint,
    userId: bigint,
    content: string,
    mentionOptions?: {
      mentionedUserIds?: (bigint | string)[];
      isMentionAll?: boolean;
    },
  ) {
    const message = await this.chatRepository.getMessageById(messageId);

    if (!message || message.conversationId !== conversationId) {
      throw new AppError("Message not found in this conversation", 404);
    }

    if (message.deletedAt !== null) {
      throw new AppError("Cannot edit a deleted message", 400);
    }

    if (message.senderId !== userId) {
      throw new AppError("You can only edit your own messages", 403);
    }

    const conversation =
      await this.chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const isDirect = conversation.type === "DIRECT";
    let isMentionAll = Boolean(mentionOptions?.isMentionAll);
    let mentionedUserIds = (mentionOptions?.mentionedUserIds || []).map((id) =>
      BigInt(id),
    );

    if (isDirect) {
      if (mentionedUserIds.length > 0 || isMentionAll) {
        throw new AppError("Mentions are not allowed in direct messages", 400);
      }
      isMentionAll = false;
      mentionedUserIds = [];
    } else {
      const senderParticipant = conversation.participants.find(
        (p) => p.userId === userId,
      );
      const isManager =
        senderParticipant?.memberRole === "OWNER" ||
        senderParticipant?.memberRole === "ADMIN";

      if (!isMentionAll && /(?:^|\s)@(all|everyone)\b/i.test(content)) {
        isMentionAll = true;
      }

      if (isMentionAll && !isManager) {
        throw new AppError(
          "Only space managers can mention @all or @everyone",
          403,
        );
      }

      const activeParticipants = conversation.participants.filter(
        (p) => p.leftAt === null,
      );
      const activeParticipantMap = new Map(
        activeParticipants.map((p) => [String(p.userId), p]),
      );

      for (const uid of mentionedUserIds) {
        if (!activeParticipantMap.has(String(uid))) {
          throw new AppError(
            "Cannot mention a user who is not a member of this space",
            400,
          );
        }
      }

      if (mentionedUserIds.length === 0) {
        const usernameMatches = content.match(/(?:^|\s)@([a-zA-Z0-9_.-]+)\b/g);
        if (usernameMatches) {
          for (const match of usernameMatches) {
            const raw = match.trim().replace(/^@/, "").toLowerCase();
            if (raw === "all" || raw === "everyone") continue;
            const found = activeParticipants.find(
              (p) =>
                p.user.username.toLowerCase() === raw ||
                p.user.fullName.toLowerCase().replace(/\s+/g, "") === raw,
            );
            if (found && !mentionedUserIds.includes(found.userId)) {
              mentionedUserIds.push(found.userId);
            }
          }
        }
      }

      mentionedUserIds = Array.from(
        new Set(mentionedUserIds.map((id) => String(id))),
      ).map((id) => BigInt(id));
    }

    const updated = await this.chatRepository.editMessage(
      messageId,
      content,
      isDirect ? undefined : { mentionedUserIds, isMentionAll },
    );

    // Broadcast update via WebSockets
    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:updated", updated);
    } catch {
      // Ignore if socket server is offline
    }

    return updated;
  }

  async deleteMessage(
    conversationId: bigint,
    messageId: bigint,
    userId: bigint,
  ) {
    const message = await this.chatRepository.getMessageById(messageId);

    if (!message || message.conversationId !== conversationId) {
      throw new AppError("Message not found in this conversation", 404);
    }

    if (message.deletedAt !== null) {
      throw new AppError("Message is already deleted", 400);
    }

    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    const requesterParticipant = conversation?.participants.find(
      (p) => p.userId === userId,
    );

    const isSender = message.senderId === userId;
    const isOwnerOrAdmin =
      requesterParticipant?.memberRole === "OWNER" ||
      requesterParticipant?.memberRole === "ADMIN";

    if (!isSender && !isOwnerOrAdmin) {
      throw new AppError(
        "You do not have permission to delete this message",
        403,
      );
    }

    const deleted = await this.chatRepository.softDeleteMessage(
      messageId,
      userId,
    );

    // Broadcast deletion via WebSockets
    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:deleted", {
        conversationId: String(conversationId),
        messageId: String(messageId),
      });
    } catch {
      // Ignore if socket server is offline
    }

    return deleted;
  }

  // Real-Time Interactions (Read Receipts, Reactions, Pinned Messages)
  async markMessageAsRead(
    conversationId: bigint,
    userId: bigint,
    messageId: bigint,
  ) {
    const updated = await this.chatRepository.markConversationAsRead(
      conversationId,
      userId,
      messageId,
    );

    const readAtIso = updated.lastReadAt
      ? updated.lastReadAt.toISOString()
      : new Date().toISOString();

    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:read_receipt", {
        conversationId: String(conversationId),
        userId: String(userId),
        messageId: String(messageId),
        readAt: readAtIso,
      });
    } catch {
      // Ignore if socket server offline
    }

    return updated;
  }

  async toggleReaction(
    conversationId: bigint,
    messageId: bigint,
    userId: bigint,
    emoji: string,
  ) {
    const message = await this.chatRepository.getMessageById(messageId);

    if (!message || message.conversationId !== conversationId) {
      throw new AppError("Message not found in this conversation", 404);
    }

    const reactions = await this.chatRepository.toggleReaction(
      messageId,
      userId,
      emoji,
    );

    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:reaction_updated", {
        conversationId: String(conversationId),
        messageId: String(messageId),
        reactions,
      });
    } catch {
      // Ignore if socket offline
    }

    return reactions;
  }

  async togglePinMessage(
    conversationId: bigint,
    messageId: bigint,
    userId: bigint,
  ) {
    const message = await this.chatRepository.getMessageById(messageId);

    if (!message || message.conversationId !== conversationId) {
      throw new AppError("Message not found in this conversation", 404);
    }

    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    const requesterParticipant = conversation?.participants.find(
      (p) => p.userId === userId,
    );

    const isDirectChat = conversation?.type === "DIRECT";
    const isOwnerOrAdmin =
      isDirectChat ||
      requesterParticipant?.memberRole === "OWNER" ||
      requesterParticipant?.memberRole === "ADMIN";

    if (!isOwnerOrAdmin) {
      throw new AppError(
        "Only conversation owners and admins can pin or unpin messages",
        403,
      );
    }

    const result = await this.chatRepository.togglePinMessage(
      conversationId,
      messageId,
      userId,
    );

    try {
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:pinned_updated", {
        conversationId: String(conversationId),
        messageId: String(messageId),
        isPinned: result.isPinned,
        pinnedBy: String(userId),
      });
    } catch {
      // Ignore if socket offline
    }

    return result;
  }

  async getPinnedMessages(conversationId: bigint, userId: bigint) {
    const conversation =
      await this.chatRepository.getConversationById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new AppError(
        "You must be a participant to view pinned messages",
        403,
      );
    }

    return this.chatRepository.getPinnedMessages(conversationId);
  }

  // Media & Attachment Handling
  private inferResourceType(mimeType: string): CloudinaryResourceType {
    const lower = mimeType.toLowerCase();
    if (lower.startsWith("image/")) return "IMAGE";
    if (lower.startsWith("video/")) return "VIDEO";
    return "RAW";
  }

  async uploadAttachments(
    userId: bigint,
    files: Express.Multer.File[],
  ): Promise<UploadAttachmentsResponse> {
    if (!files || files.length === 0) {
      throw new AppError("No files provided for upload", 400);
    }

    const uploadedAssets = await Promise.all(
      files.map(async (file) => {
        const mimeType = file.mimetype || "application/octet-stream";
        const resourceType = this.inferResourceType(mimeType);
        const cloudinaryResType =
          resourceType === "IMAGE"
            ? "image"
            : resourceType === "VIDEO"
              ? "video"
              : "raw";

        const uploadResult = await uploadBufferToCloudinary(file.buffer, {
          folder: "orvexa/chat/attachments",
          resource_type: cloudinaryResType,
          filename_override: file.originalname,
        });

        const deliveryType =
          uploadResult.type?.toUpperCase() === "UPLOAD"
            ? "UPLOAD"
            : "AUTHENTICATED";

        const asset = await this.chatRepository.createAsset({
          publicId: uploadResult.public_id,
          cloudinaryAssetId: uploadResult.asset_id ?? null,
          resourceType,
          deliveryType,
          version: uploadResult.version ?? null,
          format: uploadResult.format ?? null,
          originalFilename: file.originalname || "attachment",
          mimeType,
          bytes: BigInt(uploadResult.bytes || file.size),
          secureUrl: uploadResult.secure_url ?? null,
          width: uploadResult.width ?? null,
          height: uploadResult.height ?? null,
          uploadedBy: userId,
        });

        return {
          assetId: asset.id.toString(),
          publicId: asset.publicId,
          originalFilename: asset.originalFilename,
          mimeType: asset.mimeType,
          bytes: asset.bytes.toString(),
          secureUrl: asset.secureUrl,
          resourceType: asset.resourceType,
          format: asset.format,
          width: asset.width,
          height: asset.height,
        };
      }),
    );

    return {
      assetId: uploadedAssets[0]?.assetId,
      assets: uploadedAssets,
    };
  }

  async deleteAttachment(id: bigint, userId: bigint) {
    const asset = await this.chatRepository.findAssetById(id);
    if (!asset) {
      throw new AppError("Attachment not found", 404);
    }

    if (asset.uploadedBy !== userId) {
      throw new AppError(
        "You can only delete attachments uploaded by you",
        403,
      );
    }

    const result = await this.chatRepository.deleteUnlinkedAsset(id, userId);
    if (result.count === 0) {
      throw new AppError(
        "Cannot delete an attachment that is already part of a sent message",
        400,
      );
    }

    return { success: true };
  }

  async searchUsers(query?: string, excludeUserId?: bigint) {
    return this.chatRepository.searchUsers(query, excludeUserId);
  }

  async searchGlobal(userId: bigint, dto: GlobalSearchQueryDto) {
    return this.chatRepository.searchGlobal(userId, dto);
  }

  async getUnreadCount(userId: bigint): Promise<number> {
    return this.chatRepository.getUnreadCount(userId);
  }
}

export default ChatService;
