// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // contains { id }

    // 1) Try to match Employee login
    let account = await Employee.findById(decoded.id).select("name email companyId role");
    let role = "Employee";

    // 2) If not employee, match User/Admin login
    if (!account) {
      account = await User.findById(decoded.id).select("name email companyId role");
      role = account?.role || "user";
    }

    if (!account) return res.status(401).json({ message: "Invalid or removed user" });

    // ✅ Attach real usable info
    req.user = {
      id: account._id,
      name: account.name,
      email: account.email,
      companyId: account.companyId,
      role,
    };

    next();
  } catch (err) {
    console.error("verifyToken error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ensure a route is admin-only etc.
export const verifyRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  next();
};
