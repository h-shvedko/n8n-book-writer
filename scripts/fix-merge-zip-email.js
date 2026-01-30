#!/usr/bin/env node

/**
 * Fix: Replace Merge Files with Code node that combines all 4 binary files into 1 item
 * Fix: ZIP file name expression
 * Fix: Email HTML template
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
// FIX 1: Replace Merge Files with Code node
// =====================================================
console.log('\n🔧 FIX 1: Replacing Merge Files with Code node...');

const mergeNodeIndex = workflow.nodes.findIndex(n => n.name === '🔀 Merge Files');
const mergeNode = workflow.nodes[mergeNodeIndex];

// Replace with Code node that combines all binary data into 1 item
workflow.nodes[mergeNodeIndex] = {
  parameters: {
    mode: "runOnceForEachItem",
    jsCode: `// Combine all 4 files into a single item with all binary properties
// This ensures the ZIP node creates ONE zip with ALL files

const bookMd = $('📄 Convert Book MD').first();
const questionsMd = $('📄 Convert Questions MD').first();
const bookHtml = $('📄 Convert Book HTML').first();
const questionsHtml = $('📄 Convert Questions HTML').first();

// Get metadata from Compile Book for the email
const compileData = $('📚 Compile Book').first().json;

// Combine all binary properties into one item
const combinedBinary = {};

if (bookMd.binary) {
  Object.keys(bookMd.binary).forEach(key => {
    combinedBinary['book_md'] = bookMd.binary[key];
  });
}

if (questionsMd.binary) {
  Object.keys(questionsMd.binary).forEach(key => {
    combinedBinary['questions_md'] = questionsMd.binary[key];
  });
}

if (bookHtml.binary) {
  Object.keys(bookHtml.binary).forEach(key => {
    combinedBinary['book_html'] = bookHtml.binary[key];
  });
}

if (questionsHtml.binary) {
  Object.keys(questionsHtml.binary).forEach(key => {
    combinedBinary['questions_html'] = questionsHtml.binary[key];
  });
}

return {
  json: {
    title: compileData.title,
    book_id: compileData.book_id,
    average_score: compileData.average_score,
    total_chapters: compileData.total_chapters,
    chapter_scores: compileData.chapter_scores,
    kb_document_ids: compileData.kb_document_ids,
    iso_alignment: compileData.iso_alignment,
    completed_at: compileData.completed_at,
    file_count: Object.keys(combinedBinary).length
  },
  binary: combinedBinary
};`
  },
  id: mergeNode.id,
  name: "🔗 Combine Files",
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: mergeNode.position
};

console.log('  ✅ Replaced "🔀 Merge Files" with "🔗 Combine Files" Code node');

// Update all connection references from old name to new name
const oldName = '🔀 Merge Files';
const newName = '🔗 Combine Files';

// Update connections that REFERENCE the old node name
for (const [sourceName, conn] of Object.entries(workflow.connections)) {
  if (conn.main) {
    for (const outputArray of conn.main) {
      if (outputArray) {
        for (const connItem of outputArray) {
          if (connItem.node === oldName) {
            connItem.node = newName;
          }
        }
      }
    }
  }
}

// Rename the connection key itself
if (workflow.connections[oldName]) {
  workflow.connections[newName] = workflow.connections[oldName];
  delete workflow.connections[oldName];
}

console.log('  ✅ Updated all connection references');

// The Code node only needs ONE input trigger (from any of the 4 convert nodes)
// It references the other nodes by name using $('nodeName')
// So we only need ONE connection TO the Code node
// Let's connect from Convert Book MD (the first one to complete)
// BUT we need all 4 to be done before running, so connect from the LAST one

// Remove all existing connections TO the Combine Files node and replace with
// connections from ALL 4 Convert to File nodes (input 0 for all)
// The Code node will wait for all referenced nodes to complete before running

// Keep existing connections TO the new node (they already point to input 0, 1, 2, 3)
// But Code node only has 1 input, so all should go to input 0
const connectionsToFix = ['📄 Convert Book MD', '📄 Convert Questions MD', '📄 Convert Book HTML', '📄 Convert Questions HTML'];
for (const nodeName of connectionsToFix) {
  if (workflow.connections[nodeName]) {
    workflow.connections[nodeName] = {
      main: [[{ node: newName, type: 'main', index: 0 }]]
    };
  }
}

console.log('  ✅ All 4 Convert to File nodes now connect to Combine Files (input 0)');

// =====================================================
// FIX 2: ZIP file name - use proper expression
// =====================================================
console.log('\n🔧 FIX 2: Fixing ZIP file name...');

const zipNode = workflow.nodes.find(n => n.name === '📦 ZIP Files');
zipNode.parameters.fileName = "={{ $json.title ? $json.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\\-\\s]/g, '').replace(/\\s+/g, '_') : $json.book_id }}.zip";
zipNode.parameters.binaryPropertyOutput = "data";

console.log('  ✅ ZIP fileName now uses $json.title from Combine Files node');
console.log('  ✅ binaryPropertyOutput = "data"');

// =====================================================
// FIX 3: Email HTML template
// =====================================================
console.log('\n🔧 FIX 3: Fixing Email HTML template...');

const emailNode = workflow.nodes.find(n => n.name === '📧 Final Book Email');

// Fix subject - reference Combine Files node data (passed through ZIP as $json)
emailNode.parameters.subject = "=✅ Buch fertig: {{ $('🔗 Combine Files').first().json.title }} (Ø Score: {{ Math.round($('🔗 Combine Files').first().json.average_score) }}/100)";

// Fix HTML - use proper HTML (no \\n), reference correct node
emailNode.parameters.html = `=<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #2c3e50;">📚 Buch fertiggestellt!</h1>
  <p style="font-size: 18px;"><strong>{{ $('🔗 Combine Files').first().json.title }}</strong></p>
  {{ $('🔗 Combine Files').first().json.iso_alignment ? '<p><strong>ISO 17024 Syllabus:</strong> ' + ($('🔗 Combine Files').first().json.iso_alignment.syllabus_id || $('🔗 Combine Files').first().json.iso_alignment.domain_id || '') + '</p>' : '' }}
  <hr style="border: 1px solid #eee;">
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
    <tr>
      <td style="padding: 8px; background: #f8f9fa;"><strong>Durchschnittlicher Quality Score:</strong></td>
      <td style="padding: 8px; background: #f8f9fa; text-align: right;"><strong>{{ Math.round($('🔗 Combine Files').first().json.average_score) }}/100</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>In Knowledge Base gespeichert:</strong></td>
      <td style="padding: 8px; text-align: right;">{{ $('🔗 Combine Files').first().json.kb_document_ids ? $('🔗 Combine Files').first().json.kb_document_ids.length : 0 }} Kapitel</td>
    </tr>
    <tr>
      <td style="padding: 8px; background: #f8f9fa;"><strong>Gesamte Kapitel:</strong></td>
      <td style="padding: 8px; background: #f8f9fa; text-align: right;">{{ $('🔗 Combine Files').first().json.total_chapters }}</td>
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
    {{ $('🔗 Combine Files').first().json.chapter_scores ? $('🔗 Combine Files').first().json.chapter_scores.map(cs => '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">' + cs.chapter + '</td><td style="padding: 8px;">' + cs.title + '</td><td style="padding: 8px; text-align: center;">' + cs.score + '/100</td><td style="padding: 8px; text-align: center;">' + (cs.passed_quality ? '✅' : '⚠️') + '</td></tr>').join('') : '<tr><td colspan="4" style="padding: 8px;">Keine Daten</td></tr>' }}
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
  <p style="margin-top: 20px; color: #888; font-size: 12px;">Fertiggestellt: {{ $('🔗 Combine Files').first().json.completed_at }}</p>
</div>`;

console.log('  ✅ Email subject uses correct node reference');
console.log('  ✅ Email HTML uses proper HTML formatting (no \\n)');
console.log('  ✅ All expressions reference 🔗 Combine Files node');

// =====================================================
// SAVE
// =====================================================
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow saved successfully!');
console.log('\n📋 Summary of fixes:');
console.log('  1. Replaced "🔀 Merge Files" (broken) → "🔗 Combine Files" (Code node)');
console.log('     - Combines all 4 binary files into 1 item');
console.log('     - Passes metadata (title, scores, chapters) for email');
console.log('  2. Fixed ZIP fileName to use $json.title');
console.log('  3. Fixed Email HTML template:');
console.log('     - Proper HTML formatting (no \\n literals)');
console.log('     - All expressions reference the correct node');
console.log('     - Chapter scores table renders correctly');
console.log('     - Professional styled layout');
console.log('\nResult: 1 email with 1 ZIP attachment containing 4 files');
