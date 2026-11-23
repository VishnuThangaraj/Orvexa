import AppError from "../../common/errors/AppError.js";
import MailRepository from "./mail.repository.js";
import { uploadBufferToCloudinary } from "../../infrastructure/cloudinary/cloudinary.service.js";
import type {
  AttachmentInput,
  CloudinaryResourceType,
  FetchInboxOptions,
  FetchInboxResult,
  FetchThreadResult,
  FormattedInboxMessage,
  FormattedThreadMessage,
  MailCountsResult,
  MailRecipientType,
  MessageStateUpdate,
  RawAttachmentMetadata,
  SendMailServiceParams,
} from "./mail.types.js";

class MailService {
  private mailRepository: MailRepository;

  constructor() {
    this.mailRepository = new MailRepository();
  }

  // Resolve resource type from MIME type if not provided
  private inferResourceType(mimeType: string): CloudinaryResourceType {
    const lower = mimeType.toLowerCase();
    if (lower.startsWith("image/")) return "IMAGE";
    if (lower.startsWith("video/")) return "VIDEO";
    return "RAW";
  }

  // Send mail with recipients, threading, user states, and attachment support
  async sendMail(params: SendMailServiceParams) {
    const {
      senderId,
      to,
      cc = [],
      bcc = [],
      subject = "",
      body = "",
      parentMessageId,
      attachmentIds = [],
      attachments = [],
      draftId,
    } = params;

    // 1. Verify sender exists
    const sender = await this.mailRepository.findUserById(senderId);
    if (!sender || !sender.isActive) {
      throw new AppError("Sender user not found or inactive", 404);
    }

    // 2. Validate recipients exist in input
    if (!to || to.length === 0) {
      throw new AppError("At least one recipient is required in 'to'", 400);
    }

    // 3. Resolve all recipient identifiers to actual database Users
    const allIdentifiers = Array.from(
      new Set(
        [...to, ...cc, ...bcc].map((i) => i.trim()).filter((i) => i.length > 0),
      ),
    );

    const foundUsers =
      await this.mailRepository.findUsersByIdentifiers(allIdentifiers);

    // Build lookup maps for rapid matching
    const userMap = new Map<string, (typeof foundUsers)[number]>();
    for (const u of foundUsers) {
      userMap.set(u.id.toString(), u);
      userMap.set(u.email.toLowerCase(), u);
      userMap.set(u.username.toLowerCase(), u);
      userMap.set(`${u.username.toLowerCase()}@orvexa.com`, u);
    }

    const resolveUser = (identifier: string) => {
      const cleaned = identifier.trim().toLowerCase();
      const stripped = cleaned.replace(/@orvexa\.com$/i, "");
      return (
        userMap.get(cleaned) ||
        userMap.get(stripped) ||
        userMap.get(`${cleaned}@orvexa.com`) ||
        null
      );
    };

    // Verify all 'to' recipients resolve
    for (const ident of to) {
      if (!resolveUser(ident)) {
        throw new AppError(`Recipient '${ident}' not found`, 404);
      }
    }

    // Verify all 'cc' recipients resolve
    for (const ident of cc) {
      if (!resolveUser(ident)) {
        throw new AppError(`CC recipient '${ident}' not found`, 404);
      }
    }

    // Verify all 'bcc' recipients resolve
    for (const ident of bcc) {
      if (!resolveUser(ident)) {
        throw new AppError(`BCC recipient '${ident}' not found`, 404);
      }
    }

    // Deduplicate recipients with priority: TO > CC > BCC
    const recipientMap = new Map<bigint, MailRecipientType>();

    for (const ident of to) {
      const user = resolveUser(ident)!;
      recipientMap.set(user.id, "TO");
    }

    for (const ident of cc) {
      const user = resolveUser(ident)!;
      if (!recipientMap.has(user.id)) {
        recipientMap.set(user.id, "CC");
      }
    }

    for (const ident of bcc) {
      const user = resolveUser(ident)!;
      if (!recipientMap.has(user.id)) {
        recipientMap.set(user.id, "BCC");
      }
    }

    const finalRecipients = Array.from(recipientMap.entries()).map(
      ([userId, recipientType]) => ({
        userId,
        recipientType,
      }),
    );

    // 4. Validate threading and parent message if provided
    let threadId: bigint | null = null;
    if (parentMessageId) {
      const parent = await this.mailRepository.findMessageById(parentMessageId);
      if (!parent) {
        throw new AppError("Parent message not found", 404);
      }

      // Ensure sender is a participant in the parent message/thread
      const isSender = parent.senderId === senderId;
      const isRecipient = parent.recipients.some((r: any) => r.userId === senderId);
      if (!isSender && !isRecipient) {
        throw new AppError(
          "You do not have permission to reply to this message thread",
          403,
        );
      }

      threadId = parent.threadId ?? parent.id;
    }

    // 5. Process attachments (both existing assetIds and new inline asset uploads)
    const resolvedAssetIds: bigint[] = [];

    // Process direct attachmentIds array
    for (const id of attachmentIds) {
      resolvedAssetIds.push(BigInt(id));
    }

    // Process mixed attachments array
    for (const item of attachments) {
      if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "bigint"
      ) {
        resolvedAssetIds.push(BigInt(item));
      } else if (typeof item === "object" && item !== null) {
        const meta = item as RawAttachmentMetadata;
        if (meta.assetId !== undefined && meta.assetId !== null) {
          resolvedAssetIds.push(BigInt(meta.assetId));
        } else if (meta.publicId && meta.originalFilename && meta.mimeType) {
          // Create FileAsset inline (e.g. from Cloudinary direct upload)
          const bytes =
            meta.bytes !== undefined ? BigInt(meta.bytes) : BigInt(0);
          const resourceType =
            meta.resourceType || this.inferResourceType(meta.mimeType);

          const createdAsset = await this.mailRepository.createAsset({
            publicId: meta.publicId,
            cloudinaryAssetId: meta.cloudinaryAssetId ?? null,
            resourceType,
            deliveryType: meta.deliveryType ?? "AUTHENTICATED",
            format: meta.format ?? null,
            originalFilename: meta.originalFilename,
            mimeType: meta.mimeType,
            bytes,
            secureUrl: meta.secureUrl ?? null,
            width: meta.width ?? null,
            height: meta.height ?? null,
            uploadedBy: senderId,
          });

          resolvedAssetIds.push(createdAsset.id);
        } else {
          throw new AppError(
            "Attachment must have either an 'assetId' or valid file metadata (publicId, originalFilename, mimeType)",
            400,
          );
        }
      }
    }

    // Deduplicate asset IDs
    const uniqueAssetIds = Array.from(new Set(resolvedAssetIds));

    // Verify all existing file assets exist
    if (uniqueAssetIds.length > 0) {
      const foundAssets =
        await this.mailRepository.findAssetsByIds(uniqueAssetIds);
      if (foundAssets.length !== uniqueAssetIds.length) {
        const foundSet = new Set(foundAssets.map((a: any) => a.id.toString()));
        const missing = uniqueAssetIds.find(
          (id) => !foundSet.has(id.toString()),
        );
        throw new AppError(
          `Attachment asset '${missing?.toString()}' not found`,
          404,
        );
      }
    }

    // 6. Create mail record atomically
    const createdMail = await this.mailRepository.createMail({
      senderId,
      threadId,
      parentMessageId: parentMessageId ?? null,
      subject,
      body,
      recipients: finalRecipients,
      assetIds: uniqueAssetIds,
      draftId: draftId ?? null,
    });

    return createdMail;
  }

  // Upload one or multiple files to Cloudinary and register them as FileAsset records
  async uploadAttachments(userId: bigint, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new AppError("No files provided for upload", 400);
    }

    const sender = await this.mailRepository.findUserById(userId);
    if (!sender || !sender.isActive) {
      throw new AppError("User not found or inactive", 404);
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
          folder: "orvexa/mail/attachments",
          resource_type: cloudinaryResType,
          filename_override: file.originalname,
        });

        const deliveryType =
          uploadResult.type?.toUpperCase() === "UPLOAD"
            ? "UPLOAD"
            : "AUTHENTICATED";

        const asset = await this.mailRepository.createAsset({
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
        };
      }),
    );

    return {
      assetId: uploadedAssets[0]?.assetId,
      assets: uploadedAssets,
    };
  }

  // Delete an attachment before sending
  async deleteAttachment(userId: bigint, assetId: bigint) {
    const asset = await this.mailRepository.findAssetById(assetId);
    if (!asset) {
      throw new AppError("Attachment asset not found", 404);
    }

    if (asset.uploadedBy !== userId) {
      throw new AppError("Unauthorized to delete this attachment", 403);
    }

    const result = await this.mailRepository.deleteUnlinkedAsset(
      assetId,
      userId,
    );
    if (result.count === 0) {
      throw new AppError(
        "Cannot delete an attachment already linked to a sent message",
        400,
      );
    }

    return true;
  }

  // Helper to format MailMessage records into standard FormattedInboxMessage
  private formatMessages(
    userId: bigint,
    messages: any[],
  ): FormattedInboxMessage[] {
    return messages.map((msg: any) => {
      const userState = msg.userStates?.[0] ?? null;

      // Privacy: Only show BCC recipients if current user is the sender or that specific BCC recipient
      const visibleRecipients = (msg.recipients || [])
        .filter((r: any) => {
          if (r.recipientType !== "BCC") return true;
          return msg.senderId === userId || r.user.id === userId;
        })
        .map((r: any) => ({
          recipientType: r.recipientType,
          user: {
            id: r.user.id.toString(),
            fullName: r.user.fullName,
            username: r.user.username,
            email: r.user.email,
          },
        }));

      const cleanBody = (msg.body || "").replace(/\s+/g, " ").trim();
      const snippet =
        cleanBody.length > 150 ? `${cleanBody.slice(0, 150)}...` : cleanBody;

      return {
        id: msg.id.toString(),
        threadId: msg.threadId ? msg.threadId.toString() : null,
        parentMessageId: msg.parentMessageId
          ? msg.parentMessageId.toString()
          : null,
        subject: msg.subject,
        body: msg.body,
        snippet,
        sentAt: msg.sentAt,
        sender: {
          id: msg.sender.id.toString(),
          fullName: msg.sender.fullName,
          username: msg.sender.username,
          email: msg.sender.email,
        },
        recipients: visibleRecipients,
        isRead: userState?.isRead ?? false,
        readAt: userState?.readAt ?? null,
        isStarred: userState?.isStarred ?? false,
        hasAttachments: (msg.attachments || []).length > 0,
        attachments: (msg.attachments || []).map((a: any) => ({
          id: a.asset.id.toString(),
          originalFilename: a.asset.originalFilename,
          mimeType: a.asset.mimeType,
          bytes: a.asset.bytes.toString(),
          resourceType: a.asset.resourceType,
          format: a.asset.format,
          secureUrl: a.asset.secureUrl,
        })),
      };
    });
  }

  // Helper to format MailDraft records into standard FormattedInboxMessage
  private formatDrafts(drafts: any[]): FormattedInboxMessage[] {
    return drafts.map((draft: any) => {
      const cleanBody = (draft.body || "").replace(/\s+/g, " ").trim();
      const snippet =
        cleanBody.length > 150 ? `${cleanBody.slice(0, 150)}...` : cleanBody;

      const recipients = (draft.recipients || []).map((r: any) => ({
        recipientType: r.recipientType,
        user: {
          id: r.user.id.toString(),
          fullName: r.user.fullName,
          username: r.user.username,
          email: r.user.email,
        },
      }));

      return {
        id: draft.id.toString(),
        threadId: null,
        parentMessageId: draft.parentMessageId
          ? draft.parentMessageId.toString()
          : null,
        subject: draft.subject || "(no subject)",
        body: draft.body || "",
        snippet,
        sentAt: draft.updatedAt,
        sender: {
          id: draft.user.id.toString(),
          fullName: draft.user.fullName,
          username: draft.user.username,
          email: draft.user.email,
        },
        recipients,
        isRead: true,
        readAt: draft.updatedAt,
        isStarred: false,
        hasAttachments: (draft.attachments || []).length > 0,
        attachments: (draft.attachments || []).map((a: any) => ({
          id: a.asset.id.toString(),
          originalFilename: a.asset.originalFilename,
          mimeType: a.asset.mimeType,
          bytes: a.asset.bytes.toString(),
          resourceType: a.asset.resourceType,
          format: a.asset.format,
          secureUrl: a.asset.secureUrl,
        })),
      };
    });
  }

  // Fetch user inbox mail
  async fetchInbox(
    userId: bigint,
    options: FetchInboxOptions = {},
  ): Promise<FetchInboxResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const { total, page, limit, messages } =
      await this.mailRepository.fetchInbox(userId, options);

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedMessages = this.formatMessages(userId, messages);

    return {
      messages: formattedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fetch starred mail
  async fetchStarred(
    userId: bigint,
    options: FetchInboxOptions = {},
  ): Promise<FetchInboxResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const { total, page, limit, messages } =
      await this.mailRepository.fetchStarred(userId, options);

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedMessages = this.formatMessages(userId, messages);

    return {
      messages: formattedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fetch sent mail
  async fetchSent(
    userId: bigint,
    options: FetchInboxOptions = {},
  ): Promise<FetchInboxResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const { total, page, limit, messages } =
      await this.mailRepository.fetchSent(userId, options);

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedMessages = this.formatMessages(userId, messages);

    return {
      messages: formattedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fetch drafts
  async fetchDrafts(
    userId: bigint,
    options: FetchInboxOptions = {},
  ): Promise<FetchInboxResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const { total, page, limit, drafts } =
      await this.mailRepository.fetchDrafts(userId, options);

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedMessages = this.formatDrafts(drafts);

    return {
      messages: formattedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fetch snoozed mail
  async fetchSnoozed(
    userId: bigint,
    options: FetchInboxOptions = {},
  ): Promise<FetchInboxResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const { total, page, limit, messages } =
      await this.mailRepository.fetchSnoozed(userId, options);

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedMessages = this.formatMessages(userId, messages);

    return {
      messages: formattedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fetch trash mail
  async fetchTrash(
    userId: bigint,
    options: FetchInboxOptions = {},
  ): Promise<FetchInboxResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const { total, page, limit, messages } =
      await this.mailRepository.fetchTrash(userId, options);

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedMessages = this.formatMessages(userId, messages);

    return {
      messages: formattedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fetch category counts for sidebar badges
  async fetchCounts(userId: bigint): Promise<MailCountsResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    return this.mailRepository.fetchCounts(userId);
  }

  // Fetch full conversation thread by thread ID or message ID
  async fetchThread(
    userId: bigint,
    targetId: bigint,
  ): Promise<FetchThreadResult> {
    const user = await this.mailRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404);
    }

    const threadData = await this.mailRepository.findThreadMessages(
      userId,
      targetId,
    );
    if (!threadData || threadData.messages.length === 0) {
      throw new AppError("Conversation thread not found", 404);
    }

    // Authorization check: User must be sender or recipient of at least one message in the thread
    const isParticipant = threadData.messages.some(
      (msg: any) =>
        msg.senderId === userId ||
        msg.recipients.some((r: any) => r.userId === userId),
    );

    if (!isParticipant) {
      throw new AppError(
        "You do not have permission to view this conversation",
        403,
      );
    }

    // Auto-mark unread messages as read for this user
    const unreadMessageIds = threadData.messages
      .filter((msg: any) => {
        const userState = msg.userStates?.[0];
        return !userState || !userState.isRead;
      })
      .map((msg: any) => msg.id);

    if (unreadMessageIds.length > 0) {
      await this.mailRepository.markMessagesAsRead(userId, unreadMessageIds);
    }

    // Format all messages in chronological order
    const formattedMessages: FormattedThreadMessage[] =
      threadData.messages.map((msg: any) => {
        const userState = msg.userStates?.[0] ?? null;

        // Privacy: Only show BCC recipients if current user is the sender or that specific BCC recipient
        const visibleRecipients = (msg.recipients || [])
          .filter((r: any) => {
            if (r.recipientType !== "BCC") return true;
            return msg.senderId === userId || r.user.id === userId;
          })
          .map((r: any) => ({
            recipientType: r.recipientType,
            user: {
              id: r.user.id.toString(),
              fullName: r.user.fullName,
              username: r.user.username,
              email: r.user.email,
            },
          }));

        const cleanBody = (msg.body || "").replace(/\s+/g, " ").trim();
        const snippet =
          cleanBody.length > 150 ? `${cleanBody.slice(0, 150)}...` : cleanBody;

        return {
          id: msg.id.toString(),
          threadId: msg.threadId ? msg.threadId.toString() : null,
          parentMessageId: msg.parentMessageId
            ? msg.parentMessageId.toString()
            : null,
          subject: msg.subject,
          body: msg.body,
          snippet,
          sentAt: msg.sentAt,
          sender: {
            id: msg.sender.id.toString(),
            fullName: msg.sender.fullName,
            username: msg.sender.username,
            email: msg.sender.email,
          },
          recipients: visibleRecipients,
          isRead: true, // Marked as read upon fetching
          readAt: userState?.readAt ?? new Date(),
          isStarred: userState?.isStarred ?? false,
          isArchived: userState?.isArchived ?? false,
          isTrashed: userState?.isTrashed ?? false,
          hasAttachments: (msg.attachments || []).length > 0,
          attachments: (msg.attachments || []).map((a: any) => ({
            id: a.asset.id.toString(),
            originalFilename: a.asset.originalFilename,
            mimeType: a.asset.mimeType,
            bytes: a.asset.bytes.toString(),
            resourceType: a.asset.resourceType,
            format: a.asset.format,
            secureUrl: a.asset.secureUrl,
          })),
          labels: (msg.messageLabels || []).map((ml: any) => ({
            id: ml.label.id.toString(),
            name: ml.label.name,
            color: ml.label.color,
          })),
        };
      });

    return {
      threadId: threadData.threadId.toString(),
      subject: threadData.subject,
      messageCount: formattedMessages.length,
      messages: formattedMessages,
    };
  }

  // Update user state for a single message (star, read/unread, archive, trash)
  async updateMessageState(
    userId: bigint,
    messageId: bigint,
    updates: MessageStateUpdate,
  ) {
    const message = await this.mailRepository.findMessageById(messageId);
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    const isParticipant =
      message.senderId === userId ||
      message.recipients.some((r: any) => r.userId === userId);

    if (!isParticipant) {
      throw new AppError(
        "You do not have permission to modify this message",
        403,
      );
    }

    const updated = await this.mailRepository.updateMessageUserState(
      userId,
      messageId,
      updates,
    );

    return {
      messageId: messageId.toString(),
      isRead: updated.isRead,
      readAt: updated.readAt,
      isStarred: updated.isStarred,
      isArchived: updated.isArchived,
      isTrashed: updated.isTrashed,
      trashedAt: updated.trashedAt,
    };
  }

  // Batch update user states for multiple messages
  async batchUpdateMessageStates(
    userId: bigint,
    messageIds: bigint[],
    updates: MessageStateUpdate,
  ) {
    if (messageIds.length === 0) {
      return { count: 0 };
    }

    const result = await this.mailRepository.batchUpdateMessageStates(
      userId,
      messageIds,
      updates,
    );

    return {
      count: result.count,
    };
  }
}

export default MailService;
