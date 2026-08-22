import { api } from "./client";

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;

  _count?: {
    orders: number;
  };
}

export interface CustomersResponse {
  success: boolean;
  data: Customer[];
}

export interface CustomerResponse {
  success: boolean;
  message?: string;
  data: Customer;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
}

export async function getCustomers(): Promise<CustomersResponse> {
  const response = await api.get("/customers");
  return response.data;
}

export async function getCustomerById(
  id: number,
): Promise<CustomerResponse> {
  const response = await api.get(`/customers/${id}`);
  return response.data;
}

export async function createCustomer(
  data: CreateCustomerData,
): Promise<CustomerResponse> {
  const response = await api.post("/customers", data);
  return response.data;
}