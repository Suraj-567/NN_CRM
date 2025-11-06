import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
// FIX: Removed react-icons/fi imports and replaced with a local SVG Icon component 
// to prevent build errors.

// --- Local SVG Icon Component ---
const Icon = ({ name, className = "w-4 h-4" }) => {
  // Simple icon map using inline SVG
  switch (name) {
    case 'FiPlus': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
    case 'FiX': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
    case 'FiActivity': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'FiRefreshCcw': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020.354 7m-1.78-4.22a9 9 0 00-15.06 6.5M12 21l-4.5-4.5-4.5 4.5m-3-3h12a2 2 0 002-2v-4a2 2 0 00-2-2H9.354a8.001 8.001 0 00-2.352-2M21 12h-2v2a4 4 0 01-4 4H7a4 4 0 01-4-4v-2" /></svg>;
    case 'FiTrash2': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m-3 0h14" /></svg>;
    case 'FiClock': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'FiUsers': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h-4v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2H1M21 20h-2v-2a4 4 0 00-4-4v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M12 11V6a4 4 0 014-4h2a4 4 0 014 4v5M12 11h2a4 4 0 014 4v5" /></svg>;
    case 'FiMapPin': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    default: return null;
  }
};


// --- Utility Functions for Audit Trail Formatting ---
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// --- Status and State Styling Utility ---
const getStatusStyles = (status) => {
  if (status === "Converted") {
    return "bg-green-700/60 text-green-200 border-green-500/50";
  }
  return "bg-amber-700/60 text-amber-200 border-amber-500/50";
};

const getStateStyles = (isDeleted) => {
  if (isDeleted) {
    return "bg-gray-700/60 text-gray-400 border-gray-500/50";
  }
  return "bg-indigo-700/60 text-indigo-300 border-indigo-500/50";
};

// --- UI Components for Reusability and Clarity ---

// Custom Input Component (FIXED for typing)
const InputField = ({ field, form, handleChange }) => {
  const labelText = formatFieldName(field); // Reusing utility for cleaner label
  return (
    <div className="relative pt-4"> {/* Added pt-4 for label space */}
      <input
        id={field}
        name={field}
        value={form[field] || ''} // Ensure value is defined to control input
        onChange={handleChange}
        type={field.includes('email') ? 'email' : 'text'}
        className="peer w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg p-3 text-sm transition-colors placeholder-transparent focus:placeholder-gray-500"
        required={field === 'name' || field === 'email'}
        placeholder={labelText} // Use placeholder for the actual floating effect
      />
      <label
        htmlFor={field}
        className="absolute left-3 top-0 text-xs text-gray-400 
          peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 
          peer-focus:top-0 peer-focus:text-indigo-400 peer-focus:text-xs 
          transition-all bg-gray-900 px-1 pointer-events-none"
      >
        {labelText}
      </label>
    </div>
  );
};

// Custom Select Component (FIXED for multi-select)
const SelectField = ({ name, label, value, options, handleChange, multiple = false }) => (
  <div className="relative pt-4"> {/* Added pt-4 for label space */}
    <select
      id={name}
      name={name}
      onChange={handleChange}
      value={value} // This must be an array of IDs for multi-select
      multiple={multiple}
      className={`peer w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg p-3 text-sm transition-colors appearance-none cursor-pointer ${multiple ? 'h-32' : ''}`}
    >
      {!multiple && (
        <option value="" disabled className="text-gray-500">
          Select {label}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-gray-800 text-gray-200 p-2">
          {opt.label}
        </option>
      ))}
    </select>
    <label
      htmlFor={name}
      className="absolute left-3 top-0 text-xs text-gray-400 
        peer-focus:top-0 peer-focus:text-indigo-400 peer-focus:text-xs 
        transition-all bg-gray-900 px-1 pointer-events-none"
    >
      {label}
    </label>
    <div className="absolute right-3 top-[1.2rem] pointer-events-none">
      <Icon name="FiUsers" className="w-4 h-4 text-gray-500" />
    </div>
  </div>
);

export default function Customers() {
  const token = localStorage.getItem("token");
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    leadSource: "",
    assignedTo: [],
    status: "Lead",
  });

  const api = axios.create({
    baseURL: "http://localhost:5001/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      // Only include active employees for assignment
      const activeEmployees = res.data
        .filter((e) => e.status === "Active")
        .map((e) => ({ _id: e._id, name: e.name }));
      setEmployees(activeEmployees);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
  }, []);

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleChange = (e) => {
    const { name, value, multiple, options } = e.target;
    if (multiple) {
      // Multi-select logic: capture all selected option values (FIXED)
      const vals = Array.from(options)
        .filter((o) => o.selected)
        .map((o) => o.value);
      setForm({ ...form, [name]: vals });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      location: "",
      leadSource: "",
      assignedTo: [],
      status: "Lead",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await api.put(`/customers/${editing._id}`, form);
        showMsg(res.data.message);
      } else {
        const res = await api.post(`/customers`, form);
        showMsg(res.data.message);
      }
      setShowForm(false);
      setEditing(null);
      resetForm(); // Reset form state
      fetchCustomers();
    } catch (err) {
      showMsg(err.response?.data?.message || "Error saving customer");
    }
  };

  const handleDeleteOrRestore = async (c) => {
    try {
      const isDeleted = !!c.deletedAt;
      let res;
      if (!isDeleted) {
        res = await api.delete(`/customers/${c._id}`);
      } else {
        res = await api.put(`/customers/${c._id}/restore`);
      }
      showMsg(res.data.message);
      fetchCustomers();
    } catch (err) {
      showMsg(err.response?.data?.message || "Error updating state");
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      contactName: c.contactName,
      email: c.email,
      phone: c.phone,
      location: c.location,
      leadSource: c.leadSource,
      // Map assignedTo objects to their IDs for the select input
      assignedTo: (c.assignedTo || []).map((a) => a._id),
      status: c.status,
    });
    setShowForm(true);
  };

  // Memoized lists for selects
  const statusOptions = useMemo(() => [
    { value: "Lead", label: "Lead" },
    { value: "Converted", label: "Converted" },
  ], []);

  const employeeOptions = useMemo(() => 
    employees.map((e) => ({ value: e._id, label: e.name }))
  , [employees]);


  return (
    <div className="min-h-screen p-8 bg-[#0D0D18] text-gray-100 relative">
      {/* ✅ Success/Error Toast (Enhanced) */}
      <AnimatePresence>
        {msg && (
          <motion.div
            className="fixed top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-teal-600 text-gray-900 px-6 py-3 rounded-full shadow-2xl font-semibold text-sm z-50 border border-teal-300"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-700/50">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-300 to-pink-400 bg-clip-text text-transparent tracking-tight">
          Customer Management 🚀
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-6 py-2 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2"
        >
          <Icon name="FiPlus" className="w-5 h-5" /> **Add New Customer**
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-2xl overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-gray-300 text-xs uppercase bg-gray-800/70 border-b border-gray-700/50 rounded-t-lg">
            <tr>
              {[
                "Name",
                "Contact Info",
                "Phone",
                "Source",
                "Assigned Team",
                "Status",
                "State",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-3 font-bold bg-gradient-to-b from-gray-800 to-gray-800/50">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length ? (
              customers.map((c) => {
                const isDeleted = !!c.deletedAt;
                return (
                  <motion.tr
                    key={c._id}
                    className={`border-t border-gray-800/70 transition duration-150 ease-in-out ${
                      isDeleted
                        ? "bg-gray-900/30 text-gray-500 hover:bg-gray-900/50"
                        : "hover:bg-gray-800/40"
                    }`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <td className="p-3 font-semibold text-base">{c.name}</td>
                    <td className="p-3 text-gray-400 italic">
                      {c.contactName || c.email}
                    </td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3 text-cyan-400/80 font-medium">
                      {c.leadSource}
                    </td>
                    <td className="p-3 text-gray-300">
                      {/* Display assigned employee names */}
                      {c.assignedTo && c.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.assignedTo.map((a) => (
                            <span
                              key={a._id}
                              className="text-xs bg-indigo-600/50 px-2 py-0.5 rounded-full border border-indigo-400/50"
                            >
                              {a.name}
                            </span>
                          ))}
                          <span className="ml-1 text-xs text-gray-500">
                            ({c.assignedTo.length})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full border font-medium ${getStatusStyles(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full border font-medium ${getStateStyles(
                          isDeleted
                        )}`}
                      >
                        {isDeleted ? "Archived" : "Active"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 items-center">
                      <button
                        onClick={() => handleEdit(c)}
                        title="Edit Customer"
                        className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full transition-colors duration-200"
                      >
                        <span className="text-sm">✎</span>
                      </button>
                      <button
                        onClick={() => handleDeleteOrRestore(c)}
                        title={isDeleted ? "Restore Customer" : "Archive Customer"}
                        className={`p-2 rounded-full transition-colors duration-200 ${
                          isDeleted
                            ? "bg-green-600 hover:bg-green-500 text-white" // Green for Restore
                            : "bg-red-600 hover:bg-red-500 text-white" // Red for Archive
                        }`}
                      >
                        {isDeleted ? <Icon name="FiRefreshCcw" /> : <Icon name="FiTrash2" />}
                      </button>
                      <button
                        onClick={() => setSelectedAudit(c)}
                        title="View Audit Trail"
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors duration-200"
                      >
                        <Icon name="FiActivity" className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500 text-lg italic">
                  No customers found. Click "Add New Customer" to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Add/Edit Form Modal (Professional UI) --- */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 text-gray-100 rounded-3xl p-8 w-full max-w-xl border border-indigo-700 shadow-2xl shadow-indigo-900/50"
              initial={{ scale: 0.8, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -50 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h3 className="text-3xl font-extrabold bg-gradient-to-r from-pink-300 to-purple-400 bg-clip-text text-transparent">
                  {editing ? "Edit Customer Details" : "Create New Customer"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null); // Clear editing on close
                  }}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Icon name="FiX" className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Basic Info */}
                    {[
                      "name",
                      "contactName",
                      "email",
                      "phone",
                    ].map((field) => (
                      <InputField key={field} field={field} form={form} handleChange={handleChange} />
                    ))}
                    {/* Location/Source */}
                    {[
                      "location",
                      "leadSource",
                    ].map((field) => (
                      <InputField key={field} field={field} form={form} handleChange={handleChange} />
                    ))}
                </div>

                {/* Status Field */}
                <SelectField
                  name="status"
                  label="Customer Status"
                  value={form.status}
                  options={statusOptions}
                  handleChange={handleChange}
                />

                {/* AssignedTo Multi-Select */}
                <SelectField
                  name="assignedTo"
                  label="Assigned Team Members"
                  value={form.assignedTo}
                  options={employeeOptions}
                  handleChange={handleChange}
                  multiple
                />

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 py-3 rounded-xl font-bold text-white text-lg shadow-lg shadow-indigo-600/30 transition-all duration-300 transform hover:scale-[1.01] mt-6"
                >
                  {editing ? "Update Customer" : "Add Customer"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Audit Trail Modal (Clean, Ordered UI) --- */}
      <AnimatePresence>
        {selectedAudit && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAudit(null)}
          >
            <motion.div
              className="bg-gray-900 text-gray-100 rounded-3xl p-8 w-full max-w-3xl border border-fuchsia-700 shadow-2xl shadow-fuchsia-900/50"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -50 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <h3 className="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-300 to-pink-400 bg-clip-text text-transparent">
                  Audit Trail — {selectedAudit.name}
                </h3>
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Icon name="FiX" className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {selectedAudit.audit?.length ? (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-3">
                  {selectedAudit.audit.map((a, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-gray-800 border border-gray-700/50 shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Header Row */}
                      <div className="flex justify-between text-sm mb-2 border-b border-gray-700/30 pb-2">
                        <span className="flex items-center gap-2 text-indigo-400 font-bold capitalize">
                            <Icon name="FiActivity" className="w-4 h-4"/> **{a.action}**
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Icon name="FiClock" className="w-4 h-4"/> {formatDate(a.at)}
                        </span>
                      </div>

                      {/* Details */}
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="text-gray-500 font-medium">Action By:</span>{" "}
                        <span className="text-emerald-400 font-semibold">
                          {a.byName || "System/Unknown"}
                        </span>
                      </p>

                      {a.note && (
                        <p className="text-sm text-gray-500 mt-2 italic border-l-4 border-amber-500 pl-3">
                          **Note:** {a.note}
                        </p>
                      )}

                      {/* Diff/Changes Section */}
                      {a.diff && (
                        <div className="mt-3 space-y-1 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                          <p className="text-sm font-semibold text-gray-400 mb-2">Changes Made:</p>
                          {Object.entries(a.diff).map(([k, v]) => (
                            <div key={k} className="text-xs flex flex-wrap items-center">
                              <span className="text-gray-300 font-medium mr-2">
                                {formatFieldName(k)}:
                              </span>
                              <span className="text-red-400 line-through mr-2">
                                {v.from || "—"}
                              </span>
                              <span className="text-gray-500 mr-2">→</span>
                              <span className="text-green-400 font-semibold">
                                {v.to}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                    <Icon name="FiMapPin" className="w-10 h-10 mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 text-lg">No audit history recorded for this customer yet.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
