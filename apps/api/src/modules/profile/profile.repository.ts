import prisma from "../../infrastructure/database/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  CreateProfileAssetData,
  NotificationPreferences,
  UpdatePreferencesInput,
} from "./profile.types.js";

const profileInclude = {
  preferences: true,
  profileImage: {
    select: {
      id: true,
      secureUrl: true,
      originalFilename: true,
      mimeType: true,
      width: true,
      height: true,
    },
  },
  credentials: {
    select: {
      passwordChangedAt: true,
    },
  },
} satisfies Prisma.UserInclude;

export class ProfileRepository {
  async findUserById(userId: bigint) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: profileInclude,
    });
  }

  async findByUsernameExcludingUser(username: string, excludeUserId: bigint) {
    return prisma.user.findFirst({
      where: {
        username,
        id: { not: excludeUserId },
      },
      select: { id: true },
    });
  }

  async findByEmailExcludingUser(email: string, excludeUserId: bigint) {
    return prisma.user.findFirst({
      where: {
        email,
        id: { not: excludeUserId },
      },
      select: { id: true },
    });
  }

  async updateUserProfile(
    userId: bigint,
    data: Prisma.UserUpdateInput,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      include: profileInclude,
    });
  }

  async countActiveSessions(userId: bigint): Promise<number> {
    return prisma.userSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async findPreferences(userId: bigint) {
    return prisma.userPreference.findUnique({
      where: { userId },
    });
  }

  async upsertPreferences(
    userId: bigint,
    data: UpdatePreferencesInput & {
      mergedNotifications?: NotificationPreferences;
    },
  ) {
    return prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        theme: data.theme ?? "system",
        language: data.language ?? "en",
        timezone: data.timezone ?? "UTC",
        notificationPreferences: (data.mergedNotifications ?? {
          mail: true,
          chat: true,
          calendar: true,
          security: true,
        }) as Prisma.InputJsonValue,
      },
      update: {
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
        ...(data.mergedNotifications !== undefined
          ? {
              notificationPreferences:
                data.mergedNotifications as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async createProfileAsset(data: CreateProfileAssetData) {
    return prisma.fileAsset.create({
      data: {
        publicId: data.publicId,
        cloudinaryAssetId: data.cloudinaryAssetId ?? null,
        resourceType: "IMAGE",
        deliveryType: data.deliveryType,
        version: data.version ?? null,
        format: data.format ?? null,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        bytes: data.bytes,
        secureUrl: data.secureUrl ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        uploadedBy: data.uploadedBy,
        storageBackend: "CLOUDINARY",
      },
    });
  }

  async findAssetById(assetId: bigint) {
    return prisma.fileAsset.findUnique({
      where: { id: assetId },
    });
  }

  async countAssetProfileReferences(assetId: bigint): Promise<number> {
    return prisma.user.count({
      where: { profileImageId: assetId },
    });
  }

  async deleteAssetById(assetId: bigint) {
    return prisma.fileAsset.deleteMany({
      where: { id: assetId },
    });
  }
}

export default ProfileRepository;
