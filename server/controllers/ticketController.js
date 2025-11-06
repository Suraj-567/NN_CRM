// server/controllers/ticketController.js
import Ticket from "../models/Ticket.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * Helper: generate ticketId
 * Format: TKT-YYYY-XXXX where XXXX is sequential-ish using timestamp
 */
const generateTicketId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const suffix = String(now.getTime()).slice(-6);
  return `TKT-${y}-${suffix}`;
};

/**
 * Helper: format employee names
 */
const formatEmployees = (emps) =>
  Array.isArray(emps) && emps.length > 0 ? emps.map((e) => e.name || "Unknown").join(", ") : "None";

/**
 * Create ticket
 * Validates customer exists in same company.
 * Validates assigned employees (must be Active).
 */
export const createTicket = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    const userName = req.user?.name || "System";

    const {
      customerId,
      subject,
      description,
      category = "Other",
      priority = "Low",
      assignedTo = [],
      attachments = [],
      status = "Open",
      slaDeadline = null,
    } = req.body;

    if (!companyId) return res.status(400).json({ message: "Company ID missing in token" });
    if (!customerId || !subject) return res.status(400).json({ message: "customerId and subject required" });

    // Validate customer exists and belongs to company
    if (!mongoose.isValidObjectId(customerId)) return res.status(400).json({ message: "Invalid customerId" });
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    if (String(customer.companyId) !== String(companyId)) return res.status(403).json({ message: "Customer does not belong to your company" });

    // Validate assigned employees and filter only Active ones
    const assignedIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    let assignedEmployees = [];
    if (assignedIds.length) {
      assignedEmployees = await Employee.find({ _id: { $in: assignedIds }, status: "Active" }).select("name");
    }
    const assignedNames = formatEmployees(assignedEmployees);

    const ticket = new Ticket({
      ticketId: generateTicketId(),
      companyId,
      customerId,
      subject,
      description,
      category,
      priority,
      assignedTo: assignedEmployees.map((e) => e._id),
      attachments,
      status,
      slaDeadline: slaDeadline ? new Date(slaDeadline) : null,
    });

    // Audit: created
    ticket.audit.push({
      action: "created",
      by: userId,
      byName: userName,
      note: `Ticket created${assignedNames !== "None" ? ` and assigned to ${assignedNames}` : ""}`,
      diff: assignedNames !== "None" ? { assignedTo: { from: "None", to: assignedNames } } : undefined,
      at: new Date(),
    });

    await ticket.save();

    // Return populated ticket with assigned employees and customer summary
    const populated = await Ticket.findById(ticket._id)
      .populate({ path: "assignedTo", select: "name email status" })
      .populate({ path: "customerId", select: "name contactName email phone location" });

    res.status(201).json({ message: "Ticket created", ticket: populated });
  } catch (err) {
    console.error("❌ createTicket:", err);
    res.status(500).json({ message: "Server error creating ticket" });
  }
};

/**
 * List tickets with optional filters (company scope)
 */
export const listTickets = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Company ID missing" });

    const { status, priority, category, search } = req.query;
    const q = { companyId };

    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (category) q.category = category;
    if (search) q.$or = [{ ticketId: new RegExp(search, "i") }, { subject: new RegExp(search, "i") }];

    const tickets = await Ticket.find(q).sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: "assignedTo", select: "name email status" })
      .populate({ path: "customerId", select: "name contactName email phone location" });

    res.json(tickets);
  } catch (err) {
    console.error("❌ listTickets:", err);
    res.status(500).json({ message: "Server error listing tickets" });
  }
};

/**
 * Get single ticket by id (_id or ticketId)
 */
export const getTicket = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(400).json({ message: "Company ID missing" });

    let ticket = null;
    if (mongoose.isValidObjectId(id)) {
      ticket = await Ticket.findById(id);
    }
    if (!ticket) ticket = await Ticket.findOne({ ticketId: id });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (String(ticket.companyId) !== String(companyId)) return res.status(403).json({ message: "Forbidden" });

    ticket = await Ticket.findById(ticket._id)
      .populate({ path: "assignedTo", select: "name email status" })
      .populate({ path: "customerId", select: "name contactName email phone location" });

    res.json(ticket);
  } catch (err) {
    console.error("❌ getTicket:", err);
    res.status(500).json({ message: "Server error fetching ticket" });
  }
};

/**
 * Update ticket: supports editing fields, changing assignment, status
 * Pushes audit entries for diffs
 */
export const updateTicket = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    const userName = req.user?.name || "System";
    const { id } = req.params;
    const updates = req.body;

    if (!companyId) return res.status(400).json({ message: "Company ID missing" });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ticket id" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    if (String(ticket.companyId) !== String(companyId)) return res.status(403).json({ message: "Forbidden" });

    const diff = {};

    // Handle assignedTo update specially (use Employee collection)
    if ("assignedTo" in updates) {
      const newIds = Array.isArray(updates.assignedTo) ? updates.assignedTo : [updates.assignedTo];
      const oldIds = (ticket.assignedTo || []).map((x) => x.toString()).sort();
      const sortedNew = newIds.map(String).sort();

      if (oldIds.join(",") !== sortedNew.join(",")) {
        const newEmps = await Employee.find({ _id: { $in: newIds } }).select("name");
        const oldEmps = await Employee.find({ _id: { $in: oldIds } }).select("name");

        diff.assignedTo = { from: formatEmployees(oldEmps), to: formatEmployees(newEmps) };
        ticket.assignedTo = newIds;
      }
    }

    // Handle simple fields
    const updatable = ["subject", "description", "category", "priority", "status", "slaDeadline", "attachments"];
    for (const key of updatable) {
      if (key in updates) {
        const newVal = updates[key];
        const oldVal = ticket[key];
        // Normalize dates for comparison
        if (key === "slaDeadline") {
          const oldS = oldVal ? new Date(oldVal).toISOString() : null;
          const newS = newVal ? new Date(newVal).toISOString() : null;
          if (oldS !== newS) diff.slaDeadline = { from: oldS, to: newS }, ticket.slaDeadline = newVal ? new Date(newVal) : null;
        } else if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          diff[key] = { from: oldVal, to: newVal };
          ticket[key] = newVal;
        }
      }
    }

    if (Object.keys(diff).length > 0) {
      ticket.audit.push({
        action: "updated",
        by: userId,
        byName: userName,
        note: `Updated fields: ${Object.keys(diff).join(", ")}`,
        diff,
        at: new Date(),
      });
    }

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate({ path: "assignedTo", select: "name email status" })
      .populate({ path: "customerId", select: "name contactName email phone location" });

    res.json({ message: "Ticket updated", ticket: populated });
  } catch (err) {
    console.error("❌ updateTicket:", err);
    res.status(500).json({ message: "Server error updating ticket" });
  }
};

/**
 * Assign ticket endpoint (explicit assignment) - convenience wrapper
 */
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body; // array of employee ids or single id
    return await updateTicket({ ...req, params: { id }, body: { assignedTo } }, res);
  } catch (err) {
    console.error("❌ assignTicket:", err);
    res.status(500).json({ message: "Server error assigning ticket" });
  }
};

/**
 * Customer tickets summary (for second page)
 * Returns list of customers (with minimal info) and counts: totalRaised, totalResolved
 */
export const customerTicketsSummary = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Company ID missing" });

    // Find customers for company
    const customers = await Customer.find({ companyId }).select("name contactName email phone");

    const results = await Promise.all(
      customers.map(async (c) => {
        const totalRaised = await Ticket.countDocuments({ companyId, customerId: c._id });
        const totalResolved = await Ticket.countDocuments({ companyId, customerId: c._id, status: { $in: ["Resolved", "Closed"] } });
        return {
          customerId: c._id,
          name: c.name,
          contactName: c.contactName,
          email: c.email,
          phone: c.phone,
          totalRaised,
          totalResolved,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ customerTicketsSummary:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get tickets for a single customer (paginated)
 */
export const getCustomerTickets = async (req, res) => {
  try {
    const { customerId } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Company ID missing" });
    if (!mongoose.isValidObjectId(customerId)) return res.status(400).json({ message: "Invalid customerId" });

    const tickets = await Ticket.find({ companyId, customerId }).sort({ createdAt: -1 })
      .populate({ path: "assignedTo", select: "name email status" });

    res.json(tickets);
  } catch (err) {
    console.error("❌ getCustomerTickets:", err);
    res.status(500).json({ message: "Server error" });
  }
};
