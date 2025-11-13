// server/routes/taskRoutes.js
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createTask, listTasks, updateTask, deleteTask } from "../controllers/taskController.js";

const router = express.Router();
router.use(verifyToken);

router.post("/", createTask);
router.get("/", listTasks);
router.put("/:id", updateTask);   // update (toggle complete)
router.delete("/:id", deleteTask);

export default router;
