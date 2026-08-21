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

router.post(
  "/",
  authenticate,
  authorize("SALES", "ADMIN"),
  createOrder,
);
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("SALES", "ADMIN"),
  cancelOrder,
);
router.patch(
  "/:id/complete",
  authenticate,
  authorize("SALES", "ADMIN"),
  completeorder,
);

router.get(
  "/",
  authenticate,
  authorize("SALES", "ADMIN"),
  getOrders,
);

router.get(
  "/:id",
  authenticate,
  authorize("SALES", "ADMIN"),
  getOrderById,
);

router.patch(
  "/:id/reserve",
  authenticate,
  authorize("SALES", "ADMIN"),
  reserveOrder,
);

export default router;