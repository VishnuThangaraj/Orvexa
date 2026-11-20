import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  Meeting,
  MeetingMessage,
  LiveKitTokenData,
  CreateMeetingInput,
  UpdateMeetingSettingsInput,
} from "../types/meet.types";

export const meetApi = {
  createMeeting: async (data: CreateMeetingInput): Promise<Meeting> => {
    const res = await api.post<ApiResponse<Meeting>>("/meet", data);
    return res.data.data;
  },

  getMeetingByCode: async (code: string): Promise<Meeting> => {
    const res = await api.get<ApiResponse<Meeting>>(`/meet/${code}`);
    return res.data.data;
  },

  listMyMeetings: async (): Promise<Meeting[]> => {
    const res = await api.get<ApiResponse<Meeting[]>>("/meet");
    return res.data.data;
  },

  getLiveKitToken: async (code: string): Promise<LiveKitTokenData> => {
    const res = await api.post<ApiResponse<LiveKitTokenData>>(`/meet/${code}/token`);
    return res.data.data;
  },

  updateSettings: async (
    code: string,
    data: UpdateMeetingSettingsInput,
  ): Promise<Meeting> => {
    const res = await api.patch<ApiResponse<Meeting>>(`/meet/${code}/settings`, data);
    return res.data.data;
  },

  admitParticipant: async (
    code: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/meet/${code}/admit`,
      { userId },
    );
    return res.data.data;
  },

  denyParticipant: async (
    code: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/meet/${code}/deny`,
      { userId },
    );
    return res.data.data;
  },

  endMeeting: async (code: string): Promise<Meeting> => {
    const res = await api.post<ApiResponse<Meeting>>(`/meet/${code}/end`);
    return res.data.data;
  },

  sendMessage: async (code: string, content: string): Promise<MeetingMessage> => {
    const res = await api.post<ApiResponse<MeetingMessage>>(`/meet/${code}/messages`, {
      content,
    });
    return res.data.data;
  },

  getMessages: async (code: string): Promise<MeetingMessage[]> => {
    const res = await api.get<ApiResponse<MeetingMessage[]>>(`/meet/${code}/messages`);
    return res.data.data;
  },
};

export default meetApi;
