import { Router } from "express";

import {
  getItems,
  getItemById,
  createItem,
} from "./item.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("SALES", "ADMIN", "OPERATIONS"),
  getItems,
);

router.get(
  "/:id",
  authorize("SALES", "ADMIN", "OPERATIONS"),
  getItemById,
);

router.post(
  "/",
  authorize("ADMIN", "OPERATIONS"),
  createItem,
);

export default router;