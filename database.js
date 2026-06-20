const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "users.db");

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing DB from disk if it exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create the users table (Blueprint from slide 7)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      email     TEXT    NOT NULL UNIQUE,
      age       INTEGER NOT NULL CHECK(age >= 0),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT   NOT NULL DEFAULT (datetime('now'))
    )
  `);

  persist(); // save initial structure

  return db;
}

// Write in-memory DB back to disk after every mutation
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, persist };
