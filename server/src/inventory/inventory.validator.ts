import { z } from "zod";

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  locationId: z.coerce.number().int().positive().optional(),
  itemId: z.coerce.number().int().positive().optional(),
  batchId: z.coerce.number().int().positive().optional(),
});

export const createInventorySchema = z.object({
  itemId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive(),
  batchId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(2).max(200),
});

export const adjustInventorySchema = z.object({
  inventoryId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
  reason: z.string().trim().min(2).max(200),
});