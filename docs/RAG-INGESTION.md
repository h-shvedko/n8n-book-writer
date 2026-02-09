# RAG Source Material Ingestion Guide

> How to ingest, verify, and manage source materials in the Qdrant vector database for the WPI AI Content Factory.

---

## Architecture Overview

```
Source Materials (.html, .md)
        │
        ▼
  ┌─────────────────┐
  │  Ingestion CLI   │  npm run ingest-html / ingest-md / ingest-all
  │  (mcp-research)  │
  └────────┬────────┘
           │
     ┌─────▼──────┐     ┌─────────────────┐
     │ Text Splitter│────▶│ Embedding Service│  OpenAI text-embedding-3-small
     │ (chunking)  │     │ (1536 dims)     │
     └─────┬──────┘     └────────┬────────┘
           │                      │
           ▼                      ▼
  ┌─────────────────────────────────────┐
  │           Qdrant Vector DB           │
  │  Collection: wpi_content             │
  │  Payload: text, source, domain_id,   │
  │           topic_id, tags, language    │
  └──────────────────┬──────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────┐
  │  WF-2 Research Workflow (n8n)        │
  │  → hybrid_search per chapter         │
  │  → hybrid_search per Learning Obj.   │
  │  → Feeds into WF-3 Chapter Builder   │
  └─────────────────────────────────────┘
```

**Key components:**

| Component | Location | Purpose |
|-----------|----------|---------|
| Qdrant | Docker (`wpi-qdrant:6333`) | Vector database, cosine similarity |
| MCP Research | Docker (`wpi-mcp-research:3003`) | HTTP API wrapper for Qdrant |
| Embedding Service | `mcp-research/src/services/embedding-service.ts` | OpenAI embeddings |
| Text Splitter | `mcp-research/src/services/text-splitter.ts` | Recursive character splitting |
| HTML Extractor | `mcp-research/src/services/html-extractor.ts` | Mozilla Readability + Turndown |
| Ingestion DB | `mcp-research/src/services/ingestion-db.ts` | SQLite metadata tracking |

---

## Source Material Inventory

### Target Syllabus: WPI-SYL-SEOAI-V5.2

| Slot | Domains | LOs | Topic |
|------|---------|-----|-------|
| 1: The Technical Architect | domain-1.1 to domain-1.5 | 24 | SEO foundations, crawling, security, performance, diagnostics |
| 2: The Semantic Strategist | domain-2.1 to domain-2.3 | 16 | On-page, structured data, authority |
| 3: The GEO Optimizer | domain-3.1 to domain-3.4 | 19 | AI search, multimodal, metrics, strategy |
| **Total** | **12 domains** | **59 LOs** | |

### Available Source Files

| File | Format | Location | Domain Mapping | Category |
|------|--------|----------|---------------|----------|
| `rag-content-seo.html` | HTML | `assets/21012026-CEO assets iteration 1/` | Broad (all domains) | Legacy Material |
| `kapitel1.html` | HTML | `assets/21012026-CEO assets iteration 1/` | domain-1.1 | Legacy Material |
| `WPI Editorial Guide 2.9.md` | Markdown | `assets/21012026-CEO assets iteration 1/` | Cross-domain | Editorial Guide |
| `WPI Syllabus Version 5.2.json` | JSON | `assets/21012026-CEO assets iteration 1/` | N/A (loaded by mcp-standards) | Syllabus |

---

## Ingestion Pipeline

### How It Works

1. **File Read** — Source file is read from disk
2. **Content Extraction**
   - HTML: Mozilla Readability extracts semantic content, Turndown converts to Markdown
   - Markdown: Read directly (no extraction needed)
3. **Chunking** — `RecursiveCharacterTextSplitter` splits into chunks
   - Default chunk size: 2000 characters
   - Default overlap: 300 characters
   - Separator priority: `\n\n` → `\n` → `. ` → ` ` → character
4. **Embedding** — OpenAI `text-embedding-3-small` (1536 dimensions) generates vectors
5. **Storage** — Vectors + metadata payload stored in Qdrant collection `wpi_content`
6. **Tracking** — Ingestion metadata recorded in SQLite DB (`ingestion.db`)

### Qdrant Payload Schema

Each vector point contains:

```json
{
  "text": "chunk text content",
  "document_id": "uuid",
  "source": "filename.html",
  "title": "Document Title",
  "document_type": "html|markdown",
  "domain_id": "domain-1.1",
  "topic_id": "D1.1",
  "tags": ["Legacy Material"],
  "language": "de",
  "chunk_index": 0,
  "total_chunks": 42,
  "ingested_at": "2026-02-09T..."
}
```

### Indexes

- `source` (keyword) — filter by source file
- `document_type` (keyword) — filter by format
- `domain_id` (keyword) — filter by WPI domain
- `topic_id` (keyword) — filter by WPI topic
- `text` (full-text) — keyword search

---

## Step-by-Step Commands

### Prerequisites

```bash
# 1. Start Docker services
docker compose up -d qdrant mcp-research

# 2. Verify services are healthy
docker compose ps
# wpi-qdrant: healthy
# wpi-mcp-research: healthy

# 3. Navigate to mcp-research directory
cd mcp-research

# 4. Ensure .env has OPENAI_API_KEY set
```

### Ingest a Single HTML File

```bash
npm run ingest-html ../assets/21012026-CEO\ assets\ iteration\ 1/rag-content-seo.html \
  --category "Legacy Material" \
  --language de
```

With domain tagging:
```bash
npm run ingest-html ../assets/21012026-CEO\ assets\ iteration\ 1/kapitel1.html \
  --domain-id domain-1.1 \
  --category "Legacy Material" \
  --language de
```

### Ingest a Single Markdown File

```bash
npm run ingest-md ../assets/21012026-CEO\ assets\ iteration\ 1/INTERNAL\ DOCUMENT_\ WPI\ Editorial\ Guide\ 2.9.md \
  --category "Editorial Guide" \
  --language de
```

### Batch Ingest All Materials

```bash
# Normal mode (skips already-ingested files)
npm run ingest-all

# Force mode (re-ingests everything)
npm run ingest-all --force
```

### Verify Ingestion

```bash
npm run verify-ingestion
```

This produces a report showing:
- Collection health & total vectors
- Source file statistics
- Domain coverage matrix (per syllabus domain)
- Gap report with recommendations

---

## Batch Ingestion Details

The `ingest-all` script (`scripts/ingest-all.ts`) defines the source inventory:

| Source | Format | Domain ID | Category | Description |
|--------|--------|-----------|----------|-------------|
| `rag-content-seo.html` | HTML | — | Legacy Material | Broad SEO content |
| `kapitel1.html` | HTML | domain-1.1 | Legacy Material | Chapter 1 foundations |
| `WPI Editorial Guide 2.9.md` | MD | — | Editorial Guide | Writing standards |

To add new sources, edit the `SOURCES` array in `scripts/ingest-all.ts`.

---

## Domain-to-Source Mapping

### Current Coverage

| Domain | Tagged Sources | Broad Sources | Status |
|--------|--------------|---------------|--------|
| domain-1.1 | kapitel1.html | rag-content-seo.html | Available |
| domain-1.2 | — | rag-content-seo.html | Broad only |
| domain-1.3 | — | rag-content-seo.html | Broad only |
| domain-1.4 | — | rag-content-seo.html | Broad only |
| domain-1.5 | — | rag-content-seo.html | Broad only |
| domain-2.1 | — | rag-content-seo.html | Broad only |
| domain-2.2 | — | rag-content-seo.html | Broad only |
| domain-2.3 | — | rag-content-seo.html | Broad only |
| domain-3.1 | — | rag-content-seo.html | Broad only |
| domain-3.2 | — | rag-content-seo.html | Broad only |
| domain-3.3 | — | rag-content-seo.html | Broad only |
| domain-3.4 | — | rag-content-seo.html | Broad only |

### How WF-2 Uses RAG Content

WF-2 Research performs two types of searches:

1. **Chapter-level search** — `hybrid_search` with chapter title + all LO descriptions
   - Filter: `domain_id` if set, otherwise no filter (retrieves from all content)
2. **Per-LO search** — `hybrid_search` per individual Learning Objective
   - Filter: `domain_id` if set

Untagged (broad) content is matched via semantic similarity regardless of `domain_id` filter. Domain-tagged content gets higher relevance when the filter matches.

---

## Adding New Source Materials

### Step 1: Place the file

```
assets/
  └── <date>-<source>/
      └── your-file.html  (or .md)
```

### Step 2: Ingest with correct metadata

```bash
# For HTML
npm run ingest-html ../assets/<path>/file.html \
  --domain-id domain-X.Y \
  --category "Source Category" \
  --language de

# For Markdown
npm run ingest-md ../assets/<path>/file.md \
  --domain-id domain-X.Y \
  --category "Source Category" \
  --language de
```

### Step 3: Add to batch script (optional)

Edit `mcp-research/scripts/ingest-all.ts` and add an entry to the `SOURCES` array:

```typescript
{
  relativePath: 'assets/<path>/file.html',
  format: 'html',
  domainId: 'domain-X.Y',
  category: 'New Category',
  language: 'de',
  description: 'Description of this source',
},
```

### Step 4: Verify

```bash
npm run verify-ingestion
```

---

## Troubleshooting

### Qdrant Not Running

```
Error: Qdrant unavailable
```

**Fix:** `docker compose up -d qdrant` and wait for healthy status.

### Missing OpenAI API Key

```
Error: OPENAI_API_KEY is required
```

**Fix:** Set `OPENAI_API_KEY` in `.env` file (copy from `.env.example`).

### Embedding Errors

If embeddings fail for specific chunks, the script continues and reports errors in the summary. Check:
- OpenAI API rate limits (batch size is 10 chunks)
- Text encoding issues in source files

### Re-ingesting a File

```bash
# Force re-ingest specific file
npm run ingest-html <file> [options]
# (Will add duplicate vectors — delete old ones first via MCP API if needed)

# Or force re-ingest all
npm run ingest-all --force
```

### Checking Collection Status via API

```bash
curl -X POST http://localhost:3003/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
  -d '{"name": "get_collection_status", "arguments": {"output_format": "json"}}'
```

---

*Created: 2026-02-09 — R2.4: RAG Source Material Ingestion Tracking*
