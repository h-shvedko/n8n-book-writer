import Database from 'better-sqlite3';
import { Syllabus, SyllabusSchema } from '../types/syllabus';

export interface SyllabusSummary {
  id: string;
  name: string;
  version: string;
  certificationBody: string;
  domainCount: number;
  lastUpdated: string;
  createdAt: string;
}

export class SyllabusDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    console.log(`Initializing syllabus database at: ${dbPath}`);
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS syllabuses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        certification_body TEXT NOT NULL,
        iso_standard TEXT NOT NULL,
        last_updated TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_syllabuses_name ON syllabuses(name);
      CREATE INDEX IF NOT EXISTS idx_syllabuses_updated ON syllabuses(updated_at);
    `);
  }

  /**
   * List all syllabuses (summary only)
   */
  listSyllabuses(): SyllabusSummary[] {
    const stmt = this.db.prepare(`
      SELECT id, name, version, certification_body, iso_standard, last_updated, created_at, data
      FROM syllabuses
      ORDER BY updated_at DESC
    `);

    const rows = stmt.all() as Array<{
      id: string;
      name: string;
      version: string;
      certification_body: string;
      last_updated: string;
      created_at: string;
      data: string;
    }>;

    return rows.map(row => {
      const syllabus = JSON.parse(row.data) as Syllabus;
      return {
        id: row.id,
        name: row.name,
        version: row.version,
        certificationBody: row.certification_body,
        domainCount: syllabus.domains?.length || 0,
        lastUpdated: row.last_updated,
        createdAt: row.created_at,
      };
    });
  }

  /**
   * Get a syllabus by ID
   */
  getSyllabus(id: string): Syllabus | null {
    const stmt = this.db.prepare('SELECT data FROM syllabuses WHERE id = ?');
    const row = stmt.get(id) as { data: string } | undefined;

    if (!row) {
      return null;
    }

    return JSON.parse(row.data) as Syllabus;
  }

  /**
   * Create or update a syllabus
   */
  saveSyllabus(syllabus: Syllabus): void {
    // Validate syllabus data
    const validated = SyllabusSchema.parse(syllabus);

    const stmt = this.db.prepare(`
      INSERT INTO syllabuses (id, name, version, certification_body, iso_standard, last_updated, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        version = excluded.version,
        certification_body = excluded.certification_body,
        iso_standard = excluded.iso_standard,
        last_updated = excluded.last_updated,
        data = excluded.data,
        updated_at = datetime('now')
    `);

    stmt.run(
      validated.id,
      validated.name,
      validated.version,
      validated.certificationBody,
      validated.isoStandard,
      validated.lastUpdated,
      JSON.stringify(validated)
    );
  }

  /**
   * Delete a syllabus
   */
  deleteSyllabus(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM syllabuses WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Create a new syllabus with default structure
   */
  createSyllabus(name: string, certificationBody: string): Syllabus {
    const id = `syllabus-${Date.now()}`;
    const syllabus: Syllabus = {
      id,
      name,
      version: '1.0.0',
      certificationBody,
      isoStandard: 'ISO/IEC 17024',
      lastUpdated: new Date().toISOString(),
      domains: [],
    };

    this.saveSyllabus(syllabus);
    return syllabus;
  }

  /**
   * Duplicate a syllabus
   */
  duplicateSyllabus(sourceId: string, newName: string): Syllabus | null {
    const source = this.getSyllabus(sourceId);
    if (!source) {
      return null;
    }

    const newId = `syllabus-${Date.now()}`;
    const duplicate: Syllabus = {
      ...source,
      id: newId,
      name: newName,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };

    this.saveSyllabus(duplicate);
    return duplicate;
  }

  /**
   * Get syllabus count
   */
  getCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM syllabuses');
    const row = stmt.get() as { count: number };
    return row.count;
  }

  close(): void {
    this.db.close();
  }
}

// Singleton instance - initialized lazily
let syllabusDb: SyllabusDatabase | null = null;

export function getSyllabusDb(): SyllabusDatabase {
  if (!syllabusDb) {
    const dbPath = process.env.SYLLABUS_DB_PATH || './data/syllabuses.db';
    syllabusDb = new SyllabusDatabase(dbPath);
  }
  return syllabusDb;
}
