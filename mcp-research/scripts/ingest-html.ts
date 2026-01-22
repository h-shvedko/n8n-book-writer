#!/usr/bin/env tsx
/**
 * HTML Ingestion Script for WPI Content Factory
 *
 * Ingests HTML content, extracts text using jsdom, chunks it,
 * and stores in Qdrant vector database with OpenAI embeddings.
 *
 * Usage:
 *   npm run ingest-html <html-file-path>
 *
 * Example:
 *   npm run ingest-html ./data/rag-content-seo.html
 */

import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import { getQdrantService } from '../src/services/qdrant-service';

// Configuration
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'wpi_legacy';

interface ChunkMetadata {
  source: string;
  chunk_index: number;
  total_chunks: number;
  document_type: string;
  language: string;
  ingested_at: string;
  original_file: string;
}

/**
 * Extract clean text from HTML using jsdom
 */
function extractTextFromHTML(htmlContent: string): string {
  const dom = new JSDOM(htmlContent);
  const { document } = dom.window;

  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());

  // Get text content
  const text = document.body.textContent || '';

  // Clean up whitespace
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
}

/**
 * Split text into overlapping chunks
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);

    // Only add chunks with meaningful content (> 50 chars)
    if (chunk.trim().length > 50) {
      chunks.push(chunk.trim());
    }

    // Move start position, accounting for overlap
    start = end - overlap;

    // If we're at the end, break to avoid duplicate chunks
    if (end === text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Main ingestion function
 */
async function ingestHTML(filePath: string): Promise<void> {
  console.log('🚀 Starting HTML ingestion...\n');

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  console.log(`📄 File: ${fileName}`);

  // Read HTML content
  console.log('📖 Reading HTML file...');
  const htmlContent = fs.readFileSync(filePath, 'utf-8');

  // Extract text
  console.log('🔍 Extracting text from HTML...');
  const text = extractTextFromHTML(htmlContent);
  console.log(`✅ Extracted ${text.length} characters`);

  // Chunk text
  console.log(`\n📦 Chunking text (size: ${CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP})...`);
  const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
  console.log(`✅ Created ${chunks.length} chunks`);

  // Get Qdrant service
  const qdrant = getQdrantService();

  // Check Qdrant connection
  console.log('\n🔌 Checking Qdrant connection...');
  const status = await qdrant.getStatus();

  if (status.status === 'unavailable') {
    throw new Error(`Qdrant unavailable: ${status.error}`);
  }

  console.log(`✅ Connected to Qdrant`);
  console.log(`   Collection: ${COLLECTION_NAME}`);
  console.log(`   Existing documents: ${status.document_count}`);

  // Ingest chunks
  console.log(`\n💾 Ingesting chunks into Qdrant...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const metadata: ChunkMetadata = {
      source: 'html-ingestion',
      chunk_index: i,
      total_chunks: chunks.length,
      document_type: 'legacy-seo-content',
      language: 'de',
      ingested_at: new Date().toISOString(),
      original_file: fileName,
    };

    try {
      await qdrant.ingestAndEmbed(chunk, metadata);
      successCount++;

      // Progress indicator
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        const progress = ((i + 1) / chunks.length * 100).toFixed(1);
        console.log(`   Progress: ${i + 1}/${chunks.length} chunks (${progress}%)`);
      }
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error ingesting chunk ${i}:`, error);
    }
  }

  // Final status
  console.log('\n📊 Ingestion Summary:');
  console.log(`   ✅ Success: ${successCount} chunks`);
  console.log(`   ❌ Errors: ${errorCount} chunks`);
  console.log(`   📈 Collection now has ~${status.document_count + successCount} documents`);

  // Final Qdrant status
  const finalStatus = await qdrant.getStatus();
  console.log(`\n✨ Final collection status:`);
  console.log(`   Documents: ${finalStatus.document_count}`);
  console.log(`   Status: ${finalStatus.status.toUpperCase()}`);

  console.log('\n✅ Ingestion complete!');
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: No file path provided\n');
    console.log('Usage:');
    console.log('  npm run ingest-html <html-file-path>\n');
    console.log('Example:');
    console.log('  npm run ingest-html ./data/rag-content-seo.html');
    process.exit(1);
  }

  const filePath = args[0];

  try {
    await ingestHTML(filePath);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { ingestHTML, extractTextFromHTML, chunkText };
