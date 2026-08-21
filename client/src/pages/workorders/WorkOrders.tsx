import { useEffect, useState } from "react";
import {
  getWorkOrders,
  updateWorkOrderStatus,
  type WorkOrder,
  type WorkOrderStatus,
} from "../../api/workorders";

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadWorkOrders() {
    try {
      setLoading(true);
      setError("");

      const result = await getWorkOrders();

      setWorkOrders(result.data);
    } catch (error) {
      console.error("Work orders loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load work orders",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkOrders();
  }, []);

  async function changeStatus(
    id: number,
    status: WorkOrderStatus,
  ) {
    try {
      setUpdatingId(id);
      setError("");

      const result = await updateWorkOrderStatus(id, status);

      setWorkOrders((current) =>
        current.map((workOrder) =>
          workOrder.id === id
            ? result.data
            : workOrder,
        ),
      );
    } catch (error) {
      console.error("Work order status update error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update work order",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusStyle(status: WorkOrderStatus) {
    switch (status) {
      case "ASSIGNED":
        return {
          label: "Assigned",
          className: "bg-blue-100 text-blue-700",
        };

      case "IN_PROGRESS":
        return {
          label: "In Progress",
          className: "bg-amber-100 text-amber-700",
        };

      case "COMPLETED":
        return {
          label: "Completed",
          className: "bg-emerald-100 text-emerald-700",
        };
    }
  }

  function getStockStyle(workOrder: WorkOrder) {
    if (workOrder.stockCheck.sufficientStock) {
      return {
        label: "Sufficient",
        className: "text-emerald-700",
      };
    }

    return {
      label: `Short by ${workOrder.stockCheck.shortage}`,
      className: "text-red-600",
    };
  }

  const assignedCount = workOrders.filter(
    (order) => order.status === "ASSIGNED",
  ).length;

  const inProgressCount = workOrders.filter(
    (order) => order.status === "IN_PROGRESS",
  ).length;

  const completedCount = workOrders.filter(
    (order) => order.status === "COMPLETED",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Work Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage production and operational work orders
          </p>
        </div>

        <button
          onClick={loadWorkOrders}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Assigned
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {assignedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            In Progress
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Work Order Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track assigned work, required quantities and stock availability
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading work orders...
          </div>
        ) : workOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No work orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">
                    Work Order
                  </th>

                  <th className="px-6 py-4">
                    Item
                  </th>

                  <th className="px-6 py-4">
                    Location
                  </th>

                  <th className="px-6 py-4">
                    Assigned To
                  </th>

                  <th className="px-6 py-4 text-right">
                    Required
                  </th>

                  <th className="px-6 py-4 text-right">
                    Available
                  </th>

                  <th className="px-6 py-4">
                    Stock
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {workOrders.map((workOrder) => {
                  const status = getStatusStyle(
                    workOrder.status,
                  );

                  const stock = getStockStyle(
                    workOrder,
                  );

                  return (
                    <tr
                      key={workOrder.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      {/* Work Order */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {workOrder.workOrderNumber}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          #{workOrder.id}
                        </div>
                      </td>

                      {/* Item */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {workOrder.item.name}
                        </div>

                        <div className="mt-1 font-mono text-xs text-slate-400">
                          {workOrder.item.sku}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">
                          {workOrder.location.name}
                        </div>

                        <div className="text-xs text-slate-400">
                          {workOrder.location.code}
                        </div>
                      </td>

                      {/* Assigned User */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">
                          {workOrder.assignedUser.name}
                        </div>

                        <div className="text-xs text-slate-400">
                          {workOrder.assignedUser.email}
                        </div>
                      </td>

                      {/* Required */}
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        {workOrder.requiredQuantity}
                      </td>

                      {/* Available */}
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        {workOrder.stockCheck.availableQuantity}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold ${stock.className}`}
                        >
                          {stock.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {workOrder.status ===
                          "ASSIGNED" && (
                          <button
                            disabled={
                              updatingId ===
                              workOrder.id
                            }
                            onClick={() =>
                              changeStatus(
                                workOrder.id,
                                "IN_PROGRESS",
                              )
                            }
                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                            workOrder.id
                              ? "Updating..."
                              : "Start"}
                          </button>
                        )}

                        {workOrder.status ===
                          "IN_PROGRESS" && (
                          <button
                            disabled={
                              updatingId ===
                              workOrder.id
                            }
                            onClick={() =>
                              changeStatus(
                                workOrder.id,
                                "COMPLETED",
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                            workOrder.id
                              ? "Updating..."
                              : "Complete"}
                          </button>
                        )}

                        {workOrder.status ===
                          "COMPLETED" && (
                          <span className="text-xs text-slate-400">
                            Finished
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}