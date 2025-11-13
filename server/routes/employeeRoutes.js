import express from "express";
import {
  addEmployee,
  getEmployees,
  updateEmployee,
  toggleEmployeeStatus,
  getEmployeeStats
} from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addEmployee);
router.get("/", verifyToken, getEmployees);
router.put("/:id", verifyToken, updateEmployee);
router.patch("/:id/status", verifyToken, toggleEmployeeStatus);
router.get("/stats", verifyToken, getEmployeeStats);

export default router;
