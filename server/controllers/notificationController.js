import nodemailer from "nodemailer";
import Customer from "../models/Customer.js";
import Company from "../models/Company.js";

export const sendEmail = async (req, res) => {
  try {
    const { to, subject, html, customerId } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company || !company.smtp?.user) {
      return res.status(400).json({ message: "Company email settings not configured" });
    }

    const transporter = nodemailer.createTransport({
      host: company.smtp.host,
      port: company.smtp.port,
      secure: company.smtp.port == 465,
      auth: {
        user: company.smtp.user,
        pass: company.smtp.pass,
      },
    });

     await transporter.sendMail({
      from: `"${company.smtp.fromName || company.companyName}" <${company.smtp.user}>`,
      to,
      subject,
      html,
    });

    if (customerId) {
      const c = await Customer.findById(customerId);
      if (c) {
        c.engagementHistory.push({
          type: "email",
          summary: `Email sent: ${subject}`,
          by: req.user.id,
          byName: req.user.name || req.user.email,
        });
        await c.save();
      }
    }

    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
};

