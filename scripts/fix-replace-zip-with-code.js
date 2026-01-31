#!/usr/bin/env node

/**
 * FINAL FIX: Replace Aggregate + ZIP nodes with a single Code node
 * that creates the ZIP file in pure JavaScript.
 *
 * The n8n Compression node creates 1 ZIP per item (not 1 for all).
 * The Aggregate node renames binary.data to file_0 etc. (breaks ZIP).
 * So we bypass both and create the ZIP manually.
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
// Step 1: Remove Aggregate Files and ZIP Files nodes
// =====================================================
console.log('\n🔧 Step 1: Removing Aggregate Files and ZIP Files nodes...');

const removeNames = ['🔗 Aggregate Files', '📦 ZIP Files'];
for (const name of removeNames) {
  const idx = workflow.nodes.findIndex(n => n.name === name);
  if (idx !== -1) {
    workflow.nodes.splice(idx, 1);
    console.log('  ✅ Removed:', name);
  }
  delete workflow.connections[name];
}

// =====================================================
// Step 2: Add "📦 Create ZIP" Code node
// =====================================================
console.log('\n🔧 Step 2: Adding Create ZIP Code node...');

const mergeNode = workflow.nodes.find(n => n.name === '🔀 Merge Files');

// The JS code that creates a ZIP file from all binary inputs
const zipCode = [
  '// Create ZIP from all binary inputs (pure JavaScript)',
  '// mode: runOnceForAllItems',
  '',
  'const items = $input.all();',
  'const files = [];',
  '',
  'for (const item of items) {',
  '  if (item.binary && item.binary.data) {',
  '    const bd = item.binary.data;',
  '    const buffer = Buffer.from(bd.data, "base64");',
  '    files.push({ name: bd.fileName || "file", data: buffer });',
  '  }',
  '}',
  '',
  '// CRC-32 implementation',
  'const crcTable = [];',
  'for (let i = 0; i < 256; i++) {',
  '  let c = i;',
  '  for (let j = 0; j < 8; j++) {',
  '    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);',
  '  }',
  '  crcTable[i] = c;',
  '}',
  '',
  'function crc32(buf) {',
  '  let crc = 0xFFFFFFFF;',
  '  for (let i = 0; i < buf.length; i++) {',
  '    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);',
  '  }',
  '  return (crc ^ 0xFFFFFFFF) >>> 0;',
  '}',
  '',
  '// Build ZIP file (STORED method, no compression)',
  'const parts = [];',
  'const centralDir = [];',
  'let offset = 0;',
  '',
  'for (const file of files) {',
  '  const nameBuffer = Buffer.from(file.name, "utf8");',
  '  const crc = crc32(file.data);',
  '  const size = file.data.length;',
  '',
  '  // Local file header (30 bytes + name)',
  '  const lh = Buffer.alloc(30);',
  '  lh.writeUInt32LE(0x04034b50, 0);',
  '  lh.writeUInt16LE(20, 4);',
  '  lh.writeUInt16LE(0, 6);',
  '  lh.writeUInt16LE(0, 8);',
  '  lh.writeUInt16LE(0, 10);',
  '  lh.writeUInt16LE(0, 12);',
  '  lh.writeUInt32LE(crc, 14);',
  '  lh.writeUInt32LE(size, 18);',
  '  lh.writeUInt32LE(size, 22);',
  '  lh.writeUInt16LE(nameBuffer.length, 26);',
  '  lh.writeUInt16LE(0, 28);',
  '',
  '  parts.push(lh, nameBuffer, file.data);',
  '',
  '  // Central directory entry (46 bytes + name)',
  '  const cd = Buffer.alloc(46);',
  '  cd.writeUInt32LE(0x02014b50, 0);',
  '  cd.writeUInt16LE(20, 4);',
  '  cd.writeUInt16LE(20, 6);',
  '  cd.writeUInt16LE(0, 8);',
  '  cd.writeUInt16LE(0, 10);',
  '  cd.writeUInt16LE(0, 12);',
  '  cd.writeUInt16LE(0, 14);',
  '  cd.writeUInt32LE(crc, 16);',
  '  cd.writeUInt32LE(size, 20);',
  '  cd.writeUInt32LE(size, 24);',
  '  cd.writeUInt16LE(nameBuffer.length, 28);',
  '  cd.writeUInt16LE(0, 30);',
  '  cd.writeUInt16LE(0, 32);',
  '  cd.writeUInt16LE(0, 34);',
  '  cd.writeUInt16LE(0, 36);',
  '  cd.writeUInt32LE(0, 38);',
  '  cd.writeUInt32LE(offset, 42);',
  '',
  '  centralDir.push(cd, nameBuffer);',
  '  offset += 30 + nameBuffer.length + size;',
  '}',
  '',
  'const cdBuf = Buffer.concat(centralDir);',
  'const cdOffset = offset;',
  '',
  '// End of central directory (22 bytes)',
  'const ecd = Buffer.alloc(22);',
  'ecd.writeUInt32LE(0x06054b50, 0);',
  'ecd.writeUInt16LE(0, 4);',
  'ecd.writeUInt16LE(0, 6);',
  'ecd.writeUInt16LE(files.length, 8);',
  'ecd.writeUInt16LE(files.length, 10);',
  'ecd.writeUInt32LE(cdBuf.length, 12);',
  'ecd.writeUInt32LE(cdOffset, 16);',
  'ecd.writeUInt16LE(0, 20);',
  '',
  'const zipBuffer = Buffer.concat([...parts, cdBuf, ecd]);',
  '',
  '// Get title for filename',
  "const compileData = $('📚 Compile Book').first().json;",
  "const title = compileData.title || 'book';",
  "const safeTitle = title.replace(/[^a-zA-Z0-9\\u00e4\\u00f6\\u00fc\\u00c4\\u00d6\\u00dc\\u00df\\-\\s]/g, '').replace(/\\s+/g, '_');",
  '',
  'return [{',
  '  json: {',
  '    title: safeTitle,',
  '    fileCount: files.length',
  '  },',
  '  binary: {',
  '    data: {',
  '      data: zipBuffer.toString("base64"),',
  '      mimeType: "application/zip",',
  '      fileName: safeTitle + ".zip",',
  '      fileExtension: "zip"',
  '    }',
  '  }',
  '}];',
].join('\n');

const createZipNode = {
  parameters: {
    mode: "runOnceForAllItems",
    jsCode: zipCode
  },
  id: "create-zip-code-node",
  name: "📦 Create ZIP",
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [mergeNode.position[0] + 224, mergeNode.position[1]]
};

workflow.nodes.push(createZipNode);
console.log('  ✅ Added "📦 Create ZIP" Code node');

// =====================================================
// Step 3: Fix connections
// =====================================================
console.log('\n🔧 Step 3: Fixing connections...');

// Merge → Create ZIP
workflow.connections['🔀 Merge Files'] = {
  main: [[{ node: '📦 Create ZIP', type: 'main', index: 0 }]]
};

// Create ZIP → Email
workflow.connections['📦 Create ZIP'] = {
  main: [[{ node: '📧 Final Book Email', type: 'main', index: 0 }]]
};

console.log('  ✅ Merge Files → Create ZIP → Final Book Email');

// =====================================================
// Step 4: Update Email node position
// =====================================================
const emailNode = workflow.nodes.find(n => n.name === '📧 Final Book Email');
emailNode.position = [mergeNode.position[0] + 448, mergeNode.position[1]];

// =====================================================
// SAVE
// =====================================================
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow saved!');
console.log('\n📋 Flow:');
console.log('  🔀 Merge Files (4 items with binary.data)');
console.log('       ↓');
console.log('  📦 Create ZIP (Code node, mode: runOnceForAllItems)');
console.log('  Reads binary.data from each item, builds ZIP in pure JS');
console.log('  Outputs 1 item with binary.data = ZIP file');
console.log('       ↓');
console.log('  📧 Final Book Email (1 email, attachments: "data")');
console.log('\nTotal nodes:', workflow.nodes.length);
console.log('\n🎯 No more Compression node or Aggregate node!');
console.log('   The Code node handles everything in one place.');
