import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
} from "./customer.controller.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("SALES", "ADMIN"),
  getCustomers,
);

router.get(
  "/:id",
  authorize("SALES", "ADMIN"),
  getCustomerById,
);

router.post(
  "/",
  authorize("SALES", "ADMIN"),
  createCustomer,
);

export default router;