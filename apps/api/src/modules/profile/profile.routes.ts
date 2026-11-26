import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { imageUploadMiddleware } from "../../middleware/upload.middleware.js";
import ProfileController from "./profile.controller.js";
import {
  updatePreferencesSchema,
  updateProfileSchema,
  usernameAvailabilityQuerySchema,
} from "./profile.validation.js";

const router: Router = Router();
const profileController = new ProfileController();

router.use(authenticate, authorize("ADMIN", "MEMBER"));

router.get("/", profileController.getProfile);

router.get(
  "/username-availability",
  validate(usernameAvailabilityQuerySchema, "query"),
  profileController.checkUsernameAvailability,
);

router.patch(
  "/",
  validate(updateProfileSchema),
  profileController.updateProfile,
);

router.patch(
  "/preferences",
  validate(updatePreferencesSchema),
  profileController.updatePreferences,
);

router.post(
  "/photo",
  imageUploadMiddleware,
  profileController.uploadPhoto,
);

router.delete("/photo", profileController.removePhoto);

export default router;
