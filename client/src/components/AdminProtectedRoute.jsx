import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If not logged in or not admin, redirect
  if (!token || role !== "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
