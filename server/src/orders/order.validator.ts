import { z } from "zod";

export const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(50),
  customerId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});