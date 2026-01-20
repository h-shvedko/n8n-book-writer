# GitHub Configuration

This directory contains GitHub-specific configuration for the WPI n8n project, including the custom GitHub Copilot agent setup.

## Contents

### 📁 agents/
Custom GitHub Copilot agent definitions.

- **[n8n.agent.md](agents/n8n.agent.md)** - n8n Workflow Expert agent with embedded skills and MCP access

### 📄 Configuration Files

- **[copilot-mcp.json](copilot-mcp.json)** - MCP server configuration template for GitHub Copilot
- **[COPILOT-SETUP.md](COPILOT-SETUP.md)** - Complete setup guide for the n8n agent
- **[CLAUDE-VS-COPILOT.md](CLAUDE-VS-COPILOT.md)** - Comparison of Claude and Copilot agents

### 🔧 Setup Scripts

- **[setup-copilot.ps1](setup-copilot.ps1)** - Windows PowerShell setup script
- **[setup-copilot.sh](setup-copilot.sh)** - macOS/Linux bash setup script

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```powershell
# Start n8n-mcp Docker container first
cd n8n-mcp
docker-compose up -d

# Run setup script
cd ..\.github
.\setup-copilot.ps1
```

**macOS/Linux:**
```bash
# Start n8n-mcp Docker container first
cd n8n-mcp
docker-compose up -d

# Run setup script
cd .github
chmod +x setup-copilot.sh
./setup-copilot.sh
```

### Option 2: Manual Setup

1. Start n8n-mcp Docker container:
   ```bash
   cd n8n-mcp
   docker-compose up -d
   ```

2. Verify server is running:
   ```bash
   curl http://localhost:3000/health
   ```

3. Copy MCP configuration:
   - **Windows**: `%APPDATA%\Code\User\globalStorage\github.copilot\mcp.json`
   - **macOS**: `~/Library/Application Support/Code/User/globalStorage/github.copilot/mcp.json`
   - **Linux**: `~/.config/Code/User/globalStorage/github.copilot/mcp.json`

3. Restart VS Code

4. Use `@n8n` in Copilot Chat

See [COPILOT-SETUP.md](COPILOT-SETUP.md) for detailed instructions.

## GitHub Copilot Agent

### What It Does

The **n8n Workflow Expert** agent provides:
- ✅ Access to 1,084+ n8n nodes via MCP server
- ✅ Workflow validation and debugging tools
- ✅ All 7 n8n development skills embedded
- ✅ WPI Content Factory project context
- ✅ Proven workflow patterns and best practices

### Usage Examples

```
@n8n Create a workflow that processes webhooks and calls OpenAI

@n8n How do I access webhook data in an expression?

@n8n Debug this validation error: "Missing required parameter"

@n8n Search for nodes that can send emails

@n8n Optimize the WPI Content Factory for parallel processing
```

### Agent Skills

The agent includes expertise in:

1. **n8n Expression Syntax** - `{{$json}}`, `{{$node}}` patterns
2. **n8n Code Nodes** - JavaScript and Python in Code nodes
3. **n8n Node Configuration** - 1,084+ node setup guides
4. **n8n Workflow Patterns** - 5 proven architectural patterns
5. **n8n Validation** - Error interpretation and fixing
6. **n8n MCP Tools** - Using the MCP server effectively
7. **WPI Content Factory** - Project-specific knowledge

## Comparison: Claude vs Copilot

Both agents provide the same capabilities but with different interfaces:

| Feature | Claude Code | GitHub Copilot |
|---------|-------------|----------------|
| **Activation** | Automatic | `@n8n` prefix |
| **Skills** | Modular files | Embedded |
| **Context** | 200K tokens | 32K tokens |
| **Integration** | Standalone | VS Code native |
| **Cost** | $20/mo | $10/mo |

See [CLAUDE-VS-COPILOT.md](CLAUDE-VS-COPILOT.md) for detailed comparison.

## Files Explained

### agents/n8n.agent.md

The main agent definition file that tells GitHub Copilot:
- What the agent does and when to use it
- What tools (MCP) it has access to
- All embedded n8n skills and knowledge
- WPI Content Factory context
- Safety guidelines and best practices

This is a **single self-contained file** with all skills embedded, unlike Claude's modular approach.

### copilot-mcp.json

Template configuration for connecting GitHub Copilot to the n8n-mcp Docker container:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "url": "http://localhost:3000",
      "transport": "http"
    }
  }
}
```

The n8n-mcp server runs in Docker and communicates via HTTP on port 3000.

### Setup Scripts

**setup-copilot.ps1** (Windows):
- Checks if n8n-mcp is built
- Creates Copilot config directory
- Copies and updates MCP configuration
- Optionally sets N8N_API_KEY environment variable
- Opens VS Code when done
Docker is running
- Starts n8n-mcp container if needed
- Creates Copilot config directory
- Copies MCP configuration to correct location
- Offers to help configure n8n API key in Docker
- Opens VS Code when done

**setup-copilot.sh** (macOS/Linux):
- Same functionality as PowerShell script
- Checks Docker container status

1. Check that you're using `@n8n` prefix in Copilot Chat
2. Verify agent definition exists: `.github/agents/n8n.agent.md`
3. Restart VS Code

### MCP Tools Not Available

1. Verify n8n-mcp is built: `ls n8n-mcp/dist/index.js`
2. Check MCP config exists in Copilot directory
3. Look for errors in VS Code Output → "GitHub Copilot MCP"

### Wrong Docker container is running: `docker ps | grep n8n-mcp`
2. Test server: `curl http://localhost:3000/health`
3. Check MCP config exists in Copilot directory
4. Look for errors in VS Code Output → "GitHub Copilot MCP"
5. Check Docker logs: `docker logs n8n-mcp`nstead of the custom agent:
- Always use `@n8n` prefix to activate the agent
- Check that agent definition has `tools: [mcp]` in frontmatter

### Connection Errors

1. Ensure `MCP_MODE: "stdio"` is set in configuration
2. Set `LOG_LEVEL: "error"` to reduce noise
3. Check VS Code Developer Tools for detailed errors

See [COPILOT-SETUP.md](COPILOT-SETUP.md) for more troubleshooting tips.

## Development

### Updating the Agent
Updating MCP Server

```bash
cd n8n-mcp
git pull  # or make changes
docker-compose down
docker-compose build
docker-compose up -d
```

Restart VS Code to reload the connection.
1. Extract content from skill files
2. Update corresponding section in `n8n.agent.md`
3. Maintain consistent formatting and structure

### Testing the Agent

```bash
# Test MCP connection
@n8n What tools do you have access to?

# Test skill knowledge
@n8n Explain n8n expression syntax

# Test WPI context
@n8n What is the WPI Content Factory workflow?

# Test tool usage
@n8n Search for HTTP Request nodes
```

## Best Practices

1. **Always use @n8n prefix** - Ensures you're using the custom agent
2. **Be specific** - Clear questions get better answers
3. **Provide context** - Share workflow JSON when debugging
4. **Validate workflows** - Ask agent to check before deploying
5. **Test in dev** - Never edit production workflows directly

## Resources

- **Main Project**: [../README.md](../README.md)
- **Setup Guide**: [../SETUP.md](../SETUP.md)
- **n8n-mcp Server**: [../n8n-mcp/README.md](../n8n-mcp/README.md)
- **n8n Skills**: [../n8n-skills/README.md](../n8n-skills/README.md)
- **Claude Skills**: [../.claude/skills/README.md](../.claude/skills/README.md)

---

**Happy workflow building with GitHub Copilot!** 🚀

For questions or issues, see [COPILOT-SETUP.md](COPILOT-SETUP.md) or the main project documentation.
