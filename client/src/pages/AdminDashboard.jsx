import { useEffect, useState } from "react";
import axios from "axios";
import { Building2, CheckCircle, Users } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    approvedCompanies: 0,
    totalEmployees: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("http://localhost:5001/api/admin/stats");
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total CRMs",
      value: stats.totalCompanies,
      icon: <Building2 className="w-10 h-10 text-blue-400" />,
      color: "from-blue-500/70 to-blue-700/90",
      glow: "shadow-blue-500/40",
    },
    {
      title: "Approved Companies",
      value: stats.approvedCompanies,
      icon: <CheckCircle className="w-10 h-10 text-emerald-400" />,
      color: "from-emerald-500/70 to-green-700/90",
      glow: "shadow-emerald-500/40",
    },
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <Users className="w-10 h-10 text-amber-400" />,
      color: "from-amber-400/70 to-orange-600/90",
      glow: "shadow-amber-500/40",
    },
  ];

  return (
    <div className="p-10 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-gray-100">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-400">Your CRM system at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${card.color} p-6 rounded-2xl shadow-xl border border-white/10 hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 ${card.glow}`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-black/20 backdrop-blur-md rounded-full">
                {card.icon}
              </div>
              <div>
                <h3 className="text-gray-200 text-sm font-medium uppercase tracking-wide">
                  {card.title}
                </h3>
                <p className="text-4xl font-extrabold text-white drop-shadow-sm">
                  {card.value ?? 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Insights & Overview
        </h2>
        <p className="text-gray-300 leading-relaxed">
          Monitor company onboarding trends, approval rates, and workforce growth
          across all registered CRMs. Stay on top of performance metrics and
          take data-driven administrative actions to improve efficiency.
        </p>
      </div>
    </div>
  );
}
