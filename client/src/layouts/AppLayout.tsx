import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATIONS" | "SALES";
  assignedLocation?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

export default function AppLayout() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    navigate("/login");
    return null;
  }

  const user: StoredUser = JSON.parse(storedUser);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          name={user.name}
          role={user.role}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}