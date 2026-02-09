import pg from "pg";

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432", 10),
  database: process.env.PGDATABASE || "wpi_content",
  user: process.env.PGUSER || "wpi_user",
  password: process.env.PGPASSWORD || "",
  max: 10,
});

/**
 * Wait for PostgreSQL to become reachable, retrying every 2 s up to maxWaitMs.
 * Useful inside Docker Compose where the DB container may start after the API.
 */
export async function waitForDb(maxWaitMs = 30000) {
  const start = Date.now();
  const interval = 2000;

  while (Date.now() - start < maxWaitMs) {
    try {
      const client = await pool.connect();
      client.release();
      console.log("[db] PostgreSQL connection established");
      return;
    } catch (err) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(
        `[db] Waiting for PostgreSQL... (${elapsed}s elapsed) — ${err.message}`
      );
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  throw new Error(`[db] Could not connect to PostgreSQL within ${maxWaitMs} ms`);
}

export default pool;
