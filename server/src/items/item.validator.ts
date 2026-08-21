import { z } from "zod";

export const createItemSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().optional(),
  categoryId: z.number().int().positive(),
});