// server/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String },
    title: { type: String, required: true },
    note: { type: String },
    dateTime: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    // optional: link to a customer/ticket if you want
    meta: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
