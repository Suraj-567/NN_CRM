import mongoose from "mongoose";

import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js"; // IMPORT Customer model
import bcrypt from "bcryptjs";
import Ticket from "../models/Ticket.js";

// ➕ Add new Employee (Business Manager only)
export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const companyId = req.user?.companyId;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!companyId) {
      return res.status(400).json({ message: "Company ID missing in token" });
    }

    // ✅ Check only Employee model now
    const existingEmp = await Employee.findOne({ email });
    if (existingEmp) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // ✅ Create employee (password auto-hashes due to pre-save middleware)
    const newEmployee = new Employee({
      name,
      email,
      password,
      department,
      companyId,
      role: "Employee",
      status: "Active",
    });

    await newEmployee.save();

    res.status(201).json({
      message: "✅ Employee added successfully",
      employee: newEmployee,
    });
  } catch (err) {
    console.error("❌ Error adding employee:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// 📋 Get all employees
export const getEmployees = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({ message: "Company ID missing in token" });
    }

    // Fetch all employees for the company
    const employees = await Employee.find({ companyId }).sort({ createdAt: -1 });

    // Get ticket counts for each employee using aggregation
    const ticketCounts = await Ticket.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          assignedTo: { $exists: true, $ne: [] } // Only count tickets with assignments
        }
      },
      {
        $unwind: "$assignedTo" // Separate array elements into individual documents
      },
      {
        $group: {
          _id: "$assignedTo", // Group by employee ID
          totalTickets: { $sum: 1 }, // Total tickets assigned
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] }
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] }
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] }
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] }
          }
        }
      }
    ]);

    // Create a map for quick lookup
    const ticketCountMap = {};
    ticketCounts.forEach(item => {
      ticketCountMap[item._id.toString()] = {
        total: item.totalTickets,
        open: item.openTickets,
        inProgress: item.inProgressTickets,
        resolved: item.resolvedTickets,
        closed: item.closedTickets
      };
    });

    // Add ticket counts to employee data
    const employeesWithTickets = employees.map(emp => {
      const empId = emp._id.toString();
      const ticketStats = ticketCountMap[empId] || {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
      };

      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        status: emp.status,
        createdAt: emp.createdAt,
        ticketsHandled: ticketStats.total, // For backward compatibility
        ticketStats: ticketStats // Detailed breakdown
      };
    });

    res.json(employeesWithTickets);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✏️ Update employee details (sync with User)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const oldEmail = employee.email; // store before change

    // Check for email conflict with another employee
    const emailConflict = await Employee.findOne({ email, _id: { $ne: id } });
    if (emailConflict) {
      return res.status(400).json({ message: "Another employee already uses this email" });
    }

    // Update employee
    let hashedPassword = employee.password;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    employee.name = name;
    employee.email = email;
    employee.password = hashedPassword;
    employee.department = department;
    await employee.save();

    // Update User using old email reference
    const user = await User.findOne({ email: oldEmail });
    if (user) {
      user.name = name;
      user.email = email;
      user.password = hashedPassword;
      user.department = department;
      await user.save();
    }

    res.json({ message: "Employee updated successfully", employee });
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔁 Toggle employee active/inactive (sync both)
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user?.id; // The user performing the action
    const managerName = req.user?.name || "Business Manager";
    let affectedCustomersCount = 0; // Initialize count outside the block

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const newStatus = employee.status === "Active" ? "Inactive" : "Active";
    employee.status = newStatus;
    await employee.save();

    const user = await User.findOne({ email: employee.email });
    if (user) {
      user.status = newStatus;
      await user.save();
    }

    // --- NEW LOGIC: Cascade Update for Customers + Tickets ---
if (newStatus === "Inactive") {
  // 1) Remove employee from assigned customers
  const affectedCustomers = await Customer.find({
    assignedTo: employee._id,
    deletedAt: null,
  });

  affectedCustomersCount = affectedCustomers.length;

  const customerUpdates = affectedCustomers.map(async (customer) => {
    customer.assignedTo = customer.assignedTo.filter(
      (assignedId) => String(assignedId) !== String(employee._id)
    );

    customer.audit.push({
      action: "assignment_removed",
      by: managerId,
      byName: managerName,
      note: `Employee ${employee.name} deactivated. Removed from customer assignment.`,
      at: new Date(),
    });
    return customer.save();
  });

  await Promise.all(customerUpdates);

  // ✅ 2) Remove employee from Tickets
  const tickets = await Ticket.find({ assignedTo: employee._id });

  const ticketUpdates = tickets.map(async (ticket) => {
    ticket.assignedTo = ticket.assignedTo.filter(
      (id) => String(id) !== String(employee._id)
    );

    ticket.audit.push({
      action: "assignment_removed",
      by: managerId,
      byName: managerName,
      note: `Employee ${employee.name} became inactive. Ticket marked as Unassigned.`,
      diff: { assignedTo: { from: employee.name, to: "Unassigned" } },
      at: new Date(),
    });

    await ticket.save();
  });

  await Promise.all(ticketUpdates);
}


    res.json({
      message: `Employee ${employee.name} ${
        newStatus === "Active" ? "activated" : "deactivated"
      } successfully. ${
        newStatus === "Inactive"
          ? `Removed from ${affectedCustomersCount} customer assignments.`
          : ""
      }`,
      status: newStatus,
    });
  } catch (err) {
    console.error("❌ Error toggling employee status:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const getEmployeeStats = async (req, res) => {
  try {
    const employeeId = new mongoose.Types.ObjectId(req.user.id);
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    const totalCustomers = await Customer.countDocuments({
      companyId,
      assignedTo: { $in: [employeeId] }   // ✅ FIXED
    });

    const totalTickets = await Ticket.countDocuments({
      companyId,
      assignedTo: employeeId
    });

    const solvedTickets = await Ticket.countDocuments({
      companyId,
      assignedTo: employeeId,
      status: "resolved"
    });

    const pendingTickets = await Ticket.countDocuments({
      companyId,
      assignedTo: employeeId,
      status: "pending"
    });

    res.json({ totalCustomers, totalTickets, solvedTickets, pendingTickets });

  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ message: "Unable to fetch employee stats" });
  }
};

