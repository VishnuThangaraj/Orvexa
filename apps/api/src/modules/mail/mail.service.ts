import AppError from "../../common/errors/AppError.js";
import MailRepository from "./mail.repository.js";
import type {
  AttachmentInput,
  CloudinaryResourceType,
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
        [...to, ...cc, ...bcc]
          .map((i) => i.trim())
          .filter((i) => i.length > 0),
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
}

export default MailService;
