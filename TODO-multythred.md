# TODO: n8n + Admin FE Integration (Multi-Thread)

> Integration of n8n Content Factory with Admin Frontend and MySQL storage.
> Pattern: n8n (drafting) -> Admin FE API (storage & tracking) -> External Tiptap App (rendering from JSON)
>
> **Architecture: Modular Multi-Workflow with Double-Loop** — each concern is an independent n8n workflow.
> A Master Orchestrator (Loop 1) iterates chapters; a Chapter Builder (Loop 2) iterates Learning Objectives.
>
> **Output format: JSON only.** HTML rendering is handled externally based on the JSON structure.

---

## Jira Reference

**User Story:** Implement "Double-Loop" Agentic Workflow for Chapter Generation
**Title:** Develop Nested Agentic Generation Pipeline

### Acceptance Criteria

- [ ] **AC-1** Architecture Validation — Two nested workflows execute successfully:
  - Loop 1 (Master Orchestrator / WF-0): Iterates through syllabus chapters one by one
  - Loop 2 (Chapter Builder / WF-3): Iterates through the specific Learning Objectives (LOs) of a single chapter
- [ ] **AC-2** Context Continuity:
  - **Global History**: The system generates and stores a summary of past chapters to inform future ones
  - **Local Draft**: The system maintains a running `current_chapter_draft` that accumulates content step-by-step and is re-injected as context for the next LO
- [ ] **AC-3** Micro-Step Protocol — Chapter generation follows the strict three-phase sequence:
  - **Opener**: Header + LO List + Professional Context (no body content)
  - **Body**: Content for one LO at a time, using RAG data
  - **Closer**: Synthesis + Assessment (MCQs + Drill)
- [ ] **AC-4** Input Integration — The system correctly utilizes System Prompt (v30), Syllabus, and Vector-Based RAG Content as the immutable sources of truth
- [ ] **AC-5** Artifact Delivery — Final output is a **structured JSON document** (saved to MySQL DB via Admin FE API) and a text summary (passed to Global History)
- [ ] **AC-6** Storage — All execution logs, tracking data, and resulting books are persisted in the MySQL database container
- [ ] **AC-7** Status Tracking — Admin FE displays real-time workflow-level progress (which WF is running, not individual nodes)

---

## Current State

The existing `wpi-content-factory-workflow.json` is a **monolithic 57-node workflow**.
All logic (architect, research, writing, coding, QA, output) lives in one file.
This refactor splits it into **8 encapsulated workflows** that communicate through a central manager,
using a **Double-Loop** pattern to avoid token fatigue and maintain didactic depth.

Vector DB (Qdrant) is already set up and running in the Docker environment.

---

## Double-Loop Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LOOP 1 — WF-0: MASTER ORCHESTRATOR                                    │
│  Iterates: Syllabus Chapters (1.1, 1.2, 1.3, ...)                      │
│  Maintains: global_history (summary of ALL completed chapters)          │
│                                                                         │
│  for each chapter:                                                      │
│    ┌─────────────────────────────────────────────────────────────────┐  │
│    │  LOOP 2 — WF-3: CHAPTER BUILDER                                │  │
│    │  Iterates: Learning Objectives (LO 1.1.1, LO 1.1.2, ...)      │  │
│    │  Maintains: current_chapter_draft (accumulator, grows per LO)  │  │
│    │                                                                 │  │
│    │  Phase 1: OPENER                                                │  │
│    │    → Header + LO List + Professional Context                    │  │
│    │    → Appended to current_chapter_draft                          │  │
│    │                                                                 │  │
│    │  Phase 2: BODY (SplitInBatches — one LO at a time)             │  │
│    │    → For each LO:                                               │  │
│    │       ├─ RAG lookup (Qdrant) for this LO                        │  │
│    │       ├─ Generate content with context:                         │  │
│    │       │    system_prompt_v30 + syllabus + rag_data              │  │
│    │       │    + global_history + current_chapter_draft              │  │
│    │       └─ Append result to current_chapter_draft                 │  │
│    │                                                                 │  │
│    │  Phase 3: CLOSER                                                │  │
│    │    → Synthesis + Assessment (MCQs + Drill)                      │  │
│    │    → Appended to current_chapter_draft                          │  │
│    │    → Final JSON = structured chapter content                    │  │
│    └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│    → Save JSON to MySQL via Admin FE API (WF-7 Publisher)               │
│    → Generate chapter summary → append to global_history                │
│    → Report WF-level status to Admin FE API                             │
│    → Next chapter...                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Between Workflows

```
Manager (WF-0) calls each WF via "Execute Workflow" node, passing:
  → Input:  { job_id, chapter_id, payload (context-specific), global_history }
  ← Output: { status: "success"|"failed"|"needs_revision", result: {...} }

State held by Manager:
  - global_history:         string — running summary of all completed chapters
  - chapters_completed:     array  — list of finished chapter objects
  - current_chapter_index:  number — which chapter we're on

State held by Chapter Builder (WF-3) internally:
  - current_chapter_draft:  string — accumulator, grows with each LO (the "Local Draft")
  - los_remaining:          array  — LOs left to process in this chapter

Immutable inputs (never modified during execution):
  - System Prompt v30       — master writing instructions
  - Syllabus                — ISO 17024 structure (chapters, domains, LOs)
  - RAG Content             — vector-retrieved facts per LO from Qdrant

Status reporting:
  - WF-0 reports workflow-level progress to Admin FE API after each WF completes
  - Format: { job_id, status, current_wf, chapter_progress: "3/12" }
```

---

## Thread 0: Database Container — MySQL for Storage & Tracking

> Set up a MySQL Docker container to store execution logs, workflow tracking, and generated book content.

- [x] **0.1** Add MySQL service to `docker-compose.yml`
  - Image: `mysql:8.0`
  - Port: 3306 (internal network only, not exposed to host unless needed for debugging)
  - Persistent volume for data: `mysql_data:/var/lib/mysql`
  - Environment: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE=wpi_content`, `MYSQL_USER`, `MYSQL_PASSWORD`
- [x] **0.2** Design database schema
  - Table: `jobs` — workflow execution tracking
    ```sql
    CREATE TABLE jobs (
      id VARCHAR(36) PRIMARY KEY,
      syllabus_name VARCHAR(255),
      strategy VARCHAR(50),
      target_audience VARCHAR(100),
      status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
      total_chapters INT,
      completed_chapters INT DEFAULT 0,
      current_workflow VARCHAR(50),
      started_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    ```
  - Table: `workflow_logs` — per-workflow execution log
    ```sql
    CREATE TABLE workflow_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(36),
      workflow_name VARCHAR(100),
      chapter_id VARCHAR(20) NULL,
      status ENUM('started', 'completed', 'failed') DEFAULT 'started',
      input_summary TEXT NULL,
      output_summary TEXT NULL,
      error_message TEXT NULL,
      duration_ms INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    ```
  - Table: `books` — completed book storage
    ```sql
    CREATE TABLE books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(36),
      title VARCHAR(255),
      json_content JSON NOT NULL,
      exam_questions JSON NULL,
      global_history TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    ```
  - Table: `chapters` — individual chapter storage
    ```sql
    CREATE TABLE chapters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      book_id INT,
      job_id VARCHAR(36),
      chapter_id VARCHAR(20),
      title VARCHAR(255),
      chapter_index INT,
      json_content JSON NOT NULL,
      exam_questions JSON NULL,
      chapter_summary TEXT NULL,
      editor_score INT NULL,
      status ENUM('draft', 'approved') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    ```
- [x] **0.3** Create init SQL script (`db/init.sql`) — runs on first container start
- [x] **0.4** Add Admin FE API endpoints for DB access (see Thread 8)
- [ ] **0.5** Add n8n credentials for MySQL (if n8n writes directly) or HTTP credentials for Admin FE API
- [x] **0.6** Connect MySQL container to the same Docker network as n8n and Admin FE

---

## Thread 1: n8n — WF-0 Master Orchestrator (Loop 1: Chapters)

> **Jira Sub-task:** Workflow A: Build the "Master Orchestrator" in n8n to parse the Syllabus and manage Global History variables.

Central state machine that owns the book generation lifecycle.
**This is Loop 1** — iterates through syllabus chapters one by one.
Maintains `global_history` across chapters for context continuity.
Reports workflow-level status to Admin FE API after each step.

- [x] **1.1** Create new workflow `WF-0-Manager.json`
  - Trigger: Form Trigger (Book Request Form) — migrated from monolith
  - Initialize state:
    ```json
    {
      "job_id": "uuid",
      "status": "init",
      "global_history": "",
      "chapters_completed": [],
      "current_chapter_index": 0,
      "blueprint": null
    }
    ```
- [x] **1.2** **Register job in DB** — POST to Admin FE API to create job record
  - `POST /api/jobs` → `{ job_id, syllabus_name, strategy, target_audience, status: "running" }`
- [x] **1.3** Call WF-1 (Blueprint) to generate the syllabus-based chapter plan
  - Pass: `{ job_id, product_definition, target_audience, focus_areas }`
  - Receive: `{ blueprint: { chapters: [{ id, title, learning_objectives: [...] }] } }`
  - Report status: `{ current_wf: "WF-1-Blueprint", chapter_progress: "0/N" }`
- [x] **1.4** **Implement Chapter Loop (Loop 1)** using `SplitInBatches` node
  - Iterates `blueprint.chapters` one by one (sequential, NOT parallel)
  - For each chapter, execute the pipeline: `research → chapter_build → coding → qa`
  - **Critical:** pass `global_history` into each iteration
- [x] **1.5** Per-chapter pipeline inside the loop:
  - Step A: Call WF-2 (Research) — `{ chapter, global_history }` → `{ fact_sheet }`
  - Step B: Call WF-3 (Chapter Builder) — `{ chapter, fact_sheet, global_history, system_prompt_v30 }` → `{ json_content, chapter_summary }`
  - Step C: If `has_code_requests` → Call WF-4 (Coder) — `{ code_requests }` → `{ code_snippets }`
  - Step D: Call WF-5 (Editor/QA) — `{ json_content, learning_goals }` → `{ score, verdict }`
  - **Report status after each step** to Admin FE API:
    `PATCH /api/jobs/{job_id}` → `{ current_workflow: "WF-3", completed_chapters: N }`
- [x] **1.6** **Update Global History after each chapter** (Code node)
  - `global_history += chapter_summary` (returned by WF-3)
  - This ensures the next chapter's generation is informed by all prior chapters
- [x] **1.7** Implement revision loop logic
  - If WF-5 returns `needs_revision` and `revision_count < 3` → re-call WF-3 with `{ revision_feedback, previous_draft }`
  - If `revision_count >= 3` → log warning and continue with best version
- [x] **1.8** After all chapters complete → Call WF-6 (Compiler) → Call WF-7 (Publisher)
- [x] **1.9** Add error handling at orchestrator level
  - If any sub-workflow fails → log error to DB, retry once, then mark job as failed
  - Report failure status to Admin FE API
- [x] **1.10** **Update job status on completion**
  - `PATCH /api/jobs/{job_id}` → `{ status: "completed", completed_at: timestamp }`

---

## Thread 2: n8n — WF-1 Blueprint Generator Workflow

Encapsulates the Architect agent and blueprint parsing. Stateless.
Must produce a structured list of chapters with their Learning Objectives (LOs) — this feeds both loops.

- [ ] **2.1** Create workflow `WF-1-Blueprint.json`
  - Trigger: `Execute Workflow Trigger` (called by Manager)
  - Input: `{ job_id, product_definition, target_audience, focus_areas }`
- [ ] **2.2** Migrate Architect Agent node (OpenAI HTTP call) from monolith
  - System prompt: didactics expert
  - **No styling instructions** — output is structural/content only
  - Output: raw blueprint text
- [ ] **2.3** Migrate Blueprint Parser (Code node) from monolith
  - Parse AI output into structured JSON with **explicit LO arrays per chapter**:
    ```json
    {
      "title": "Book Title",
      "chapters": [
        {
          "id": "1.1",
          "title": "Foundations",
          "learning_objectives": [
            { "id": "LO-1.1.1", "description": "Understand X" },
            { "id": "LO-1.1.2", "description": "Apply Y" }
          ],
          "sections": ["..."]
        }
      ]
    }
    ```
  - **Critical for Loop 2:** Each chapter MUST have a parsed `learning_objectives` array
- [ ] **2.4** Add Syllabus Activation step (HTTP to mcp-standards:3002)
  - Fetch syllabus domains & topics to enrich the blueprint
  - **Do not request styling/formatting standards** — content structure only
  - Map syllabus LOs to blueprint chapters
- [ ] **2.5** Return structured output to Manager
  - `{ status: "success", blueprint: {...} }` or `{ status: "failed", error: "..." }`
- [ ] **2.6** Add input validation — reject if required fields missing

---

## Thread 3: n8n — WF-2 Research Workflow

Encapsulates syllabus data fetching and knowledge base research for a single chapter.
Performs **per-LO RAG lookups** against the existing Qdrant instance and returns structured results.

- [ ] **3.1** Create workflow `WF-2-Research.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, chapter_title, learning_objectives: [...], syllabus_section, global_history }`
- [ ] **3.2** Migrate MCP research nodes from monolith
  - `MCP: Get Syllabus Section` (mcp-standards:3002) — **content structure only, no styling**
  - `MCP: Get Chapter LOs` (mcp-standards:3002)
  - `MCP: Search Knowledge Base` (mcp-research:3003)
  - `MCP: Chapter Research` (mcp-research:3003)
- [ ] **3.3** **Add per-LO RAG lookup** (SplitInBatches over learning_objectives)
  - For each LO → query Qdrant with LO description
  - Collect top-k relevant chunks per LO
  - Output: `{ lo_id: "LO-1.1.1", rag_chunks: [{ text, score }] }`
- [ ] **3.4** Merge results into a structured fact sheet (Code node)
  - Combine: syllabus data + KB results + **per-LO RAG results**
  ```json
  {
    "chapter_context": "...",
    "lo_research": {
      "LO-1.1.1": { "rag_chunks": [...], "kb_facts": [...] },
      "LO-1.1.2": { "rag_chunks": [...], "kb_facts": [...] }
    },
    "sources": [...]
  }
  ```
- [ ] **3.5** Store research in knowledge base: `MCP: Store in Knowledge Base`
- [ ] **3.6** Return output: `{ status: "success", fact_sheet: {...}, sources: [...] }`

---

## Thread 4: n8n — WF-3 Chapter Builder (Loop 2: Learning Objectives)

> **Jira Sub-task:** Workflow B: Build the "Chapter Builder" in n8n with the "Split In Batches" loop for LOs.
> **Jira Sub-task:** Logic: Implement the "Accumulator" pattern in n8n code nodes to append generated text to `current_chapter_draft`.

**This is Loop 2** — the inner loop that iterates Learning Objectives within a single chapter.
Implements the **Micro-Step Protocol** (Opener → Body per LO → Closer).
Maintains `current_chapter_draft` as a running accumulator to avoid token fatigue.
**Output: structured JSON** — no HTML, no Markdown. HTML rendering happens externally.

- [ ] **4.1** Create workflow `WF-3-ChapterBuilder.json`
  - Trigger: `Execute Workflow Trigger`
  - Input:
    ```json
    {
      "job_id": "...",
      "chapter": { "id": "1.1", "title": "...", "learning_objectives": [...] },
      "fact_sheet": { "lo_research": { "LO-1.1.1": {...}, ... } },
      "global_history": "Summary of chapters completed so far...",
      "system_prompt_v30": "...",
      "revision_feedback": null
    }
    ```
- [ ] **4.2** **Initialize Accumulator** (Code node at workflow start)
  - Set `current_chapter_draft = ""` as a workflow variable
  - This string grows with each phase and is re-injected as context
- [ ] **4.3** **Phase 1: OPENER** (AI call — OpenAI HTTP Request)
  - Prompt context: `system_prompt_v30 + syllabus_chapter + global_history`
  - Generate: Chapter Header + LO List + Professional Context paragraph
  - **No styling/CSS instructions** — pure content structure
  - **Rule:** No body content — only framing and context-setting
  - Append result to `current_chapter_draft` via Code node (Accumulator pattern)
- [ ] **4.4** **Phase 2: BODY — LO Loop** (`SplitInBatches` node over `learning_objectives`)
  - For each LO:
    - **4.4.1** Retrieve per-LO RAG data from `fact_sheet.lo_research[lo_id]`
    - **4.4.2** AI call (OpenAI HTTP Request) with full context injection:
      - `system_prompt_v30` (immutable)
      - `syllabus` section for this LO (immutable)
      - `rag_data` for this LO (immutable)
      - `global_history` (read-only — what came before this chapter)
      - `current_chapter_draft` (what's been written so far in THIS chapter)
    - **4.4.3** Append AI output to `current_chapter_draft` (Code node — Accumulator)
    - **4.4.4** Extract `<<CODE_REQUEST>>` placeholders if any
  - **Critical:** The accumulator ensures each LO generation sees all prior LOs' output,
    preventing repetition and maintaining narrative flow
- [ ] **4.5** **Phase 3: CLOSER** (AI call — OpenAI HTTP Request)
  - Prompt context: `system_prompt_v30 + current_chapter_draft (full) + chapter LOs`
  - Generate:
    - Synthesis / Summary section
    - Assessment: Multiple Choice Questions (MCQs)
    - Assessment: Practical Drill / Exercise
  - Append to `current_chapter_draft` (final accumulator write)
- [ ] **4.6** **Finalize & Return as JSON** (Code node)
  - Convert `current_chapter_draft` into structured JSON:
    ```json
    {
      "status": "success",
      "json_content": {
        "chapter_id": "1.1",
        "title": "Chapter Title",
        "opener": {
          "header": "...",
          "learning_objectives": ["LO-1.1.1", "LO-1.1.2"],
          "professional_context": "..."
        },
        "body": [
          {
            "lo_id": "LO-1.1.1",
            "description": "Understand X",
            "content": "...",
            "code_examples": [...]
          }
        ],
        "closer": {
          "synthesis": "...",
          "mcqs": [...],
          "drill": { "description": "...", "starter_code": "..." }
        }
      },
      "chapter_summary": "Chapter 1.1 covered X, Y, Z...",
      "code_requests": ["desc1", "desc2"],
      "has_code_requests": true
    }
    ```
- [ ] **4.7** **Accumulator Implementation Detail** (Code node pattern)
  ```javascript
  // In n8n Code node — Accumulator append
  const currentDraft = $('Init Accumulator').first().json.current_chapter_draft || '';
  const newContent = $input.first().json.generated_text;
  const updatedDraft = currentDraft + '\n' + newContent;
  return [{ json: { current_chapter_draft: updatedDraft } }];
  ```
  - Use n8n's `$('nodeName')` to reference the accumulator across loop iterations
  - Alternative: use workflow static data (`$getWorkflowStaticData()`) for persistence within execution
- [ ] **4.8** Handle revision mode
  - When called with `revision_feedback` → include previous draft + editor notes in Opener prompt
  - Re-run the full Opener → Body → Closer pipeline with feedback context

---

## Thread 5: n8n — WF-4 Coder Workflow

Generates and validates code snippets for a chapter. Self-correction loop is internal.

- [ ] **5.1** Create workflow `WF-4-Coder.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, code_requests: [...], chapter_context }`
- [ ] **5.2** Migrate Coder Agent (WPI Coder Agent — OpenAI HTTP call)
  - Loop over each `code_request` and generate code
- [ ] **5.3** Migrate code validation step (MCP: Validate Code — mcp-coder:3004)
- [ ] **5.4** Implement internal self-correction loop (encapsulated inside this workflow)
  - If validation fails → re-prompt Coder with error (WPI Coder Self-Correct)
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
  - Input: `{ job_id, chapter_id, json_content, code_snippets, learning_objectives }`
- [ ] **6.2** Migrate Editor Agent (WPI ISO Editor — OpenAI HTTP call)
  - Score 0-100 against ISO 17024 criteria
  - Generate exam questions for the chapter
  - **Evaluate content quality only** — no styling/formatting checks
- [ ] **6.3** Migrate ISO Compliance Check (MCP: ISO Compliance Check — mcp-standards:3002)
- [ ] **6.4** **Validate LO coverage** — check that every LO from the chapter blueprint has corresponding content in the JSON
- [ ] **6.5** **Validate no hallucinated content** — check that content doesn't cover LOs from OTHER chapters (future content leak)
- [ ] **6.6** Add Code node to evaluate score and produce verdict
  - `score >= 90` → `{ status: "success", verdict: "approved" }`
  - `score < 90` → `{ status: "success", verdict: "needs_revision", feedback: "..." }`
- [ ] **6.7** Return output:
  ```json
  {
    "status": "success",
    "verdict": "approved|needs_revision",
    "score": 92,
    "lo_coverage": { "LO-1.1.1": true, "LO-1.1.2": true },
    "feedback": "...",
    "exam_questions": [...]
  }
  ```
- [ ] **6.8** The revision decision is NOT made here — the Manager reads the verdict and decides

---

## Thread 7: n8n — WF-6 Compiler Workflow

Assembles all finished chapters into a complete book as **JSON only**.

- [ ] **7.1** Create workflow `WF-6-Compiler.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapters: [{ chapter_id, json_content, code_snippets, exam_questions }] }`
- [ ] **7.2** Migrate chapter accumulation logic
  - `Store Chapter` / `Get Accumulated Chapters` (mcp-standards:3002)
- [ ] **7.3** Migrate book assembly Code node — merge chapters in order
- [ ] **7.4** Compile complete book JSON structure:
  ```json
  {
    "title": "Book Title",
    "metadata": {
      "syllabus": "WPI-WEB-DEV-2025",
      "target_audience": "Junior Developers",
      "generated_at": "2026-02-07T12:00:00Z",
      "total_chapters": 10
    },
    "chapters": [
      {
        "chapter_id": "1.1",
        "title": "...",
        "opener": { ... },
        "body": [ ... ],
        "closer": { ... }
      }
    ],
    "exam_questions": [ ... ]
  }
  ```
- [ ] **7.5** Return output:
  ```json
  {
    "status": "success",
    "book_json": { ... },
    "exam_questions_json": [ ... ]
  }
  ```

---

## Thread 8: n8n — WF-7 Publisher Workflow + Admin FE API

Publishes finished content to Admin FE API which stores everything in the MySQL database.
No Google Drive, no email, no external targets.

### 8A: n8n Publisher Workflow

- [ ] **8.1** Create workflow `WF-7-Publisher.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, book_json, exam_questions_json }`
- [ ] **8.2** **Store book to DB** — HTTP Request to Admin FE API
  - `POST /api/books` → `{ job_id, title, json_content, exam_questions }`
- [ ] **8.3** **Store individual chapters** — Loop over chapters
  - `POST /api/chapters` → `{ book_id, job_id, chapter_id, title, chapter_index, json_content, exam_questions, chapter_summary, editor_score }`
- [ ] **8.4** **Update job status** — `PATCH /api/jobs/{job_id}` → `{ status: "completed" }`
- [ ] **8.5** Add error handling (retry on 5xx, log errors to DB)
- [ ] **8.6** Return output: `{ status: "success", book_id: 123 }`

### 8B: Admin FE API Endpoints (new)

- [x] **8.7** Add API layer to Admin FE (Express/Node.js routes)
  - All endpoints connect to the MySQL container
- [x] **8.8** Implement job endpoints:
  - `POST /api/jobs` — create new job record
  - `GET /api/jobs` — list all jobs with status
  - `GET /api/jobs/:id` — get job details + progress
  - `PATCH /api/jobs/:id` — update job status/progress
- [x] **8.9** Implement book endpoints:
  - `POST /api/books` — store completed book
  - `GET /api/books` — list all books
  - `GET /api/books/:id` — get book with all chapters
- [x] **8.10** Implement chapter endpoints:
  - `POST /api/chapters` — store chapter
  - `GET /api/chapters/:id` — get single chapter JSON
  - `GET /api/books/:book_id/chapters` — list chapters for a book
- [x] **8.11** Implement workflow log endpoints:
  - `POST /api/logs` — store workflow execution log entry
  - `GET /api/jobs/:id/logs` — get all logs for a job
- [x] **8.12** Add authentication middleware (API key or Bearer token for n8n calls)

### 8C: Admin FE UI Updates

- [x] **8.13** Add "Books" page — list all generated books with status
- [x] **8.14** Add "Book Detail" page — view chapters, exam questions, metadata
- [x] **8.15** Add "Job Monitor" page — real-time workflow-level progress
  - Show: which WF is currently running (WF-0..WF-7), chapter progress (3/10)
  - Poll `GET /api/jobs/:id` for status updates
  - Display workflow pipeline as visual steps (not individual n8n nodes)
- [ ] **8.16** Enhance existing trigger interface to start new jobs and track them

---

## Thread 9: n8n — Workflow Decomposition (Migration from Monolith)

The actual work of splitting `wpi-content-factory-workflow.json` into separate files.

- [x] **9.1** Map every node in the 57-node monolith to its target sub-workflow
  - Create a node-to-workflow mapping table
- [x] **9.2** Extract WF-1 nodes: Architect Agent, Blueprint Parser, Syllabus Activation
- [x] **9.3** Extract WF-2 nodes: all MCP research + syllabus fetch nodes
- [x] **9.4** Extract WF-3 nodes: Writer Agent + post-processing Code nodes → rebuild as Chapter Builder with LO loop
- [x] **9.5** Extract WF-4 nodes: Coder Agent + Self-Correct + MCP Validate
- [x] **9.6** Extract WF-5 nodes: Editor Agent + ISO Compliance Check
- [x] **9.7** Extract WF-6 nodes: chapter accumulation + compile JSON
- [x] **9.8** Extract WF-7 nodes: output to Admin FE API
- [x] **9.9** Build WF-0 Manager from scratch — new workflow with Execute Workflow calls + Global History
- [x] **9.10** Replace each extracted group with an `Execute Workflow Trigger` (input) at the start
- [ ] **9.11** Test each sub-workflow in isolation with mock input data
- [ ] **9.12** Integration test: run WF-0 end-to-end and verify output matches expected JSON structure
- [x] **9.13** Archive the monolith as `LEGACY-wpi-content-factory-workflow.json`

---

## Thread 10: Validation — Chapter 1.1 Test Run

> **Jira Sub-task:** Testing: execute a test run for "Chapter 1.1" to verify that the "Professional Context" connects logically to "LO 1.1.1".

End-to-end validation of the Double-Loop architecture using a single chapter.

- [ ] **10.1** Prepare test fixtures for Chapter 1.1
  - Syllabus section 1.1 with its Learning Objectives
  - RAG content ingested for all LOs in 1.1 (already in Qdrant)
  - System Prompt v30
- [ ] **10.2** Run WF-3 (Chapter Builder) in isolation with Chapter 1.1 input
  - Verify Opener generates: Header + LO List + Professional Context
  - Verify Opener contains NO body content (only framing)
- [ ] **10.3** Verify LO loop execution
  - Each LO generates distinct content (no repetition)
  - `current_chapter_draft` accumulates correctly across iterations
  - RAG data for each LO is injected into the correct iteration
- [ ] **10.4** Verify Professional Context → LO 1.1.1 logical connection
  - The Professional Context (from Opener) should set up the narrative that LO 1.1.1 continues
  - No abrupt topic shifts between Opener and first LO body
- [ ] **10.5** Verify Closer generates: Synthesis + MCQs + Drill
  - MCQs reference content from the generated chapter (not hallucinated)
  - Drill exercise is relevant to the LOs covered
- [ ] **10.6** Verify `chapter_summary` is accurate and usable for `global_history`
- [ ] **10.7** Verify final JSON is well-structured and contains all expected sections
- [ ] **10.8** Verify data is stored correctly in MySQL via Admin FE API
- [ ] **10.9** Run the full pipeline through WF-0 Manager for Chapter 1.1 only
  - Confirm: Research → Chapter Build → (Coder if needed) → QA → Publisher → all pass

---

## Thread 11: MCP-Standards Adjustments

> Adjust mcp-standards to remove styling/formatting concerns. Content structure only.

- [x] **11.1** Review mcp-standards endpoints for styling-related data
  - Remove CSS/HTML styling guidelines from syllabus responses
  - Remove formatting templates
- [x] **11.2** Ensure `get_syllabus_section` returns only content structure (domains, LOs, topics)
- [x] **11.3** Remove any "style guide" or "formatting standards" from the standards database
- [ ] **11.4** Update system prompts in all WFs to not request styling/formatting
  - Architect: no styling instructions
  - Writer: content only, no HTML tags, no CSS classes
  - Editor: evaluate content quality, not formatting
- [ ] **11.5** Test that all MCP responses are styling-free

---

## Priority Order

```
Phase 1: Infrastructure
  1. Thread  0   (MySQL container + schema)
  2. Thread 11   (MCP-Standards cleanup — remove styling)

Phase 2: Core Double-Loop Engine
  3. Thread  9   (Decompose monolith — migration plan + node mapping)
  4. Thread  1   (WF-0 Manager — Loop 1 with Global History + status reporting)
  5. Thread  2   (WF-1 Blueprint — must output LO arrays per chapter)
  6. Thread  3   (WF-2 Research — per-LO RAG lookups via Qdrant)
  7. Thread  4   (WF-3 Chapter Builder — Loop 2, JSON output)
  8. Threads 5-7 (WF-4 Coder, WF-5 Editor/QA, WF-6 Compiler)

Phase 3: Storage & Publishing
  9. Thread  8A  (WF-7 Publisher — Admin FE API)
 10. Thread  8B  (Admin FE API endpoints + MySQL integration)
 11. Thread  8C  (Admin FE UI — books list, job monitor)

Phase 4: Validation
 12. Thread 10   (Chapter 1.1 test run — end-to-end verification)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | MySQL 8.0 in Docker | Structured data (jobs, books, chapters), JSON column support, well-known |
| Output format | JSON only | HTML rendered externally by Tiptap app; keeps generation pipeline clean |
| Vector DB | Qdrant (already running) | Already implemented in Docker environment |
| Styling in MCP | Removed | Styling is rendering concern, not generation concern |
| Accumulator storage in WF-3 | `$getWorkflowStaticData()` | Persists across loop iterations within execution |
| State storage in Manager | MySQL via Admin FE API | Persistent across restarts, queryable |
| Sub-workflow communication | Execute Workflow | Native n8n, synchronous, typed I/O |
| Parallel chapter processing | Sequential | Global History requires chapters in order |
| Publishing target | Admin FE API → MySQL | Single target, no email/Drive needed |
| Frontend | Admin FE (React, existing) | Already built, extend with books/jobs pages |
| Workflow file management | `workflows/modular/` subfolder | Git-versioned |

---

## Naming Convention for Workflow Files

```
workflows/
├── modular/
│   ├── WF-0-Manager.json           # Master Orchestrator (Loop 1)
│   ├── WF-1-Blueprint.json         # Blueprint Generator
│   ├── WF-2-Research.json          # Research + RAG per LO
│   ├── WF-3-ChapterBuilder.json    # Chapter Builder (Loop 2 — LOs)
│   ├── WF-4-Coder.json             # Code Generation
│   ├── WF-5-EditorQA.json          # Editor / QA
│   ├── WF-6-Compiler.json          # Book Assembly (JSON)
│   └── WF-7-Publisher.json         # Admin FE API Publishing
├── legacy/
│   └── wpi-content-factory-workflow.json  (archived monolith)
└── ...
```

---

*Created: 2026-02-05*
*Updated: 2026-02-07 — Removed Laravel/Tiptap/Vector DB threads (handled externally or already implemented). Switched to JSON-only output. Added MySQL container for storage. All data flows through Admin FE API.*
*Based on: Jira "Double-Loop" user story + Admin FE integration requirements*
