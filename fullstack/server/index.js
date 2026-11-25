// SETUP:  npm init -y && npm i express mongoose cors dotenv
// .env:   PORT=5000  MONGO_URI=mongodb://127.0.0.1:27017/products
// RUN:    node index.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());0
app.use(express.json());

// ---------- Model ----------
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);
const Product = mongoose.model("Product", productSchema);

// ---------- Routes ----------

// GET /api/products?search=abc&page=1&limit=5
app.get("/api/products", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);
    const search = (req.query.search || "").trim();

    // escape regex special chars so "a.b" or "(" doesn't crash the query
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = search ? { name: { $regex: safe, $options: "i" } } : {};

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
});

// POST /api/products   { name, price }
app.post("/api/products", async (req, res, next) => {
  try {
    const { name, price } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Price must be a number >= 0" });
    }
    const product = await Product.create({ name, price: Number(price) });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
app.delete("/api/products/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- Error handler (must be last, 4 args) ----------
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
   FALLBACK if no database is provided in the test (in-memory array):

   let products = [], nextId = 1;

   app.get("/api/products", (req, res) => {
     const page = +req.query.page || 1, limit = +req.query.limit || 5;
     const search = (req.query.search || "").toLowerCase();
     const filtered = products.filter(p => p.name.toLowerCase().includes(search));
     const items = filtered.slice((page - 1) * limit, page * limit);
     res.json({ items, total: filtered.length, page,
                pages: Math.ceil(filtered.length / limit) || 1 });
   });
   app.post("/api/products", (req, res) => {
     const { name, price } = req.body;
     if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
     const p = { _id: String(nextId++), name: name.trim(), price: Number(price) };
     products.unshift(p);
     res.status(201).json(p);
   });
   app.delete("/api/products/:id", (req, res) => {
     const before = products.length;
     products = products.filter(p => p._id !== req.params.id);
     if (products.length === before) return res.status(404).json({ message: "Not found" });
     res.status(204).end();
   });
------------------------------------------------------------------- */
