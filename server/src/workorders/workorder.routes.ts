import { Router } from "express";
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrderById,
  updateWorkOrderStatus,
} from "./workorder.controller.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createWorkOrder,
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  getWorkOrders,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  getWorkOrderById,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  updateWorkOrderStatus,
);

export default router;