#!/usr/bin/env tsx
/**
 * Markdown Ingestion Script for WPI Content Factory
 *
 * Ingests Markdown content directly (no HTML extraction needed),
 * chunks intelligently, and stores in Qdrant vector database with OpenAI embeddings.
 *
 * Usage:
 *   npm run ingest-md <md-file-path> [options]
 *
 * Options:
 *   --domain-id <id>      WPI domain ID (e.g., D1, D2)
 *   --topic-id <id>       WPI topic ID (e.g., D1.1)
 *   --category <cat>      Category (e.g., "Editorial Guide", "Legacy Material")
 *   --language <lang>     Language code (default: de)
 *   --chunk-size <n>      Chunk size in characters (default: 2000)
 *   --chunk-overlap <n>   Chunk overlap in characters (default: 300)
 *
 * Example:
 *   npm run ingest-md ./assets/editorial-guide.md --category "Editorial Guide"
 */

import * as fs from 'fs';
import * as path from 'path';
import { getQdrantService } from '../src/services/qdrant-service';
import { RecursiveCharacterTextSplitter } from '../src/services/text-splitter';

// Load environment variables
import 'dotenv/config';

interface IngestionOptions {
  filePath: string;
  domainId?: string;
  topicId?: string;
  category?: string;
  language?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): IngestionOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: No file path provided\n');
    printUsage();
    process.exit(1);
  }

  const options: IngestionOptions = {
    filePath: args[0],
    language: 'de',
    chunkSize: 2000,
    chunkOverlap: 300,
  };

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--domain-id':
        options.domainId = value;
        break;
      case '--topic-id':
        options.topicId = value;
        break;
      case '--category':
        options.category = value;
        break;
      case '--language':
        options.language = value;
        break;
      case '--chunk-size':
        options.chunkSize = parseInt(value, 10);
        break;
      case '--chunk-overlap':
        options.chunkOverlap = parseInt(value, 10);
        break;
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Markdown Ingestion Script
=========================

Usage:
  npm run ingest-md <md-file-path> [options]

Options:
  --domain-id <id>      WPI domain ID (e.g., D1, D2)
  --topic-id <id>       WPI topic ID (e.g., D1.1)
  --category <cat>      Category (e.g., "Editorial Guide")
  --language <lang>     Language code (default: de)
  --chunk-size <n>      Chunk size in characters (default: 2000)
  --chunk-overlap <n>   Chunk overlap in characters (default: 300)

Examples:
  npm run ingest-md ./assets/editorial-guide.md
  npm run ingest-md ./data/guide.md --domain-id D1 --category "Editorial Guide"
`);
}

/**
 * Extract title from markdown content (first # heading)
 */
function extractTitle(content: string, fileName: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : path.basename(fileName, path.extname(fileName));
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Main ingestion function for Markdown files
 */
async function ingestMarkdown(options: IngestionOptions): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('  Markdown Ingestion for WPI Content Factory');
  console.log('='.repeat(60) + '\n');

  // Validate file exists
  const absolutePath = path.resolve(options.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const fileName = path.basename(absolutePath);
  console.log(`File: ${fileName}`);
  console.log(`Path: ${absolutePath}\n`);

  // Read markdown content
  console.log('[1/4] Reading Markdown file...');
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const title = extractTitle(content, fileName);
  const wordCount = countWords(content);
  console.log(`      Title: ${title}`);
  console.log(`      Word count: ${wordCount}`);
  console.log(`      Size: ${(content.length / 1024).toFixed(1)} KB\n`);

  // Chunk the content
  console.log(`[2/4] Chunking content (size: ${options.chunkSize}, overlap: ${options.chunkOverlap})...`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options.chunkSize!,
    chunkOverlap: options.chunkOverlap!,
  });

  const baseMetadata = {
    source: fileName,
    title,
    document_type: 'markdown',
    domain_id: options.domainId,
    topic_id: options.topicId,
    tags: options.category ? [options.category] : [],
    language: options.language || 'de',
  };

  const chunks = splitter.splitText(content, baseMetadata);
  console.log(`      Created ${chunks.length} chunks\n`);

  // Connect to Qdrant
  console.log('[3/4] Connecting to Qdrant...');
  const qdrant = getQdrantService();
  const status = await qdrant.getStatus();

  if (status.status === 'unavailable') {
    throw new Error(`Qdrant unavailable: ${status.error}`);
  }

  console.log(`      Status: ${status.status.toUpperCase()}`);
  console.log(`      Collection: ${process.env.QDRANT_COLLECTION || 'wpi_content'}`);
  console.log(`      Existing documents: ${status.document_count}\n`);

  // Ingest chunks
  console.log('[4/4] Ingesting into Qdrant with OpenAI embeddings...');
  console.log(`      Model: ${process.env.EMBEDDING_MODEL || 'text-embedding-3-small'}\n`);

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));

    for (const chunk of batch) {
      try {
        const metadata = {
          ...chunk.metadata,
          category: options.category || 'Uncategorized',
        };

        await qdrant.ingestAndEmbed(chunk.text, metadata);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`      Error on chunk ${i}: ${error}`);
      }
    }

    const progress = ((Math.min(i + batchSize, chunks.length)) / chunks.length * 100).toFixed(1);
    process.stdout.write(`\r      Progress: ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks (${progress}%)`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n      Completed in ${duration}s\n`);

  // Final summary
  console.log('='.repeat(60));
  console.log('  INGESTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`  File:          ${fileName}`);
  console.log(`  Format:        Markdown (direct)`);
  console.log(`  Chunks:        ${successCount} success, ${errorCount} errors`);
  console.log(`  Category:      ${options.category || 'Uncategorized'}`);
  console.log(`  Domain ID:     ${options.domainId || 'N/A'}`);
  console.log(`  Topic ID:      ${options.topicId || 'N/A'}`);

  const finalStatus = await qdrant.getStatus();
  console.log(`\n  Qdrant Status: ${finalStatus.status.toUpperCase()}`);
  console.log(`  Total Docs:    ${finalStatus.document_count}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount > 0) {
    console.log(`WARNING: ${errorCount} chunks failed to ingest\n`);
  } else {
    console.log('SUCCESS: All chunks ingested successfully!\n');
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  try {
    const options = parseArgs();
    await ingestMarkdown(options);
    process.exit(0);
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  }
}

main().catch(console.error);

export { ingestMarkdown };
