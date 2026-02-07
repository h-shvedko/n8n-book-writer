import express from "express";
import cors from "cors";
import { waitForDb } from "./db.js";
import jobsRouter from "./routes/jobs.js";
import booksRouter from "./routes/books.js";
import chaptersRouter from "./routes/chapters.js";
import logsRouter from "./routes/logs.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3005", 10);
const API_TOKEN = process.env.API_TOKEN || "";

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check — no auth required
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Bearer-token auth for everything under /api
app.use("/api", (req, res, next) => {
  if (!API_TOKEN) {
    // No token configured — allow all requests (dev mode)
    return next();
  }

  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ") || header.slice(7) !== API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api", jobsRouter);
app.use("/api", booksRouter);
app.use("/api", chaptersRouter);
app.use("/api", logsRouter);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function start() {
  try {
    await waitForDb();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[admin-api] Listening on http://0.0.0.0:${PORT}`);
  });
}

start();
