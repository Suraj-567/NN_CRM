import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  businessEmail: { type: String, required: true, unique: true },
  industry: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  managerName: { type: String, required: true },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Company", companySchema);
