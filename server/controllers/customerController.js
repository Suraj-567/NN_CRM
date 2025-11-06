import Customer from "../models/Customer.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js"; // Ensure this is imported
import mongoose from "mongoose";

// Helper to format assigned employees
const formatAssignedEmployees = (employees) =>
  Array.isArray(employees) && employees.length > 0
    ? employees.map((e) => e.name || "Unknown").join(", ")
    : "None";

/**
 * 🟢 Create customer
 */
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      contactName,
      email,
      phone,
      location,
      leadSource,
      assignedTo,
      status = "Lead",
    } = req.body;

    const companyId = req.user?.companyId;
    const userId = req.user?.id;

    if (!companyId)
      return res.status(400).json({ message: "Company ID missing in token" });
    if (!name)
      return res.status(400).json({ message: "Customer name is required" });

    const manager = await User.findById(userId);

    const assignedIds = Array.isArray(assignedTo)
      ? assignedTo
      : assignedTo
      ? [assignedTo]
      : [];

    // Fetch employee names based on assigned IDs
    const assignedEmployees = await Employee.find({
      _id: { $in: assignedIds },
    }).select("name");

    const assignedNames = formatAssignedEmployees(assignedEmployees);

    // Create new customer
    const customer = new Customer({
      companyId,
      name,
      contactName,
      email,
      phone,
      location,
      leadSource,
      assignedTo: assignedIds,
      status,
      state: "active",
      createdBy: manager?._id,
      createdByName: manager?.name || "System",
    });

    // Add audit entry
    customer.audit.push({
      action: "created",
      by: manager?._id,
      byName: manager?.name || "System",
      note: `Customer created${
        assignedNames !== "None" ? ` and assigned to ${assignedNames}` : ""
      }${status !== "Lead" ? ` with status: ${status}` : ""}`,
      diff:
        assignedNames !== "None"
          ? { assignedTo: { from: "None", to: assignedNames } }
          : undefined,
      at: new Date(),
    });

    await customer.save();

    // Populate assigned employees for response
    const populated = await Employee.find({ _id: { $in: assignedIds } }).select(
      "name email role"
    );

    res.status(201).json({
      message: "Customer created successfully",
      customer: {
        ...customer.toObject(),
        assignedTo: populated,
      },
    });
  } catch (err) {
    console.error("❌ Error creating customer:", err);
    res.status(500).json({ message: "Server error while creating customer" });
  }
};

/**
 * 🟡 List customers
 */
export const listCustomers = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId)
      return res.status(400).json({ message: "Company ID missing" });

    const customers = await Customer.find({ companyId }).sort({ createdAt: -1 });

    // Fetch employee names for each customer’s assignedTo
    const results = await Promise.all(
      customers.map(async (c) => {
        const employees = await Employee.find({
          _id: { $in: c.assignedTo },
        }).select("name email");
        return { ...c.toObject(), assignedTo: employees };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error listing customers:", err);
    res.status(500).json({ message: "Server error while fetching customers" });
  }
};

/**
 * 🟢 Get single customer
 */
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid customer ID" });

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    if (String(customer.companyId) !== String(companyId))
      return res.status(403).json({ message: "Forbidden" });

    const assignedEmployees = await Employee.find({
      _id: { $in: customer.assignedTo },
    }).select("name email role");

    res.json({ ...customer.toObject(), assignedTo: assignedEmployees });
  } catch (err) {
    console.error("❌ Error fetching customer:", err);
    res.status(500).json({ message: "Server error while fetching customer" });
  }
};

/**
 * 🔵 Update customer
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ID" });

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    if (String(customer.companyId) !== String(companyId))
      return res.status(403).json({ message: "Forbidden" });

    const manager = await User.findById(userId);
    const updates = req.body;
    const diff = {};

    // Handle assignedTo updates
    if (updates.assignedTo) {
      const newIds = Array.isArray(updates.assignedTo)
        ? updates.assignedTo
        : [updates.assignedTo];

      const oldIds = customer.assignedTo.map((x) => x.toString());
      const isDifferent =
        oldIds.sort().join(",") !== newIds.sort().join(",");

      if (isDifferent) {
        const newEmployees = await Employee.find({
          _id: { $in: newIds },
        }).select("name");
        const oldEmployees = await Employee.find({
          _id: { $in: oldIds },
        }).select("name");

        const newNames = formatAssignedEmployees(newEmployees);
        const oldNames = formatAssignedEmployees(oldEmployees);

        diff.assignedTo = { from: oldNames, to: newNames };
        customer.assignedTo = newIds;
      }
    }

    // Handle other fields
    for (const key of Object.keys(updates)) {
      if (key === "assignedTo") continue;
      const newVal = updates[key];
      const oldVal = customer[key];
      if (
        key in customer.schema.paths &&
        JSON.stringify(newVal) !== JSON.stringify(oldVal)
      ) {
        diff[key] = { from: oldVal, to: newVal };
        customer[key] = newVal;
      }
    }

    // Only push audit if something changed
    if (Object.keys(diff).length > 0) {
      customer.audit.push({
        action: "updated",
        by: userId,
        byName: manager?.name || "System",
        note: `Updated fields: ${Object.keys(diff).join(", ")}`,
        diff,
        at: new Date(),
      });
    }

    await customer.save();

    const assignedEmployees = await Employee.find({
      _id: { $in: customer.assignedTo },
    }).select("name email");

    res.json({
      message: "Customer updated successfully",
      customer: { ...customer.toObject(), assignedTo: assignedEmployees },
    });
  } catch (err) {
    console.error("❌ Error updating customer:", err);
    res.status(500).json({ message: "Server error while updating customer" });
  }
};

/**
 * 🟢 Convert Lead → Customer
 */
export const convertLead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ID" });

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    if (String(customer.companyId) !== String(companyId))
      return res.status(403).json({ message: "Forbidden" });
    if (customer.status === "Converted")
      return res.status(400).json({ message: "Customer already converted" });

    const manager = await User.findById(userId);
    customer.status = "Converted";
    customer.conversionDate = new Date();
    customer.conversionSource = customer.leadSource || "Manual";

    customer.audit.push({
      action: "converted",
      by: userId,
      byName: manager?.name || "System",
      note: "Lead converted to Customer",
      diff: { status: { from: "Lead", to: "Converted" } },
      at: new Date(),
    });

    await customer.save();
    const populated = await Customer.findById(customer._id).populate(
      "assignedTo",
      "name email role"
    );
    res.json({ message: "Lead converted successfully", customer: populated });
  } catch (err) {
    console.error("❌ Error converting lead:", err);
    res.status(500).json({ message: "Server error while converting lead" });
  }
};

/**
 * 🔴 Soft Delete
 */
export const softDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const manager = await User.findById(userId);
    customer.deletedAt = new Date();
    customer.deletedBy = userId;
    customer.state = "deactive";

    customer.audit.push({
      action: "deleted",
      by: userId,
      byName: manager?.name || "System",
      note: "Customer deactivated (soft deleted)",
      at: new Date(),
    });

    await customer.save();
    res.json({ message: "Customer deactivated successfully", customer });
  } catch (err) {
    console.error("❌ Error soft deleting customer:", err);
    res.status(500).json({ message: "Server error while deleting customer" });
  }
};

/**
 * 🟢 Restore
 */
export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const manager = await User.findById(userId);
    customer.deletedAt = null;
    customer.deletedBy = null;
    customer.state = "active";

    customer.audit.push({
      action: "restored",
      by: userId,
      byName: manager?.name || "System",
      note: "Customer restored successfully",
      at: new Date(),
    });

    await customer.save();
    res.json({ message: "Customer restored successfully", customer });
  } catch (err) {
    console.error("❌ Error restoring customer:", err);
    res.status(500).json({ message: "Server error while restoring customer" });
  }
};
