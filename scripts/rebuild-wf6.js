#!/usr/bin/env node
/**
 * rebuild-wf6.js — Rebuild WF-6-Compiler.json
 *
 * Fixes from monolith extraction:
 * - Broken $('🔧 Initialize BookState') reference (WF-1 node)
 * - Monolith positions (-30464, 12640)
 * - Output was Markdown — now JSON only (7.4)
 * - Referenced ch.content (markdown) → now ch.json_content (JSON)
 * - Referenced ch.exam_questions_markdown → now ch.exam_questions (JSON)
 * - Add input validation
 * - Chapters passed as input from Manager (no MCP accumulation needed)
 * - Compile complete book JSON structure (7.4)
 * - Structured output (7.5)
 * - Normalize positions
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'workflows', 'modular', 'WF-6-Compiler.json');

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

const required = ['job_id', 'chapters'];
const missing = required.filter(f => !input[f]);

if (missing.length > 0) {
  throw new Error('WF-6 input validation failed. Missing: ' + missing.join(', '));
}

if (!Array.isArray(input.chapters) || input.chapters.length === 0) {
  throw new Error('WF-6: chapters must be a non-empty array');
}

return [{
  json: {
    job_id: input.job_id,
    book_title: input.book_title || input.title || 'Untitled Book',
    book_subtitle: input.book_subtitle || input.subtitle || '',
    syllabus_id: input.syllabus_id || '',
    syllabus_name: input.syllabus_name || '',
    target_audience: input.target_audience || 'Mid-Level Professionals',
    chapters: input.chapters
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('Execute Workflow Trigger', '✅ Validate Input');

// ─── NODE 3: Compile Book JSON ───
addNode('📚 Compile Book JSON', 'code', 2, [500, 300], {
  jsCode: `// Assemble all chapters into a complete book JSON structure
const data = $input.first().json;
const chapters = data.chapters || [];

// Sort chapters by chapter number or index
const sortedChapters = [...chapters].sort((a, b) => {
  const numA = a.chapter_number || a.number || 0;
  const numB = b.chapter_number || b.number || 0;
  return numA - numB;
});

// Build compiled chapters array
const compiledChapters = sortedChapters.map((ch, index) => {
  // json_content comes from WF-3 ChapterBuilder
  const jsonContent = ch.json_content || {};

  // code_snippets comes from WF-4 Coder
  const codeSnippets = ch.code_snippets || [];

  // exam_questions comes from WF-5 Editor/QA
  const examQuestions = ch.exam_questions || [];

  return {
    chapter_id: ch.chapter_id || 'ch-' + (index + 1),
    number: ch.chapter_number || ch.number || index + 1,
    title: ch.title || jsonContent.title || 'Kapitel ' + (index + 1),
    domain_id: ch.domain_id || jsonContent.domain_id || '',
    opener: jsonContent.opener || null,
    body: jsonContent.body || [],
    closer: jsonContent.closer || null,
    code_snippets: codeSnippets,
    exam_questions: examQuestions,
    score: ch.score || null,
    verdict: ch.verdict || null
  };
});

// Collect all exam questions into a flat array
const allExamQuestions = [];
for (const ch of compiledChapters) {
  if (ch.exam_questions && ch.exam_questions.length > 0) {
    for (const q of ch.exam_questions) {
      allExamQuestions.push({
        ...q,
        chapter_id: ch.chapter_id,
        chapter_title: ch.title
      });
    }
  }
}

// Collect all code snippets
const allCodeSnippets = [];
for (const ch of compiledChapters) {
  if (ch.code_snippets && ch.code_snippets.length > 0) {
    for (const s of ch.code_snippets) {
      allCodeSnippets.push({
        ...s,
        chapter_id: ch.chapter_id,
        chapter_title: ch.title
      });
    }
  }
}

// Build the complete book JSON (7.4)
const bookJson = {
  title: data.book_title,
  subtitle: data.book_subtitle,
  metadata: {
    syllabus_id: data.syllabus_id,
    syllabus_name: data.syllabus_name,
    target_audience: data.target_audience,
    generated_at: new Date().toISOString(),
    total_chapters: compiledChapters.length,
    total_exam_questions: allExamQuestions.length,
    total_code_snippets: allCodeSnippets.length
  },
  chapters: compiledChapters.map(ch => ({
    chapter_id: ch.chapter_id,
    number: ch.number,
    title: ch.title,
    domain_id: ch.domain_id,
    opener: ch.opener,
    body: ch.body,
    closer: ch.closer,
    code_snippets: ch.code_snippets
  })),
  exam_questions: allExamQuestions
};

// Calculate chapter statistics
const scores = compiledChapters.filter(ch => typeof ch.score === 'number' && ch.score > 0);
const averageScore = scores.length > 0
  ? Math.round(scores.reduce((sum, ch) => sum + ch.score, 0) / scores.length)
  : null;

return [{
  json: {
    book_json: bookJson,
    all_exam_questions: allExamQuestions,
    stats: {
      total_chapters: compiledChapters.length,
      total_exam_questions: allExamQuestions.length,
      total_code_snippets: allCodeSnippets.length,
      average_score: averageScore,
      chapter_scores: compiledChapters.map(ch => ({
        chapter_id: ch.chapter_id,
        title: ch.title,
        score: ch.score,
        verdict: ch.verdict
      }))
    },
    job_id: data.job_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('✅ Validate Input', '📚 Compile Book JSON');

// ─── NODE 4: Build Output ───
addNode('📊 Build Output', 'code', 2, [750, 300], {
  jsCode: `// Build structured output (7.5)
const data = $input.first().json;

return [{
  json: {
    status: 'success',
    book_json: data.book_json,
    exam_questions_json: data.all_exam_questions,
    stats: data.stats,
    job_id: data.job_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('📚 Compile Book JSON', '📊 Build Output');

// ─── Build workflow JSON ───
const workflow = {
  name: 'WF-6 Book Compiler',
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

console.log(`\n✅ Rebuilt WF-6-Compiler.json (${nodes.length} nodes)`);
console.log('   Flow: Trigger → Validate → Compile Book JSON → Build Output');
console.log('   Fixes:');
console.log('   - Fixed broken $() reference to WF-1 node (🔧 Initialize BookState)');
console.log('   - Chapters now passed as input from Manager (no MCP accumulation fetch)');
console.log('   - Output is JSON-only (was Markdown in monolith)');
console.log('   - Complete book JSON structure with metadata, chapters, exam_questions (7.4)');
console.log('   - Added input validation node');
console.log('   - Structured output: { status, book_json, exam_questions_json } (7.5)');
console.log('   - Chapter statistics: scores, totals, code snippet count');
console.log('   - Normalized node positions');
console.log('   Credentials preserved:');
console.log(`     httpHeaderAuth: ${JSON.stringify(httpHeaderAuth)}`);
