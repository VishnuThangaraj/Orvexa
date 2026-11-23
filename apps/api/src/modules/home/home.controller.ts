import type { NextFunction, Request, Response } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import HomeService from "./home.service.js";

export class HomeController {
  private homeService: HomeService;

  constructor() {
    this.homeService = new HomeService();
  }

  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const timezone = (req.query.timezone as string) || undefined;
      const overview = await this.homeService.getOverview(BigInt(userId), timezone);

      return sendResponse(res, 200, "Home overview retrieved successfully", overview);
    } catch (error) {
      next(error);
    }
  };

  getMailSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await this.homeService.getMailSummary(BigInt(userId));
      return sendResponse(res, 200, "Mail summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getChatSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await this.homeService.getChatSummary(BigInt(userId));
      return sendResponse(res, 200, "Chat summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getCalendarSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const timezone = (req.query.timezone as string) || undefined;
      const data = await this.homeService.getCalendarSummary(BigInt(userId), timezone);
      return sendResponse(res, 200, "Calendar summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getMeetSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await this.homeService.getMeetSummary(BigInt(userId));
      return sendResponse(res, 200, "Meet summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getDriveSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await this.homeService.getDriveSummary(BigInt(userId));
      return sendResponse(res, 200, "Drive summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getTasksSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await this.homeService.getTasksSummary(BigInt(userId));
      return sendResponse(res, 200, "Tasks summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  getActivitySummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await this.homeService.getActivitySummary(BigInt(userId));
      return sendResponse(res, 200, "Activity summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const query = (req.query.q as string) || "";
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

      const results = await this.homeService.searchCrossModule(
        BigInt(userId),
        query,
        limit,
      );

      return sendResponse(res, 200, "Cross-module search completed", results);
    } catch (error) {
      next(error);
    }
  };

  getPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const preferences = await this.homeService.getPreferences(BigInt(userId));
      return sendResponse(res, 200, "Dashboard preferences retrieved", preferences);
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const updated = await this.homeService.updatePreferences(
        BigInt(userId),
        req.body,
      );

      return sendResponse(res, 200, "Dashboard preferences updated", updated);
    } catch (error) {
      next(error);
    }
  };
}

export default HomeController;
