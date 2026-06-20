const express = require("express");
const router = express.Router();
const { getDb, persist } = require("../database");

// ─────────────────────────────────────────────
// Helper: run a SELECT and return all rows as
// plain JS objects (sql.js returns typed arrays)
// ─────────────────────────────────────────────
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows[0] || null;
}

// ─────────────────────────────────────────────
// CREATE  →  POST /api/users
// Returns 201 Created | 409 Conflict | 400 Bad Request
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { email, age } = req.body;

  // --- Input validation ---
  if (!email || age === undefined) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Both 'email' and 'age' fields are required.",
    });
  }

  if (typeof age !== "number" || !Number.isInteger(age) || age < 0) {
    return res.status(400).json({
      error: "Bad Request",
      message: "'age' must be a non-negative integer.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid email format.",
    });
  }

  try {
    const db = await getDb();

    // Check for duplicate (prevents 409 Conflict — slide 12)
    const existing = queryOne(db, "SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: `Email '${email}' already exists. Duplicate entries are not allowed.`,
      });
    }

    db.run("INSERT INTO users (email, age) VALUES (?, ?)", [email, age]);
    persist();

    // Fetch the newly created user
    const newUser = queryOne(db, "SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    return res.status(201).json({
      message: "User created successfully.",
      user: newUser,
    });
  } catch (err) {
    console.error("CREATE error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL  →  GET /api/users
// Returns 200 OK with array of users
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const users = queryAll(db, "SELECT * FROM users ORDER BY created_at DESC");
    return res.status(200).json({
      message: "Users fetched successfully.",
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("READ ALL error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE  →  GET /api/users/:id
// Returns 200 OK | 404 Not Found
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    const user = queryOne(db, "SELECT * FROM users WHERE id = ?", [id]);

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: `No user found with id ${id}.`,
      });
    }

    return res.status(200).json({ message: "User fetched successfully.", user });
  } catch (err) {
    console.error("READ ONE error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE  →  PATCH /api/users/:id
// Returns 200 OK | 404 Not Found | 409 Conflict
// ─────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { email, age, is_active } = req.body;

  if (email === undefined && age === undefined && is_active === undefined) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Provide at least one field to update: email, age, or is_active.",
    });
  }

  try {
    const db = await getDb();

    const existingUser = queryOne(db, "SELECT * FROM users WHERE id = ?", [id]);
    if (!existingUser) {
      return res.status(404).json({
        error: "Not Found",
        message: `No user found with id ${id}.`,
      });
    }

    // Validate fields if provided
    if (age !== undefined) {
      if (typeof age !== "number" || !Number.isInteger(age) || age < 0) {
        return res.status(400).json({
          error: "Bad Request",
          message: "'age' must be a non-negative integer.",
        });
      }
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Invalid email format.",
        });
      }

      // Check duplicate email (excluding current user)
      const duplicate = queryOne(
        db,
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      if (duplicate) {
        return res.status(409).json({
          error: "Conflict",
          message: `Email '${email}' is already used by another user.`,
        });
      }
    }

    // Build dynamic SET clause
    const fields = [];
    const values = [];

    if (email !== undefined)     { fields.push("email = ?");     values.push(email); }
    if (age !== undefined)       { fields.push("age = ?");       values.push(age); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active ? 1 : 0); }

    values.push(id);
    db.run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    persist();

    const updatedUser = queryOne(db, "SELECT * FROM users WHERE id = ?", [id]);

    return res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("UPDATE error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE  →  DELETE /api/users/:id
// Returns 204 No Content | 404 Not Found
// ─────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();

    const user = queryOne(db, "SELECT * FROM users WHERE id = ?", [id]);
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: `No user found with id ${id}.`,
      });
    }

    db.run("DELETE FROM users WHERE id = ?", [id]);
    persist();

    // 204 No Content — body is intentionally empty (slide 9)
    return res.status(204).send();
  } catch (err) {
    console.error("DELETE error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

module.exports = router;