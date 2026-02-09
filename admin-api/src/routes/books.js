import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/books — create a new book
router.post("/books", async (req, res) => {
  try {
    const { job_id, title, json_content, exam_questions } = req.body;

    if (!job_id || !title) {
      return res.status(400).json({ error: "job_id and title are required" });
    }

    const jsonContentStr = json_content ? JSON.stringify(json_content) : null;
    const examQuestionsStr = exam_questions
      ? JSON.stringify(exam_questions)
      : null;

    const { rows: insertRows } = await pool.query(
      `INSERT INTO books (job_id, title, json_content, exam_questions)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [job_id, title, jsonContentStr, examQuestionsStr]
    );

    const { rows } = await pool.query("SELECT * FROM books WHERE id = $1", [
      insertRows[0].id,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[books] POST /books error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books — list all books with chapter count
router.get("/books", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, COUNT(c.id)::int AS chapter_count
       FROM books b
       LEFT JOIN chapters c ON c.book_id = b.id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("[books] GET /books error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books/by-job/:jobId — find book by job_id
router.get("/books/by-job/:jobId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM books WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1",
      [req.params.jobId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "No book found for this job" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[books] GET /books/by-job/:jobId error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books/:id — get single book with all its chapters
router.get("/books/:id", async (req, res) => {
  try {
    const { rows: bookRows } = await pool.query("SELECT * FROM books WHERE id = $1", [
      req.params.id,
    ]);
    if (bookRows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    const { rows: chapterRows } = await pool.query(
      "SELECT * FROM chapters WHERE book_id = $1 ORDER BY chapter_index",
      [req.params.id]
    );

    res.json({ ...bookRows[0], chapters: chapterRows });
  } catch (err) {
    console.error("[books] GET /books/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
