# TODO: n8n + Laravel/Tiptap Integration (Multi-Thread)

> Integration of n8n Content Factory with Laravel backend and Tiptap rich-text editor.
> Pattern: n8n (drafting) -> Laravel (content warehouse) -> Tiptap (human-in-the-loop editing)
>
> **Architecture: Modular Multi-Workflow** — each concern is an independent n8n workflow.
> A Manager workflow orchestrates everything via `Execute Workflow` nodes.

---

## Current State

The existing `wpi-content-factory-workflow.json` is a **monolithic 57-node workflow**.
All logic (architect, research, writing, coding, QA, output) lives in one file.
This refactor splits it into **8 encapsulated workflows** that communicate through a central manager.

---

## Modular Workflow Architecture

```
                        ┌─────────────────────┐
                        │  WF-0: MANAGER      │
                        │  (Orchestrator)      │
                        │                      │
                        │  State machine that  │
                        │  decides next step   │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
              ▼                    ▼                     ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │ WF-1: BLUEPRINT  │ │ WF-2: RESEARCH   │ │ WF-3: WRITER     │
   │ Architect agent   │ │ Syllabus + KB    │ │ Chapter drafting  │
   │ + blueprint parse │ │ research         │ │ + HTML generation │
   └──────────────────┘ └──────────────────┘ └──────────────────┘
              │                    │                     │
              ▼                    ▼                     ▼
   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
   │ WF-4: CODER      │ │ WF-5: EDITOR/QA  │ │ WF-6: COMPILER   │
   │ Code generation   │ │ ISO quality check │ │ Assemble book    │
   │ + validation      │ │ + scoring         │ │ HTML/MD convert  │
   └──────────────────┘ └──────────────────┘ └──────────────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │ WF-7: PUBLISHER  │
                                              │ Push to Laravel  │
                                              │ / Drive / Email  │
                                              └──────────────────┘
```

### Data Flow Between Workflows

```
Manager calls each WF via "Execute Workflow" node, passing:
  → Input:  { job_id, chapter_id, payload (context-specific) }
  ← Output: { status: "success"|"failed"|"needs_revision", result: {...} }

State is held in the Manager (workflow variables or a central DB/MCP call).
Each sub-workflow is stateless — it receives everything it needs and returns a result.
```

---

## Thread 1: n8n — WF-0 Manager (Orchestrator) Workflow

Central state machine that owns the book generation lifecycle.
Calls sub-workflows via `Execute Workflow` nodes based on current state.

- [ ] **1.1** Create new workflow `WF-0-Manager.json`
  - Trigger: Form Trigger (📥 Book Request Form) — migrated from monolith
  - Initialize state: `{ job_id, status, blueprint: null, chapters: [], current_phase }`
- [ ] **1.2** Implement state machine logic with Switch node
  - States: `init` → `blueprint` → `research` → `writing` → `coding` → `qa` → `compile` → `publish` → `done`
  - Each state calls the corresponding sub-workflow via `Execute Workflow` node
- [ ] **1.3** Add chapter loop inside Manager
  - For each chapter in blueprint: cycle through `research → writing → coding → qa`
  - Track per-chapter status: `{ chapter_id, phase, revision_count, score }`
- [ ] **1.4** Implement revision loop logic
  - If WF-5 (Editor/QA) returns `needs_revision` and `revision_count < 3` → re-trigger WF-3 (Writer) with feedback
  - If `revision_count >= 3` → escalate (pause for human or skip)
- [ ] **1.5** Add error handling at orchestrator level
  - If any sub-workflow fails → log error, retry once, then pause with notification
  - Error Trigger node to catch sub-workflow failures
- [ ] **1.6** Add Human Approval gate after WF-1 (Blueprint)
  - Wait for Webhook node — pauses until human approves/rejects blueprint
  - On rejection: re-trigger WF-1 with feedback
- [ ] **1.7** Implement parallel chapter processing (optional, phase 2)
  - Use `SplitInBatches` to process N chapters concurrently via Execute Workflow
- [ ] **1.8** Add job status tracking
  - Store progress in workflow variables or via HTTP to mcp-standards
  - Expose status via Webhook (GET) so Laravel can poll progress

---

## Thread 2: n8n — WF-1 Blueprint Generator Workflow

Encapsulates the Architect agent and blueprint parsing. Stateless.

- [ ] **2.1** Create workflow `WF-1-Blueprint.json`
  - Trigger: `Execute Workflow Trigger` (called by Manager)
  - Input: `{ job_id, product_definition, target_audience, focus_areas }`
- [ ] **2.2** Migrate Architect Agent node (OpenAI HTTP call) from monolith
  - System prompt: didactics expert
  - Output: raw blueprint text
- [ ] **2.3** Migrate Blueprint Parser (Code node) from monolith
  - Parse AI output into structured JSON: `{ title, chapters: [{ number, title, learning_goals, sections }] }`
- [ ] **2.4** Add Syllabus Activation step (HTTP to mcp-standards:3002)
  - Fetch syllabus domains & topics to enrich the blueprint
- [ ] **2.5** Return structured output to Manager
  - `{ status: "success", blueprint: {...} }` or `{ status: "failed", error: "..." }`
- [ ] **2.6** Add input validation — reject if required fields missing

---

## Thread 3: n8n — WF-2 Research Workflow

Encapsulates syllabus data fetching and knowledge base research for a single chapter.

- [ ] **3.1** Create workflow `WF-2-Research.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, chapter_title, learning_goals, syllabus_section }`
- [ ] **3.2** Migrate MCP research nodes from monolith
  - `📚 MCP: Get Syllabus Section` (mcp-standards:3002)
  - `📚 MCP: Get Chapter LOs` (mcp-standards:3002)
  - `🔍 MCP: Search Knowledge Base` (mcp-research:3003)
  - `🔍 MCP: Chapter Research` (mcp-research:3003)
- [ ] **3.3** Merge research results into a unified fact sheet (Code node)
  - Combine syllabus data + KB results + web research
- [ ] **3.4** Store research in knowledge base: `💾 MCP: Store in Knowledge Base`
- [ ] **3.5** Return output: `{ status: "success", fact_sheet: {...}, sources: [...] }`

---

## Thread 4: n8n — WF-3 Writer Workflow

Generates a chapter draft. Receives all context, returns HTML.

- [ ] **4.1** Create workflow `WF-3-Writer.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, blueprint_chapter, fact_sheet, style_guide, revision_feedback? }`
- [ ] **4.2** Migrate Writer Agent (OpenAI HTTP call — ✍️ WPI Technical Architect)
  - System prompt: WPI Tone-of-Voice + chapter context
  - If `revision_feedback` is present → include it in prompt for revision pass
- [ ] **4.3** Add Code node to post-process writer output
  - Validate HTML structure
  - Extract `<<CODE_REQUEST>>` placeholders into a separate list
- [ ] **4.4** Return output:
  ```json
  {
    "status": "success",
    "html_content": "<chapter HTML>",
    "code_requests": ["description1", "description2"],
    "has_code_requests": true
  }
  ```
- [ ] **4.5** Handle revision mode — when called with feedback, the prompt should include previous draft + editor notes

---

## Thread 5: n8n — WF-4 Coder Workflow

Generates and validates code snippets for a chapter. Self-correction loop is internal.

- [ ] **5.1** Create workflow `WF-4-Coder.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, code_requests: [...], chapter_context }`
- [ ] **5.2** Migrate Coder Agent (💻 WPI Coder Agent — OpenAI HTTP call)
  - Loop over each `code_request` and generate code
- [ ] **5.3** Migrate code validation step (🔬 MCP: Validate Code — mcp-coder:3004)
- [ ] **5.4** Implement internal self-correction loop (encapsulated inside this workflow)
  - If validation fails → re-prompt Coder with error (🔄 WPI Coder Self-Correct)
  - Max 3 retries per code snippet
- [ ] **5.5** Return output:
  ```json
  {
    "status": "success",
    "code_snippets": [{ "id": "req_1", "code": "...", "language": "js", "validated": true }]
  }
  ```
- [ ] **5.6** If no `code_requests` → skip (Manager should not call this WF if `has_code_requests == false`)

---

## Thread 6: n8n — WF-5 Editor/QA Workflow

Quality check against ISO criteria. Returns score and verdict.

- [ ] **6.1** Create workflow `WF-5-EditorQA.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, html_content, code_snippets, learning_goals }`
- [ ] **6.2** Migrate Editor Agent (🔍 WPI ISO Editor — OpenAI HTTP call)
  - Score 0–100 against ISO 17024 criteria
  - Generate exam questions for the chapter
- [ ] **6.3** Migrate ISO Compliance Check (📋 MCP: ISO Compliance Check — mcp-standards:3002)
- [ ] **6.4** Add Code node to evaluate score and produce verdict
  - `score >= 90` → `{ status: "success", verdict: "approved" }`
  - `score < 90` → `{ status: "success", verdict: "needs_revision", feedback: "..." }`
- [ ] **6.5** Return output:
  ```json
  {
    "status": "success",
    "verdict": "approved|needs_revision",
    "score": 92,
    "feedback": "...",
    "exam_questions": [...]
  }
  ```
- [ ] **6.6** The revision decision is NOT made here — the Manager reads the verdict and decides

---

## Thread 7: n8n — WF-6 Compiler Workflow

Assembles all finished chapters into a complete book and converts formats.

- [ ] **7.1** Create workflow `WF-6-Compiler.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapters: [{ chapter_id, html_content, code_snippets, exam_questions }] }`
- [ ] **7.2** Migrate chapter accumulation logic
  - `📦 Store Chapter` / `📥 Get Accumulated Chapters` (mcp-standards:3002)
- [ ] **7.3** Migrate book assembly Code node — merge chapters in order
- [ ] **7.4** Migrate HTML conversion (🌐 Convert Book to HTML — OpenAI or Code node)
- [ ] **7.5** Migrate question compilation (🌐 Convert Questions to HTML)
- [ ] **7.6** Generate output files via Convert to File nodes (HTML, MD)
- [ ] **7.7** Return output:
  ```json
  {
    "status": "success",
    "book_html": "<full book>",
    "book_md": "<full book markdown>",
    "exam_questions_html": "<questions>",
    "files": [{ "name": "book.html", "binary": "..." }]
  }
  ```

---

## Thread 8: n8n — WF-7 Publisher Workflow

Pushes finished content to one or more targets. Fully decoupled from generation.

- [ ] **8.1** Create workflow `WF-7-Publisher.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, targets: ["laravel", "gdrive", "email"], book_html, book_md, files, exam_questions }`
- [ ] **8.2** Add Switch node to route by target
- [ ] **8.3** **Target: Laravel API** — HTTP Request node
  - `POST https://<app-domain>/api/webhooks/import-guide`
  - Header: `Authorization: Bearer <API_TOKEN>`
  - Send each chapter individually:
    ```json
    { "chapter_id": "1.1", "title": "...", "html_content": "..." }
    ```
  - Loop over chapters, one HTTP call per chapter
- [ ] **8.4** **Target: Google Drive** — migrate existing Drive upload nodes
- [ ] **8.5** **Target: Email** — migrate existing email notification nodes
- [ ] **8.6** Configure n8n credentials for Laravel API token (Header Auth)
- [ ] **8.7** Add error handling per target (retry on 5xx, alert on 4xx, continue to next target)
- [ ] **8.8** Return output: `{ status: "success", published_to: ["laravel", "gdrive"], errors: [] }`

---

## Thread 9: n8n — Workflow Decomposition (Migration from Monolith)

The actual work of splitting `wpi-content-factory-workflow.json` into separate files.

- [ ] **9.1** Map every node in the 57-node monolith to its target sub-workflow
  - Create a node-to-workflow mapping table
- [ ] **9.2** Extract WF-1 nodes: Architect Agent, Blueprint Parser, Syllabus Activation
- [ ] **9.3** Extract WF-2 nodes: all MCP research + syllabus fetch nodes
- [ ] **9.4** Extract WF-3 nodes: Writer Agent + post-processing Code nodes
- [ ] **9.5** Extract WF-4 nodes: Coder Agent + Self-Correct + MCP Validate
- [ ] **9.6** Extract WF-5 nodes: Editor Agent + ISO Compliance Check
- [ ] **9.7** Extract WF-6 nodes: chapter accumulation + Convert to File nodes
- [ ] **9.8** Extract WF-7 nodes: email + any output nodes
- [ ] **9.9** Build WF-0 Manager from scratch — new workflow with Execute Workflow calls
- [ ] **9.10** Replace each extracted group with an `Execute Workflow Trigger` (input) at the start
- [ ] **9.11** Test each sub-workflow in isolation with mock input data
- [ ] **9.12** Integration test: run WF-0 end-to-end and verify identical output to monolith
- [ ] **9.13** Archive the monolith as `LEGACY-wpi-content-factory-workflow.json`

---

## Thread 10: Laravel Backend — API & Storage

Build the receiving endpoint, sanitize HTML, and persist content to the database.

- [ ] **10.1** Create Laravel API route: `POST /api/webhooks/import-guide`
- [ ] **10.2** Implement `ImportGuideController@store` with request validation
  - Required fields: `chapter_id`, `title`, `html_content`
- [ ] **10.3** Add API token authentication middleware (Bearer token via `auth:sanctum` or custom)
- [ ] **10.4** Implement HTML sanitization logic in a service class
  - Strip `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers
  - Keep only inner body content (headers, paragraphs, lists, divs, etc.)
  - Sanitize against XSS (use HTMLPurifier or similar)
- [ ] **10.5** Create database migration for `chapters` table
  - Fields: `id`, `chapter_id`, `title`, `html_content`, `json_content` (nullable), `status`, `imported_at`, `timestamps`
- [ ] **10.6** Create `Chapter` Eloquent model with fillable fields
- [ ] **10.7** Store cleaned HTML into `html_content` column
- [ ] **10.8** Optionally convert HTML to Tiptap JSON on the backend (using `ueberdosis/prosemirror-to-html` or equivalent PHP package) and store in `json_content`
- [ ] **10.9** Add `status` field workflow: `imported` → `in_review` → `approved` → `published`
- [ ] **10.10** Create `GET /api/jobs/{job_id}/status` endpoint — polls WF-0 Manager for progress
- [ ] **10.11** Write feature tests for the import endpoint (valid payload, missing fields, auth failure)

---

## Thread 11: Tiptap Frontend — Editor & Custom Extensions

Load AI-generated content into Tiptap and handle custom HTML structures.

### 11A: Basic Editor Setup

- [ ] **11.1** Create Vue/React page for chapter editing (route: `/chapters/{id}/edit`)
- [ ] **11.2** Fetch chapter content from Laravel API (`GET /api/chapters/{id}`)
- [ ] **11.3** Initialize Tiptap editor with fetched HTML: `editor.commands.setContent(html_content)`
- [ ] **11.4** Implement save functionality — `PUT /api/chapters/{id}` sends updated HTML back to Laravel
- [ ] **11.5** Add autosave (debounced, every 30s or on significant change)

### 11B: Custom Tiptap Extensions (Rendering Fidelity)

Map n8n AI output HTML structures to Tiptap node extensions so content is not "flattened".

- [ ] **11.6** Audit the HTML output from WF-3 Writer — catalog all custom tags/classes used
  - `<aside class="micro-case">` — Micro-Case boxes
  - `<div class="quiz-item">` — Inline quiz items
  - `<div class="key-takeaway">` — Key takeaway boxes
  - `<div class="code-example">` — Code example wrappers
  - (add others as discovered)
- [ ] **11.7** Create Tiptap `MicroCase` node extension
  - ParseRule: `tag: 'aside'`, `getAttrs: dom => dom.classList.contains('micro-case')`
  - Renders as styled `<aside>` block in the editor
- [ ] **11.8** Create Tiptap `QuizItem` node extension
  - ParseRule: `tag: 'div'`, `getAttrs: dom => dom.classList.contains('quiz-item')`
- [ ] **11.9** Create Tiptap `KeyTakeaway` node extension
  - ParseRule for `<div class="key-takeaway">`
- [ ] **11.10** Create Tiptap `CodeExample` node extension (or leverage existing CodeBlock with wrapper)
- [ ] **11.11** Register all custom extensions in the Tiptap editor config
- [ ] **11.12** Add CSS styles for each custom block in the editor view
- [ ] **11.13** Test: import a full AI-generated chapter and verify no content/structure is lost

---

## Thread 12: Content Review Workflow (Human-in-the-Loop)

Enable human editors to review, edit, and approve AI-generated content.
Revision requests are sent back to the **WF-0 Manager** which re-triggers the right sub-workflow.

- [ ] **12.1** Build chapter list dashboard showing all imported chapters with status badges
- [ ] **12.2** Add "Approve" / "Request Revision" actions on the edit page
- [ ] **12.3** On "Request Revision" — send feedback to WF-0 Manager via webhook
  - n8n webhook URL stored in Laravel config
  - Payload: `{ job_id, chapter_id, feedback, requested_changes }`
  - Manager receives this, re-triggers WF-3 (Writer) with feedback context
- [ ] **12.4** On "Approve" — update chapter status to `approved`
- [ ] **12.5** Add version history / revision tracking (store previous HTML versions)
- [ ] **12.6** Add diff view to compare AI draft vs human-edited version
- [ ] **12.7** Add progress dashboard — show real-time pipeline status from WF-0 Manager status endpoint

---

## Thread 13: DevOps & Configuration

- [ ] **13.1** Add environment variables to `.env`:
  - `N8N_API_TOKEN` — token for n8n to authenticate with Laravel
  - `N8N_WEBHOOK_URL` — URL for WF-0 Manager revision webhook
  - `N8N_STATUS_URL` — URL for WF-0 Manager status polling
  - `TIPTAP_EXTENSIONS` — feature flag for custom extensions (optional)
- [ ] **13.2** Add CORS configuration for the API if frontend is on a different domain
- [ ] **13.3** Add rate limiting to the import webhook endpoint
- [ ] **13.4** Document the integration setup in `docs/tiptap-integration.md`
- [ ] **13.5** Add Docker Compose service for the Laravel app alongside n8n
- [ ] **13.6** Add workflow version management — store all WF-*.json in `workflows/modular/` directory
- [ ] **13.7** Create a deployment script that imports all 8 workflows into n8n via API

---

## Priority Order

```
Phase 1: Foundation
  1. Thread  9   (Decompose monolith — migration plan + node mapping)
  2. Thread  1   (WF-0 Manager — the backbone)
  3. Threads 2-7 (WF-1 through WF-6 — extract sub-workflows)
  4. Thread  8   (WF-7 Publisher — includes Laravel push)

Phase 2: Laravel + Tiptap
  5. Thread 10   (Laravel API — receiving endpoint)
  6. Thread 11A  (Basic Tiptap editor)
  7. Thread 12   (Review workflow — human-in-the-loop)

Phase 3: Polish
  8. Thread 11B  (Custom Tiptap extensions — rendering fidelity)
  9. Thread 13   (DevOps — production readiness)
```

---

## Key Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| State storage in Manager | Workflow variables / mcp-standards DB / Redis | mcp-standards DB — already exists, persistent across restarts |
| Sub-workflow communication | Execute Workflow / Webhook chains / Message queue | Execute Workflow — native n8n, synchronous, typed I/O |
| Parallel chapter processing | Sequential loop / SplitInBatches / Separate triggers | Sequential first, then SplitInBatches in Phase 2 |
| Store as HTML or Tiptap JSON? | HTML only / JSON only / Both | Both — HTML for compatibility, JSON for editor performance |
| Custom extensions or flatten? | Full extensions / Simple divs / Accept flattening | Full extensions for best editor UX |
| Auth mechanism | Sanctum / Passport / Simple Bearer | Sanctum — lightweight, built-in |
| Frontend framework | Vue 3 / React | Match existing `admin-fe` stack |
| Revision feedback loop | Webhook to Manager / Manual re-trigger / Queue | Webhook to Manager — it owns the state machine |
| Workflow file management | Single folder / Subfolder per WF / Git-versioned | `workflows/modular/` subfolder, git-versioned |

---

## Naming Convention for Workflow Files

```
workflows/
├── modular/
│   ├── WF-0-Manager.json
│   ├── WF-1-Blueprint.json
│   ├── WF-2-Research.json
│   ├── WF-3-Writer.json
│   ├── WF-4-Coder.json
│   ├── WF-5-EditorQA.json
│   ├── WF-6-Compiler.json
│   └── WF-7-Publisher.json
├── legacy/
│   └── wpi-content-factory-workflow.json  (archived monolith)
└── ...
```

---

*Created: 2026-02-05*
*Updated: 2026-02-05 — Refactored to modular multi-workflow architecture*
*Based on: Tiptap + n8n integration requirements analysis*
