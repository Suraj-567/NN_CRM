import { useEffect, useState } from "react";
import axios from "axios";
import { Building2, CheckCircle } from "lucide-react";

export default function ApprovedCompanies() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchApprovedCompanies();
  }, []);

  const fetchApprovedCompanies = async () => {
    try {
      const { data } = await axios.get("http://localhost:5001/api/admin/approved-companies");
      setCompanies(data);
    } catch (err) {
      console.error("Error fetching approved companies:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-gray-100 p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-500/20 rounded-full">
            <CheckCircle className="text-green-400 w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Approved Companies
          </h1>
        </div>
        <div className="text-sm text-gray-400">
          <span>{companies.length}</span> companies approved
        </div>
      </div>

      {/* Content */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <Building2 className="w-16 h-16 mb-4 text-gray-500" />
          <p className="text-lg">No companies have been approved yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
          <table className="min-w-full text-left text-gray-200">
            <thead className="bg-gradient-to-r from-blue-600/70 to-blue-800/80 text-white">
              <tr>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Company Name
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Business Email
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Manager
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Industry
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Address
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Phone
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Registered
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide">
                  Approved
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide text-center">
                  Employees
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr
                  key={company._id}
                  className={`transition-all duration-300 ${
                    index % 2 === 0
                      ? "bg-white/5 hover:bg-white/15"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-white">
                    {company.companyName}
                  </td>
                  <td className="px-5 py-3 text-gray-300">{company.businessEmail}</td>
                  <td className="px-5 py-3 text-gray-300">{company.managerName}</td>
                  <td className="px-5 py-3 text-gray-300">{company.industry}</td>
                  <td className="px-5 py-3 text-gray-400">{company.address || "—"}</td>
                  <td className="px-5 py-3 text-gray-400">{company.phone || "—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {new Date(company.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-green-400">
                    {company.employeeCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
