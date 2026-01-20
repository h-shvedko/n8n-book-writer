#!/bin/bash

# GitHub Copilot n8n Agent Setup Script (macOS/Linux)
# This script configures GitHub Copilot to use the n8n-mcp server running in Docker

echo "🚀 GitHub Copilot n8n Agent Setup"
echo "================================="
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker and try again"
    exit 1
fi
echo "✅ Docker is running"

# Check if n8n-mcp container is running
if ! docker ps --filter "name=n8n-mcp" --format "{{.Names}}" | grep -q "n8n-mcp"; then
    echo "⚠️  n8n-mcp container not running"
    echo "Starting n8n-mcp container..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$SCRIPT_DIR/../n8n-mcp"
    docker-compose up -d
    
    # Wait for container to be ready
    sleep 3
fi

# Test if server is responding
if curl -s http://localhost:3000/health &> /dev/null; then
    echo "✅ n8n-mcp server is responding on http://localhost:3000"
else
    echo "❌ n8n-mcp server is not responding on http://localhost:3000"
    echo "Please check Docker logs: docker logs n8n-mcp"
    exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    COPILOT_DIR="$HOME/Library/Application Support/Code/User/globalStorage/github.copilot"
else
    COPILOT_DIR="$HOME/.config/Code/User/globalStorage/github.copilot"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create directory if it doesn't exist
echo "configuration
echo ""
echo "📝 Configuring MCP settings..."

CONFIG_TEMPLATE="$SCRIPT_DIR/copilot-mcp.json"
CONFIG_DEST="$COPILOT_DIR/mcp.json"

# Simply copy the config (already points to localhost:3000)
cp "$CONFIG_TEMPLATE" "$CONFIG_DEST"
echo "✅ Configuration saved to: $CONFIG_DEST"

# Check if user wants to configure n8n API key in Docker
echo ""
echo "🔑 n8n API Key Configuration (Optional)"
echo "To create/update workflows in n8n, configure the API key in Docker."
echo "This requires editing n8n-mcp/docker-compose.yml"
read -p "Do you want to configure n8n API key now? (y/N): " response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Edit n8n-mcp/docker-compose.yml and add:"
    echo "environment:"
    echo "  N8N_API_KEY: 'your-api-key'"
    echo "  N8N_BASE_URL: 'http://localhost:5678'"
    echo ""
    echo "Then restart: docker-compose restart"
    echo ""
    read -p "Press Enter to continue"
else
    echo "⏭️  Skipping API key configuration"
    echo "    You can still access all node documentation and validation"
fi
if [[ "$response" =~ ^[Yy]$ ]]; then
    read -p "Enter n8n base URL (e.g., http://localhost:5678): " base_url
    cat "$CONFIG_DEST" | jq ".mcpServers.\"n8n-mcp\".env.N8N_BASE_URL = \"$base_url\"" > "$CONFIG_DEST.tmp"
    mv "$CONFIG_DEST.tmp" "$CONFIG_DEST"
    echo "✅ n8n base URL set to: $base_url"
fi

echo ""
echo "✅ Configuration saved to: $CONFIG_DEST"

# Display next steps
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Restart VS Code to load the MCP configuration"
echo "2. Open GitHub Copilot Chat (Ctrl+Shift+I or Cmd+Shift+I)"
echo "3. Type '@n8n' to activate the agent"
echo "4. Try: '@n8n search for HTTP Request nodes'"
echo ""
echo "📖 For more info, see .github/COPILOT-SETUP.md"
echo ""

# Offer to open VS Code
read -p "Open VS Code now to test the agent? (y/N): " response
if [[ "$response" =~ ^[Yy]$ ]]; then
    code .
fi
