# GitHub Copilot n8n Agent Setup Script
# This script configures GitHub Copilot to use the n8n-mcp server running in Docker

Write-Host "🚀 GitHub Copilot n8n Agent Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# Check if n8n-mcp container is running
$mcpContainer = docker ps --filter "name=n8n-mcp" --format "{{.Names}}"
if (-not $mcpContainer) {
    Write-Host "⚠️  n8n-mcp container not running" -ForegroundColor Yellow
    Write-Host "Starting n8n-mcp container..." -ForegroundColor Cyan
    
    Push-Location (Join-Path $PSScriptRoot "..\n8n-mcp")
    docker-compose up -d
    Pop-Location
    
    # Wait for container to be ready
    Start-Sleep -Seconds 3
}

# Test if server is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ n8n-mcp server is responding on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n-mcp server is not responding on http://localhost:3000" -ForegroundColor Red
    Write-Host "Please check Docker logs: docker logs n8n-mcp" -ForegroundColor Yellow
    exit 1
}

# Determine Copilot config directory
$copilotDir = Join-Path $env:APPDATA "Code\User\globalStorage\github.copilot"
Write-Host "📁 Copilot config directory: $copilotDir" -ForegroundColor Cyan

# Create directory if it doesn't exist
if (-not (Test-Path $copilotDir)) {
    Write-Host "Creating directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $copilotDir -Force | Out-Null
    Write-Host "✅ Directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Directory exists" -ForegroundColor Green
}

# Copy MCP configuration
$configTemplatePath = Join-Path $PSScriptRoot "copilot-mcp.json"
$configDestPath = Join-Path $copilotDir "mcp.json"

Write-Host ""
Write-Host "📝 Configuring MCP settings..." -ForegroundColor Cyan

# Simply copy the config (already points to localhost:3000)
Copy-Item $configTemplatePath $configDestPath -Force
Write-Host "✅ Configuration saved to: $configDestPath" -ForegroundColor Green

# Check if user wants to configure n8n API key in Docker
Write-Host ""
Write-Host "🔑 n8n API Key Configuration (Optional)" -ForegroundColor Cyan
Write-Host "To create/update workflows in n8n, configure the API key in Docker." -ForegroundColor Gray
Write-Host "This requires editing n8n-mcp/docker-compose.yml" -ForegroundColor Gray
$response = Read-Host "Do you want to configure n8n API key now? (y/N)"

if ($response -match '^[Yy]') {
    Write-Host ""
    Write-Host "Edit n8n-mcp/docker-compose.yml and add:" -ForegroundColor Yellow
    Write-Host "environment:" -ForegroundColor White
    Write-Host "  N8N_API_KEY: 'your-api-key'" -ForegroundColor White
    Write-Host "  N8N_BASE_URL: 'http://localhost:5678'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then restart: docker-compose restart" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue"
} else {
    Write-Host "⏭️  Skipping API key configuration" -ForegroundColor Gray
    Write-Host "    You can still access all node documentation and validation" -ForegroundColor Gray
}

# Display next steps
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart VS Code to load the MCP configuration" -ForegroundColor White
Write-Host "2. Open GitHub Copilot Chat (Ctrl+Shift+I)" -ForegroundColor White
Write-Host "3. Type '@n8n' to activate the agent" -ForegroundColor White
Write-Host "4. Try: '@n8n search for HTTP Request nodes'" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more info, see .github/COPILOT-SETUP.md" -ForegroundColor Gray
Write-Host ""

# Offer to open VS Code
$response = Read-Host "Open VS Code now to test the agent? (y/N)"
if ($response -match '^[Yy]') {
    code .
}
