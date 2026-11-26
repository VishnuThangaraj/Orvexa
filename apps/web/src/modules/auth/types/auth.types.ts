export type UserRole = "ADMIN" | "MEMBER";

export interface UserProfileImage {
  id: string;
  secureUrl?: string | null;
  originalFilename?: string;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
}

export interface NotificationPreferences {
  mail?: boolean;
  chat?: boolean;
  calendar?: boolean;
  security?: boolean;
}

export interface UserPreferences {
  id?: string;
  userId?: string;
  theme: "light" | "dark" | "system" | string;
  language: string;
  timezone: string;
  notificationPreferences?: NotificationPreferences | null;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  role: UserRole;
  isActive: boolean;
  profileImageId?: string | null;
  profileImage?: UserProfileImage | null;
  preferences?: UserPreferences | null;
  credentials?: {
    passwordChangedAt?: string | null;
  } | null;
  activeSessionsCount?: number;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
}

export interface LoginPayload {
  user: User;
  accessToken: string;
  refreshToken?: string | null;
  sessionId?: string | null;
}

export interface AuthActions {
  login: (data: LoginPayload) => void;
  setTokens: (tokens: {
    accessToken: string;
    refreshToken?: string | null;
  }) => void;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginCredentials {
  identifier?: string;
  email?: string;
  username?: string;
  password: string;
  deviceName?: string;
}

export interface ForgotPasswordRequest {
  identifier?: string;
  email?: string;
  username?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SessionItem {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}
