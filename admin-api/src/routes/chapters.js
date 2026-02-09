import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST /api/chapters — create a chapter
router.post("/chapters", async (req, res) => {
  try {
    const {
      book_id,
      job_id,
      chapter_id,
      title,
      chapter_index,
      json_content,
      exam_questions,
      chapter_summary,
      editor_score,
    } = req.body;

    if (!book_id || !job_id || !title) {
      return res
        .status(400)
        .json({ error: "book_id, job_id, and title are required" });
    }

    const jsonContentStr = json_content ? JSON.stringify(json_content) : null;
    const examQuestionsStr = exam_questions
      ? JSON.stringify(exam_questions)
      : null;

    const { rows: insertRows } = await pool.query(
      `INSERT INTO chapters (book_id, job_id, chapter_id, title, chapter_index, json_content, exam_questions, chapter_summary, editor_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        book_id,
        job_id,
        chapter_id || null,
        title,
        chapter_index || 0,
        jsonContentStr,
        examQuestionsStr,
        chapter_summary || null,
        editor_score || null,
      ]
    );

    const { rows } = await pool.query("SELECT * FROM chapters WHERE id = $1", [
      insertRows[0].id,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[chapters] POST /chapters error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/chapters/:id — get single chapter
router.get("/chapters/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM chapters WHERE id = $1", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[chapters] GET /chapters/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/books/:bookId/chapters — list chapters for a book
router.get("/books/:bookId/chapters", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM chapters WHERE book_id = $1 ORDER BY chapter_index",
      [req.params.bookId]
    );
    res.json(rows);
  } catch (err) {
    console.error("[chapters] GET /books/:bookId/chapters error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
