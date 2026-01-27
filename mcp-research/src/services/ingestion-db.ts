import Database from 'better-sqlite3';
import path from 'path';

export interface IngestedFile {
  id: number;
  fileName: string;
  title: string;
  fileSize: number;
  fileType: string;
  chunksCreated: number;
  chunksIngested: number;
  chunksErrored: number;
  domainId?: string;
  topicId?: string;
  category?: string;
  language: string;
  status: 'completed' | 'partial' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngestedFileInput {
  fileName: string;
  title: string;
  fileSize: number;
  fileType: string;
  chunksCreated: number;
  chunksIngested: number;
  chunksErrored: number;
  domainId?: string;
  topicId?: string;
  category?: string;
  language: string;
}

class IngestionDatabase {
  private db: Database.Database;
  private initialized = false;

  constructor() {
    const dbPath = process.env.INGESTION_DB_PATH || path.join(process.cwd(), 'data', 'ingestion.db');
    console.log(`Initializing ingestion database at: ${dbPath}`);

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ingested_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        title TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        chunks_created INTEGER NOT NULL DEFAULT 0,
        chunks_ingested INTEGER NOT NULL DEFAULT 0,
        chunks_errored INTEGER NOT NULL DEFAULT 0,
        domain_id TEXT,
        topic_id TEXT,
        category TEXT,
        language TEXT NOT NULL DEFAULT 'de',
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_ingested_files_created_at ON ingested_files(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ingested_files_status ON ingested_files(status);
      CREATE INDEX IF NOT EXISTS idx_ingested_files_category ON ingested_files(category);
    `);

    this.initialized = true;
    console.log('Ingestion database initialized');
  }

  addFile(input: CreateIngestedFileInput): IngestedFile {
    const status = input.chunksErrored === 0 ? 'completed' :
                   input.chunksIngested > 0 ? 'partial' : 'failed';

    const stmt = this.db.prepare(`
      INSERT INTO ingested_files (
        file_name, title, file_size, file_type,
        chunks_created, chunks_ingested, chunks_errored,
        domain_id, topic_id, category, language, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.fileName,
      input.title,
      input.fileSize,
      input.fileType,
      input.chunksCreated,
      input.chunksIngested,
      input.chunksErrored,
      input.domainId || null,
      input.topicId || null,
      input.category || null,
      input.language,
      status
    );

    return this.getFile(result.lastInsertRowid as number)!;
  }

  getFile(id: number): IngestedFile | null {
    const stmt = this.db.prepare(`
      SELECT
        id, file_name as fileName, title, file_size as fileSize, file_type as fileType,
        chunks_created as chunksCreated, chunks_ingested as chunksIngested,
        chunks_errored as chunksErrored, domain_id as domainId, topic_id as topicId,
        category, language, status, created_at as createdAt, updated_at as updatedAt
      FROM ingested_files WHERE id = ?
    `);

    return stmt.get(id) as IngestedFile | null;
  }

  listFiles(options: { limit?: number; offset?: number; category?: string; status?: string } = {}): {
    files: IngestedFile[];
    total: number;
  } {
    const { limit = 50, offset = 0, category, status } = options;

    let whereClause = '';
    const params: unknown[] = [];

    if (category || status) {
      const conditions: string[] = [];
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM ingested_files ${whereClause}`);
    const countResult = countStmt.get(...params) as { count: number };

    // Get files
    const stmt = this.db.prepare(`
      SELECT
        id, file_name as fileName, title, file_size as fileSize, file_type as fileType,
        chunks_created as chunksCreated, chunks_ingested as chunksIngested,
        chunks_errored as chunksErrored, domain_id as domainId, topic_id as topicId,
        category, language, status, created_at as createdAt, updated_at as updatedAt
      FROM ingested_files
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const files = stmt.all(...params, limit, offset) as IngestedFile[];

    return { files, total: countResult.count };
  }

  deleteFile(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM ingested_files WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  getStats(): {
    totalFiles: number;
    totalChunks: number;
    byCategory: { category: string; count: number }[];
    byStatus: { status: string; count: number }[];
  } {
    const totalStmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalFiles,
        COALESCE(SUM(chunks_ingested), 0) as totalChunks
      FROM ingested_files
    `);
    const totals = totalStmt.get() as { totalFiles: number; totalChunks: number };

    const categoryStmt = this.db.prepare(`
      SELECT COALESCE(category, 'Uncategorized') as category, COUNT(*) as count
      FROM ingested_files GROUP BY category ORDER BY count DESC
    `);
    const byCategory = categoryStmt.all() as { category: string; count: number }[];

    const statusStmt = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM ingested_files GROUP BY status
    `);
    const byStatus = statusStmt.all() as { status: string; count: number }[];

    return {
      totalFiles: totals.totalFiles,
      totalChunks: totals.totalChunks,
      byCategory,
      byStatus,
    };
  }

  close(): void {
    this.db.close();
  }
}

// Singleton instance
let instance: IngestionDatabase | null = null;

export function getIngestionDb(): IngestionDatabase {
  if (!instance) {
    instance = new IngestionDatabase();
  }
  return instance;
}
