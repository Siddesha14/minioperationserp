import { api } from "./client";

export type WorkOrderStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface WorkOrder {
  id: number;
  workOrderNumber: string;
  locationId: number;
  itemId: number;
  requiredQuantity: number;
  assignedUserId: number;
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;

  location: {
    id: number;
    name: string;
    code: string;
  };

  item: {
    id: number;
    sku: string;
    name: string;
  };

  assignedUser: {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "OPERATIONS" | "SALES";
  };

  stockCheck: {
    requiredQuantity: number;
    availableQuantity: number;
    shortage: number;
    sufficientStock: boolean;
  };
}

export interface WorkOrdersResponse {
  success: boolean;
  data: WorkOrder[];
}

export interface WorkOrderResponse {
  success: boolean;
  message?: string;
  data: WorkOrder;
}

export interface CreateWorkOrderData {
  workOrderNumber: string;
  locationId: number;
  itemId: number;
  requiredQuantity: number;
  assignedUserId: number;
}

export async function getWorkOrders(): Promise<WorkOrdersResponse> {
  const response = await api.get("/work-orders");
  return response.data;
}

export async function getWorkOrderById(
  id: number,
): Promise<WorkOrderResponse> {
  const response = await api.get(`/work-orders/${id}`);
  return response.data;
}

export async function createWorkOrder(
  data: CreateWorkOrderData,
): Promise<WorkOrderResponse> {
  const response = await api.post("/work-orders", data);
  return response.data;
}

export async function updateWorkOrderStatus(
  id: number,
  status: WorkOrderStatus,
): Promise<WorkOrderResponse> {
  const response = await api.patch(
    `/work-orders/${id}/status`,
    { status },
  );

  return response.data;
}
