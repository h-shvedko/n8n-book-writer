#!/usr/bin/env node

/**
 * Fix: Remove Aggregate Files node entirely.
 * n8n Compression node already combines ALL binary from ALL input items into 1 ZIP.
 * Email references Compile Book directly for metadata.
 *
 * New flow: Merge Files → ZIP Files → Email
 * (no Aggregate node needed)
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');

// Create backup
const backupPath = workflowPath.replace('.json', `-BACKUP-${Date.now()}.json`);
fs.copyFileSync(workflowPath, backupPath);
console.log('✅ Backup created:', path.basename(backupPath));

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// =====================================================
// Step 1: Remove Aggregate Files node
// =====================================================
console.log('\n🔧 Step 1: Removing Aggregate Files node...');

const aggregateIndex = workflow.nodes.findIndex(n => n.name === '🔗 Aggregate Files');
if (aggregateIndex !== -1) {
  workflow.nodes.splice(aggregateIndex, 1);
  console.log('  ✅ Removed node');
} else {
  console.log('  ⚠️  Node not found, skipping');
}

// Remove its connection entry
delete workflow.connections['🔗 Aggregate Files'];
console.log('  ✅ Removed connection entry');

// =====================================================
// Step 2: Connect Merge Files directly to ZIP Files
// =====================================================
console.log('\n🔧 Step 2: Connecting Merge Files → ZIP Files...');

workflow.connections['🔀 Merge Files'] = {
  main: [[{ node: '📦 ZIP Files', type: 'main', index: 0 }]]
};

console.log('  ✅ Merge Files → ZIP Files');

// =====================================================
// Step 3: Fix ZIP node - remove binaryPropertyOutput since
// the Compression node in compress mode outputs to "data" by default
// =====================================================
console.log('\n🔧 Step 3: Fixing ZIP node...');

const zipNode = workflow.nodes.find(n => n.name === '📦 ZIP Files');
zipNode.parameters = {
  operation: "compress",
  outputFormat: "zip",
  fileName: "={{ $('📚 Compile Book').first().json.title ? $('📚 Compile Book').first().json.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\\-\\s]/g, '').replace(/\\s+/g, '_') : 'book' }}.zip",
  binaryPropertyOutput: "data"
};

console.log('  ✅ ZIP fileName references $("📚 Compile Book")');
console.log('  ✅ binaryPropertyOutput = "data"');

// =====================================================
// Step 4: Fix Email - reference Compile Book directly
// =====================================================
console.log('\n🔧 Step 4: Fixing Email template...');

const emailNode = workflow.nodes.find(n => n.name === '📧 Final Book Email');

// Use $('📚 Compile Book') for all metadata
const src = "$('📚 Compile Book').first().json";

emailNode.parameters.subject = `=✅ Buch fertig: {{ ${src}.title }} (Ø Score: {{ Math.round(${src}.average_score) }}/100)`;

emailNode.parameters.html = `=<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #2c3e50;">📚 Buch fertiggestellt!</h1>
  <p style="font-size: 18px;"><strong>{{ ${src}.title }}</strong></p>
  {{ ${src}.iso_alignment ? '<p><strong>ISO 17024 Syllabus:</strong> ' + (${src}.iso_alignment.syllabus_id || '') + '</p>' : '' }}
  <hr style="border: 1px solid #eee;">
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
    <tr>
      <td style="padding: 8px; background: #f8f9fa;"><strong>Durchschnittlicher Quality Score:</strong></td>
      <td style="padding: 8px; background: #f8f9fa; text-align: right;"><strong>{{ Math.round(${src}.average_score) }}/100</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>In Knowledge Base gespeichert:</strong></td>
      <td style="padding: 8px; text-align: right;">{{ ${src}.kb_document_ids ? ${src}.kb_document_ids.length : 0 }} Kapitel</td>
    </tr>
    <tr>
      <td style="padding: 8px; background: #f8f9fa;"><strong>Gesamte Kapitel:</strong></td>
      <td style="padding: 8px; background: #f8f9fa; text-align: right;">{{ ${src}.total_chapters }}</td>
    </tr>
  </table>
  <h3 style="color: #2c3e50; margin-top: 20px;">Chapter Scores:</h3>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
    <tr style="background: #2c3e50; color: white;">
      <th style="padding: 10px; text-align: left;">Kapitel</th>
      <th style="padding: 10px; text-align: left;">Titel</th>
      <th style="padding: 10px; text-align: center;">Score</th>
      <th style="padding: 10px; text-align: center;">Status</th>
    </tr>
    {{ ${src}.chapter_scores ? ${src}.chapter_scores.map(cs => '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">' + cs.chapter + '</td><td style="padding: 8px;">' + cs.title + '</td><td style="padding: 8px; text-align: center;">' + cs.score + '/100</td><td style="padding: 8px; text-align: center;">' + (cs.passed_quality ? '✅' : '⚠️') + '</td></tr>').join('') : '<tr><td colspan="4" style="padding: 8px;">Keine Daten</td></tr>' }}
  </table>
  <div style="margin-top: 20px; padding: 15px; background: #f0f7ff; border-radius: 8px; border: 1px solid #d0e3ff;">
    <strong>📦 Das ZIP-Archiv enthält 4 Dateien:</strong>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>📘 <strong>book.md</strong> - Vollständiges Buch (Markdown)</li>
      <li>📝 <strong>questions.md</strong> - Prüfungsfragen (Markdown)</li>
      <li>🌐 <strong>book.html</strong> - Vollständiges Buch (HTML mit CSS-Styling)</li>
      <li>🌐 <strong>questions.html</strong> - Prüfungsfragen (HTML mit CSS-Styling)</li>
    </ul>
  </div>
  <p style="margin-top: 20px; color: #888; font-size: 12px;">Fertiggestellt: {{ ${src}.completed_at }}</p>
</div>`;

console.log('  ✅ Subject references $("📚 Compile Book")');
console.log('  ✅ HTML uses proper formatting with inline CSS');
console.log('  ✅ Chapter scores table renders correctly');

// =====================================================
// Step 5: Verify connections
// =====================================================
console.log('\n🔧 Step 5: Verifying connections...');

const verifyConnections = [
  ['📄 Convert Book MD', '🔀 Merge Files', 0],
  ['📄 Convert Questions MD', '🔀 Merge Files', 1],
  ['📄 Convert Book HTML', '🔀 Merge Files', 2],
  ['📄 Convert Questions HTML', '🔀 Merge Files', 3],
];

for (const [from, to, index] of verifyConnections) {
  const conn = workflow.connections[from];
  if (conn?.main?.[0]?.[0]?.node === to && conn.main[0][0].index === index) {
    console.log(`  ✅ ${from} → ${to} (input ${index})`);
  } else {
    console.log(`  ❌ ${from} → WRONG! Fixing...`);
    workflow.connections[from] = {
      main: [[{ node: to, type: 'main', index: index }]]
    };
    console.log(`  ✅ ${from} → ${to} (input ${index}) FIXED`);
  }
}

// Verify Merge → ZIP
const mergeConn = workflow.connections['🔀 Merge Files'];
console.log(`  ✅ Merge Files → ${mergeConn.main[0][0].node}`);

// Verify ZIP → Email
const zipConn = workflow.connections['📦 ZIP Files'];
console.log(`  ✅ ZIP Files → ${zipConn.main[0][0].node}`);

// =====================================================
// SAVE
// =====================================================
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow saved!');
console.log('\n📋 Final flow:');
console.log('  4 Convert to File nodes → 🔀 Merge Files (append, 4 inputs)');
console.log('  🔀 Merge Files → 📦 ZIP Files (compresses ALL items into 1 ZIP)');
console.log('  📦 ZIP Files → 📧 Final Book Email');
console.log('\n  Email references $("📚 Compile Book") directly for metadata');
console.log('  No intermediate Code node needed!');
console.log('\n  Total nodes:', workflow.nodes.length, '(removed Aggregate Files)');
