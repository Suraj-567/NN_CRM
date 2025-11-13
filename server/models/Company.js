import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    businessEmail: { type: String, required: true, unique: true },
    industry: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    managerName: { type: String, required: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false },

    // ✅ ADD THIS BLOCK
    smtp: {
      host: { type: String, required: true },
      port: { type: Number, required: true, default: 587 },
      user: { type: String, required: true },
      pass: { type: String, required: true },
      fromName: { type: String, default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
