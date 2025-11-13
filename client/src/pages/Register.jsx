import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  Mail,
  User,
  Lock,
  Factory,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";

// --- FIX: Define InputField OUTSIDE the component
// It now takes 'value', 'onChange', and 'disabled' as props
const InputField = ({
  icon,
  name,
  type,
  placeholder,
  required = false,
  value,
  onChange,
  disabled,
}) => {
  const Icon = icon;
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="border border-gray-700 w-full p-3 pl-11 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
      />
    </div>
  );
};

export default function CompanyRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
  companyName: "",
  businessEmail: "",
  managerName: "",
  password: "",
  industry: "",
  address: "",
  phone: "",
  smtpUser: "",
  smtpPass: "",
  smtpHost: "",
  smtpPort: 587,
});


  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const promise = axios.post(
      "http://localhost:5001/api/company/register",
      formData
    );

    toast
      .promise(promise, {
        loading: "Submitting registration...",
        success: (res) => {
          setTimeout(() => navigate("/login"), 1500);
          return "✅ Registration successful! Waiting For Approval...";
        },
        error: (err) => {
          return "❌ " + (err.response?.data?.message || "Registration failed.");
        },
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // --- ENHANCEMENT: A reusable component for input fields
  // (This component is now defined ABOVE)

  return (
    // --- FIX: Changed `flex fixed inset-0` to `flex min-h-screen`
    // This allows the page to scroll if the content is too tall,
    // which `fixed inset-0` prevents.
    <div className="flex fixed inset-0 items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white p-4">
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl w-full max-w-3xl p-8 transition-all duration-300"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-600/20 rounded-full mb-3">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-100">
            Company Registration
          </h2>
          <p className="text-center text-sm text-gray-400 mt-2">
            Register your company to access CRM features
          </p>
        </div>

        {/* --- ENHANCEMENT: 3-Column Grid Layout --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* --- FIX: Pass 'value', 'onChange', and 'disabled' as props --- */}
          <InputField
            icon={Building2}
            name="companyName"
            type="text"
            placeholder="Company Name"
            required={true}
            value={formData.companyName}
            onChange={handleChange}
            disabled={loading}
          />
          <InputField
            icon={Mail}
            name="businessEmail"
            type="email"
            placeholder="Business Email"
            required={true}
            value={formData.businessEmail}
            onChange={handleChange}
            disabled={loading}
          />
          <InputField
            icon={User}
            name="managerName"
            type="text"
            placeholder="Business Manager Name"
            required={true}
            value={formData.managerName}
            onChange={handleChange}
            disabled={loading}
          />
          <InputField
            icon={Lock}
            name="password"
            type="password"
            placeholder="Password"
            required={true}
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
          <InputField
            icon={Factory}
            name="industry"
            type="text"
            placeholder="Industry"
            required={true}
            value={formData.industry}
            onChange={handleChange}
            disabled={loading}
          />
          <InputField
            icon={Phone}
            name="phone"
            type="text"
            placeholder="Contact Number"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />

          <InputField
  icon={Mail}
  name="smtpUser"
  type="email"
  placeholder="SMTP Email (Used for Sending Emails)"
  required={true}
  value={formData.smtpUser}
  onChange={handleChange}
  disabled={loading}
/>

<InputField
  icon={Lock}
  name="smtpPass"
  type="password"
  placeholder="SMTP Password (App Password)"
  required={true}
  value={formData.smtpPass}
  onChange={handleChange}
  disabled={loading}
/>

<InputField
  icon={Factory}
  name="smtpHost"
  type="text"
  placeholder="SMTP Host (e.g. smtp.gmail.com)"
  required={true}
  value={formData.smtpHost}
  onChange={handleChange}
  disabled={loading}
/>

<InputField
  icon={Phone}
  name="smtpPort"
  type="number"
  placeholder="SMTP Port (465 or 587)"
  required={true}
  value={formData.smtpPort}
  onChange={handleChange}
  disabled={loading}
/>


          {/* --- ENHANCEMENT: Full-width address field --- */}
          <div className="md:col-span-3">
            <InputField
              icon={MapPin}
              name="address"
              type="text"
              placeholder="Company Address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* --- ENHANCEMENT: Submit Button with loading state --- */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:shadow-md transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            "Register Company"
          )}
        </button>

        {/* --- ENHANCEMENT: Improved footer link --- */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-400">Already Registered?</p>
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