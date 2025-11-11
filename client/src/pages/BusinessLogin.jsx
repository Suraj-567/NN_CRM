import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
// --- ENHANCEMENT: Import icons for a better UI
import {
  Briefcase,
  Mail,
  Lock,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function BusinessLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // --- ENHANCEMENT: Add loading state for better UX
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // --- ENHANCEMENT: Set loading true
    setError(""); // --- ENHANCEMENT: Clear previous errors
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/manager/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false); // --- ENHANCEMENT: Set loading false
    }
  };

  return (
    // --- ENHANCEMENT: Consistent gradient background
    <div className="flex fixed inset-0 items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* --- ENHANCEMENT: Modern "glass" card */}
      <div className="w-full max-w-md rounded-2xl bg-gray-900/70 backdrop-blur-md border border-gray-700 shadow-2xl p-8">
        {/* --- ENHANCEMENT: Title with icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-600/20 rounded-full mb-3">
            <Briefcase className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-center text-white">
            Business Manager Login
          </h2>
        </div>

        {/* --- ENHANCEMENT: Error message with icon */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* --- ENHANCEMENT: Input with icon */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full p-3 pl-10 rounded-lg bg-gray-800 border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading} // --- ENHANCEMENT
            />
          </div>
          {/* --- ENHANCEMENT: Input with icon */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 pl-10 rounded-lg bg-gray-800 border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading} // --- ENHANCEMENT
            />
          </div>

          {/* --- ENHANCEMENT: Login button with loading state */}
          <button
            type="submit"
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading} // --- ENHANCEMENT
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* --- ENHANCEMENT: Visually improved links section */}
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
          <p className="text-center text-gray-400">
            Don&apos;t have an account?
          </p>
          <Link
            to="/register"
            className="block w-full text-center px-4 py-2.5 rounded-lg font-medium text-white bg-gray-700/60 border border-gray-600 hover:bg-gray-700 transition-all duration-200"
          >
            Register your company
          </Link>

          <Link
            to="/employee"
            className="block text-center text-blue-400 hover:text-blue-500 font-medium transition-all duration-200"
          >
            Are you an employee?
          </Link>
        </div>
      </div>
    </div>
  );
}