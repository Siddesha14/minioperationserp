import { useEffect, useMemo, useState } from "react";

import {
  getInventory,
  createInventoryReceipt,
  adjustInventory,
  type InventoryRecord,
} from "../../api/inventory";

import { getItems, type Item } from "../../api/items";

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Receive modal
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

  // Adjust modal
  const [showAdjustModal, setShowAdjustModal] =
    useState(false);

  const [selectedInventory, setSelectedInventory] =
    useState<InventoryRecord | null>(null);

  const [adjustType, setAdjustType] = useState<
    "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"
  >("ADJUSTMENT_IN");

  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const [adjustError, setAdjustError] = useState("");
  const [adjustSuccess, setAdjustSuccess] = useState("");
  const [adjusting, setAdjusting] = useState(false);

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

  async function loadItems() {
    try {
      setLoadingItems(true);

      const result = await getItems();

      setItems(result.data);
    } catch (error) {
      console.error("Items loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load items",
      );
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
  let cancelled = false;

  async function init() {
    // Sequential, not parallel — avoids two concurrent findMany()
    // calls racing on the shared connection.
    await loadItems();
    if (!cancelled) {
      await loadInventory();
    }
  }

  init();

  return () => {
    cancelled = true;
  };
}, []);

useEffect(() => {
  // Skip the very first run (page starts at 1, already loaded by init above)
  if (page === 1) return;
  loadInventory();
}, [page]);
  /*
   * Get all batches belonging to the currently selected item.
   */
  const availableBatches = useMemo(() => {
    if (!itemId) {
      return [];
    }

    const selectedItem = items.find(
      (item) => item.id === Number(itemId),
    );

    return selectedItem?.batches ?? [];
  }, [items, itemId]);

  function getStockStatus(
    availableQuantity: number,
  ) {
    if (availableQuantity <= 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (availableQuantity < 10) {
      return {
        label: "Low Stock",
        className:
          "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-emerald-100 text-emerald-700",
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

  function handleItemChange(
    value: string,
  ) {
    setItemId(value);

    // Reset batch whenever item changes.
    setBatchId("");
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
        reason:
          reason.trim() || undefined,
      });

      setReceiveSuccess(
        "Inventory received successfully.",
      );

      await loadInventory();

      setTimeout(() => {
        setShowReceiveModal(false);

        setReceiveSuccess("");

        setItemId("");
        setLocationId("");
        setBatchId("");
        setQuantity("");
        setReason("");
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

  function openAdjustModal(
    record: InventoryRecord,
  ) {
    setSelectedInventory(record);

    setAdjustType("ADJUSTMENT_IN");
    setAdjustQuantity("");
    setAdjustReason("");

    setAdjustError("");
    setAdjustSuccess("");

    setShowAdjustModal(true);
  }

  function closeAdjustModal() {
    if (adjusting) {
      return;
    }

    setShowAdjustModal(false);
    setSelectedInventory(null);

    setAdjustError("");
    setAdjustSuccess("");
  }

  async function handleAdjustStock(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setAdjustError("");
    setAdjustSuccess("");

    if (!selectedInventory) {
      return;
    }

    const parsedQuantity =
      Number(adjustQuantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setAdjustError(
        "Quantity must be greater than 0.",
      );
      return;
    }

    if (
      adjustType === "ADJUSTMENT_OUT" &&
      parsedQuantity >
        selectedInventory.availableQuantity
    ) {
      setAdjustError(
        `Cannot remove more than the available quantity (${selectedInventory.availableQuantity}).`,
      );
      return;
    }

    try {
      setAdjusting(true);

      await adjustInventory({
        inventoryId: selectedInventory.id,
        quantity: parsedQuantity,
        type: adjustType,
        reason:
          adjustReason.trim() || undefined,
      });

      setAdjustSuccess(
        "Inventory adjusted successfully.",
      );

      await loadInventory();

      setTimeout(() => {
        setShowAdjustModal(false);
        setSelectedInventory(null);
        setAdjustSuccess("");
      }, 700);
    } catch (error) {
      console.error(
        "Adjust inventory error:",
        error,
      );

      setAdjustError(
        error instanceof Error
          ? error.message
          : "Failed to adjust inventory",
      );
    } finally {
      setAdjusting(false);
    }
  }

  const totalAvailable = inventory.reduce(
    (sum, record) =>
      sum + record.availableQuantity,
    0,
  );

  const lowStockCount = inventory.filter(
    (record) =>
      record.availableQuantity > 0 &&
      record.availableQuantity < 10,
  ).length;

  const outOfStockCount = inventory.filter(
    (record) =>
      record.availableQuantity <= 0,
  ).length;

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          title="Inventory Records"
          value={totalRecords}
        />

        <SummaryCard
          title="Available Stock"
          value={totalAvailable}
        />

        <SummaryCard
          title="Low Stock"
          value={lowStockCount}
        />

        <SummaryCard
          title="Out of Stock"
          value={outOfStockCount}
        />

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

                  <th className="px-6 py-4 text-right">
                    Action
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

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            openAdjustModal(record)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Adjust
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>

          </div>
        )}

        {/* Pagination */}
        {!loading &&
          inventory.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">

              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">

                <button
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>

                <button
                  disabled={
                    page >= totalPages
                  }
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

      {/* =====================================================
          RECEIVE STOCK MODAL
      ===================================================== */}

      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

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

            <form
              onSubmit={handleReceiveStock}
              className="space-y-5 p-6"
            >

              {receiveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {receiveError}
                </div>
              )}

              {receiveSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {receiveSuccess}
                </div>
              )}

              {/* Item */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Item
                </label>

                <select
                  value={itemId}
                  onChange={(event) =>
                    handleItemChange(
                      event.target.value,
                    )
                  }
                  required
                  disabled={loadingItems}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    {loadingItems
                      ? "Loading items..."
                      : "Select item"}
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

              {/* Location */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Location
                </label>

                <select
                  value={locationId}
                  onChange={(event) =>
                    setLocationId(
                      event.target.value,
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    Select location
                  </option>

                  {inventory
                    .map(
                      (record) =>
                        record.location,
                    )
                    .filter(
                      (location, index, array) =>
                        array.findIndex(
                          (item) =>
                            item.id ===
                            location.id,
                        ) === index,
                    )
                    .map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name} (
                        {location.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Batch
                </label>

                <select
                  value={batchId}
                  onChange={(event) =>
                    setBatchId(
                      event.target.value,
                    )
                  }
                  required
                  disabled={!itemId}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="">
                    {!itemId
                      ? "Select an item first"
                      : availableBatches.length === 0
                        ? "No batches available"
                        : "Select batch"}
                  </option>

                  {availableBatches.map(
                    (batch) => (
                      <option
                        key={batch.id}
                        value={batch.id}
                      >
                        {batch.batchNumber}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Reason{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. New supplier delivery"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeReceiveModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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

      {/* =====================================================
          ADJUST STOCK MODAL
      ===================================================== */}

      {showAdjustModal &&
        selectedInventory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Adjust Stock
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedInventory.item.name} ·{" "}
                    {selectedInventory.location.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAdjustModal}
                  disabled={adjusting}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={handleAdjustStock}
                className="space-y-5 p-6"
              >

                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Available stock
                    </span>

                    <span className="font-bold text-slate-800">
                      {
                        selectedInventory.availableQuantity
                      }
                    </span>
                  </div>
                </div>

                {adjustError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {adjustError}
                  </div>
                )}

                {adjustSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {adjustSuccess}
                  </div>
                )}

                {/* Adjustment type */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Adjustment Type
                  </label>

                  <select
                    value={adjustType}
                    onChange={(event) =>
                      setAdjustType(
                        event.target
                          .value as
                          | "ADJUSTMENT_IN"
                          | "ADJUSTMENT_OUT",
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="ADJUSTMENT_IN">
                      Increase Stock
                    </option>

                    <option value="ADJUSTMENT_OUT">
                      Decrease Stock
                    </option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(event) =>
                      setAdjustQuantity(
                        event.target.value,
                      )
                    }
                    min="1"
                    step="1"
                    required
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Reason{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    value={adjustReason}
                    onChange={(event) =>
                      setAdjustReason(
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="e.g. Physical stock count correction"
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                  <button
                    type="button"
                    onClick={closeAdjustModal}
                    disabled={adjusting}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={adjusting}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {adjusting
                      ? "Adjusting..."
                      : "Adjust Stock"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}