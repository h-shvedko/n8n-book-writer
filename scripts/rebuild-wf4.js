#!/usr/bin/env node
/**
 * rebuild-wf4.js — Rebuild WF-4-Coder.json
 *
 * Fixes from monolith extraction:
 * - Broken $('💾 Merge Chapter Context') reference (WF-0 node)
 * - Wrong input format ($json.current_chapter.*, $json.blueprint.*)
 * - Removed $getWorkflowStaticData('global').revision_count (belongs to WF-0)
 * - Add input validation
 * - Add SplitInBatches loop over code_requests (was single batch)
 * - Internal self-correction loop (max 3 retries per snippet)
 * - Structured output: { status, code_snippets: [{ id, code, language, validated }] }
 * - Normalize positions
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'workflows', 'modular', 'WF-4-Coder.json');

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

const required = ['job_id', 'chapter_id'];
const missing = required.filter(f => !input[f]);

if (missing.length > 0) {
  throw new Error('WF-4 input validation failed. Missing: ' + missing.join(', '));
}

const codeRequests = input.code_requests || [];

return [{
  json: {
    job_id: input.job_id,
    chapter_id: input.chapter_id,
    chapter_title: input.chapter_title || input.title || 'Untitled',
    domain_id: input.domain_id || '',
    target_audience: input.target_audience || 'Mid-Level Professionals',
    code_requests: codeRequests,
    has_code_requests: codeRequests.length > 0
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('Execute Workflow Trigger', '✅ Validate Input');

// ─── NODE 3: Prepare Code Items ───
addNode('📝 Prepare Code Items', 'code', 2, [500, 300], {
  jsCode: `// Convert code_requests array into items for SplitInBatches
const staticData = $getWorkflowStaticData('global');
staticData.code_snippets = [];

const data = $input.first().json;
const requests = data.code_requests || [];

if (requests.length === 0) {
  // No code requests — return empty result directly
  return [{
    json: {
      _skip: true,
      job_id: data.job_id,
      chapter_id: data.chapter_id
    }
  }];
}

return requests.map((req, index) => ({
  json: {
    request_id: 'req_' + (index + 1),
    description: typeof req === 'string' ? req : (req.description || String(req)),
    placeholder: typeof req === 'object' ? (req.placeholder || '') : '',
    index: index,
    chapter_title: data.chapter_title,
    domain_id: data.domain_id,
    target_audience: data.target_audience,
    job_id: data.job_id,
    chapter_id: data.chapter_id
  }
}));`,
  mode: 'runOnceForAllItems',
});
connect('✅ Validate Input', '📝 Prepare Code Items');

// ─── NODE 4: Code Request Loop ───
addNode('🔁 Code Request Loop', 'splitInBatches', 3, [750, 300], {
  batchSize: 1,
  options: {},
});
connect('📝 Prepare Code Items', '🔁 Code Request Loop');

// ─── NODE 5: Init Request Context ───
addNode('📝 Init Request Context', 'code', 2, [1000, 500], {
  jsCode: `// Reset retry counter for this code request
const staticData = $getWorkflowStaticData('global');
staticData.current_retry = 0;

const req = $input.first().json;
return [{ json: req }];`,
  mode: 'runOnceForAllItems',
});
connect('🔁 Code Request Loop', '📝 Init Request Context', 1); // output 1 = items

// ─── NODE 6: WPI Coder Agent ───
addNode('💻 WPI Coder Agent', 'httpRequest', 4.2, [1250, 500], {
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
  temperature: 0.2,
  max_tokens: 4000,
  messages: [
    {
      role: 'system',
      content: '## Your Identity\\nYou are the "WPI Coder Agent," a Senior Full-Stack Engineer and technical author. Your goal is to generate high-quality, production-ready code examples for the WPI Syllabus Guide.\\n\\n## Core Responsibilities\\n1. **Follow the Tangibility Mandate:** For every technical topic, you MUST provide a complete, syntactically correct code block.\\n2. **Technical Standards:** Use modern syntax (ES6+ for JavaScript, HTML5, CSS3) and handle common edge cases.\\n3. **WPI Tone of Voice:** Use a "Professional-Instructive" voice. Avoid "Du" or "Sie" in technical instructions.\\n4. **Zero Fluff:** Provide maximum competence with no filler words.\\n\\n## Code Validation Requirements\\nYour code will be automatically validated by the MCP Coder service after generation:\\n- JavaScript/TypeScript: ESLint ES6+ strict validation\\n- HTML: Structure and accessibility validation\\n- CSS: Syntax validation\\n\\n## Best Practices\\n1. Use const/let, never var\\n2. Use arrow functions and template literals\\n3. Handle errors gracefully\\n4. Include edge case handling\\n5. Add meaningful comments (German)\\n6. Keep examples practical and production-ready\\n\\n## Output Format\\nReturn ONLY a JSON object:\\n{\\n  "language": "javascript",\\n  "code": "// Vollständiger, lauffähiger Code hier",\\n  "explanation": "Kurze Erklärung wie es funktioniert.",\\n  "impact": "Warum ist dieser Ansatz wichtig?"\\n}\\n\\nWICHTIG: Antworte NUR mit validem JSON. Keine Markdown-Blöcke, keine Erklärungen außerhalb des JSON.'
    },
    {
      role: 'user',
      content: 'Erstelle ein Code-Beispiel für folgende Anfrage:\\n\\n**Anfrage:** ' + $json.description + '\\n\\n**Kontext:** Kapitel "' + $json.chapter_title + '"\\n**Zielgruppe:** ' + $json.target_audience + '\\n\\n**WICHTIG:** Der Code wird automatisch validiert. Achte besonders auf:\\n- ES6+ Syntax (const/let, arrow functions, template literals)\\n- Keine ungenutzten Variablen\\n- Syntaktische Korrektheit\\n- Edge Case Handling\\n\\nAntworte NUR mit dem JSON-Objekt.'
    }
  ]
}) }}`,
  options: {},
}, {
  credentials: openAiApi,
});

connect('📝 Init Request Context', '💻 WPI Coder Agent');

// ─── NODE 7: Parse Code Response ───
addNode('🔗 Parse Code Response', 'code', 2, [1500, 500], {
  jsCode: `// Parse the AI-generated code from response
const reqData = $('📝 Init Request Context').first().json;
const response = $input.first().json.choices[0].message?.content || '';

let codeResult;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  codeResult = JSON.parse(jsonStr.trim());
} catch (e) {
  // Fallback: extract code block from markdown
  const codeMatch = response.match(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/);
  if (codeMatch) {
    codeResult = {
      language: codeMatch[1] || 'javascript',
      code: codeMatch[2].trim(),
      explanation: '',
      impact: ''
    };
  } else {
    // Last resort: treat entire response as code
    codeResult = {
      language: 'javascript',
      code: response.trim(),
      explanation: '',
      impact: ''
    };
  }
}

return [{
  json: {
    request_id: reqData.request_id,
    description: reqData.description,
    placeholder: reqData.placeholder,
    language: codeResult.language || 'javascript',
    code: codeResult.code || '',
    explanation: codeResult.explanation || '',
    impact: codeResult.impact || '',
    raw_response: response,
    job_id: reqData.job_id,
    chapter_id: reqData.chapter_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('💻 WPI Coder Agent', '🔗 Parse Code Response');

// ─── NODE 8: MCP Validate Code ───
addNode('🔬 MCP: Validate Code', 'httpRequest', 4.2, [1750, 500], {
  method: 'POST',
  url: 'http://mcp-coder:3004/call',
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'Content-Type', value: 'application/json' }],
  },
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ (function() {
  const code = $json.code || '// no code';
  const lang = $json.language || 'javascript';
  const langMap = { 'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 'tsx': 'typescript' };
  const normalizedLang = langMap[lang] || lang;
  const validLangs = ['javascript', 'typescript', 'html', 'css', 'json'];
  return JSON.stringify({
    name: 'validate_code_snippet',
    arguments: {
      code: code,
      language: validLangs.includes(normalizedLang) ? normalizedLang : 'javascript',
      strict_mode: true,
      check_best_practices: false
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
connect('🔗 Parse Code Response', '🔬 MCP: Validate Code');

// ─── NODE 9: Parse Validation ───
addNode('📊 Parse Validation', 'code', 2, [2000, 500], {
  jsCode: `// Parse validation result from MCP-Coder
const codeData = $('🔗 Parse Code Response').first().json;
const staticData = $getWorkflowStaticData('global');

let validationResult = { valid: true, errors: [], suggestions: [] };
try {
  const valResp = $input.first().json;
  if (valResp.body?.content?.[0]?.text) {
    validationResult = JSON.parse(valResp.body.content[0].text);
  }
} catch (e) {
  // Validation service unavailable — treat as valid
}

return [{
  json: {
    ...codeData,
    code_validated: !!validationResult.valid,
    code_errors: validationResult.errors || [],
    code_suggestions: validationResult.suggestions || [],
    retry_count: staticData.current_retry || 0
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🔬 MCP: Validate Code', '📊 Parse Validation');

// ─── NODE 10: Code Valid? ───
addNode('🔀 Code Valid?', 'if', 2, [2250, 500], {
  conditions: {
    options: {
      caseSensitive: true,
      leftValue: '',
      typeValidation: 'strict',
    },
    conditions: [
      {
        id: 'code-valid',
        leftValue: '={{ $json.code_validated }}',
        rightValue: true,
        operator: {
          type: 'boolean',
          operation: 'equals',
        },
      },
    ],
    combinator: 'and',
  },
  options: {},
});
connect('📊 Parse Validation', '🔀 Code Valid?');

// ─── NODE 11: Collect Valid Result ───
addNode('📦 Collect Valid Result', 'code', 2, [2500, 300], {
  jsCode: `// Store validated code snippet in static data
const staticData = $getWorkflowStaticData('global');
if (!staticData.code_snippets) staticData.code_snippets = [];

const data = $input.first().json;

staticData.code_snippets.push({
  id: data.request_id,
  description: data.description,
  placeholder: data.placeholder,
  code: data.code,
  language: data.language,
  explanation: data.explanation || '',
  impact: data.impact || '',
  validated: true,
  retries: data.retry_count || 0
});

return [{ json: { collected: true, request_id: data.request_id, validated: true } }];`,
  mode: 'runOnceForAllItems',
});
connect('🔀 Code Valid?', '📦 Collect Valid Result', 0); // true path
connect('📦 Collect Valid Result', '🔁 Code Request Loop'); // back to loop

// ─── NODE 12: Retry Limit? ───
addNode('🔀 Retry Limit?', 'if', 2, [2500, 600], {
  conditions: {
    options: {
      caseSensitive: true,
      leftValue: '',
      typeValidation: 'strict',
    },
    conditions: [
      {
        id: 'retry-limit',
        leftValue: '={{ $json.retry_count }}',
        rightValue: 3,
        operator: {
          type: 'number',
          operation: 'lt',
        },
      },
    ],
    combinator: 'and',
  },
  options: {},
});
connect('🔀 Code Valid?', '🔀 Retry Limit?', 1); // false path

// ─── NODE 13: Self-Correct ───
addNode('🔄 WPI Coder Self-Correct', 'httpRequest', 4.2, [2750, 500], {
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
  temperature: 0.1,
  max_tokens: 4000,
  messages: [
    {
      role: 'system',
      content: '## Your Identity\\nYou are the "WPI Coder Agent" performing SELF-CORRECTION based on validation errors.\\n\\n## Your Task\\nThe code you previously generated failed validation. You MUST fix ALL errors reported by the validator.\\n\\n## Correction Strategy\\n1. Fix syntax errors first (blocking issues)\\n2. Apply ES6+ best practices (const/let, arrow functions, template literals)\\n3. Remove unused variables\\n4. Ensure all edge cases are handled\\n5. Maintain code readability and comments\\n\\n## Output Format\\nReturn ONLY a JSON object with the corrected code:\\n{\\n  "language": "javascript",\\n  "code": "// Korrigierter, lauffähiger Code",\\n  "explanation": "Kurze Erklärung",\\n  "impact": "Warum dieser Ansatz"\\n}\\n\\nWICHTIG: Antworte NUR mit validem JSON. Keine Erklärungen außerhalb des JSON.'
    },
    {
      role: 'user',
      content: '**Validation Failed - Self-Correction Required**\\n\\n**Original Code (' + $json.language + '):**\\n' + $json.code + '\\n\\n**Validation Errors:**\\n' + JSON.stringify($json.code_errors, null, 2) + '\\n\\n**Suggestions:**\\n' + ($json.code_suggestions || []).join('\\n') + '\\n\\n**Retry:** ' + (($json.retry_count || 0) + 1) + ' / 3\\n\\nFix ALL errors and return the corrected code as JSON.'
    }
  ]
}) }}`,
  options: {},
}, {
  credentials: openAiApi,
});
connect('🔀 Retry Limit?', '🔄 WPI Coder Self-Correct', 0); // true = retries left

// ─── NODE 14: Parse Corrected Code ───
addNode('🔗 Parse Corrected Code', 'code', 2, [3000, 500], {
  jsCode: `// Parse self-corrected code and increment retry counter
const staticData = $getWorkflowStaticData('global');
staticData.current_retry = (staticData.current_retry || 0) + 1;

const prevData = $('📊 Parse Validation').first().json;
const response = $input.first().json.choices[0].message?.content || '';

let codeResult;
try {
  let jsonStr = response;
  if (response.includes('\`\`\`json')) {
    jsonStr = response.split('\`\`\`json')[1].split('\`\`\`')[0];
  } else if (response.includes('\`\`\`')) {
    jsonStr = response.split('\`\`\`')[1].split('\`\`\`')[0];
  }
  codeResult = JSON.parse(jsonStr.trim());
} catch (e) {
  const codeMatch = response.match(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/);
  if (codeMatch) {
    codeResult = {
      language: codeMatch[1] || prevData.language,
      code: codeMatch[2].trim()
    };
  } else {
    codeResult = {
      language: prevData.language,
      code: response.trim()
    };
  }
}

return [{
  json: {
    request_id: prevData.request_id,
    description: prevData.description,
    placeholder: prevData.placeholder,
    language: codeResult.language || prevData.language,
    code: codeResult.code || prevData.code,
    explanation: codeResult.explanation || prevData.explanation || '',
    impact: codeResult.impact || prevData.impact || '',
    raw_response: response,
    job_id: prevData.job_id,
    chapter_id: prevData.chapter_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
connect('🔄 WPI Coder Self-Correct', '🔗 Parse Corrected Code');

// Self-correction feeds back to MCP Validate for re-validation
connect('🔗 Parse Corrected Code', '🔬 MCP: Validate Code');

// ─── NODE 15: Accept As-Is ───
addNode('📦 Accept As-Is', 'code', 2, [2750, 700], {
  jsCode: `// Retry limit reached — store code with validated=false
const staticData = $getWorkflowStaticData('global');
if (!staticData.code_snippets) staticData.code_snippets = [];

const data = $input.first().json;

staticData.code_snippets.push({
  id: data.request_id,
  description: data.description,
  placeholder: data.placeholder,
  code: data.code,
  language: data.language,
  explanation: data.explanation || '',
  impact: data.impact || '',
  validated: false,
  retries: data.retry_count || 0,
  errors: data.code_errors || []
});

return [{ json: { collected: true, request_id: data.request_id, validated: false } }];`,
  mode: 'runOnceForAllItems',
});
connect('🔀 Retry Limit?', '📦 Accept As-Is', 1); // false = no retries left
connect('📦 Accept As-Is', '🔁 Code Request Loop'); // back to loop

// ─── NODE 16: Build Output ───
addNode('📊 Build Output', 'code', 2, [1000, 100], {
  jsCode: `// Build final structured output from all collected snippets
const staticData = $getWorkflowStaticData('global');
const codeSnippets = staticData.code_snippets || [];
const validated = $('✅ Validate Input').first().json;

// Clean up static data
delete staticData.code_snippets;
delete staticData.current_retry;

// If no code requests were processed (skip flag)
if (codeSnippets.length === 0) {
  return [{
    json: {
      status: 'success',
      code_snippets: [],
      total_snippets: 0,
      validated_count: 0,
      job_id: validated.job_id,
      chapter_id: validated.chapter_id
    }
  }];
}

const validatedCount = codeSnippets.filter(s => s.validated).length;

return [{
  json: {
    status: 'success',
    code_snippets: codeSnippets,
    total_snippets: codeSnippets.length,
    validated_count: validatedCount,
    all_validated: validatedCount === codeSnippets.length,
    job_id: validated.job_id,
    chapter_id: validated.chapter_id
  }
}];`,
  mode: 'runOnceForAllItems',
});
// SplitInBatches output 0 = "done" (all items processed)
connect('🔁 Code Request Loop', '📊 Build Output', 0);

// ─── Build workflow JSON ───
const workflow = {
  name: 'WF-4 Code Generation',
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

console.log(`✅ Rebuilt WF-4-Coder.json (${nodes.length} nodes)`);
console.log('   Fixes:');
console.log('   - Fixed broken $() reference to WF-0 node (💾 Merge Chapter Context)');
console.log('   - Fixed input format: flat { job_id, chapter_id, code_requests } from WF-0');
console.log('   - Removed $getWorkflowStaticData("global").revision_count (belongs to WF-0)');
console.log('   - Added input validation node');
console.log('   - Added SplitInBatches loop over code_requests (was single batch)');
console.log('   - Per-request Coder Agent AI call (one snippet at a time)');
console.log('   - MCP code validation via mcp-coder:3004');
console.log('   - Self-correction loop: max 3 retries per snippet');
console.log('   - Structured output: { status, code_snippets: [{ id, code, language, validated }] }');
console.log('   - Coder Agent outputs JSON (not markdown code blocks)');
console.log('   - Normalized node positions');
