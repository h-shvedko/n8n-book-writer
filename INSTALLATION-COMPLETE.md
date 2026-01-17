# Installation Complete: n8n-mcp & n8n-skills

**Date:** 2026-01-16
**Status:** ✅ Successfully Installed

---

## What Was Installed

### 1. n8n-mcp (MCP Server) - Docker Deployment
**Location:** `n8n-mcp/`
**Status:** Running in Docker containers

**Services:**
- **n8n**: Workflow automation platform
  - URL: http://localhost:5678
  - Default credentials: admin / password

- **n8n-mcp**: MCP server for AI assistance
  - URL: http://localhost:3000
  - Health endpoint: http://localhost:3000/health
  - MCP endpoint: http://localhost:3000/mcp

### 2. n8n-skills (Claude Code Skills)
**Location:** `C:\Users\hennadii.shvedko\.claude\skills\`
**Status:** 7 skills installed

**Installed Skills:**
1. `n8n-expression-syntax` - n8n expressions with {{$json}}
2. `n8n-mcp-tools-expert` - Using MCP tools for node discovery
3. `n8n-workflow-patterns` - 5 proven workflow patterns
4. `n8n-validation-expert` - Error interpretation and fixing
5. `n8n-node-configuration` - Node property configuration
6. `n8n-code-javascript` - JavaScript in Code nodes
7. `n8n-code-python` - Python in Code nodes

---

## Important Credentials

### MCP Authentication Token
```
CV/1yO4JV3a9E73hQBcNkU+I04HNmwwV3NHDzfpUV7o=
```
**⚠️ Keep this secret! It's in the .env file (which is gitignored)**

### n8n Default Credentials
- **Username:** admin
- **Password:** password

**🔒 You should change these in n8n Settings after first login!**

---

## Next Steps

### 1. Set up n8n API Key (REQUIRED for full functionality)

1. Open n8n: http://localhost:5678
2. Log in with: admin / password
3. Go to **Settings → API**
4. Click **Create API Key**
5. Copy the generated key
6. Update the `.env` file:
   ```bash
   nano n8n-mcp/.env
   # Find the line: N8N_API_KEY=
   # Paste your key after the equals sign
   ```
7. Restart the containers:
   ```bash
   cd n8n-mcp
   docker-compose -f docker-compose.n8n.yml restart
   ```

### 2. Configure Claude Code to Use MCP Server

Create or edit: `%APPDATA%\Claude\claude_desktop_config.json`

**Option A: Using Docker (Recommended)**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--init",
        "-e", "MCP_MODE=stdio",
        "-e", "LOG_LEVEL=error",
        "-e", "DISABLE_CONSOLE_OUTPUT=true",
        "-e", "N8N_API_URL=http://host.docker.internal:5678",
        "-e", "N8N_API_KEY=YOUR_N8N_API_KEY_HERE",
        "ghcr.io/czlonkowski/n8n-mcp:latest"
      ]
    }
  }
}
```

**Option B: Using npx (Alternative)**
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "YOUR_N8N_API_KEY_HERE"
      }
    }
  }
}
```

**After configuration:**
- Restart Claude Code application
- Skills will activate automatically based on your queries

### 3. Test the Installation

**Test Docker Services:**
```bash
# Check containers are running
docker ps

# Check n8n-mcp health
curl -H "Authorization: Bearer CV/1yO4JV3a9E73hQBcNkU+I04HNmwwV3NHDzfpUV7o=" http://localhost:3000/health
```

**Test Claude Code Skills:**

Open a new Claude Code session and try:

1. **Expression Syntax Skill:**
   ```
   How do I use n8n expressions with {{$json}}?
   ```

2. **MCP Tools Expert Skill:**
   ```
   Search for Slack nodes in n8n
   ```

3. **Workflow Patterns Skill:**
   ```
   Show me workflow patterns for webhooks
   ```

### 4. Validate Your Existing Workflow

```
Validate my workflow at workflows/wpi-content-factory-workflow.json
```

The skills will:
- Check node configurations
- Verify expression syntax
- Validate connections
- Report any issues

---

## Useful Commands

### Docker Management

```bash
# Start containers
cd n8n-mcp
docker-compose -f docker-compose.n8n.yml up -d

# Stop containers
docker-compose -f docker-compose.n8n.yml down

# Restart containers
docker-compose -f docker-compose.n8n.yml restart

# View logs
docker logs n8n
docker logs n8n-mcp

# Check status
docker ps
```

### Health Checks

```bash
# n8n-mcp health
curl -H "Authorization: Bearer CV/1yO4JV3a9E73hQBcNkU+I04HNmwwV3NHDzfpUV7o=" \
  http://localhost:3000/health

# n8n health
curl http://localhost:5678/healthz
```

---

## Troubleshooting

### Issue: Skills not activating in Claude Code

**Solution:**
1. Verify skills are installed:
   ```bash
   ls -la ~/.claude/skills/
   ```
2. Each skill folder should contain a `SKILL.md` file
3. Restart Claude Code application

### Issue: n8n-mcp container restarting

**Solution:**
1. Check logs: `docker logs n8n-mcp`
2. Verify `MCP_AUTH_TOKEN` is set in `.env`
3. Ensure token is at least 32 characters

### Issue: MCP tools not available in Claude Code

**Solution:**
1. Verify n8n-mcp container is running: `docker ps`
2. Check `claude_desktop_config.json` is configured correctly
3. Ensure `N8N_API_KEY` is set (get from n8n Settings → API)
4. Restart Claude Code

### Issue: Cannot connect to n8n API

**Solution:**
1. Verify n8n is running: http://localhost:5678
2. Generate API key in n8n: Settings → API
3. Update `N8N_API_KEY` in `.env`
4. Restart containers: `docker-compose -f docker-compose.n8n.yml restart`

---

## Security Notes

1. **.env file** contains secrets - never commit it!
2. **AUTH_TOKEN** should be 32+ characters minimum
3. **Change n8n default password** after first login
4. **N8N_API_KEY** should be regenerated periodically
5. **WEBHOOK_SECURITY_MODE=strict** prevents SSRF attacks

---

## Project Structure

```
n8n writer/
├── n8n-mcp/                    # MCP server (gitignored)
│   ├── .env                    # Environment config (gitignored)
│   ├── docker-compose.n8n.yml  # Docker setup
│   └── ...
├── n8n-skills/                 # Skills source (gitignored)
│   └── skills/                 # 7 skill modules
├── workflows/                  # Your n8n workflows
│   └── wpi-content-factory-workflow.json
├── .gitignore                  # Git exclusions
└── INSTALLATION-COMPLETE.md    # This file
```

**Skills installed in:**
```
C:\Users\hennadii.shvedko\.claude\skills\
├── n8n-expression-syntax/
├── n8n-mcp-tools-expert/
├── n8n-workflow-patterns/
├── n8n-validation-expert/
├── n8n-node-configuration/
├── n8n-code-javascript/
└── n8n-code-python/
```

---

## Support Resources

- **n8n-mcp GitHub:** https://github.com/czlonkowski/n8n-mcp
- **n8n-skills GitHub:** https://github.com/czlonkowski/n8n-skills
- **n8n Documentation:** https://docs.n8n.io/
- **n8n Community:** https://community.n8n.io/

---

## Summary

✅ Docker containers running (n8n + n8n-mcp)
✅ 7 Claude Code skills installed
✅ Health checks passing
✅ .gitignore configured
⚠️ **TODO:** Set up N8N_API_KEY (see Next Steps #1)
⚠️ **TODO:** Configure Claude Code MCP (see Next Steps #2)
⚠️ **TODO:** Change n8n default password

**Your WPI AI Content Factory project is now ready to use the n8n development workflow tools!**
