export type MailRecipientType = "TO" | "CC" | "BCC";

export interface FormattedInboxRecipient {
  recipientType: MailRecipientType;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
  };
}

export interface FormattedInboxAttachment {
  id: string;
  originalFilename: string;
  mimeType: string;
  bytes: string;
  resourceType: string;
  format: string | null;
  secureUrl: string | null;
}

export interface FormattedInboxMessage {
  id: string;
  threadId: string | null;
  parentMessageId: string | null;
  subject: string;
  body: string;
  snippet: string;
  sentAt: string;
  sender: {
    id: string;
    fullName: string;
    username: string;
    email: string;
  };
  recipients: FormattedInboxRecipient[];
  isRead: boolean;
  readAt: string | null;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments: FormattedInboxAttachment[];
}

export interface InboxPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FetchInboxResult {
  messages: FormattedInboxMessage[];
  pagination: InboxPagination;
}

export interface FetchInboxOptions {
  page?: number;
  limit?: number;
  search?: string;
  isRead?: boolean;
  isStarred?: boolean;
}

export type FetchMailOptions = FetchInboxOptions;
export type FetchMailResult = FetchInboxResult;

export interface MailCountsResult {
  inboxUnread: number;
  drafts: number;
  trash: number;
  starred: number;
  snoozed: number;
  sent: number;
}

export interface MessageStateUpdate {
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}

export interface FormattedThreadMessage extends FormattedInboxMessage {
  isArchived: boolean;
  isTrashed: boolean;
  labels?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

export interface FetchThreadResult {
  threadId: string;
  subject: string;
  messageCount: number;
  messages: FormattedThreadMessage[];
}

export interface SendReplyPayload {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  parentMessageId: string;
  attachmentIds?: string[];
}

