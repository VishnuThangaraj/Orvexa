import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  HomeOverviewResult,
  HomeMailData,
  HomeChatData,
  HomeCalendarData,
  HomeMeetData,
  HomeDriveData,
  HomeTaskItem,
  HomeActivityItem,
  GlobalSearchResponse,
  UserDashboardPreferences,
} from "../types/home.types";

export const homeApi = {
  getOverview: async (timezone?: string): Promise<HomeOverviewResult> => {
    const res = await api.get<ApiResponse<HomeOverviewResult>>("/home/overview", {
      params: timezone ? { timezone } : undefined,
    });
    return res.data.data;
  },

  getMailSummary: async (): Promise<HomeMailData> => {
    const res = await api.get<ApiResponse<HomeMailData>>("/home/mail");
    return res.data.data;
  },

  getChatSummary: async (): Promise<HomeChatData> => {
    const res = await api.get<ApiResponse<HomeChatData>>("/home/chat");
    return res.data.data;
  },

  getCalendarSummary: async (timezone?: string): Promise<HomeCalendarData> => {
    const res = await api.get<ApiResponse<HomeCalendarData>>("/home/calendar", {
      params: timezone ? { timezone } : undefined,
    });
    return res.data.data;
  },

  getMeetSummary: async (): Promise<HomeMeetData> => {
    const res = await api.get<ApiResponse<HomeMeetData>>("/home/meet");
    return res.data.data;
  },

  getDriveSummary: async (): Promise<HomeDriveData> => {
    const res = await api.get<ApiResponse<HomeDriveData>>("/home/drive");
    return res.data.data;
  },

  getTasksSummary: async (): Promise<HomeTaskItem[]> => {
    const res = await api.get<ApiResponse<HomeTaskItem[]>>("/home/tasks");
    return res.data.data;
  },

  getActivitySummary: async (): Promise<HomeActivityItem[]> => {
    const res = await api.get<ApiResponse<HomeActivityItem[]>>("/home/activity");
    return res.data.data;
  },

  searchGlobal: async (
    q: string,
    limit = 5,
  ): Promise<GlobalSearchResponse> => {
    const res = await api.get<ApiResponse<GlobalSearchResponse>>("/home/search", {
      params: { q, limit },
    });
    return res.data.data;
  },

  getPreferences: async (): Promise<UserDashboardPreferences> => {
    const res = await api.get<ApiResponse<UserDashboardPreferences>>("/home/preferences");
    return res.data.data;
  },

  updatePreferences: async (
    data: Partial<UserDashboardPreferences>,
  ): Promise<UserDashboardPreferences> => {
    const res = await api.put<ApiResponse<UserDashboardPreferences>>("/home/preferences", data);
    return res.data.data;
  },
};

export default homeApi;
