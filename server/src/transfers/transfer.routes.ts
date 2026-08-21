import { Router } from "express";
import {
  createTransfer,
  getTransfers,
  getTransferById,
  dispatchTransfer,
  receiveTransfer,
} from "./transfer.controller.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("OPERATIONS", "ADMIN"),
  createTransfer,
);

router.get(
  "/",
  authenticate,
  authorize("OPERATIONS", "ADMIN"),
  getTransfers,
);

router.get(
  "/:id",
  authenticate,
  authorize("OPERATIONS", "ADMIN"),
  getTransferById,
);

router.patch(
  "/:id/dispatch",
  authenticate,
  authorize("OPERATIONS", "ADMIN"),
  dispatchTransfer,
);

router.patch(
  "/:id/receive",
  authenticate,
  authorize("OPERATIONS", "ADMIN"),
  receiveTransfer,
);

export default router;