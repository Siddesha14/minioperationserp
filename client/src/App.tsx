import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/auth/Login";
import Inventory from "./pages/inventory/Inventory";
import Orders from "./pages/orders/Orders";
import WorkOrders from "./pages/workorders/WorkOrders";
import Transfers from "./pages/transfers/Transfers";

import { getDashboardSummary } from "./api/dashboard";
import type { DashboardSummary } from "./api/dashboard";

function Dashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardSummary();
        setDashboard(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="mt-4 text-slate-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h1>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Overview of your operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={dashboard.inventory.totalItems}
        />

        <StatCard
          title="Available Stock"
          value={dashboard.inventory.totalAvailableQuantity}
        />

        <StatCard
          title="Customers"
          value={dashboard.customers.total}
        />

        <StatCard
          title="Completed Orders"
          value={dashboard.orders.completed}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Orders
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniStat
              label="Draft"
              value={dashboard.orders.draft}
            />

            <MiniStat
              label="Reserved"
              value={dashboard.orders.reserved}
            />

            <MiniStat
              label="Cancelled"
              value={dashboard.orders.cancelled}
            />

            <MiniStat
              label="Completed"
              value={dashboard.orders.completed}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Work Orders
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <MiniStat
              label="Assigned"
              value={dashboard.workOrders.assigned}
            />

            <MiniStat
              label="In Progress"
              value={dashboard.workOrders.inProgress}
            />

            <MiniStat
              label="Completed"
              value={dashboard.workOrders.completed}
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Transfers
        </h2>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <MiniStat
            label="Requested"
            value={dashboard.transfers.requested}
          />

          <MiniStat
            label="Dispatched"
            value={dashboard.transfers.dispatched}
          />

          <MiniStat
            label="Received"
            value={dashboard.transfers.received}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Recent Transactions
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3">Type</th>
                <th className="pb-3">Item</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Quantity</th>
              </tr>
            </thead>

            <tbody>
              {dashboard.recentTransactions.map(
                (transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100"
                  >
                    <td className="py-3 font-medium">
                      {transaction.type}
                    </td>

                    <td className="py-3">
                      {transaction.inventory.item.name}
                    </td>

                    <td className="py-3">
                      {transaction.inventory.location.name}
                    </td>

                    <td className="py-3">
                      {transaction.quantity}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 text-3xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}





export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/inventory" element={<Inventory />} />

        <Route path="/orders" element={<Orders />} />

        <Route
          path="/work-orders"
          element={<WorkOrders />}
        />

        <Route
          path="/transfers"
          element={<Transfers />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}