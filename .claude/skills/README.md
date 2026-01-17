# Claude Code Skills - Available for WPI n8n Project

This directory contains all available skills that Claude Code can use when working on this project.

## 📚 Available Skills

### Project-Specific Skills
These skills are specific to the WPI Content Factory project:

- **SKILL.md** - Main project overview and architecture
- **ai-agents.md** - Prompt engineering for AI agents
- **n8n-workflows.md** - Working with n8n workflows
- **wpi-context.md** - WPI-specific context and requirements

### n8n-Specific Skills
These skills help with n8n workflow development (copied from `n8n-skills/skills`):

#### Core n8n Development
- **n8n-expression-syntax/** - n8n expression syntax and validation
  - How to write `{{$json}}` expressions correctly
  - Common expression mistakes and fixes
  - Accessing webhook data, node data, etc.

- **n8n-code-javascript/** - JavaScript in n8n Code nodes
  - Using `$input`, `$json`, `$node` syntax
  - Making HTTP requests with `$helpers`
  - Working with DateTime in n8n

- **n8n-code-python/** - Python in n8n Code nodes
  - Using `_input`, `_json`, `_node` syntax
  - Python limitations in n8n
  - Standard library usage

#### n8n Configuration & Patterns
- **n8n-node-configuration/** - Node configuration guidance
  - Operation-aware configuration
  - Required fields by node type
  - Common configuration patterns

- **n8n-workflow-patterns/** - Proven workflow patterns
  - Webhook processing patterns
  - HTTP API integration
  - Database operations
  - AI agent workflows
  - Scheduled tasks

#### n8n Validation & Tools
- **n8n-validation-expert/** - Validation error interpretation
  - Understanding validation errors
  - Fixing common validation issues
  - Validation profiles and best practices

- **n8n-mcp-tools-expert/** - Using n8n-mcp tools effectively
  - Tool selection guidance
  - Parameter formats
  - Search nodes and templates
  - Workflow management

## 🚀 How Skills Are Used

Skills are automatically loaded by Claude Code when you start a session. Claude will use relevant skills based on your questions:

### Example Usage

**You ask:** "How do I access webhook data in n8n?"
**Claude uses:** `n8n-expression-syntax` skill to explain `{{$json.body.fieldName}}`

**You ask:** "Help me write a Code node for data transformation"
**Claude uses:** `n8n-code-javascript` skill for syntax and examples

**You ask:** "What's the best pattern for processing webhooks?"
**Claude uses:** `n8n-workflow-patterns` skill to show webhook patterns

**You ask:** "Validate my workflow configuration"
**Claude uses:** `n8n-validation-expert` skill to check for issues

## 📝 Skill Structure

Each skill folder contains:
- **SKILL.md** - Main skill content (always read first)
- **README.md** - Overview and usage notes
- **EXAMPLES.md** - Code examples and patterns
- **Additional .md files** - Specific topics or reference material

## 🔄 Keeping Skills Updated

The n8n skills are synced from the `n8n-skills/skills` directory. If you update skills there, re-sync with:

```bash
cd "c:\Hennadii Shvedko Documents\source code\Webakademy\new WPI\n8n writer"
cp -r n8n-skills/skills/* .claude/skills/
```

Or use this command from the project root:

```bash
# Sync n8n skills to .claude/skills
cp -r n8n-skills/skills/* .claude/skills/
```

## 💡 Pro Tips

1. **Skills are context-aware** - Claude automatically selects relevant skills based on your question
2. **You can reference skills directly** - Mention "use the n8n-expression-syntax skill" if needed
3. **Skills complement MCP tools** - Skills provide knowledge, MCP tools provide actions
4. **Skills persist across sessions** - Once copied here, they're available in all future sessions

## 🆘 Troubleshooting

**Skills not loading?**
- Check that files are in `.claude/skills/` (not a subdirectory)
- Verify SKILL.md exists in each skill folder
- Restart Claude Code session

**Skills outdated?**
- Re-run the sync command above
- Check `n8n-skills/skills` for latest versions

**Need to add custom skills?**
- Add .md files directly to `.claude/skills/`
- Or create subfolders with SKILL.md inside
- Restart session to load new skills

---

**Last synced:** 2026-01-16
**Source:** `n8n-skills/skills/` directory
