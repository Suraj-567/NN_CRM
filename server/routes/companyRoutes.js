import express from "express";
import { registerCompany, getCompanyProfile, updateCompanyProfile, getCompanyStats } from "../controllers/companyController.js";
import { verifyToken} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public (Used during Signup)
router.post("/register", registerCompany);

// Private (Only Business Manager / Admin Manager)
router.use(verifyToken);

// Dashboard analytics
router.get("/stats", getCompanyStats);

// View company profile
router.get("/profile", getCompanyProfile);

// Update company profile
router.put("/profile", updateCompanyProfile);

export default router;
