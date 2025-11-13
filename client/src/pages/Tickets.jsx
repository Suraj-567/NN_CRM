// client/src/pages/Tickets.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiActivity, FiEdit, FiEye } from "react-icons/fi";

export default function Tickets() {
  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: "http://localhost:5001/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    subject: "",
    description: "",
    category: "Support",
    priority: "Low",
    assignedTo: [],
    attachments: [],
    status: "Open",
    slaDeadline: "",
  });

  const fetchAll = async () => {
    try {
      const [tRes, cRes, eRes] = await Promise.all([
        api.get("/tickets"),
        api.get("/customers"),
        api.get("/employees"),
      ]);
      setTickets(tRes.data);
      setCustomers(cRes.data);
      // employees endpoint returns Employee model; ensure only active employees appear
      const active = eRes.data.filter((em) => em.status === "Active");
      setEmployees(active);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const showMsgTimed = (txt) => {
    setMsg(txt);
    setTimeout(() => setMsg(""), 3500);
  };

  const handleChange = (e) => {
    const { name, value, multiple, options } = e.target;
    if (multiple) {
      const vals = Array.from(options).filter((o) => o.selected).map((o) => o.value);
      setForm((p) => ({ ...p, [name]: vals }));
    } else setForm((p) => ({ ...p, [name]: value }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      customerId: "",
      subject: "",
      description: "",
      category: "Support",
      priority: "Low",
      assignedTo: [],
      attachments: [],
      status: "Open",
      slaDeadline: "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await api.put(`/tickets/${editing._id}`, form);
        showMsgTimed(res.data.message || "Updated");
      } else {
        const res = await api.post("/tickets", form);
        showMsgTimed(res.data.message || "Created");
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      showMsgTimed(err.response?.data?.message || "Error");
    }
  };

  const handleEdit = (t) => {
    setEditing(t);
    setForm({
      customerId: t.customerId?._id || t.customerId,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      assignedTo: (t.assignedTo || []).map((a) => a._id || a),
      attachments: t.attachments || [],
      status: t.status,
      slaDeadline: t.slaDeadline ? new Date(t.slaDeadline).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const openView = (t) => {
    setViewTicket(t);
  };

  return (
    <div className="min-h-screen p-8 bg-[#0F0F1A] text-gray-200 relative">
      <AnimatePresence>
        {msg && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-400 text-black px-6 py-3 rounded-xl z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Tickets</h2>
        <button onClick={openAdd} className="bg-indigo-600 px-4 py-2 rounded flex items-center gap-2">
          <FiPlus /> Add Ticket
        </button>
      </div>

      {/* Tickets table */}
      <div className="bg-[#1A1A2E] rounded-lg p-4 border border-gray-700 shadow-xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-gray-300 text-xs uppercase border-b border-gray-700/50">
            <tr>
              <th className="p-2">Ticket ID</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Category</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Status</th>
              <th className="p-2">Assigned</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length ? (
              tickets.map((t) => (
                <tr key={t._id} className="border-t border-gray-700/30 hover:bg-gray-800/40">
                  <td className="p-2 font-medium">{t.ticketId}</td>
                  <td className="p-2">{t.customerId?.name || "—"}</td>
                  <td className="p-2">{t.subject}</td>
                  <td className="p-2">{t.category}</td>
                  <td className="p-2">{t.priority}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">
                    {t.assignedTo && t.assignedTo.length ? (
                      <div className="flex gap-1">
                        {t.assignedTo.map((a) => (
                          <span key={a._id} className="text-xs bg-indigo-800/50 px-2 py-0.5 rounded-full">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => handleEdit(t)} className="bg-blue-600 p-1.5 rounded">
                      <FiEdit />
                    </button>
                    <button onClick={() => openView(t)} className="bg-gray-700 p-1.5 rounded">
                      <FiEye />
                    </button>
                    <button onClick={() => setViewTicket(t)} className="bg-gray-700 p-1.5 rounded">
                      <FiActivity />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-400">No tickets found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Ticket Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 bg-black/70 flex justify-center items-start z-50 p-6 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 rounded-2xl p-6 w-full max-w-2xl mt-8 border border-gray-700 shadow-xl"
              initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl">{editing ? "Edit Ticket" : "Add Ticket"}</h3>
                <button onClick={() => { setShowForm(false); setEditing(null); }}><FiX /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <select name="customerId" value={form.customerId} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded">
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" className="w-full bg-gray-800 p-2 rounded" />
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full bg-gray-800 p-2 rounded" rows={4} />

                <div className="grid grid-cols-2 gap-2">
                  <select name="category" value={form.category} onChange={handleChange} className="bg-gray-800 p-2 rounded">
                    <option>Billing</option>
                    <option>Delivery</option>
                    <option>Support</option>
                    <option>Other</option>
                  </select>

                  <select name="priority" value={form.priority} onChange={handleChange} className="bg-gray-800 p-2 rounded">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>

                <select name="assignedTo" multiple value={form.assignedTo} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded">
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input name="slaDeadline" type="datetime-local" value={form.slaDeadline} onChange={handleChange} className="bg-gray-800 p-2 rounded" />
                  <select name="status" value={form.status} onChange={handleChange} className="bg-gray-800 p-2 rounded">
                    <option>Open</option>
                    <option>Closed</option>
                  </select>
                </div>

                {/* attachments placeholder - file uploads require additional backend */}
                <div className="text-xs text-gray-400">Attachments are not yet enabled (implement file upload endpoint).</div>

                <div className="flex gap-2">
                  <button type="submit" className="bg-indigo-600 px-4 py-2 rounded">{editing ? "Update" : "Add"} Ticket</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="bg-gray-700 px-4 py-2 rounded">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Ticket Modal (details + audit) */}
      <AnimatePresence>
        {viewTicket && (
          <motion.div className="fixed inset-0 bg-black/70 flex justify-center items-start z-50 p-6 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 rounded-2xl p-6 w-full max-w-3xl mt-8 border border-gray-700 shadow-xl"
              initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl">Ticket — {viewTicket.ticketId}</h3>
                <button onClick={() => setViewTicket(null)}><FiX /></button>
              </div>

              <div className="space-y-2">
                <div><span className="text-gray-400">Customer:</span> {viewTicket.customerId?.name}</div>
                <div><span className="text-gray-400">Subject:</span> {viewTicket.subject}</div>
                <div><span className="text-gray-400">Description:</span> {viewTicket.description}</div>
                <div><span className="text-gray-400">Category:</span> {viewTicket.category}</div>
                <div><span className="text-gray-400">Priority:</span> {viewTicket.priority}</div>
                <div><span className="text-gray-400">Status:</span> {viewTicket.status}</div>
                <div><span className="text-gray-400">Assigned:</span> {viewTicket.assignedTo?.map(a => a.name).join(", ") || "Unassigned"}</div>
                <div><span className="text-gray-400">SLA Deadline:</span> {viewTicket.slaDeadline ? new Date(viewTicket.slaDeadline).toLocaleString() : "—"}</div>
              </div>

              <div className="mt-4">
                <h4 className="text-lg mb-2">Audit Trail</h4>
                {viewTicket.audit?.length ? (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {viewTicket.audit.map((a,i) => (
                      <div key={i} className="p-3 rounded bg-gray-800/60 border border-gray-700">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <div>{new Date(a.at).toLocaleString()}</div>
                          <div className="capitalize">{a.action}</div>
                        </div>
                        <div className="text-sm"><span className="text-gray-400">By:</span> <span className="text-emerald-400">{a.byName || "—"}</span></div>
                        {a.note && <div className="text-xs italic text-gray-400 mt-1">{a.note}</div>}
                        {a.diff && Object.entries(a.diff).map(([k,v]) => (
                          <div key={k} className="text-sm mt-1">
                            <span className="text-gray-300 font-medium">{k}:</span>{" "}
                            <span className="text-red-400 line-through">{v.from || "—"}</span>{" "}
                            <span className="text-gray-400">→</span>{" "}
                            <span className="text-green-400">{v.to}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No audit history</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
