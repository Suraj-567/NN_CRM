import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX, FiActivity, FiEdit, FiEye, FiClock, FiAlertCircle, FiUser, FiTag } from "react-icons/fi";

const normalizeDateForComparison = (date) => {
  if (!date) return null;
  // Remove milliseconds and 'Z' to match datetime-local format
  const d = new Date(date);
  d.setSeconds(0, 0); // Clear seconds and milliseconds
  return d.toISOString().slice(0, 16); // Returns YYYY-MM-DDTHH:mm
};

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
  
  // IMPORTANT: Store the original values for comparison
  const [originalForm, setOriginalForm] = useState(null);
  
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
    setOriginalForm(null); // Clear original form
    const newForm = {
      customerId: "",
      subject: "",
      description: "",
      category: "Support",
      priority: "Low",
      assignedTo: [],
      attachments: [],
      status: "Open",
      slaDeadline: "",
    };
    setForm(newForm);
    setShowForm(true);
  };

  const handleEdit = (t) => {
    setEditing(t);
    
    // Prepare the form data
    const formData = {
      customerId: t.customerId?._id || t.customerId,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      assignedTo: (t.assignedTo || []).map((a) => a._id || a),
      attachments: t.attachments || [],
      status: t.status,
      slaDeadline: t.slaDeadline ? normalizeDateForComparison(t.slaDeadline) : "",
    };
    
    setForm(formData);
    // CRITICAL: Store original values for comparison
    setOriginalForm(formData);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        // Build payload with ONLY changed fields
        const updatePayload = {};
        
        // Compare each field and only include if changed
        if (form.customerId !== originalForm.customerId) {
          updatePayload.customerId = form.customerId;
        }
        if (form.subject !== originalForm.subject) {
          updatePayload.subject = form.subject;
        }
        if (form.description !== originalForm.description) {
          updatePayload.description = form.description;
        }
        if (form.category !== originalForm.category) {
          updatePayload.category = form.category;
        }
        if (form.priority !== originalForm.priority) {
          updatePayload.priority = form.priority;
        }
        if (form.status !== originalForm.status) {
          updatePayload.status = form.status;
        }
        
        // Compare assignedTo arrays
        const originalAssigned = [...originalForm.assignedTo].sort().join(',');
        const currentAssigned = [...form.assignedTo].sort().join(',');
        if (originalAssigned !== currentAssigned) {
          updatePayload.assignedTo = form.assignedTo;
        }
        
        // Compare slaDeadline carefully
        const originalDeadline = originalForm.slaDeadline || "";
        const currentDeadline = form.slaDeadline || "";
        if (originalDeadline !== currentDeadline) {
          // Convert to ISO string if there's a value
          updatePayload.slaDeadline = currentDeadline ? new Date(currentDeadline).toISOString() : null;
        }
        
        // Only send request if there are actual changes
        if (Object.keys(updatePayload).length === 0) {
          showMsgTimed("No changes detected");
          setShowForm(false);
          setEditing(null);
          setOriginalForm(null);
          return;
        }
        
        const res = await api.put(`/tickets/${editing._id}`, updatePayload);
        showMsgTimed(res.data.message || "Updated");
      } else {
        // For new tickets, send all fields
        const createPayload = { ...form };
        if (createPayload.slaDeadline) {
          createPayload.slaDeadline = new Date(createPayload.slaDeadline).toISOString();
        } else {
          createPayload.slaDeadline = null;
        }
        
        const res = await api.post("/tickets", createPayload);
        showMsgTimed(res.data.message || "Created");
      }
      
      setShowForm(false);
      setEditing(null);
      setOriginalForm(null);
      fetchAll();
    } catch (err) {
      showMsgTimed(err.response?.data?.message || "Error");
    }
  };

  const openView = (t) => {
    setViewTicket(t);
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

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[#0d0f12] via-[#121417] to-[#0d0f12] text-gray-100 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {msg && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 backdrop-blur-sm border border-emerald-400/30"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-2 font-medium">
              <FiAlertCircle className="w-5 h-5" />
              {msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Support Tickets
          </h2>
          <p className="text-gray-400 mt-1">Manage and track customer support requests</p>
        </div>
        <motion.button 
          onClick={openAdd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all duration-300 font-medium"
        >
          <FiPlus className="w-5 h-5" /> Add Ticket
        </motion.button>
      </motion.div>

      {/* Tickets Grid/Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1a1d21]/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-[#1f2228] to-[#1a1d21] border-b border-gray-800/50">
              <tr>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">
                  <div className="flex items-center gap-2">
                    <FiTag className="w-4 h-4" />
                    Ticket ID
                  </div>
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Customer
                  </div>
                </th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">Subject</th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">Category</th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">Priority</th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs">Assigned</th>
                <th className="p-4 font-semibold text-gray-300 uppercase tracking-wider text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length ? (
                tickets.map((t, idx) => (
                  <motion.tr 
                    key={t._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t border-gray-800/30 hover:bg-[#1f2228]/50 transition-all duration-200"
                  >
                    <td className="p-4">
                      <span className="font-mono font-semibold text-blue-400">{t.ticketId}</span>
                    </td>
                    <td className="p-4 text-gray-300">{t.customerId?.name || "—"}</td>
                    <td className="p-4">
                      <div className="max-w-xs truncate text-gray-200" title={t.subject}>
                        {t.subject}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {t.assignedTo && t.assignedTo.length ? (
                        <div className="flex flex-wrap gap-1">
                          {t.assignedTo.map((a) => (
                            <span key={a._id} className="text-xs bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 text-indigo-300 px-2 py-1 rounded-lg font-medium">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <motion.button 
                          onClick={() => handleEdit(t)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 p-2 rounded-lg transition-all duration-200"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4 text-blue-400" />
                        </motion.button>
                        <motion.button 
                          onClick={() => openView(t)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 p-2 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4 text-emerald-400" />
                        </motion.button>
                        <motion.button 
                          onClick={() => setViewTicket(t)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 p-2 rounded-lg transition-all duration-200"
                          title="Activity"
                        >
                          <FiActivity className="w-4 h-4 text-purple-400" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiAlertCircle className="w-12 h-12 text-gray-600" />
                      <p className="text-gray-400 text-lg">No tickets found</p>
                      <p className="text-gray-600 text-sm">Create your first ticket to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Ticket Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-start z-50 p-4 md:p-6 overflow-y-auto"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-[#1a1d21] via-[#1f2228] to-[#1a1d21] text-gray-100 rounded-2xl p-6 md:p-8 w-full max-w-3xl mt-8 mb-8 border border-gray-800/50 shadow-2xl"
              initial={{ scale: 0.9, y: 50 }} 
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {editing ? "Edit Ticket" : "Create New Ticket"}
                </h3>
                <motion.button 
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Customer *</label>
                  <select 
                    name="customerId" 
                    value={form.customerId} 
                    onChange={handleChange} 
                    required
                    className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject *</label>
                  <input 
                    name="subject" 
                    value={form.subject} 
                    onChange={handleChange} 
                    placeholder="Brief description of the issue" 
                    required
                    className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    placeholder="Detailed description of the issue..." 
                    className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none resize-none" 
                    rows={5} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                    <select 
                      name="category" 
                      value={form.category} 
                      onChange={handleChange} 
                      className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                    >
                      <option>Billing</option>
                      <option>Delivery</option>
                      <option>Support</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                    <select 
                      name="priority" 
                      value={form.priority} 
                      onChange={handleChange} 
                      className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assign To (Hold Ctrl/Cmd for multiple)</label>
                  <select 
                    name="assignedTo" 
                    multiple 
                    value={form.assignedTo} 
                    onChange={handleChange} 
                    className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none min-h-[120px]"
                  >
                    {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      SLA Deadline
                    </label>
                    <input 
                      name="slaDeadline" 
                      type="datetime-local" 
                      value={form.slaDeadline} 
                      onChange={handleChange} 
                      className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select 
                      name="status" 
                      value={form.status} 
                      onChange={handleChange} 
                      className="w-full bg-[#0d0f12] border border-gray-700/50 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                    >
                      <option>Open</option>
                      <option>Closed</option>
                    </select>
                  </div>
                </div>

            

                <div className="flex gap-3 pt-4">
                  <motion.button 
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300"
                  >
                    {editing ? "Update Ticket" : "Create Ticket"}
                  </motion.button>
                  <motion.button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditing(null); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-xl font-semibold bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Ticket Modal (details + audit) */}
      <AnimatePresence>
        {viewTicket && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-start z-50 p-4 md:p-6 overflow-y-auto"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-[#1a1d21] via-[#1f2228] to-[#1a1d21] text-gray-100 rounded-2xl p-6 md:p-8 w-full max-w-4xl mt-8 mb-8 border border-gray-800/50 shadow-2xl"
              initial={{ scale: 0.9, y: 50 }} 
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                    Ticket Details
                  </h3>
                  <p className="text-gray-400 mt-1 font-mono text-sm">{viewTicket.ticketId}</p>
                </div>
                <motion.button 
                  onClick={() => setViewTicket(null)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Ticket Information Card */}
              <div className="bg-[#0d0f12]/50 rounded-xl p-6 border border-gray-800/50 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Customer</span>
                      <p className="text-gray-200 font-medium">{viewTicket.customerId?.name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Category</span>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {viewTicket.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Priority</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(viewTicket.priority)}`}>
                        {viewTicket.priority}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Status</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(viewTicket.status)}`}>
                        {viewTicket.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Assigned To</span>
                      {viewTicket.assignedTo?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {viewTicket.assignedTo.map(a => (
                            <span key={a._id} className="text-xs bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 text-indigo-300 px-2 py-1 rounded-lg">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm italic">Unassigned</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        SLA Deadline
                      </span>
                      <p className="text-gray-300 text-sm">
                        {viewTicket.slaDeadline ? new Date(viewTicket.slaDeadline).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800/50">
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Subject</span>
                  <p className="text-gray-200 font-medium text-lg">{viewTicket.subject}</p>
                </div>

                <div className="mt-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Description</span>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {viewTicket.description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* Audit Trail Section */}
              <div>
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiActivity className="w-5 h-5 text-purple-400" />
                  Audit Trail
                </h4>
                {viewTicket.audit?.length ? (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {viewTicket.audit.map((a, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-[#0d0f12] to-[#121417] border border-gray-800/50 hover:border-gray-700/50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            <span className="text-sm text-gray-400">
                              {new Date(a.at).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 capitalize w-fit">
                            {a.action}
                          </span>
                        </div>
                        
                        <div className="text-sm mb-2">
                          <span className="text-gray-500">By:</span>{" "}
                          <span className="text-emerald-400 font-medium">{a.byName || "—"}</span>
                        </div>
                        
                        {a.note && (
                          <div className="text-sm italic text-gray-400 bg-gray-800/30 rounded-lg p-2 mb-2">
                            &quot;{a.note}&quot;
                          </div>
                        )}
                        
                        {a.diff && Object.entries(a.diff).length > 0 && (
                          <div className="space-y-2 mt-3">
                            {Object.entries(a.diff).map(([k, v]) => (
                              <div key={k} className="text-sm bg-gray-800/30 rounded-lg p-2">
                                <span className="text-gray-400 font-medium capitalize">{k}:</span>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-red-400 line-through bg-red-500/10 px-2 py-0.5 rounded">
                                    {v.from || "—"}
                                  </span>
                                  <span className="text-gray-500">→</span>
                                  <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded font-medium">
                                    {v.to}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0d0f12]/50 rounded-xl p-8 border border-gray-800/50 text-center">
                    <FiActivity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No audit history available</p>
                  </div>
                )}
              </div>
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