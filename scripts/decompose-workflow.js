/**
 * Decompose the monolith WPI Content Factory workflow into modular sub-workflows.
 *
 * Maps every node from wpi-content-factory-workflow.json to a target sub-workflow,
 * then generates individual workflow JSON files.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();

// Read monolith
const monolithPath = path.join(__dirname, '..', 'workflows', 'wpi-content-factory-workflow.json');
const monolith = JSON.parse(fs.readFileSync(monolithPath, 'utf-8'));
const outputDir = path.join(__dirname, '..', 'workflows', 'modular');

// Build node lookup by name
const nodesByName = {};
for (const node of monolith.nodes) {
  nodesByName[node.name] = node;
}

// Build connection map: { fromNodeName: { outputIndex: [ { node: toNodeName, type: 'main', index: inputIndex } ] } }
const connectionMap = {};
for (const [fromNode, outputs] of Object.entries(monolith.connections)) {
  connectionMap[fromNode] = {};
  if (outputs.main) {
    for (let outputIdx = 0; outputIdx < outputs.main.length; outputIdx++) {
      const targets = outputs.main[outputIdx];
      if (targets) {
        connectionMap[fromNode][outputIdx] = targets;
      }
    }
  }
}

// ============================================================================
// NODE-TO-WORKFLOW MAPPING
// ============================================================================

const nodeMapping = {
  // WF-1: Blueprint Generator
  'WF-1': {
    name: 'WF-1-Blueprint',
    title: 'WF-1 Blueprint Generator',
    description: 'Generates book blueprint from syllabus. Architect Agent + Parser.',
    nodes: [
      '🔄 Activate Syllabus',
      '🔀 Route by Strategy',
      '📚 Fetch Syllabus Domains',
      '📑 Fetch Syllabus Topics',
      '🔧 Initialize BookState',
      '📚 MCP: Get Syllabus Section',
      '🔍 MCP: Search Knowledge Base',
      '🔀 Merge MCP Context',
      '🧩 Combine MCP Data',
      '🏗️ Architect Agent',
      '📋 Parse Blueprint',
    ],
  },

  // WF-2: Research
  'WF-2': {
    name: 'WF-2-Research',
    title: 'WF-2 Research Workflow',
    description: 'Per-chapter research: MCP calls + knowledge base search.',
    nodes: [
      '🔍 MCP: Chapter Research',
      '📚 MCP: Get Chapter LOs',
      '🔀 Merge MCP Results',
      '🔀 Add Chapter Data',
      '💾 Merge Chapter Context',
    ],
  },

  // WF-3: Chapter Builder (will be rebuilt with LO loop)
  'WF-3': {
    name: 'WF-3-ChapterBuilder',
    title: 'WF-3 Chapter Builder',
    description: 'Generates chapter content. Writer Agent with context accumulation.',
    nodes: [
      '✍️ WPI Technical Architect',
    ],
  },

  // WF-4: Coder
  'WF-4': {
    name: 'WF-4-Coder',
    title: 'WF-4 Code Generation',
    description: 'Code generation with validation and self-correction loop.',
    nodes: [
      '📝 Extract Code Requests',
      '🔀 Code Needed?',
      '💻 WPI Coder Agent',
      '🔗 Merge Code',
      '🔬 MCP: Validate Code',
      '📊 Parse Code Validation',
      '🔀 Code Valid?',
      '🔀 Code Retry?',
      '🔄 WPI Coder Self-Correct',
      '🔗 Merge Corrected Code',
      '⏭️ Skip Validation',
      '⏭️ Skip Code',
    ],
  },

  // WF-5: Editor/QA
  'WF-5': {
    name: 'WF-5-EditorQA',
    title: 'WF-5 Editor / QA',
    description: 'Quality check: ISO compliance + editorial review.',
    nodes: [
      '📋 MCP: ISO Compliance Check',
      '🔍 WPI ISO Editor',
      '📊 Parse ISO Editor Result',
      '🔀 Quality OK?',
      '🔀 Max Revisions?',
      '💾 MCP: Store in Knowledge Base',
    ],
  },

  // WF-6: Compiler
  'WF-6': {
    name: 'WF-6-Compiler',
    title: 'WF-6 Book Compiler',
    description: 'Assembles all chapters into a complete book JSON.',
    nodes: [
      '📥 Get Accumulated Chapters',
      '📚 Compile Book',
    ],
  },

  // WF-7: Publisher (will be rebuilt to use Admin FE API)
  'WF-7': {
    name: 'WF-7-Publisher',
    title: 'WF-7 Publisher',
    description: 'Publishes book to Admin FE API (MySQL storage).',
    nodes: [
      // Legacy nodes (will be replaced):
      '📄 Convert Book MD',
      '📄 Convert Questions MD',
      '🌐 Convert Book to HTML',
      '🌐 Convert Questions to HTML',
      '📋 Extract HTML Book',
      '📋 Extract HTML Questions',
      '📄 Convert Book HTML',
      '📄 Convert Questions HTML',
      '📦 Create ZIP',
      '📧 Final Book Email',
    ],
  },

  // Manager nodes (WF-0)
  'WF-0': {
    name: 'WF-0-Manager',
    title: 'WF-0 Master Orchestrator',
    description: 'Central state machine. Chapter loop + global history + status reporting.',
    nodes: [
      '📥 Book Request Form',
      '🔍 Extract Syllabus ID',
      '🗑️ Clear Chapter Accumulator',
      '📑 Prepare Chapters',
      '🔁 Chapter Loop',
      '🔀 All Chapters Done?',
      '✅ Finalize Chapter',
      '📧 Send Chapter Email',
      '📦 Store Chapter',
    ],
  },
};

// ============================================================================
// GENERATE MAPPING TABLE (9.1)
// ============================================================================

let mappingDoc = `# Workflow Decomposition — Node Mapping\n\n`;
mappingDoc += `> Generated from wpi-content-factory-workflow.json (${monolith.nodes.length} nodes)\n\n`;
mappingDoc += `| # | Node Name | Node Type | Target Workflow |\n`;
mappingDoc += `|---|-----------|-----------|------------------|\n`;

// Create reverse lookup: nodeName → workflowId
const nodeToWf = {};
for (const [wfId, wfDef] of Object.entries(nodeMapping)) {
  for (const nodeName of wfDef.nodes) {
    nodeToWf[nodeName] = wfId;
  }
}

let idx = 1;
for (const node of monolith.nodes) {
  const wf = nodeToWf[node.name] || 'UNMAPPED';
  const shortType = node.type.replace('n8n-nodes-base.', '');
  mappingDoc += `| ${idx} | ${node.name} | ${shortType} | ${wf} |\n`;
  idx++;
}

mappingDoc += `\n## Workflow Summary\n\n`;
for (const [wfId, wfDef] of Object.entries(nodeMapping)) {
  mappingDoc += `### ${wfDef.title}\n`;
  mappingDoc += `- **File:** \`${wfDef.name}.json\`\n`;
  mappingDoc += `- **Description:** ${wfDef.description}\n`;
  mappingDoc += `- **Nodes:** ${wfDef.nodes.length}\n\n`;
}

fs.writeFileSync(path.join(outputDir, 'NODE-MAPPING.md'), mappingDoc);
console.log('✅ Created NODE-MAPPING.md');

// ============================================================================
// HELPER: Build workflow JSON shell
// ============================================================================

function createWorkflow(name, title, nodes, connections) {
  return {
    name: title,
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
    meta: { templateCredsSetupCompleted: true },
  };
}

function createTriggerNode(x = 0, y = 0) {
  return {
    parameters: {},
    id: uuid(),
    name: 'Execute Workflow Trigger',
    type: 'n8n-nodes-base.executeWorkflowTrigger',
    typeVersion: 1.1,
    position: [x, y],
  };
}

function createExecuteWorkflowNode(name, x, y) {
  return {
    parameters: {
      source: 'database',
      workflowId: { __rl: true, value: '', mode: 'list' },
    },
    id: uuid(),
    name,
    type: 'n8n-nodes-base.executeWorkflow',
    typeVersion: 1.2,
    position: [x, y],
  };
}

function createCodeNode(name, jsCode, x, y) {
  return {
    parameters: { jsCode, mode: 'runOnceForAllItems' },
    id: uuid(),
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [x, y],
  };
}

function createHttpNode(name, method, url, x, y, bodyParams = {}) {
  const params = { method, url, options: {}, ...bodyParams };
  return {
    parameters: params,
    id: uuid(),
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [x, y],
  };
}

function createSetNode(name, jsonOutput, x, y) {
  return {
    parameters: { mode: 'raw', jsonOutput, options: {} },
    id: uuid(),
    name,
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [x, y],
  };
}

function createIfNode(name, conditions, x, y) {
  return {
    parameters: { conditions },
    id: uuid(),
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [x, y],
  };
}

function createSplitInBatchesNode(name, batchSize, x, y) {
  return {
    parameters: { batchSize, options: {} },
    id: uuid(),
    name,
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position: [x, y],
  };
}

// ============================================================================
// EXTRACT SUB-WORKFLOWS (WF-1 through WF-6)
// For each, extract the monolith nodes and rewire connections.
// ============================================================================

function extractWorkflow(wfId, wfDef) {
  const trigger = createTriggerNode(-200, 300);
  const extractedNodes = [trigger];
  const nodeIds = new Set(wfDef.nodes);

  // Clone and reposition nodes
  let xOffset = 0;
  let yOffset = 0;
  for (const nodeName of wfDef.nodes) {
    const original = nodesByName[nodeName];
    if (!original) {
      console.warn(`  ⚠️  Node "${nodeName}" not found in monolith`);
      continue;
    }
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = uuid(); // New ID for the new workflow
    extractedNodes.push(clone);
  }

  // Build connections: only include connections between nodes in this workflow
  const wfConnections = {};

  // Add trigger → first node connection
  const firstNodeName = wfDef.nodes[0];
  if (firstNodeName) {
    wfConnections['Execute Workflow Trigger'] = {
      main: [[{ node: firstNodeName, type: 'main', index: 0 }]],
    };
  }

  // Extract internal connections
  for (const nodeName of wfDef.nodes) {
    if (connectionMap[nodeName]) {
      const outputs = {};
      let hasOutputs = false;
      for (const [outputIdx, targets] of Object.entries(connectionMap[nodeName])) {
        const internalTargets = targets.filter(t => nodeIds.has(t.node));
        if (internalTargets.length > 0) {
          outputs[outputIdx] = internalTargets;
          hasOutputs = true;
        }
      }
      if (hasOutputs) {
        const mainArray = [];
        const maxIdx = Math.max(...Object.keys(outputs).map(Number));
        for (let i = 0; i <= maxIdx; i++) {
          mainArray.push(outputs[i] || []);
        }
        wfConnections[nodeName] = { main: mainArray };
      }
    }
  }

  return createWorkflow(wfDef.name, wfDef.title, extractedNodes, wfConnections);
}

// Extract WF-1 through WF-6
for (const wfId of ['WF-1', 'WF-2', 'WF-3', 'WF-4', 'WF-5', 'WF-6']) {
  const wfDef = nodeMapping[wfId];
  const workflow = extractWorkflow(wfId, wfDef);
  const outPath = path.join(outputDir, `${wfDef.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
  console.log(`✅ Created ${wfDef.name}.json (${workflow.nodes.length} nodes)`);
}

// ============================================================================
// BUILD WF-7 Publisher (from scratch — Admin FE API)
// ============================================================================

const wf7Trigger = createTriggerNode(0, 300);
const wf7PrepareBook = createCodeNode('📦 Prepare Book Data', `
// Extract book data from workflow input
const input = $input.first().json;
const { job_id, book_json, exam_questions_json } = input;

return [{
  json: {
    job_id,
    title: book_json.title || 'Untitled Book',
    json_content: book_json,
    exam_questions: exam_questions_json || [],
    chapters: book_json.chapters || []
  }
}];
`, 250, 300);

const wf7StoreBook = createHttpNode('📚 Store Book in DB', 'POST',
  '=http://admin-api:3005/api/books', 500, 300, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={
  "job_id": "{{ $json.job_id }}",
  "title": "{{ $json.title }}",
  "json_content": {{ JSON.stringify($json.json_content) }},
  "exam_questions": {{ JSON.stringify($json.exam_questions) }}
}`,
  });

const wf7PrepareChapters = createCodeNode('📑 Prepare Chapters', `
// Prepare chapters for batch storage
const input = $input.first().json;
const book_id = input.id; // returned from book creation
const chapters = $('📦 Prepare Book Data').first().json.chapters;

return chapters.map((ch, idx) => ({
  json: {
    book_id,
    job_id: $('📦 Prepare Book Data').first().json.job_id,
    chapter_id: ch.chapter_id || ch.id || \`ch-\${idx+1}\`,
    title: ch.title || \`Chapter \${idx+1}\`,
    chapter_index: idx,
    json_content: ch,
    exam_questions: ch.closer?.mcqs || null,
    chapter_summary: ch.closer?.synthesis || null,
    editor_score: ch.editor_score || null
  }
}));
`, 750, 300);

const wf7ChapterLoop = createSplitInBatchesNode('🔁 Store Chapters Loop', 1, 1000, 300);

const wf7StoreChapter = createHttpNode('💾 Store Chapter', 'POST',
  '=http://admin-api:3005/api/chapters', 1250, 300, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={
  "book_id": {{ $json.book_id }},
  "job_id": "{{ $json.job_id }}",
  "chapter_id": "{{ $json.chapter_id }}",
  "title": "{{ $json.title }}",
  "chapter_index": {{ $json.chapter_index }},
  "json_content": {{ JSON.stringify($json.json_content) }},
  "exam_questions": {{ JSON.stringify($json.exam_questions) }},
  "chapter_summary": "{{ $json.chapter_summary }}",
  "editor_score": {{ $json.editor_score || 'null' }}
}`,
  });

const wf7UpdateJob = createHttpNode('✅ Update Job Status', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📦 Prepare Book Data").first().json.job_id }}', 1250, 100, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "status": "completed", "completed_at": "{{ new Date().toISOString() }}" }',
  });

const wf7Result = createCodeNode('📤 Return Result', `
const bookId = $('📚 Store Book in DB').first().json.id;
return [{ json: { status: "success", book_id: bookId } }];
`, 1500, 100);

const wf7 = createWorkflow('WF-7-Publisher', 'WF-7 Publisher', [
  wf7Trigger, wf7PrepareBook, wf7StoreBook, wf7PrepareChapters,
  wf7ChapterLoop, wf7StoreChapter, wf7UpdateJob, wf7Result,
], {
  'Execute Workflow Trigger': { main: [[{ node: '📦 Prepare Book Data', type: 'main', index: 0 }]] },
  '📦 Prepare Book Data': { main: [[{ node: '📚 Store Book in DB', type: 'main', index: 0 }]] },
  '📚 Store Book in DB': { main: [[{ node: '📑 Prepare Chapters', type: 'main', index: 0 }]] },
  '📑 Prepare Chapters': { main: [[{ node: '🔁 Store Chapters Loop', type: 'main', index: 0 }]] },
  '🔁 Store Chapters Loop': {
    main: [
      [{ node: '✅ Update Job Status', type: 'main', index: 0 }], // done
      [{ node: '💾 Store Chapter', type: 'main', index: 0 }],     // loop
    ],
  },
  '💾 Store Chapter': { main: [[{ node: '🔁 Store Chapters Loop', type: 'main', index: 0 }]] },
  '✅ Update Job Status': { main: [[{ node: '📤 Return Result', type: 'main', index: 0 }]] },
});

fs.writeFileSync(path.join(outputDir, 'WF-7-Publisher.json'), JSON.stringify(wf7, null, 2));
console.log(`✅ Created WF-7-Publisher.json (${wf7.nodes.length} nodes, from scratch)`);

// ============================================================================
// BUILD WF-0 Manager (from scratch — master orchestrator)
// ============================================================================

const wf0Trigger = JSON.parse(JSON.stringify(nodesByName['📥 Book Request Form']));
wf0Trigger.id = uuid();
wf0Trigger.position = [0, 300];

const wf0ExtractId = JSON.parse(JSON.stringify(nodesByName['🔍 Extract Syllabus ID']));
wf0ExtractId.id = uuid();
wf0ExtractId.position = [250, 300];

const wf0RegisterJob = createHttpNode('📋 Register Job', 'POST',
  '=http://admin-api:3005/api/jobs', 500, 300, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={
  "id": "{{ $runId }}",
  "syllabus_name": "{{ $json.syllabus_name }}",
  "strategy": "{{ $json.generation_strategy }}",
  "target_audience": "{{ $json.target_audience }}",
  "status": "running",
  "started_at": "{{ new Date().toISOString() }}"
}`,
  });

const wf0CallBlueprint = createExecuteWorkflowNode('🏗️ Call WF-1 Blueprint', 750, 300);
const wf0ReportBlueprint = createHttpNode('📊 Report: Blueprint Done', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📋 Register Job").first().json.id }}', 1000, 300, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "current_workflow": "WF-1-Blueprint" }',
  });

const wf0PrepareChapters = createCodeNode('📑 Prepare Chapter List', `
// Extract chapters from blueprint output
const blueprint = $('🏗️ Call WF-1 Blueprint').first().json;
const chapters = blueprint.blueprint?.chapters || blueprint.chapters || [];
const jobId = $('📋 Register Job').first().json.id;

// Update total chapters count
return chapters.map(ch => ({
  json: {
    ...ch,
    job_id: jobId,
    global_history: '',
    syllabus_id: $('🔍 Extract Syllabus ID').first().json.syllabus_id,
    target_audience: $('🔍 Extract Syllabus ID').first().json.target_audience
  }
}));
`, 1250, 300);

const wf0UpdateTotal = createHttpNode('📊 Update Total Chapters', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📋 Register Job").first().json.id }}', 1500, 300, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "total_chapters": {{ $input.all().length }} }',
  });

const wf0ChapterLoop = createSplitInBatchesNode('🔁 Chapter Loop', 1, 1750, 300);

const wf0CallResearch = createExecuteWorkflowNode('🔍 Call WF-2 Research', 2000, 400);
const wf0ReportResearch = createHttpNode('📊 Report: Research', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📋 Register Job").first().json.id }}', 2250, 400, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "current_workflow": "WF-2-Research" }',
  });

const wf0CallChapterBuilder = createExecuteWorkflowNode('✍️ Call WF-3 Chapter Builder', 2500, 400);
const wf0ReportWriter = createHttpNode('📊 Report: Writing', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📋 Register Job").first().json.id }}', 2750, 400, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "current_workflow": "WF-3-ChapterBuilder" }',
  });

const wf0CheckCode = createCodeNode('🔀 Has Code Requests?', `
const result = $input.first().json;
return [{ json: { ...result, has_code: result.has_code_requests || false } }];
`, 3000, 400);

const wf0CodeNeeded = createIfNode('🔀 Code Needed?', {
  options: { caseSensitive: true, leftValue: '', rightValue: '' },
  conditions: [{ id: uuid(), leftValue: '={{ $json.has_code }}', rightValue: 'true', operator: { type: 'string', operation: 'equals' } }],
}, 3250, 400);

const wf0CallCoder = createExecuteWorkflowNode('💻 Call WF-4 Coder', 3500, 300);
const wf0CallEditor = createExecuteWorkflowNode('🔍 Call WF-5 Editor/QA', 3750, 400);
const wf0ReportQA = createHttpNode('📊 Report: QA', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📋 Register Job").first().json.id }}', 4000, 400, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "current_workflow": "WF-5-EditorQA" }',
  });

const wf0UpdateHistory = createCodeNode('📝 Update Global History', `
// Append chapter summary to global history
const result = $input.first().json;
const currentHistory = $('📑 Prepare Chapter List').first().json.global_history || '';
const chapterSummary = result.chapter_summary || '';
const updatedHistory = currentHistory + '\\n\\n' + chapterSummary;

// Update the chapter data with new global history
return [{ json: { ...result, global_history: updatedHistory } }];
`, 4250, 400);

const wf0UpdateProgress = createHttpNode('📊 Update Chapter Progress', 'PATCH',
  '=http://admin-api:3005/api/jobs/{{ $("📋 Register Job").first().json.id }}', 4500, 400, {
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={ "completed_chapters": {{ $("🔁 Chapter Loop").first().json._batchIndex + 1 }} }',
  });

const wf0AllDone = createCodeNode('🔀 All Chapters Done?', `
// Check from SplitInBatches done output
return [{ json: { all_done: true, job_id: $('📋 Register Job').first().json.id } }];
`, 1750, 100);

const wf0CallCompiler = createExecuteWorkflowNode('📚 Call WF-6 Compiler', 2000, 100);
const wf0CallPublisher = createExecuteWorkflowNode('📤 Call WF-7 Publisher', 2250, 100);
const wf0Done = createCodeNode('✅ Job Complete', `
return [{ json: { status: 'success', message: 'Book generation complete' } }];
`, 2500, 100);

const wf0 = createWorkflow('WF-0-Manager', 'WF-0 Master Orchestrator', [
  wf0Trigger, wf0ExtractId, wf0RegisterJob, wf0CallBlueprint, wf0ReportBlueprint,
  wf0PrepareChapters, wf0UpdateTotal, wf0ChapterLoop,
  wf0CallResearch, wf0ReportResearch, wf0CallChapterBuilder, wf0ReportWriter,
  wf0CheckCode, wf0CodeNeeded, wf0CallCoder, wf0CallEditor, wf0ReportQA,
  wf0UpdateHistory, wf0UpdateProgress,
  wf0AllDone, wf0CallCompiler, wf0CallPublisher, wf0Done,
], {
  '📥 Book Request Form': { main: [[{ node: '🔍 Extract Syllabus ID', type: 'main', index: 0 }]] },
  '🔍 Extract Syllabus ID': { main: [[{ node: '📋 Register Job', type: 'main', index: 0 }]] },
  '📋 Register Job': { main: [[{ node: '🏗️ Call WF-1 Blueprint', type: 'main', index: 0 }]] },
  '🏗️ Call WF-1 Blueprint': { main: [[{ node: '📊 Report: Blueprint Done', type: 'main', index: 0 }]] },
  '📊 Report: Blueprint Done': { main: [[{ node: '📑 Prepare Chapter List', type: 'main', index: 0 }]] },
  '📑 Prepare Chapter List': { main: [[{ node: '📊 Update Total Chapters', type: 'main', index: 0 }]] },
  '📊 Update Total Chapters': { main: [[{ node: '🔁 Chapter Loop', type: 'main', index: 0 }]] },
  '🔁 Chapter Loop': {
    main: [
      [{ node: '🔀 All Chapters Done?', type: 'main', index: 0 }], // done
      [{ node: '🔍 Call WF-2 Research', type: 'main', index: 0 }], // loop
    ],
  },
  '🔍 Call WF-2 Research': { main: [[{ node: '📊 Report: Research', type: 'main', index: 0 }]] },
  '📊 Report: Research': { main: [[{ node: '✍️ Call WF-3 Chapter Builder', type: 'main', index: 0 }]] },
  '✍️ Call WF-3 Chapter Builder': { main: [[{ node: '📊 Report: Writing', type: 'main', index: 0 }]] },
  '📊 Report: Writing': { main: [[{ node: '🔀 Has Code Requests?', type: 'main', index: 0 }]] },
  '🔀 Has Code Requests?': { main: [[{ node: '🔀 Code Needed?', type: 'main', index: 0 }]] },
  '🔀 Code Needed?': {
    main: [
      [{ node: '💻 Call WF-4 Coder', type: 'main', index: 0 }],   // true
      [{ node: '🔍 Call WF-5 Editor/QA', type: 'main', index: 0 }], // false
    ],
  },
  '💻 Call WF-4 Coder': { main: [[{ node: '🔍 Call WF-5 Editor/QA', type: 'main', index: 0 }]] },
  '🔍 Call WF-5 Editor/QA': { main: [[{ node: '📊 Report: QA', type: 'main', index: 0 }]] },
  '📊 Report: QA': { main: [[{ node: '📝 Update Global History', type: 'main', index: 0 }]] },
  '📝 Update Global History': { main: [[{ node: '📊 Update Chapter Progress', type: 'main', index: 0 }]] },
  '📊 Update Chapter Progress': { main: [[{ node: '🔁 Chapter Loop', type: 'main', index: 0 }]] },
  '🔀 All Chapters Done?': { main: [[{ node: '📚 Call WF-6 Compiler', type: 'main', index: 0 }]] },
  '📚 Call WF-6 Compiler': { main: [[{ node: '📤 Call WF-7 Publisher', type: 'main', index: 0 }]] },
  '📤 Call WF-7 Publisher': { main: [[{ node: '✅ Job Complete', type: 'main', index: 0 }]] },
});

fs.writeFileSync(path.join(outputDir, 'WF-0-Manager.json'), JSON.stringify(wf0, null, 2));
console.log(`✅ Created WF-0-Manager.json (${wf0.nodes.length} nodes, from scratch)`);

// ============================================================================
// ARCHIVE MONOLITH
// ============================================================================

const legacyDir = path.join(__dirname, '..', 'workflows', 'legacy');
fs.copyFileSync(monolithPath, path.join(legacyDir, 'LEGACY-wpi-content-factory-workflow.json'));
console.log('✅ Archived monolith to workflows/legacy/LEGACY-wpi-content-factory-workflow.json');

console.log('\n🎉 Decomposition complete! Created 8 workflow files + mapping doc.');
