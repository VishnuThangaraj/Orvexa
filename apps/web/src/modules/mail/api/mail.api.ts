import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  FetchInboxOptions,
  FetchInboxResult,
  FetchThreadResult,
  MailCountsResult,
  MessageStateUpdate,
  SendReplyPayload,
} from "../types";

export const mailApi = {
  getInbox: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/inbox", {
      params: options,
    });
    return res.data.data;
  },

  getStarred: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/starred", {
      params: options,
    });
    return res.data.data;
  },

  getSent: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/sent", {
      params: options,
    });
    return res.data.data;
  },

  getDrafts: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/drafts", {
      params: options,
    });
    return res.data.data;
  },

  getSnoozed: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/snoozed", {
      params: options,
    });
    return res.data.data;
  },

  getTrash: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/trash", {
      params: options,
    });
    return res.data.data;
  },

  getCounts: async (): Promise<MailCountsResult> => {
    const res = await api.get<ApiResponse<MailCountsResult>>("/mail/counts");
    return res.data.data;
  },

  getThread: async (threadId: string): Promise<FetchThreadResult> => {
    const res = await api.get<ApiResponse<FetchThreadResult>>(
      `/mail/threads/${threadId}`,
    );
    return res.data.data;
  },

  updateMessageState: async (
    messageId: string,
    updates: MessageStateUpdate,
  ): Promise<any> => {
    const res = await api.patch<ApiResponse<any>>(
      `/mail/messages/${messageId}/state`,
      updates,
    );
    return res.data.data;
  },

  batchUpdateState: async (
    messageIds: string[],
    updates: MessageStateUpdate,
  ): Promise<{ count: number }> => {
    const res = await api.post<ApiResponse<{ count: number }>>(
      "/mail/messages/batch-state",
      { messageIds, ...updates },
    );
    return res.data.data;
  },

  sendReply: async (payload: SendReplyPayload): Promise<any> => {
    const res = await api.post<ApiResponse<any>>("/mail/send", payload);
    return res.data.data;
  },

  uploadAttachments: async (files: File[]): Promise<any> => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    const res = await api.post<ApiResponse<any>>("/mail/attachments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
};

export default mailApi;
