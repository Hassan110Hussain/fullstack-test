// SETUP:  npm init -y && npm i express mongoose cors dotenv
// .env:   PORT=5000  MONGO_URI=mongodb://127.0.0.1:27017/tasks
// RUN:    node index.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Model ----------
const STATUSES = ["todo", "in-progress", "done"];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: STATUSES, default: "todo" },
  },
  { timestamps: true }
);
const Task = mongoose.model("Task", taskSchema);

// ---------- Helpers ----------
const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

const validateTask = (body, { partial = false } = {}) => {
  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) return "Title is required";
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return `Status must be one of: ${STATUSES.join(", ")}`;
  }
  return null;
};

// ---------- Routes ----------

// CREATE
app.post("/api/tasks", async (req, res, next) => {
  try {
    const error = validateTask(req.body);
    if (error) return res.status(400).json({ message: error });

    const { title, description, status } = req.body;
    const task = await Task.create({ title, description, status });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// READ ALL   GET /api/tasks?status=done&search=abc
app.get("/api/tasks", async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const safe = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: safe, $options: "i" };
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// READ ONE
app.get("/api/tasks/:id", checkId, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// UPDATE
app.put("/api/tasks/:id", checkId, async (req, res, next) => {
  try {
    const error = validateTask(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    const { title, description, status } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;

    const task = await Task.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE
app.delete("/api/tasks/:id", checkId, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- Error handler (last, 4 args) ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// ---------- Start ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("DB connection failed:", err.message));

/* ------------------------------------------------------------------
   FALLBACK if no database is provided (in-memory array):

   const STATUSES = ["todo", "in-progress", "done"];
   let tasks = [], nextId = 1;

   app.post("/api/tasks", (req, res) => {
     const { title, description = "", status = "todo" } = req.body;
     if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
     if (!STATUSES.includes(status)) return res.status(400).json({ message: "Bad status" });
     const t = { _id: String(nextId++), title: title.trim(), description, status };
     tasks.unshift(t);
     res.status(201).json(t);
   });
   app.get("/api/tasks", (req, res) => {
     const { status, search = "" } = req.query;
     res.json(tasks.filter(t =>
       (!status || t.status === status) &&
       t.title.toLowerCase().includes(search.toLowerCase())));
   });
   app.get("/api/tasks/:id", (req, res) => {
     const t = tasks.find(t => t._id === req.params.id);
     if (!t) return res.status(404).json({ message: "Task not found" });
     res.json(t);
   });
   app.put("/api/tasks/:id", (req, res) => {
     const i = tasks.findIndex(t => t._id === req.params.id);
     if (i === -1) return res.status(404).json({ message: "Task not found" });
     if (req.body.status && !STATUSES.includes(req.body.status))
       return res.status(400).json({ message: "Bad status" });
     tasks[i] = { ...tasks[i], ...req.body, _id: tasks[i]._id };
     res.json(tasks[i]);
   });
   app.delete("/api/tasks/:id", (req, res) => {
     const before = tasks.length;
     tasks = tasks.filter(t => t._id !== req.params.id);
     if (tasks.length === before) return res.status(404).json({ message: "Task not found" });
     res.status(204).end();
   });
------------------------------------------------------------------- */
