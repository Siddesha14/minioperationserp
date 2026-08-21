import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});