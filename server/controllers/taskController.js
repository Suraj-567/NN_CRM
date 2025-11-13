// server/controllers/taskController.js
import Task from "../models/Task.js";
import mongoose from "mongoose";

/**
 * Create task
 */
export const createTask = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Company ID missing" });

    const { title, note = "", dateTime } = req.body;
    if (!title || !dateTime) return res.status(400).json({ message: "Title and dateTime required" });

    const dt = new Date(dateTime);
    if (isNaN(dt.getTime())) return res.status(400).json({ message: "Invalid dateTime" });

    const task = await Task.create({
      companyId,
      createdBy: req.user.id,
      createdByName: req.user.name || req.user.email || "Employee",
      title,
      note,
      dateTime: dt,
      completed: false,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("❌ createTask:", err);
    res.status(500).json({ message: "Server error creating task" });
  }
};

/**
 * List tasks for the logged-in employee's company
 * Optionally return all tasks for company (you can restrict to createdBy or assigned)
 */
export const listTasks = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: "Company ID missing" });

    // Return tasks for this company
    const tasks = await Task.find({ companyId }).sort({ dateTime: 1 });
    res.json(tasks);
  } catch (err) {
    console.error("❌ listTasks:", err);
    res.status(500).json({ message: "Server error listing tasks" });
  }
};

/**
 * Update task (partial). Use this for toggling completed, editing note/time, etc.
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Optionally check companyId to ensure permission
    if (String(task.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, note, dateTime, completed } = req.body;
    if (typeof title !== "undefined") task.title = title;
    if (typeof note !== "undefined") task.note = note;
    if (typeof dateTime !== "undefined") {
      const dt = new Date(dateTime);
      if (isNaN(dt.getTime())) return res.status(400).json({ message: "Invalid dateTime" });
      task.dateTime = dt;
    }
    if (typeof completed !== "undefined") task.completed = !!completed;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error("❌ updateTask:", err);
    res.status(500).json({ message: "Server error updating task" });
  }
};

/**
 * Delete task
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid task id" });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (String(task.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Task.findByIdAndDelete(id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("❌ deleteTask:", err);
    res.status(500).json({ message: "Server error deleting task" });
  }
};
