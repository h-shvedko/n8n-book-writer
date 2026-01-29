#!/usr/bin/env node

/**
 * Script to add retry logic to all external HTTP requests in n8n workflow
 * Adds: 3 retries with 1 second wait between attempts
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '../workflows/wpi-content-factory-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('Analyzing workflow for external HTTP requests...');

// Retry settings to add
const retrySettings = {
  retry: {
    maxTries: 3,
    waitBetweenTries: 1000 // 1 second in milliseconds
  }
};

let updatedCount = 0;
let skippedCount = 0;

// Find all HTTP Request nodes
const httpNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.httpRequest');

console.log(`Found ${httpNodes.length} HTTP Request nodes`);

httpNodes.forEach(node => {
  // Determine if this is an external request
  const url = node.parameters?.url || '';

  // Check if it's an external URL (not localhost, not internal services)
  const isExternal =
    url.includes('api.openai.com') ||
    url.includes('openai.com') ||
    url.includes('anthropic.com') ||
    url.includes('google.com') ||
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    url.startsWith('http');

  // Also check if URL is an expression that might be external
  const isExpressionExternal =
    url.includes('mcp-standards') ||
    url.includes('mcp-research') ||
    url.includes('n8n:');

  // MCP services are internal (Docker network), but we still want retry for resilience
  const isMCPService =
    url.includes('mcp-standards') ||
    url.includes('mcp-research');

  if (isExternal || isMCPService) {
    // Initialize options if not exists
    if (!node.parameters.options) {
      node.parameters.options = {};
    }

    // Add retry settings
    node.parameters.options = {
      ...node.parameters.options,
      ...retrySettings
    };

    console.log(`✓ Added retry to: ${node.name} (${url.substring(0, 50)}...)`);
    updatedCount++;
  } else {
    console.log(`- Skipped: ${node.name} (internal/no URL)`);
    skippedCount++;
  }
});

console.log('\n=== Summary ===');
console.log(`Updated nodes: ${updatedCount}`);
console.log(`Skipped nodes: ${skippedCount}`);
console.log(`Total HTTP nodes: ${httpNodes.length}`);

// Save updated workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('\n✅ Workflow updated successfully!');
console.log('Retry settings added:');
console.log('  - Max retries: 3');
console.log('  - Wait between retries: 1 second');
console.log('\nApplied to:');
console.log('  - OpenAI API calls (chapter generation, HTML conversion)');
console.log('  - MCP service calls (mcp-standards, mcp-research)');
console.log('  - Any other external HTTP requests');
