import { useEffect, useState } from "react";
import {
  getInventory,
  createInventoryReceipt,
  type InventoryRecord,
} from "../../api/inventory";

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Receive stock modal
  const [showReceiveModal, setShowReceiveModal] =
    useState(false);

  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const [receiveSuccess, setReceiveSuccess] = useState("");

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");

      const result = await getInventory(page, 10);

      setInventory(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRecords(result.pagination.total);
    } catch (error) {
      console.error("Inventory loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, [page]);

  function getStockStatus(
    availableQuantity: number,
  ) {
    if (availableQuantity <= 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (availableQuantity < 10) {
      return {
        label: "Low Stock",
        className: "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "In Stock",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  function openReceiveModal() {
    setReceiveError("");
    setReceiveSuccess("");

    setItemId("");
    setLocationId("");
    setBatchId("");
    setQuantity("");
    setReason("");

    setShowReceiveModal(true);
  }

  function closeReceiveModal() {
    if (submitting) {
      return;
    }

    setShowReceiveModal(false);
    setReceiveError("");
    setReceiveSuccess("");
  }

  async function handleReceiveStock(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setReceiveError("");
    setReceiveSuccess("");

    if (!itemId || !locationId || !batchId) {
      setReceiveError(
        "Item, location and batch are required.",
      );
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setReceiveError(
        "Quantity must be greater than 0.",
      );
      return;
    }

    try {
      setSubmitting(true);

      await createInventoryReceipt({
        itemId: Number(itemId),
        locationId: Number(locationId),
        batchId: Number(batchId),
        quantity: parsedQuantity,
        reason: reason.trim() || undefined,
      });

      setReceiveSuccess(
        "Inventory received successfully.",
      );

      setItemId("");
      setLocationId("");
      setBatchId("");
      setQuantity("");
      setReason("");

      await loadInventory();

      setTimeout(() => {
        setShowReceiveModal(false);
        setReceiveSuccess("");
      }, 700);
    } catch (error) {
      console.error(
        "Receive inventory error:",
        error,
      );

      setReceiveError(
        error instanceof Error
          ? error.message
          : "Failed to receive inventory",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage stock across your locations
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openReceiveModal}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Receive Stock
          </button>

          <button
            onClick={loadInventory}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Inventory Records
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {totalRecords}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Current Page
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {page}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Pages
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {totalPages}
          </p>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Stock Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current inventory by item, location and batch
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading inventory...
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No inventory records found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Item
                  </th>

                  <th className="px-6 py-4">
                    SKU
                  </th>

                  <th className="px-6 py-4">
                    Location
                  </th>

                  <th className="px-6 py-4">
                    Batch
                  </th>

                  <th className="px-6 py-4 text-right">
                    Physical
                  </th>

                  <th className="px-6 py-4 text-right">
                    Reserved
                  </th>

                  <th className="px-6 py-4 text-right">
                    Available
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>
                {inventory.map((record) => {
                  const status =
                    getStockStatus(
                      record.availableQuantity,
                    );

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {record.item.name}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {record.item.sku}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">
                          {record.location.name}
                        </div>

                        <div className="text-xs text-slate-400">
                          {record.location.code}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {record.batch.batchNumber}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {record.physicalQuantity}
                      </td>

                      <td className="px-6 py-4 text-right text-slate-600">
                        {record.reservedQuantity}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-slate-800">
                        {record.availableQuantity}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>

          </div>
        )}

        {/* Pagination */}
        {!loading && inventory.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">

            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">

              <button
                disabled={page === 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>

            </div>

          </div>
        )}

      </section>

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Receive Stock
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add inventory to a location
                </p>
              </div>

              <button
                type="button"
                onClick={closeReceiveModal}
                disabled={submitting}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleReceiveStock}
              className="space-y-5 p-6"
            >

              {/* Error */}
              {receiveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {receiveError}
                </div>
              )}

              {/* Success */}
              {receiveSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {receiveSuccess}
                </div>
              )}

              {/* Item */}
              <div>
                <label
                  htmlFor="itemId"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Item ID
                </label>

                <input
                  id="itemId"
                  type="number"
                  value={itemId}
                  onChange={(event) =>
                    setItemId(event.target.value)
                  }
                  placeholder="Enter item ID"
                  min="1"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="locationId"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Location ID
                </label>

                <input
                  id="locationId"
                  type="number"
                  value={locationId}
                  onChange={(event) =>
                    setLocationId(event.target.value)
                  }
                  placeholder="Enter location ID"
                  min="1"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Batch */}
              <div>
                <label
                  htmlFor="batchId"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Batch ID
                </label>

                <input
                  id="batchId"
                  type="number"
                  value={batchId}
                  onChange={(event) =>
                    setBatchId(event.target.value)
                  }
                  placeholder="Enter batch ID"
                  min="1"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder="Enter quantity"
                  min="1"
                  step="1"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="reason"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Reason
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  placeholder="e.g. New supplier delivery"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeReceiveModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Receiving..."
                    : "Receive Stock"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}