import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Building,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  AlertTriangle, // Added for error state
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper object to manage color variants professionally
const colorClasses = {
  blue: {
    border: "border-blue-600",
    icon: "text-blue-500",
    link: "text-blue-400",
  },
  green: {
    border: "border-green-600",
    icon: "text-green-500",
    link: "text-green-400",
  },
  yellow: {
    border: "border-yellow-500",
    icon: "text-yellow-500",
    link: "text-yellow-400",
  },
  indigo: {
    border: "border-indigo-600",
    icon: "text-indigo-500",
    link: "text-indigo-400",
  },
};

export default function CRMDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false); // Added error state
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/company/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch(() => {
        console.error("Failed to load stats");
        setError(true); // Set error on fail
      });
  }, [token]); // Added token as dependency

  // Card configuration array
  const cards = stats ? [
    {
      label: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "blue",
      link: "/manager/customers", // Added link for interactivity
    },
    {
      label: "Employees",
      value: stats.totalEmployees,
      icon: Building,
      color: "green",
      link: "/manager/employees",
    },
    {
      label: "Tickets Raised",
      value: stats.totalTickets,
      icon: ClipboardList,
      color: "yellow",
      link: "/manager/tickets",
    },
    {
      label: "Tickets Resolved",
      value: stats.resolvedTickets,
      icon: CheckCircle,
      color: "indigo",
      link: "/manager/customer-tickets",
    },
  ] : [];

  // Loading State
  if (!stats && !error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-400">
        Loading statistics...
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-red-400 p-8">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to Load Data</h2>
        <p>Could not fetch company statistics. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    // Main wrapper with dark bg
    <div className="text-white p-8 bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-100">Company Overview</h1>

      {/* Responsive grid for stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const colors = colorClasses[card.color]; // Get color theme
          return (
            <div
              key={i}
              onClick={() => navigate(card.link)} // Card is now a clickable link
              className={`
                p-6 rounded-xl bg-neutral-800 border border-neutral-700 shadow-lg
                flex flex-col justify-between min-h-[180px]
                cursor-pointer transition-all duration-300 ease-in-out
                hover:bg-neutral-700 hover:-translate-y-1 hover:shadow-2xl
                border-t-4 ${colors.border}
              `} // Strategic accent border
            >
              {/* Card Top: Label & Icon */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-lg font-medium text-gray-300">
                    {card.label}
                  </p>
                  <card.icon size={28} className={colors.icon} />
                </div>
                {/* Card Main: Statistic */}
                <p className="text-5xl font-bold text-gray-100">{card.value}</p>
              </div>

              {/* Card Bottom: Interactive Link */}
              <div
                className={`flex items-center text-sm font-medium ${colors.link} mt-4`}
              >
                <span>View Details</span>
                <ArrowRight size={16} className="ml-1.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Button Section */}
      <div className="mt-12 flex justify-end">
        <button
          onClick={() => navigate("company-profile")}
          className="
            px-6 py-3 bg-indigo-600 rounded-lg 
            flex items-center gap-2 text-white font-medium
            transition-all duration-300 ease-in-out
            shadow-lg hover:shadow-indigo-500/30
            hover:bg-indigo-700 hover:scale-105
          " // Added more interactive hover effects
        >
          Manage Company Details
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}