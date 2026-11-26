import type { NextFunction, Request, Response } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import ProfileService from "./profile.service.js";

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const profile = await this.profileService.getProfile(BigInt(req.user.id));
      return sendResponse(res, 200, "Profile retrieved successfully", profile);
    } catch (error) {
      next(error);
    }
  };

  checkUsernameAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const username = String(req.query.username || "");
      const result = await this.profileService.checkUsernameAvailability(
        BigInt(req.user.id),
        username,
      );
      return sendResponse(
        res,
        200,
        "Username availability checked successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const updatedUser = await this.profileService.updateProfile(
        BigInt(req.user.id),
        req.body,
      );
      return sendResponse(
        res,
        200,
        "Profile updated successfully",
        updatedUser,
      );
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const preferences = await this.profileService.updatePreferences(
        BigInt(req.user.id),
        req.body,
      );
      return sendResponse(
        res,
        200,
        "Preferences updated successfully",
        preferences,
      );
    } catch (error) {
      next(error);
    }
  };

  uploadPhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file || (files && files[0]);

      const updatedUser = await this.profileService.uploadPhoto(
        BigInt(req.user.id),
        file,
      );
      return sendResponse(
        res,
        200,
        "Profile photo updated successfully",
        updatedUser,
      );
    } catch (error) {
      next(error);
    }
  };

  removePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError("Authentication required", 401);
      }

      const updatedUser = await this.profileService.removePhoto(
        BigInt(req.user.id),
      );
      return sendResponse(
        res,
        200,
        "Profile photo removed successfully",
        updatedUser,
      );
    } catch (error) {
      next(error);
    }
  };
}

export default ProfileController;
