import express from "express";
import { loginUser, registerUser, loginBusinessManager, loginEmployee} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginBusinessManager);
router.post("/admin", loginUser);
router.post("/employee", loginEmployee);

export default router;
