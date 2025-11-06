import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// --- ENHANCEMENT: Import icons for UI
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
// --- ENHANCEMENT: Import react-hot-toast
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // --- ENHANCEMENT: Add loading state for button
  const [loading, setLoading] = useState(false);
  
  // --- ENHANCEMENT: Removed custom toast state and useEffect

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // --- ENHANCEMENT

    try {
      const { data } = await axios.post("http://localhost:5001/api/auth/admin", {
        email,
        password,
      });

      if (data.role === "admin") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        // --- ENHANCEMENT: Use react-hot-toast
        toast.success("Admin login successful!");
        
        // Navigate after a short delay for the toast to be seen
        setTimeout(() => navigate("/admin-layout/dashboard"), 1000);
      } else {
        // --- ENHANCEMENT: Use react-hot-toast
        toast.error("Access denied: You are not an Admin.");
        setLoading(false); // --- ENHANCEMENT
      }
    } catch (err) {
      // --- ENHANCEMENT: Use react-hot-toast
      toast.error(err.response?.data?.message || "Login failed! Check credentials.");
      setLoading(false); // --- ENHANCEMENT
    }
  };

  return (
    <div className="flex fixed inset-0 items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white px-4">
      
      {/* --- ENHANCEMENT: Removed custom toast notification div */}

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="relative z-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6 transition-all duration-300"
      >
        {/* --- ENHANCEMENT: Title with icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-600/20 rounded-full mb-3">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-center text-white">
            Admin Login
          </h2>
          <p className="text-center text-sm text-gray-400 mt-2">
            Access your admin dashboard securely
          </p>
        </div>

        {/* --- ENHANCEMENT: Email Input with icon */}
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} // --- ENHANCEMENT
            className="border border-gray-700 w-full p-3 pl-11 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          />
        </div>

        {/* --- ENHANCEMENT: Password Input with icon */}
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // --- ENHANCEMENT
            className="border border-gray-700 w-full p-3 pl-11 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
          />
        </div>

        {/* --- ENHANCEMENT: Submit Button with loading state */}
        <button
          type="submit"
          disabled={loading} // --- ENHANCEMENT
          className="flex items-center justify-center w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            "Login as Admin"
          )}
        </button>
      </form>
    </div>
  );
}