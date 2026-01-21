# Using n8n-mcp with GitHub Copilot - Important Update

## Current Limitation

Custom agents defined in `.github/agents/*.agent.md` are currently only available for:
- GitHub Copilot Business/Enterprise users
- Repositories hosted on GitHub.com
- When using the GitHub Copilot Chat extension in a GitHub repository context

For **local workspaces** (like this project), the custom agent won't appear with an `@n8n` prefix.

## ✅ Solution: Use MCP Tools Directly

The good news: **GitHub Copilot can still use the n8n-mcp server** through MCP tools! You just interact with it differently.

### How to Use n8n-mcp with Copilot

Instead of using `@n8n`, simply ask GitHub Copilot questions about n8n in the chat. If the MCP connection is working, Copilot will automatically use the available tools.

**Try these in GitHub Copilot Chat (Ctrl+Shift+I):**

```
Tell me about HTTP Request nodes in n8n

How do I configure an OpenAI node in n8n?

Show me how to access webhook data in n8n expressions

What n8n nodes can I use for email?

Help me validate an n8n workflow configuration
```

Copilot will use the MCP server tools in the background to answer these questions with accurate n8n documentation.

### Verify MCP Connection

To check if the MCP server is connected:

1. Open GitHub Copilot Chat (Ctrl+Shift+I)
2. Look at the VS Code Output panel (View → Output)
3. Select "GitHub Copilot" or "Language Server" from the dropdown
4. You should see MCP-related messages if connected

Or check the Developer Tools:
- Help → Toggle Developer Tools
- Console tab
- Look for MCP connection messages

## Alternative: Use Claude Desktop

For the full custom agent experience with the `@n8n` prefix and embedded skills, use **Claude Desktop** instead:

### Claude Desktop Setup

1. **Install Claude Desktop**: Download from anthropic.com

2. **Configure MCP** in `%APPDATA%\Roaming\Claude\claude_desktop_config.json`:
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

3. **Copy skills** to `.claude/skills/` (already done in this project)

4. **Restart Claude Desktop**

5. Use naturally - Claude auto-selects skills, no prefix needed

## Current Recommendations

### For This Project

**Option 1: Use Claude Desktop (Recommended)**
- Full custom agent with skills
- Better context window (200K tokens)
- Automatic skill selection
- No prefix needed

**Option 2: Use GitHub Copilot with MCP**
- Works in VS Code
- Use natural questions (no @prefix)
- MCP tools available automatically
- Better for inline code completion

**Option 3: Use Both!**
- Claude for complex workflow design
- Copilot for quick code completion
- Both share the same MCP server

### Testing MCP in GitHub Copilot

```
# In Copilot Chat, try:
Can you search the n8n documentation for HTTP Request nodes?

I need help configuring an n8n workflow with OpenAI

What are the available operations for the Gmail node in n8n?

Explain n8n expression syntax for accessing JSON data
```

If Copilot uses the MCP server, responses will include specific node details, operations, and parameters from the n8n database.

## Future: GitHub Copilot Extensions

GitHub is working on **Copilot Extensions** which will allow more powerful custom agents. When available, we can migrate this configuration to that system.

For now, the MCP connection gives Copilot access to n8n knowledge - you just interact with it through natural conversation rather than a custom @-prefix agent.

## Files to Keep

Even though the custom agent doesn't work locally right now, keep these files:
- `.github/agents/n8n.agent.md` - May work if you push to GitHub
- `.github/copilot-mcp.json` - MCP server configuration (working!)
- All documentation - Still accurate for MCP usage

The MCP connection is working correctly - it's just the custom agent prefix that's not available in local workspaces.

---

**Bottom line: Ask GitHub Copilot natural questions about n8n, and it will use the MCP server to give you accurate answers!** 🚀
