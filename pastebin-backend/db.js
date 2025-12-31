const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pastebin_lite"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected");

  // AUTO CREATE TABLE
  db.query(`
    CREATE TABLE IF NOT EXISTS pastes (
      id VARCHAR(50) PRIMARY KEY,
      content TEXT NOT NULL,
      expires_at BIGINT,
      remaining_views INT
    )
  `);
});

module.exports = db;
