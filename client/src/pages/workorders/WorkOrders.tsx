import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrderStatus,
  type WorkOrder,
  type WorkOrderStatus,
} from "../../api/workorders";
import { getItems, type Item } from "../../api/items";

export default function WorkOrders() {
  const { user } = useAuth();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [locationId, setLocationId] = useState(
    user?.assignedLocation?.id
      ? String(user.assignedLocation.id)
      : "",
  );
  const [itemId, setItemId] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState("");
  const [assignedUserId, setAssignedUserId] = useState(
    user?.role === "OPERATIONS" ? String(user.id) : "",
  );

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

  async function loadItems() {
    try {
      const result = await getItems();

      setItems(result.data);
    } catch (error) {
      console.error("Items loading error:", error);
    }
  }

  useEffect(() => {
    loadWorkOrders();
    loadItems();
  }, []);

  async function handleCreate(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !workOrderNumber.trim() ||
      !locationId ||
      !itemId ||
      !requiredQuantity ||
      !assignedUserId
    ) {
      setError("Please fill all work order fields");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const result = await createWorkOrder({
        workOrderNumber: workOrderNumber.trim(),
        locationId: Number(locationId),
        itemId: Number(itemId),
        requiredQuantity: Number(requiredQuantity),
        assignedUserId: Number(assignedUserId),
      });

      setSuccess(
        result.data.stockCheck.sufficientStock
          ? "Work order created successfully. Stock is sufficient."
          : `Work order created, but there is a stock shortage of ${result.data.stockCheck.shortage}.`,
      );

      setWorkOrderNumber("");
      setItemId("");
      setRequiredQuantity("");

      if (user?.role !== "OPERATIONS") {
        setAssignedUserId("");
      }

      setShowCreate(false);

      await loadWorkOrders();
    } catch (error) {
      console.error("Create work order error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create work order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(
    id: number,
    status: WorkOrderStatus,
  ) {
    try {
      setActionLoading(id);
      setError("");
      setSuccess("");

      const result = await updateWorkOrderStatus(id, status);

      setSuccess(result.message || "Work order updated");

      await loadWorkOrders();
    } catch (error) {
      console.error("Work order status error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update work order",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusStyle(status: WorkOrderStatus) {
    switch (status) {
      case "ASSIGNED":
        return "bg-slate-100 text-slate-700";

      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";

      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";
    }
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

  const canCreate = user?.role === "ADMIN";

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

        <div className="flex gap-2">
          <button
            onClick={loadWorkOrders}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setShowCreate(true);
                setError("");
                setSuccess("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Create Work Order
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Assigned
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {assignedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            In Progress
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {completedCount}
          </p>
        </div>

      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Create Work Order
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assign operational work to a user.
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-4"
            >

              {/* Work order number */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Work Order Number
                </label>

                <input
                  value={workOrderNumber}
                  onChange={(e) =>
                    setWorkOrderNumber(e.target.value)
                  }
                  placeholder="WO-001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Location ID
                </label>

                <input
                  type="number"
                  value={locationId}
                  onChange={(e) =>
                    setLocationId(e.target.value)
                  }
                  placeholder="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Use the ID of the warehouse/location.
                </p>
              </div>

              {/* Item */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Item
                </label>

                <select
                  value={itemId}
                  onChange={(e) =>
                    setItemId(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select item
                  </option>

                  {items.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Required Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={requiredQuantity}
                  onChange={(e) =>
                    setRequiredQuantity(e.target.value)
                  }
                  placeholder="10"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Assigned User */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Assigned User ID
                </label>

                <input
                  type="number"
                  value={assignedUserId}
                  onChange={(e) =>
                    setAssignedUserId(e.target.value)
                  }
                  placeholder="2"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Enter the ID of the Operations user.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Work Order"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Records */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-800">
            Work Order Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track assigned work, required quantities and stock availability
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading work orders...
          </div>
        ) : workOrders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              No work orders found.
            </p>

            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create your first Work Order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Work Order
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Item
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Location
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Required
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Available
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Assigned To
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {workOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">
                        {workOrder.workOrderNumber}
                      </p>

                      <p className="text-xs text-slate-400">
                        #{workOrder.id}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">
                        {workOrder.item.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {workOrder.item.sku}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {workOrder.location.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {workOrder.location.code}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {workOrder.requiredQuantity}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          workOrder.stockCheck.sufficientStock
                            ? "text-sm font-medium text-emerald-600"
                            : "text-sm font-medium text-red-600"
                        }
                      >
                        {workOrder.stockCheck.availableQuantity}
                      </span>

                      {!workOrder.stockCheck.sufficientStock && (
                        <p className="text-xs text-red-500">
                          Short by{" "}
                          {workOrder.stockCheck.shortage}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {workOrder.assignedUser.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {workOrder.assignedUser.role}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                          workOrder.status,
                        )}`}
                      >
                        {workOrder.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">

                        {workOrder.status === "ASSIGNED" && (
                          <button
                            disabled={
                              actionLoading === workOrder.id
                            }
                            onClick={() =>
                              handleStatus(
                                workOrder.id,
                                "IN_PROGRESS",
                              )
                            }
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actionLoading === workOrder.id
                              ? "..."
                              : "Start"}
                          </button>
                        )}

                        {workOrder.status === "IN_PROGRESS" && (
                          <button
                            disabled={
                              actionLoading === workOrder.id
                            }
                            onClick={() =>
                              handleStatus(
                                workOrder.id,
                                "COMPLETED",
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionLoading === workOrder.id
                              ? "..."
                              : "Complete"}
                          </button>
                        )}

                        {workOrder.status === "COMPLETED" && (
                          <span className="text-xs text-slate-400">
                            No actions
                          </span>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

      </section>
    </div>
  );
}