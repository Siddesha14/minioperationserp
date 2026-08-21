import { Router } from "express";
import { getDashboardSummary } from "./dashboard.controller.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/summary",
  authenticate,
  authorize("ADMIN", "OPERATIONS", "SALES"),
  getDashboardSummary,
);

export default router;