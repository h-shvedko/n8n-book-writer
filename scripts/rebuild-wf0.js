/**
 * Rebuild WF-0 Manager with:
 * - Proper global_history accumulation via $getWorkflowStaticData
 * - Revision loop (QA verdict → re-call WF-3, max 3 retries)
 * - Error handling + workflow log entries (POST /api/logs)
 * - Final job status update (PATCH /api/jobs)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();
const outputPath = path.join(__dirname, '..', 'workflows', 'modular', 'WF-0-Manager.json');

// Read existing WF-0 to preserve the Form Trigger and Extract Syllabus ID nodes
const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
const formTrigger = existing.nodes.find(n => n.name === '📥 Book Request Form');
const extractId = existing.nodes.find(n => n.name === '🔍 Extract Syllabus ID');

// ============================================================================
// NODES
// ============================================================================

// --- Phase 0: Trigger + Init ---

const initState = {
  parameters: {
    jsCode: `// Initialize workflow state using static data
const staticData = $getWorkflowStaticData('global');
staticData.global_history = '';
staticData.chapters_completed = [];
staticData.revision_counts = {};

const formData = $('🔍 Extract Syllabus ID').first().json;
return [{
  json: {
    job_id: $runId,
    syllabus_id: formData.syllabus_id,
    syllabus_name: formData.syllabus_name,
    generation_strategy: formData.generation_strategy,
    target_audience: formData.target_audience,
    global_history: '',
    status: 'init'
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '🔧 Initialize State',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [500, 300],
};

// --- Phase 1: Register Job ---

const registerJob = {
  parameters: {
    method: 'POST',
    url: '=http://admin-api:3005/api/jobs',
    sendBody: true, specifyBody: 'json',
    jsonBody: `={
  "id": "{{ $json.job_id }}",
  "syllabus_name": "{{ $json.syllabus_name }}",
  "strategy": "{{ $json.generation_strategy }}",
  "target_audience": "{{ $json.target_audience }}",
  "status": "running",
  "started_at": "{{ new Date().toISOString() }}"
}`,
    options: {},
  },
  id: uuid(), name: '📋 Register Job',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [750, 300],
};

// --- Log helper function (reusable pattern) ---
function logNode(name, wfName, posX, posY) {
  return {
    parameters: {
      method: 'POST',
      url: '=http://admin-api:3005/api/logs',
      sendBody: true, specifyBody: 'json',
      jsonBody: `={
  "job_id": "{{ $('🔧 Initialize State').first().json.job_id }}",
  "workflow_name": "${wfName}",
  "chapter_id": {{ $json.chapter_id ? '"' + $json.chapter_id + '"' : 'null' }},
  "status": "completed"
}`,
      options: {},
    },
    id: uuid(), name,
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
    position: [posX, posY],
  };
}

function reportNode(name, wfLabel, posX, posY) {
  return {
    parameters: {
      method: 'PATCH',
      url: `=http://admin-api:3005/api/jobs/{{ $('🔧 Initialize State').first().json.job_id }}`,
      sendBody: true, specifyBody: 'json',
      jsonBody: `={ "current_workflow": "${wfLabel}" }`,
      options: {},
    },
    id: uuid(), name,
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
    position: [posX, posY],
  };
}

// --- Phase 2: Call WF-1 Blueprint ---

const reportBlueprint = reportNode('📊 Report: WF-1', 'WF-1-Blueprint', 1000, 300);

const callBlueprint = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '🏗️ Call WF-1 Blueprint',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [1250, 300],
};

const logBlueprint = logNode('📝 Log: WF-1', 'WF-1-Blueprint', 1500, 300);

// --- Phase 3: Prepare Chapters ---

const prepareChapters = {
  parameters: {
    jsCode: `// Extract chapters from blueprint output and prepare for loop
const blueprint = $('🏗️ Call WF-1 Blueprint').first().json;
const chapters = blueprint.blueprint?.chapters || blueprint.chapters || [];
const state = $('🔧 Initialize State').first().json;

return chapters.map((ch, idx) => ({
  json: {
    chapter_id: ch.id || ch.chapter_id || 'ch-' + (idx + 1),
    title: ch.title || 'Chapter ' + (idx + 1),
    learning_objectives: ch.learning_objectives || ch.sections || [],
    domain_id: ch.domain_id || ch.id || 'D' + (idx + 1),
    chapter_index: idx,
    job_id: state.job_id,
    syllabus_id: state.syllabus_id,
    target_audience: state.target_audience
  }
}));`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '📑 Prepare Chapter List',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [1750, 300],
};

const updateTotal = {
  parameters: {
    method: 'PATCH',
    url: `=http://admin-api:3005/api/jobs/{{ $('🔧 Initialize State').first().json.job_id }}`,
    sendBody: true, specifyBody: 'json',
    jsonBody: `={ "total_chapters": {{ $input.all().length }} }`,
    options: {},
  },
  id: uuid(), name: '📊 Update Total Chapters',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [2000, 300],
};

// --- Phase 4: Chapter Loop ---

const chapterLoop = {
  parameters: { batchSize: 1, options: {} },
  id: uuid(), name: '🔁 Chapter Loop',
  type: 'n8n-nodes-base.splitInBatches', typeVersion: 3,
  position: [2250, 300],
};

// --- Inside Loop: Inject Global History ---

const injectHistory = {
  parameters: {
    jsCode: `// Inject current global_history from static data into chapter data
const staticData = $getWorkflowStaticData('global');
const chapter = $input.first().json;
return [{
  json: {
    ...chapter,
    global_history: staticData.global_history || ''
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '📖 Inject Global History',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [2500, 500],
};

// --- Call WF-2 Research ---

const reportResearch = reportNode('📊 Report: WF-2', 'WF-2-Research', 2750, 500);

const callResearch = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '🔍 Call WF-2 Research',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [3000, 500],
};

const logResearch = logNode('📝 Log: WF-2', 'WF-2-Research', 3250, 500);

// --- Call WF-3 Chapter Builder ---

const reportWriter = reportNode('📊 Report: WF-3', 'WF-3-ChapterBuilder', 3500, 500);

const callChapterBuilder = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '✍️ Call WF-3 Chapter Builder',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [3750, 500],
};

const logWriter = logNode('📝 Log: WF-3', 'WF-3-ChapterBuilder', 4000, 500);

// --- Code Needed? ---

const checkCode = {
  parameters: {
    jsCode: `const result = $input.first().json;
return [{ json: { ...result, has_code: !!(result.has_code_requests && result.code_requests?.length > 0) } }];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '🔀 Has Code Requests?',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [4250, 500],
};

const codeNeeded = {
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', rightValue: '' },
      conditions: [{
        id: uuid(),
        leftValue: '={{ $json.has_code }}',
        rightValue: 'true',
        operator: { type: 'string', operation: 'equals' },
      }],
    },
  },
  id: uuid(), name: '🔀 Code Needed?',
  type: 'n8n-nodes-base.if', typeVersion: 2.2,
  position: [4500, 500],
};

// --- Call WF-4 Coder ---

const callCoder = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '💻 Call WF-4 Coder',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [4750, 400],
};

const logCoder = logNode('📝 Log: WF-4', 'WF-4-Coder', 5000, 400);

// --- Call WF-5 Editor/QA ---

const reportQA = reportNode('📊 Report: WF-5', 'WF-5-EditorQA', 5250, 500);

const callEditor = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '🔍 Call WF-5 Editor/QA',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [5500, 500],
};

const logQA = logNode('📝 Log: WF-5', 'WF-5-EditorQA', 5750, 500);

// --- Revision Loop Logic (1.7) ---

const checkVerdict = {
  parameters: {
    jsCode: `// Check QA verdict and revision count
const result = $input.first().json;
const staticData = $getWorkflowStaticData('global');
const chapterId = result.chapter_id || 'unknown';
const revisionCount = staticData.revision_counts[chapterId] || 0;

const needsRevision = result.verdict === 'needs_revision' && revisionCount < 3;

if (needsRevision) {
  staticData.revision_counts[chapterId] = revisionCount + 1;
}

return [{
  json: {
    ...result,
    needs_revision: needsRevision,
    revision_count: revisionCount + (needsRevision ? 1 : 0),
    revision_feedback: result.feedback || ''
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '🔍 Check QA Verdict',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [6000, 500],
};

const verdictIf = {
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', rightValue: '' },
      conditions: [{
        id: uuid(),
        leftValue: '={{ $json.needs_revision }}',
        rightValue: 'true',
        operator: { type: 'string', operation: 'equals' },
      }],
    },
  },
  id: uuid(), name: '🔀 Needs Revision?',
  type: 'n8n-nodes-base.if', typeVersion: 2.2,
  position: [6250, 500],
};

const logRevision = {
  parameters: {
    method: 'POST',
    url: '=http://admin-api:3005/api/logs',
    sendBody: true, specifyBody: 'json',
    jsonBody: `={
  "job_id": "{{ $('🔧 Initialize State').first().json.job_id }}",
  "workflow_name": "Revision",
  "chapter_id": "{{ $json.chapter_id }}",
  "status": "started",
  "input_summary": "Revision {{ $json.revision_count }}/3: {{ $json.revision_feedback }}"
}`,
    options: {},
  },
  id: uuid(), name: '📝 Log: Revision',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [6500, 400],
};

// Revision re-calls WF-3 → connects back to callChapterBuilder area
// We need a "Prepare Revision Input" node that feeds back into WF-3

const prepareRevision = {
  parameters: {
    jsCode: `// Prepare input for WF-3 re-call with revision feedback
const result = $input.first().json;
const staticData = $getWorkflowStaticData('global');
return [{
  json: {
    chapter_id: result.chapter_id,
    title: result.title,
    learning_objectives: result.learning_objectives || [],
    domain_id: result.domain_id,
    job_id: result.job_id || $('🔧 Initialize State').first().json.job_id,
    syllabus_id: $('🔧 Initialize State').first().json.syllabus_id,
    target_audience: $('🔧 Initialize State').first().json.target_audience,
    global_history: staticData.global_history || '',
    revision_feedback: result.revision_feedback,
    previous_draft: result.json_content || ''
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '🔄 Prepare Revision',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [6750, 400],
};

// --- Update Global History (1.6 — fixed) ---

const updateHistory = {
  parameters: {
    jsCode: `// Append chapter summary to global_history in static data
const staticData = $getWorkflowStaticData('global');
const result = $input.first().json;
const chapterSummary = result.chapter_summary || '';

if (chapterSummary) {
  staticData.global_history = (staticData.global_history || '') + '\\n\\n--- Chapter: ' + (result.title || result.chapter_id) + ' ---\\n' + chapterSummary;
}

// Track completed chapter
if (!staticData.chapters_completed) staticData.chapters_completed = [];
staticData.chapters_completed.push({
  chapter_id: result.chapter_id,
  title: result.title,
  score: result.score || null
});

return [{ json: { ...result, global_history_updated: true } }];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '📝 Update Global History',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [6500, 600],
};

// --- Update Chapter Progress ---

const updateProgress = {
  parameters: {
    method: 'PATCH',
    url: `=http://admin-api:3005/api/jobs/{{ $('🔧 Initialize State').first().json.job_id }}`,
    sendBody: true, specifyBody: 'json',
    jsonBody: `={
  "completed_chapters": {{ $getWorkflowStaticData('global').chapters_completed?.length || 0 }}
}`,
    options: {},
  },
  id: uuid(), name: '📊 Update Chapter Progress',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [6750, 600],
};

// --- Loop back to Chapter Loop ---
// updateProgress → 🔁 Chapter Loop (back to loop)

// --- All Chapters Done (done branch from SplitInBatches) ---

const allDone = {
  parameters: {
    jsCode: `// All chapters processed — prepare for compilation
const staticData = $getWorkflowStaticData('global');
return [{
  json: {
    all_done: true,
    job_id: $('🔧 Initialize State').first().json.job_id,
    chapters_completed: staticData.chapters_completed || [],
    total_chapters: staticData.chapters_completed?.length || 0
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '✅ All Chapters Done',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [2500, 100],
};

// --- Call WF-6 Compiler ---

const reportCompiler = reportNode('📊 Report: WF-6', 'WF-6-Compiler', 2750, 100);

const callCompiler = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '📚 Call WF-6 Compiler',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [3000, 100],
};

const logCompiler = logNode('📝 Log: WF-6', 'WF-6-Compiler', 3250, 100);

// --- Call WF-7 Publisher ---

const reportPublisher = reportNode('📊 Report: WF-7', 'WF-7-Publisher', 3500, 100);

const callPublisher = {
  parameters: {
    source: 'database',
    workflowId: { __rl: true, value: '', mode: 'list' },
  },
  id: uuid(), name: '📤 Call WF-7 Publisher',
  type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2,
  position: [3750, 100],
};

const logPublisher = logNode('📝 Log: WF-7', 'WF-7-Publisher', 4000, 100);

// --- Final Job Status (1.10) ---

const updateJobComplete = {
  parameters: {
    method: 'PATCH',
    url: `=http://admin-api:3005/api/jobs/{{ $('🔧 Initialize State').first().json.job_id }}`,
    sendBody: true, specifyBody: 'json',
    jsonBody: `={
  "status": "completed",
  "completed_at": "{{ new Date().toISOString() }}"
}`,
    options: {},
  },
  id: uuid(), name: '✅ Mark Job Complete',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [4250, 100],
};

const jobDone = {
  parameters: {
    jsCode: `const jobId = $('🔧 Initialize State').first().json.job_id;
const staticData = $getWorkflowStaticData('global');
return [{
  json: {
    status: 'success',
    job_id: jobId,
    message: 'Book generation complete',
    chapters_generated: staticData.chapters_completed?.length || 0
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '🎉 Job Complete',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [4500, 100],
};

// --- Error Handler (1.9) ---

const errorHandler = {
  parameters: {
    jsCode: `// Global error handler — log error and mark job failed
const error = $input.first().json;
const jobId = $('🔧 Initialize State').first().json?.job_id || 'unknown';

return [{
  json: {
    job_id: jobId,
    error: error.message || error.error || 'Unknown error',
    status: 'failed'
  }
}];`,
    mode: 'runOnceForAllItems',
  },
  id: uuid(), name: '❌ Error Handler',
  type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [4500, -100],
};

const markJobFailed = {
  parameters: {
    method: 'PATCH',
    url: `=http://admin-api:3005/api/jobs/{{ $json.job_id }}`,
    sendBody: true, specifyBody: 'json',
    jsonBody: `={
  "status": "failed",
  "completed_at": "{{ new Date().toISOString() }}"
}`,
    options: {},
  },
  id: uuid(), name: '❌ Mark Job Failed',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [4750, -100],
};

const logError = {
  parameters: {
    method: 'POST',
    url: '=http://admin-api:3005/api/logs',
    sendBody: true, specifyBody: 'json',
    jsonBody: `={
  "job_id": "{{ $json.job_id }}",
  "workflow_name": "Error",
  "status": "failed",
  "error_message": "{{ $json.error }}"
}`,
    options: {},
  },
  id: uuid(), name: '📝 Log: Error',
  type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2,
  position: [5000, -100],
};

// ============================================================================
// ASSEMBLE WORKFLOW
// ============================================================================

const nodes = [
  formTrigger, extractId, initState, registerJob,
  reportBlueprint, callBlueprint, logBlueprint,
  prepareChapters, updateTotal, chapterLoop,
  injectHistory,
  reportResearch, callResearch, logResearch,
  reportWriter, callChapterBuilder, logWriter,
  checkCode, codeNeeded,
  callCoder, logCoder,
  reportQA, callEditor, logQA,
  checkVerdict, verdictIf,
  logRevision, prepareRevision,
  updateHistory, updateProgress,
  allDone,
  reportCompiler, callCompiler, logCompiler,
  reportPublisher, callPublisher, logPublisher,
  updateJobComplete, jobDone,
  errorHandler, markJobFailed, logError,
];

const connections = {
  // Phase 0: Trigger → Init
  '📥 Book Request Form': { main: [[{ node: '🔍 Extract Syllabus ID', type: 'main', index: 0 }]] },
  '🔍 Extract Syllabus ID': { main: [[{ node: '🔧 Initialize State', type: 'main', index: 0 }]] },
  '🔧 Initialize State': { main: [[{ node: '📋 Register Job', type: 'main', index: 0 }]] },

  // Phase 1: Register → Blueprint
  '📋 Register Job': { main: [[{ node: '📊 Report: WF-1', type: 'main', index: 0 }]] },
  '📊 Report: WF-1': { main: [[{ node: '🏗️ Call WF-1 Blueprint', type: 'main', index: 0 }]] },
  '🏗️ Call WF-1 Blueprint': { main: [[{ node: '📝 Log: WF-1', type: 'main', index: 0 }]] },
  '📝 Log: WF-1': { main: [[{ node: '📑 Prepare Chapter List', type: 'main', index: 0 }]] },

  // Phase 2: Prepare → Loop
  '📑 Prepare Chapter List': { main: [[{ node: '📊 Update Total Chapters', type: 'main', index: 0 }]] },
  '📊 Update Total Chapters': { main: [[{ node: '🔁 Chapter Loop', type: 'main', index: 0 }]] },

  // Chapter Loop: done → All Done, loop → Inject History
  '🔁 Chapter Loop': {
    main: [
      [{ node: '✅ All Chapters Done', type: 'main', index: 0 }],     // done branch
      [{ node: '📖 Inject Global History', type: 'main', index: 0 }], // loop branch
    ],
  },

  // Inside loop: Research
  '📖 Inject Global History': { main: [[{ node: '📊 Report: WF-2', type: 'main', index: 0 }]] },
  '📊 Report: WF-2': { main: [[{ node: '🔍 Call WF-2 Research', type: 'main', index: 0 }]] },
  '🔍 Call WF-2 Research': { main: [[{ node: '📝 Log: WF-2', type: 'main', index: 0 }]] },
  '📝 Log: WF-2': { main: [[{ node: '📊 Report: WF-3', type: 'main', index: 0 }]] },

  // Inside loop: Chapter Builder
  '📊 Report: WF-3': { main: [[{ node: '✍️ Call WF-3 Chapter Builder', type: 'main', index: 0 }]] },
  '✍️ Call WF-3 Chapter Builder': { main: [[{ node: '📝 Log: WF-3', type: 'main', index: 0 }]] },
  '📝 Log: WF-3': { main: [[{ node: '🔀 Has Code Requests?', type: 'main', index: 0 }]] },

  // Inside loop: Code check
  '🔀 Has Code Requests?': { main: [[{ node: '🔀 Code Needed?', type: 'main', index: 0 }]] },
  '🔀 Code Needed?': {
    main: [
      [{ node: '💻 Call WF-4 Coder', type: 'main', index: 0 }],        // true → Coder
      [{ node: '📊 Report: WF-5', type: 'main', index: 0 }],           // false → skip to QA
    ],
  },
  '💻 Call WF-4 Coder': { main: [[{ node: '📝 Log: WF-4', type: 'main', index: 0 }]] },
  '📝 Log: WF-4': { main: [[{ node: '📊 Report: WF-5', type: 'main', index: 0 }]] },

  // Inside loop: Editor/QA
  '📊 Report: WF-5': { main: [[{ node: '🔍 Call WF-5 Editor/QA', type: 'main', index: 0 }]] },
  '🔍 Call WF-5 Editor/QA': { main: [[{ node: '📝 Log: WF-5', type: 'main', index: 0 }]] },
  '📝 Log: WF-5': { main: [[{ node: '🔍 Check QA Verdict', type: 'main', index: 0 }]] },

  // Revision loop (1.7)
  '🔍 Check QA Verdict': { main: [[{ node: '🔀 Needs Revision?', type: 'main', index: 0 }]] },
  '🔀 Needs Revision?': {
    main: [
      [{ node: '📝 Log: Revision', type: 'main', index: 0 }],      // true → revision
      [{ node: '📝 Update Global History', type: 'main', index: 0 }], // false → proceed
    ],
  },
  '📝 Log: Revision': { main: [[{ node: '🔄 Prepare Revision', type: 'main', index: 0 }]] },
  '🔄 Prepare Revision': { main: [[{ node: '📊 Report: WF-3', type: 'main', index: 0 }]] }, // loop back to WF-3

  // Update history and progress
  '📝 Update Global History': { main: [[{ node: '📊 Update Chapter Progress', type: 'main', index: 0 }]] },
  '📊 Update Chapter Progress': { main: [[{ node: '🔁 Chapter Loop', type: 'main', index: 0 }]] }, // back to loop

  // All done → Compile → Publish → Complete
  '✅ All Chapters Done': { main: [[{ node: '📊 Report: WF-6', type: 'main', index: 0 }]] },
  '📊 Report: WF-6': { main: [[{ node: '📚 Call WF-6 Compiler', type: 'main', index: 0 }]] },
  '📚 Call WF-6 Compiler': { main: [[{ node: '📝 Log: WF-6', type: 'main', index: 0 }]] },
  '📝 Log: WF-6': { main: [[{ node: '📊 Report: WF-7', type: 'main', index: 0 }]] },
  '📊 Report: WF-7': { main: [[{ node: '📤 Call WF-7 Publisher', type: 'main', index: 0 }]] },
  '📤 Call WF-7 Publisher': { main: [[{ node: '📝 Log: WF-7', type: 'main', index: 0 }]] },
  '📝 Log: WF-7': { main: [[{ node: '✅ Mark Job Complete', type: 'main', index: 0 }]] },
  '✅ Mark Job Complete': { main: [[{ node: '🎉 Job Complete', type: 'main', index: 0 }]] },

  // Error handler
  '❌ Error Handler': { main: [[{ node: '❌ Mark Job Failed', type: 'main', index: 0 }]] },
  '❌ Mark Job Failed': { main: [[{ node: '📝 Log: Error', type: 'main', index: 0 }]] },
};

const workflow = {
  name: 'WF-0 Master Orchestrator',
  nodes,
  connections,
  settings: {
    executionOrder: 'v1',
    errorWorkflow: '',
  },
  meta: { templateCredsSetupCompleted: true },
};

fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
console.log(`✅ Rebuilt WF-0-Manager.json (${nodes.length} nodes)`);
console.log('   Features:');
console.log('   - $getWorkflowStaticData for global_history accumulation');
console.log('   - Revision loop (max 3 retries per chapter)');
console.log('   - Workflow log entries (POST /api/logs) after each WF');
console.log('   - Error handler with job failure marking');
console.log('   - Final job completion status update');
