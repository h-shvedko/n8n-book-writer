import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  database: process.env.MYSQL_DATABASE || "wpi_content",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Wait for MySQL to become reachable, retrying every 2 s up to maxWaitMs.
 * Useful inside Docker Compose where the DB container may start after the API.
 */
export async function waitForDb(maxWaitMs = 30000) {
  const start = Date.now();
  const interval = 2000;

  while (Date.now() - start < maxWaitMs) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log("[db] MySQL connection established");
      return;
    } catch (err) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(
        `[db] Waiting for MySQL... (${elapsed}s elapsed) — ${err.message}`
      );
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  throw new Error(`[db] Could not connect to MySQL within ${maxWaitMs} ms`);
}

export default pool;
