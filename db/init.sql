-- WPI Content Factory Database Schema
-- Auto-created on first MySQL container start

CREATE DATABASE IF NOT EXISTS wpi_content;
USE wpi_content;

-- Jobs: workflow execution tracking
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(36) PRIMARY KEY,
  syllabus_name VARCHAR(255),
  strategy VARCHAR(50),
  target_audience VARCHAR(100),
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  total_chapters INT DEFAULT 0,
  completed_chapters INT DEFAULT 0,
  current_workflow VARCHAR(50) DEFAULT NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Workflow logs: per-workflow execution log
CREATE TABLE IF NOT EXISTS workflow_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  workflow_name VARCHAR(100) NOT NULL,
  chapter_id VARCHAR(20) DEFAULT NULL,
  status ENUM('started', 'completed', 'failed') DEFAULT 'started',
  input_summary TEXT DEFAULT NULL,
  output_summary TEXT DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  duration_ms INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Books: completed book storage
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  json_content JSON NOT NULL,
  exam_questions JSON DEFAULT NULL,
  global_history TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Chapters: individual chapter storage
CREATE TABLE IF NOT EXISTS chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT DEFAULT NULL,
  job_id VARCHAR(36) NOT NULL,
  chapter_id VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  chapter_index INT NOT NULL,
  json_content JSON NOT NULL,
  exam_questions JSON DEFAULT NULL,
  chapter_summary TEXT DEFAULT NULL,
  editor_score INT DEFAULT NULL,
  status ENUM('draft', 'approved') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_workflow_logs_job_id ON workflow_logs(job_id);
CREATE INDEX idx_books_job_id ON books(job_id);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_chapters_job_id ON chapters(job_id);
