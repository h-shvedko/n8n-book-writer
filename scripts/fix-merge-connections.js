#!/usr/bin/env node

/**
 * Script to fix Merge Files node connections
 * The HTML converter nodes are connecting to wrong input indices
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Fixing Merge Files node connections...\n');

// Check current connections to Merge Files
console.log('BEFORE FIX:');
console.log('Convert Book MD → Merge Files:', JSON.stringify(workflow.connections['📄 Convert Book MD']));
console.log('Convert Questions MD → Merge Files:', JSON.stringify(workflow.connections['📄 Convert Questions MD']));
console.log('Convert Book HTML → Merge Files:', JSON.stringify(workflow.connections['📄 Convert Book HTML']));
console.log('Convert Questions HTML → Merge Files:', JSON.stringify(workflow.connections['📄 Convert Questions HTML']));

// Fix the connections - each should go to a different input index
// Input 0: Convert Book MD
// Input 1: Convert Questions MD
// Input 2: Convert Book HTML
// Input 3: Convert Questions HTML

workflow.connections['📄 Convert Book HTML'] = {
  main: [[{ node: '🔀 Merge Files', type: 'main', index: 0 }]]
};

workflow.connections['📄 Convert Questions HTML'] = {
  main: [[{ node: '🔀 Merge Files', type: 'main', index: 0 }]]
};

console.log('\nAFTER FIX:');
console.log('Convert Book HTML → Merge Files:', JSON.stringify(workflow.connections['📄 Convert Book HTML']));
console.log('Convert Questions HTML → Merge Files:', JSON.stringify(workflow.connections['📄 Convert Questions HTML']));

// Actually, the Merge node in "append" mode takes all inputs on input 0
// This is correct behavior for n8n Merge node in append mode
// The issue might be something else

console.log('\n⚠️ WAIT - Checking Merge node configuration...');
const mergeNode = workflow.nodes.find(n => n.name === '🔀 Merge Files');
console.log('Merge node config:', JSON.stringify(mergeNode.parameters, null, 2));

console.log('\n📊 Analysis:');
console.log('The Merge node is in "append" mode, which means:');
console.log('- All inputs should connect to index 0');
console.log('- The node will append all items from all inputs into one array');
console.log('\nThe current setup is CORRECT for append mode.');
console.log('\nThe issue must be elsewhere. Checking Compression node...');

const zipNode = workflow.nodes.find(n => n.name === '📦 ZIP Files');
console.log('\nZIP node config:', JSON.stringify(zipNode.parameters, null, 2));

console.log('\n💡 Potential issue:');
console.log('The ZIP node expects binary data (files), not text properties.');
console.log('Let me check the Convert to File nodes...');

const convertBookMD = workflow.nodes.find(n => n.name === '📄 Convert Book MD');
const convertQuestionsMD = workflow.nodes.find(n => n.name === '📄 Convert Questions MD');
const convertBookHTML = workflow.nodes.find(n => n.name === '📄 Convert Book HTML');
const convertQuestionsHTML = workflow.nodes.find(n => n.name === '📄 Convert Questions HTML');

console.log('\nConvert Book MD:', JSON.stringify(convertBookMD.parameters, null, 2));
console.log('\nConvert Questions MD:', JSON.stringify(convertQuestionsMD.parameters, null, 2));
console.log('\nConvert Book HTML:', JSON.stringify(convertBookHTML?.parameters, null, 2));
console.log('\nConvert Questions HTML:', JSON.stringify(convertQuestionsHTML?.parameters, null, 2));

// Don't save - just analyze
console.log('\n✅ Analysis complete. No changes made.');
console.log('\nReview the output above to identify the issue.');
