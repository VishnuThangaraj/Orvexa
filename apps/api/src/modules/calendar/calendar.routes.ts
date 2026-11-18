import { Router } from "express";
import CalendarController from "./calendar.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createEventSchema,
  updateEventSchema,
  fetchEventsQuerySchema,
  createCalendarSchema,
  updateCalendarSchema,
  createTaskSchema,
  updateTaskSchema,
  fetchTasksQuerySchema,
  updateSettingsSchema,
  rsvpSchema,
} from "./calendar.validation.js";

const router: Router = Router();
const calendarController = new CalendarController();

// --- Events ---
router.get(
  "/events",
  authenticate,
  validate(fetchEventsQuerySchema, "query"),
  calendarController.getEvents,
);

router.post(
  "/events",
  authenticate,
  validate(createEventSchema, "body"),
  calendarController.createEvent,
);

router.get(
  "/events/:id",
  authenticate,
  calendarController.getEventById,
);

router.put(
  "/events/:id",
  authenticate,
  validate(updateEventSchema, "body"),
  calendarController.updateEvent,
);

router.patch(
  "/events/:id",
  authenticate,
  validate(updateEventSchema, "body"),
  calendarController.updateEvent,
);

router.delete(
  "/events/:id",
  authenticate,
  calendarController.deleteEvent,
);

router.patch(
  "/events/:id/rsvp",
  authenticate,
  validate(rsvpSchema, "body"),
  calendarController.updateRsvp,
);

// --- Calendars ---
router.get(
  "/calendars",
  authenticate,
  calendarController.getCalendars,
);

router.post(
  "/calendars",
  authenticate,
  validate(createCalendarSchema, "body"),
  calendarController.createCalendar,
);

router.patch(
  "/calendars/:id",
  authenticate,
  validate(updateCalendarSchema, "body"),
  calendarController.updateCalendar,
);

router.delete(
  "/calendars/:id",
  authenticate,
  calendarController.deleteCalendar,
);

// --- Tasks ---
router.get(
  "/tasks",
  authenticate,
  validate(fetchTasksQuerySchema, "query"),
  calendarController.getTasks,
);

router.post(
  "/tasks",
  authenticate,
  validate(createTaskSchema, "body"),
  calendarController.createTask,
);

router.patch(
  "/tasks/:id",
  authenticate,
  validate(updateTaskSchema, "body"),
  calendarController.updateTask,
);

router.delete(
  "/tasks/:id",
  authenticate,
  calendarController.deleteTask,
);

// --- Settings ---
router.get(
  "/settings",
  authenticate,
  calendarController.getSettings,
);

router.patch(
  "/settings",
  authenticate,
  validate(updateSettingsSchema, "body"),
  calendarController.updateSettings,
);

export default router;
