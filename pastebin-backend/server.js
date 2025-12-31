const express = require("express");
const db = require("./db");

let uuidv4;

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const PORT = 4000;

/* ---------- Utility ---------- */

function getNow(req) {
  if (process.env.TEST_MODE === "1" && req.headers["x-test-now-ms"]) {
    return Number(req.headers["x-test-now-ms"]);
  }
  return Date.now();
}

function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* ---------- Health Check ---------- */

app.get("/api/healthz", (req, res) => {
  db.query("SELECT 1", err => {
    if (err) return res.status(500).json({ ok: false });
    res.json({ ok: true });
  });
});

/* ---------- Create Paste ---------- */

app.post("/api/pastes", async (req, res) => {
  if (!uuidv4) {
    const { v4 } = await import("uuid");
    uuidv4 = v4;
  }

  const { content, ttl_seconds, max_views } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Content required" });
  }

  const id = uuidv4().slice(0, 8);
  const now = getNow(req);
  const expiresAt = ttl_seconds ? now + ttl_seconds * 1000 : null;
  const views = max_views ?? null;

  db.query(
    `INSERT INTO pastes VALUES (?, ?, ?, ?)`,
    [id, content, expiresAt, views],
    () => {
      res.status(201).json({
        id,
        url: `http://localhost:${PORT}/p/${id}`
      });
    }
  );
});

/* ---------- Fetch Paste API ---------- */

app.get("/api/pastes/:id", (req, res) => {
  const now = getNow(req);

  db.query(
    `SELECT * FROM pastes WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      if (!rows.length) return res.status(404).json({ error: "Not found" });

      const paste = rows[0];

      if (paste.expires_at && now >= paste.expires_at) {
        return res.status(404).json({ error: "Expired" });
      }

      if (paste.remaining_views !== null) {
        if (paste.remaining_views <= 0) {
          return res.status(404).json({ error: "View limit exceeded" });
        }

        db.query(
          `UPDATE pastes SET remaining_views = ? WHERE id = ?`,
          [paste.remaining_views - 1, paste.id]
        );
      }

      res.json({
        content: paste.content,
        remaining_views: paste.remaining_views,
        expires_at: paste.expires_at
          ? new Date(paste.expires_at).toISOString()
          : null
      });
    }
  );
});

/* ---------- View Paste HTML ---------- */

app.get("/p/:id", (req, res) => {
  const now = getNow(req);

  db.query(
    `SELECT * FROM pastes WHERE id = ?`,
    [req.params.id],
    (err, rows) => {
      if (!rows.length) return res.status(404).send("Paste not found");

      const paste = rows[0];

      if (paste.expires_at && now >= paste.expires_at) {
        return res.status(404).send("Expired");
      }

      if (paste.remaining_views !== null) {
        if (paste.remaining_views <= 0) {
          return res.status(404).send("View limit exceeded");
        }

        db.query(
          `UPDATE pastes SET remaining_views = ? WHERE id = ?`,
          [paste.remaining_views - 1, paste.id]
        );
      }

      res.send(`
        <html>
          <body>
            <pre>${escapeHTML(paste.content)}</pre>
          </body>
        </html>
      `);
    }
  );
});

/* ---------- Start ---------- */

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
