import Company from "../models/Company.js";
import bcrypt from "bcryptjs";

export const registerCompany = async (req, res) => {
  try {
    const { companyName, businessEmail, managerName, password, industry, address, phone } = req.body;

    const existing = await Company.findOne({ businessEmail });
    if (existing) return res.status(400).json({ message: "Company already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Company.create({
      companyName,
      businessEmail,
      managerName,
      industry,
      address,
      phone,
      password: hashedPassword,
      approved: false
    });

    res.status(201).json({ message: "Company registered. Awaiting admin approval.", company });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
