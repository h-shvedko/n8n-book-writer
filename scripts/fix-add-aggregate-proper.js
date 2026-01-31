#!/usr/bin/env node

/**
 * Fix: Add Aggregate Code node between Merge and ZIP
 * with CORRECT mode: "runOnceForAllItems"
 *
 * The previous attempt failed because:
 * 1. mode was "runOnceForEachItem" (default) - runs per item, not aggregate
 * 2. The Compression node creates 1 ZIP per item, not 1 ZIP for all
 *
 * This fix:
 * - Adds Code node with mode "runOnceForAllItems"
 * - Combines all binary from 4 items into 1 item
 * - Compression node then creates 1 ZIP with all 4 files
 * - Email sends 1 email with 1 ZIP
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
// Step 1: Find Merge Files position for placing Aggregate after it
// =====================================================
const mergeNode = workflow.nodes.find(n => n.name === '🔀 Merge Files');
console.log('\n🔧 Merge Files position:', mergeNode.position);

// =====================================================
// Step 2: Add Aggregate Files Code node
// =====================================================
console.log('\n🔧 Adding Aggregate Files Code node...');

const aggregateNode = {
  parameters: {
    mode: "runOnceForAllItems",
    jsCode: `// Aggregate all binary files from Merge into 1 item
// Mode: runOnceForAllItems - code runs ONCE with access to ALL items
const items = $input.all();
const allBinary = {};

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  if (item.binary) {
    for (const [key, value] of Object.entries(item.binary)) {
      // Use unique key per file to avoid overwriting
      allBinary['file_' + i] = value;
    }
  }
}

return [{
  json: {
    aggregated: true,
    fileCount: Object.keys(allBinary).length
  },
  binary: allBinary
}];`
  },
  id: "aggregate-files-proper",
  name: "🔗 Aggregate Files",
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [mergeNode.position[0] + 224, mergeNode.position[1]]
};

workflow.nodes.push(aggregateNode);
console.log('  ✅ Added "🔗 Aggregate Files" (mode: runOnceForAllItems)');

// =====================================================
// Step 3: Fix connections: Merge → Aggregate → ZIP
// =====================================================
console.log('\n🔧 Fixing connections...');

// Merge → Aggregate (instead of Merge → ZIP)
workflow.connections['🔀 Merge Files'] = {
  main: [[{ node: '🔗 Aggregate Files', type: 'main', index: 0 }]]
};

// Aggregate → ZIP
workflow.connections['🔗 Aggregate Files'] = {
  main: [[{ node: '📦 ZIP Files', type: 'main', index: 0 }]]
};

console.log('  ✅ Merge Files → Aggregate Files');
console.log('  ✅ Aggregate Files → ZIP Files');
console.log('  ✅ ZIP Files → Final Book Email (unchanged)');

// =====================================================
// Step 4: Move ZIP node to the right to make room
// =====================================================
const zipNode = workflow.nodes.find(n => n.name === '📦 ZIP Files');
zipNode.position = [mergeNode.position[0] + 448, mergeNode.position[1]];

const emailNode = workflow.nodes.find(n => n.name === '📧 Final Book Email');
emailNode.position = [mergeNode.position[0] + 672, mergeNode.position[1]];

console.log('\n🔧 Repositioned ZIP and Email nodes');

// =====================================================
// SAVE
// =====================================================
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow saved!');
console.log('\n📋 Flow:');
console.log('  Merge Files (4 items, 1 per file)');
console.log('       ↓');
console.log('  🔗 Aggregate Files (mode: runOnceForAllItems)');
console.log('  Combines 4 items → 1 item with 4 binary properties');
console.log('       ↓');
console.log('  📦 ZIP Files (1 item → 1 ZIP with 4 files)');
console.log('       ↓');
console.log('  📧 Final Book Email (1 email, 1 ZIP attachment)');
console.log('\nTotal nodes:', workflow.nodes.length);
