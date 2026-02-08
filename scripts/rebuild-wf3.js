#!/usr/bin/env node
/**
 * rebuild-wf3.js — Rebuild WF-3-ChapterBuilder.json
 *
 * Complete rebuild implementing the Double-Loop inner loop:
 * - Phase 1: OPENER (header + LO list + professional context)
 * - Phase 2: BODY (SplitInBatches over LOs, per-LO AI call, accumulator)
 * - Phase 3: CLOSER (synthesis + MCQs + drill)
 * - Accumulator pattern using $getWorkflowStaticData
 * - JSON-only output (no HTML, no Markdown)
 * - Revision mode support
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'workflows', 'modular', 'WF-3-ChapterBuilder.json');

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

const openAiCreds = getCredential('openAiApi');

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

// ════════════════════════════════════════════
// SYSTEM PROMPT (JSON output, no styling)
// ════════════════════════════════════════════
const SYSTEM_PROMPT_OPENER = `Du bist der "WPI Technical Writer" — ein Experte für didaktische Fachbücher (ISO 17024).

AUFGABE: Generiere den OPENER eines Kapitels als **JSON**.

REGELN:
- Sprache: Deutsch
- Tone: Professional-Instructive. Keine persönliche Anrede (kein "Du/Sie/Wir").
- Tiefe vor Breite: Dies ist ein Study Guide für Professionals.
- Anti-Circular Definition Rule: Komplexe Begriffe mit einfachen Analogien erklären.
- KEIN Body-Content im Opener — nur Framing und Kontext.

OUTPUT FORMAT (JSON):
{
  "header": "Kapitel-Titel mit Teil-Nummer",
  "workload_minutes": 30,
  "domain_id": "D1",
  "learning_objectives": [
    { "id": "LO-1.1.1", "description": "..." }
  ],
  "professional_context": "Ein realistisches Szenario (Cliffhanger — nicht lösen)",
  "chapter_intro": "Kurze Einleitung zum Kapitel-Thema (2-3 Sätze)"
}

WICHTIG: Antworte NUR mit validem JSON. Keine Erklärungen, kein Markdown.`;

const SYSTEM_PROMPT_BODY = `Du bist der "WPI Technical Writer" — ein Experte für didaktische Fachbücher (ISO 17024).

AUFGABE: Generiere den Content für EIN Lernziel (Learning Objective) als **JSON**.

REGELN:
- Sprache: Deutsch
- 500-800 Wörter pro LO
- Zero-to-Hero Approach: Von Grundlagen zu Komplexität
- Bloom-Level beachten (K1=Erinnern, K2=Verstehen, K3=Anwenden, K4=Analysieren, K5=Bewerten, K6=Erstellen)
- Keine persönliche Anrede. Passiv oder Imperativ.
- Akronyme: First-Mention Rule (beim ersten Mal ausschreiben)
- Für Code-Beispiele: <<CODE_REQUEST: [Beschreibung]>> als Placeholder
- KEIN HTML, KEIN Markdown — nur strukturiertes JSON

OUTPUT FORMAT (JSON):
{
  "lo_id": "LO-1.1.1",
  "lo_description": "...",
  "bloom_level": "K2",
  "content_sections": [
    {
      "heading": "Abschnitts-Titel",
      "paragraphs": ["Absatz 1...", "Absatz 2..."],
      "definition": { "term": "...", "explanation": "..." },
      "best_practice": "...",
      "pitfall": "...",
      "code_request": "<<CODE_REQUEST: ...>>"
    }
  ],
  "key_terms": ["Term1", "Term2"]
}

WICHTIG: Antworte NUR mit validem JSON. Keine Erklärungen.`;

const SYSTEM_PROMPT_CLOSER = `Du bist der "WPI Technical Writer" — ein Experte für didaktische Fachbücher (ISO 17024).

AUFGABE: Generiere den CLOSER eines Kapitels als **JSON**.

REGELN:
- Sprache: Deutsch
- Löse das Szenario aus dem Opener
- 5-6 Prüfungsfragen (Multiple Choice + offene Fragen)
- Eine Transfer-Übung (praxisnah)
- Keine persönliche Anrede

OUTPUT FORMAT (JSON):
{
  "synthesis": "Zusammenfassung des Kapitels (3-5 Sätze)",
  "scenario_resolution": "Lösung des Opener-Szenarios",
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "mcqs": [
    {
      "question": "Fragetext",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "B",
      "explanation": "Weil..."
    }
  ],
  "drill": {
    "description": "Übungsaufgabe",
    "requirements": ["Anforderung 1", "..."],
    "starter_hint": "Hinweis zum Einstieg"
  }
}

WICHTIG: Antworte NUR mit validem JSON. Keine Erklärungen.`;

// ════════════════════════════════════════════
// NODES
// ════════════════════════════════════════════

// ─── NODE 1: Execute Workflow Trigger ───
addNode('Execute Workflow Trigger', 'executeWorkflowTrigger', 1.1, [0, 300], {});

// ─── NODE 2: Validate Input ───
addNode('✅ Validate Input', 'code', 2, [250, 300], {
  jsCode: `// Validate input from WF-0 Manager
const input = $input.first().json;

const required = ['job_id', 'chapter_id', 'title', 'learning_objectives'];
const missing = required.filter(f => !input[f]);

if (missing.length > 0) {
  throw new Error('WF-3 input validation failed. Missing: ' + missing.join(', '));
}

if (!Array.isArray(input.learning_objectives) || input.learning_objectives.length === 0) {
  throw new Error('WF-3: learning_objectives must be a non-empty array');
}

return [{
  json: {
    job_id: input.job_id,
    chapter_id: input.chapter_id,
    title: input.title,
    domain_id: input.domain_id || '',
    learning_objectives: input.learning_objectives,
    fact_sheet: input.fact_sheet || {},
    global_history: input.global_history || '',
    target_audience: input.target_audience || 'Mid-Level Professionals',
    revision_feedback: input.revision_feedback || null,
    previous_draft: input.previous_draft || null
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('Execute Workflow Trigger', '✅ Validate Input');

// ─── NODE 3: Initialize Accumulator ───
addNode('📝 Init Accumulator', 'code', 2, [500, 300], {
  jsCode: `// Initialize the chapter draft accumulator using static data
const staticData = $getWorkflowStaticData('global');
staticData.current_chapter_draft = '';
staticData.lo_outputs = [];
staticData.code_requests = [];

const input = $input.first().json;

// If revision mode, include previous draft context
let revisionContext = '';
if (input.revision_feedback) {
  revisionContext = '\\n\\nREVISION FEEDBACK: ' + input.revision_feedback;
}

return [{
  json: {
    ...input,
    revision_context: revisionContext,
    is_revision: !!input.revision_feedback
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('✅ Validate Input', '📝 Init Accumulator');

// ─── NODE 4: Phase 1 — OPENER AI Call ───
const openerUserPrompt = `(function() {
  const d = $json;
  const los = d.learning_objectives || [];
  const factSheet = d.fact_sheet || {};

  return 'KAPITEL: ' + d.title + '\\n' +
    'DOMAIN: ' + d.domain_id + '\\n' +
    'ZIELGRUPPE: ' + d.target_audience + '\\n\\n' +
    'LERNZIELE:\\n' + los.map(function(lo) {
      return '- ' + lo.id + ' (' + (lo.bloom_level || 'K2') + '): ' + lo.description;
    }).join('\\n') + '\\n\\n' +
    (d.global_history ? 'BISHERIGE KAPITEL (Global History):\\n' + d.global_history.substring(0, 1000) + '\\n\\n' : '') +
    (d.revision_context ? d.revision_context + '\\n\\n' : '') +
    'Generiere den OPENER als JSON.';
})()`;

addNode('🎬 Phase 1: OPENER', 'httpRequest', 4.2, [750, 300], {
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
  temperature: 0.4,
  max_tokens: 2000,
  messages: [
    { role: 'system', content: ${JSON.stringify(SYSTEM_PROMPT_OPENER)} },
    { role: 'user', content: ${openerUserPrompt} }
  ]
}) }}`,
  options: {},
}, { credentials: openAiCreds });
connect('📝 Init Accumulator', '🎬 Phase 1: OPENER');

// ─── NODE 5: Parse Opener + Accumulate ───
addNode('📋 Parse Opener', 'code', 2, [1000, 300], {
  jsCode: `// Parse opener JSON and append to accumulator
const staticData = $getWorkflowStaticData('global');
const response = $input.first().json.choices[0].message.content;

let opener;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  opener = JSON.parse(jsonStr.trim());
} catch (e) {
  // Fallback: store as raw text
  opener = {
    header: $('📝 Init Accumulator').first().json.title,
    professional_context: response,
    learning_objectives: $('📝 Init Accumulator').first().json.learning_objectives
  };
}

// Append to accumulator
staticData.current_chapter_draft = JSON.stringify(opener);
staticData.opener = opener;

// Prepare LO items for the body loop
const initData = $('📝 Init Accumulator').first().json;
const los = initData.learning_objectives || [];

return los.map(lo => ({
  json: {
    lo_id: lo.id || 'unknown',
    lo_description: lo.description || '',
    bloom_level: lo.bloom_level || 'K2',
    chapter_title: initData.title,
    domain_id: initData.domain_id,
    target_audience: initData.target_audience,
    fact_sheet: initData.fact_sheet
  }
}));`,
  mode: 'runOnceForAllItems',
});
connect('🎬 Phase 1: OPENER', '📋 Parse Opener');

// ─── NODE 6: LO Body Loop (SplitInBatches) ───
addNode('🔁 LO Body Loop', 'splitInBatches', 3, [1250, 300], {
  batchSize: 1,
  options: {},
});
connect('📋 Parse Opener', '🔁 LO Body Loop');

// ─── NODE 7: Inject Context Per LO ───
addNode('📖 Inject LO Context', 'code', 2, [1500, 500], {
  jsCode: `// Inject accumulated draft + per-LO RAG data
const staticData = $getWorkflowStaticData('global');
const lo = $input.first().json;
const loId = lo.lo_id;

// Get per-LO RAG data from fact sheet
const factSheet = lo.fact_sheet || {};
const loResearch = factSheet.lo_research || {};
const loRag = loResearch[loId] || {};
const ragChunks = (loRag.rag_chunks || []).map(function(c) { return c.text; }).join('\\n---\\n');

return [{
  json: {
    ...lo,
    current_chapter_draft: staticData.current_chapter_draft || '',
    rag_context: ragChunks,
    lo_index: (staticData.lo_outputs || []).length
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🔁 LO Body Loop', '📖 Inject LO Context', 1); // output 1 = items to process

// ─── NODE 8: Phase 2 — BODY AI Call (per LO) ───
const bodyUserPrompt = `(function() {
  const d = $json;

  return 'LERNZIEL: ' + d.lo_id + ' (' + d.bloom_level + ')\\n' +
    'BESCHREIBUNG: ' + d.lo_description + '\\n' +
    'KAPITEL: ' + d.chapter_title + '\\n' +
    'DOMAIN: ' + d.domain_id + '\\n' +
    'ZIELGRUPPE: ' + d.target_audience + '\\n\\n' +
    (d.rag_context ? 'RAG KONTEXT (Knowledge Base):\\n' + d.rag_context.substring(0, 2000) + '\\n\\n' : '') +
    (d.current_chapter_draft ? 'BISHERIGER KAPITEL-ENTWURF (nicht wiederholen!):\\n' + d.current_chapter_draft.substring(0, 3000) + '\\n\\n' : '') +
    'Generiere den Content für dieses Lernziel als JSON. KEINE Wiederholungen aus dem bisherigen Entwurf!';
})()`;

addNode('✍️ Phase 2: BODY per LO', 'httpRequest', 4.2, [1750, 500], {
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
  temperature: 0.5,
  max_tokens: 4000,
  messages: [
    { role: 'system', content: ${JSON.stringify(SYSTEM_PROMPT_BODY)} },
    { role: 'user', content: ${bodyUserPrompt} }
  ]
}) }}`,
  options: {},
}, { credentials: openAiCreds });
connect('📖 Inject LO Context', '✍️ Phase 2: BODY per LO');

// ─── NODE 9: Accumulate Body Output ───
addNode('📦 Accumulate LO', 'code', 2, [2000, 500], {
  jsCode: `// Parse LO body output and append to accumulator
const staticData = $getWorkflowStaticData('global');
const response = $input.first().json.choices[0].message.content;

let loBody;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  loBody = JSON.parse(jsonStr.trim());
} catch (e) {
  // Fallback: wrap raw text
  const loData = $('📖 Inject LO Context').first().json;
  loBody = {
    lo_id: loData.lo_id,
    lo_description: loData.lo_description,
    bloom_level: loData.bloom_level,
    content_sections: [{ heading: loData.lo_description, paragraphs: [response] }],
    key_terms: []
  };
}

// Append to accumulator
if (!staticData.lo_outputs) staticData.lo_outputs = [];
staticData.lo_outputs.push(loBody);
staticData.current_chapter_draft += '\\n\\n' + JSON.stringify(loBody);

// Extract code requests
if (!staticData.code_requests) staticData.code_requests = [];
const loStr = JSON.stringify(loBody);
const codeMatches = loStr.match(/<<CODE_REQUEST:[^>]+>>/g) || [];
for (const match of codeMatches) {
  staticData.code_requests.push(match.replace('<<CODE_REQUEST:', '').replace('>>', '').trim());
}

return [{ json: { lo_id: loBody.lo_id || 'done', accumulated: true } }];`,
  mode: 'runOnceForAllItems',
});
connect('✍️ Phase 2: BODY per LO', '📦 Accumulate LO');

// Loop back
connect('📦 Accumulate LO', '🔁 LO Body Loop');

// ─── NODE 10: Phase 3 — CLOSER AI Call ───
const closerUserPrompt = `(function() {
  const initData = $('📝 Init Accumulator').first().json;
  const staticData = $getWorkflowStaticData('global');

  return 'KAPITEL: ' + initData.title + '\\n' +
    'DOMAIN: ' + initData.domain_id + '\\n\\n' +
    'LERNZIELE:\\n' + (initData.learning_objectives || []).map(function(lo) {
      return '- ' + lo.id + ': ' + lo.description;
    }).join('\\n') + '\\n\\n' +
    'BISHERIGER KAPITEL-ENTWURF (vollständig):\\n' +
    (staticData.current_chapter_draft || '').substring(0, 6000) + '\\n\\n' +
    'Generiere den CLOSER (Synthese + MCQs + Übung) als JSON.';
})()`;

addNode('🎯 Phase 3: CLOSER', 'httpRequest', 4.2, [1500, 100], {
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
  temperature: 0.4,
  max_tokens: 3000,
  messages: [
    { role: 'system', content: ${JSON.stringify(SYSTEM_PROMPT_CLOSER)} },
    { role: 'user', content: ${closerUserPrompt} }
  ]
}) }}`,
  options: {},
}, { credentials: openAiCreds });
// LO Body Loop output 0 = "done" (all items processed)
connect('🔁 LO Body Loop', '🎯 Phase 3: CLOSER', 0);

// ─── NODE 11: Finalize Chapter JSON ───
addNode('📊 Finalize Chapter JSON', 'code', 2, [1750, 100], {
  jsCode: `// Build final structured JSON from all phases
const staticData = $getWorkflowStaticData('global');
const initData = $('📝 Init Accumulator').first().json;
const response = $input.first().json.choices[0].message.content;

// Parse closer
let closer;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  closer = JSON.parse(jsonStr.trim());
} catch (e) {
  closer = {
    synthesis: response,
    key_takeaways: [],
    mcqs: [],
    drill: { description: 'See chapter content for exercise' }
  };
}

const opener = staticData.opener || {};
const loOutputs = staticData.lo_outputs || [];
const codeRequests = staticData.code_requests || [];

// Build chapter summary for global_history
const summary = 'Kapitel "' + initData.title + '" (Domain: ' + initData.domain_id + '): ' +
  (initData.learning_objectives || []).map(function(lo) { return lo.description; }).join('; ') +
  '. ' + (closer.synthesis || '').substring(0, 200);

// Clean up static data
delete staticData.current_chapter_draft;
delete staticData.lo_outputs;
delete staticData.code_requests;
delete staticData.opener;

return [{
  json: {
    status: 'success',
    json_content: {
      chapter_id: initData.chapter_id,
      title: initData.title,
      domain_id: initData.domain_id,
      opener: opener,
      body: loOutputs,
      closer: closer
    },
    chapter_summary: summary,
    code_requests: codeRequests,
    has_code_requests: codeRequests.length > 0,
    job_id: initData.job_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🎯 Phase 3: CLOSER', '📊 Finalize Chapter JSON');

// ─── Build workflow JSON ───
const workflow = {
  name: 'WF-3 Chapter Builder',
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

console.log(`✅ Rebuilt WF-3-ChapterBuilder.json (${nodes.length} nodes)`);
console.log('   Features:');
console.log('   - Phase 1: OPENER (header + LO list + professional context)');
console.log('   - Phase 2: BODY LO Loop (SplitInBatches, per-LO AI call, accumulator)');
console.log('   - Phase 3: CLOSER (synthesis + MCQs + drill)');
console.log('   - Accumulator via $getWorkflowStaticData (grows per LO)');
console.log('   - JSON-only output (no HTML, no Markdown)');
console.log('   - Revision mode support (previous_draft + revision_feedback)');
console.log('   - Code request extraction (<<CODE_REQUEST>> placeholders)');
console.log('   - Structured final output: { json_content, chapter_summary, code_requests }');
