// client/src/pages/AssignedCustomers.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  X,
  User,
  Loader2, // NEW: For loading spinner
  Users,
  BarChart,
  Target,
  Inbox, // NEW: For empty state
} from "lucide-react";
// NEW: Imports for animation
import { AnimatePresence, motion } from "framer-motion";

// --- Re-usable Utility Components (NEW) ---

function InfoRow({ label, icon, children }) {
  const Icon = icon;
  return (
    <div className="flex gap-3 items-start">
      <div className="w-28 text-gray-400 text-sm flex items-center gap-2">
        <Icon size={14} /> {label}
      </div>
      <div className="flex-1 text-gray-100">{children}</div>
    </div>
  );
}

function Loader() {
  return (
    <div className="w-full p-8 flex items-center justify-center text-gray-500">
      <Loader2 className="animate-spin mr-2" />
      Loading...
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full p-16 flex flex-col items-center justify-center text-center text-gray-500">
      <Inbox size={48} className="mb-4" />
      <h3 className="text-xl font-semibold text-gray-400">No Customers Found</h3>
      <p className="mt-1">There are no customers assigned to you yet.</p>
    </div>
  );
}

function TabButton({ children, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-md font-medium text-sm transition-colors ${
        isActive ? "text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-indigo-500"
        />
      )}
    </button>
  );
}

// --- Main Page Component ---

export default function AssignedCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // customer object
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem("token");

  // MODAL STATE (CHANGED)
  const [activeTab, setActiveTab] = useState("email"); // 'email', 'sms', 'log'
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [smsText, setSmsText] = useState("");
  const [engagementNote, setEngagementNote] = useState("");
  const [engagementWhen, setEngagementWhen] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5001/api/customers/assigned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching assigned customers:", err);
      toast.error("Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomer = async (c) => {
    // fetch full customer details (including engagementHistory)
    // CHANGED: Use toast.promise for loading feedback
    const fetchPromise = axios.get(`http://localhost:5001/api/customers/${c._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.promise(fetchPromise, {
      loading: `Fetching ${c.name}...`,
      success: (res) => {
        setSelected(res.data);
        setShowModal(true);
        // reset forms
        setEmailForm({ subject: `Regarding ${res.data.name}`, body: "" });
        setSmsText("");
        setEngagementNote("");
        setEngagementWhen("");
        setActiveTab("email"); // Reset to first tab
        return `Loaded ${res.data.name}`;
      },
      error: (err) => {
        console.error("Error loading customer:", err);
        return "Unable to fetch customer details";
      },
    });
  };

  // --- API Handlers (CHANGED to use toast.promise) ---

  const refreshSelectedCustomer = async () => {
    if (!selected) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/customers/${selected._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelected(res.data); // Update in background
    } catch (err) {
      console.error("Failed to auto-refresh customer details", err);
    }
  };

  const handleSendEmail = async () => {
    if (!selected?.email) return toast.error("Customer has no email");
    if (!emailForm.subject || !emailForm.body) {
      return toast.error("Subject and body are required");
    }

    const emailPromise = axios.post(
      "http://localhost:5001/api/notifications/email",
      {
        to: selected.email,
        subject: emailForm.subject,
        html: emailForm.body,
        customerId: selected._id,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(emailPromise, {
      loading: "Sending email...",
      success: () => {
        setEmailForm({ ...emailForm, body: "" }); // Only clear body
        refreshSelectedCustomer(); // Refresh engagement in background
        return "Email sent successfully!";
      },
      error: (err) => err.response?.data?.message || "Failed to send email",
    });
  };

  const handleSendSms = async () => {
    if (!selected?.phone) return toast.error("Customer has no phone number");
    if (!smsText.trim()) return toast.error("Write a message first");

    // We only log the *intent* to send SMS, as the `sms:` protocol is a handoff
    const logPromise = axios.post(
      `http://localhost:5001/api/customers/${selected._id}/engagement`,
      { at: new Date(), summary: `SMS Sent: ${smsText}`, type: "sms" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(logPromise, {
      loading: "Logging SMS...",
      success: () => {
        refreshSelectedCustomer();
        const encoded = encodeURIComponent(smsText);
        setSmsText(""); // reset
        window.location.href = `sms:${selected.phone}?body=${encoded}`;
        return "SMS logged! Opening messaging app...";
      },
      error: (err) => err.response?.data?.message || "Failed to log SMS",
    });
  };

  const handleCallLog = async () => {
    // This just logs the call. The actual call is made by the <a> tag's tel: href
    const logPromise = axios.post(
      `http://localhost:5001/api/customers/${selected._id}/engagement`,
      { at: new Date(), summary: `Call Placed`, type: "call" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(logPromise, {
      loading: "Logging call...",
      success: () => {
        refreshSelectedCustomer();
        return "Call logged!";
      },
      error: (err) => err.response?.data?.message || "Failed to log call",
    });
  };

  const handleAddEngagement = async () => {
    if (!engagementNote || !engagementWhen) {
      return toast.error("Date & note are required");
    }

    const addPromise = axios.post(
      `http://localhost:5001/api/customers/${selected._id}/engagement`,
      { at: engagementWhen, summary: engagementNote, type: "note" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(addPromise, {
      loading: "Saving engagement...",
      success: () => {
        setEngagementNote("");
        setEngagementWhen("");
        refreshSelectedCustomer();
        return "Engagement saved!";
      },
      error: (err) => err.response?.data?.message || "Failed to add engagement",
    });
  };

  // --- FAKE STATS DATA (NEW) ---
  // Replace with real data from an API if you have it
  const totalLeads = customers.filter((c) => c.status === "Lead").length;
  const totalCustomers = customers.length;
  const newThisWeek = customers.length; // You'd need a real query for this

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-[#0D0D18] text-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-200">
          Assigned Customers
        </h1>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Refresh"}
        </button>
      </div>

      {/* --- STATS BAR (NEW) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 rounded-lg text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Total Customers</div>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400">
              <Target size={20} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Active Leads</div>
              <div className="text-2xl font-bold">{totalLeads}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg text-green-400">
              <BarChart size={20} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">New This Week</div>
              <div className="text-2xl font-bold">{newThisWeek}</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CUSTOMER TABLE --- */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-800/70 sticky top-0">
              <tr>
                <th className="text-center p-3 text-xs text-gray-400 uppercase">Customer</th>
                <th className="text-center p-3 text-xs text-gray-400 uppercase hidden sm:table-cell">Contact</th>
                <th className="text-center p-3 text-xs text-gray-400 uppercase">Email</th>
                <th className="text-center p-3 text-xs text-gray-400 uppercase hidden md:table-cell">Phone</th>
                <th className="text-center p-3 text-xs text-gray-400 uppercase">Status</th>
                <th className="p-3 text-xs text-gray-400 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <Loader />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.location || "—"}</div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">{c.contactName || "—"}</td>
                    <td className="p-3">
                      <div className="text-sm break-all">{c.email || "—"}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell">{c.phone || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          c.status === "Lead"
                            ? "bg-blue-800/70 text-blue-200"
                            : "bg-green-800/70 text-green-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openCustomer(c)}
                          className="px-3 py-1 rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 text-sm transition-all hover:scale-105"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (CHANGED) --- */}
      <AnimatePresence>
        {showModal && selected && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 30, stiffness: 500 }}
              className="relative w-full max-w-4xl bg-[#11111f] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
            >
              {/* header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900/60">
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <div className="text-sm text-gray-400">{selected.contactName || "—"}</div>
                </div>
                      
                <div className="flex items-center gap-3">
                  {/* ⭐ Loyalty Points Badge */}
                  <div className="flex items-center gap-2 bg-indigo-700/20 px-4 py-2 rounded-xl border border-indigo-600/40">
                    <span className="text-sm text-gray-300">Loyalty</span>
                    <input
                      type="number"
                      min="0"
                      value={selected.loyaltyPoints ?? 0}
                      onChange={(e) =>
                        setSelected({ ...selected, loyaltyPoints: Number(e.target.value) })
                      }
                      className="w-16 text-center bg-transparent border border-indigo-700/50 rounded-md text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={async () => {
                        const updatePromise = axios.put(
                          `http://localhost:5001/api/customers/${selected._id}`,
                          { loyaltyPoints: selected.loyaltyPoints },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.promise(updatePromise, {
                          loading: "Updating...",
                          success: "Points updated!",
                          error: "Failed to update points",
                        });
                      }}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md transition-all"
                    >
                      Save
                    </button>
                  </div>
                    
                  {/* Call + Close Buttons */}
                  <a
                    href={`tel:${selected.phone}`}
                    onClick={handleCallLog}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-transform hover:scale-105"
                  >
                    <Phone size={16} /> Call
                  </a>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>


              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* left: details & history (col-span-1) */}
                <div className="col-span-1 border-r-0 lg:border-r border-gray-800 p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-indigo-300">Contact Details</h3>
                    <div className="space-y-3">
                      <InfoRow label="Email" icon={Mail}>
                        <a className="text-sm text-indigo-300 break-all" href={`mailto:${selected.email}`}>
                          {selected.email || "—"}
                        </a>
                      </InfoRow>
                      <InfoRow label="Phone" icon={Phone}>
                        <a className="text-sm text-green-300" href={`tel:${selected.phone}`}>
                          {selected.phone || "—"}
                        </a>
                      </InfoRow>
                      <InfoRow label="Contact" icon={User}>
                        {selected.contactName || "—"}
                      </InfoRow>
                      <InfoRow label="Status" icon={Target}>
                        {selected.status}
                      </InfoRow>
                    </div>
                    
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-indigo-300 flex items-center gap-2">
                      <Calendar size={16} /> Recent Engagements
                    </h3>
                    {Array.isArray(selected.engagementHistory) && selected.engagementHistory.length > 0 ? (
                      <ul className="space-y-3 text-sm max-h-60 overflow-y-auto pr-2">
                        {selected.engagementHistory
                          .slice()
                          .reverse()
                          .map((e, i) => (
                            <li key={i} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                              <div className="text-xs text-gray-400 mb-1 flex justify-between">
                                <span>{new Date(e.at).toLocaleString()}</span>
                                <span className="uppercase font-bold text-indigo-400">{e.type}</span>
                              </div>
                              <div className="mt-1">{e.summary}</div>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No engagements yet</div>
                    )}
                  </div>
                </div>

                {/* right: Actions (Email / SMS / Log) (col-span-2) */}
                <div className="col-span-1 lg:col-span-2 p-6 max-h-[80vh] overflow-y-auto">
                  {/* --- TABS (NEW) --- */}
                  <div className="flex border-b border-gray-800 mb-4">
                    <TabButton isActive={activeTab === "email"} onClick={() => setActiveTab("email")}>
                      <Mail size={14} className="inline mr-2" /> Email
                    </TabButton>
                    <TabButton isActive={activeTab === "sms"} onClick={() => setActiveTab("sms")}>
                      <MessageSquare size={14} className="inline mr-2" /> SMS
                    </TabButton>
                    <TabButton isActive={activeTab === "log"} onClick={() => setActiveTab("log")}>
                      <Calendar size={14} className="inline mr-2" /> Log Engagement
                    </TabButton>
                  </div>

                  {/* --- TAB PANELS (NEW) --- */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Email Panel */}
                      {activeTab === "email" && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">Compose Email</h3>
                          <input
                            value={emailForm.subject}
                            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                            placeholder="Subject"
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                          />
                          <textarea
                            value={emailForm.body}
                            onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                            rows={8}
                            placeholder="Write your message..."
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                          />
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={handleSendEmail}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-all duration-200"
                            >
                              <Mail size={14} className="inline mr-2" /> Send Email
                            </button>
                            <div className="ml-auto text-xs text-gray-400">Emails are sent from your company account</div>
                          </div>
                        </div>
                      )}

                      {/* SMS Panel */}
                      {activeTab === "sms" && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">Send SMS</h3>
                          <textarea
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                            rows={5}
                            placeholder="SMS message (max 320 chars)"
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                          />
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={handleSendSms}
                              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-all duration-200"
                            >
                              <MessageSquare size={14} className="inline mr-2" /> Send SMS
                            </button>
                            <div className="ml-auto text-xs text-gray-400">This will open your default SMS app.</div>
                          </div>
                        </div>
                      )}

                      {/* Log Engagement Panel */}
                      {activeTab === "log" && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">Log Engagement (Call / Meeting)</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="datetime-local"
                              value={engagementWhen}
                              onChange={(e) => setEngagementWhen(e.target.value)}
                              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
                            />
                            <input
                              placeholder="Short note (e.g., 'Left voicemail')"
                              value={engagementNote}
                              onChange={(e) => setEngagementNote(e.target.value)}
                              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={handleAddEngagement}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-all duration-200"
                            >
                              Save Engagement
                            </button>
                            <div className="ml-auto text-xs text-gray-400">Engagements will appear in history</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}