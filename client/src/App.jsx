import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CompanyRegister from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import BusinessLogin from "./pages/BusinessLogin";
import DashboardLayout from "./components/DashboardLayout";
import AddEmployee from "./pages/AddEmployee";
import Customers from "./pages/Customers";
import "./App.css";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import CRMApproval from "./pages/CRMApproval";
import ApprovedCompanies from "./pages/ApprovedCompanies";
import Tickets from "./pages/Tickets";
import CustomerTickets from "./pages/CustomerTickets";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

function App() {
  return (
    <Router>
      <div className="mt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<CompanyRegister />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/employee" element={<EmployeeLogin />} />
          <Route path="/login" element={<BusinessLogin />} />

          <Route path="/manager/dashboard" element={<DashboardLayout />}>
            <Route path="employees" element={<AddEmployee />} />
            <Route path="customers" element={<Customers />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="customer-tickets" element={<CustomerTickets />} />
          </Route>

          {/* ✅ Protected Admin Routes */}
          <Route
            path="/admin-layout"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<CRMApproval />} />
            <Route path="approved-companies" element={<ApprovedCompanies />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
