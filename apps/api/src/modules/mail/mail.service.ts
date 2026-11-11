import AppError from "../../common/errors/AppError.js";
import MailRepository from "./mail.repository.js";
import { uploadBufferToCloudinary } from "../../infrastructure/cloudinary/cloudinary.service.js";
import type {
  AttachmentInput,
  CloudinaryResourceType,
  FetchInboxOptions,
  FetchInboxResult,
  FormattedInboxMessage,
  MailRecipientType,
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
      const isRecipient = parent.recipients.some((r) => r.userId === senderId);
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
        const foundSet = new Set(foundAssets.map((a) => a.id.toString()));
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

  // fetch user inbox mail with privacy sanitization and pagination
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

    const formattedMessages: FormattedInboxMessage[] = messages.map((msg) => {
      const userState = msg.userStates[0] ?? null;

      // Privacy: Only show BCC recipients if current user is the sender or that specific BCC recipient
      const visibleRecipients = msg.recipients
        .filter((r) => {
          if (r.recipientType !== "BCC") return true;
          return msg.senderId === userId || r.user.id === userId;
        })
        .map((r) => ({
          recipientType: r.recipientType,
          user: {
            id: r.user.id.toString(),
            fullName: r.user.fullName,
            username: r.user.username,
            email: r.user.email,
          },
        }));

      const cleanBody = msg.body.replace(/\s+/g, " ").trim();
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
        hasAttachments: msg.attachments.length > 0,
        attachments: msg.attachments.map((a) => ({
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
}

export default MailService;
