"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIngestionDb = getIngestionDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
class IngestionDatabase {
    db;
    initialized = false;
    constructor() {
        const dbPath = process.env.INGESTION_DB_PATH || path_1.default.join(process.cwd(), 'data', 'ingestion.db');
        console.log(`Initializing ingestion database at: ${dbPath}`);
        // Ensure directory exists
        const dir = path_1.default.dirname(dbPath);
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.db = new better_sqlite3_1.default(dbPath);
        this.init();
    }
    init() {
        if (this.initialized)
            return;
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
    addFile(input) {
        const status = input.chunksErrored === 0 ? 'completed' :
            input.chunksIngested > 0 ? 'partial' : 'failed';
        const stmt = this.db.prepare(`
      INSERT INTO ingested_files (
        file_name, title, file_size, file_type,
        chunks_created, chunks_ingested, chunks_errored,
        domain_id, topic_id, category, language, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(input.fileName, input.title, input.fileSize, input.fileType, input.chunksCreated, input.chunksIngested, input.chunksErrored, input.domainId || null, input.topicId || null, input.category || null, input.language, status);
        return this.getFile(result.lastInsertRowid);
    }
    getFile(id) {
        const stmt = this.db.prepare(`
      SELECT
        id, file_name as fileName, title, file_size as fileSize, file_type as fileType,
        chunks_created as chunksCreated, chunks_ingested as chunksIngested,
        chunks_errored as chunksErrored, domain_id as domainId, topic_id as topicId,
        category, language, status, created_at as createdAt, updated_at as updatedAt
      FROM ingested_files WHERE id = ?
    `);
        return stmt.get(id);
    }
    listFiles(options = {}) {
        const { limit = 50, offset = 0, category, status } = options;
        let whereClause = '';
        const params = [];
        if (category || status) {
            const conditions = [];
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
        const countResult = countStmt.get(...params);
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
        const files = stmt.all(...params, limit, offset);
        return { files, total: countResult.count };
    }
    deleteFile(id) {
        const stmt = this.db.prepare('DELETE FROM ingested_files WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    getStats() {
        const totalStmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalFiles,
        COALESCE(SUM(chunks_ingested), 0) as totalChunks
      FROM ingested_files
    `);
        const totals = totalStmt.get();
        const categoryStmt = this.db.prepare(`
      SELECT COALESCE(category, 'Uncategorized') as category, COUNT(*) as count
      FROM ingested_files GROUP BY category ORDER BY count DESC
    `);
        const byCategory = categoryStmt.all();
        const statusStmt = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM ingested_files GROUP BY status
    `);
        const byStatus = statusStmt.all();
        return {
            totalFiles: totals.totalFiles,
            totalChunks: totals.totalChunks,
            byCategory,
            byStatus,
        };
    }
    close() {
        this.db.close();
    }
}
// Singleton instance
let instance = null;
function getIngestionDb() {
    if (!instance) {
        instance = new IngestionDatabase();
    }
    return instance;
}
//# sourceMappingURL=ingestion-db.js.map