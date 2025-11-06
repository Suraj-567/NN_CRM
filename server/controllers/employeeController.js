import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js"; // IMPORT Customer model
import bcrypt from "bcryptjs";

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

    // Check existing employee or user
    const existingEmp = await Employee.findOne({ email });
    const existingUser = await User.findOne({ email });
    if (existingEmp || existingUser) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Employee
    const newEmployee = new Employee({
      name,
      email,
      password: hashedPassword,
      department,
      companyId,
      role: "Employee",
      ticketsHandled: 0,
      status: "Active",
    });
    await newEmployee.save();

    // Create corresponding User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      department,
      companyId,
      role: "Employee",
      ticketsHandled: 0,
      status: "Active",
    });
    await newUser.save();

    res.status(201).json({
      message: "Employee added successfully",
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
    const employees = await Employee.find({ companyId });
    res.json(employees);
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

    // --- NEW LOGIC: Cascade Update for Customers ---
    if (newStatus === "Inactive") {
      // 1. Find all customers currently assigned to this employee
      const affectedCustomers = await Customer.find({
        assignedTo: employee._id,
        deletedAt: null, // Only update active customers
      });

      affectedCustomersCount = affectedCustomers.length; // Store the count

      const promises = affectedCustomers.map(async (customer) => {
        // 2. Remove the employee's ID from the assignedTo array
        customer.assignedTo = customer.assignedTo.filter(
          (assignedId) => String(assignedId) !== String(employee._id)
        );

        // 3. Add an audit trail entry
        customer.audit.push({
          action: "assignment_removed",
          by: managerId,
          byName: managerName,
          note: `Removed deactivated employee: ${employee.name} (ID: ${employee._id}).`,
          at: new Date(),
        });
        return customer.save();
      });

      await Promise.all(promises);
    }
    // --- END NEW LOGIC ---

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
