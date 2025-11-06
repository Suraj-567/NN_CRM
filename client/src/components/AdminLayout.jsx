import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckCircle,
  Building2,
  LogOut,
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  const linkStyle = (path) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-md"
        : "text-gray-300 hover:text-white hover:bg-blue-600/40"
    }`;

  return (
    <div className="flex fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900/80 backdrop-blur-md border-r border-gray-700 p-5 flex flex-col justify-between shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-8 text-center text-blue-400">
            Admin Panel
          </h2>
          <nav className="space-y-2">
            <Link
              to="/admin-layout/dashboard"
              className={linkStyle("/admin-layout/dashboard")}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              to="/admin-layout/approvals"
              className={linkStyle("/admin-layout/approvals")}
            >
              <CheckCircle size={18} />
              CRM Approvals
            </Link>
            <Link
              to="/admin-layout/approved-companies"
              className={linkStyle("/admin-layout/approved-companies")}
            >
              <Building2 size={18} />
              Approved Companies
            </Link>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/admin";
            }}
            className="flex items-center gap-2 w-full text-left text-red-400 hover:text-white hover:bg-red-600/40 px-4 py-2.5 rounded-lg transition-all duration-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-950/70 backdrop-blur-sm">
        <div className="mb-6 border-b border-gray-700 pb-3">
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
            Welcome, Admin 
          </h1>
          <p className="text-gray-400 mt-1">
            Manage approvals, companies, and system settings
          </p>
        </div>

        <div className="rounded-2xl bg-gray-900/70 border border-gray-700 shadow-inner p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
