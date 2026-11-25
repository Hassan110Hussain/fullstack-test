// SETUP:  npm create vite@latest client -- --template react
//         cd client && npm i && npm run dev
// Replace src/App.jsx with this file.

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/products";
const LIMIT = 5;

export default function App() {
  // list state
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // debounce the search box (400ms) and reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // load products whenever page or search changes
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}?search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${LIMIT}`
      );
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data.items);
      setPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // add product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) return setFormError("Name is required");
    if (price === "" || Number(price) < 0) return setFormError("Enter a valid price");

    setSaving(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not add product");
      }
      setName("");
      setPrice("");
      setPage(1);
      loadProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // delete product
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete product");
      // if we deleted the last item on this page, go back one page
      if (products.length === 1 && page > 1) setPage(page - 1);
      else loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Products</h1>

      {/* ---------- Form ---------- */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          style={{ width: 90 }}
        />
        <button type="submit" disabled={saving}>
          {saving ? "Adding..." : "Add"}
        </button>
      </form>
      {formError && <p style={{ color: "crimson", margin: "0 0 8px" }}>{formError}</p>}

      {/* ---------- Search ---------- */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
        style={{ width: "100%", boxSizing: "border-box", marginBottom: 12 }}
      />

      {/* ---------- States: loading / error / empty / list ---------- */}
      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "crimson" }}>
          {error} <button onClick={loadProducts}>Retry</button>
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p>{debouncedSearch ? "No products match your search." : "No products yet. Add one above."}</p>
      )}

      {!loading && !error && products.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {products.map((p) => (
            <li
              key={p._id}
              style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ddd" }}
            >
              <span>
                {p.name} - ${p.price}
              </span>
              <button onClick={() => handleDelete(p._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Pagination ---------- */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
