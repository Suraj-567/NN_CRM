import { Navigate } from "react-router-dom";

export default function EmployeeProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "Employee") {
    return <Navigate to="/employee" replace />;
  }

  return children;
}
