#!/usr/bin/env node

/**
 * Fix Merge Files node input indices
 * Each of the 4 Convert to File nodes should connect to a different input (0, 1, 2, 3)
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');

// Create backup
const backupPath = workflowPath.replace('.json', `-BACKUP-${Date.now()}.json`);
fs.copyFileSync(workflowPath, backupPath);
console.log('✅ Backup created:', path.basename(backupPath));

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('\n🔍 Current connections to Merge Files:');
console.log('  - Convert Book MD → input', workflow.connections['📄 Convert Book MD'].main[0][0].index);
console.log('  - Convert Questions MD → input', workflow.connections['📄 Convert Questions MD'].main[0][0].index);
console.log('  - Convert Book HTML → input', workflow.connections['📄 Convert Book HTML'].main[0][0].index);
console.log('  - Convert Questions HTML → input', workflow.connections['📄 Convert Questions HTML'].main[0][0].index);

// Fix: Each should connect to a different input index
workflow.connections['📄 Convert Book MD'].main[0][0].index = 0;
workflow.connections['📄 Convert Questions MD'].main[0][0].index = 1;
workflow.connections['📄 Convert Book HTML'].main[0][0].index = 2;
workflow.connections['📄 Convert Questions HTML'].main[0][0].index = 3;

console.log('\n✨ Fixed connections to Merge Files:');
console.log('  - Convert Book MD → input 0');
console.log('  - Convert Questions MD → input 1');
console.log('  - Convert Book HTML → input 2');
console.log('  - Convert Questions HTML → input 3');

// Save
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow updated successfully!');
console.log('\n📋 Summary:');
console.log('Fixed Merge Files node to receive 4 separate inputs:');
console.log('  Input 0: book.md');
console.log('  Input 1: questions.md');
console.log('  Input 2: book.html');
console.log('  Input 3: questions.html');
console.log('\nThe Merge node will now properly combine all 4 files for the ZIP.');
