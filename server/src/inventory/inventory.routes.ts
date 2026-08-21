import { Router } from "express";
import {
  getInventory,
  createInventoryReceipt,
  adjustInventory,
} from "./inventory.controller.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getInventory);

router.post(
  "/receipt",
  authorize("ADMIN", "OPERATIONS"),
  createInventoryReceipt
);

router.post(
  "/adjust",
  authorize("ADMIN", "OPERATIONS"),
  adjustInventory
);

export default router;