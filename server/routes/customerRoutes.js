// server/routes/customerRoutes.js
import express from "express";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  softDeleteCustomer,
  restoreCustomer,
  getAssignedCustomers,
  addEngagement
} from "../controllers/customerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.post("/", createCustomer);
router.get("/", listCustomers);
router.get("/assigned", getAssignedCustomers);
router.post("/:id/engagement", addEngagement);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", softDeleteCustomer);
router.put("/:id/restore", restoreCustomer);


export default router;
