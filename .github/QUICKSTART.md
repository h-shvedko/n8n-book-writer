# 🚀 GitHub Copilot n8n Agent - Quick Start

Get the n8n Workflow Expert agent running in GitHub Copilot in 5 minutes!

## Prerequisites

- ✅ GitHub Copilot subscription (Pro or Enterprise)
- ✅ VS Code with GitHub Copilot extension installed
- ✅ Docker installed and running

## Step 1: Start n8n-mcp Docker Container (1 minute)

```powershell
# Navigate to n8n-mcp directory
cd "c:\Hennadii Shvedko Documents\source code\Webakademy\new WPI\n8n writer\n8n-mcp"

# Start Docker container
docker-compose up -d

# Verify it's running
curl http://localhost:3000/health
# or in PowerShell:
Invoke-WebRequest http://localhost:3000/health
```

Expected response: `{"status": "ok", "version": "2.33.2"}`

## Step 2: Run Setup Script (2 minutes)

**Windows:**
```powershell
cd ..\.github
.\setup-copilot.ps1
```

**macOS/Linux:**
```bash
cd ../.github
chmod +x setup-copilot.sh
./setup-copilot.sh
```

The script will:
1. ✅ Verify n8n-mcp is built
2. ✅ Create Copilot config directory
3. ✅ Copy MCP configuration
4. ❓ Ask if you want to configure n8n API key (optional)
5. ❓ Ask if you want to change n8n URL (optional)
6. ✅ Save configuration
7. ❓ Offer to open VS Code

## Step 3: Restart VS Code (30 seconds)

Close and reopen VS Code to load the MCP configuration.

## Step 4: Test the Agent (1 minute)

1. Open GitHub Copilot Chat: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Shift+I` (macOS)

2. Type this to activate the agent:
   ```
   @n8n hello, what can you do?
   ```

3. You should see the agent respond with its capabilities!

4. Try a real question:
   ```
   @n8n search for HTTP Request nodes
   ```

The agent should use the MCP server to search and show you node information.

## ✅ Success!

If you see node search results, you're all set! The agent has:
- ✅ Access to n8n-mcp server (1,084+ nodes)
- ✅ All 7 n8n development skills
- ✅ WPI Content Factory context
- ✅ Workflow validation tools

## Common Test Commands

```
@n8n What nodes can I use to send emails?

@n8n How do I access webhook data in an expression?

@n8n Create a simple webhook workflow with OpenAI

@n8n Explain the WPI Content Factory architecture

@n8n Validate this workflow configuration: {...}
```

## Troubleshooting

### Agent doesn't respond
- ✅ Did you use `@n8n` prefix?
- ✅ Did you restart VS Code?
- ✅ Check agent exists: `.github/agents/n8n.agent.md`

### MCP tools not working
- ✅ Check Docker container: `docker ps | grep n8n-mcp`
- ✅ Test server: `curl http://localhost:3000/health`
- ✅ Check logs: `docker logs n8n-mcp`
- ✅ Verify VS Code Output → "GitHub Copilot MCP"

### Config location
**Windows:**
```powershell
notepad "$env:APPDATA\Code\User\globalStorage\github.copilot\mcp.json"
```

**macOS:**
```bash
cat "$HOME/Library/Application Support/Code/User/globalStorage/github.copilot/mcp.json"
```

**Linux:**
```bash
cat "$HOME/.config/Code/User/globalStorage/github.copilot/mcp.json"
```

## What's Next?

- 📖 Read [COPILOT-SETUP.md](COPILOT-SETUP.md) for detailed documentation
- 🆚 See [CLAUDE-VS-COPILOT.md](CLAUDE-VS-COPILOT.md) to compare with Claude
- 🛠️ Build workflows with `@n8n create a workflow that...`
- 🔍 Debug issues with `@n8n help me fix this error...`

## Need Help?

- See [COPILOT-SETUP.md](COPILOT-SETUP.md) for detailed troubleshooting
- Check [README.md](README.md) for all .github files explanation
- Review main project [../SETUP.md](../SETUP.md)

---

**That's it! Start building n8n workflows with AI assistance!** 🎉
