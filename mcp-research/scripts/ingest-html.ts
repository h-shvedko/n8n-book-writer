#!/usr/bin/env tsx
/**
 * Semantic HTML Ingestion Script for WPI Content Factory
 *
 * Ingests HTML content using Mozilla Readability for semantic extraction,
 * converts to Markdown for better LLM comprehension, chunks intelligently,
 * and stores in Qdrant vector database with OpenAI embeddings.
 *
 * Usage:
 *   npm run ingest-html <html-file-path> [options]
 *
 * Options:
 *   --domain-id <id>      WPI domain ID (e.g., D1, D2)
 *   --topic-id <id>       WPI topic ID (e.g., D1.1)
 *   --category <cat>      Category (e.g., "Legacy Material", "SEO Foundations")
 *   --language <lang>     Language code (default: de)
 *   --chunk-size <n>      Chunk size in characters (default: 2000)
 *   --chunk-overlap <n>   Chunk overlap in characters (default: 300)
 *
 * Example:
 *   npm run ingest-html ./assets/rag-content-seo.html --domain-id D1 --category "Legacy Material"
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractForRAG, extractSectionsFromHTML } from '../src/services/html-extractor';
import { getQdrantService } from '../src/services/qdrant-service';
import { createWpiTextSplitter, RecursiveCharacterTextSplitter } from '../src/services/text-splitter';

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
  useSections?: boolean;  // Use parent-child sectioning
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
    useSections: false,
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
      case '--use-sections':
        options.useSections = value === 'true';
        i--; // No value needed for this flag
        break;
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Semantic HTML Ingestion Script
==============================

Usage:
  npm run ingest-html <html-file-path> [options]

Options:
  --domain-id <id>      WPI domain ID (e.g., D1, D2)
  --topic-id <id>       WPI topic ID (e.g., D1.1)
  --category <cat>      Category (e.g., "Legacy Material")
  --language <lang>     Language code (default: de)
  --chunk-size <n>      Chunk size in characters (default: 2000)
  --chunk-overlap <n>   Chunk overlap in characters (default: 300)
  --use-sections        Extract by HTML sections with parent-child links

Examples:
  npm run ingest-html ./assets/rag-content-seo.html
  npm run ingest-html ./data/seo-guide.html --domain-id D1 --category "SEO Foundations"
  npm run ingest-html ./data/technical-doc.html --use-sections --chunk-size 1500
`);
}

/**
 * Main ingestion function with semantic extraction
 */
async function ingestHTML(options: IngestionOptions): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('  Semantic HTML Ingestion for WPI Content Factory');
  console.log('='.repeat(60) + '\n');

  // Validate file exists
  const absolutePath = path.resolve(options.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const fileName = path.basename(absolutePath);
  console.log(`File: ${fileName}`);
  console.log(`Path: ${absolutePath}\n`);

  // Read HTML content
  console.log('[1/5] Reading HTML file...');
  const htmlContent = fs.readFileSync(absolutePath, 'utf-8');
  console.log(`      Read ${(htmlContent.length / 1024).toFixed(1)} KB\n`);

  // Extract content using semantic extraction
  console.log('[2/5] Extracting content with Mozilla Readability...');
  const extracted = extractForRAG(htmlContent);
  console.log(`      Title: ${extracted.metadata.title}`);
  console.log(`      Author: ${extracted.metadata.author || 'Unknown'}`);
  console.log(`      Word count: ${extracted.metadata.wordCount}`);
  console.log(`      Format: ${extracted.metadata.format}\n`);

  // Chunk the content
  console.log(`[3/5] Chunking content (size: ${options.chunkSize}, overlap: ${options.chunkOverlap})...`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options.chunkSize!,
    chunkOverlap: options.chunkOverlap!,
  });

  const baseMetadata = {
    source: fileName,
    title: extracted.metadata.title,
    author: extracted.metadata.author || undefined,
    document_type: 'html',
    domain_id: options.domainId,
    topic_id: options.topicId,
    tags: options.category ? [options.category] : [],
    language: options.language || 'de',
  };

  const chunks = splitter.splitText(extracted.text, baseMetadata);
  console.log(`      Created ${chunks.length} chunks\n`);

  // Connect to Qdrant
  console.log('[4/5] Connecting to Qdrant...');
  const qdrant = getQdrantService();
  const status = await qdrant.getStatus();

  if (status.status === 'unavailable') {
    throw new Error(`Qdrant unavailable: ${status.error}`);
  }

  console.log(`      Status: ${status.status.toUpperCase()}`);
  console.log(`      Collection: ${process.env.QDRANT_COLLECTION || 'wpi_content'}`);
  console.log(`      Existing documents: ${status.document_count}\n`);

  // Ingest chunks
  console.log('[5/5] Ingesting into Qdrant with OpenAI embeddings...');
  console.log(`      Model: ${process.env.EMBEDDING_MODEL || 'text-embedding-3-small'}\n`);

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  // Use batch ingestion for efficiency
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));

    for (const chunk of batch) {
      try {
        // Add category metadata
        const metadata = {
          ...chunk.metadata,
          category: options.category || 'Legacy Material',
        };

        await qdrant.ingestAndEmbed(chunk.text, metadata);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`      Error on chunk ${i}: ${error}`);
      }
    }

    // Progress indicator
    const progress = ((Math.min(i + batchSize, chunks.length)) / chunks.length * 100).toFixed(1);
    process.stdout.write(`\r      Progress: ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks (${progress}%)`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n      Completed in ${duration}s\n`);

  // Final summary
  console.log('=' .repeat(60));
  console.log('  INGESTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`  File:          ${fileName}`);
  console.log(`  Format:        HTML -> Markdown`);
  console.log(`  Chunks:        ${successCount} success, ${errorCount} errors`);
  console.log(`  Category:      ${options.category || 'Legacy Material'}`);
  console.log(`  Domain ID:     ${options.domainId || 'N/A'}`);
  console.log(`  Topic ID:      ${options.topicId || 'N/A'}`);

  // Get final status
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
    await ingestHTML(options);
    process.exit(0);
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);

export { ingestHTML };
