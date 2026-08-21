interface TopbarProps {
  name: string;
  role: string;
  onLogout: () => void;
}

export default function Topbar({
  name,
  role,
  onLogout,
}: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Operations Dashboard
        </h2>
        <p className="text-xs text-slate-500">
          Manage your operations efficiently
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">
            {name}
          </p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}