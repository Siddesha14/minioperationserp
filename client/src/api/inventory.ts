import { api } from "./client";

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
}

export interface InventoryLocation {
  id: number;
  name: string;
  code: string;
}

export interface InventoryBatch {
  id: number;
  batchNumber: string;
}

export interface InventoryRecord {
  id: number;
  itemId: number;
  locationId: number;
  batchId: number;

  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;

  updatedAt: string;

  item: InventoryItem;
  location: InventoryLocation;
  batch: InventoryBatch;
}

export interface InventoryResponse {
  success: boolean;

  data: InventoryRecord[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInventoryReceiptData {
  itemId: number;
  locationId: number;
  batchId: number;
  quantity: number;
  reason : string;
}

export interface AdjustInventoryData {
  inventoryId: number;
  quantity: number;
  type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  reason?: string;
}

/**
 * Get paginated inventory.
 *
 * Matches Inventory.tsx:
 * getInventory(page, limit)
 */
export async function getInventory(
  page = 1,
  limit = 10,
  locationId?: number,
  itemId?: number,
  batchId?: number,
): Promise<InventoryResponse> {
  const response = await api.get<InventoryResponse>(
    "/inventory",
    {
      params: {
        page,
        limit,
        ...(locationId !== undefined && {
          locationId,
        }),
        ...(itemId !== undefined && {
          itemId,
        }),
        ...(batchId !== undefined && {
          batchId,
        }),
      },
    },
  );

  return response.data;
}

/**
 * Receive new inventory.
 */
export async function createInventoryReceipt(
  data: CreateInventoryReceiptData,
) {
  const response = await api.post(
    "/inventory/receipt",
    data,
  );

  return response.data;
}

/**
 * Adjust existing inventory.
 */
export async function adjustInventory(
  data: AdjustInventoryData,
) {
  const response = await api.post(
    "/inventory/adjust",
    data,
  );

  return response.data;
}