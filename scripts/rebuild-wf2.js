#!/usr/bin/env node
/**
 * rebuild-wf2.js — Rebuild WF-2-Research.json
 *
 * Fixes from monolith extraction:
 * - Broken $() references to WF-0 nodes (Chapter Loop, etc.)
 * - Wrong input format (was current_chapter.*, now flat chapter data)
 * - Removed $getWorkflowStaticData (belongs to WF-0)
 * - Add input validation
 * - Add per-LO RAG lookup (SplitInBatches over learning_objectives)
 * - Build structured fact sheet output
 * - Add store-to-KB step
 * - Normalize positions
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'workflows', 'modular', 'WF-2-Research.json');

// Read existing to preserve credential IDs
let existingWf;
try {
  existingWf = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
} catch (e) {
  existingWf = null;
}

function getCredential(credType) {
  if (!existingWf) return {};
  for (const n of existingWf.nodes) {
    if (n.credentials?.[credType]) {
      return { [credType]: n.credentials[credType] };
    }
  }
  return {};
}

const httpHeaderAuth = getCredential('httpHeaderAuth');

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const nodes = [];
const connections = {};

function addNode(name, type, typeVersion, position, params, extra = {}) {
  const node = {
    parameters: params,
    id: uid(),
    name,
    type: `n8n-nodes-base.${type}`,
    typeVersion,
    position,
    ...extra,
  };
  nodes.push(node);
  return node;
}

function connect(from, to, fromOutput = 0, toInput = 0) {
  if (!connections[from]) connections[from] = { main: [] };
  while (connections[from].main.length <= fromOutput) {
    connections[from].main.push([]);
  }
  connections[from].main[fromOutput].push({
    node: to,
    type: 'main',
    index: toInput,
  });
}

// ─── NODE 1: Execute Workflow Trigger ───
addNode('Execute Workflow Trigger', 'executeWorkflowTrigger', 1.1, [0, 300], {});

// ─── NODE 2: Validate Input ───
addNode('✅ Validate Input', 'code', 2, [250, 300], {
  jsCode: `// Validate input from WF-0 Manager
const input = $input.first().json;

const required = ['job_id', 'chapter_id', 'domain_id'];
const missing = required.filter(f => !input[f]);

if (missing.length > 0) {
  throw new Error('WF-2 input validation failed. Missing: ' + missing.join(', '));
}

return [{
  json: {
    job_id: input.job_id,
    chapter_id: input.chapter_id,
    title: input.title || 'Untitled Chapter',
    learning_objectives: input.learning_objectives || [],
    domain_id: input.domain_id,
    syllabus_id: input.syllabus_id || '',
    target_audience: input.target_audience || 'Mid-Level Professionals',
    global_history: input.global_history || '',
    chapter_index: input.chapter_index || 0
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('Execute Workflow Trigger', '✅ Validate Input');

// ─── NODE 3: MCP Get Syllabus Section ───
addNode('📚 MCP: Get Syllabus Section', 'httpRequest', 4.2, [500, 200], {
  method: 'POST',
  url: 'http://mcp-standards:3002/call',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'Content-Type', value: 'application/json' }],
  },
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ JSON.stringify({
  name: 'get_syllabus_section',
  arguments: {
    domain_id: $json.domain_id,
    output_format: 'json'
  }
}) }}`,
  options: {
    response: { response: { fullResponse: true } },
  },
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});

// ─── NODE 4: MCP Chapter Research (broad search) ───
addNode('🔍 MCP: Chapter Research', 'httpRequest', 4.2, [500, 400], {
  method: 'POST',
  url: 'http://mcp-research:3003/call',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'Content-Type', value: 'application/json' }],
  },
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ JSON.stringify({
  name: 'hybrid_search',
  arguments: {
    query: $json.title + ' ' + ($json.learning_objectives || []).map(function(lo) { return lo.description || lo; }).join(' '),
    filter_metadata: {
      domain_id: $json.domain_id
    },
    limit: 5,
    output_format: 'json'
  }
}) }}`,
  options: {
    response: { response: { fullResponse: true } },
  },
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});

// Both fire in parallel from Validate Input
connect('✅ Validate Input', '📚 MCP: Get Syllabus Section');
connect('✅ Validate Input', '🔍 MCP: Chapter Research');

// ─── NODE 5: Merge MCP Results ───
addNode('🔀 Merge MCP Results', 'merge', 3, [750, 300], {
  mode: 'append',
  numberInputs: 2,
});
connect('📚 MCP: Get Syllabus Section', '🔀 Merge MCP Results', 0, 0);
connect('🔍 MCP: Chapter Research', '🔀 Merge MCP Results', 0, 1);

// ─── NODE 6: Parse MCP Results ───
addNode('📋 Parse MCP Results', 'code', 2, [1000, 300], {
  jsCode: `// Parse syllabus section + chapter research results
const validated = $('✅ Validate Input').first().json;

// Parse syllabus section
let syllabusSection = null;
let syllabusLOs = [];
try {
  const resp = $('📚 MCP: Get Syllabus Section').first().json;
  if (resp.body?.content?.[0]?.text) {
    const parsed = JSON.parse(resp.body.content[0].text);
    syllabusSection = parsed.section || parsed;
    // Extract LOs from syllabus section
    if (parsed.section?.topics) {
      for (const topic of parsed.section.topics) {
        if (topic.learning_objectives) {
          syllabusLOs = syllabusLOs.concat(topic.learning_objectives);
        }
      }
    }
    if (parsed.learning_objectives) {
      syllabusLOs = syllabusLOs.concat(parsed.learning_objectives);
    }
  }
} catch (e) {
  // Syllabus fetch failed, continuing without
}

// Parse chapter research
let chapterResearch = [];
try {
  const resp = $('🔍 MCP: Chapter Research').first().json;
  if (resp.body?.content?.[0]?.text) {
    const parsed = JSON.parse(resp.body.content[0].text);
    chapterResearch = parsed.results || [];
  }
} catch (e) {
  // Research fetch failed, continuing without
}

// Prepare LOs for per-LO RAG lookup
const los = validated.learning_objectives || [];

return [{
  json: {
    ...validated,
    syllabus_section: syllabusSection,
    syllabus_los: syllabusLOs,
    chapter_research: chapterResearch,
    lo_count: los.length,
    lo_rag_results: {}
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🔀 Merge MCP Results', '📋 Parse MCP Results');

// ─── NODE 7: Prepare LO Items ───
addNode('📝 Prepare LO Items', 'code', 2, [1250, 300], {
  jsCode: `// Convert learning_objectives array into items for SplitInBatches
const data = $input.first().json;
const los = data.learning_objectives || [];

if (los.length === 0) {
  // No LOs — skip RAG and return accumulated data
  return [{
    json: {
      ...data,
      _skip_rag: true
    }
  }];
}

return los.map(lo => ({
  json: {
    lo_id: lo.id || 'unknown',
    lo_description: lo.description || String(lo),
    bloom_level: lo.bloom_level || 'K2',
    domain_id: data.domain_id,
    _parent_data: data
  }
}));`,
  mode: 'runOnceForAllItems',
});
connect('📋 Parse MCP Results', '📝 Prepare LO Items');

// ─── NODE 8: LO RAG Loop ───
addNode('🔁 LO RAG Loop', 'splitInBatches', 3, [1500, 300], {
  batchSize: 1,
  options: {},
});
connect('📝 Prepare LO Items', '🔁 LO RAG Loop');

// ─── NODE 9: RAG Query Per LO ───
addNode('🔍 RAG: Query Per LO', 'httpRequest', 4.2, [1750, 500], {
  method: 'POST',
  url: 'http://mcp-research:3003/call',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'Content-Type', value: 'application/json' }],
  },
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ JSON.stringify({
  name: 'hybrid_search',
  arguments: {
    query: $json.lo_description,
    filter_metadata: {
      domain_id: $json.domain_id
    },
    limit: 3,
    output_format: 'json'
  }
}) }}`,
  options: {
    response: { response: { fullResponse: true } },
  },
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});
connect('🔁 LO RAG Loop', '🔍 RAG: Query Per LO', 1); // output 1 = items to process

// ─── NODE 10: Collect LO RAG Result ───
addNode('📦 Collect LO RAG Result', 'code', 2, [2000, 500], {
  jsCode: `// Parse RAG result for this LO and store in static data
const staticData = $getWorkflowStaticData('global');
if (!staticData.lo_rag_results) staticData.lo_rag_results = {};

const loData = $('🔁 LO RAG Loop').first().json;
const loId = loData.lo_id || 'unknown';

let ragChunks = [];
try {
  const resp = $input.first().json;
  if (resp.body?.content?.[0]?.text) {
    const parsed = JSON.parse(resp.body.content[0].text);
    ragChunks = (parsed.results || []).map(r => ({
      text: r.text || r.content || '',
      score: r.score || r.relevance || 0,
      source: r.source || r.metadata?.source || ''
    }));
  }
} catch (e) {
  // RAG query failed for this LO
}

staticData.lo_rag_results[loId] = {
  rag_chunks: ragChunks,
  description: loData.lo_description,
  bloom_level: loData.bloom_level
};

return [{ json: { lo_id: loId, rag_count: ragChunks.length } }];`,
  mode: 'runOnceForAllItems',
});
connect('🔍 RAG: Query Per LO', '📦 Collect LO RAG Result');

// Loop back to LO RAG Loop
connect('📦 Collect LO RAG Result', '🔁 LO RAG Loop');

// ─── NODE 11: Build Fact Sheet ───
addNode('📊 Build Fact Sheet', 'code', 2, [1750, 100], {
  jsCode: `// Build structured fact sheet from all research results
const staticData = $getWorkflowStaticData('global');
const loRagResults = staticData.lo_rag_results || {};

// Get the parent data (from Parse MCP Results)
const parentData = $('📋 Parse MCP Results').first().json;

// Build per-LO research map
const loResearch = {};
for (const [loId, data] of Object.entries(loRagResults)) {
  loResearch[loId] = {
    description: data.description,
    bloom_level: data.bloom_level,
    rag_chunks: data.rag_chunks || [],
    kb_facts: []
  };
}

// Add chapter-level KB facts to each LO
const chapterResearch = parentData.chapter_research || [];
for (const [loId, data] of Object.entries(loResearch)) {
  // Match KB facts by relevance to LO description
  data.kb_facts = chapterResearch.filter(r =>
    (r.text || '').toLowerCase().includes(data.description.toLowerCase().split(' ')[0])
  ).slice(0, 3);
}

// Collect all sources
const allSources = new Set();
for (const data of Object.values(loResearch)) {
  for (const chunk of data.rag_chunks) {
    if (chunk.source) allSources.add(chunk.source);
  }
}
for (const r of chapterResearch) {
  if (r.source) allSources.add(r.source);
}

// Build chapter context summary
const chapterContext = [
  'Chapter: ' + parentData.title,
  'Domain: ' + parentData.domain_id,
  'Target Audience: ' + parentData.target_audience,
  'Learning Objectives: ' + (parentData.learning_objectives || []).length,
  parentData.syllabus_section ? 'Syllabus data available' : 'No syllabus data'
].join(' | ');

// Clean up static data
delete staticData.lo_rag_results;

return [{
  json: {
    status: 'success',
    fact_sheet: {
      chapter_context: chapterContext,
      syllabus_section: parentData.syllabus_section,
      syllabus_los: parentData.syllabus_los || [],
      chapter_research: chapterResearch,
      lo_research: loResearch,
      sources: Array.from(allSources)
    },
    // Pass through chapter data for downstream workflows
    job_id: parentData.job_id,
    chapter_id: parentData.chapter_id,
    title: parentData.title,
    learning_objectives: parentData.learning_objectives,
    domain_id: parentData.domain_id,
    target_audience: parentData.target_audience,
    global_history: parentData.global_history
  }
}];`,
  mode: 'runOnceForAllItems',
});
// LO RAG Loop output 0 = "done" (all items processed)
connect('🔁 LO RAG Loop', '📊 Build Fact Sheet', 0);

// ─── NODE 12: Store Research in KB ───
addNode('💾 MCP: Store Research', 'httpRequest', 4.2, [2000, 100], {
  method: 'POST',
  url: 'http://mcp-research:3003/call',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'Content-Type', value: 'application/json' }],
  },
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ JSON.stringify({
  name: 'store_document',
  arguments: {
    content: 'Research fact sheet for chapter: ' + $json.title + '. LOs researched: ' + Object.keys($json.fact_sheet.lo_research || {}).length + '. Sources: ' + ($json.fact_sheet.sources || []).length,
    metadata: {
      type: 'research_fact_sheet',
      chapter_id: $json.chapter_id,
      job_id: $json.job_id,
      domain_id: $json.domain_id
    }
  }
}) }}`,
  options: {},
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});
connect('📊 Build Fact Sheet', '💾 MCP: Store Research');

// ─── Build workflow JSON ───
const workflow = {
  name: 'WF-2 Research Workflow',
  nodes,
  connections,
  settings: {
    executionOrder: 'v1',
  },
  meta: {
    templateCredsSetupCompleted: true,
  },
};

fs.writeFileSync(OUTPUT, JSON.stringify(workflow, null, 2));

console.log(`✅ Rebuilt WF-2-Research.json (${nodes.length} nodes)`);
console.log('   Fixes:');
console.log('   - Fixed all broken $() references to WF-0 nodes');
console.log('   - Fixed input format: flat chapter data from WF-0');
console.log('   - Added input validation node');
console.log('   - Added per-LO RAG lookup (SplitInBatches over learning_objectives)');
console.log('   - Built structured fact sheet: { chapter_context, lo_research, sources }');
console.log('   - Added store-to-KB step');
console.log('   - Structured output: { status, fact_sheet, chapter data passthrough }');
console.log('   - Normalized node positions');
