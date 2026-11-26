import api from "@/common/service/api";
import type { ApiResponse, User, UserPreferences } from "@/modules/auth/types";
import type {
  UpdatePreferencesRequest,
  UpdateProfileRequest,
  UsernameAvailabilityResponse,
} from "../types/profile.types";

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>("/profile");
    return res.data.data;
  },

  checkUsernameAvailability: async (
    username: string,
  ): Promise<UsernameAvailabilityResponse> => {
    const res = await api.get<ApiResponse<UsernameAvailabilityResponse>>(
      "/profile/username-availability",
      { params: { username } },
    );
    return res.data.data;
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>("/profile", payload);
    return res.data.data;
  },

  updatePreferences: async (
    payload: UpdatePreferencesRequest,
  ): Promise<UserPreferences> => {
    const res = await api.patch<ApiResponse<UserPreferences>>(
      "/profile/preferences",
      payload,
    );
    return res.data.data;
  },

  uploadPhoto: async (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<User> => {
    const formData = new FormData();
    formData.append("photo", file);

    const res = await api.post<ApiResponse<User>>("/profile/photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return res.data.data;
  },

  removePhoto: async (): Promise<User> => {
    const res = await api.delete<ApiResponse<User>>("/profile/photo");
    return res.data.data;
  },
};

export default profileApi;
