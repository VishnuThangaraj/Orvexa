export type UserLogin = {
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type LogoutInput = {
  refreshToken: string;
};

export interface SessionResponse {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}
