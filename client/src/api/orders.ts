import { api } from "./client";

export interface OrderItem {
  id?: number;
  itemId: number;
  quantity: number;
  item?: {
    id: number;
    sku: string;
    name: string;
  };
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  createdById: number;
  status: "DRAFT" | "RESERVED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;

  customer?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
  };

  items: OrderItem[];
}

export interface CreateOrderItem {
  itemId: number;
  quantity: number;
}

export interface CreateOrderData {
  orderNumber: string;
  customerId: number;
  items: CreateOrderItem[];
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: Order;
}

export async function getOrders(): Promise<OrdersResponse> {
  const response = await api.get("/orders");

  return response.data;
}

export async function getOrderById(
  id: number,
): Promise<OrderResponse> {
  const response = await api.get(`/orders/${id}`);

  return response.data;
}

export async function createOrder(
  data: CreateOrderData,
): Promise<OrderResponse> {
  const response = await api.post("/orders", data);

  return response.data;
}

export async function reserveOrder(
  id: number,
): Promise<OrderResponse> {
  const response = await api.patch(
    `/orders/${id}/reserve`,
  );

  return response.data;
}

export async function cancelOrder(
  id: number,
): Promise<OrderResponse> {
  const response = await api.patch(
    `/orders/${id}/cancel`,
  );

  return response.data;
}

export async function completeOrder(
  id: number,
): Promise<OrderResponse> {
  const response = await api.patch(
    `/orders/${id}/complete`,
  );

  return response.data;
}