# GitHub Copilot Agent Setup for n8n

This guide explains how to use the custom n8n Workflow Expert agent in GitHub Copilot with access to the n8n-mcp server.

## What This Does

The custom agent gives GitHub Copilot:
- ✅ Expert knowledge of n8n workflow automation
- ✅ Access to 1,084+ n8n node documentation via MCP
- ✅ Validation and debugging tools for workflows
- ✅ WPI AI Content Factory project context
- ✅ All 7 n8n skills (expressions, code, patterns, validation)

## Prerequisites

1. **GitHub Copilot** subscription (Pro or Enterprise)
2. **VS Code** with GitHub Copilot extension installed
3. **n8n-mcp server** running in Docker on localhost:3000 (see main SETUP.md)
4. **Docker** installed and running

## Setup Instructions

### Step 1: Start n8n-mcp Server in Docker

If you haven't already started the n8n-mcp server:

```bash
cd "c:\Hennadii Shvedko Documents\source code\Webakademy\new WPI\n8n writer\n8n-mcp"
docker-compose up -d
```

Verify the server is running:

```bash
curl http://localhost:3000/health
# or
Invoke-WebRequest http://localhost:3000/health
```

### Step 2: Configure GitHub Copilot MCP Settings

GitHub Copilot looks for MCP configuration in:
- **Windows**: `%APPDATA%\Code\User\globalStorage\github.copilot\mcp.json`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/github.copilot/mcp.json`
- **Linux**: `~/.config/Code/User/globalStorage/github.copilot/mcp.json`

The configuration points to the Docker container running on localhost:3000.

Copy the configuration from `.github/copilot-mcp.json` to the appropriate location:

**Windows PowerShell:**
```powershell
# Create directory if it doesn't exist
$copilotDir = "$env:APPDATA\Code\User\globalStorage\github.copilot"
if (-not (Test-Path $copilotDir)) {
    New-Item -ItemType Directory -Path $copilotDir -Force
}

# Copy MCP configuration
Copy-Item ".github\copilot-mcp.json" "$copilotDir\mcp.json"
```

**macOS/Linux:**
```bash
# Create directory if it doesn't exist
mkdir -p "$HOME/Library/Application Support/Code/User/globalStorage/github.copilot"

# Copy MCP configuration
cp .github/copilot-mcp.json "$HOME/Library/Application Support/Code/User/globalStorage/github.copilot/mcp.json"
```

### Step 3: Configure n8n API Access (Optional)

If you want to create/update workflows directly in your n8n instance, configure the API key in the Docker container.

Edit `n8n-mcp/docker-compose.yml` and set:
```yaml
environment:
  N8N_API_KEY: "your-api-key-here"
  N8N_BASE_URL: "http://localhost:5678"
```

Then restart the container:
```bash
docker-compose restart
```

> **Note**: Without N8N_API_KEY, you'll still have access to all node documentation, validation, and templates. You won't be able to create/update workflows directly in your n8n instance.

### Step 4: Restart VS Code

Close and reopen VS Code to load the new MCP configuration.

### Step 5: Activate the n8n Agent

1. Open GitHub Copilot Chat (Ctrl+Shift+I or Cmd+Shift+I)
2. Type `@n8n` to activate the custom agent
3. Start asking n8n-related questions!

## Verifying Setup

### Test MCP Connection

In Copilot Chat, try:

```
@n8n Can you search for HTTP Request nodes?
```

The agent should use the n8n-mcp server to search and return node information.

### Test Agent Skills

Ask the agent about n8n concepts:

```
@n8n How do I access webhook data in an expression?
```

The agent should explain `{{$json.body.fieldName}}` syntax using the n8n-expression-syntax skill.

### Check Available Tools

Ask what tools are available:

```
@n8n What MCP tools do you have access to?
```

The agent should list tools like `search_nodes`, `get_node`, `validate_workflow`, etc.

## Usage Examples

### Example 1: Building a Workflow

```
@n8n Create a workflow that receives a webhook, validates the data, 
calls OpenAI GPT-4o, and saves the response to a file.
```

### Example 2: Debugging

```
@n8n I'm getting a validation error "Missing required parameter 'resource'" 
on my HTTP Request node. Here's the configuration: {...}
```

### Example 3: Finding Nodes

```
@n8n What nodes can I use to send email notifications?
```

### Example 4: WPI Content Factory

```
@n8n Help me optimize the WPI Content Factory workflow to process 
chapters in parallel instead of sequentially.
```

## Agent Capabilities

The n8n agent has access to:

### Knowledge Base (Built-in Skills)

1. **n8n Expression Syntax** - Correct `{{$json}}` patterns
2. **n8n Code Nodes** - JavaScript and Python in Code nodes
3. **n8n Node Configuration** - 1,084+ node setup guides
4. **n8n Workflow Patterns** - 5 proven architectural patterns
5. **n8n Validation** - Error interpretation and fixing
6. **WPI Content Factory** - Project-specific context
7. **AI Agents** - Prompt engineering for AI workflows

### MCP Tools (via n8n-mcp server)

- `search_nodes` - Find nodes by keyword
- `get_node` - Get detailed node documentation
- `validate_node` - Check node configuration
- `validate_workflow` - Validate complete workflows
- `search_templates` - Find workflow examples
- `n8n_create_workflow` - Create workflows (requires API key)
- `n8n_update_workflow` - Update workflows (requires API key)

## Troubleshooting

### Agent Not Responding

1. Check VS Code Output panel → "GitHub Copilot MCP"
2. Verify `dist/index.js` exists in n8n-mcp folder
3. Ensure MCP_MODE="stdio" is set in configuration
4. Restart VS Code

### MCP Tools Not Available

1. Check that n8n-mcp built successfully: `npm run build`
2. Verify the path in `mcp.json` matches your installation
3. Check environment variable syntax (Windows vs Unix)

### Connection Errors

1. Ensure Docker container is running: `docker ps`
2. Check server logs: `docker logs n8n-mcp`
3. Verify port 3000 is not blocked by firewall
4. Test connection: `curl http://localhost:3000/health`
5. Look for error messages in VS Code Developer Tools (Help → Toggle Developer Tools)

### Agent Using Wrong Information

The agent might be using general GitHub Copilot knowledge instead of the custom agent configuration. Make sure you're using `@n8n` to invoke the agent.

## Differences from Claude Setup

| Feature | Claude | GitHub Copilot |
|---------|--------|----------------|
| **Skills Location** | `.claude/skills/` | Built into agent definition |
| **MCP Config** | `claude_desktop_config.json` | `github.copilot/mcp.json` |
| **Activation** | Automatic | Use `@n8n` prefix |
| **Context Window** | Larger | Smaller |
| **Tool Calling** | More flexible | Structured |

The GitHub Copilot agent has the same knowledge and capabilities as the Claude setup, but accessed differently within VS Code.

## Advanced Configuration

### Multiple n8n Instances

To work with multiple n8n instances, run multiple Docker containers on different ports:

```bash
# Start local instance on port 3000
cd n8n-mcp
docker-compose up -d

# Start production instance on port 3001
docker run -d -p 3001:3000 \
  -e N8N_BASE_URL=https://n8n.production.com \
  -e N8N_API_KEY=prod-api-key \
  n8n-mcp
```

Then configure multiple servers in `mcp.json`:
```json
{
  "mcpServers": {
    "n8n-local": {
      "url": "http://localhost:3000",
      "transport": "http"
    },
    "n8n-production": {
      "url": "http://localhost:3001",
      "transport": "http"
    }
  }
}
```

### Debugging MCP Communication

Enable detailed logging in Docker:

```bash
# Edit docker-compose.yml
environment:
  LOG_LEVEL: "debug"

# Restart container
docker-compose restart

# Watch logs
docker logs -f n8n-mcp
```

Check logs in: VS Code → Output → "GitHub Copilot MCP"

### Checking Server Status

The n8n-mcp server runs in Docker on HTTP mode by default.

Check if it's running:

```bash
# Check Docker container status
docker ps | grep n8n-mcp

# Test HTTP endpoint
curl http://localhost:3000/health

# Or in PowerShell
Invoke-WebRequest http://localhost:3000/health
```

Expected response:
```json
{"status": "ok", "version": "2.33.2"}
```

## Updating the Agent

### Update Agent Skills

Edit [.github/agents/n8n.agent.md](.github/agents/n8n.agent.md) and save. GitHub Copilot will reload the agent definition automatically.

### Update MCP Server

```bash
cd n8n-mcp
git pull  # or make your changes
docker-compose down
docker-compose build
docker-compose up -d
```

Restart VS Code to reload the connection.

### Sync Skills from n8n-skills

The agent definition includes all n8n skills inline. To update from the main repository:

1. Update files in `n8n-skills/skills/`
2. Regenerate agent definition with updated skill content
3. Reload VS Code

## Best Practices

1. **Always use @n8n prefix** - Ensures you're using the custom agent
2. **Be specific** - "Create a webhook workflow" is better than "help with n8n"
3. **Provide context** - Share workflow JSON or error messages when debugging
4. **Validate workflows** - Ask the agent to validate before deploying
5. **Test in dev** - Never edit production workflows directly

## Resources

- **Agent Definition**: [.github/agents/n8n.agent.md](.github/agents/n8n.agent.md)
- **MCP Config**: [.github/copilot-mcp.json](.github/copilot-mcp.json)
- **n8n-mcp Server**: [n8n-mcp/README.md](../n8n-mcp/README.md)
- **n8n Skills**: [n8n-skills/README.md](../n8n-skills/README.md)
- **Main Setup**: [SETUP.md](../SETUP.md)

---

**Happy workflow building with GitHub Copilot!** 🚀

For issues or questions, check the main project documentation or open an issue in the repository.
