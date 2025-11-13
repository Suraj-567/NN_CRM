import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Ticket, LogOut } from "lucide-react";

export default function EmployeeLayout() {
  const location = useLocation();
  const timerRef = useRef(null);
  const TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms

  // --- 🔒 Auto Logout Logic ---
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleLogout(true);
    }, TIMEOUT);
  };

  const handleLogout = (auto = false) => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    if (auto) {
      alert("You have been logged out due to inactivity.");
    }
    window.location.href = "/employee";
  };

  useEffect(() => {
    // Start / reset timer on activity
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start immediately on load

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  // --- END Auto Logout ---

  const linkStyle = (path) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-green-600 text-white shadow-md"
        : "text-gray-300 hover:text-white hover:bg-green-600/40"
    }`;

  return (
    <div className="flex fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900/80 backdrop-blur-md border-r border-gray-700 p-5 flex flex-col justify-between shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-8 text-center text-green-400">
            Employee Panel
          </h2>

          <nav className="space-y-2">
            <Link
              to="/employee-layout/dashboard"
              className={linkStyle("/employee-layout/dashboard")}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link
              to="/employee-layout/customers"
              className={linkStyle("/employee-layout/customers")}
            >
              <Users size={18} />
              Assigned Customers
            </Link>

            <Link
              to="/employee-layout/tickets"
              className={linkStyle("/employee-layout/tickets")}
            >
              <Ticket size={18} />
              Assigned Tickets
            </Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4">
          <button
            onClick={() => handleLogout(false)}
            className="flex items-center gap-2 w-full text-left text-red-400 hover:text-white hover:bg-red-600/40 px-4 py-2.5 rounded-lg transition-all duration-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-950/70 backdrop-blur-sm">
        <div className="rounded-2xl bg-gray-900/70 border border-gray-700 shadow-inner p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
