// server/controllers/authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// 🧍 Register user (for testing or admin only)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const user = await User.create({ name, email, password, role, companyId });
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🏢 Business Manager Login
export const loginBusinessManager = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "BusinessManager" });
    if (!user) return res.status(404).json({ message: "Business Manager not found" });
    
   if (user.status.toLowerCase() !== "active") {
  return res.status(403).json({ message: "Account not active or not approved yet" });
  }


    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Include companyId in JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    console.error("❌ Error during business login:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 👤 Generic user login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      companyId: user.companyId,
    });
  } catch (err) {
    console.error("❌ Error during user login:", err);
    res.status(500).json({ error: err.message });
  }
};
