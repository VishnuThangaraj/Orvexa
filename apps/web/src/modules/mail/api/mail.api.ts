import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  FetchInboxOptions,
  FetchInboxResult,
  MailCountsResult,
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
};

export default mailApi;
