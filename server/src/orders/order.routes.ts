import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrderById,
  reserveOrder,
  cancelOrder,
  completeorder,
} from "./order.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

// SALES + ADMIN → create orders
router.post(
  "/",
  authenticate,
  authorize("SALES", "ADMIN"),
  createOrder,
);

// SALES + ADMIN → cancel orders
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("SALES", "ADMIN"),
  cancelOrder,
);

// OPERATIONS + ADMIN → complete orders
router.patch(
  "/:id/complete",
  authenticate,
  authorize("OPERATIONS", "ADMIN"),
  completeorder,
);

// SALES + OPERATIONS + ADMIN → view orders
router.get(
  "/",
  authenticate,
  authorize("SALES", "OPERATIONS", "ADMIN"),
  getOrders,
);

// SALES + OPERATIONS + ADMIN → view individual order
router.get(
  "/:id",
  authenticate,
  authorize("SALES", "OPERATIONS", "ADMIN"),
  getOrderById,
);

// SALES + ADMIN → reserve orders
router.patch(
  "/:id/reserve",
  authenticate,
  authorize("SALES", "ADMIN"),
  reserveOrder,
);

export default router;