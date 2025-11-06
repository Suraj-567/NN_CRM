// routes/adminRoutes.js
import express from "express";
import { getStats, getPendingCompanies, approveCompany, getApprovedCompanies } from "../controllers/adminController.js";
const router = express.Router();

router.get("/stats", getStats);
router.get("/pending-companies", getPendingCompanies);
router.post("/approve-company/:id", approveCompany);
router.get("/approved-companies", getApprovedCompanies);


export default router;
