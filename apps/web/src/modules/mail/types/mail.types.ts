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
