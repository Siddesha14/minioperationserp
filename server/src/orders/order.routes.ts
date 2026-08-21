import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  reserveOrder,
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