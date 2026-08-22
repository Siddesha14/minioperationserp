import { NavLink } from "react-router-dom";

type UserRole = "ADMIN" | "OPERATIONS" | "SALES";

interface SidebarProps {
  role: UserRole;
}

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["ADMIN", "OPERATIONS", "SALES"],
  },
  {
    label: "Inventory",
    path: "/inventory",
    roles: ["ADMIN", "OPERATIONS"],
  },
  {
    label: "Customers",
    path: "/customers",
    roles: ["ADMIN", "SALES"],
  },
  {
    label: "Orders",
    path: "/orders",
    roles: ["ADMIN", "SALES","OPERATIONS"],
  },
  {
    label: "Work Orders",
    path: "/work-orders",
    roles: ["ADMIN", "OPERATIONS"],
  },
  {
    label: "Transfers",
    path: "/transfers",
    roles: ["ADMIN", "OPERATIONS"],
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold">Operations ERP</h1>
        <p className="text-xs text-slate-400 mt-1">
          Management System
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Logged in as</p>
        <p className="text-sm font-semibold mt-1">{role}</p>
      </div>
    </aside>
  );
}