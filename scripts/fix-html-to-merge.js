#!/usr/bin/env node

/**
 * Fix HTML converter nodes to connect to Merge Files instead of ZIP Files
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');

// Create backup
const backupPath = workflowPath.replace('.json', `-BACKUP-${Date.now()}.json`);
fs.copyFileSync(workflowPath, backupPath);
console.log('✅ Backup created:', path.basename(backupPath));

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('\n🔍 Current connections:');
console.log('Convert Book HTML →', workflow.connections['📄 Convert Book HTML'].main[0][0].node, '(input', workflow.connections['📄 Convert Book HTML'].main[0][0].index + ')');
console.log('Convert Questions HTML →', workflow.connections['📄 Convert Questions HTML'].main[0][0].node, '(input', workflow.connections['📄 Convert Questions HTML'].main[0][0].index + ')');

// Fix: Both should connect to Merge Files, not ZIP Files
workflow.connections['📄 Convert Book HTML'] = {
  main: [[{ node: '🔀 Merge Files', type: 'main', index: 2 }]]
};

workflow.connections['📄 Convert Questions HTML'] = {
  main: [[{ node: '🔀 Merge Files', type: 'main', index: 3 }]]
};

console.log('\n✨ Fixed connections:');
console.log('Convert Book HTML → Merge Files (input 2)');
console.log('Convert Questions HTML → Merge Files (input 3)');

// Save
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow updated successfully!');
console.log('\n📋 Summary:');
console.log('The 4 Convert to File nodes now all connect to Merge Files:');
console.log('  Input 0: book.md');
console.log('  Input 1: questions.md');
console.log('  Input 2: book.html');
console.log('  Input 3: questions.html');
console.log('\nMerge Files combines them → ZIP Files creates 1 ZIP → Email sends it');
