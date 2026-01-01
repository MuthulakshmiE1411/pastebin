const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "mysql-365cc07e-muthulakshmie49637-c2ca.l.aivencloud.com",
  user: "avnadmin",
  password: "AVNS_YqlzYALXnKVAUpgZWih",
  database: "defaultdb",
  port:22971
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
