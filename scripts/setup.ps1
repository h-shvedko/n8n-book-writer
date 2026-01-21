# ============================================
# WPI AI Content Factory - Setup Script (PowerShell)
# ============================================
# This script initializes the complete system from scratch

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step($message) {
    Write-Host "[STEP] " -ForegroundColor Blue -NoNewline
    Write-Host $message
}

function Write-Success($message) {
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $message
}

function Write-Warning($message) {
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $message
}

function Write-Error($message) {
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $message
}

# ============================================
# Pre-flight checks
# ============================================
Write-Step "Running pre-flight checks..."

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Success "Docker found: $dockerVersion"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Check Docker Compose
try {
    docker compose version | Out-Null
    Write-Success "Docker Compose found"
} catch {
    Write-Error "Docker Compose is not available. Please update Docker Desktop."
    exit 1
}

# Check Node.js (optional)
try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Warning "Node.js not found. Required only for local development."
}

Write-Success "Pre-flight checks passed"

# ============================================
# Environment setup
# ============================================
Write-Step "Setting up environment..."

# Navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

# Create .env if not exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env from .env.example"
        Write-Warning "Please edit .env and add your API keys before starting!"
    } else {
        Write-Error ".env.example not found!"
        exit 1
    }
} else {
    Write-Success ".env file exists"
}

# Read .env file
$envContent = Get-Content ".env" -Raw

# Check for required environment variables
if ($envContent -match "OPENAI_API_KEY=sk-your-openai-api-key-here" -or $envContent -notmatch "OPENAI_API_KEY=") {
    Write-Warning "OPENAI_API_KEY is not set in .env file!"
    Write-Warning "The mcp-research service will fail without a valid API key."
}

if ($envContent -match "MCP_AUTH_TOKEN=your-secure-auth-token-here" -or $envContent -notmatch "MCP_AUTH_TOKEN=") {
    Write-Warning "MCP_AUTH_TOKEN is not set. Generating a random token..."
    $newToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    $envContent = $envContent -replace "MCP_AUTH_TOKEN=.*", "MCP_AUTH_TOKEN=$newToken"
    Set-Content ".env" $envContent
    Write-Success "Generated MCP_AUTH_TOKEN"
}

# ============================================
# Install dependencies for MCP servers
# ============================================
Write-Step "Installing MCP server dependencies..."

# mcp-standards
if (Test-Path "mcp-standards") {
    Write-Step "Installing mcp-standards dependencies..."
    Set-Location "mcp-standards"
    if (Test-Path "package.json") {
        npm install
        npm run build
        Write-Success "mcp-standards built successfully"
    }
    Set-Location $ProjectRoot
}

# mcp-research
if (Test-Path "mcp-research") {
    Write-Step "Installing mcp-research dependencies..."
    Set-Location "mcp-research"
    if (Test-Path "package.json") {
        npm install
        npm run build
        Write-Success "mcp-research built successfully"
    }
    Set-Location $ProjectRoot
}

# admin-fe
if (Test-Path "admin-fe") {
    Write-Step "Installing admin-fe dependencies..."
    Set-Location "admin-fe"
    if (Test-Path "package.json") {
        npm install
        Write-Success "admin-fe dependencies installed"
    }
    Set-Location $ProjectRoot
}

# ============================================
# Sync n8n-skills to .claude/skills
# ============================================
Write-Step "Syncing n8n-skills..."

if ((Test-Path "n8n-skills/skills") -and (Test-Path ".claude/skills")) {
    Copy-Item -Path "n8n-skills/skills/*" -Destination ".claude/skills/" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Success "n8n-skills synced to .claude/skills"
} else {
    Write-Warning "n8n-skills or .claude/skills directory not found"
}

# ============================================
# Build Docker images
# ============================================
Write-Step "Building Docker images..."

docker compose build --no-cache

Write-Success "Docker images built successfully"

# ============================================
# Create required directories
# ============================================
Write-Step "Creating required directories..."

New-Item -ItemType Directory -Force -Path "output" | Out-Null
New-Item -ItemType Directory -Force -Path "screenshots" | Out-Null
New-Item -ItemType Directory -Force -Path "tests/product-definitions" | Out-Null

Write-Success "Directories created"

# ============================================
# Print summary
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Before starting the system, please ensure:"
Write-Host ""
Write-Host "  1. Edit .env and set your OPENAI_API_KEY"
Write-Host "  2. (Optional) Set N8N_API_KEY for n8n integration"
Write-Host ""
Write-Host "To start all services:"
Write-Host "  docker compose up -d" -ForegroundColor Blue
Write-Host ""
Write-Host "To check service status:"
Write-Host "  docker compose ps" -ForegroundColor Blue
Write-Host ""
Write-Host "Access points:"
Write-Host "  - n8n:            http://localhost:5678"
Write-Host "  - Admin Dashboard: http://localhost:3001"
Write-Host "  - Qdrant:         http://localhost:6333"
Write-Host "  - MCP Standards:  http://localhost:3002"
Write-Host "  - MCP Research:   http://localhost:3003"
Write-Host "  - n8n-MCP:        http://localhost:3000"
Write-Host ""
Write-Host "To view logs:"
Write-Host "  docker compose logs -f [service_name]" -ForegroundColor Blue
Write-Host ""
Write-Success "Happy automating!"
