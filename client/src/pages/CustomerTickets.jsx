// client/src/pages/CustomerTickets.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiX } from "react-icons/fi";

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

  return (
    <div className="min-h-screen p-8 bg-[#0F0F1A] text-gray-200 relative">
      <h2 className="text-3xl font-bold mb-4">Customer Ticket Summary</h2>

      <div className="bg-[#1A1A2E] rounded-lg p-4 border border-gray-700 shadow-xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-gray-300 text-xs uppercase border-b border-gray-700/50">
            <tr>
              <th className="p-2">Customer</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Total Raised</th>
              <th className="p-2">Total Resolved</th>
              <th className="p-2">View History</th>
            </tr>
          </thead>
          <tbody>
            {summary.length ? summary.map((c) => (
              <tr key={c.customerId} className="border-t border-gray-700/30 hover:bg-gray-800/40">
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2">{c.contactName}</td>
                <td className="p-2">{c.phone}</td>
                <td className="p-2">{c.totalRaised}</td>
                <td className="p-2">{c.totalResolved}</td>
                <td className="p-2">
                  <button onClick={() => openCustomer(c)} className="bg-blue-600 px-3 py-1 rounded flex items-center gap-2"><FiEye /> View</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-400">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Tickets Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div className="fixed inset-0 bg-black/70 flex justify-center items-start z-50 p-6 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 rounded-2xl p-6 w-full max-w-3xl mt-8 border border-gray-700 shadow-xl"
              initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl">Tickets for {selectedCustomer.name}</h3>
                <button onClick={() => { setSelectedCustomer(null); setCustomerTickets([]); }}><FiX /></button>
              </div>

              {customerTickets.length ? (
                <div className="space-y-3">
                  {customerTickets.map((t) => (
                    <div key={t._id} className="p-3 rounded bg-gray-800/60 border border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-400">{t.ticketId} — <span className="font-medium">{t.subject}</span></div>
                          <div className="text-xs text-gray-300">{t.category} • {t.priority} • {t.status}</div>
                        </div>
                        <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</div>
                      </div>

                      <div className="mt-2 text-sm text-gray-300">{t.description}</div>

                      <div className="mt-2 text-xs text-gray-400">
                        Assigned: {t.assignedTo?.length ? t.assignedTo.map(a => a.name).join(", ") : "Unassigned"}
                      </div>

                      <div className="mt-2">
                        <div className="text-xs text-gray-300 font-medium">Audit</div>
                        {t.audit?.length ? t.audit.map((a,i) => (
                          <div key={i} className="text-xs text-gray-400 mt-1">
                            <div>{new Date(a.at).toLocaleString()} — <span className="text-emerald-400">{a.byName}</span> — {a.action}</div>
                            {a.note && <div className="italic text-gray-500">{a.note}</div>}
                          </div>
                        )) : <div className="text-xs text-gray-500">No audit</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">No tickets for this customer</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
