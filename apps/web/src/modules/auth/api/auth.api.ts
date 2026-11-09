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
} from "../types/index.js";


export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginPayload> => {
    let payload: {
      username?: string;
      email?: string;
      password: string;
      deviceName?: string;
    };

    if (credentials.identifier) {
      const raw = credentials.identifier.trim();
      const isExternalEmail =
        raw.includes("@") && !raw.toLowerCase().endsWith("@orvexa.com");

      if (isExternalEmail) {
        payload = {
          email: raw.toLowerCase(),
          password: credentials.password,
          deviceName: credentials.deviceName,
        };
      } else {
        payload = {
          username: raw.replace(/@orvexa\.com$/i, ""),
          password: credentials.password,
          deviceName: credentials.deviceName,
        };
      }
    } else {
      payload = {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        deviceName: credentials.deviceName,
      };
    }

    const res = await api.post<ApiResponse<LoginPayload>>("/auth", payload);
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
    let payload: { username?: string; email?: string };

    if (data.identifier) {
      const raw = data.identifier.trim();
      const isExternalEmail =
        raw.includes("@") && !raw.toLowerCase().endsWith("@orvexa.com");

      payload = isExternalEmail
        ? { email: raw.toLowerCase() }
        : { username: raw.replace(/@orvexa\.com$/i, "") };
    } else {
      payload = {
        username: data.username,
        email: data.email,
      };
    }

    const res = await api.post<ApiResponse<null>>(
      "/auth/forgot-password",
      payload,
    );
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
