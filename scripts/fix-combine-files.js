#!/usr/bin/env node

/**
 * Fix: Use Merge (append, 4 inputs) → Code (aggregate) → ZIP → Email
 *
 * The Code node triggers on ANY input, but Merge waits for ALL inputs.
 * So: Merge collects all 4 files, then Code combines them into 1 item.
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
// Step 1: Replace "🔗 Combine Files" Code node with Merge node
// =====================================================
console.log('\n🔧 Step 1: Replacing Combine Files Code node with Merge node...');

const combineIndex = workflow.nodes.findIndex(n => n.name === '🔗 Combine Files');
const combineNode = workflow.nodes[combineIndex];
const combinePosition = combineNode.position;
const combineId = combineNode.id;

// Replace with Merge node (append mode, 4 inputs)
workflow.nodes[combineIndex] = {
  parameters: {
    mode: "append",
    numberInputs: 4
  },
  id: combineId,
  name: "🔀 Merge Files",
  type: "n8n-nodes-base.merge",
  typeVersion: 3,
  position: combinePosition
};

console.log('  ✅ Replaced with Merge node (mode: append, numberInputs: 4)');

// =====================================================
// Step 2: Add new Code node "🔗 Aggregate Files" between Merge and ZIP
// =====================================================
console.log('\n🔧 Step 2: Adding Aggregate Files Code node...');

const aggregateNode = {
  parameters: {
    jsCode: `// Aggregate all 4 files from Merge into 1 item with all binary properties
// Merge outputs 4 items (1 per file), we combine them into 1

const items = $input.all();
const compileData = $('📚 Compile Book').first().json;

// Combine all binary data from all items into one object
const combinedBinary = {};

for (const item of items) {
  if (item.binary) {
    for (const [key, value] of Object.entries(item.binary)) {
      // Use the file name (without extension) as the key to avoid overwriting
      const fileName = value.fileName || key;
      if (fileName.includes('book') && fileName.endsWith('.md')) {
        combinedBinary['book_md'] = value;
      } else if (fileName.includes('questions') && fileName.endsWith('.md')) {
        combinedBinary['questions_md'] = value;
      } else if (fileName.includes('book') && fileName.endsWith('.html')) {
        combinedBinary['book_html'] = value;
      } else if (fileName.includes('questions') && fileName.endsWith('.html')) {
        combinedBinary['questions_html'] = value;
      } else {
        combinedBinary[key] = value;
      }
    }
  }
}

return [{
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
}];`
  },
  id: "aggregate-files-code-node",
  name: "🔗 Aggregate Files",
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [combinePosition[0] + 224, combinePosition[1]]
};

workflow.nodes.push(aggregateNode);
console.log('  ✅ Added "🔗 Aggregate Files" Code node');

// =====================================================
// Step 3: Fix connections
// =====================================================
console.log('\n🔧 Step 3: Fixing connections...');

// Rename old connection key
const oldName = '🔗 Combine Files';
const newMergeName = '🔀 Merge Files';
const newAggregateName = '🔗 Aggregate Files';

// Update connections referencing old name
for (const [sourceName, conn] of Object.entries(workflow.connections)) {
  if (conn.main) {
    for (const outputArray of conn.main) {
      if (outputArray) {
        for (const connItem of outputArray) {
          if (connItem.node === oldName) {
            connItem.node = newMergeName;
          }
        }
      }
    }
  }
}

// Rename connection key
if (workflow.connections[oldName]) {
  // Old Combine Files → ZIP Files becomes Merge Files → Aggregate Files
  workflow.connections[newMergeName] = {
    main: [[{ node: newAggregateName, type: 'main', index: 0 }]]
  };
  delete workflow.connections[oldName];
}

// Aggregate Files → ZIP Files
workflow.connections[newAggregateName] = {
  main: [[{ node: '📦 ZIP Files', type: 'main', index: 0 }]]
};

// Fix the 4 Convert to File connections - each to a DIFFERENT Merge input
workflow.connections['📄 Convert Book MD'] = {
  main: [[{ node: newMergeName, type: 'main', index: 0 }]]
};
workflow.connections['📄 Convert Questions MD'] = {
  main: [[{ node: newMergeName, type: 'main', index: 1 }]]
};
workflow.connections['📄 Convert Book HTML'] = {
  main: [[{ node: newMergeName, type: 'main', index: 2 }]]
};
workflow.connections['📄 Convert Questions HTML'] = {
  main: [[{ node: newMergeName, type: 'main', index: 3 }]]
};

console.log('  ✅ Convert Book MD → Merge Files (input 0)');
console.log('  ✅ Convert Questions MD → Merge Files (input 1)');
console.log('  ✅ Convert Book HTML → Merge Files (input 2)');
console.log('  ✅ Convert Questions HTML → Merge Files (input 3)');
console.log('  ✅ Merge Files → Aggregate Files');
console.log('  ✅ Aggregate Files → ZIP Files');
console.log('  ✅ ZIP Files → Final Book Email');

// =====================================================
// Step 4: Fix Email references to use Aggregate Files
// =====================================================
console.log('\n🔧 Step 4: Fixing Email references...');

const emailNode = workflow.nodes.find(n => n.name === '📧 Final Book Email');

// Update subject and HTML to reference Aggregate Files
emailNode.parameters.subject = emailNode.parameters.subject.replace(/🔗 Combine Files/g, '🔗 Aggregate Files');
emailNode.parameters.html = emailNode.parameters.html.replace(/🔗 Combine Files/g, '🔗 Aggregate Files');

console.log('  ✅ Email subject references 🔗 Aggregate Files');
console.log('  ✅ Email HTML references 🔗 Aggregate Files');

// =====================================================
// SAVE
// =====================================================
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow saved successfully!');
console.log('\n📋 New flow:');
console.log('  📚 Compile Book');
console.log('    ├→ 📄 Convert Book MD ──────────→ 🔀 Merge Files (input 0)');
console.log('    ├→ 📄 Convert Questions MD ─────→ 🔀 Merge Files (input 1)');
console.log('    ├→ 🌐 Convert Book to HTML → ... → 📄 Convert Book HTML ──→ 🔀 Merge Files (input 2)');
console.log('    └→ 🌐 Convert Questions to HTML → ... → 📄 Convert Questions HTML → 🔀 Merge Files (input 3)');
console.log('                                               ↓');
console.log('                                      🔀 Merge Files (waits for ALL 4 inputs)');
console.log('                                               ↓');
console.log('                                      🔗 Aggregate Files (combines 4 items → 1 item with 4 binary props)');
console.log('                                               ↓');
console.log('                                      📦 ZIP Files (1 ZIP with 4 files)');
console.log('                                               ↓');
console.log('                                      📧 Final Book Email (1 email, 1 attachment)');
