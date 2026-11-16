import { Router } from "express";
import ChatController from "./chat.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { chatAttachmentUpload } from "../../middleware/upload.middleware.js";
import {
  createDirectConversationSchema,
  createGroupOrChannelSchema,
  updateConversationSchema,
  addParticipantsSchema,
  updateParticipantRoleSchema,
  updateParticipantSettingsSchema,
  conversationIdParamSchema,
  participantUserIdParamSchema,
  fetchConversationsQuerySchema,
  sendMessageSchema,
  editMessageSchema,
  messageIdParamSchema,
  fetchMessagesQuerySchema,
  reactionSchema,
  markReadSchema,
  attachmentIdParamSchema,
  discoverSpacesQuerySchema,
  globalSearchQuerySchema,
} from "./chat.validation.js";

const router: Router = Router();
const chatController = new ChatController();

router.use(authenticate, authorize("ADMIN", "MEMBER"));

// Online presence list
router.get("/presence", chatController.getOnlinePresence);

// Search users in workspace
router.get("/users", chatController.searchUsers);

// Task 4.2: Global chat search across messages, people, and spaces
router.get(
  "/search",
  validate(globalSearchQuerySchema, "query"),
  chatController.searchGlobal,
);

// Discover public spaces
router.get(
  "/spaces/discover",
  validate(discoverSpacesQuerySchema, "query"),
  chatController.discoverPublicSpaces,
);

// List user conversations
router.get(
  "/conversations",
  validate(fetchConversationsQuerySchema, "query"),
  chatController.getUserConversations,
);

// Create or get direct conversation
router.post(
  "/direct",
  validate(createDirectConversationSchema),
  chatController.createDirectConversation,
);

// Create group or channel
router.post(
  "/conversations",
  validate(createGroupOrChannelSchema),
  chatController.createGroupOrChannel,
);

// Get conversation details
router.get(
  "/conversations/:id",
  validate(conversationIdParamSchema, "params"),
  chatController.getConversationDetails,
);

// Update conversation
router.patch(
  "/conversations/:id",
  validate(conversationIdParamSchema, "params"),
  validate(updateConversationSchema),
  chatController.updateConversation,
);

// Join public space
router.post(
  "/conversations/:id/join",
  validate(conversationIdParamSchema, "params"),
  chatController.joinPublicSpace,
);

// Update user settings in conversation (mute, pin, archive)
router.patch(
  "/conversations/:id/settings",
  validate(conversationIdParamSchema, "params"),
  validate(updateParticipantSettingsSchema),
  chatController.updateParticipantSettings,
);

// Add participants
router.post(
  "/conversations/:id/participants",
  validate(conversationIdParamSchema, "params"),
  validate(addParticipantsSchema),
  chatController.addParticipants,
);

// Remove participant
router.delete(
  "/conversations/:id/participants/:userId",
  validate(participantUserIdParamSchema, "params"),
  chatController.removeParticipant,
);

// Update participant role
router.patch(
  "/conversations/:id/participants/:userId/role",
  validate(participantUserIdParamSchema, "params"),
  validate(updateParticipantRoleSchema),
  chatController.updateParticipantRole,
);

// Messaging Endpoints
router.post(
  "/conversations/:id/messages",
  validate(conversationIdParamSchema, "params"),
  validate(sendMessageSchema),
  chatController.sendMessage,
);

router.get(
  "/conversations/:id/messages",
  validate(conversationIdParamSchema, "params"),
  validate(fetchMessagesQuerySchema, "query"),
  chatController.getMessages,
);

router.patch(
  "/conversations/:id/messages/:messageId",
  validate(messageIdParamSchema, "params"),
  validate(editMessageSchema),
  chatController.editMessage,
);

router.delete(
  "/conversations/:id/messages/:messageId",
  validate(messageIdParamSchema, "params"),
  chatController.deleteMessage,
);

// Read receipts
router.post(
  "/conversations/:id/read",
  validate(conversationIdParamSchema, "params"),
  validate(markReadSchema),
  chatController.markMessageAsRead,
);

// Reactions
router.post(
  "/conversations/:id/messages/:messageId/reactions",
  validate(messageIdParamSchema, "params"),
  validate(reactionSchema),
  chatController.toggleReaction,
);

// Pinned messages
router.post(
  "/conversations/:id/messages/:messageId/pin",
  validate(messageIdParamSchema, "params"),
  chatController.togglePinMessage,
);

router.get(
  "/conversations/:id/pins",
  validate(conversationIdParamSchema, "params"),
  chatController.getPinnedMessages,
);

// Attachment upload and management
router.post(
  "/attachments",
  chatAttachmentUpload,
  chatController.uploadAttachments,
);

router.post(
  "/upload",
  chatAttachmentUpload,
  chatController.uploadAttachments,
);

router.delete(
  "/attachments/:id",
  validate(attachmentIdParamSchema, "params"),
  chatController.deleteAttachment,
);

export default router;
