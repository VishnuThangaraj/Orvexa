import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type { FetchInboxOptions, FetchInboxResult } from "../types";

export const mailApi = {
  getInbox: async (options?: FetchInboxOptions): Promise<FetchInboxResult> => {
    const res = await api.get<ApiResponse<FetchInboxResult>>("/mail/inbox", {
      params: options,
    });
    return res.data.data;
  },
};

export default mailApi;
