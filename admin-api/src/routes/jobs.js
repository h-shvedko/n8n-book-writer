import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/jobs — create a new job
router.post("/jobs", async (req, res) => {
  try {
    const { id, syllabus_name, strategy, target_audience, total_chapters } =
      req.body;

    if (!id || !syllabus_name) {
      return res
        .status(400)
        .json({ error: "id and syllabus_name are required" });
    }

    await pool.execute(
      `INSERT INTO jobs (id, syllabus_name, strategy, target_audience, total_chapters, status, started_at)
       VALUES (?, ?, ?, ?, ?, 'running', NOW())`,
      [id, syllabus_name, strategy || null, target_audience || null, total_chapters || 0]
    );

    const [rows] = await pool.execute("SELECT * FROM jobs WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[jobs] POST /jobs error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/jobs — list all jobs
router.get("/jobs", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM jobs ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("[jobs] GET /jobs error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/jobs/:id — get a single job
router.get("/jobs/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM jobs WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[jobs] GET /jobs/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/jobs/:id — update job fields
router.patch("/jobs/:id", async (req, res) => {
  try {
    const allowedFields = [
      "status",
      "completed_chapters",
      "current_workflow",
      "completed_at",
    ];

    const sets = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(req.params.id);
    await pool.execute(
      `UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`,
      values
    );

    const [rows] = await pool.execute("SELECT * FROM jobs WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[jobs] PATCH /jobs/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
