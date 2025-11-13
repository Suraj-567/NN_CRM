// client/src/pages/EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import toast from "react-hot-toast";
import {
  Users,
  TicketCheck,
  ClipboardList,
  CheckCircle,
  Loader2, // NEW
  Check, // NEW
  Trash2, // NEW
  Bell, // NEW
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // NEW

// NEW: Import the CSS file you just created
import '../calender.css'

// --- Re-usable Components (NEW) ---

function StatCard({ label, value, icon, colorClass }) {
  const Icon = icon;
  return (
    <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-gray-400 text-sm">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen w-full p-8 flex items-center justify-center text-gray-500">
      <Loader2 className="animate-spin mr-2" />
      Loading...
    </div>
  );
}

// --- Main Page Component ---

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]); // All tasks
  const [date, setDate] = useState(new Date());
  const [form, setForm] = useState({ title: "", note: "", time: "" });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // --- Data Fetching ---

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch stats and tasks in parallel
      await Promise.all([fetchStats(), loadTasks()]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { data } = await axios.get("http://localhost:5001/api/employees/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(data);
  };

const loadTasks = async () => {
  const { data } = await axios.get("http://localhost:5001/api/tasks", {
    headers: { Authorization: `Bearer ${token}` },
  });

  // sort ascending by dateTime
  const sortedData = data.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  setTasks(sortedData);
};


  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const addTask = async () => {
  if (!form.title || !form.time) return toast.error("Task title & time required");

  const dateTime = new Date(date);
  const [hStr, mStr] = form.time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  dateTime.setHours(h, m, 0, 0); // local time

  const taskPromise = axios.post(
    "http://localhost:5001/api/tasks",
    { title: form.title, note: form.note, dateTime },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  toast.promise(taskPromise, {
    loading: "Adding task...",
    success: async () => {
      setForm({ title: "", note: "", time: "" });
      await loadTasks(); // await refresh
      return "Task added successfully!";
    },
    error: (err) => err.response?.data?.message || "Failed to add task",
  });
};


const handleToggleComplete = async (task) => {
  try {
    await axios.put(
      `http://localhost:5001/api/tasks/${task._id}`,
      { completed: !task.completed },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await loadTasks(); // ensure updated list
    toast.success("Task updated!");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update task");
  }
};


const handleDeleteTask = async (id) => {
  if (!window.confirm("Are you sure you want to delete this task?")) return;
  try {
    await axios.delete(`http://localhost:5001/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadTasks();
    toast.success("Task deleted!");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to delete task");
  }
};


  // --- Memoized Values / Derived State (NEW) ---

  // Filter tasks into upcoming and completed
  const upcomingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Get the very next upcoming task for the banner
  const nextUpcomingTask = upcomingTasks[0]; // Since they are sorted


const taskDateSet = new Set(
  tasks.map((task) => {
    const dt = new Date(task.dateTime);
    // use locale "en-CA" because it yields yyyy-mm-dd reliably
    return dt.toLocaleDateString("en-CA");
  })
);

const renderTaskDot = ({ date, view }) => {
  if (view === "month") {
    const key = new Date(date).toLocaleDateString("en-CA");
    if (taskDateSet.has(key)) {
      return <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1"></div>;
    }
  }
  return null;
};

  if (loading || !stats) return <Loader />;

  // NEW: Updated Stat Cards
  const dashboardCards = [
    { label: "Assigned Customers", value: stats.totalCustomers, icon: Users, colorClass: "bg-blue-600/20 text-blue-400" },
    { label: "Assigned Tickets", value: stats.totalTickets, icon: ClipboardList, colorClass: "bg-yellow-600/20 text-yellow-400" },
    { label: "Resolved Tickets", value: stats.solvedTickets, icon: CheckCircle, colorClass: "bg-green-600/20 text-green-400" },
    { label: "Pending Tickets", value: stats.pendingTickets, icon: TicketCheck, colorClass: "bg-red-600/20 text-red-400" },
  ];

  return (
    <div className="text-white space-y-8 p-4 sm:p-8 pb-12">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
        Employee Dashboard
      </h1>

      {/* --- STATS CARDS (CHANGED) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <StatCard
            key={index}
            label={card.label}
            value={card.value}
            icon={card.icon}
            colorClass={card.colorClass}
          />
        ))}
      </div>

      {/* --- TASK REMINDER (CHANGED) --- */}
      <AnimatePresence>
        {nextUpcomingTask && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-gray-900/50 border border-green-800 rounded-xl flex items-center gap-4"
          >
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Bell size={20} />
            </div>
            <div>
              <strong className="text-indigo-300">Next Task:</strong> {nextUpcomingTask.title}
              <div className="text-gray-300 text-sm">
                {new Date(nextUpcomingTask.dateTime).toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CALENDAR + ADD TASK FORM --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar (CHANGED) */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-green-800 p-4 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-200 px-2">Task Calendar</h2>
          {/* The Calendar.css file will style this */}
          <Calendar
            value={date}
            onChange={setDate}
            tileContent={renderTaskDot} // NEW: Adds dots to dates
          />
        </div>

        {/* Task Add (CHANGED) */}
        <div className="bg-gray-900/50 p-5 rounded-xl space-y-4 border border-green-800 h-fit">
          <h3 className="text-lg font-semibold">
            Schedule Task for {date.toLocaleDateString()}
          </h3>

          <input
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            placeholder="Task Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            placeholder="Notes (optional)"
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <input
            type="time"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <button
            onClick={addTask}
            className="w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* --- TASK LIST (CHANGED) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-gray-900/50 border border-green-800 p-5 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((t) => (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700 flex items-center gap-2"
                >
                  <button
                    onClick={() => handleToggleComplete(t)}
                    className="p-2 text-gray-400 hover:text-green-400"
                    title="Mark as Done"
                  >
                    <Check size={16} />
                  </button>
                  <div className="flex-1">
                    <strong className="text-gray-100">{t.title}</strong>
                    <div className="text-xs text-gray-400">
                      {new Date(t.dateTime).toLocaleString()}
                    </div>
                    {t.note && <div className="text-gray-300 text-sm mt-1">{t.note}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteTask(t._id)}
                    className="p-2 text-gray-400 hover:text-red-400"
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500">No upcoming tasks.</p>
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gray-900/50 border border-green-800 p-5 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Completed Tasks</h2>
          <div className="space-y-3">
            {completedTasks.length > 0 ? (
              completedTasks.map((t) => (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex items-center gap-2 opacity-70"
                >
                  <button
                    onClick={() => handleToggleComplete(t)}
                    className="p-2 text-green-400"
                    title="Mark as Undone"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <div className="flex-1">
                    <strong className="text-gray-400 line-through">{t.title}</strong>
                    <div className="text-xs text-gray-500">
                      {new Date(t.dateTime).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(t._id)}
                    className="p-2 text-gray-500 hover:text-red-400"
                    title="Delete Task"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500">No completed tasks yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}