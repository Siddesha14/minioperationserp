import { z } from "zod";

export const createTransferSchema = z.object({
  transferNumber: z.string().trim().min(1).max(50),
  sourceLocationId: z.number().int().positive(),
  destinationLocationId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const transferStatusSchema = z.object({
  status: z.enum(["DISPATCHED", "RECEIVED"]),
});