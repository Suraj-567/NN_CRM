// server/models/Employee.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: {
      type: String,
      enum: ["Technical", "Support", "Sales"],
      required: true,
    },
    role: { type: String, default: "Employee" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    ticketsHandled: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    joinedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Encrypt password before saving
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("Employee", employeeSchema);
