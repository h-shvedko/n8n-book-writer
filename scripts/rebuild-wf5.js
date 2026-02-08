#!/usr/bin/env node
/**
 * rebuild-wf5.js — Rebuild WF-5-EditorQA.json
 *
 * Fixes from monolith extraction:
 * - Broken $('🔗 Merge Code'), $('⏭️ Skip Code'), $('📝 Extract Code Requests') refs
 * - Wrong input format ($json.draft_content → $json.json_content)
 * - Removed $getWorkflowStaticData('global').revision_count (belongs to WF-0)
 * - Removed revision loop (6.8: Manager reads verdict and decides)
 * - Removed KB storage (not Editor's responsibility)
 * - Add input validation
 * - Add LO coverage validation (6.4)
 * - Add hallucination check in Editor prompt (6.5)
 * - Score evaluation: >= 90 → approved, < 90 → needs_revision (6.6)
 * - Structured output (6.7)
 * - Normalize positions
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'workflows', 'modular', 'WF-5-EditorQA.json');

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

const openAiApi = getCredential('openAiApi');
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

const required = ['job_id', 'chapter_id', 'json_content', 'learning_objectives'];
const missing = required.filter(f => !input[f]);

if (missing.length > 0) {
  throw new Error('WF-5 input validation failed. Missing: ' + missing.join(', '));
}

// Ensure learning_objectives is an array
const los = Array.isArray(input.learning_objectives)
  ? input.learning_objectives
  : [input.learning_objectives];

return [{
  json: {
    job_id: input.job_id,
    chapter_id: input.chapter_id,
    chapter_title: input.chapter_title || input.title || 'Untitled',
    chapter_number: input.chapter_number || '?',
    domain_id: input.domain_id || '',
    json_content: input.json_content,
    code_snippets: input.code_snippets || [],
    learning_objectives: los,
    target_audience: input.target_audience || 'Mid-Level Professionals'
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('Execute Workflow Trigger', '✅ Validate Input');

// ─── NODE 3: MCP ISO Compliance Check ───
addNode('📋 MCP: ISO Compliance Check', 'httpRequest', 4.2, [500, 300], {
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
  jsonBody: `={{ (function() {
  const content = typeof $json.json_content === 'string'
    ? $json.json_content
    : JSON.stringify($json.json_content);
  return JSON.stringify({
    name: 'validate_iso_compliance',
    arguments: {
      content: content.substring(0, 10000),
      output_format: 'json'
    }
  });
})() }}`,
  options: {
    response: { response: { fullResponse: true } },
  },
}, {
  credentials: httpHeaderAuth,
  onError: 'continueRegularOutput',
});
connect('✅ Validate Input', '📋 MCP: ISO Compliance Check');

// ─── NODE 4: Parse ISO Result ───
addNode('📊 Parse ISO Result', 'code', 2, [750, 300], {
  jsCode: `// Parse MCP ISO Compliance response
const validated = $('✅ Validate Input').first().json;

let isoResult = { compliant: false, details: 'ISO check unavailable' };
try {
  const resp = $input.first().json;
  if (resp.body?.content?.[0]?.text) {
    isoResult = JSON.parse(resp.body.content[0].text);
  }
} catch (e) {
  isoResult = { compliant: false, details: 'Failed to parse ISO result: ' + e.message };
}

return [{
  json: {
    ...validated,
    iso_compliance: isoResult
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('📋 MCP: ISO Compliance Check', '📊 Parse ISO Result');

// ─── NODE 5: LO Coverage Check ───
addNode('🔍 LO Coverage Check', 'code', 2, [1000, 300], {
  jsCode: `// Check that every LO from the chapter blueprint has corresponding content
const data = $input.first().json;
const los = data.learning_objectives || [];

// Flatten json_content to searchable text
const contentStr = typeof data.json_content === 'string'
  ? data.json_content.toLowerCase()
  : JSON.stringify(data.json_content).toLowerCase();

const loCoverage = {};
let coveredCount = 0;

for (const lo of los) {
  // Extract meaningful text from the LO
  const loText = typeof lo === 'string' ? lo : (lo.title || lo.description || lo.id || String(lo));
  const loId = typeof lo === 'object' ? (lo.id || lo.lo_id || loText) : loText;

  // Check if LO keywords appear in content
  // Split LO into keywords (at least 3 chars), ignore common stop words
  const stopWords = ['und', 'die', 'der', 'das', 'für', 'von', 'mit', 'den', 'des', 'ein', 'eine', 'ist', 'are', 'the', 'and', 'for', 'can', 'will', 'how', 'was', 'bei'];
  const keywords = loText.toLowerCase()
    .replace(/[^a-zäöüß\\s]/gi, ' ')
    .split(/\\s+/)
    .filter(w => w.length >= 3 && !stopWords.includes(w));

  // LO is considered covered if >= 50% of its keywords appear in content
  const found = keywords.filter(kw => contentStr.includes(kw));
  const coverage = keywords.length > 0 ? found.length / keywords.length : 0;
  const isCovered = coverage >= 0.5;

  loCoverage[loId] = isCovered;
  if (isCovered) coveredCount++;
}

const allCovered = coveredCount === los.length;
const coveragePercent = los.length > 0 ? Math.round((coveredCount / los.length) * 100) : 100;

return [{
  json: {
    ...data,
    lo_coverage: loCoverage,
    lo_coverage_summary: {
      total: los.length,
      covered: coveredCount,
      missing: los.length - coveredCount,
      percent: coveragePercent,
      all_covered: allCovered
    }
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('📊 Parse ISO Result', '🔍 LO Coverage Check');

// ─── NODE 6: WPI ISO Editor ───
// Main AI call: scores content quality, checks for hallucination, generates exam questions
addNode('🔍 WPI ISO Editor', 'httpRequest', 4.2, [1250, 300], {
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
  jsonBody: `={{ (function() {
  const data = $json;
  const content = typeof data.json_content === 'string'
    ? data.json_content
    : JSON.stringify(data.json_content, null, 2);

  const isoCompliance = data.iso_compliance || {};
  const loCoverageSummary = data.lo_coverage_summary || {};
  const codeSnippets = data.code_snippets || [];

  const losText = (data.learning_objectives || []).map(function(lo, i) {
    var text = typeof lo === 'string' ? lo : (lo.title || lo.description || lo.id || String(lo));
    return (i + 1) + '. ' + text;
  }).join('\\n');

  const codeInfo = codeSnippets.length > 0
    ? 'Code Snippets included: ' + codeSnippets.length + ' (validated: ' + codeSnippets.filter(function(s) { return s.validated; }).length + ')'
    : 'No code snippets for this chapter';

  return JSON.stringify({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      {
        role: 'system',
        content: '## Your Identity\\nYou are the "WPI ISO Editor," a meticulous quality assurance expert specialized in the ISO 17024 standard and technical didactics. Your role is to audit content generated by the Writer and Coder agents to ensure it is "Exam-Ready" and free of "Fluff."\\n\\n## Core Audit Criteria\\n\\n### 1. Syllabus & Bloom Compliance\\n- **Coverage:** Verify that every Learning Objective (LO) from the provided list is addressed\\n- **Bloom Level:** Ensure depth matches target taxonomy (K4 must describe diagnostic paths, not just definitions)\\n- **Fact Check:** Cross-reference technical claims against ISO 17024 standards\\n\\n### 2. WPI Tone & Quality Standard\\n- **Neutrality:** Confirm neutral, factual tone\\n- **Address (CRITICAL):** STRICTLY ENFORCE removal of "Du" or "Sie" in technical instructions. Use passive voice or direct imperatives only.\\n  - DEDUCT -5 pts per Du/Sie violation\\n- **Structure:** Max 5-6 line paragraphs, bold key terms, zero filler words\\n- **Acronyms:** First-Mention Rule - all acronyms must be defined on first use (-2 pts per violation)\\n\\n### 3. Tangibility Mandate\\n- **Code-First:** Every technical topic MUST have syntactically correct code block\\n- **No Placeholders:** No "// TODO" or incomplete code\\n- **Calculations:** Show complete calculation paths for metrics\\n\\n### 4. Hallucination Check (CRITICAL)\\n- **ONLY the listed Learning Objectives should be covered**\\n- If content covers topics NOT in the provided LO list, flag as "hallucinated_topics"\\n- Content should stay strictly within the scope of this chapter\\'s LOs\\n- Do NOT penalize tangential explanations that SUPPORT the listed LOs\\n\\n## Scoring System (0-100)\\n- LO Completeness: 30 pts (All learning goals covered with Bloom-level depth?)\\n- Clarity & Tone: 25 pts (Zero fluff, correct voice? -5 per Du/Sie, -2 per undefined acronym)\\n- Code Quality: 20 pts (Tangible, commented examples? No placeholders?)\\n- Didactic Structure: 15 pts (Scenario -> Logic -> Takeaways included?)\\n- Exercises: 10 pts (Meaningful Check Your Knowledge + Scenario Drills?)\\n\\n## APPROVAL THRESHOLD\\n- **Score >= 90** \\u2192 approved\\n- **Score < 90** \\u2192 needs_revision (provide specific required_changes)\\n\\n## Output Format (JSON ONLY - no markdown)\\n{\\n  "score": number,\\n  "approved": boolean,\\n  "iso_compliant": boolean,\\n  "hallucinated_topics": [],\\n  "audit_log": {\\n    "satisfied_LOs": ["LO-1.1.1"],\\n    "missing_LOs": [],\\n    "tone_violations": [],\\n    "undefined_acronyms": [],\\n    "code_blocks_count": number,\\n    "code_validation_passed": boolean\\n  },\\n  "scoring_breakdown": {\\n    "lo_completeness": number,\\n    "clarity_and_tone": number,\\n    "code_quality": number,\\n    "didactic_structure": number,\\n    "exercises": number\\n  },\\n  "feedback": {\\n    "strengths": [],\\n    "required_changes": []\\n  },\\n  "exam_questions": [{\\n    "question": "string",\\n    "options": ["A)", "B)", "C)", "D)"],\\n    "correct": "char",\\n    "bloom_level": "string",\\n    "learning_objective": "string",\\n    "explanation": "string"\\n  }]\\n}'
      },
      {
        role: 'user',
        content: '## AUDIT REQUEST\\n\\n**Chapter ' + (data.chapter_number || '?') + ':** ' + (data.chapter_title || 'Unknown') + '\\n\\n### Target Learning Objectives (ONLY these should be covered):\\n' + losText + '\\n\\n### ISO 17024 Compliance Tool Result:\\n' + JSON.stringify(isoCompliance, null, 2) + '\\n\\n### LO Coverage Pre-Check:\\n' + JSON.stringify(loCoverageSummary, null, 2) + '\\n\\n### ' + codeInfo + '\\n\\n### Chapter Content to Audit (JSON FORMAT):\\n\\n' + content.substring(0, 12000) + '\\n\\n---\\n**AUDIT INSTRUCTIONS:**\\n1. Check each LO for coverage and Bloom-level depth\\n2. Scan for Du/Sie violations (CRITICAL: -5 pts each)\\n3. Count code blocks, verify no placeholders\\n4. Check structure (intro -> concepts -> practice -> summary)\\n5. Check for HALLUCINATED TOPICS not in the LO list above\\n6. Verify exercises are meaningful\\n7. Calculate score using 5 criteria (max 100)\\n8. Generate 5-8 exam questions covering different LOs\\n9. Return ONLY valid JSON (no markdown code blocks)'
      }
    ]
  });
})() }}`,
  options: {},
}, {
  credentials: openAiApi,
});
connect('🔍 LO Coverage Check', '🔍 WPI ISO Editor');

// ─── NODE 7: Parse Editor Response ───
addNode('📊 Parse Editor Response', 'code', 2, [1500, 300], {
  jsCode: `// Parse WPI ISO Editor AI response
const prevData = $('🔍 LO Coverage Check').first().json;
const response = $input.first().json.choices[0].message?.content || '';

let editorResult;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  editorResult = JSON.parse(jsonStr.trim());
} catch (e) {
  editorResult = {
    score: 0,
    approved: false,
    iso_compliant: false,
    hallucinated_topics: [],
    audit_log: {
      satisfied_LOs: [], missing_LOs: [], tone_violations: [],
      undefined_acronyms: [], code_blocks_count: 0, code_validation_passed: false
    },
    scoring_breakdown: {
      lo_completeness: 0, clarity_and_tone: 0, code_quality: 0,
      didactic_structure: 0, exercises: 0
    },
    feedback: {
      strengths: [],
      required_changes: ['Failed to parse ISO Editor response: ' + e.message]
    },
    exam_questions: []
  };
}

return [{
  json: {
    ...prevData,
    editor_result: editorResult
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🔍 WPI ISO Editor', '📊 Parse Editor Response');

// ─── NODE 8: Build Output ───
addNode('📊 Build Output', 'code', 2, [1750, 300], {
  jsCode: `// Build structured output with verdict — no revision loop (6.8: Manager decides)
const data = $input.first().json;
const editor = data.editor_result || {};
const loCoverage = data.lo_coverage || {};
const loCoverageSummary = data.lo_coverage_summary || {};

// Score threshold (6.6)
const APPROVAL_THRESHOLD = 90;
const score = editor.score || 0;
const verdict = score >= APPROVAL_THRESHOLD ? 'approved' : 'needs_revision';

// Build feedback combining all checks
const feedback = [];

// Editor feedback
if (editor.feedback?.required_changes) {
  feedback.push(...editor.feedback.required_changes);
}

// LO coverage gaps
if (!loCoverageSummary.all_covered) {
  const missingLOs = Object.entries(loCoverage)
    .filter(([_, covered]) => !covered)
    .map(([loId]) => loId);
  if (missingLOs.length > 0) {
    feedback.push('Missing LO coverage: ' + missingLOs.join(', '));
  }
}

// Hallucinated topics (6.5)
if (editor.hallucinated_topics && editor.hallucinated_topics.length > 0) {
  feedback.push('Hallucinated topics detected (content leak from other chapters): ' + editor.hallucinated_topics.join(', '));
}

// ISO compliance issues
if (!editor.iso_compliant && data.iso_compliance) {
  feedback.push('ISO 17024 compliance issues detected');
}

return [{
  json: {
    status: 'success',
    verdict: verdict,
    score: score,
    approval_threshold: APPROVAL_THRESHOLD,
    iso_compliant: !!editor.iso_compliant,
    lo_coverage: loCoverage,
    lo_coverage_summary: loCoverageSummary,
    hallucinated_topics: editor.hallucinated_topics || [],
    scoring_breakdown: editor.scoring_breakdown || {},
    audit_log: editor.audit_log || {},
    feedback: feedback,
    strengths: editor.feedback?.strengths || [],
    exam_questions: editor.exam_questions || [],
    job_id: data.job_id,
    chapter_id: data.chapter_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('📊 Parse Editor Response', '📊 Build Output');

// ─── Build workflow JSON ───
const workflow = {
  name: 'WF-5 Editor / QA',
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

console.log(`\n✅ Rebuilt WF-5-EditorQA.json (${nodes.length} nodes)`);
console.log('   Flow: Trigger → Validate → ISO Check → Parse ISO → LO Coverage → Editor AI → Parse Response → Build Output');
console.log('   Fixes:');
console.log('   - Fixed broken $() references to WF-0/WF-4 nodes (Merge Code, Skip Code, Extract Code Requests)');
console.log('   - Fixed input format: flat { job_id, chapter_id, json_content, learning_objectives } from WF-0');
console.log('   - Removed $getWorkflowStaticData("global").revision_count (belongs to WF-0)');
console.log('   - Removed revision loop — Manager reads verdict and decides (6.8)');
console.log('   - Removed KB storage node (not Editor responsibility)');
console.log('   - Added input validation node');
console.log('   - Added LO coverage check — keyword-based validation per LO (6.4)');
console.log('   - Added hallucination check in Editor AI prompt — flags topics outside LO scope (6.5)');
console.log('   - Score evaluation: >= 90 → approved, < 90 → needs_revision (6.6)');
console.log('   - Structured output: { status, verdict, score, lo_coverage, feedback, exam_questions } (6.7)');
console.log('   - ISO Compliance Check via MCP mcp-standards:3002 (6.3)');
console.log('   - Normalized node positions');
console.log('   Credentials preserved:');
console.log(`     openAiApi: ${JSON.stringify(openAiApi)}`);
console.log(`     httpHeaderAuth: ${JSON.stringify(httpHeaderAuth)}`);
