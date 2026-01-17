# n8n AI Nodes Usage Guide

Quick reference for when to use different AI node types in n8n workflows.

---

## The Two Approaches

### 1. Direct OpenAI API (HTTP Request) ✅ Used in this project

**When to use:**
- Simple one-shot AI calls
- Single prompt → single response
- No conversation history needed
- No tool calling required
- Direct control over API parameters

**Implementation:**
```
HTTP Request Node
├─ URL: https://api.openai.com/v1/chat/completions
├─ Method: POST
├─ Auth: OpenAI API credentials
└─ Body: {model, messages, temperature, max_tokens}

Response: $json.choices[0].message.content
```

**Example use cases:**
- Text generation (our Writer Agent)
- Code generation (our Coder Agent)
- Content review (our Editor Agent)
- Research summarization (our Researcher Agent)
- Blueprint creation (our Architect Agent)

### 2. AI Agent + LangChain Nodes ❌ NOT used in this project

**When to use:**
- Conversational AI with memory
- Agent needs to call tools
- Multi-step reasoning
- Dynamic tool selection by AI
- RAG (Retrieval Augmented Generation)

**Implementation:**
```
AI Agent Node
├─ ai_languageModel ← OpenAI Chat Model node
├─ ai_tool ← HTTP Request / Database / Code nodes
├─ ai_tool ← Another tool
├─ ai_memory ← Window Buffer Memory node
└─ main → outputs final response

Response: Complex, depends on agent configuration
```

**Example use cases:**
- Customer support chatbot with order lookup
- SQL analyst that queries databases
- Document Q&A with vector search
- DevOps assistant that deploys apps
- Research assistant with web search

---

## Decision Tree

```
Need AI in workflow?
│
├─ YES → Is it a conversation with memory?
│         │
│         ├─ NO → Does AI need to call tools/APIs/databases?
│         │       │
│         │       ├─ NO → ✅ Use HTTP Request (direct API)
│         │       │       Example: Generate content, analyze text, translate
│         │       │
│         │       └─ YES → ❌ Use AI Agent + Tools
│         │               Example: "Search database then send email"
│         │
│         └─ YES → ❌ Use AI Agent + Memory
│                   Example: Chatbot, virtual assistant
│
└─ NO → Use regular n8n nodes
```

---

## WPI Content Factory: Why HTTP Request?

Our workflow uses **HTTP Request nodes** because:

1. **No conversation needed** - Each agent runs once per chapter
2. **No tool calling needed** - Agents don't query databases or APIs
3. **Simple prompt-response** - Input → AI → Output
4. **Better control** - Direct access to OpenAI parameters
5. **Easier debugging** - Can see exact API request/response

### Our Agent Pattern

```
Input Data
  ↓
HTTP Request (OpenAI API)
  ├─ System prompt (role definition)
  ├─ User prompt (with n8n expressions)
  └─ Parameters (model, temperature, tokens)
  ↓
Code Node (parse response)
  ├─ Extract: $json.choices[0].message.content
  └─ Transform for next node
  ↓
Next Step
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Using LangChain nodes in main workflow

```json
{
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "parameters": {
    "model": "gpt-4o",
    "messages": {...}
  }
}
```

**Problem:** These nodes expect `ai_languageModel` connections, not `main` connections.

**Result:** Nodes appear disconnected in UI, workflow fails.

### ✅ CORRECT: HTTP Request for simple AI calls

```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.openai.com/v1/chat/completions",
    "method": "POST",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "openAiApi",
    "jsonBody": "{\"model\": \"gpt-4o\", ...}"
  }
}
```

**Result:** Works perfectly, nodes connect, workflow executes.

### ❌ WRONG: Accessing response content

```javascript
// This works for LangChain nodes (not used here)
const content = $json.message.content;
```

### ✅ CORRECT: Accessing OpenAI API response

```javascript
// This works for HTTP Request to OpenAI API
const content = $json.choices[0].message.content;
```

---

## Response Structure Comparison

### LangChain Chat Model Response
```json
{
  "message": {
    "role": "assistant",
    "content": "AI response here"
  }
}
```
**Access:** `$json.message.content`

### OpenAI API Response
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI response here"
      },
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456
  }
}
```
**Access:** `$json.choices[0].message.content`

---

## When You WOULD Use AI Agent Nodes

If WPI Content Factory needed these features, we'd use AI Agent:

### Example 1: Interactive Research Agent
```
User asks: "Find latest React best practices"

AI Agent
  ├─ OpenAI Chat Model (ai_languageModel)
  ├─ Web Search Tool (ai_tool) → Searches Google
  ├─ Vector Store Tool (ai_tool) → Searches internal docs
  └─ Memory (ai_memory) → Remembers previous questions

Agent logic:
1. Search web for "React best practices 2025"
2. Search internal docs for "React guidelines"
3. Synthesize findings
4. Remember this conversation for follow-up
```

### Example 2: Quality Checker with Database
```
AI Agent
  ├─ OpenAI Chat Model (ai_languageModel)
  ├─ Postgres Tool (ai_tool) → Query exam_questions table
  └─ Code Tool (ai_tool) → Validate question format

Agent logic:
1. Read chapter content
2. Query similar existing questions
3. Generate unique questions
4. Validate format with code
```

### Example 3: Content Approval Assistant
```
Slack message: "Approve chapter 5"

AI Agent
  ├─ OpenAI Chat Model (ai_languageModel)
  ├─ Database Tool (ai_tool) → Fetch chapter content
  ├─ HTTP Request Tool (ai_tool) → Update approval status
  └─ Window Buffer Memory (ai_memory) → Track conversation

Agent logic:
1. User asks: "Show me chapter 5"
2. Agent queries database
3. Agent shows summary
4. User: "Approve it"
5. Agent updates status
6. Agent confirms
```

**Note:** None of these advanced features are needed for our current workflow.

---

## Configuration Examples

### HTTP Request to OpenAI (What we use)

**Full configuration:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "openAiApi",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"gpt-4o\",\n  \"temperature\": 0.7,\n  \"max_tokens\": 2000,\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"You are a helpful assistant.\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"{{ $json.user_input }}\"\n    }\n  ]\n}"
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

**Parse response:**
```javascript
// In Code node after HTTP Request
const response = $input.first().json;
const content = response.choices[0].message.content;

return {
  json: {
    ai_response: content,
    tokens_used: response.usage.total_tokens
  }
};
```

### AI Agent (Alternative approach - not used)

**Full configuration:**
```json
{
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "You are a helpful assistant with access to tools."
  },
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1.1
}

// Connected via ai_languageModel port to:
{
  "parameters": {
    "model": "gpt-4o",
    "options": {
      "temperature": 0.7
    }
  },
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "typeVersion": 1
}
```

---

## Summary

| Feature | HTTP Request | AI Agent |
|---------|-------------|----------|
| One-shot AI calls | ✅ Perfect | ❌ Overkill |
| Conversation with memory | ❌ Can't do | ✅ Built-in |
| Tool calling | ❌ Can't do | ✅ Built-in |
| Direct API control | ✅ Full control | ⚠️ Abstracted |
| Debugging | ✅ Easy | ⚠️ Complex |
| Setup complexity | ✅ Simple | ⚠️ Advanced |
| Cost tracking | ✅ Per-call | ⚠️ Aggregated |
| **WPI Use Case** | ✅ **Used** | ❌ Not needed |

**Our choice:** HTTP Request nodes for simple, reliable, debuggable AI calls.

---

## References

- OpenAI API Documentation: https://platform.openai.com/docs/api-reference/chat
- n8n HTTP Request Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- n8n AI Agent Pattern: `.claude/skills/n8n-workflow-patterns/ai_agent_workflow.md`
- n8n Workflow Patterns: `.claude/skills/n8n-workflow-patterns/skill.md`
