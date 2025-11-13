import Company from "../models/Company.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import Ticket from "../models/Ticket.js";
import bcrypt from "bcryptjs";

// === YOUR EXISTING FUNCTION (unchanged) ===
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
      approved: false,
      smtp: {
        host: req.body.smtpHost,
        port: req.body.smtpPort,
        user: req.body.smtpUser,
        pass: req.body.smtpPass,
        fromName: companyName
      }
    });

    res.status(201).json({ message: "Company registered. Awaiting admin approval.", company });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// === NEW 1: Company Dashboard Stats ===
export const getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [totalCustomers, totalEmployees, totalTickets, resolvedTickets] = await Promise.all([
      Customer.countDocuments({ companyId }),
      Employee.countDocuments({ companyId }),
      Ticket.countDocuments({ companyId }),
      Ticket.countDocuments({ companyId, status: { $in: ["Resolved", "Closed"] } })
    ]);

    res.json({
      totalCustomers,
      totalEmployees,
      totalTickets,
      resolvedTickets,
      pendingTickets: totalTickets - resolvedTickets
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

// === NEW 2: View Company Profile ===
export const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId).select("-password");
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: "Error fetching company info" });
  }
};

// === NEW 3: Update Company Profile ===
export const updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const updates = req.body;

    const company = await Company.findByIdAndUpdate(companyId, updates, { new: true }).select("-password");

    res.json({ message: "Company updated successfully", company });
  } catch (err) {
    res.status(500).json({ message: "Error updating company info" });
  }
};
