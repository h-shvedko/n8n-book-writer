#!/usr/bin/env node
/**
 * rebuild-wf1.js — Rebuild WF-1-Blueprint.json
 *
 * Fixes from monolith extraction:
 * - Broken $() references to WF-0 nodes (Extract Syllabus ID, Book Request Form)
 * - All data now comes from Execute Workflow Trigger input
 * - Add input validation node
 * - Update Architect Agent prompt: explicit LO arrays, no styling
 * - Update Blueprint Parser: ensure learning_objectives: [{ id, description }] per chapter
 * - Add structured output node (success/error)
 * - Normalize positions
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'workflows', 'modular', 'WF-1-Blueprint.json');

// Read existing to preserve credential IDs
let existingWf;
try {
  existingWf = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
} catch (e) {
  existingWf = null;
}

// Extract credential refs from existing workflow
function getCredential(nodeName, credType) {
  if (!existingWf) return {};
  const node = existingWf.nodes.find(n => n.name === nodeName);
  if (node?.credentials?.[credType]) {
    return { [credType]: node.credentials[credType] };
  }
  // Fallback: find any node with this credential type
  for (const n of existingWf.nodes) {
    if (n.credentials?.[credType]) {
      return { [credType]: n.credentials[credType] };
    }
  }
  return {};
}

const httpHeaderAuth = getCredential('🔄 Activate Syllabus', 'httpHeaderAuth');
const openAiCreds = getCredential('🏗️ Architect Agent', 'openAiApi');

// Helper for UUID-like IDs
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

const required = ['job_id', 'syllabus_id', 'target_audience'];
const missing = required.filter(f => !input[f]);

if (missing.length > 0) {
  throw new Error('WF-1 input validation failed. Missing: ' + missing.join(', '));
}

return [{
  json: {
    job_id: input.job_id,
    syllabus_id: input.syllabus_id,
    syllabus_name: input.syllabus_name || '',
    generation_strategy: input.generation_strategy || 'By Domain',
    target_audience: input.target_audience
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('Execute Workflow Trigger', '✅ Validate Input');

// ─── NODE 3: Activate Syllabus ───
addNode('🔄 Activate Syllabus', 'httpRequest', 4.2, [500, 300], {
  method: 'POST',
  url: '=http://mcp-standards:3002/syllabuses/{{ $json.syllabus_id }}/activate',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  options: {},
}, {
  credentials: httpHeaderAuth,
  notes: 'Activates the selected syllabus in mcp-standards for MCP tools to use',
});
connect('✅ Validate Input', '🔄 Activate Syllabus');

// ─── NODE 4: Route by Strategy ───
addNode('🔀 Route by Strategy', 'if', 2, [750, 300], {
  conditions: {
    options: {
      caseSensitive: true,
      leftValue: '',
      typeValidation: 'strict',
    },
    conditions: [
      {
        id: uid(),
        leftValue: "={{ $('✅ Validate Input').first().json.generation_strategy }}",
        rightValue: 'By Domain',
        operator: {
          type: 'string',
          operation: 'equals',
          name: 'filter.operator.equals',
        },
      },
    ],
    combinator: 'and',
  },
  options: {},
});
connect('🔄 Activate Syllabus', '🔀 Route by Strategy');

// ─── NODE 5: Fetch Syllabus Domains (true branch) ───
addNode('📚 Fetch Syllabus Domains', 'httpRequest', 4.2, [1000, 200], {
  url: 'http://mcp-standards:3002/syllabus/domains',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  options: {},
}, { credentials: httpHeaderAuth });
connect('🔀 Route by Strategy', '📚 Fetch Syllabus Domains', 0);

// ─── NODE 6: Fetch Syllabus Topics (false branch) ───
addNode('📑 Fetch Syllabus Topics', 'httpRequest', 4.2, [1000, 400], {
  url: 'http://mcp-standards:3002/syllabus/topics',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  options: {},
}, { credentials: httpHeaderAuth });
connect('🔀 Route by Strategy', '📑 Fetch Syllabus Topics', 1);

// ─── NODE 7: Initialize BookState (FIXED: reads from validated input, not WF-0 nodes) ───
addNode('🔧 Initialize BookState', 'code', 2, [1250, 300], {
  jsCode: `// Build BookState from validated input + syllabus data
const validated = $('✅ Validate Input').first().json;
const data = $input.first().json;

const isDomainMode = validated.generation_strategy === 'By Domain';

return [{
  json: {
    book_id: 'book-' + validated.syllabus_id + '-' + Date.now(),
    job_id: validated.job_id,
    syllabus_id: validated.syllabus_id,
    syllabus_name: data.syllabus_name || validated.syllabus_name || 'Unknown Syllabus',
    generation_strategy: validated.generation_strategy,
    target_audience: validated.target_audience,
    total_items: isDomainMode ? (data.total_chapters || 0) : (data.total_topics || 0),
    items: isDomainMode ? (data.chapters || []) : (data.topics || []),
    status: 'initialized',
    created_at: new Date().toISOString()
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('📚 Fetch Syllabus Domains', '🔧 Initialize BookState');
connect('📑 Fetch Syllabus Topics', '🔧 Initialize BookState');

// ─── NODE 8: MCP Get Syllabus Section ───
addNode('📚 MCP: Get Syllabus Section', 'httpRequest', 4.2, [1500, 200], {
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
  jsonBody: `{
  "name": "get_syllabus_section",
  "arguments": {
    "domain_id": "{{ $json.items[0]?.domain_id || $json.items[0]?.topic_id || 'D1' }}",
    "output_format": "json"
  }
}`,
  options: {
    response: { response: { fullResponse: true } },
  },
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});

// ─── NODE 9: MCP Search Knowledge Base ───
addNode('🔍 MCP: Search Knowledge Base', 'httpRequest', 4.2, [1500, 400], {
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
  jsonBody: `{
  "name": "hybrid_search",
  "arguments": {
    "query": "{{ $('🔧 Initialize BookState').first().json.syllabus_name + ' ' + ($('🔧 Initialize BookState').first().json.items || []).map(function(c) { return c.title; }).join(' ') }}",
    "limit": 10,
    "output_format": "json"
  }
}`,
  options: {
    response: { response: { fullResponse: true } },
  },
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});

// Both MCP calls fire in parallel from Initialize BookState
connect('🔧 Initialize BookState', '📚 MCP: Get Syllabus Section');
connect('🔧 Initialize BookState', '🔍 MCP: Search Knowledge Base');

// ─── NODE 10: Merge MCP Context ───
addNode('🔀 Merge MCP Context', 'merge', 3, [1750, 300], {
  mode: 'append',
  numberInputs: 2,
});
connect('📚 MCP: Get Syllabus Section', '🔀 Merge MCP Context', 0, 0);
connect('🔍 MCP: Search Knowledge Base', '🔀 Merge MCP Context', 0, 1);

// ─── NODE 11: Combine MCP Data (FIXED: no more WF-0 references) ───
addNode('🧩 Combine MCP Data', 'code', 2, [2000, 300], {
  jsCode: `// Combine syllabus and research context
const bookState = $('🔧 Initialize BookState').first().json;

// Get syllabus section (from MCP-Standards)
let syllabusContext = null;
try {
  const syllabusResponse = $('📚 MCP: Get Syllabus Section').first().json;
  if (syllabusResponse.body && !syllabusResponse.body.error) {
    const content = syllabusResponse.body.content?.[0]?.text;
    syllabusContext = content ? JSON.parse(content) : null;
  }
} catch (e) {
  // Syllabus fetch failed, continuing without
}

// Get research context (from MCP-Research / Qdrant)
let researchContext = [];
try {
  const researchResponse = $('🔍 MCP: Search Knowledge Base').first().json;
  if (researchResponse.body && !researchResponse.body.error) {
    const content = researchResponse.body.content?.[0]?.text;
    const parsed = content ? JSON.parse(content) : null;
    researchContext = parsed?.results || [];
  }
} catch (e) {
  // Research fetch failed, continuing without
}

return [{
  json: {
    ...bookState,
    syllabus_context: syllabusContext,
    research_context: researchContext,
    has_syllabus: !!syllabusContext,
    has_research: researchContext.length > 0
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🔀 Merge MCP Context', '🧩 Combine MCP Data');

// ─── NODE 12: Architect Agent (UPDATED: explicit LO arrays, no styling) ───
const architectPrompt = `Du bist "The Architect" - ein erfahrener Didaktik-Experte für technische Fachbücher.

Deine Aufgabe:
1. Analysiere die Syllabus-Struktur (Kapitel/Topics sind bereits vordefiniert!)
2. Nutze den Kontext aus der Knowledge Base
3. Erstelle detaillierte Lernziele (Learning Objectives) pro Kapitel
4. Definiere klare, messbare Lernziele (ISO 17024 konform, Bloom K1-K6)

WICHTIG: Die Kapitelstruktur ist bereits vorgegeben!
Du sollst NUR die Details ausarbeiten, nicht die Struktur ändern.

Regeln:
- Jedes Kapitel sollte 10-15 Seiten umfassen
- Beginne mit Grundlagen, steigere die Komplexität
- Jedes Kapitel endet mit einer praktischen Übung
- Berücksichtige die Zielgruppe bei der Tiefe
- Lernziele müssen messbar und überprüfbar sein
- Jedes Lernziel braucht eine eindeutige ID und Bloom-Level
- KEINE Styling- oder Formatierungsanweisungen — nur Inhalt und Struktur

Output-Format: JSON
\`\`\`json
{
  "title": "Buchtitel (aus Syllabus-Name)",
  "subtitle": "Untertitel",
  "iso_alignment": {
    "syllabus_id": "ID",
    "covered_domains": ["D1", "D2"]
  },
  "chapters": [
    {
      "number": 1,
      "domain_id": "D1",
      "title": "Titel",
      "learning_objectives": [
        { "id": "LO-1.1.1", "description": "Understand X", "bloom_level": "K2" },
        { "id": "LO-1.1.2", "description": "Apply Y", "bloom_level": "K3" }
      ],
      "sections": ["Section 1", "Section 2"],
      "estimated_pages": 12,
      "practical_exercise": "Beschreibung der Übung"
    }
  ]
}
\`\`\`

KRITISCH: Jedes Kapitel MUSS ein "learning_objectives" Array haben mit Objekten die "id", "description" und "bloom_level" enthalten.`;

const architectUserPrompt = `(function() {
  const items = $json.items || $json.chapters || [];
  const totalItems = $json.total_items || $json.total_chapters || items.length;
  const strategy = $json.generation_strategy || 'By Domain';

  let itemsDescription = items.map(function(item, index) {
    if (item.chapter_number || item.domain_id) {
      return 'Kapitel ' + (item.chapter_number || (index + 1)) + ': ' + item.title +
        '\\n  - Domain ID: ' + (item.domain_id || 'D' + (index + 1)) +
        '\\n  - Beschreibung: ' + (item.description || 'N/A') +
        '\\n  - Topics: ' + (item.topics || []).map(function(t) { return t.title; }).join(', ') +
        '\\n  - Vorhandene Learning Objectives: ' + (item.learning_objectives || []).length + ' Stück';
    } else {
      return 'Topic ' + item.topic_number + ': ' + item.title +
        '\\n  - Topic ID: ' + item.topic_id +
        '\\n  - Domain: ' + item.domain_name + ' (' + item.domain_id + ')' +
        '\\n  - Learning Objectives: ' + (item.learning_objectives || []).length + ' Stück' +
        (item.subtopics && item.subtopics.length > 0 ? '\\n  - Subtopics: ' + item.subtopics.length + ' Stück' : '');
    }
  }).join('\\n\\n');

  return 'Erstelle das Inhaltsverzeichnis basierend auf der vorgegebenen Syllabus-Struktur:\\n\\n' +
    '**Syllabus:** ' + $json.syllabus_name + ' (ID: ' + $json.syllabus_id + ')\\n' +
    '**Zielgruppe:** ' + $json.target_audience + '\\n' +
    '**Generierungsstrategie:** ' + strategy + '\\n' +
    '**Anzahl Items:** ' + totalItems + '\\n\\n' +
    '**VORDEFINIERTE STRUKTUR:**\\n' + itemsDescription + '\\n\\n' +
    ($json.has_syllabus ? '**Syllabus-Kontext:**\\n' + JSON.stringify($json.syllabus_context, null, 2) : '') + '\\n\\n' +
    ($json.has_research ? '**Relevanter Kontext aus Knowledge Base:**\\n' + $json.research_context.slice(0, 5).map(function(r) { return '- ' + (r.text || '').substring(0, 200) + '...'; }).join('\\n') : '') +
    '\\n\\nWICHTIG: Behalte die Struktur bei! Füge Lernziele (learning_objectives), Sections und Übungen hinzu.\\n' +
    'Jedes Kapitel MUSS ein learning_objectives Array haben mit Objekten: { id, description, bloom_level }.\\n\\n' +
    'Antworte NUR mit dem JSON, keine Erklärungen.';
})()`;

addNode('🏗️ Architect Agent', 'httpRequest', 4.2, [2250, 300], {
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  authentication: 'predefinedCredentialType',
  nodeCredentialType: 'openAiApi',
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'Content-Type', value: 'application/json' }],
  },
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ JSON.stringify({
  model: 'gpt-4o',
  temperature: 0.3,
  max_tokens: 4000,
  messages: [
    {
      role: 'system',
      content: ${JSON.stringify(architectPrompt)}
    },
    {
      role: 'user',
      content: ${architectUserPrompt}
    }
  ]
}) }}`,
  options: {},
}, { credentials: openAiCreds });
connect('🧩 Combine MCP Data', '🏗️ Architect Agent');

// ─── NODE 13: Parse Blueprint (UPDATED: enforce learning_objectives array) ───
addNode('📋 Parse Blueprint', 'code', 2, [2500, 300], {
  jsCode: `// Parse the AI response and extract JSON
const response = $input.first().json.choices[0].message.content;

// Try to extract JSON from the response
let blueprint;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  blueprint = JSON.parse(jsonStr.trim());
} catch (e) {
  throw new Error('Failed to parse blueprint JSON: ' + e.message);
}

// Get the previous state
const bookState = $('🧩 Combine MCP Data').first().json;
const originalItems = bookState.items || [];

// Merge blueprint chapters with original data
// CRITICAL: Ensure every chapter has learning_objectives array
const mergedChapters = blueprint.chapters.map((bpCh, index) => {
  const originalItem = originalItems[index] || {};

  // Normalize learning_objectives — ensure array of { id, description }
  let los = bpCh.learning_objectives || bpCh.learning_goals || [];
  if (typeof los[0] === 'string') {
    // Convert string LOs to objects
    los = los.map((desc, i) => ({
      id: 'LO-' + (bpCh.number || index + 1) + '.' + (i + 1),
      description: desc,
      bloom_level: 'K2'
    }));
  } else {
    // Ensure each LO has id and description
    los = los.map((lo, i) => ({
      id: lo.id || 'LO-' + (bpCh.number || index + 1) + '.' + (i + 1),
      description: lo.description || lo.text || String(lo),
      bloom_level: lo.bloom_level || lo.bloom || 'K2'
    }));
  }

  // If no LOs from AI, use original syllabus LOs
  if (los.length === 0 && originalItem.learning_objectives) {
    los = originalItem.learning_objectives.map((lo, i) => ({
      id: lo.id || lo.lo_id || 'LO-' + (index + 1) + '.' + (i + 1),
      description: lo.description || lo.title || String(lo),
      bloom_level: lo.bloom_level || lo.bloom || 'K2'
    }));
  }

  return {
    id: bpCh.id || originalItem.domain_id || 'ch-' + (index + 1),
    number: bpCh.number || index + 1,
    domain_id: originalItem.domain_id || bpCh.domain_id || 'D' + (index + 1),
    title: bpCh.title || originalItem.title || 'Chapter ' + (index + 1),
    learning_objectives: los,
    sections: bpCh.sections || [],
    estimated_pages: bpCh.estimated_pages || 12,
    practical_exercise: bpCh.practical_exercise || '',
    topic_id: originalItem.topic_id,
    topic_number: originalItem.topic_number,
    original_learning_objectives: originalItem.learning_objectives || [],
    topics: originalItem.topics || bpCh.topics || [],
    subtopics: originalItem.subtopics || [],
    weight: originalItem.weight,
    prerequisites: originalItem.prerequisites || []
  };
});

blueprint.chapters = mergedChapters;

return [{
  json: {
    status: 'success',
    blueprint: blueprint,
    job_id: bookState.job_id,
    syllabus_id: bookState.syllabus_id,
    total_chapters: mergedChapters.length
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🏗️ Architect Agent', '📋 Parse Blueprint');

// ─── Build workflow JSON ───
const workflow = {
  name: 'WF-1 Blueprint Generator',
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

console.log(`✅ Rebuilt WF-1-Blueprint.json (${nodes.length} nodes)`);
console.log('   Fixes:');
console.log('   - Fixed all broken $() references to WF-0 nodes');
console.log('   - Added input validation node');
console.log('   - Updated Architect prompt: explicit learning_objectives arrays, no styling');
console.log('   - Updated Blueprint Parser: enforces LO format { id, description, bloom_level }');
console.log('   - Added structured output: { status, blueprint, job_id, total_chapters }');
console.log('   - Normalized node positions');
