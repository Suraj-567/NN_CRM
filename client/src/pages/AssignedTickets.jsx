// client/src/pages/AssignedTickets.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Mail as MailIcon,
  Phone as PhoneIcon,
  MessageSquare as SmsIcon,
  X as XIcon,
  Clock as ClockIcon,
  Loader2, // NEW
  Inbox, // NEW
  Ticket, // NEW
  User, // NEW
  ListChecks, // NEW
  Star, // NEW
  FileText, // NEW
  BookMarked, // NEW
} from "lucide-react";
// NEW: Imports for animation
import { AnimatePresence, motion } from "framer-motion";

/**
 * AssignedTickets.jsx
 * - Fetches tickets for the logged-in employee (token contains company & id).
 * - Shows ticket list and ticket detail modal.
 * - Allows status updates, sending email/sms/call, adding an internal note.
 * - Displays audit timeline (ticket.audit).
 */

// --- Re-usable Utility Components (NEW) ---

function PrettyDate({ iso }) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    <span title={d.toLocaleString()} className="text-xs text-gray-400">
      {d.toLocaleDateString()}
    </span>
  );
}

function Badge({ children, color = "bg-gray-700 text-white" }) {
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{children}</span>;
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
      <h3 className="text-xl font-semibold text-gray-400">No Tickets Found</h3>
      <p className="mt-1">There are no tickets assigned to you yet.</p>
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

function InfoRow({ label, icon, children }) {
  const Icon = icon;
  return (
    <div className="flex gap-3 items-start">
      <div className="w-24 text-gray-400 text-sm flex items-center gap-2">
        <Icon size={14} /> {label}
      </div>
      <div className="flex-1 text-gray-100">{children}</div>
    </div>
  );
}

// Priority/Status Colors (NEW)
const priorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "bg-red-800/70 text-red-200";
    case "Medium":
      return "bg-yellow-800/70 text-yellow-200";
    case "Low":
      return "bg-gray-800/70 text-gray-200";
    default:
      return "bg-gray-800/70 text-gray-200";
  }
};

const statusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-blue-800/70 text-blue-200";
    case "In Progress":
      return "bg-purple-800/70 text-purple-200";
    case "Resolved":
    case "Closed":
      return "bg-green-800/70 text-green-200";
    default:
      return "bg-gray-800/70 text-gray-200";
  }
};

// --- Main Page Component ---

export default function AssignedTickets() {
  const token = localStorage.getItem("token");
  const employeeId = localStorage.getItem("id") || (() => {
      try {
        const t = token && JSON.parse(atob(token.split(".")[1]));
        return t?.id;
      } catch {
        return null;
      }
    })();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // compose fields in modal
  const [activeTab, setActiveTab] = useState("email"); // NEW
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [smsText, setSmsText] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5001/api/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = res.data || [];
      const filtered = all.filter((t) =>
        Array.isArray(t.assignedTo) && t.assignedTo.some((a) => {
            if (!a) return false;
            if (typeof a === "string") return a === employeeId;
            if (typeof a === "object") return String(a._id || a.id || a) === String(employeeId);
            return false;
          })
      );
      setTickets(filtered);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NEW: Helper to refresh modal data without closing
  const refreshSelectedTicket = async () => {
    if (!selected) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/tickets/${selected._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelected(res.data); // Update in background
    } catch (err) {
      console.warn("Failed to auto-refresh ticket details", err);
    }
  };

  // open ticket detail (CHANGED: use toast.promise)
  const openTicket = async (ticket) => {
    const fetchPromise = axios.get(`http://localhost:5001/api/tickets/${ticket._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.promise(fetchPromise, {
      loading: `Loading ticket ${ticket.ticketId}...`,
      success: (res) => {
        setSelected(res.data);
        setShowModal(true);
        setNewStatus(res.data.status || "");
        setEmailForm({ subject: `Re: ${res.data.subject || res.data.ticketId}`, body: "" });
        setSmsText("");
        setInternalNote("");
        setActiveTab("email"); // Reset to first tab
        return `Opened ticket ${res.data.ticketId}`;
      },
      error: (err) => {
        console.error("Error loading ticket:", err);
        return "Unable to load ticket details";
      },
    });
  };

  // --- API Handlers (CHANGED to use toast.promise) ---

  const handleUpdateStatus = async () => {
    if (!selected) return;

    const updatePromise = axios.put(
      `http://localhost:5001/api/tickets/${selected._id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(updatePromise, {
      loading: "Updating status...",
      success: (res) => {
        setSelected(res.data.ticket);
        fetchTickets(); // Refresh list in background
        return "Status updated!";
      },
      error: (err) => {
        console.error("Error updating status:", err);
        return "Failed to update status";
      },
    });
  };

  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) return toast.error("Enter a note");

    const notePromise = axios.put(
      `http://localhost:5001/api/tickets/${selected._id}`,
      { meta: { internalNote: internalNote.trim() } },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(notePromise, {
      loading: "Saving note...",
      success: (res) => {
        setInternalNote("");
        setSelected(res.data.ticket); // Refresh modal
        return "Note saved!";
      },
      error: (err) => {
        console.error("Error adding note:", err);
        return "Failed to save note";
      },
    });
  };

  const handleSendEmail = async () => {
    if (!selected?.customerId?.email && !selected?.customer?.email) {
      return toast.error("Customer has no email");
    }
    const to = selected.customerId?.email || selected.customer?.email;

    const emailPromise = axios.post(
      "http://localhost:5001/api/notifications/email",
      {
        to,
        subject: emailForm.subject,
        html: emailForm.body,
        customerId: selected.customerId?._id || selected.customer?._id,
        ticketId: selected._id,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(emailPromise, {
      loading: "Sending email...",
      success: () => {
        setEmailForm({ ...emailForm, body: "" }); // Only clear body
        refreshSelectedTicket(); // Refresh modal
        return "Email sent!";
      },
      error: (err) => err.response?.data?.message || "Failed to send email",
    });
  };

  const handleSendSms = async () => {
    const phone = selected.customerId?.phone || selected.customer?.phone;
    if (!phone) return toast.error("Customer has no phone");
    if (!smsText.trim()) return toast.error("Write an SMS message first");

    const logPromise = axios.post(
      `http://localhost:5001/api/customers/${selected.customerId?._id || selected.customer?._id}/engagement`,
      { at: new Date(), summary: `SMS Sent: ${smsText}`, type: "sms", ticketId: selected._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(logPromise, {
      loading: "Logging SMS...",
      success: () => {
        const encoded = encodeURIComponent(smsText);
        setSmsText("");
        refreshSelectedTicket();
        window.location.href = `sms:${phone}?body=${encoded}`;
        return "SMS logged! Opening app...";
      },
      error: (err) => err.response?.data?.message || "Failed to log SMS",
    });
  };

  const handleCall = async () => {
    const phone = selected.customerId?.phone || selected.customer?.phone;
    if (!phone) return toast.error("Customer has no phone");

    const logPromise = axios.post(
      `http://localhost:5001/api/customers/${selected.customerId?._id || selected.customer?._id}/engagement`,
      { at: new Date(), summary: `Call placed`, type: "call", ticketId: selected._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.promise(logPromise, {
      loading: "Logging call...",
      success: () => {
        refreshSelectedTicket();
        window.location.href = `tel:${phone}`;
        return "Call logged!";
      },
      error: (err) => err.response?.data?.message || "Failed to log call",
    });
  };

  // --- Render helpers ---
  const statusOptions = ["Open", "In Progress", "Resolved"];

  // NEW: Stats for dashboard
  const totalOpen = tickets.filter((t) => t.status === "Open" || t.status === "In Progress").length;
  const totalClosed = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const highPriority = tickets.filter((t) => t.priority === "High" && (t.status === "Open" || t.status === "In Progress")).length;

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-[#0D0D18] text-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-200">
          Assigned Tickets
        </h1>
        <button
          onClick={fetchTickets}
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
            <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400">
              <ListChecks size={20} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Open Tickets</div>
              <div className="text-2xl font-bold">{totalOpen}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 rounded-lg text-red-400">
              <Star size={20} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">High Priority (Open)</div>
              <div className="text-2xl font-bold">{highPriority}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg text-green-400">
              <Ticket size={20} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Closed Today</div>
              <div className="text-2xl font-bold">{totalClosed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TICKETS TABLE --- */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-800/70 text-xs text-gray-400 uppercase">
            <tr>
              <th className="p-3 text-center">Ticket</th>
              <th className="p-3 text-center hidden sm:table-cell">Customer</th>
              <th className="p-3 text-center">Subject</th>
              <th className="p-3 text-center hidden md:table-cell">Priority</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <Loader />
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t._id} className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">{t.ticketId}</div>
                    <PrettyDate iso={t.createdAt} />
                  </td>
                  <td className="p-3 hidden sm:table-cell">{t.customerId?.name || t.customerId}</td>
                  <td className="p-3">{t.subject}</td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge color={priorityColor(t.priority)}>{t.priority}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge color={statusColor(t.status)}>{t.status}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openTicket(t)}
                        className="px-3 py-1 rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 text-sm transition-all hover:scale-105"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
              className="relative w-full max-w-5xl bg-[#11111f] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
            >
              {/* header */}
              <div className="flex items-start justify-between p-5 border-b border-gray-800 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{selected.ticketId}</h2>
                    <span className="text-lg text-gray-400">{selected.subject}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {selected.customerId?.name} — {selected.customerId?.contactName || ""}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-sm p-2 rounded-lg"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                  >
                    Update
                  </button>
                  <button onClick={() => { setShowModal(false); setSelected(null); }} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                    <XIcon size={16} />
                  </button>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* left column: ticket + customer + audit (col-span-1) */}
                <div className="col-span-1 border-r-0 lg:border-r border-gray-800 p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-indigo-300">Ticket Details</h3>
                    <div className="space-y-3 text-sm">
                      <InfoRow label="Description" icon={FileText}>
                        {selected.description || "No description."}
                      </InfoRow>
                      <InfoRow label="Category" icon={BookMarked}>
                        {selected.category}
                      </InfoRow>
                      <InfoRow label="Priority" icon={Star}>
                        {selected.priority}
                      </InfoRow>
                      <InfoRow label="SLA" icon={ClockIcon}>
                        {selected.slaDeadline ? new Date(selected.slaDeadline).toLocaleString() : "—"}
                      </InfoRow>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-indigo-300">Customer Details</h3>
                    <div className="space-y-3 text-sm">
                      <InfoRow label="Name" icon={User}>
                        {selected.customerId?.name}
                      </InfoRow>
                      <InfoRow label="Email" icon={MailIcon}>
                        <a className="text-indigo-300" href={`mailto:${selected.customerId?.email}`}>
                          {selected.customerId?.email || "—"}
                        </a>
                      </InfoRow>
                      <InfoRow label="Phone" icon={PhoneIcon}>
                        <a className="text-green-300" href={`tel:${selected.customerId?.phone}`}>
                          {selected.customerId?.phone || "—"}
                        </a>
                      </InfoRow>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-indigo-300 flex items-center gap-2">
                      <ClockIcon size={16} /> Audit Timeline
                    </h3>
                    {Array.isArray(selected.audit) && selected.audit.length > 0 ? (
                      <ul className="space-y-3 text-sm max-h-60 overflow-y-auto pr-2">
                        {selected.audit
                          .slice()
                          .reverse()
                          .map((a, i) => (
                            <li key={i} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                              <div className="flex justify-between">
                                <div className="text-sm font-medium">{a.action}</div>
                                <PrettyDate iso={a.at} />
                              </div>
                              <div className="text-xs text-gray-400 mt-1">{a.note}</div>
                              {a.byName && <div className="text-xs text-gray-500 mt-2">By: {a.byName}</div>}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 text-sm">No audit entries yet.</div>
                    )}
                  </div>
                </div>

                {/* right column: actions (Email / SMS / Log) (col-span-2) */}
                <div className="col-span-1 lg:col-span-2 p-6 max-h-[80vh] overflow-y-auto">
                  {/* --- TABS (NEW) --- */}
                  <div className="flex border-b border-gray-800 mb-4">
                    <TabButton isActive={activeTab === "email"} onClick={() => setActiveTab("email")}>
                      <MailIcon size={14} className="inline mr-2" /> Email
                    </TabButton>
                    <TabButton isActive={activeTab === "sms"} onClick={() => setActiveTab("sms")}>
                      <SmsIcon size={14} className="inline mr-2" /> SMS / Call
                    </TabButton>
                    <TabButton isActive={activeTab === "note"} onClick={() => setActiveTab("note")}>
                      <FileText size={14} className="inline mr-2" /> Internal Note
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
                            placeholder="Message..."
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                          />
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={handleSendEmail}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-all duration-200 flex items-center gap-2"
                            >
                              <MailIcon size={14} /> Send Email
                            </button>
                            <div className="ml-auto text-xs text-gray-400">Emails are sent from company account</div>
                          </div>
                        </div>
                      )}

                      {/* SMS / Call Panel */}
                      {activeTab === "sms" && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Send SMS</h3>
                          <textarea
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                            rows={5}
                            placeholder="SMS message..."
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                          />
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={handleSendSms}
                              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-all duration-200 flex items-center gap-2"
                            >
                              <SmsIcon size={14} /> Send SMS
                            </button>
                            <div className="ml-auto text-xs text-gray-400">This will open your default SMS app.</div>
                          </div>
                          
                          <hr className="border-gray-700" />
                          
                          <h3 className="text-lg font-semibold">Place Call</h3>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={handleCall}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-all duration-200 flex items-center gap-2"
                            >
                              <PhoneIcon size={14} /> Call {selected.customerId?.phone || ""}
                            </button>
                            <div className="ml-auto text-xs text-gray-400">This will open your default Phone app.</div>
                          </div>
                        </div>
                      )}

                      {/* Internal Note Panel */}
                      {activeTab === "note" && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">Add Internal Note</h3>
                          <textarea
                            value={internalNote}
                            onChange={(e) => setInternalNote(e.target.value)}
                            rows={5}
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                            placeholder="Write a short internal note (will be saved to ticket audit)..."
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setInternalNote("")} className="px-3 py-2 bg-gray-700 rounded-lg">
                              Reset
                            </button>
                            <button
                              onClick={handleAddInternalNote}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
                            >
                              Save Note
                            </button>
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