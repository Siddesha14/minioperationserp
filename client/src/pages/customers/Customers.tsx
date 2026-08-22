import { useEffect, useState } from "react";

import {
  createCustomer,
  getCustomers,
} from "../../api/customers";

import type {
  Customer,
  CreateCustomerData,
} from "../../api/customers";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [creating, setCreating] = useState(false);

  const [form, setForm] =
    useState<CreateCustomerData>({
      name: "",
      email: "",
      phone: "",
    });

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await getCustomers();

      setCustomers(response.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customers",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleChange(
    field: keyof CreateCustomerData,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateCustomer(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Customer name is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createCustomer({
        name: form.name.trim(),
        email: form.email?.trim() || "",
        phone: form.phone?.trim() || "",
      });

      setForm({
        name: "",
        email: "",
        phone: "",
      });

      setShowCreateForm(false);

      await loadCustomers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create customer",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your customers and their orders
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreateForm((current) => !current)
          }
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {showCreateForm
            ? "Cancel"
            : "+ Add Customer"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Add Customer
          </h2>

          <form
            onSubmit={handleCreateCustomer}
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  handleChange(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="Customer name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={form.email ?? ""}
                onChange={(event) =>
                  handleChange(
                    "email",
                    event.target.value,
                  )
                }
                placeholder="customer@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Phone
              </label>

              <input
                type="text"
                value={form.phone ?? ""}
                onChange={(event) =>
                  handleChange(
                    "phone",
                    event.target.value,
                  )
                }
                placeholder="Phone number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Customer"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Customers */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Customer List
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {customers.length} customer
                {customers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-700">
              No customers found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add your first customer to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-6 py-3 font-medium">
                    ID
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Email
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Phone
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Orders
                  </th>

                  <th className="px-6 py-3 font-medium">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      #{customer.id}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">
                        {customer.name}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {customer.email || "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {customer.phone || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {customer._count?.orders ?? 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(
                        customer.createdAt,
                      ).toLocaleDateString()}
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