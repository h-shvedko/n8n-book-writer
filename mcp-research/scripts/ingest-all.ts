#!/usr/bin/env tsx
/**
 * Batch Ingestion Script for WPI Content Factory
 *
 * Ingests all available RAG source materials into Qdrant with correct domain mappings.
 * Skips files that have already been ingested (idempotent via ingestion DB check).
 *
 * Usage:
 *   npm run ingest-all [--force]
 *
 * Options:
 *   --force    Re-ingest files even if they were previously ingested
 */

import * as fs from 'fs';
import * as path from 'path';
import { ingestHTML } from './ingest-html';
import { ingestMarkdown } from './ingest-md';
import { getIngestionDb } from '../src/services/ingestion-db';
import { getQdrantService } from '../src/services/qdrant-service';

// Load environment variables
import 'dotenv/config';

/**
 * Source material definitions with domain mappings.
 * Each entry specifies a file to ingest and its metadata.
 */
interface SourceDefinition {
  /** Relative path from project root */
  relativePath: string;
  /** File format: html or md */
  format: 'html' | 'md';
  /** WPI domain ID (optional — omit for broad/cross-domain content) */
  domainId?: string;
  /** WPI topic ID (optional) */
  topicId?: string;
  /** Content category for filtering */
  category: string;
  /** Language code */
  language: string;
  /** Description for logging */
  description: string;
}

const SOURCES: SourceDefinition[] = [
  {
    relativePath: 'assets/21012026-CEO assets iteration 1/rag-content-seo.html',
    format: 'html',
    // No domain_id — broad SEO content covers many domains
    category: 'Legacy Material',
    language: 'de',
    description: 'SEO reference material (broad, covers domains 1.x-3.x)',
  },
  {
    relativePath: 'assets/21012026-CEO assets iteration 1/kapitel1.html',
    format: 'html',
    domainId: 'domain-1.1',
    category: 'Legacy Material',
    language: 'de',
    description: 'Chapter 1 legacy content (domain 1.1: Foundations)',
  },
  {
    relativePath: 'assets/21012026-CEO assets iteration 1/INTERNAL DOCUMENT_ WPI Editorial Guide 2.9.md',
    format: 'md',
    // No domain_id — editorial guide is cross-domain system context
    category: 'Editorial Guide',
    language: 'de',
    description: 'WPI Editorial Guide v2.9 (tone of voice, quality standards)',
  },
];

/** Project root: two levels up from mcp-research/scripts/ */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

async function ingestAll(): Promise<void> {
  const forceMode = process.argv.includes('--force');

  console.log('\n' + '='.repeat(70));
  console.log('  WPI RAG Batch Ingestion');
  console.log('='.repeat(70));
  console.log(`  Mode:    ${forceMode ? 'FORCE (re-ingest all)' : 'Normal (skip already ingested)'}`);
  console.log(`  Sources: ${SOURCES.length} files defined`);
  console.log(`  Date:    ${new Date().toISOString().split('T')[0]}`);
  console.log('='.repeat(70) + '\n');

  // Check Qdrant connection
  const qdrant = getQdrantService();
  const status = await qdrant.getStatus();
  if (status.status === 'unavailable') {
    console.error('ERROR: Qdrant is unavailable. Start it with: docker compose up -d qdrant mcp-research');
    process.exit(1);
  }
  console.log(`Qdrant: ${status.status.toUpperCase()} (${status.document_count} existing vectors)\n`);

  // Check ingestion DB for already-ingested files
  const ingestionDb = getIngestionDb();

  const results: Array<{
    file: string;
    status: 'ingested' | 'skipped' | 'failed';
    chunks?: number;
    error?: string;
  }> = [];

  for (let i = 0; i < SOURCES.length; i++) {
    const source = SOURCES[i];
    const absolutePath = path.resolve(PROJECT_ROOT, source.relativePath);
    const fileName = path.basename(absolutePath);

    console.log(`[${i + 1}/${SOURCES.length}] ${source.description}`);
    console.log(`         File: ${fileName}`);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.log(`         SKIPPED: File not found at ${absolutePath}\n`);
      results.push({ file: fileName, status: 'failed', error: 'File not found' });
      continue;
    }

    // Check if already ingested
    if (!forceMode) {
      const existingFiles = ingestionDb.listFiles({ limit: 1000 });
      const alreadyIngested = existingFiles.files.find(
        f => f.fileName === fileName && f.status === 'completed'
      );

      if (alreadyIngested) {
        console.log(`         SKIPPED: Already ingested (${alreadyIngested.chunksIngested} chunks, ${alreadyIngested.createdAt})\n`);
        results.push({ file: fileName, status: 'skipped' });
        continue;
      }
    }

    // Ingest the file
    try {
      if (source.format === 'html') {
        await ingestHTML({
          filePath: absolutePath,
          domainId: source.domainId,
          topicId: source.topicId,
          category: source.category,
          language: source.language,
          chunkSize: 2000,
          chunkOverlap: 300,
        });
      } else {
        await ingestMarkdown({
          filePath: absolutePath,
          domainId: source.domainId,
          topicId: source.topicId,
          category: source.category,
          language: source.language,
          chunkSize: 2000,
          chunkOverlap: 300,
        });
      }

      results.push({ file: fileName, status: 'ingested' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`         FAILED: ${errorMsg}\n`);
      results.push({ file: fileName, status: 'failed', error: errorMsg });
    }
  }

  // Final summary
  const finalStatus = await qdrant.getStatus();
  const ingested = results.filter(r => r.status === 'ingested').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log('\n' + '='.repeat(70));
  console.log('  BATCH INGESTION SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Ingested:  ${ingested} files`);
  console.log(`  Skipped:   ${skipped} files (already in DB)`);
  console.log(`  Failed:    ${failed} files`);
  console.log(`  Total Vectors: ${finalStatus.document_count}`);
  console.log('');

  if (failed > 0) {
    console.log('  Failed files:');
    for (const r of results.filter(r => r.status === 'failed')) {
      console.log(`    - ${r.file}: ${r.error}`);
    }
    console.log('');
  }

  console.log('  Next step: npm run verify-ingestion');
  console.log('='.repeat(70) + '\n');
}

/**
 * CLI Entry Point
 */
async function main() {
  try {
    await ingestAll();
    process.exit(0);
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  }
}

main().catch(console.error);
