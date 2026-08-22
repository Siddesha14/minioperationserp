import { useEffect, useState } from "react";
import {
  createItem,
  getItems,
  type Item,
} from "../../api/items";

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("1");

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

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
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreateItem(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!sku.trim()) {
      setError("SKU is required");
      return;
    }

    if (!name.trim()) {
      setError("Item name is required");
      return;
    }

    if (!categoryId) {
      setError("Category is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createItem({
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: Number(categoryId),
      });

      setSku("");
      setName("");
      setDescription("");
      setCategoryId("1");

      setShowCreateModal(false);

      await loadItems();
    } catch (error) {
      console.error("Create item error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create item",
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
            Items
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage products and inventory items
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadItems}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Item
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Items table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            Item Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View and manage all inventory items
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">
            Loading items...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No items found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">NAME</th>
                  <th className="px-6 py-4">CATEGORY</th>
                  <th className="px-6 py-4">DESCRIPTION</th>
                  <th className="px-6 py-4">CREATED</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {item.sku}
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {item.name}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {item.category?.name ??
                          `Category #${item.categoryId}`}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {item.description || "—"}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(
                        item.createdAt,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800">
                Create Item
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a new inventory item
              </p>
            </div>

            <form
              onSubmit={handleCreateItem}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  SKU
                </label>

                <input
                  value={sku}
                  onChange={(e) =>
                    setSku(e.target.value)
                  }
                  placeholder="LAPTOP-001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Item Name
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Business Laptop"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Standard business laptop"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category ID
                </label>

                <input
                  type="number"
                  min="1"
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Current seeded Electronics category is ID 1.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
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
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}