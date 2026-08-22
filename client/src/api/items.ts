import { api } from "./client";

export interface ItemCategory {
  id: number;
  name: string;
}

export interface ItemBatch {
  id: number;
  batchNumber: string;
  itemId: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  category?: ItemCategory;
  batches?: ItemBatch[];
}

export interface CreateItemData {
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
}

export interface ItemsResponse {
  success: boolean;
  data: Item[];
}

export interface ItemResponse {
  success: boolean;
  data: Item;
}

export async function getItems(): Promise<ItemsResponse> {
  const response = await api.get<ItemsResponse>("/items");

  return response.data;
}

export async function getItemById(
  id: number,
): Promise<ItemResponse> {
  const response = await api.get<ItemResponse>(
    `/items/${id}`,
  );

  return response.data;
}

export async function createItem(
  data: CreateItemData,
): Promise<ItemResponse> {
  const response = await api.post<ItemResponse>(
    "/items",
    data,
  );

  return response.data;
}