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
import EmployeeLayout from "./components/EmployeeLayout";
import EmployeeProtectedRoute from "./components/EmployeeProtectedRoute";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AssignedCustomers from "./pages/AssignedCustomers";
import AssignedTickets from "./pages/AssignedTickets";
import CRMDashboard from "./pages/CRMDashboard";
import CompanyProfile from "./pages/CompanyProfile";

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

          <Route path="/manager" element={<DashboardLayout />}>
            <Route path="employees" element={<AddEmployee />} />
            <Route path="customers" element={<Customers />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="customer-tickets" element={<CustomerTickets />} />
            <Route path="dashboard" element={<CRMDashboard />} />
            <Route path="dashboard/company-profile" element={<CompanyProfile />} />
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

          <Route path="/employee-layout" element={
  <EmployeeProtectedRoute>
    <EmployeeLayout />
  </EmployeeProtectedRoute>
}>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="customers" element={<AssignedCustomers />} />
            <Route path="tickets" element={<AssignedTickets />} />
</Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
