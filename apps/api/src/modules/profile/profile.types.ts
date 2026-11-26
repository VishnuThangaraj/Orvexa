export interface UpdateProfileInput {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
}

export interface NotificationPreferences {
  mail?: boolean;
  chat?: boolean;
  calendar?: boolean;
  security?: boolean;
}

export interface UpdatePreferencesInput {
  theme?: "light" | "dark" | "system";
  language?: string;
  timezone?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface CreateProfileAssetData {
  publicId: string;
  cloudinaryAssetId?: string | null;
  deliveryType: "UPLOAD" | "AUTHENTICATED";
  version?: number | null;
  format?: string | null;
  originalFilename: string;
  mimeType: string;
  bytes: bigint;
  secureUrl?: string | null;
  width?: number | null;
  height?: number | null;
  uploadedBy: bigint;
}
