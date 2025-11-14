import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Save,
  AlertTriangle,
  Loader2, // For loading spinners
  Building,
} from "lucide-react";

// Reusable component for form sections
const FormSection = ({ title, children }) => (
  <div className="bg-neutral-800 p-6 md:p-8 rounded-xl border border-neutral-700 shadow-lg">
    <h2 className="text-2xl font-semibold text-gray-200 border-b border-neutral-700 pb-4 mb-6">
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
      {children}
    </div>
  </div>
);

// Reusable input field component
const InputField = ({
  id,
  label,
  value,
  onChange,
  name,
  type = "text",
  placeholder,
  span = "md:col-span-1", // Controls grid span
  as = "input",
}) => {
  const commonProps = {
    id,
    name,
    value: value || "",
    onChange,
    placeholder,
    className: `
      w-full p-3 bg-neutral-700 border border-neutral-600 rounded-lg text-gray-100
      placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
      transition-colors duration-200
    `,
  };

  return (
    <div className={span}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input {...commonProps} type={type} />
      )}
    </div>
  );
};

export default function CompanyProfile() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/company/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCompany(res.data))
      .catch(() => {
        console.error("Failed to load profile");
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Handler for top-level company fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for nested SMTP fields
  const handleSmtpChange = (e) => {
    const { name, value } = e.target;
    setCompany((prev) => ({
      ...prev,
      smtp: {
        ...(prev.smtp || {}), // Ensure smtp object exists
        [name]: value,
      },
    }));
  };

  const saveChanges = () => {
    setIsSaving(true);
    axios
      .put("http://localhost:5001/api/company/profile", company, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => toast.success("Company updated successfully"))
      .catch(() => toast.error("Update failed"))
      .finally(() => setIsSaving(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-gray-400">
        <Loader2 size={48} className="animate-spin mb-4" />
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-red-400 p-8">
        <AlertTriangle size={48} className="mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to Load Profile</h2>
        <p>Could not fetch company data. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Building className="text-indigo-400" size={36} />
          <h1 className="text-4xl font-bold text-gray-100">Company Profile</h1>
        </div>

        {/* General Company Info */}
        <FormSection title="Company Information">
          <InputField
            id="companyName"
            name="companyName"
            label="Company Name"
            value={company.companyName}
            onChange={handleChange}
            placeholder="Your Company Inc."
          />
          <InputField
            id="managerName"
            name="managerName"
            label="Manager Name"
            value={company.managerName}
            onChange={handleChange}
            placeholder="e.g. Jane Doe"
          />
          <InputField
            id="businessEmail"
            name="businessEmail"
            label="Business Email"
            type="email"
            value={company.businessEmail}
            onChange={handleChange}
            placeholder="contact@company.com"
          />
          <InputField
            id="phone"
            name="phone"
            label="Phone Number"
            type="tel"
            value={company.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
          />
          <InputField
            id="industry"
            name="industry"
            label="Industry"
            value={company.industry}
            onChange={handleChange}
            placeholder="e.g. Technology"
            span="md:col-span-2" // Spans full width on medium+
          />
          <InputField
            id="address"
            name="address"
            label="Address"
            value={company.address}
            onChange={handleChange}
            placeholder="123 Main St, Anytown, USA"
            as="textarea"
            span="md:col-span-2"
          />
        </FormSection>

        {/* SMTP Settings */}
        <FormSection title="Email (SMTP) Settings">
          <InputField
            id="smtpHost"
            name="host"
            label="SMTP Host"
            value={company.smtp?.host}
            onChange={handleSmtpChange}
            placeholder="smtp.example.com"
          />
          <InputField
            id="smtpPort"
            name="port"
            label="SMTP Port"
            type="number"
            value={company.smtp?.port}
            onChange={handleSmtpChange}
            placeholder="587"
          />
          <InputField
            id="smtpUser"
            name="user"
            label="SMTP Username"
            value={company.smtp?.user}
            onChange={handleSmtpChange}
            placeholder="your-username"
          />
          <InputField
            id="smtpPass"
            name="pass"
            label="SMTP Password"
            type="password"
            value={company.smtp?.pass}
            onChange={handleSmtpChange}
            placeholder="••••••••••••"
          />
          <InputField
            id="fromName"
            name="fromName"
            label="Sent From Name"
            value={company.smtp?.fromName}
            onChange={handleSmtpChange}
            placeholder="Your Company Name"
            span="md:col-span-2"
          />
        </FormSection>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className="
              px-6 py-3 bg-indigo-600 rounded-lg 
              flex items-center justify-center gap-2 text-white font-medium
              transition-all duration-300 ease-in-out
              shadow-lg hover:shadow-indigo-500/30
              hover:bg-indigo-700 hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
            "
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}