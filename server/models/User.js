import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: {
      type: String,
      enum: ["Technical", "Support", "Sales"],
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Employee", "Support", "BusinessManager"],
      default: "Employee",
    },
    ticketsHandled: { type: Number, default: 0 },
    joinedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Inactive","active"], default: "Active" },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
);


export default mongoose.model("User", userSchema);
