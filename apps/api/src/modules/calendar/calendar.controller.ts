import type { NextFunction, Request, Response } from "express";
import AppError from "../../common/errors/AppError.js";
import { sendResponse } from "../../common/utils/response.js";
import CalendarService from "./calendar.service.js";

export class CalendarController {
  private calendarService: CalendarService;

  constructor() {
    this.calendarService = new CalendarService();
  }

  // --- Events ---
  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const events = await this.calendarService.getEvents(
        BigInt(userId),
        req.query as any,
      );

      return sendResponse(res, 200, "Events retrieved successfully", events);
    } catch (error) {
      next(error);
    }
  };

  getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const eventId = BigInt(idParam);
      const event = await this.calendarService.getEventById(
        BigInt(userId),
        eventId,
      );

      return sendResponse(res, 200, "Event retrieved successfully", event);
    } catch (error) {
      next(error);
    }
  };

  createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const event = await this.calendarService.createEvent(
        BigInt(userId),
        req.body,
      );

      return sendResponse(res, 201, "Event created successfully", event);
    } catch (error) {
      next(error);
    }
  };

  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const eventId = BigInt(idParam);
      const event = await this.calendarService.updateEvent(
        BigInt(userId),
        eventId,
        req.body,
      );

      return sendResponse(res, 200, "Event updated successfully", event);
    } catch (error) {
      next(error);
    }
  };

  deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const eventId = BigInt(idParam);
      const recurrenceMode = req.query.recurrenceMode as
        | "SINGLE"
        | "FOLLOWING"
        | "ALL"
        | undefined;
      const targetInstanceDate = req.query.targetInstanceDate as
        | string
        | undefined;

      const result = await this.calendarService.deleteEvent(
        BigInt(userId),
        eventId,
        recurrenceMode,
        targetInstanceDate,
      );

      return sendResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  updateRsvp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const eventId = BigInt(idParam);
      const { responseStatus } = req.body;

      const result = await this.calendarService.updateRsvp(
        BigInt(userId),
        eventId,
        responseStatus,
      );

      return sendResponse(res, 200, "RSVP updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // --- Calendars ---
  getCalendars = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const calendars = await this.calendarService.getUserCalendars(
        BigInt(userId),
      );

      return sendResponse(
        res,
        200,
        "Calendars retrieved successfully",
        calendars,
      );
    } catch (error) {
      next(error);
    }
  };

  createCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const calendar = await this.calendarService.createCalendar(
        BigInt(userId),
        req.body,
      );

      return sendResponse(res, 201, "Calendar created successfully", calendar);
    } catch (error) {
      next(error);
    }
  };

  updateCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const calendarId = BigInt(idParam);
      const calendar = await this.calendarService.updateCalendar(
        BigInt(userId),
        calendarId,
        req.body,
      );

      return sendResponse(res, 200, "Calendar updated successfully", calendar);
    } catch (error) {
      next(error);
    }
  };

  deleteCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const calendarId = BigInt(idParam);
      const result = await this.calendarService.deleteCalendar(
        BigInt(userId),
        calendarId,
      );

      return sendResponse(res, 200, "Calendar deleted successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // --- Tasks ---
  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const tasks = await this.calendarService.getTasks(
        BigInt(userId),
        req.query as any,
      );

      return sendResponse(res, 200, "Tasks retrieved successfully", tasks);
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const task = await this.calendarService.createTask(
        BigInt(userId),
        req.body,
      );

      return sendResponse(res, 201, "Task created successfully", task);
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const taskId = BigInt(idParam);
      const task = await this.calendarService.updateTask(
        BigInt(userId),
        taskId,
        req.body,
      );

      return sendResponse(res, 200, "Task updated successfully", task);
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const taskId = BigInt(idParam);
      const result = await this.calendarService.deleteTask(
        BigInt(userId),
        taskId,
      );

      return sendResponse(res, 200, "Task deleted successfully", result);
    } catch (error) {
      next(error);
    }
  };

  // --- Settings ---
  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const settings = await this.calendarService.getSettings(BigInt(userId));

      return sendResponse(
        res,
        200,
        "Calendar settings retrieved successfully",
        settings,
      );
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError("Unauthorized", 401);

      const settings = await this.calendarService.updateSettings(
        BigInt(userId),
        req.body,
      );

      return sendResponse(
        res,
        200,
        "Calendar settings updated successfully",
        settings,
      );
    } catch (error) {
      next(error);
    }
  };
}

export default CalendarController;
