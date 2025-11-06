import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    byName: { type: String },
    note: { type: String },
    at: { type: Date, default: Date.now },
    diff: { type: Object },
  },
  { _id: false }
);

const engagementSchema = new mongoose.Schema(
  {
    type: { type: String },
    summary: { type: String },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    byName: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    leadSource: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["Lead", "Converted"], default: "Lead" },
    state: { type: String, enum: ["active", "deactive"], default: "active" },
    conversionDate: { type: Date, default: null },
    conversionSource: { type: String, default: null },
    engagementHistory: [engagementSchema],
    audit: [auditSchema],
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
