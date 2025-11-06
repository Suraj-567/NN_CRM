import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
// --- ENHANCEMENT: Import icons
import { User, Mail, Lock, Loader2 } from "lucide-react";
// --- ENHANCEMENT: Import toast
import toast from "react-hot-toast";

export default function EmployeeLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // --- ENHANCEMENT: Removed custom toast state
  // --- ENHANCEMENT: Added loading state
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // --- ENHANCEMENT

    try {
      const { data } = await axios.post(
        "http://localhost:5001/api/auth/admin",
        { email, password }
      );

      if (data.role === "Employee") {
        localStorage.setItem("token", data.token);
        // --- ENHANCEMENT: Use toast
        toast.success("✅ Employee login successful!");
        setTimeout(() => navigate("/employee/dashboard"), 1000); // redirect after success
      } else {
        // --- ENHANCEMENT: Use toast
        toast.error("❌ Access denied: You are not an Employee.");
        setLoading(false); // --- ENHANCEMENT
      }
    } catch (err) {
      // --- ENHANCEMENT: Use toast
      toast.error(
        err.response?.data?.message || "❌ Login failed! Check credentials."
      );
      setLoading(false); // --- ENHANCEMENT
    }
  };

  // --- ENHANCEMENT: Removed custom toast useEffect

  return (
    <div className="flex fixed inset-0 items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white px-4">
      
      {/* --- ENHANCEMENT: Removed custom toast div */}

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl w-full max-w-md p-8 sm:p-10 transition-all duration-300"
      >
        {/* --- ENHANCEMENT: Title with icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-green-600/20 rounded-full mb-3">
            <User className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-100">
            Employee Login
          </h2>
          <p className="text-center text-sm text-gray-400 mt-2">
            Access your employee dashboard
          </p>
        </div>

        {/* --- ENHANCEMENT: Email with icon */}
        <div className="relative space-y-6">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Employee Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="border border-gray-700 w-full p-3 pl-11 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {/* --- ENHANCEMENT: Password with icon */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="border border-gray-700 w-full p-3 pl-11 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {/* --- ENHANCEMENT: Submit Button with loading state */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Login as Employee"
            )}
          </button>
        </div>

        {/* --- ENHANCEMENT: Footer link to /login */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400">Are you a Business Manager?</p>
          <Link
            to="/login"
            className="inline-block w-full sm:w-auto mt-3 px-6 py-2.5 rounded-lg font-medium text-white bg-gray-700/60 border border-gray-600 hover:bg-gray-700 transition-all duration-200"
          >
            Login Here
          </Link>
        </div>
      </form>
    </div>
  );
}