import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
// FIX: Using standard HTML/SVG elements as fallbacks for icons to resolve the build error.
// We will define the necessary icons here using SVG paths if a direct import fails.

const Icon = ({ name, className = "w-4 h-4" }) => {
  // Simple icon map using inline SVG or standard characters
  switch (name) {
    case 'FiPlus': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
    case 'FiUsers': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h-4v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2H1M21 20h-2v-2a4 4 0 00-4-4v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M12 11V6a4 4 0 014-4h2a4 4 0 014 4v5M12 11h2a4 4 0 014 4v5" /></svg>;
    case 'FiX': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
    case 'FiEdit2': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
    case 'FiPower': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v2m-6-6h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zM5 18h14a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>;
    case 'FiMail': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'FiLock': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h-6V7a3 3 0 016 0v2z" /></svg>;
    case 'FiBriefcase': return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6m18 0l-5-4-5 4m5-4V3" /></svg>;
    default: return null;
  }
};


// --- Helper Components for Professional Form UI ---

// Utility to format field names for labels
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

// Custom Input Component with Floating Label
const InputField = ({ field, form, handleChange, type = 'text', placeholder, isRequired = false }) => {
  const labelText = placeholder || formatFieldName(field);
  let iconName;
  if (field === 'email') iconName = 'FiMail';
  else if (field === 'password') iconName = 'FiLock';
  else iconName = 'FiBriefcase';

  return (
    <div className="relative pt-4">
      <input
        id={field}
        name={field}
        value={form[field] || ''}
        onChange={handleChange}
        type={type}
        className="peer w-full bg-gray-800/70 border border-gray-700 focus:border-indigo-500 rounded-lg p-3 text-sm transition-colors placeholder-transparent focus:placeholder-gray-500"
        required={isRequired}
        placeholder={labelText} 
      />
      <label
        htmlFor={field}
        className="absolute left-3 top-0 text-xs text-gray-400 
          peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 
          peer-focus:top-0 peer-focus:text-indigo-400 peer-focus:text-xs 
          transition-all bg-gray-900 px-1 pointer-events-none"
      >
        <span className="flex items-center gap-1">
            <Icon name={iconName} className="w-3 h-3"/> {labelText}
        </span>
      </label>
    </div>
  );
};

export default function AddEmployee() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "Technical" });
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const token = localStorage.getItem("token");

  // Department options reflecting the B2B/B2C structure
  const departmentOptions = useMemo(() => [
    { value: "Technical", label: "Technical" },
    { value: "Sales", label: "Sales (AE/SDR)" },
    { value: "Marketing", label: "Marketing (Content/Automation)" },
    { value: "Account Management", label: "Account Management (AM)" },
    { value: "Support", label: "Support (Agent)" },
  ], []);

  // Decode token for companyId (Backend/Auth related - kept simple)
  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setCompanyId(decoded.companyId);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, [token]);

  const fetchEmployees = async () => {
    if (!companyId) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    if (companyId) fetchEmployees();
  }, [companyId]);

  const showAlert = (msg) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        // Update existing employee
        const res = await axios.put(
          `http://localhost:5001/api/employees/${editingEmployee._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showAlert(res.data.message);
      } else {
        // Add new employee
        const res = await axios.post(
          "http://localhost:5001/api/employees",
          { ...form, companyId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showAlert(res.data.message);
      }

      setForm({ name: "", email: "", password: "", department: "Technical" });
      setShowForm(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      showAlert(err.response?.data?.message || "Error saving employee");
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({ 
        name: emp.name, 
        email: emp.email, 
        password: "", 
        department: emp.department 
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (emp) => {
    try {
      const res = await axios.patch(
        `http://localhost:5001/api/employees/${emp._id}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert(res.data.message);
      fetchEmployees();
    } catch (err) {
      showAlert("Error updating status");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#0D0D18] text-gray-100 relative">
      
      {/* ✅ Floating Message (Enhanced) */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl rounded-full border"
          >
            <div
              className={`px-6 py-3 rounded-full text-center font-semibold text-sm ${
                message.toLowerCase().includes("success") || message.toLowerCase().includes("added")
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-gray-900 border-emerald-300"
                  : "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-400"
              }`}
            >
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (Enhanced) */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700/50">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Employee Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            <Icon name="FiUsers" className="inline mr-1 w-4 h-4"/> Manage your team members and assign departments.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingEmployee(null);
            setForm({ name: "", email: "", password: "", department: "Technical" });
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 px-6 py-2.5 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02]"
        >
          <Icon name="FiPlus" className="w-5 h-5" /> **Add Employee**
        </button>
      </div>

      {/* Table (Enhanced) */}
      <div className="overflow-x-auto bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-2xl">
        <table className="min-w-full text-sm">
          <thead className="text-gray-200 text-xs uppercase tracking-wider">
            <tr>
              {[
                { label: "Name", color: "text-indigo-300" },
                { label: "Email", color: "text-cyan-300" },
                { label: "Department", color: "text-purple-300" },
                { label: "Tickets Handled", color: "text-blue-300" },
                { label: "Status", color: "text-emerald-300" },
                { label: "Joined", color: "text-pink-300" },
                { label: "Action", color: "text-orange-300" },
              ].map((h) => (
                <th 
                  key={h.label} 
                  className={`py-3 px-4 text-center font-bold ${h.color} bg-gradient-to-b from-gray-800 to-gray-800/50`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp) => {
                const isActive = emp.status === "Active";
                return (
                  <tr 
                    key={emp._id} 
                    className={`border-b border-gray-800/70 transition duration-150 hover:bg-gray-800/40 ${!isActive ? 'opacity-70 bg-gray-900/30' : ''}`}
                  >
                    <td className="py-3 text-center font-medium">{emp.name}</td>
                    <td className="py-3 text-center text-gray-400 italic">{emp.email}</td>
                    <td className="py-3 text-center text-purple-300/80 font-medium">{emp.department}</td>
                    <td className="py-3 text-center text-blue-400">{emp.ticketsHandled ?? 0}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isActive
                            ? "bg-emerald-700/50 text-emerald-300 border-emerald-500/50"
                            : "bg-red-700/50 text-red-300 border-red-500/50"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 text-center text-gray-500 text-xs">
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        title="Edit Employee"
                        className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full text-white transition-colors"
                      >
                        <Icon name="FiEdit2" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        title={isActive ? "Deactivate Employee" : "Activate Employee"}
                        className={`p-2 rounded-full text-white transition-colors ${
                          isActive
                            ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-800/30" // Red for Deactivate
                            : "bg-green-600 hover:bg-green-700 shadow-md shadow-green-800/30" // Green for Activate
                        }`}
                      >
                        <Icon name="FiPower" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-500 text-lg italic">
                  No employees yet. Use the "Add Employee" button to onboard a new team member.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL (Professional UI) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-indigo-700/50 w-full max-w-md"
              initial={{ scale: 0.8, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -50 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  {editingEmployee ? "Edit Employee Details" : "Add New Employee"}
                </h2>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Icon name="FiX" className="w-6 h-6 text-gray-400 hover:text-red-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField field="name" form={form} handleChange={handleChange} placeholder="Full Name" isRequired />
                <InputField field="email" form={form} handleChange={handleChange} type="email" placeholder="Email Address" isRequired />
                
                {/* Password field with dynamic placeholder */}
                <InputField
                    field="password"
                    form={form}
                    handleChange={handleChange}
                    type="password"
                    placeholder={
                        editingEmployee
                        ? "Password (leave blank to keep current)"
                        : "Temporary Password"
                    }
                    isRequired={!editingEmployee}
                />

                {/* Department Select (Enhanced) */}
                <div className="relative pt-4">
                    <select
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        className="peer w-full p-3 bg-gray-800/70 text-gray-200 rounded-lg border border-gray-700 appearance-none focus:border-cyan-500 cursor-pointer"
                    >
                        {departmentOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <label
                        htmlFor="department"
                        className="absolute left-3 top-0 text-xs text-gray-400 
                            peer-focus:top-0 peer-focus:text-cyan-400 peer-focus:text-xs 
                            transition-all bg-gray-900 px-1 pointer-events-none"
                    >
                        Department
                    </label>
                    <div className="absolute right-3 top-[1.2rem] pointer-events-none text-gray-400">
                        ▼
                    </div>
                </div>

                <div className="flex justify-between pt-6 gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    {editingEmployee ? "Save Changes" : "Save Employee"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl text-gray-300 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
