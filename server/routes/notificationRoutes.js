import express from "express";
import { sendEmail } from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.post("/email", sendEmail);

export default router;
