import Company from "../models/Company.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getStats = async (req, res) => {
  const totalCompanies = await Company.countDocuments();
  const approvedCompanies = await User.countDocuments({ role: "BusinessManager" });
  const totalEmployees = await User.countDocuments({ role: "Employee" });
  res.json({ totalCompanies, approvedCompanies, totalEmployees });
};

export const getPendingCompanies = async (req, res) => {
  const pending = await Company.find({ approved: false });
  res.json(pending);
};

export const approveCompany = async (req, res) => {
  const { status } = req.body;
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  if (status === "approved") {
    company.approved = true;
    await company.save();

    const hashedPassword = company.password;

    await User.create({
  name: company.managerName,
  email: company.businessEmail,
  password: hashedPassword,
  role: "BusinessManager",
  status: "active",
  companyId: company._id,
});


    res.json({ message: "Company approved and Business Manager created." });
  } else if (status === "rejected") {
    await company.deleteOne();
    res.json({ message: "Company rejected and removed." });
  }
};

export const getApprovedCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ approved: true })
      .select("-password")
      .lean();

    // For each company, count number of employees linked to it
    const companyData = await Promise.all(
      companies.map(async (c) => {
        const employeeCount = await User.countDocuments({ companyId: c._id, role: "Employee" });
        return {
          ...c,
          employeeCount,
        };
      })
    );

    res.json(companyData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching approved companies" });
  }
};
