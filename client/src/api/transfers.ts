import { api } from "./client";

export type TransferStatus =
  | "REQUESTED"
  | "DISPATCHED"
  | "RECEIVED";

export interface Transfer {
  id: number;
  transferNumber: string;
  sourceLocationId: number;
  destinationLocationId: number;
  itemId: number;
  quantity: number;
  status: TransferStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;

  sourceLocation: {
    id: number;
    name: string;
    code: string;
  };

  destinationLocation: {
    id: number;
    name: string;
    code: string;
  };

  item: {
    id: number;
    sku: string;
    name: string;
  };

  createdBy: {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "OPERATIONS" | "SALES";
  };
}

export interface TransfersResponse {
  success: boolean;
  data: Transfer[];
}

export interface TransferResponse {
  success: boolean;
  message?: string;
  data: Transfer;
}

export interface CreateTransferData {
  transferNumber: string;
  sourceLocationId: number;
  destinationLocationId: number;
  itemId: number;
  quantity: number;
}

export async function getTransfers(): Promise<TransfersResponse> {
  const response = await api.get("/transfers");
  return response.data;
}

export async function getTransferById(
  id: number,
): Promise<TransferResponse> {
  const response = await api.get(`/transfers/${id}`);
  return response.data;
}

export async function createTransfer(
  data: CreateTransferData,
): Promise<TransferResponse> {
  const response = await api.post("/transfers", data);
  return response.data;
}

export async function dispatchTransfer(
  id: number,
): Promise<TransferResponse> {
  const response = await api.patch(
    `/transfers/${id}/dispatch`,
  );

  return response.data;
}

export async function receiveTransfer(
  id: number,
): Promise<TransferResponse> {
  const response = await api.patch(
    `/transfers/${id}/receive`,
  );

  return response.data;
}