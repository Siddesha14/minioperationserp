import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../../generated/prisma/client.js";

export type AuthPayload = {
  userId: number;
  role: UserRole;
  assignedLocationId: number | null;
};

export const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "8h",
  });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
};
