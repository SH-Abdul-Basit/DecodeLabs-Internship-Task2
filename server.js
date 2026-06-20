const express = require("express");
const app = express();

// ── Middleware ──────────────────────────────
app.use(express.json()); // Parse JSON request bodies

// ── Routes ──────────────────────────────────
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

// ── Health check ─────────────────────────────
app.get("/", (req, res) => {
  res.json({
    project: "DecodeLabs – Backend Project 2",
    description: "Database Integration (CRUD) with SQLite",
    endpoints: {
      "POST   /api/users":        "Create a new user             → 201 Created | 409 Conflict",
      "GET    /api/users":        "Get all users                 → 200 OK",
      "GET    /api/users/:id":    "Get a single user by ID       → 200 OK | 404 Not Found",
      "PATCH  /api/users/:id":    "Partially update a user       → 200 OK | 404 | 409",
      "DELETE /api/users/:id":    "Delete a user                 → 204 No Content | 404",
    },
  });
});

// ── 404 handler for unknown routes ───────────
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", message: `Route ${req.method} ${req.path} does not exist.` });
});

// ── Global error handler ─────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// ── Start server ─────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   DecodeLabs – Backend Project 2             ║
║   Database Integration (CRUD)                ║
║   Server running on http://localhost:${PORT}    ║
╚══════════════════════════════════════════════╝

Available routes:
  POST   /api/users
  GET    /api/users
  GET    /api/users/:id
  PATCH  /api/users/:id
  DELETE /api/users/:id
  `);
});

module.exports = app;
