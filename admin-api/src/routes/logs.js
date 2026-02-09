import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/logs — create a log entry
router.post("/logs", async (req, res) => {
  try {
    const {
      job_id,
      workflow_name,
      chapter_id,
      status,
      input_summary,
      output_summary,
      error_message,
      duration_ms,
    } = req.body;

    if (!job_id || !workflow_name) {
      return res
        .status(400)
        .json({ error: "job_id and workflow_name are required" });
    }

    const { rows: insertRows } = await pool.query(
      `INSERT INTO workflow_logs (job_id, workflow_name, chapter_id, status, input_summary, output_summary, error_message, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        job_id,
        workflow_name,
        chapter_id || null,
        status || null,
        input_summary || null,
        output_summary || null,
        error_message || null,
        duration_ms || null,
      ]
    );

    const { rows } = await pool.query(
      "SELECT * FROM workflow_logs WHERE id = $1",
      [insertRows[0].id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[logs] POST /logs error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/jobs/:jobId/logs — get all logs for a job
router.get("/jobs/:jobId/logs", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM workflow_logs WHERE job_id = $1 ORDER BY created_at ASC",
      [req.params.jobId]
    );
    res.json(rows);
  } catch (err) {
    console.error("[logs] GET /jobs/:jobId/logs error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
