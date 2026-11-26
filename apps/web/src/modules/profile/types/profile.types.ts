import type {
  NotificationPreferences,
  User,
  UserPreferences,
} from "@/modules/auth/types";

export type ProfileTabId =
  | "home"
  | "personal-info"
  | "security"
  | "preferences";

export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
}

export interface UpdatePreferencesRequest {
  theme?: "light" | "dark" | "system";
  language?: string;
  timezone?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

export type ProfileDetailResponse = User;
export type PreferencesResponse = UserPreferences;
