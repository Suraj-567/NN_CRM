// server/models/Ticket.js
import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // created, updated, assigned, status_changed, assignment_removed...
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    byName: { type: String },
    note: { type: String },
    at: { type: Date, default: Date.now },
    diff: { type: Object }, // { field: { from, to } }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true }, // e.g. TKT-2025-0001
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    subject: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: ["Billing", "Delivery", "Support", "Other"], default: "Other" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Low" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }], // using Employee collection as requested
    attachments: [{ type: String }], // store file paths/URLs
    status: { type: String, enum: ["Open", "In Progress", "Resolved", "Closed"], default: "Open" },
    slaDeadline: { type: Date, default: null },
    audit: [auditSchema],
    meta: { type: Object }, // free field for additional metadata
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
