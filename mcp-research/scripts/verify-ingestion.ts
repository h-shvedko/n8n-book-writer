#!/usr/bin/env tsx
/**
 * RAG Ingestion Verification Script for WPI Content Factory
 *
 * Queries Qdrant and produces a coverage report showing:
 * - Collection health & total vector count
 * - Source file stats (which files, chunk counts)
 * - Domain coverage matrix (for each syllabus domain)
 * - Gap report with color-coded status
 *
 * Usage:
 *   npm run verify-ingestion
 *
 * Requires: Qdrant running at QDRANT_URL (default: http://localhost:6333)
 */

import { getQdrantService } from '../src/services/qdrant-service';

// Load environment variables
import 'dotenv/config';

/** All domains from WPI-SYL-SEOAI-V5.2 syllabus */
const SYLLABUS_DOMAINS = [
  { id: 'domain-1.1', title: 'Foundations – The Architecture of Search', slot: 1, loCount: 6 },
  { id: 'domain-1.2', title: 'Advanced Crawling & Indexing Control', slot: 1, loCount: 5 },
  { id: 'domain-1.3', title: 'Security, Compliance & International Architecture', slot: 1, loCount: 4 },
  { id: 'domain-1.4', title: 'Asset Optimization & Performance', slot: 1, loCount: 3 },
  { id: 'domain-1.5', title: 'Diagnostics & Data Mining', slot: 1, loCount: 6 },
  { id: 'domain-2.1', title: 'Semantic Architecture & On-Page Signals', slot: 2, loCount: 6 },
  { id: 'domain-2.2', title: 'Structured Data Engineering', slot: 2, loCount: 4 },
  { id: 'domain-2.3', title: 'Authority & Trust Strategy', slot: 2, loCount: 6 },
  { id: 'domain-3.1', title: 'AI Search Mechanics', slot: 3, loCount: 4 },
  { id: 'domain-3.2', title: 'Multimodal Content & Formatting', slot: 3, loCount: 6 },
  { id: 'domain-3.3', title: 'Hybrid Metrics & Analysis', slot: 3, loCount: 4 },
  { id: 'domain-3.4', title: 'Strategic Management & Ethics', slot: 3, loCount: 5 },
];

const TOTAL_LOS = SYLLABUS_DOMAINS.reduce((sum, d) => sum + d.loCount, 0);

function statusIcon(count: number): string {
  if (count === 0) return '[NONE]';
  if (count < 5) return '[LOW] ';
  if (count < 15) return '[OK]  ';
  return '[GOOD]';
}

async function verifyIngestion(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('  RAG Ingestion Verification Report');
  console.log('  Syllabus: WPI-SYL-SEOAI-V5.2');
  console.log('  Date: ' + new Date().toISOString().split('T')[0]);
  console.log('='.repeat(70) + '\n');

  const qdrant = getQdrantService();

  // 1. Collection Status
  console.log('1. COLLECTION STATUS');
  console.log('-'.repeat(40));

  const status = await qdrant.getStatus();
  if (status.status === 'unavailable') {
    console.error(`   Qdrant UNAVAILABLE: ${status.error}`);
    console.error('   Make sure Qdrant is running: docker compose up -d qdrant');
    process.exit(1);
  }

  console.log(`   Status:      ${status.status.toUpperCase()}`);
  console.log(`   Connected:   ${status.qdrant_connected ? 'Yes' : 'No'}`);
  console.log(`   Collection:  ${process.env.QDRANT_COLLECTION || 'wpi_content'} (${status.collection_exists ? 'exists' : 'MISSING'})`);
  console.log(`   Total Vectors: ${status.document_count}`);
  console.log('');

  if (!status.collection_exists || status.document_count === 0) {
    console.log('   WARNING: Collection is empty or missing.');
    console.log('   Run: npm run ingest-all  (to ingest all source materials)');
    console.log('');
  }

  // 2. Source Stats
  console.log('2. SOURCE FILES');
  console.log('-'.repeat(40));

  const sourceStats = await qdrant.getSourceStats();
  if (sourceStats.length === 0) {
    console.log('   No source files found in collection.');
  } else {
    console.log(`   ${'Source File'.padEnd(45)} Chunks`);
    console.log(`   ${'─'.repeat(45)} ${'─'.repeat(6)}`);
    for (const stat of sourceStats) {
      console.log(`   ${stat.source.padEnd(45)} ${String(stat.count).padStart(6)}`);
    }
    console.log(`   ${'─'.repeat(45)} ${'─'.repeat(6)}`);
    console.log(`   ${'TOTAL'.padEnd(45)} ${String(sourceStats.reduce((s, x) => s + x.count, 0)).padStart(6)}`);
  }
  console.log('');

  // 3. Domain Coverage
  console.log('3. DOMAIN COVERAGE');
  console.log('-'.repeat(40));
  console.log(`   Syllabus has ${SYLLABUS_DOMAINS.length} domains and ${TOTAL_LOS} Learning Objectives.\n`);

  const domainCoverage: Array<{ domain: typeof SYLLABUS_DOMAINS[0]; chunkCount: number }> = [];

  for (const domain of SYLLABUS_DOMAINS) {
    // Count chunks with this domain_id
    let chunkCount = 0;
    try {
      const result = await qdrant.browseDocuments({
        limit: 1,
        filter: { domain_id: domain.id },
      });
      // browseDocuments returns total count for the entire collection, not filtered
      // So we need to scroll with the filter to count
      const scrollResult = await scrollAndCount(qdrant, domain.id);
      chunkCount = scrollResult;
    } catch {
      chunkCount = 0;
    }

    domainCoverage.push({ domain, chunkCount });
  }

  // Also check for untagged domains (domain_id not set)
  // These are chunks that have general content without a specific domain mapping

  console.log(`   Status  Domain ID     LOs  Chunks  Title`);
  console.log(`   ${'─'.repeat(6)}  ${'─'.repeat(12)}  ${'─'.repeat(3)}  ${'─'.repeat(6)}  ${'─'.repeat(35)}`);

  let totalWithCoverage = 0;
  for (const { domain, chunkCount } of domainCoverage) {
    if (chunkCount > 0) totalWithCoverage++;
    console.log(
      `   ${statusIcon(chunkCount)}  ${domain.id.padEnd(12)}  ${String(domain.loCount).padStart(3)}  ${String(chunkCount).padStart(6)}  ${domain.title}`
    );
  }
  console.log('');
  console.log(`   Coverage: ${totalWithCoverage}/${SYLLABUS_DOMAINS.length} domains have domain-tagged chunks`);

  // Check for untagged content (no domain_id)
  const totalTagged = domainCoverage.reduce((s, d) => s + d.chunkCount, 0);
  const untagged = status.document_count - totalTagged;
  if (untagged > 0) {
    console.log(`   Untagged: ${untagged} chunks without domain_id (broad content, available to all domains)`);
  }
  console.log('');

  // 4. Gap Report
  console.log('4. GAP REPORT');
  console.log('-'.repeat(40));

  const noCoverage = domainCoverage.filter(d => d.chunkCount === 0);
  const lowCoverage = domainCoverage.filter(d => d.chunkCount > 0 && d.chunkCount < 5);

  if (noCoverage.length === 0 && lowCoverage.length === 0) {
    console.log('   All domains have adequate RAG coverage!');
  } else {
    if (noCoverage.length > 0) {
      console.log(`   MISSING (${noCoverage.length} domains with zero domain-tagged chunks):`);
      for (const { domain } of noCoverage) {
        console.log(`     - ${domain.id}: ${domain.title} (${domain.loCount} LOs)`);
      }
      console.log('');
    }
    if (lowCoverage.length > 0) {
      console.log(`   LOW (${lowCoverage.length} domains with <5 domain-tagged chunks):`);
      for (const { domain, chunkCount } of lowCoverage) {
        console.log(`     - ${domain.id}: ${domain.title} (${chunkCount} chunks for ${domain.loCount} LOs)`);
      }
      console.log('');
    }

    if (untagged > 0) {
      console.log(`   NOTE: ${untagged} untagged chunks exist. These are retrieved via hybrid search`);
      console.log('   regardless of domain, providing broad context to all chapters.');
      console.log('');
    }
  }

  // 5. Recommendations
  console.log('5. RECOMMENDATIONS');
  console.log('-'.repeat(40));

  if (status.document_count === 0) {
    console.log('   1. Run: npm run ingest-all');
    console.log('   2. Add domain-specific source materials to assets/ directory');
    console.log('   3. Re-run this verification');
  } else if (noCoverage.length > 0) {
    console.log('   To improve domain-specific coverage:');
    console.log('   1. Add source materials tagged with missing domain_ids');
    console.log('   2. Use: npm run ingest-html <file> --domain-id <domain-id>');
    console.log('   3. Or: npm run ingest-md <file> --domain-id <domain-id>');
    console.log('');
    console.log('   Note: Broad (untagged) content is still used by WF-2 Research');
    console.log('   via hybrid search even without domain-specific tagging.');
  } else {
    console.log('   Ingestion looks healthy. Consider adding more materials for');
    console.log('   domains with low coverage to improve generation quality.');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Scroll through all documents with a domain_id filter and count them
 */
async function scrollAndCount(qdrant: ReturnType<typeof getQdrantService>, domainId: string): Promise<number> {
  let count = 0;
  let offset: string | number | undefined = undefined;

  try {
    // Use the Qdrant client directly through browseDocuments with filter
    // Since browseDocuments doesn't give filtered count, we scroll manually
    const result = await qdrant.browseDocuments({
      limit: 100,
      filter: { domain_id: domainId },
    });
    count = result.documents.length;

    // If there might be more, keep scrolling
    let nextOffset = result.nextOffset;
    while (nextOffset && result.documents.length === 100) {
      const moreResult = await qdrant.browseDocuments({
        limit: 100,
        offset: nextOffset,
        filter: { domain_id: domainId },
      });
      count += moreResult.documents.length;
      nextOffset = moreResult.nextOffset;
      if (moreResult.documents.length < 100) break;
    }
  } catch {
    count = 0;
  }

  return count;
}

/**
 * CLI Entry Point
 */
async function main() {
  try {
    await verifyIngestion();
    process.exit(0);
  } catch (error) {
    console.error('\nFATAL ERROR:', error);
    process.exit(1);
  }
}

main().catch(console.error);
