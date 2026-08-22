import { useEffect, useState } from "react";
import {
  getCustomers,
  type Customer,
} from "../../api/customers";
import {
  getOrders,
  createOrder,
  reserveOrder,
  cancelOrder,
  completeOrder,
  type Order,
} from "../../api/orders";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
const [customersLoading, setCustomersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [orderNumber, setOrderNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(
    null,
  );
  async function loadCustomers() {
  try {
    setCustomersLoading(true);

    const result = await getCustomers();

    setCustomers(result.data);
  } catch (error) {
    console.error("Customers loading error:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Failed to load customers",
    );
  } finally {
    setCustomersLoading(false);
  }
}
  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const result = await getOrders();

      setOrders(result.data);
    } catch (error) {
      console.error("Orders loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load orders",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  loadOrders();
  loadCustomers();
}, []);

  async function handleCreateOrder(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!orderNumber.trim()) {
      setError("Order number is required");
      return;
    }

    if (!customerId || !itemId || !quantity) {
      setError("Please fill all order fields");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createOrder({
        orderNumber: orderNumber.trim(),
        customerId: Number(customerId),
        items: [
          {
            itemId: Number(itemId),
            quantity: Number(quantity),
          },
        ],
      });

      setOrderNumber("");
      setCustomerId("");
      setItemId("");
      setQuantity("");

      setShowCreateModal(false);

      await loadOrders();
    } catch (error) {
      console.error("Create order error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(
    action: "reserve" | "cancel" | "complete",
    id: number,
  ) {
    try {
      setActionLoading(id);
      setError("");

      if (action === "reserve") {
        await reserveOrder(id);
      }

      if (action === "cancel") {
        await cancelOrder(id);
      }

      if (action === "complete") {
        await completeOrder(id);
      }

      await loadOrders();
    } catch (error) {
      console.error("Order action error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Order action failed",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusStyle(status: Order["status"]) {
    switch (status) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700";

      case "RESERVED":
        return "bg-blue-100 text-blue-700";

      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer orders and inventory reservations
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={loadOrders}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Create Order
          </button>

        </div>

      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {orders.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Draft
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {orders.filter(
              (order) => order.status === "DRAFT",
            ).length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Reserved
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {orders.filter(
              (order) => order.status === "RESERVED",
            ).length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {orders.filter(
              (order) => order.status === "COMPLETED",
            ).length}
          </p>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Orders table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <h2 className="text-lg font-semibold text-slate-800">
            Customer Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View and manage all customer orders
          </p>

        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">

            <p className="text-slate-500">
              No orders found.
            </p>

            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create your first order
            </button>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Order
                  </th>

                  <th className="px-6 py-4">
                    Customer
                  </th>

                  <th className="px-6 py-4">
                    Items
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {orders.map((order) => (

                  <tr
                    key={order.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >

                    <td className="px-6 py-4">

                      <div className="font-semibold text-slate-800">
                        {order.orderNumber}
                      </div>

                      <div className="text-xs text-slate-400">
                        ID #{order.id}
                      </div>

                    </td>

                    <td className="px-6 py-4">

                      <div className="font-medium text-slate-700">
                        {order.customer?.name ||
                          `Customer #${order.customerId}`}
                      </div>

                      {order.customer?.email && (
                        <div className="text-xs text-slate-400">
                          {order.customer.email}
                        </div>
                      )}

                    </td>

                    <td className="px-6 py-4">

                      <div className="space-y-1">

                        {order.items.map((item) => (

                          <div
                            key={
                              item.id ??
                              `${item.itemId}-${item.quantity}`
                            }
                            className="text-slate-600"
                          >
                            {item.item?.name ||
                              `Item #${item.itemId}`}{" "}
                            × {item.quantity}
                          </div>

                        ))}

                      </div>

                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>

                    </td>

                    <td className="px-6 py-4 text-slate-500">

                      {new Date(
                        order.createdAt,
                      ).toLocaleDateString()}

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        {order.status === "DRAFT" && (
                          <>
                            <button
                              disabled={
                                actionLoading === order.id
                              }
                              onClick={() =>
                                handleAction(
                                  "reserve",
                                  order.id,
                                )
                              }
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {actionLoading === order.id
                                ? "..."
                                : "Reserve"}
                            </button>

                            <button
                              disabled={
                                actionLoading === order.id
                              }
                              onClick={() =>
                                handleAction(
                                  "cancel",
                                  order.id,
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {order.status === "RESERVED" && (
                          <>
                            <button
                              disabled={
                                actionLoading === order.id
                              }
                              onClick={() =>
                                handleAction(
                                  "complete",
                                  order.id,
                                )
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {actionLoading === order.id
                                ? "..."
                                : "Complete"}
                            </button>

                            <button
                              disabled={
                                actionLoading === order.id
                              }
                              onClick={() =>
                                handleAction(
                                  "cancel",
                                  order.id,
                                )
                              }
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {(order.status === "COMPLETED" ||
                          order.status === "CANCELLED") && (
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

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Create Order
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new customer order
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleCreateOrder}
              className="space-y-5 p-6"
            >

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Order Number
                </label>

                <input
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(event.target.value)
                  }
                  placeholder="ORD-1001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />
              </div>
              <div>
  <label className="mb-1 block text-sm font-medium text-slate-700">
    Customer
  </label>

  <select
    value={customerId}
    onChange={(event) =>
      setCustomerId(event.target.value)
    }
    disabled={customersLoading}
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
  >
    <option value="">
      {customersLoading
        ? "Loading customers..."
        : "Select a customer"}
    </option>

    {customers.map((customer) => (
      <option
        key={customer.id}
        value={customer.id}
      >
        {customer.name}
        {customer.email
          ? ` — ${customer.email}`
          : ""}
      </option>
    ))}
  </select>
</div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Item ID
                </label>

                <input
                  type="number"
                  min="1"
                  value={itemId}
                  onChange={(event) =>
                    setItemId(event.target.value)
                  }
                  placeholder="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Enter the existing item ID.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder="10"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Order"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}