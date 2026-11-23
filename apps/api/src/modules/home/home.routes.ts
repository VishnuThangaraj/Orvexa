import { Router } from "express";
import HomeController from "./home.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  homeOverviewQuerySchema,
  homeSearchQuerySchema,
  updateDashboardPreferencesSchema,
} from "./home.validation.js";

const router: Router = Router();
const homeController = new HomeController();

// All home dashboard endpoints require authentication
router.use(authenticate, authorize("ADMIN", "MEMBER"));

// Primary aggregation endpoint
router.get(
  "/overview",
  validate(homeOverviewQuerySchema, "query"),
  homeController.getOverview,
);

// Individual per-widget endpoints for decoupled loading & manual retry
router.get("/mail", homeController.getMailSummary);
router.get("/chat", homeController.getChatSummary);
router.get("/calendar", homeController.getCalendarSummary);
router.get("/meet", homeController.getMeetSummary);
router.get("/drive", homeController.getDriveSummary);
router.get("/tasks", homeController.getTasksSummary);
router.get("/activity", homeController.getActivitySummary);

// Cross-module federated search
router.get(
  "/search",
  validate(homeSearchQuerySchema, "query"),
  homeController.search,
);

// User dashboard preferences (reorder/hide/show)
router.get("/preferences", homeController.getPreferences);
router.put(
  "/preferences",
  validate(updateDashboardPreferencesSchema, "body"),
  homeController.updatePreferences,
);

export default router;
