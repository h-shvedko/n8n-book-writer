# Workflow Decomposition — Node Mapping

> Generated from wpi-content-factory-workflow.json (57 nodes)

| # | Node Name | Node Type | Target Workflow |
|---|-----------|-----------|------------------|
| 1 | 📥 Book Request Form | formTrigger | WF-0 |
| 2 | 🔍 Extract Syllabus ID | set | WF-0 |
| 3 | 🔄 Activate Syllabus | httpRequest | WF-1 |
| 4 | 🔀 Route by Strategy | if | WF-1 |
| 5 | 📚 Fetch Syllabus Domains | httpRequest | WF-1 |
| 6 | 📑 Fetch Syllabus Topics | httpRequest | WF-1 |
| 7 | 🔧 Initialize BookState | set | WF-1 |
| 8 | 📚 MCP: Get Syllabus Section | httpRequest | WF-1 |
| 9 | 🔍 MCP: Search Knowledge Base | httpRequest | WF-1 |
| 10 | 🔀 Merge MCP Context | merge | WF-1 |
| 11 | 🧩 Combine MCP Data | code | WF-1 |
| 12 | 🏗️ Architect Agent | httpRequest | WF-1 |
| 13 | 📋 Parse Blueprint | code | WF-1 |
| 14 | 🗑️ Clear Chapter Accumulator | httpRequest | WF-0 |
| 15 | 📑 Prepare Chapters | code | WF-0 |
| 16 | 🔁 Chapter Loop | splitInBatches | WF-0 |
| 17 | 🔍 MCP: Chapter Research | httpRequest | WF-2 |
| 18 | 📚 MCP: Get Chapter LOs | httpRequest | WF-2 |
| 19 | 🔀 Merge MCP Results | merge | WF-2 |
| 20 | 🔀 Add Chapter Data | merge | WF-2 |
| 21 | 💾 Merge Chapter Context | code | WF-2 |
| 22 | ✍️ WPI Technical Architect | httpRequest | WF-3 |
| 23 | 📝 Extract Code Requests | code | WF-4 |
| 24 | 🔀 Code Needed? | if | WF-4 |
| 25 | 💻 WPI Coder Agent | httpRequest | WF-4 |
| 26 | 🔗 Merge Code | code | WF-4 |
| 27 | 🔬 MCP: Validate Code | httpRequest | WF-4 |
| 28 | 📊 Parse Code Validation | code | WF-4 |
| 29 | 🔀 Code Valid? | if | WF-4 |
| 30 | 🔀 Code Retry? | if | WF-4 |
| 31 | 🔄 WPI Coder Self-Correct | httpRequest | WF-4 |
| 32 | 🔗 Merge Corrected Code | code | WF-4 |
| 33 | ⏭️ Skip Validation | noOp | WF-4 |
| 34 | ⏭️ Skip Code | noOp | WF-4 |
| 35 | 📋 MCP: ISO Compliance Check | httpRequest | WF-5 |
| 36 | 🔍 WPI ISO Editor | httpRequest | WF-5 |
| 37 | 📊 Parse ISO Editor Result | code | WF-5 |
| 38 | 🔀 Quality OK? | if | WF-5 |
| 39 | 🔀 Max Revisions? | if | WF-5 |
| 40 | 💾 MCP: Store in Knowledge Base | httpRequest | WF-5 |
| 41 | ✅ Finalize Chapter | code | WF-0 |
| 42 | 📧 Send Chapter Email | emailSend | WF-0 |
| 43 | 📦 Store Chapter | httpRequest | WF-0 |
| 44 | 🔀 All Chapters Done? | if | WF-0 |
| 45 | 📥 Get Accumulated Chapters | httpRequest | WF-6 |
| 46 | 📚 Compile Book | code | WF-6 |
| 47 | 📄 Convert Book MD | convertToFile | WF-7 |
| 48 | 📄 Convert Questions MD | convertToFile | WF-7 |
| 49 | 📧 Final Book Email | emailSend | WF-7 |
| 50 | 📝 Info | stickyNote | UNMAPPED |
| 51 | 🌐 Convert Book to HTML | httpRequest | WF-7 |
| 52 | 🌐 Convert Questions to HTML | httpRequest | WF-7 |
| 53 | 📋 Extract HTML Book | code | WF-7 |
| 54 | 📋 Extract HTML Questions | code | WF-7 |
| 55 | 📄 Convert Book HTML | convertToFile | WF-7 |
| 56 | 📄 Convert Questions HTML | convertToFile | WF-7 |
| 57 | 📦 Create ZIP | code | WF-7 |

## Workflow Summary

### WF-1 Blueprint Generator
- **File:** `WF-1-Blueprint.json`
- **Description:** Generates book blueprint from syllabus. Architect Agent + Parser.
- **Nodes:** 11

### WF-2 Research Workflow
- **File:** `WF-2-Research.json`
- **Description:** Per-chapter research: MCP calls + knowledge base search.
- **Nodes:** 5

### WF-3 Chapter Builder
- **File:** `WF-3-ChapterBuilder.json`
- **Description:** Generates chapter content. Writer Agent with context accumulation.
- **Nodes:** 1

### WF-4 Code Generation
- **File:** `WF-4-Coder.json`
- **Description:** Code generation with validation and self-correction loop.
- **Nodes:** 12

### WF-5 Editor / QA
- **File:** `WF-5-EditorQA.json`
- **Description:** Quality check: ISO compliance + editorial review.
- **Nodes:** 6

### WF-6 Book Compiler
- **File:** `WF-6-Compiler.json`
- **Description:** Assembles all chapters into a complete book JSON.
- **Nodes:** 2

### WF-7 Publisher
- **File:** `WF-7-Publisher.json`
- **Description:** Publishes book to Admin FE API (MySQL storage).
- **Nodes:** 10

### WF-0 Master Orchestrator
- **File:** `WF-0-Manager.json`
- **Description:** Central state machine. Chapter loop + global history + status reporting.
- **Nodes:** 9

