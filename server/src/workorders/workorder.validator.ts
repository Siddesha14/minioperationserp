import { z } from "zod";

export const createWorkOrderSchema = z.object({
  workOrderNumber: z.string().trim().min(1).max(50),
  locationId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  requiredQuantity: z.number().int().positive(),
  assignedUserId: z.number().int().positive(),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "COMPLETED"]),
});