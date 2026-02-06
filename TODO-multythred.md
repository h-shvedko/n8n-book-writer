# TODO: n8n + Laravel/Tiptap Integration (Multi-Thread)

> Integration of n8n Content Factory with Laravel backend and Tiptap rich-text editor.
> Pattern: n8n (drafting) -> Laravel (content warehouse) -> Tiptap (human-in-the-loop editing)
>
> **Architecture: Modular Multi-Workflow with Double-Loop** — each concern is an independent n8n workflow.
> A Master Orchestrator (Loop 1) iterates chapters; a Chapter Builder (Loop 2) iterates Learning Objectives.

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
  - **Local Draft**: The system maintains a running `current_chapter_draft` string that accumulates text step-by-step and is re-injected as context for the next LO
- [ ] **AC-3** Micro-Step Protocol — Chapter generation follows the strict three-phase sequence:
  - **Opener**: Header + LO List + Professional Context (no body content)
  - **Body**: Content for one LO at a time, using RAG data
  - **Closer**: Synthesis + Assessment (MCQs + Drill)
- [ ] **AC-4** Input Integration — The system correctly utilizes System Prompt (v30), Syllabus, and Vector-Based RAG Content as the immutable sources of truth
- [ ] **AC-5** Artifact Delivery — Final output is a strictly formatted HTML file (saved to storage) and a text summary (passed to Global History)

---

## Current State

The existing `wpi-content-factory-workflow.json` is a **monolithic 57-node workflow**.
All logic (architect, research, writing, coding, QA, output) lives in one file.
This refactor splits it into **8+ encapsulated workflows** that communicate through a central manager,
using a **Double-Loop** pattern to avoid token fatigue and maintain didactic depth.

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
│    │       ├─ RAG lookup (Vector DB) for this LO                     │  │
│    │       ├─ Generate content with context:                         │  │
│    │       │    system_prompt_v30 + syllabus + rag_data              │  │
│    │       │    + global_history + current_chapter_draft              │  │
│    │       └─ Append result to current_chapter_draft                 │  │
│    │                                                                 │  │
│    │  Phase 3: CLOSER                                                │  │
│    │    → Synthesis + Assessment (MCQs + Drill)                      │  │
│    │    → Appended to current_chapter_draft                          │  │
│    │    → Final HTML = current_chapter_draft                         │  │
│    └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│    → Save HTML to storage (WF-7 Publisher)                              │
│    → Generate chapter summary → append to global_history                │
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
  - RAG Content             — vector-retrieved facts per LO from Pinecone/Qdrant
```

---

## Thread 0: RAG Infrastructure — Vector Database Setup

> **Jira Sub-task:** Infrastructure: Set up Vector Database (Pinecone/Qdrant) and ingest RAG source material.

Stand up the vector DB that WF-3 (Chapter Builder) queries per Learning Objective.

- [ ] **0.1** Choose vector DB: Pinecone (managed) vs Qdrant (self-hosted in Docker)
  - Recommendation: Qdrant in Docker for PoC — no external dependency, free
- [ ] **0.2** Add Qdrant/Pinecone service to `docker-compose.yml`
  - Qdrant: `qdrant/qdrant:latest`, port 6333
  - Persistent volume for vector data
- [ ] **0.3** Define embedding strategy
  - Model: OpenAI `text-embedding-3-small` (or `ada-002`)
  - Chunk size: ~500 tokens per chunk
  - Metadata per chunk: `{ source_doc, chapter_ref, lo_ref, topic }`
- [ ] **0.4** Build ingestion script/workflow to load RAG source material
  - Input: PDF/MD/TXT files from `tests/` or `docs/`
  - Pipeline: read file → chunk text → embed via OpenAI → upsert to vector DB
  - Can be an n8n workflow (`WF-AUX-Ingest.json`) or a standalone script
- [ ] **0.5** Create n8n credentials for the vector DB (HTTP Header or API key)
- [ ] **0.6** Build a reusable n8n "RAG Lookup" sub-workflow or Code node
  - Input: `{ query: "LO description text", top_k: 5 }`
  - Output: `{ chunks: [{ text, score, metadata }] }`
  - Used by WF-3 Chapter Builder in the Body phase
- [ ] **0.7** Ingest initial test material — enough to cover Chapter 1.1 LOs
- [ ] **0.8** Verify retrieval quality: query each LO from Chapter 1.1 and check top-5 relevance

---

## Thread 1: n8n — WF-0 Master Orchestrator (Loop 1: Chapters)

> **Jira Sub-task:** Workflow A: Build the "Master Orchestrator" in n8n to parse the Syllabus and manage Global History variables.

Central state machine that owns the book generation lifecycle.
**This is Loop 1** — iterates through syllabus chapters one by one.
Maintains `global_history` across chapters for context continuity.

- [ ] **1.1** Create new workflow `WF-0-Manager.json`
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
- [ ] **1.2** Call WF-1 (Blueprint) to generate the syllabus-based chapter plan
  - Pass: `{ job_id, product_definition, target_audience, focus_areas }`
  - Receive: `{ blueprint: { chapters: [{ id, title, learning_objectives: [...] }] } }`
- [ ] **1.3** Add Human Approval gate after Blueprint
  - Wait for Webhook node — pauses until human approves/rejects
  - On rejection: re-trigger WF-1 with feedback
- [ ] **1.4** **Implement Chapter Loop (Loop 1)** using `SplitInBatches` node
  - Iterates `blueprint.chapters` one by one (sequential, NOT parallel)
  - For each chapter, execute the pipeline: `research → chapter_build → coding → qa`
  - **Critical:** pass `global_history` into each iteration
- [ ] **1.5** Per-chapter pipeline inside the loop:
  - Step A: Call WF-2 (Research) — `{ chapter, global_history }` → `{ fact_sheet }`
  - Step B: Call WF-3 (Chapter Builder) — `{ chapter, fact_sheet, global_history, system_prompt_v30 }` → `{ html_content, chapter_summary }`
  - Step C: If `has_code_requests` → Call WF-4 (Coder) — `{ code_requests }` → `{ code_snippets }`
  - Step D: Call WF-5 (Editor/QA) — `{ html_content, learning_goals }` → `{ score, verdict }`
- [ ] **1.6** **Update Global History after each chapter** (Code node)
  - `global_history += chapter_summary` (returned by WF-3)
  - This ensures the next chapter's generation is informed by all prior chapters
  - Store via workflow variable or mcp-standards HTTP call
- [ ] **1.7** Implement revision loop logic
  - If WF-5 returns `needs_revision` and `revision_count < 3` → re-call WF-3 with `{ revision_feedback, previous_draft }`
  - If `revision_count >= 3` → escalate (pause for human or skip)
- [ ] **1.8** After all chapters complete → Call WF-6 (Compiler) → Call WF-7 (Publisher)
- [ ] **1.9** Add error handling at orchestrator level
  - If any sub-workflow fails → log error, retry once, then pause with notification
  - Error Trigger node to catch sub-workflow failures
- [ ] **1.10** Add job status tracking
  - Store progress in workflow variables or via HTTP to mcp-standards
  - Expose status via Webhook (GET) so Laravel can poll progress:
    `{ job_id, status, chapter_progress: "3/12", current_phase: "writing" }`

---

## Thread 2: n8n — WF-1 Blueprint Generator Workflow

Encapsulates the Architect agent and blueprint parsing. Stateless.
Must produce a structured list of chapters with their Learning Objectives (LOs) — this feeds both loops.

- [ ] **2.1** Create workflow `WF-1-Blueprint.json`
  - Trigger: `Execute Workflow Trigger` (called by Manager)
  - Input: `{ job_id, product_definition, target_audience, focus_areas }`
- [ ] **2.2** Migrate Architect Agent node (OpenAI HTTP call) from monolith
  - System prompt: didactics expert
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
  - Map syllabus LOs to blueprint chapters
- [ ] **2.5** Return structured output to Manager
  - `{ status: "success", blueprint: {...} }` or `{ status: "failed", error: "..." }`
- [ ] **2.6** Add input validation — reject if required fields missing

---

## Thread 3: n8n — WF-2 Research Workflow

Encapsulates syllabus data fetching and knowledge base research for a single chapter.
Now also performs **per-LO RAG lookups** and returns structured results.

- [ ] **3.1** Create workflow `WF-2-Research.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapter_id, chapter_title, learning_objectives: [...], syllabus_section, global_history }`
- [ ] **3.2** Migrate MCP research nodes from monolith
  - `MCP: Get Syllabus Section` (mcp-standards:3002)
  - `MCP: Get Chapter LOs` (mcp-standards:3002)
  - `MCP: Search Knowledge Base` (mcp-research:3003)
  - `MCP: Chapter Research` (mcp-research:3003)
- [ ] **3.3** **Add per-LO RAG lookup** (SplitInBatches over learning_objectives)
  - For each LO → query vector DB (Qdrant/Pinecone) with LO description
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
  - Generate: Chapter Header (`<h2>`) + LO List (`<ul>`) + Professional Context paragraph
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
- [ ] **4.6** **Finalize & Return** (Code node)
  - `html_content = current_chapter_draft` (the complete chapter)
  - Generate `chapter_summary` — a condensed text summary for `global_history`
  - Return:
    ```json
    {
      "status": "success",
      "html_content": "<complete chapter HTML>",
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
  - Input: `{ job_id, chapter_id, html_content, code_snippets, learning_objectives }`
- [ ] **6.2** Migrate Editor Agent (WPI ISO Editor — OpenAI HTTP call)
  - Score 0–100 against ISO 17024 criteria
  - Generate exam questions for the chapter
- [ ] **6.3** Migrate ISO Compliance Check (MCP: ISO Compliance Check — mcp-standards:3002)
- [ ] **6.4** **Validate LO coverage** — check that every LO from the chapter blueprint has corresponding content in the HTML
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

Assembles all finished chapters into a complete book and converts formats.

- [ ] **7.1** Create workflow `WF-6-Compiler.json`
  - Trigger: `Execute Workflow Trigger`
  - Input: `{ job_id, chapters: [{ chapter_id, html_content, code_snippets, exam_questions }] }`
- [ ] **7.2** Migrate chapter accumulation logic
  - `Store Chapter` / `Get Accumulated Chapters` (mcp-standards:3002)
- [ ] **7.3** Migrate book assembly Code node — merge chapters in order
- [ ] **7.4** Migrate HTML conversion (Convert Book to HTML — OpenAI or Code node)
- [ ] **7.5** Migrate question compilation (Convert Questions to HTML)
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
- [ ] **9.4** Extract WF-3 nodes: Writer Agent + post-processing Code nodes → rebuild as Chapter Builder with LO loop
- [ ] **9.5** Extract WF-4 nodes: Coder Agent + Self-Correct + MCP Validate
- [ ] **9.6** Extract WF-5 nodes: Editor Agent + ISO Compliance Check
- [ ] **9.7** Extract WF-6 nodes: chapter accumulation + Convert to File nodes
- [ ] **9.8** Extract WF-7 nodes: email + any output nodes
- [ ] **9.9** Build WF-0 Manager from scratch — new workflow with Execute Workflow calls + Global History
- [ ] **9.10** Replace each extracted group with an `Execute Workflow Trigger` (input) at the start
- [ ] **9.11** Test each sub-workflow in isolation with mock input data
- [ ] **9.12** Integration test: run WF-0 end-to-end and verify identical output to monolith
- [ ] **9.13** Archive the monolith as `LEGACY-wpi-content-factory-workflow.json`

---

## Thread 10: Validation — Chapter 1.1 Test Run

> **Jira Sub-task:** Testing: execute a test run for "Chapter 1.1" to verify that the "Professional Context" connects logically to "LO 1.1.1".

End-to-end validation of the Double-Loop architecture using a single chapter.

- [ ] **10.1** Prepare test fixtures for Chapter 1.1
  - Syllabus section 1.1 with its Learning Objectives
  - RAG content ingested for all LOs in 1.1 (from Thread 0)
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
- [ ] **10.7** Verify final HTML is well-formed and contains all expected sections
- [ ] **10.8** Run the full pipeline through WF-0 Manager for Chapter 1.1 only
  - Confirm: Research → Chapter Build → (Coder if needed) → QA → all pass

---

## Thread 11: Laravel Backend — API & Storage

Build the receiving endpoint, sanitize HTML, and persist content to the database.

- [ ] **11.1** Create Laravel API route: `POST /api/webhooks/import-guide`
- [ ] **11.2** Implement `ImportGuideController@store` with request validation
  - Required fields: `chapter_id`, `title`, `html_content`
- [ ] **11.3** Add API token authentication middleware (Bearer token via `auth:sanctum` or custom)
- [ ] **11.4** Implement HTML sanitization logic in a service class
  - Strip `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers
  - Keep only inner body content (headers, paragraphs, lists, divs, etc.)
  - Sanitize against XSS (use HTMLPurifier or similar)
- [ ] **11.5** Create database migration for `chapters` table
  - Fields: `id`, `chapter_id`, `title`, `html_content`, `json_content` (nullable), `status`, `imported_at`, `timestamps`
- [ ] **11.6** Create `Chapter` Eloquent model with fillable fields
- [ ] **11.7** Store cleaned HTML into `html_content` column
- [ ] **11.8** Optionally convert HTML to Tiptap JSON on the backend (using `ueberdosis/prosemirror-to-html` or equivalent PHP package) and store in `json_content`
- [ ] **11.9** Add `status` field workflow: `imported` → `in_review` → `approved` → `published`
- [ ] **11.10** Create `GET /api/jobs/{job_id}/status` endpoint — polls WF-0 Manager for progress
- [ ] **11.11** Write feature tests for the import endpoint (valid payload, missing fields, auth failure)

---

## Thread 12: Tiptap Frontend — Editor & Custom Extensions

Load AI-generated content into Tiptap and handle custom HTML structures.

### 12A: Basic Editor Setup

- [ ] **12.1** Create Vue/React page for chapter editing (route: `/chapters/{id}/edit`)
- [ ] **12.2** Fetch chapter content from Laravel API (`GET /api/chapters/{id}`)
- [ ] **12.3** Initialize Tiptap editor with fetched HTML: `editor.commands.setContent(html_content)`
- [ ] **12.4** Implement save functionality — `PUT /api/chapters/{id}` sends updated HTML back to Laravel
- [ ] **12.5** Add autosave (debounced, every 30s or on significant change)

### 12B: Custom Tiptap Extensions (Rendering Fidelity)

Map n8n AI output HTML structures to Tiptap node extensions so content is not "flattened".

- [ ] **12.6** Audit the HTML output from WF-3 Chapter Builder — catalog all custom tags/classes used
  - `<aside class="micro-case">` — Micro-Case boxes
  - `<div class="quiz-item">` — Inline quiz items / MCQs (from Closer phase)
  - `<div class="key-takeaway">` — Key takeaway boxes
  - `<div class="code-example">` — Code example wrappers
  - `<div class="drill-exercise">` — Drill exercises (from Closer phase)
  - (add others as discovered)
- [ ] **12.7** Create Tiptap `MicroCase` node extension
  - ParseRule: `tag: 'aside'`, `getAttrs: dom => dom.classList.contains('micro-case')`
  - Renders as styled `<aside>` block in the editor
- [ ] **12.8** Create Tiptap `QuizItem` node extension
  - ParseRule: `tag: 'div'`, `getAttrs: dom => dom.classList.contains('quiz-item')`
- [ ] **12.9** Create Tiptap `KeyTakeaway` node extension
  - ParseRule for `<div class="key-takeaway">`
- [ ] **12.10** Create Tiptap `CodeExample` node extension (or leverage existing CodeBlock with wrapper)
- [ ] **12.11** Register all custom extensions in the Tiptap editor config
- [ ] **12.12** Add CSS styles for each custom block in the editor view
- [ ] **12.13** Test: import a full AI-generated chapter and verify no content/structure is lost

---

## Thread 13: Content Review Workflow (Human-in-the-Loop)

Enable human editors to review, edit, and approve AI-generated content.
Revision requests are sent back to the **WF-0 Manager** which re-triggers WF-3 (Chapter Builder).

- [ ] **13.1** Build chapter list dashboard showing all imported chapters with status badges
- [ ] **13.2** Add "Approve" / "Request Revision" actions on the edit page
- [ ] **13.3** On "Request Revision" — send feedback to WF-0 Manager via webhook
  - n8n webhook URL stored in Laravel config
  - Payload: `{ job_id, chapter_id, feedback, requested_changes }`
  - Manager receives this, re-triggers WF-3 (Chapter Builder) with feedback context
- [ ] **13.4** On "Approve" — update chapter status to `approved`
- [ ] **13.5** Add version history / revision tracking (store previous HTML versions)
- [ ] **13.6** Add diff view to compare AI draft vs human-edited version
- [ ] **13.7** Add progress dashboard — show real-time pipeline status from WF-0 Manager status endpoint

---

## Thread 14: DevOps & Configuration

- [ ] **14.1** Add environment variables to `.env`:
  - `N8N_API_TOKEN` — token for n8n to authenticate with Laravel
  - `N8N_WEBHOOK_URL` — URL for WF-0 Manager revision webhook
  - `N8N_STATUS_URL` — URL for WF-0 Manager status polling
  - `VECTOR_DB_URL` — Qdrant/Pinecone endpoint (e.g., `http://qdrant:6333`)
  - `VECTOR_DB_API_KEY` — API key for vector DB (if Pinecone)
  - `OPENAI_EMBEDDING_MODEL` — embedding model name
  - `TIPTAP_EXTENSIONS` — feature flag for custom extensions (optional)
- [ ] **14.2** Add CORS configuration for the API if frontend is on a different domain
- [ ] **14.3** Add rate limiting to the import webhook endpoint
- [ ] **14.4** Document the integration setup in `docs/tiptap-integration.md`
- [ ] **14.5** Add Docker Compose services:
  - Laravel app alongside n8n
  - Qdrant vector DB (`qdrant/qdrant:latest`, port 6333, persistent volume)
- [ ] **14.6** Add workflow version management — store all WF-*.json in `workflows/modular/` directory
- [ ] **14.7** Create a deployment script that imports all workflows into n8n via API

---

## Priority Order

```
Phase 0: Infrastructure (prerequisite)
  0. Thread  0   (RAG / Vector DB setup — needed before Chapter Builder works)

Phase 1: Core Double-Loop Engine
  1. Thread  9   (Decompose monolith — migration plan + node mapping)
  2. Thread  1   (WF-0 Manager — Loop 1 with Global History)
  3. Thread  2   (WF-1 Blueprint — must output LO arrays per chapter)
  4. Thread  3   (WF-2 Research — per-LO RAG lookups)
  5. Thread  4   (WF-3 Chapter Builder — Loop 2 with Micro-Step Protocol)
  6. Threads 5-7 (WF-4 Coder, WF-5 Editor/QA, WF-6 Compiler)
  7. Thread  8   (WF-7 Publisher — includes Laravel push)

Phase 2: Validation
  8. Thread 10   (Chapter 1.1 test run — end-to-end verification)

Phase 3: Laravel + Tiptap
  9. Thread 11   (Laravel API — receiving endpoint)
 10. Thread 12A  (Basic Tiptap editor)
 11. Thread 13   (Review workflow — human-in-the-loop)

Phase 4: Polish
 12. Thread 12B  (Custom Tiptap extensions — rendering fidelity)
 13. Thread 14   (DevOps — production readiness)
```

---

## Key Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Vector DB | Pinecone (managed) / Qdrant (self-hosted) / Weaviate | Qdrant in Docker — free, self-hosted, good for PoC |
| Embedding model | OpenAI `text-embedding-3-small` / `ada-002` / local | `text-embedding-3-small` — cheap, good quality |
| Accumulator storage in WF-3 | Workflow variable / `$getWorkflowStaticData()` / Code node reference | `$getWorkflowStaticData()` — persists across loop iterations |
| State storage in Manager | Workflow variables / mcp-standards DB / Redis | mcp-standards DB — already exists, persistent across restarts |
| Sub-workflow communication | Execute Workflow / Webhook chains / Message queue | Execute Workflow — native n8n, synchronous, typed I/O |
| Parallel chapter processing | Sequential loop / SplitInBatches / Separate triggers | Sequential — Global History requires chapters in order |
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
│   ├── WF-0-Manager.json           # Master Orchestrator (Loop 1)
│   ├── WF-1-Blueprint.json         # Blueprint Generator
│   ├── WF-2-Research.json          # Research + RAG per LO
│   ├── WF-3-ChapterBuilder.json    # Chapter Builder (Loop 2 — LOs)
│   ├── WF-4-Coder.json             # Code Generation
│   ├── WF-5-EditorQA.json          # Editor / QA
│   ├── WF-6-Compiler.json          # Book Assembly
│   ├── WF-7-Publisher.json         # Multi-target Publishing
│   └── WF-AUX-Ingest.json          # RAG Ingestion (auxiliary)
├── legacy/
│   └── wpi-content-factory-workflow.json  (archived monolith)
└── ...
```

---

*Created: 2026-02-05*
*Updated: 2026-02-06 — Added Double-Loop architecture, Micro-Step Protocol, RAG infrastructure, Chapter 1.1 test plan per Jira task*
*Based on: Tiptap + n8n integration requirements + Jira "Double-Loop" user story*
