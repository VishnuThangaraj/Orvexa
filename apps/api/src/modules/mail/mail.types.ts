import type {
  CloudinaryDeliveryType,
  CloudinaryResourceType,
  MailRecipientType,
} from "../../generated/prisma/enums.js";

export { MailRecipientType, CloudinaryResourceType, CloudinaryDeliveryType };

export interface RawAttachmentMetadata {
  assetId?: string | number | bigint;
  publicId?: string;
  cloudinaryAssetId?: string;
  resourceType?: CloudinaryResourceType;
  deliveryType?: CloudinaryDeliveryType;
  format?: string;
  originalFilename?: string;
  mimeType?: string;
  bytes?: number | string | bigint;
  secureUrl?: string;
  width?: number;
  height?: number;
}

export type AttachmentInput = string | number | bigint | RawAttachmentMetadata;

export interface SendMailDTO {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  body?: string;
  parentMessageId?: string | number | bigint;
  attachmentIds?: Array<string | number | bigint>;
  attachments?: AttachmentInput[];
  draftId?: string | number | bigint;
}

export interface SendMailServiceParams {
  senderId: bigint;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  parentMessageId?: bigint | null;
  attachmentIds?: bigint[];
  attachments?: AttachmentInput[];
  draftId?: bigint | null;
}

export interface ResolvedUserRecipient {
  userId: bigint;
  fullName: string;
  username: string;
  email: string;
  recipientType: MailRecipientType;
}

export interface CreateMailRecordData {
  senderId: bigint;
  threadId?: bigint | null;
  parentMessageId?: bigint | null;
  subject: string;
  body: string;
  recipients: Array<{
    userId: bigint;
    recipientType: MailRecipientType;
  }>;
  assetIds?: bigint[];
  draftId?: bigint | null;
}

export interface CreateAssetData {
  publicId: string;
  cloudinaryAssetId?: string | null;
  resourceType: CloudinaryResourceType;
  deliveryType?: CloudinaryDeliveryType;
  version?: number | null;
  format?: string | null;
  originalFilename: string;
  mimeType: string;
  bytes: bigint;
  secureUrl?: string | null;
  width?: number | null;
  height?: number | null;
  uploadedBy?: bigint | null;
}

export interface UploadedAssetDTO {
  assetId: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  bytes: string;
  secureUrl: string | null;
  resourceType: CloudinaryResourceType;
  format: string | null;
}

export interface UploadAttachmentResponse {
  assetId?: string;
  assets: UploadedAssetDTO[];
}

