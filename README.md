# DecodeLabs – Backend Project 2
## Database Integration (CRUD)

> **Stack:** Node.js · Express.js · SQLite (via sql.js)

---

## Project Structure

```
crud-api/
├── server.js          ← Express app entry point
├── database.js        ← SQLite connection + schema
├── routes/
│   └── users.js       ← All CRUD route handlers
├── users.db           ← Auto-generated SQLite file
└── package.json
```

---

## User Schema (from slide 7)

| Column       | Type            | Constraint                     |
|--------------|-----------------|--------------------------------|
| `id`         | INTEGER         | PRIMARY KEY AUTOINCREMENT      |
| `email`      | TEXT            | NOT NULL, UNIQUE               |
| `age`        | INTEGER         | NOT NULL, CHECK(age >= 0)      |
| `is_active`  | INTEGER (bool)  | NOT NULL, DEFAULT 1 (true)     |
| `created_at` | TEXT (datetime) | DEFAULT datetime('now') UTC    |

---

## Setup & Run

```bash
npm install
npm start
# Server → http://localhost:3000
```

---

## API Endpoints (HTTP → CRUD Mapping)

### POST /api/users — CREATE
Returns **201 Created** or **409 Conflict** (duplicate email)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "intern@tech.com", "age": 24}'
```

**Response 201:**
```json
{
  "message": "User created successfully.",
  "user": {
    "id": 1,
    "email": "intern@tech.com",
    "age": 24,
    "is_active": 1,
    "created_at": "2026-06-20 10:00:00"
  }
}
```

**Response 409 (duplicate):**
```json
{
  "error": "Conflict",
  "message": "Email 'intern@tech.com' already exists. Duplicate entries are not allowed."
}
```

---

### GET /api/users — READ ALL
Returns **200 OK**

```bash
curl http://localhost:3000/api/users
```

---

### GET /api/users/:id — READ ONE
Returns **200 OK** or **404 Not Found**

```bash
curl http://localhost:3000/api/users/1
```

---

### PATCH /api/users/:id — UPDATE (partial)
Returns **200 OK** | **404** | **409**

```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age": 25, "is_active": false}'
```

---

### DELETE /api/users/:id — DELETE
Returns **204 No Content** or **404 Not Found**

```bash
curl -X DELETE http://localhost:3000/api/users/1
```

---

## CRUD Lifecycle Test (Gatekeeper Rule – slide 14)

```bash
# 1. POST → create user (expect 201)
# 2. POST same user again (expect 409 Conflict)
# 3. GET all users (expect 200, count = 1)
# 4. PATCH user (expect 200)
# 5. DELETE user (expect 204)
# 6. GET deleted user (expect 404)
```

---

## Key Concepts Covered

- **Data Persistence** — SQLite on disk survives server restarts
- **Schema Constraints** — UNIQUE, NOT NULL, CHECK enforced at DB level
- **HTTP → CRUD Mapping** — POST/GET/PATCH/DELETE with correct status codes
- **409 Conflict** — Duplicate email prevention
- **ORM-style abstraction** — Parameterized queries prevent SQL injection