-- WPI Content Factory Database Schema
-- Auto-created on first PostgreSQL container start

-- Jobs: workflow execution tracking
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(36) PRIMARY KEY,
  syllabus_name VARCHAR(255),
  strategy VARCHAR(50),
  target_audience VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_chapters INT DEFAULT 0,
  completed_chapters INT DEFAULT 0,
  current_workflow VARCHAR(50) DEFAULT NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow logs: per-workflow execution log
CREATE TABLE IF NOT EXISTS workflow_logs (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  workflow_name VARCHAR(100) NOT NULL,
  chapter_id VARCHAR(20) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed')),
  input_summary TEXT DEFAULT NULL,
  output_summary TEXT DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  duration_ms INT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Books: completed book storage
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  json_content JSONB NOT NULL,
  exam_questions JSONB DEFAULT NULL,
  global_history TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Chapters: individual chapter storage
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  book_id INT DEFAULT NULL,
  job_id VARCHAR(36) NOT NULL,
  chapter_id VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  chapter_index INT NOT NULL,
  json_content JSONB NOT NULL,
  exam_questions JSONB DEFAULT NULL,
  chapter_summary TEXT DEFAULT NULL,
  editor_score INT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_job_id ON workflow_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_books_job_id ON books(job_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_job_id ON chapters(job_id);

-- Trigger function to auto-update updated_at column
-- (replaces MySQL's ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to jobs table
DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to chapters table
DROP TRIGGER IF EXISTS trg_chapters_updated_at ON chapters;
CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
