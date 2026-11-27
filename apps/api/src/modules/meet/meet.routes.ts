import { Router } from "express";
import MeetController from "./meet.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createMeetingSchema,
  updateMeetingSettingsSchema,
  meetingCodeParamSchema,
  sendMessageSchema,
  participantActionSchema,
  knockMeetingSchema,
  postSignalSchema,
} from "./meet.validation.js";

const router: Router = Router();
const meetController = new MeetController();

// Webhook endpoint (signature verified in service)
router.post("/webhook", meetController.handleWebhook);

// Meeting CRUD
router.post(
  "/",
  authenticate,
  validate(createMeetingSchema, "body"),
  meetController.createMeeting,
);

router.get(
  "/",
  authenticate,
  meetController.listMyMeetings,
);

router.get(
  "/:code",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.getMeetingByCode,
);

// Token issuance
router.post(
  "/:code/token",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.getLiveKitToken,
);

// Host settings & moderation
router.patch(
  "/:code/settings",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  validate(updateMeetingSettingsSchema, "body"),
  meetController.updateSettings,
);

router.post(
  "/:code/admit",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  validate(participantActionSchema, "body"),
  meetController.admitParticipant,
);

router.post(
  "/:code/deny",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  validate(participantActionSchema, "body"),
  meetController.denyParticipant,
);

router.post(
  "/:code/end",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.endMeeting,
);

router.post(
  "/:code/knock",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  validate(knockMeetingSchema, "body"),
  meetController.knockMeeting,
);

router.delete(
  "/:code/knock",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.cancelKnock,
);

router.post(
  "/:code/leave",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.leaveMeeting,
);

router.post(
  "/:code/signal",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  validate(postSignalSchema, "body"),
  meetController.postSignal,
);

router.get(
  "/:code/signals",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.getSignals,
);

// In-call messages
router.post(
  "/:code/messages",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  validate(sendMessageSchema, "body"),
  meetController.sendMessage,
);

router.get(
  "/:code/messages",
  authenticate,
  validate(meetingCodeParamSchema, "params"),
  meetController.getMessages,
);

export default router;
