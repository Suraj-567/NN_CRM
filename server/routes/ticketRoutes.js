// server/routes/ticketRoutes.js
import express from "express";
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  assignTicket,
  customerTicketsSummary,
  getCustomerTickets,
} from "../controllers/ticketController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

// Tickets
router.post("/", createTicket);
router.get("/", listTickets);
router.get("/summary/customers", customerTicketsSummary); // customer-level summary
router.get("/customer/:customerId", getCustomerTickets); // tickets of a single customer
router.get("/:id", getTicket);
router.put("/:id", updateTicket);
router.patch("/:id/assign", assignTicket);

export default router;
