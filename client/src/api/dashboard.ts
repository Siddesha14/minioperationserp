export interface DashboardSummary {
  inventory: {
    totalItems: number;
    totalInventoryRecords: number;
    totalPhysicalQuantity: number;
    totalReservedQuantity: number;
    totalAvailableQuantity: number;
  };

  customers: {
    total: number;
  };

  orders: {
    draft: number;
    reserved: number;
    cancelled: number;
    completed: number;
  };

  workOrders: {
    assigned: number;
    inProgress: number;
    completed: number;
  };

  transfers: {
    requested: number;
    dispatched: number;
    received: number;
  };

  transactions: {
    receipt: number;
    adjustmentIn: number;
    adjustmentOut: number;
    transferOut: number;
    transferIn: number;
    reservation: number;
    release: number;
    sale: number;
  };

  lowStock: Array<{
    id: number;
    item: {
      id: number;
      sku: string;
      name: string;
    };
    location: {
      id: number;
      name: string;
      code: string;
    };
    batch: {
      id: number;
      batchNumber: string;
    };
    physicalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;

  recentTransactions: Array<{
    id: number;
    inventoryId: number;
    type: string;
    quantity: number;
    referenceId: string | null;
    reason: string | null;
    createdAt: string;
    inventory: {
      item: {
        id: number;
        sku: string;
        name: string;
      };
      location: {
        id: number;
        name: string;
        code: string;
      };
    };
    createdBy: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  }>;
}

interface DashboardResponse {
  success: boolean;
  data: DashboardSummary;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    "http://localhost:5000/api/dashboard/summary",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const result =
    (await response.json()) as DashboardResponse & {
      message?: string;
    };

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ?? "Failed to fetch dashboard summary",
    );
  }

  return result.data;
}