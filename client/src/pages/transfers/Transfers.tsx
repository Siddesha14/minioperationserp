import { useEffect, useMemo, useState } from "react";

import {
  createTransfer,
  dispatchTransfer,
  getTransfers,
  receiveTransfer,
  type Transfer,
} from "../../api/transfers";

import { getInventory } from "../../api/inventory";

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<
    {
      id: number;
      sku: string;
      name: string;
    }[]
  >([]);

  const [locations, setLocations] = useState<
    {
      id: number;
      name: string;
      code: string;
    }[]
  >([]);

  const [transferNumber, setTransferNumber] =
    useState("");

  const [sourceLocationId, setSourceLocationId] =
    useState("");

  const [
    destinationLocationId,
    setDestinationLocationId,
  ] = useState("");

  const [itemId, setItemId] = useState("");

  const [quantity, setQuantity] = useState("");

  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [transferResponse, inventoryResponse] =
        await Promise.all([
          getTransfers(),
          getInventory(1, 100),
        ]);

      setTransfers(transferResponse.data);

      /*
       * Inventory already contains item + location data.
       * Deduplicate them for the transfer form.
       */
      const itemMap = new Map<
        number,
        {
          id: number;
          sku: string;
          name: string;
        }
      >();

      const locationMap = new Map<
        number,
        {
          id: number;
          name: string;
          code: string;
        }
      >();

      for (const record of inventoryResponse.data) {
        itemMap.set(record.item.id, record.item);

        locationMap.set(
          record.location.id,
          record.location,
        );
      }

      setItems(Array.from(itemMap.values()));
      setLocations(Array.from(locationMap.values()));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load transfers",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedSource = useMemo(
    () =>
      locations.find(
        (location) =>
          location.id === Number(sourceLocationId),
      ),
    [locations, sourceLocationId],
  );

  const availableDestinationLocations = useMemo(
    () =>
      locations.filter(
        (location) =>
          location.id !== Number(sourceLocationId),
      ),
    [locations, sourceLocationId],
  );

  async function handleCreateTransfer(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!transferNumber.trim()) {
      setError("Transfer number is required.");
      return;
    }

    if (!sourceLocationId) {
      setError("Please select a source location.");
      return;
    }

    if (!destinationLocationId) {
      setError("Please select a destination location.");
      return;
    }

    if (
      Number(sourceLocationId) ===
      Number(destinationLocationId)
    ) {
      setError(
        "Source and destination locations must be different.",
      );
      return;
    }

    if (!itemId) {
      setError("Please select an item.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    try {
      setCreating(true);

      const response = await createTransfer({
        transferNumber: transferNumber.trim(),
        sourceLocationId: Number(sourceLocationId),
        destinationLocationId: Number(
          destinationLocationId,
        ),
        itemId: Number(itemId),
        quantity: parsedQuantity,
      });

      setTransfers((current) => [
        response.data,
        ...current,
      ]);

      setTransferNumber("");
      setSourceLocationId("");
      setDestinationLocationId("");
      setItemId("");
      setQuantity("");

      setSuccess(
        response.message ||
          "Transfer created successfully.",
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          (error instanceof Error
            ? error.message
            : "Failed to create transfer"),
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDispatch(id: number) {
    try {
      setActionId(id);
      setError("");
      setSuccess("");

      const response = await dispatchTransfer(id);

      setTransfers((current) =>
        current.map((transfer) =>
          transfer.id === id
            ? response.data
            : transfer,
        ),
      );

      setSuccess(
        response.message ||
          "Transfer dispatched successfully.",
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Failed to dispatch transfer",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleReceive(id: number) {
    try {
      setActionId(id);
      setError("");
      setSuccess("");

      const response = await receiveTransfer(id);

      setTransfers((current) =>
        current.map((transfer) =>
          transfer.id === id
            ? response.data
            : transfer,
        ),
      );

      setSuccess(
        response.message ||
          "Transfer received successfully.",
      );
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Failed to receive transfer",
      );
    } finally {
      setActionId(null);
    }
  }

  function statusClass(status: Transfer["status"]) {
    if (status === "REQUESTED") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "DISPATCHED") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-green-100 text-green-700";
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Transfers
        </h1>

        <p className="mt-4 text-slate-500">
          Loading transfers...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Transfers
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Move inventory between locations
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* CREATE TRANSFER */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Create Transfer
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Request stock movement from one location to
            another.
          </p>
        </div>

        <form
          onSubmit={handleCreateTransfer}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Transfer Number
            </label>

            <input
              type="text"
              value={transferNumber}
              onChange={(event) =>
                setTransferNumber(event.target.value)
              }
              placeholder="TR-001"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Item
            </label>

            <select
              value={itemId}
              onChange={(event) =>
                setItemId(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Select item</option>

              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Source Location
            </label>

            <select
              value={sourceLocationId}
              onChange={(event) => {
                setSourceLocationId(
                  event.target.value,
                );

                if (
                  Number(destinationLocationId) ===
                  Number(event.target.value)
                ) {
                  setDestinationLocationId("");
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">
                Select source location
              </option>

              {locations.map((location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.code} — {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Destination Location
            </label>

            <select
              value={destinationLocationId}
              onChange={(event) =>
                setDestinationLocationId(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">
                Select destination location
              </option>

              {availableDestinationLocations.map(
                (location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.code} — {location.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              placeholder="10"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Transfer"}
            </button>
          </div>
        </form>

        {selectedSource && (
          <p className="mt-3 text-xs text-slate-500">
            Source: {selectedSource.code} —{" "}
            {selectedSource.name}
          </p>
        )}
      </section>

      {/* TRANSFER LIST */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Transfer Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {transfers.length} transfer
              {transfers.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {transfers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No transfers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-6 py-3">
                    Transfer
                  </th>

                  <th className="px-6 py-3">
                    Item
                  </th>

                  <th className="px-6 py-3">
                    From
                  </th>

                  <th className="px-6 py-3">
                    To
                  </th>

                  <th className="px-6 py-3">
                    Quantity
                  </th>

                  <th className="px-6 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {transfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {transfer.transferNumber}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {transfer.item.name}
                      </div>

                      <div className="text-xs text-slate-500">
                        {transfer.item.sku}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {transfer.sourceLocation.code}
                    </td>

                    <td className="px-6 py-4">
                      {
                        transfer.destinationLocation
                          .code
                      }
                    </td>

                    <td className="px-6 py-4">
                      {transfer.quantity}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          transfer.status,
                        )}`}
                      >
                        {transfer.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {transfer.status ===
                        "REQUESTED" && (
                        <button
                          type="button"
                          disabled={
                            actionId === transfer.id
                          }
                          onClick={() =>
                            handleDispatch(
                              transfer.id,
                            )
                          }
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionId === transfer.id
                            ? "..."
                            : "Dispatch"}
                        </button>
                      )}

                      {transfer.status ===
                        "DISPATCHED" && (
                        <button
                          type="button"
                          disabled={
                            actionId === transfer.id
                          }
                          onClick={() =>
                            handleReceive(
                              transfer.id,
                            )
                          }
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionId === transfer.id
                            ? "..."
                            : "Receive"}
                        </button>
                      )}

                      {transfer.status ===
                        "RECEIVED" && (
                        <span className="text-xs text-slate-400">
                          Completed
                        </span>
                      )}
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