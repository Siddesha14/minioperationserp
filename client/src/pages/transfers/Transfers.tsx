import { useEffect, useState } from "react";
import {
  getTransfers,
  dispatchTransfer,
  receiveTransfer,
  type Transfer,
} from "../../api/transfers";

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function loadTransfers() {
    try {
      setLoading(true);
      setError("");

      const result = await getTransfers();

      setTransfers(result.data);
    } catch (error) {
      console.error("Transfers loading error:", error);

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
    loadTransfers();
  }, []);

  async function handleDispatch(id: number) {
    try {
      setActionLoading(id);
      setError("");

      await dispatchTransfer(id);

      await loadTransfers();
    } catch (error) {
      console.error("Dispatch transfer error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to dispatch transfer",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReceive(id: number) {
    try {
      setActionLoading(id);
      setError("");

      await receiveTransfer(id);

      await loadTransfers();
    } catch (error) {
      console.error("Receive transfer error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to receive transfer",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusStyle(status: Transfer["status"]) {
    switch (status) {
      case "REQUESTED":
        return "bg-amber-100 text-amber-700";

      case "DISPATCHED":
        return "bg-blue-100 text-blue-700";

      case "RECEIVED":
        return "bg-emerald-100 text-emerald-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function getStatusLabel(status: Transfer["status"]) {
    switch (status) {
      case "REQUESTED":
        return "Requested";

      case "DISPATCHED":
        return "Dispatched";

      case "RECEIVED":
        return "Received";

      default:
        return status;
    }
  }

  const requestedCount = transfers.filter(
    (transfer) => transfer.status === "REQUESTED",
  ).length;

  const dispatchedCount = transfers.filter(
    (transfer) => transfer.status === "DISPATCHED",
  ).length;

  const receivedCount = transfers.filter(
    (transfer) => transfer.status === "RECEIVED",
  ).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Transfers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage stock transfers between locations
          </p>
        </div>

        <button
          onClick={loadTransfers}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Transfers
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {transfers.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Requested
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-600">
            {requestedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Dispatched
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {dispatchedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Received
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {receivedCount}
          </p>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Transfer Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Stock Transfers
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track inventory movement between locations
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading transfers...
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No transfers found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Transfer
                  </th>

                  <th className="px-6 py-4">
                    Item
                  </th>

                  <th className="px-6 py-4">
                    From
                  </th>

                  <th className="px-6 py-4">
                    To
                  </th>

                  <th className="px-6 py-4 text-right">
                    Quantity
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

                {transfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >

                    {/* Transfer Number */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {transfer.transferNumber}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(
                          transfer.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Item */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">
                        {transfer.item.name}
                      </div>

                      <div className="font-mono text-xs text-slate-400">
                        {transfer.item.sku}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        {transfer.sourceLocation.name}
                      </div>

                      <div className="text-xs text-slate-400">
                        {transfer.sourceLocation.code}
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        {transfer.destinationLocation.name}
                      </div>

                      <div className="text-xs text-slate-400">
                        {transfer.destinationLocation.code}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                      {transfer.quantity}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                          transfer.status,
                        )}`}
                      >
                        {getStatusLabel(
                          transfer.status,
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">

                      {transfer.status === "REQUESTED" && (
                        <button
                          onClick={() =>
                            handleDispatch(
                              transfer.id,
                            )
                          }
                          disabled={
                            actionLoading ===
                            transfer.id
                          }
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          transfer.id
                            ? "Processing..."
                            : "Dispatch"}
                        </button>
                      )}

                      {transfer.status === "DISPATCHED" && (
                        <button
                          onClick={() =>
                            handleReceive(
                              transfer.id,
                            )
                          }
                          disabled={
                            actionLoading ===
                            transfer.id
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          transfer.id
                            ? "Processing..."
                            : "Receive"}
                        </button>
                      )}

                      {transfer.status === "RECEIVED" && (
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