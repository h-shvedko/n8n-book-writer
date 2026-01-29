#!/usr/bin/env node

/**
 * Verify all HTML generation connections are correct
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('🔍 Verifying HTML Generation Connections\n');

// Check the full chain
const chains = {
  'Book HTML Chain': [
    '📚 Compile Book',
    '🌐 Convert Book to HTML',
    '📋 Extract HTML Book',
    '📄 Convert Book HTML',
    '🔀 Merge Files'
  ],
  'Questions HTML Chain': [
    '📚 Compile Book',
    '🌐 Convert Questions to HTML',
    '📋 Extract HTML Questions',
    '📄 Convert Questions HTML',
    '🔀 Merge Files'
  ]
};

for (const [chainName, nodeNames] of Object.entries(chains)) {
  console.log(`\n${chainName}:`);
  console.log('='.repeat(50));

  for (let i = 0; i < nodeNames.length - 1; i++) {
    const fromNode = nodeNames[i];
    const toNode = nodeNames[i + 1];

    const connection = workflow.connections[fromNode];

    if (!connection) {
      console.log(`❌ ${fromNode} → ${toNode}: NO CONNECTION FOUND`);
      continue;
    }

    const hasConnection = connection.main?.[0]?.some(conn => conn.node === toNode);

    if (hasConnection) {
      const connInfo = connection.main[0].find(conn => conn.node === toNode);
      console.log(`✅ ${fromNode} → ${toNode} (input ${connInfo.index})`);
    } else {
      console.log(`❌ ${fromNode} → ${toNode}: NOT CONNECTED`);
      console.log(`   Actual connections:`, JSON.stringify(connection.main[0].map(c => c.node)));
    }
  }
}

// Check MD connections too
console.log('\n\nMarkdown Chain:');
console.log('='.repeat(50));
const mdConnections = [
  ['📚 Compile Book', '📄 Convert Book MD'],
  ['📄 Convert Book MD', '🔀 Merge Files'],
  ['📚 Compile Book', '📄 Convert Questions MD'],
  ['📄 Convert Questions MD', '🔀 Merge Files']
];

for (const [from, to] of mdConnections) {
  const connection = workflow.connections[from];
  if (!connection) {
    console.log(`❌ ${from} → ${to}: NO CONNECTION`);
    continue;
  }

  const hasConnection = connection.main?.[0]?.some(conn => conn.node === to);
  if (hasConnection) {
    const connInfo = connection.main[0].find(conn => conn.node === to);
    console.log(`✅ ${from} → ${to} (input ${connInfo.index})`);
  } else {
    console.log(`❌ ${from} → ${to}: NOT CONNECTED`);
  }
}

// Final summary
console.log('\n\n📊 Merge Files Inputs:');
console.log('='.repeat(50));

const mergeInputs = {};
for (const [nodeName, connections] of Object.entries(workflow.connections)) {
  if (connections.main?.[0]) {
    for (const conn of connections.main[0]) {
      if (conn.node === '🔀 Merge Files') {
        mergeInputs[conn.index] = mergeInputs[conn.index] || [];
        mergeInputs[conn.index].push(nodeName);
      }
    }
  }
}

for (let i = 0; i < 4; i++) {
  if (mergeInputs[i]) {
    console.log(`Input ${i}: ${mergeInputs[i].join(', ')}`);
  } else {
    console.log(`Input ${i}: ⚠️  EMPTY`);
  }
}
