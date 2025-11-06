import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, Building2, ThumbsUp, XCircle } from "lucide-react";

export default function CRMApproval() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      const { data } = await axios.get("http://localhost:5001/api/admin/pending-companies");
      setCompanies(data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  const handleApproval = async (companyId, status) => {
    try {
      await axios.post(`http://localhost:5001/api/admin/approve-company/${companyId}`, { status });
      fetchPendingCompanies();
      alert(`Company ${status} successfully`);
    } catch (err) {
      alert("Error updating company status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-gray-100 p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-500/20 rounded-full">
            <ShieldCheck className="text-blue-400 w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            CRM Company Approvals
          </h1>
        </div>
        <div className="text-sm text-gray-400">
          <span>{companies.length}</span> companies pending approval
        </div>
      </div>

      {/* Content */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <Building2 className="w-16 h-16 mb-4 text-gray-500" />
          <p className="text-lg">No pending companies for approval.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl">
          <table className="min-w-full text-left text-gray-200">
            <thead className="bg-gradient-to-r from-blue-600/80 to-blue-800/80 text-white">
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
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide text-center">
                  Status
                </th>
                <th className="px-5 py-4 text-sm uppercase font-semibold tracking-wide text-center">
                  Actions
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
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-medium ${
                        company.approved
                          ? "bg-green-500/20 text-green-400 border border-green-400/20"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-300/20"
                      }`}
                    >
                      {company.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center space-x-3">
                    <button
                      onClick={() => handleApproval(company._id, "approved")}
                      className="inline-flex items-center px-4 py-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-green-500/20 transition-all duration-300"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(company._id, "rejected")}
                      className="inline-flex items-center px-4 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </button>
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
