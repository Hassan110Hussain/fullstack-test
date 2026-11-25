// SETUP:  npm create vite@latest client -- --template react
//         cd client && npm i && npm run dev
// Replace src/App.jsx with this file.

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/tasks";
const STATUSES = ["todo", "in-progress", "done"];
const EMPTY_FORM = { title: "", description: "", status: "todo" };

export default function App() {
  // list state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // form state (editingId === null means "create mode")
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- READ ----------
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`${API}${query}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      setTasks(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ---------- helpers ----------
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  };

  // ---------- CREATE / UPDATE ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) return setFormError("Title is required");

    setSaving(true);
    try {
      const res = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not save task");
      }
      resetForm();
      loadTasks();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------- start editing ----------
  const startEdit = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
    });
    setFormError("");
  };

  // ---------- DELETE ----------
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete task");
      if (editingId === id) resetForm();
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------- BONUS: mark as done ----------
  const markDone = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (!res.ok) throw new Error("Could not update task");
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Tasks</h1>

      {/* ---------- Form ---------- */}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, marginBottom: 8 }}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description (optional)"
          rows={2}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add task"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {formError && <p style={{ color: "crimson", margin: "0 0 8px" }}>{formError}</p>}

      {/* ---------- Filter + counter ---------- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {!loading && !error && (
          <span>
            {doneCount} of {tasks.length} done
          </span>
        )}
      </div>

      {/* ---------- States ---------- */}
      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "crimson" }}>
          {error} <button onClick={loadTasks}>Retry</button>
        </p>
      )}

      {!loading && !error && tasks.length === 0 && (
        <p>{statusFilter ? `No ${statusFilter} tasks.` : "No tasks yet. Add one above."}</p>
      )}

      {/* ---------- List ---------- */}
      {!loading && !error && tasks.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((t) => (
            <li key={t._id} style={{ padding: "10px 0", borderBottom: "1px solid #ddd" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <b style={{ textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</b>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>[{t.status}]</span>
                  {t.description && <div style={{ color: "#444" }}>{t.description}</div>}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
                  {t.status !== "done" && <button onClick={() => markDone(t._id)}>Done</button>}
                  <button onClick={() => startEdit(t)}>Edit</button>
                  <button onClick={() => handleDelete(t._id)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
