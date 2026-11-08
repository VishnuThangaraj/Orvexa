import api from "@/common/service/api";
import type {
  ApiResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginCredentials,
  LoginPayload,
  ResetPasswordRequest,
  SessionItem,
  User,
} from "../types";

/**
 * Type-safe Auth API endpoints for TanStack Query
 */
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginPayload> => {
    const res = await api.post<ApiResponse<LoginPayload>>("/auth", credentials);
    return res.data.data;
  },

  logout: async (refreshToken?: string | null): Promise<void> => {
    await api.post<ApiResponse<null>>("/auth/logout", {
      refreshToken: refreshToken || undefined,
    });
  },

  getProfile: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>("/auth");
    return res.data.data;
  },

  getSessions: async (): Promise<SessionItem[]> => {
    const res = await api.get<ApiResponse<SessionItem[]>>("/auth/sessions");
    return res.data.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/auth/sessions/${sessionId}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await api.delete<ApiResponse<null>>("/auth/sessions");
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<string> => {
    const res = await api.post<ApiResponse<null>>("/auth/forgot-password", data);
    return res.data.message;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const res = await api.post<ApiResponse<null>>("/auth/reset-password", data);
    return res.data.message;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<string> => {
    const res = await api.post<ApiResponse<null>>("/auth/change-password", data);
    return res.data.message;
  },
};

export { api };
export default api;
