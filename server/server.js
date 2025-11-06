// server/server.js


import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import customerRoutes from "./routes/customerRoutes.js"; // <-- new
import ticketRoutes from "./routes/ticketRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes); 
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => res.send("CRM API is running..."));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
