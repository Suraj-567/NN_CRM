import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiX, FiUsers, FiPhone, FiMail, FiCheckCircle, FiAlertCircle, FiClock, FiActivity, FiBarChart2 } from "react-icons/fi";

export default function CustomerTickets() {
  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: "http://localhost:5001/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const [summary, setSummary] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [msg, setMsg] = useState("");

  const fetchSummary = async () => {
    try {
      const res = await api.get("/tickets/summary/customers");
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const openCustomer = async (c) => {
    setSelectedCustomer(c);
    try {
      const res = await api.get(`/tickets/customer/${c.customerId}`);
      setCustomerTickets(res.data);
    } catch (err) {
      console.error(err);
      setCustomerTickets([]);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "Critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "High": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Open": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Closed": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    }
  };

  const getResolutionRate = (raised, resolved) => {
    if (raised === 0) return 0;
    return Math.round((resolved / raised) * 100);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[#0d0f12] via-[#121417] to-[#0d0f12] text-gray-100 relative">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30">
            <FiBarChart2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              Customer Ticket Analytics
            </h2>
            <p className="text-gray-400 mt-1">Track ticket history and resolution rates per customer</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Statistics Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-gradient-to-br from-[#1a1d21] to-[#1f2228] rounded-xl p-5 border border-gray-800/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-purple-400">{summary.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <FiUsers className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1d21] to-[#1f2228] rounded-xl p-5 border border-gray-800/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-blue-400">
                {summary.reduce((acc, c) => acc + c.totalRaised, 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <FiActivity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a1d21] to-[#1f2228] rounded-xl p-5 border border-gray-800/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Resolved Tickets</p>
              <p className="text-3xl font-bold text-emerald-400">
                {summary.reduce((acc, c) => acc + c.totalResolved, 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <FiCheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customer Summary Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1a1d21]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-[#1f2228] to-[#1a1d21] border-b border-gray-800/50">
              <tr>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    Customer
                  </div>
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    Contact
                  </div>
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    Phone
                  </div>
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs text-center">
                  Total Raised
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs text-center">
                  Total Resolved
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs text-center">
                  Resolution Rate
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.length ? summary.map((c, idx) => {
                const resolutionRate = getResolutionRate(c.totalRaised, c.totalResolved);
                return (
                  <motion.tr 
                    key={c.customerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t border-gray-800/30 hover:bg-[#1f2228]/50 transition-all duration-200"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-gray-200">{c.name}</div>
                    </td>
                    <td className="p-4 text-gray-300">{c.contactName}</td>
                    <td className="p-4 text-gray-300">
                      <span className="font-mono text-sm">{c.phone}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                        {c.totalRaised}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        {c.totalResolved}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-full max-w-[100px] h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${resolutionRate}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className={`h-full ${
                              resolutionRate >= 80 ? 'bg-emerald-500' :
                              resolutionRate >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-400">{resolutionRate}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <motion.button 
                          onClick={() => openCustomer(c)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/40 hover:to-purple-600/40 border border-blue-500/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium"
                        >
                          <FiEye className="w-4 h-4" /> View History
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiAlertCircle className="w-12 h-12 text-gray-600" />
                      <p className="text-gray-400 text-lg">No customers found</p>
                      <p className="text-gray-600 text-sm">Customer data will appear here once available</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Customer Tickets Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-start z-50 p-4 md:p-6 overflow-y-auto"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-[#1a1d21] via-[#1f2228] to-[#1a1d21] text-gray-100 rounded-2xl p-6 md:p-8 w-full max-w-5xl mt-8 mb-8 border border-gray-800/50 shadow-2xl"
              initial={{ scale: 0.9, y: 50 }} 
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-800/50">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-3">
                    Ticket History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <FiUsers className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Customer</p>
                        <p className="text-gray-200 font-semibold">{selectedCustomer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                        <FiMail className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Contact</p>
                        <p className="text-gray-200 font-semibold">{selectedCustomer.contactName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                        <FiPhone className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                        <p className="text-gray-200 font-semibold font-mono text-sm">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <motion.button 
                  onClick={() => { setSelectedCustomer(null); setCustomerTickets([]); }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white transition-colors ml-4"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Tickets Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0d0f12]/50 rounded-xl p-4 border border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Total Tickets</p>
                      <p className="text-2xl font-bold text-blue-400">{customerTickets.length}</p>
                    </div>
                    <FiActivity className="w-8 h-8 text-blue-400/50" />
                  </div>
                </div>
                <div className="bg-[#0d0f12]/50 rounded-xl p-4 border border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Open Tickets</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {customerTickets.filter(t => t.status === 'Open').length}
                      </p>
                    </div>
                    <FiClock className="w-8 h-8 text-orange-400/50" />
                  </div>
                </div>
                <div className="bg-[#0d0f12]/50 rounded-xl p-4 border border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Closed Tickets</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {customerTickets.filter(t => t.status === 'Closed').length}
                      </p>
                    </div>
                    <FiCheckCircle className="w-8 h-8 text-emerald-400/50" />
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              {customerTickets.length ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {customerTickets.map((t, idx) => (
                    <motion.div 
                      key={t._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-5 rounded-xl bg-gradient-to-r from-[#0d0f12] to-[#121417] border border-gray-800/50 hover:border-gray-700/50 transition-all shadow-lg"
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/30">
                            {t.ticketId}
                          </span>
                          <h4 className="font-semibold text-gray-200 text-lg">{t.subject}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(t.status)}`}>
                            {t.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(t.priority)}`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {t.category}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <FiClock className="w-4 h-4 text-gray-500" />
                            {new Date(t.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Description</p>
                        <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/30 rounded-lg p-3">
                          {t.description || "No description provided"}
                        </p>
                      </div>

                      {/* Assigned To */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Assigned To</p>
                        {t.assignedTo?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {t.assignedTo.map(a => (
                              <span key={a._id} className="px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 text-indigo-300">
                                {a.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Unassigned</span>
                        )}
                      </div>

                      {/* Audit Trail */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <FiActivity className="w-4 h-4 text-purple-400" />
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Audit Trail</p>
                        </div>
                        {t.audit?.length ? (
                          <div className="space-y-2">
                            {t.audit.map((a, i) => (
                              <div key={i} className="text-xs bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                    <span className="text-gray-400">{new Date(a.at).toLocaleString()}</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 capitalize text-xs w-fit">
                                    {a.action}
                                  </span>
                                </div>
                                <div className="ml-3.5">
                                  <span className="text-gray-500">By:</span>{" "}
                                  <span className="text-emerald-400 font-medium">{a.byName || "—"}</span>
                                </div>
                                {a.note && (
                                  <div className="ml-3.5 mt-1 italic text-gray-500 bg-gray-900/30 rounded p-2">
                                    &quot;{a.note}&quot;
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic bg-gray-800/20 rounded-lg p-3">
                            No audit history available
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0d0f12]/50 rounded-xl p-12 border border-gray-800/50 text-center">
                  <FiAlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-medium mb-2">No Tickets Found</p>
                  <p className="text-gray-600 text-sm">&quot;This customer hasn&apos;t raised any tickets yet&quot;</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style >{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0d0f12;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2e35;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a3e45;
        }
      `}</style>
    </div>
  );
}