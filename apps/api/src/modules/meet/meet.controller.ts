import type { NextFunction, Request, Response } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import MeetService from "./meet.service.js";

export class MeetController {
  private meetService: MeetService;

  constructor() {
    this.meetService = new MeetService();
  }

  createMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const meeting = await this.meetService.createMeeting(BigInt(userId), req.body);
      return sendResponse(res, 201, "Meeting created successfully", meeting);
    } catch (error) {
      next(error);
    }
  };

  getMeetingByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const meeting = await this.meetService.getMeetingByCode(BigInt(userId), codeParam);
      return sendResponse(res, 200, "Meeting retrieved successfully", meeting);
    } catch (error) {
      next(error);
    }
  };

  listMyMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const meetings = await this.meetService.listUserMeetings(BigInt(userId));
      return sendResponse(res, 200, "Meetings retrieved successfully", meetings);
    } catch (error) {
      next(error);
    }
  };

  getLiveKitToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const tokenData = await this.meetService.generateLiveKitToken(BigInt(userId), codeParam);
      return sendResponse(res, 200, "LiveKit token generated successfully", tokenData);
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const updated = await this.meetService.updateSettings(BigInt(userId), codeParam, req.body);
      return sendResponse(res, 200, "Meeting settings updated successfully", updated);
    } catch (error) {
      next(error);
    }
  };

  admitParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hostId = req.user?.id;
      if (!hostId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const targetUserId = BigInt(req.body.userId);

      const result = await this.meetService.admitParticipant(BigInt(hostId), codeParam, targetUserId);
      return sendResponse(res, 200, "Participant admitted", result);
    } catch (error) {
      next(error);
    }
  };

  denyParticipant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hostId = req.user?.id;
      if (!hostId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const targetUserId = BigInt(req.body.userId);

      const result = await this.meetService.denyParticipant(BigInt(hostId), codeParam, targetUserId);
      return sendResponse(res, 200, "Participant denied", result);
    } catch (error) {
      next(error);
    }
  };

  endMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hostId = req.user?.id;
      if (!hostId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const result = await this.meetService.endMeeting(BigInt(hostId), codeParam);
      return sendResponse(res, 200, "Meeting ended successfully", result);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const msg = await this.meetService.sendMessage(BigInt(userId), codeParam, req.body.content);
      return sendResponse(res, 201, "Message sent successfully", msg);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const codeParam = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
      const messages = await this.meetService.getMessages(BigInt(userId), codeParam);
      return sendResponse(res, 200, "Messages retrieved successfully", messages);
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const result = await this.meetService.handleWebhook(rawBody, authHeader);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default MeetController;
