import api from "@/common/service/api";
import type { ApiResponse } from "@/modules/auth/types";
import type {
  Meeting,
  MeetingMessage,
  LiveKitTokenData,
  CreateMeetingInput,
  UpdateMeetingSettingsInput,
  MeetSignalKind,
  MeetSignalItem,
  MeetSignalsPollResponse,
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

  knockMeeting: async (
    code: string,
    displayName?: string,
  ): Promise<{ status: "ACCEPTED" | "PENDING" }> => {
    const res = await api.post<ApiResponse<{ status: "ACCEPTED" | "PENDING" }>>(
      `/meet/${code}/knock`,
      { displayName },
    );
    return res.data.data;
  },

  cancelKnock: async (code: string): Promise<{ success: boolean }> => {
    const res = await api.delete<ApiResponse<{ success: boolean }>>(`/meet/${code}/knock`);
    return res.data.data;
  },

  leaveMeeting: async (code: string): Promise<{ success: boolean }> => {
    const res = await api.post<ApiResponse<{ success: boolean }>>(`/meet/${code}/leave`);
    return res.data.data;
  },

  postSignal: async (
    code: string,
    data: {
      toUserId?: string | null;
      kind: MeetSignalKind;
      payload?: Record<string, unknown>;
    },
  ): Promise<MeetSignalItem> => {
    const res = await api.post<ApiResponse<MeetSignalItem>>(`/meet/${code}/signal`, data);
    return res.data.data;
  },

  getSignals: async (
    code: string,
    afterId?: string | null,
  ): Promise<MeetSignalsPollResponse> => {
    const res = await api.get<ApiResponse<MeetSignalsPollResponse>>(`/meet/${code}/signals`, {
      params: afterId ? { afterId } : undefined,
    });
    return res.data.data;
  },
};

export default meetApi;
