# TODO: n8n + Laravel/Tiptap Integration (Multi-Thread)

> Integration of n8n Content Factory with Laravel backend and Tiptap rich-text editor.
> Pattern: n8n (drafting) -> Laravel (content warehouse) -> Tiptap (human-in-the-loop editing)

---

## Thread 1: n8n Workflow — HTTP Push Step

Add a final step to Workflow A (Master Orchestrator) that pushes generated content to the Laravel API.

- [ ] **1.1** Add HTTP Request node at the end of the Master Orchestrator workflow
  - Method: `POST`
  - URL: `https://<app-domain>/api/webhooks/import-guide`
  - Header: `Authorization: Bearer <API_TOKEN>`
  - Body format:
    ```json
    {
      "chapter_id": "1.1",
      "title": "Chapter Title",
      "html_content": "{{current_chapter_draft}}"
    }
    ```
- [ ] **1.2** Configure n8n credentials for the Laravel API token
- [ ] **1.3** Add error handling node (retry on 5xx, alert on 4xx)
- [ ] **1.4** Add a Switch/If node to choose output target (Google Drive vs Laravel API vs both)
- [ ] **1.5** Test the HTTP push with a sample chapter payload
- [ ] **1.6** Ensure the workflow sends each chapter individually as it completes (not batch at the end)

---

## Thread 2: Laravel Backend — API & Storage

Build the receiving endpoint, sanitize HTML, and persist content to the database.

- [ ] **2.1** Create Laravel API route: `POST /api/webhooks/import-guide`
- [ ] **2.2** Implement `ImportGuideController@store` with request validation
  - Required fields: `chapter_id`, `title`, `html_content`
- [ ] **2.3** Add API token authentication middleware (Bearer token via `auth:sanctum` or custom)
- [ ] **2.4** Implement HTML sanitization logic in a service class
  - Strip `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers
  - Keep only inner body content (headers, paragraphs, lists, divs, etc.)
  - Sanitize against XSS (use HTMLPurifier or similar)
- [ ] **2.5** Create database migration for `chapters` table
  - Fields: `id`, `chapter_id`, `title`, `html_content`, `json_content` (nullable), `status`, `imported_at`, `timestamps`
- [ ] **2.6** Create `Chapter` Eloquent model with fillable fields
- [ ] **2.7** Store cleaned HTML into `html_content` column
- [ ] **2.8** Optionally convert HTML to Tiptap JSON on the backend (using `ueberdosis/prosemirror-to-html` or equivalent PHP package) and store in `json_content`
- [ ] **2.9** Add `status` field workflow: `imported` -> `in_review` -> `approved` -> `published`
- [ ] **2.10** Write feature tests for the import endpoint (valid payload, missing fields, auth failure)

---

## Thread 3: Tiptap Frontend — Editor & Custom Extensions

Load AI-generated content into Tiptap and handle custom HTML structures.

### 3A: Basic Editor Setup

- [ ] **3.1** Create Vue/React page for chapter editing (route: `/chapters/{id}/edit`)
- [ ] **3.2** Fetch chapter content from Laravel API (`GET /api/chapters/{id}`)
- [ ] **3.3** Initialize Tiptap editor with fetched HTML: `editor.commands.setContent(html_content)`
- [ ] **3.4** Implement save functionality — `PUT /api/chapters/{id}` sends updated HTML back to Laravel
- [ ] **3.5** Add autosave (debounced, every 30s or on significant change)

### 3B: Custom Tiptap Extensions (Rendering Fidelity)

Map n8n AI output HTML structures to Tiptap node extensions so content is not "flattened".

- [ ] **3.6** Audit the HTML output from n8n Writer/Editor agents — catalog all custom tags/classes used
  - `<aside class="micro-case">` — Micro-Case boxes
  - `<div class="quiz-item">` — Inline quiz items
  - `<div class="key-takeaway">` — Key takeaway boxes
  - `<div class="code-example">` — Code example wrappers
  - (add others as discovered)
- [ ] **3.7** Create Tiptap `MicroCase` node extension
  - ParseRule: `tag: 'aside'`, `getAttrs: dom => dom.classList.contains('micro-case')`
  - Renders as styled `<aside>` block in the editor
- [ ] **3.8** Create Tiptap `QuizItem` node extension
  - ParseRule: `tag: 'div'`, `getAttrs: dom => dom.classList.contains('quiz-item')`
- [ ] **3.9** Create Tiptap `KeyTakeaway` node extension
  - ParseRule for `<div class="key-takeaway">`
- [ ] **3.10** Create Tiptap `CodeExample` node extension (or leverage existing CodeBlock with wrapper)
- [ ] **3.11** Register all custom extensions in the Tiptap editor config
- [ ] **3.12** Add CSS styles for each custom block in the editor view
- [ ] **3.13** Test: import a full AI-generated chapter and verify no content/structure is lost

---

## Thread 4: Content Review Workflow (Human-in-the-Loop)

Enable human editors to review, edit, and approve AI-generated content.

- [ ] **4.1** Build chapter list dashboard showing all imported chapters with status badges
- [ ] **4.2** Add "Approve" / "Request Revision" actions on the edit page
- [ ] **4.3** On "Request Revision" — send feedback back to n8n via webhook (triggers re-write)
  - n8n webhook URL stored in config
  - Payload: `{ chapter_id, feedback, requested_changes }`
- [ ] **4.4** On "Approve" — update chapter status to `approved`
- [ ] **4.5** Add version history / revision tracking (store previous HTML versions)
- [ ] **4.6** Add diff view to compare AI draft vs human-edited version

---

## Thread 5: DevOps & Configuration

- [ ] **5.1** Add environment variables to `.env`:
  - `N8N_API_TOKEN` — token for n8n to authenticate with Laravel
  - `N8N_WEBHOOK_URL` — URL to send revision requests back to n8n
  - `TIPTAP_EXTENSIONS` — feature flag for custom extensions (optional)
- [ ] **5.2** Add CORS configuration for the API if frontend is on a different domain
- [ ] **5.3** Add rate limiting to the import webhook endpoint
- [ ] **5.4** Document the integration setup in `docs/tiptap-integration.md`
- [ ] **5.5** Add Docker Compose service for the Laravel app alongside n8n

---

## Priority Order

1. **Thread 2** (Laravel API) — foundation, everything depends on it
2. **Thread 1** (n8n HTTP push) — connects the pipeline
3. **Thread 3A** (Basic Tiptap editor) — minimal viable editing
4. **Thread 4** (Review workflow) — human-in-the-loop
5. **Thread 3B** (Custom extensions) — rendering fidelity
6. **Thread 5** (DevOps) — production readiness

---

## Key Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Store as HTML or Tiptap JSON? | HTML only / JSON only / Both | Both — HTML for compatibility, JSON for editor performance |
| Custom extensions or flatten? | Full extensions / Simple divs / Accept flattening | Full extensions for best editor UX |
| Auth mechanism | Sanctum / Passport / Simple Bearer | Sanctum — lightweight, built-in |
| Frontend framework | Vue 3 / React | Match existing `admin-fe` stack |
| Revision feedback loop | Webhook / Manual re-trigger / Queue | Webhook — closes the loop automatically |

---

*Created: 2026-02-05*
*Based on: Tiptap + n8n integration requirements analysis*
