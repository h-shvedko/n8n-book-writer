# WPI AI Content Factory -- Setup & Walkthrough Guide

> Complete guide to set up, deploy, and test the modular Double-Loop n8n workflow system
> with Admin FE, Admin API, PostgreSQL storage, and MCP integrations.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Docker Infrastructure](#3-docker-infrastructure)
4. [Service Overview](#4-service-overview)
5. [Verify All Services](#5-verify-all-services)
6. [n8n Workflow Import](#6-n8n-workflow-import)
7. [n8n Credentials Setup](#7-n8n-credentials-setup)
8. [Link Workflows in WF-0 Manager](#8-link-workflows-in-wf-0-manager)
9. [Admin FE Walkthrough](#9-admin-fe-walkthrough)
10. [Test Run: Single Chapter](#10-test-run-single-chapter)
11. [Test Run: Full Pipeline](#11-test-run-full-pipeline)
12. [Troubleshooting](#12-troubleshooting)
13. [Architecture Reference](#13-architecture-reference)

---

## 1. Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | 24+ | Container runtime |
| Docker Compose | v2+ | Multi-container orchestration |
| Git | 2.x | Source control |
| Web browser | Modern | n8n UI + Admin FE |

### Required API Keys

| Key | Where to get it |
|-----|----------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `N8N_API_KEY` | Generated inside n8n after first launch (Settings > API) |
| `MCP_AUTH_TOKEN` | Any secure random string (you generate it) |

### Hardware Recommendations

- **RAM:** 8 GB minimum (10 services running simultaneously)
- **Disk:** 5 GB free for Docker images + volumes
- **CPU:** 4+ cores recommended

---

## 2. Environment Configuration

### 2.1 Copy the environment template

```bash
cp .env.example .env
```

### 2.2 Edit `.env` with your values

Open `.env` in your editor and fill in the required values:

```env
# === REQUIRED ===
OPENAI_API_KEY=sk-your-actual-openai-key-here
MCP_AUTH_TOKEN=generate-a-random-string-here

# === OPTIONAL (defaults are fine for local dev) ===
N8N_PORT=5678
ADMIN_FE_PORT=3001
ADMIN_API_PORT=3005
POSTGRES_PORT=5432

# PostgreSQL credentials (defaults work, change for production)
POSTGRES_USER=wpi_user
POSTGRES_PASSWORD=wpi_pass

# n8n API key (fill AFTER first n8n launch -- see Step 7)
N8N_API_KEY=
```

**Tip:** To generate a random `MCP_AUTH_TOKEN`:
```bash
# Linux/Mac
openssl rand -hex 32

# PowerShell
[System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
```

---

## 3. Docker Infrastructure

### 3.1 Build and start all services

```bash
docker compose up -d --build
```

This starts **11 containers**:

| Container | Service | Port | Purpose |
|-----------|---------|------|---------|
| `wpi-n8n` | n8n | 5678 | Workflow orchestration |
| `wpi-qdrant` | Qdrant | 6333 | Vector database (RAG) |
| `wpi-mcp-standards` | mcp-standards | 3002 | Syllabus & ISO standards |
| `wpi-mcp-research` | mcp-research | 3003 | Knowledge base & embeddings |
| `wpi-mcp-coder` | mcp-coder | 3004 | Code validation |
| `wpi-n8n-mcp` | n8n-mcp | 3000 | n8n node discovery |
| `wpi-postgres` | PostgreSQL 16 | 5432 | Storage & tracking |
| `wpi-pgadmin` | pgAdmin 4 | 5050 | PostgreSQL web UI |
| `wpi-admin-api` | admin-api | 3005 | REST API for PostgreSQL |
| `wpi-admin-fe` | admin-fe | 3001 | Admin dashboard (React) |

### 3.2 Wait for all containers to be healthy

```bash
docker compose ps
```

All services should show `healthy` status. PostgreSQL may take 15-30 seconds on first start (it runs `db/init.sql` to create tables).

### 3.3 Check logs if something fails

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f admin-api
docker compose logs -f postgres
docker compose logs -f n8n
```

---

## 4. Service Overview

### Docker Network

All containers communicate on the internal `wpi-content-factory` bridge network.
Internal hostnames match service names (e.g., `http://admin-api:3005`, `postgres:5432`).

### Database Schema

PostgreSQL auto-creates 4 tables on first start via `db/init.sql`:

| Table | Purpose |
|-------|---------|
| `jobs` | Tracks each book generation job (status, progress, timestamps) |
| `workflow_logs` | Per-workflow execution log entries (which WF ran, duration, errors) |
| `books` | Stores completed books (JSON content + exam questions) |
| `chapters` | Stores individual chapters (JSON content, scores, summaries) |

### API Endpoints (admin-api on port 3005)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/:id` | Get job details |
| `PATCH` | `/api/jobs/:id` | Update job status/progress |
| `GET` | `/api/jobs/:id/logs` | Get workflow logs for a job |
| `POST` | `/api/logs` | Create a workflow log entry |
| `POST` | `/api/books` | Store a completed book |
| `GET` | `/api/books` | List all books |
| `GET` | `/api/books/:id` | Get book with chapters |
| `GET` | `/api/books/by-job/:jobId` | Find book by job ID |
| `POST` | `/api/chapters` | Store a chapter |
| `GET` | `/api/chapters/:id` | Get a single chapter |

All endpoints require `Authorization: Bearer <MCP_AUTH_TOKEN>` header.

---

## 5. Verify All Services

Run these checks to confirm everything is running:

### 5.1 n8n

Open http://localhost:5678 in your browser.
Complete the initial setup (create owner account) if this is a fresh install.

### 5.2 Admin FE

Open http://localhost:3001 in your browser.
You should see the Admin Dashboard with sidebar navigation (Monitor, Vector DB, Syllabus, Books, Jobs).

### 5.3 Admin API health check

```bash
curl http://localhost:3005/health
```

Expected: `{ "status": "ok" }` (or similar).

### 5.4 PostgreSQL

```bash
docker exec wpi-postgres psql -U wpi_user -d wpi_content -c "\dt"
```

Expected output: 4 tables (`jobs`, `workflow_logs`, `books`, `chapters`).

### 5.5 pgAdmin (PostgreSQL Web UI)

Open http://localhost:5050 in your browser.

1. Login with `admin@wpi.local` / `admin` (or your custom `PGADMIN_EMAIL`/`PGADMIN_PASSWORD`)
2. Click **"Add New Server"** and configure:
   - **General > Name:** `wpi-postgres`
   - **Connection > Host:** `postgres` (Docker internal hostname)
   - **Connection > Port:** `5432`
   - **Connection > Username:** `wpi_user`
   - **Connection > Password:** `wpi_pass`
3. You should see the `wpi_content` database with all 4 tables

### 5.6 MCP Services

```bash
curl http://localhost:3002/health   # mcp-standards
curl http://localhost:3003/health   # mcp-research
curl http://localhost:3004/health   # mcp-coder
curl http://localhost:3000/health   # n8n-mcp
```

### 5.7 Qdrant

Open http://localhost:6333/dashboard in your browser (Qdrant Web UI).

---

## 6. n8n Workflow Import

You need to import **8 workflow files** from `workflows/modular/` into n8n.

### 6.1 Import each workflow

1. Open n8n at http://localhost:5678
2. Go to **Workflows** (sidebar)
3. Click **"..."** > **Import from File**
4. Import files in this order:

| # | File | Workflow Name |
|---|------|--------------|
| 1 | `WF-1-Blueprint.json` | WF-1 Blueprint Generator |
| 2 | `WF-2-Research.json` | WF-2 Research |
| 3 | `WF-3-ChapterBuilder.json` | WF-3 Chapter Builder |
| 4 | `WF-4-Coder.json` | WF-4 Coder |
| 5 | `WF-5-EditorQA.json` | WF-5 Editor/QA |
| 6 | `WF-6-Compiler.json` | WF-6 Book Compiler |
| 7 | `WF-7-Publisher.json` | WF-7 Publisher |
| 8 | `WF-0-Manager.json` | WF-0 Master Orchestrator |

**Import WF-0 last** because it references all other workflows.

### 6.2 Note down workflow IDs

After import, each workflow gets an internal n8n ID (visible in the URL).
Write them down -- you'll need them in Step 8.

| Workflow | n8n ID (from URL bar) |
|----------|-----------------------|
| WF-1 Blueprint | `___` |
| WF-2 Research | `___` |
| WF-3 ChapterBuilder | `___` |
| WF-4 Coder | `___` |
| WF-5 EditorQA | `___` |
| WF-6 Compiler | `___` |
| WF-7 Publisher | `___` |

---

## 7. n8n Credentials Setup

### 7.1 Generate n8n API Key

1. In n8n, go to **Settings** > **API**
2. Generate a new API key
3. Copy it to your `.env` file as `N8N_API_KEY=...`
4. Restart the admin-fe container to pick up the new key:
   ```bash
   docker compose restart admin-fe
   ```

### 7.2 Create OpenAI credentials

All AI agent nodes (Architect, Writer, Coder, Editor) use OpenAI HTTP calls.

1. In n8n, go to **Credentials** > **New Credential**
2. Search for **"Header Auth"** (used for OpenAI HTTP calls)
3. Create credential named `OpenAI API`:
   - **Name:** `Authorization`
   - **Value:** `Bearer sk-your-openai-key`

Alternatively, if workflows use the native OpenAI node:
1. Create a credential of type **OpenAI**
2. Enter your API key

### 7.3 Create MCP HTTP credentials

The workflows call MCP servers via HTTP. Create a **Header Auth** credential:

1. **Name:** `MCP Auth`
2. **Header Name:** `Authorization`
3. **Header Value:** `Bearer <your-MCP_AUTH_TOKEN>`

### 7.4 Assign credentials to nodes

Open each workflow and assign the correct credentials:
- AI agent nodes (OpenAI HTTP Request) → OpenAI credential
- MCP HTTP Request nodes → MCP Auth credential
- Admin API HTTP Request nodes → MCP Auth credential (same token)

---

## 8. Link Workflows in WF-0 Manager

WF-0 uses **Execute Workflow** nodes to call sub-workflows. Each node needs to be linked to the correct workflow ID.

### 8.1 Open WF-0 Manager in n8n

### 8.2 Configure each Execute Workflow node

Click on each of these nodes and select the target workflow from the dropdown:

| Node in WF-0 | Target Workflow |
|---------------|----------------|
| `Call WF-1 Blueprint` | WF-1 Blueprint Generator |
| `Call WF-2 Research` | WF-2 Research |
| `Call WF-3 Chapter Builder` | WF-3 Chapter Builder |
| `Call WF-4 Coder` | WF-4 Coder |
| `Call WF-5 Editor/QA` | WF-5 Editor/QA |
| `Call WF-6 Compiler` | WF-6 Book Compiler |
| `Call WF-7 Publisher` | WF-7 Publisher |

For each node:
1. Click the node
2. In the **"Workflow"** field, select **"From list"** mode
3. Choose the matching workflow from the dropdown
4. Save

### 8.3 Activate WF-0

1. Toggle the **Active** switch in the top-right of WF-0
2. This registers the Form Trigger webhook so the generation form is accessible

### 8.4 Verify form is accessible

After activation, the form trigger should be available at:
```
http://localhost:5678/form/<webhookId>
```

The `webhookId` is `3d9430f4-c69d-4392-bae9-70bef5444575` (defined in WF-0).

Try opening: http://localhost:5678/form/3d9430f4-c69d-4392-bae9-70bef5444575

You should see the **"WPI Book Generator"** form with fields:
- Syllabus (dropdown)
- Generation Strategy (dropdown)
- Target Audience (dropdown)

---

## 9. Admin FE Walkthrough

Open http://localhost:3001 and explore the pages:

### 9.1 Workflow Monitor (`/monitor`)

- Shows n8n execution history in real-time (auto-refreshes every 3s)
- Pipeline visualization: see which agent nodes have completed/are running
- **"Start Workflow"** button: opens the n8n form trigger to start generation
- Status filters: Running / Completed / Failed / All

### 9.2 Job Monitor (`/jobs`)

- Lists all book generation jobs from the PostgreSQL database
- **"Generate New Book"** button: opens the generation form
- For each job, shows:
  - Status badge (pending / running / completed / failed)
  - Chapter progress bar (e.g., 3/10)
  - **Workflow pipeline**: visual numbered circles (1-7) showing which WF step is active
  - Duration
- **Expand a job** to see workflow execution logs (timeline view)
- For completed jobs: **"View Generated Book"** button links to the book page

### 9.3 Books Page (`/books`)

- Lists all generated books stored in PostgreSQL
- Shows chapter count and creation date
- Click a book to view its details

### 9.4 Book Detail (`/books/:id`)

- Full book metadata
- List of all chapters with:
  - Content preview
  - Editor score
  - Exam questions
- Expandable sections for detailed JSON content

### 9.5 Vector Database (`/vectordb`)

- Browse ingested documents in Qdrant
- Search the knowledge base
- Upload new documents for RAG

### 9.6 Syllabus Editor (`/syllabus`)

- View and manage syllabuses
- Activate a syllabus for use in workflows

---

## 10. Test Run: Single Chapter

Before running the full pipeline, test individual workflows.

### 10.1 Test Admin API directly

```bash
# Create a test job
curl -X POST http://localhost:3005/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_MCP_AUTH_TOKEN" \
  -d '{
    "id": "test-job-001",
    "syllabus_name": "Test Syllabus",
    "strategy": "By Domain",
    "target_audience": "Junior Developers",
    "status": "running"
  }'

# List jobs
curl http://localhost:3005/api/jobs \
  -H "Authorization: Bearer YOUR_MCP_AUTH_TOKEN"

# Check in Admin FE
# Open http://localhost:3001/jobs -- the test job should appear
```

### 10.2 Test WF-7 Publisher in isolation

In n8n, open WF-7 Publisher and click **"Test Workflow"**.
Use this mock input in the Execute Workflow Trigger:

```json
{
  "job_id": "test-job-001",
  "book_json": {
    "title": "Test Book",
    "chapters": [
      {
        "chapter_id": "ch-1",
        "title": "Test Chapter 1",
        "opener": { "header": "Chapter 1", "professional_context": "Test context" },
        "body": [{ "lo_id": "LO-1.1.1", "content": "Test content" }],
        "closer": { "synthesis": "Summary", "mcqs": [] }
      }
    ]
  },
  "exam_questions_json": []
}
```

Check results:
- Admin FE Books page should show the new book
- Admin FE Jobs page should show the test job as "completed"
- PostgreSQL should have entries in `books` and `chapters` tables

### 10.3 Clean up test data

```bash
# Delete test job and related data (cascades handle chapters, books, logs)
docker exec wpi-postgres psql -U wpi_user -d wpi_content -c "DELETE FROM jobs WHERE id = 'test-job-001';"
```

---

## 11. Test Run: Full Pipeline

### 11.1 Prerequisites

Before running the full pipeline, ensure:
- [ ] All 8 workflows are imported in n8n
- [ ] All Execute Workflow nodes in WF-0 are linked to correct target workflows
- [ ] WF-0 is activated (webhook registered)
- [ ] Credentials are assigned to all nodes
- [ ] At least one syllabus is configured in mcp-standards
- [ ] RAG content is ingested in Qdrant (via Vector DB page)

### 11.2 Trigger from Admin FE

1. Open http://localhost:3001/jobs
2. Click **"Generate New Book"**
3. Select the WF-0 workflow and click **"Open Generation Form"**
4. Fill in the form:
   - **Syllabus:** Select your syllabus
   - **Generation Strategy:** "By Domain"
   - **Target Audience:** "Junior Developers"
5. Submit the form

### 11.3 Monitor progress

1. Return to http://localhost:3001/jobs
2. The new job should appear within a few seconds (auto-refresh)
3. Watch the **pipeline visualization** -- numbered circles light up as each WF completes
4. The **progress bar** shows chapter completion (e.g., 1/10, 2/10...)
5. Expand the job card to see **workflow logs** in real-time

### 11.4 Verify results

After the job completes:
1. Click **"View Generated Book"** on the job card
2. Verify all chapters are present
3. Check exam questions
4. Check editor scores

### 11.5 Alternative: Trigger from n8n directly

Open the form URL directly:
```
http://localhost:5678/form/3d9430f4-c69d-4392-bae9-70bef5444575
```

---

## 12. Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs <service-name>

# Rebuild a specific service
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

### PostgreSQL "connection refused"

PostgreSQL takes 15-30 seconds on first start. Wait and retry.

```bash
# Check PostgreSQL health
docker inspect wpi-postgres --format='{{.State.Health.Status}}'

# Check if tables exist
docker exec wpi-postgres psql -U wpi_user -d wpi_content -c "\dt"
```

### Admin API returns 401

Ensure your `MCP_AUTH_TOKEN` in `.env` matches the `Authorization: Bearer` header.

### n8n form returns 404

The WF-0 workflow must be **activated** (toggled on). If the form still doesn't load:
1. Open Admin FE > Jobs > "Generate New Book"
2. Use the **"Reactivate Workflow"** button to re-register the webhook
3. Or manually: deactivate and reactivate WF-0 in n8n

### Workflow fails at "Execute Workflow" nodes

Each Execute Workflow node must be linked to a real workflow ID:
1. Open the node
2. Switch to **"From list"** mode
3. Select the target workflow from the dropdown
4. Save and retry

### WF-7 Publisher fails with "Book creation failed"

Check that admin-api is running and PostgreSQL is healthy:
```bash
curl http://localhost:3005/health
docker compose logs admin-api
```

### Reset all data

```bash
# Stop everything
docker compose down

# Remove PostgreSQL data (tables will be recreated from init.sql)
docker volume rm wpi-postgres-data

# Restart
docker compose up -d
```

### Reset n8n data

```bash
docker compose down
docker volume rm wpi-n8n-data
docker compose up -d
# You'll need to re-import all workflows and re-create credentials
```

---

## 13. Architecture Reference

### Workflow Pipeline

```
User triggers form
        |
        v
  WF-0 Manager (Loop 1: Chapters)
        |
        +--- WF-1 Blueprint -----> chapter plan with LOs
        |
        +--- FOR EACH CHAPTER:
        |       |
        |       +--- WF-2 Research ---------> per-LO RAG data
        |       |
        |       +--- WF-3 Chapter Builder --> JSON content (Loop 2: LOs)
        |       |       |
        |       |       +--- Opener (AI call)
        |       |       +--- Body per LO (AI call + RAG)
        |       |       +--- Closer (AI call)
        |       |
        |       +--- WF-4 Coder (if needed) -> validated code snippets
        |       |
        |       +--- WF-5 Editor/QA --------> score + verdict
        |       |
        |       +--- (revision loop if score < 90, max 3 retries)
        |       |
        |       +--- Update global_history
        |
        +--- WF-6 Compiler --> assembled book JSON
        |
        +--- WF-7 Publisher --> stored in PostgreSQL via Admin API
        |
        v
  Job marked "completed"
```

### Data Flow

```
n8n (WF-0..WF-7)
    |
    | HTTP calls
    v
Admin API (Express, port 3005)
    |
    | pg (node-postgres)
    v
PostgreSQL (port 5432)
    |
    | queried by
    v
Admin FE (React, port 3001)
```

### File Structure

```
n8n-writer/
  .env.example          # Environment template
  .env                  # Your local config (gitignored)
  docker-compose.yml    # All 10 services
  SETUP.md              # This file
  TODO-multythred.md    # Task tracking
  README.md             # Project overview
  CLAUDE.md             # Claude Code instructions
  db/
    init.sql            # PostgreSQL schema (auto-runs on first start)
  workflows/
    modular/
      WF-0-Manager.json
      WF-1-Blueprint.json
      WF-2-Research.json
      WF-3-ChapterBuilder.json
      WF-4-Coder.json
      WF-5-EditorQA.json
      WF-6-Compiler.json
      WF-7-Publisher.json
      NODE-MAPPING.md
  admin-api/            # Express backend
    Dockerfile
    package.json
    src/
      index.js          # Server entrypoint
      db.js             # PostgreSQL connection pool
      routes/
        jobs.js         # Job CRUD + status
        books.js        # Book storage + retrieval
        chapters.js     # Chapter storage + retrieval
        logs.js         # Workflow log storage
  admin-fe/             # React frontend
    Dockerfile
    package.json
    nginx.conf
    src/
      App.tsx           # Router
      api/index.ts      # API clients (n8n, admin, MCP)
      components/
        Layout.tsx
        WorkflowMonitor.tsx
        JobsPage.tsx
        BooksPage.tsx
        BookDetail.tsx
        VectorDBOverview.tsx
        SyllabusEditor.tsx
      store/index.ts    # Zustand state
      types/index.ts    # TypeScript interfaces
  prompts/              # AI agent system prompts
    architect.md
    writer_agent.md
    coder_agent.md
    iso_editor_agent.md
  mcp-standards/        # MCP Standards server
  mcp-research/         # MCP Research server (Qdrant)
  mcp-coder/            # MCP Code validation server
```

---

## Quick Reference: Common Commands

```bash
# Start everything
docker compose up -d --build

# Stop everything
docker compose down

# View logs
docker compose logs -f

# Rebuild one service
docker compose build --no-cache admin-api && docker compose up -d admin-api

# Check service health
docker compose ps

# Access PostgreSQL CLI
docker exec -it wpi-postgres psql -U wpi_user -d wpi_content

# Check API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3005/api/jobs
```

---

*Last updated: 2026-02-08*
