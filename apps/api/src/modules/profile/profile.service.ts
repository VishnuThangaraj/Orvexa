import sharp from "sharp";
import AppError from "../../common/errors/AppError.js";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../../infrastructure/cloudinary/cloudinary.service.js";
import ProfileRepository from "./profile.repository.js";
import type {
  NotificationPreferences,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from "./profile.types.js";

const DEFAULT_NOTIFICATIONS: Required<NotificationPreferences> = {
  mail: true,
  chat: true,
  calendar: true,
  security: true,
};

export class ProfileService {
  private profileRepository: ProfileRepository;

  constructor() {
    this.profileRepository = new ProfileRepository();
  }

  async getProfile(userId: bigint) {
    const [user, activeSessionsCount] = await Promise.all([
      this.profileRepository.findUserById(userId),
      this.profileRepository.countActiveSessions(userId),
    ]);

    if (!user) {
      throw new AppError("User profile not found", 404);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    return {
      ...user,
      activeSessionsCount,
    };
  }

  async checkUsernameAvailability(userId: bigint, username: string) {
    const normalized = username.trim().toLowerCase();
    const existing = await this.profileRepository.findByUsernameExcludingUser(
      normalized,
      userId,
    );

    return {
      username: normalized,
      available: !existing,
    };
  }

  async updateProfile(userId: bigint, input: UpdateProfileInput) {
    const existingUser = await this.profileRepository.findUserById(userId);
    if (!existingUser) {
      throw new AppError("User profile not found", 404);
    }
    if (!existingUser.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    if (input.username !== undefined) {
      const normalizedUsername = input.username.trim().toLowerCase();
      const usernameTaken =
        await this.profileRepository.findByUsernameExcludingUser(
          normalizedUsername,
          userId,
        );
      if (usernameTaken) {
        throw new AppError("That username is already taken", 409);
      }
    }

    if (input.email !== undefined) {
      const normalizedEmail = input.email.trim().toLowerCase();
      const emailTaken = await this.profileRepository.findByEmailExcludingUser(
        normalizedEmail,
        userId,
      );
      if (emailTaken) {
        throw new AppError("That email address is already in use", 409);
      }
    }

    const updatedUser = await this.profileRepository.updateUserProfile(userId, {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.username !== undefined
        ? { username: input.username.trim().toLowerCase() }
        : {}),
      ...(input.email !== undefined
        ? { email: input.email.trim().toLowerCase() }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.dob !== undefined
        ? {
            dob: input.dob ? new Date(`${input.dob}T00:00:00.000Z`) : null,
          }
        : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
    });

    return updatedUser;
  }

  async updatePreferences(userId: bigint, input: UpdatePreferencesInput) {
    const existingUser = await this.profileRepository.findUserById(userId);
    if (!existingUser) {
      throw new AppError("User profile not found", 404);
    }
    if (!existingUser.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    let mergedNotifications: NotificationPreferences | undefined;
    if (input.notificationPreferences !== undefined) {
      const existingPrefs = await this.profileRepository.findPreferences(userId);
      const currentRaw =
        existingPrefs?.notificationPreferences &&
        typeof existingPrefs.notificationPreferences === "object" &&
        !Array.isArray(existingPrefs.notificationPreferences)
          ? (existingPrefs.notificationPreferences as NotificationPreferences)
          : {};

      mergedNotifications = {
        ...DEFAULT_NOTIFICATIONS,
        ...currentRaw,
        ...input.notificationPreferences,
      };
    }

    return this.profileRepository.upsertPreferences(userId, {
      ...input,
      mergedNotifications,
    });
  }

  private async cleanupUnusedAvatarAsset(assetId: bigint | null | undefined) {
    if (!assetId) return;

    try {
      const refCount =
        await this.profileRepository.countAssetProfileReferences(assetId);
      if (refCount > 0) return;

      const oldAsset = await this.profileRepository.findAssetById(assetId);
      if (!oldAsset) return;

      if (oldAsset.publicId && oldAsset.storageBackend === "CLOUDINARY") {
        try {
          await deleteFromCloudinary(oldAsset.publicId, "image");
        } catch {
          // Best-effort cleanup in Cloudinary
        }
      }

      await this.profileRepository.deleteAssetById(assetId);
    } catch {
      // Do not fail profile update if background cleanup fails
    }
  }

  async uploadPhoto(userId: bigint, file?: Express.Multer.File) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new AppError("Please select an image file to upload", 400);
    }

    const existingUser = await this.profileRepository.findUserById(userId);
    if (!existingUser) {
      throw new AppError("User profile not found", 404);
    }
    if (!existingUser.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    let processedBuffer: Buffer;
    let outputWidth = 512;
    let outputHeight = 512;

    try {
      const pipeline = sharp(file.buffer, { failOn: "error" });
      await pipeline.metadata();
      const { data, info } = await pipeline
        .rotate()
        .resize(512, 512, { fit: "cover", position: "centre" })
        .webp({ quality: 86 })
        .toBuffer({ resolveWithObject: true });

      processedBuffer = data;
      outputWidth = info.width;
      outputHeight = info.height;
    } catch {
      throw new AppError(
        "Invalid or corrupted image file. Please upload a valid JPEG, PNG, WebP, or GIF image.",
        400,
      );
    }

    const uploadResult = await uploadBufferToCloudinary(processedBuffer, {
      folder: "orvexa/avatars",
      resource_type: "image",
      filename_override: `avatar_${userId.toString()}.webp`,
    });

    const deliveryType =
      uploadResult.type?.toUpperCase() === "UPLOAD"
        ? "UPLOAD"
        : "AUTHENTICATED";

    const newAsset = await this.profileRepository.createProfileAsset({
      publicId: uploadResult.public_id,
      cloudinaryAssetId: uploadResult.asset_id ?? null,
      deliveryType,
      version: uploadResult.version ?? null,
      format: uploadResult.format ?? "webp",
      originalFilename: file.originalname || `avatar_${userId.toString()}.webp`,
      mimeType: "image/webp",
      bytes: BigInt(uploadResult.bytes || processedBuffer.length),
      secureUrl: uploadResult.secure_url ?? null,
      width: uploadResult.width ?? outputWidth,
      height: uploadResult.height ?? outputHeight,
      uploadedBy: userId,
    });

    const previousAssetId = existingUser.profileImageId;

    const updatedUser = await this.profileRepository.updateUserProfile(userId, {
      profileImage: {
        connect: { id: newAsset.id },
      },
    });

    if (previousAssetId && previousAssetId !== newAsset.id) {
      await this.cleanupUnusedAvatarAsset(previousAssetId);
    }

    return updatedUser;
  }

  async removePhoto(userId: bigint) {
    const existingUser = await this.profileRepository.findUserById(userId);
    if (!existingUser) {
      throw new AppError("User profile not found", 404);
    }
    if (!existingUser.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    const previousAssetId = existingUser.profileImageId;

    const updatedUser = await this.profileRepository.updateUserProfile(userId, {
      profileImage: { disconnect: true },
    });

    if (previousAssetId) {
      await this.cleanupUnusedAvatarAsset(previousAssetId);
    }

    return updatedUser;
  }
}

export default ProfileService;
