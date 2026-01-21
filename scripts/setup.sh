#!/bin/bash
# ============================================
# WPI AI Content Factory - Setup Script
# ============================================
# This script initializes the complete system from scratch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================
# Pre-flight checks
# ============================================
print_step "Running pre-flight checks..."

# Check Docker
if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Node.js (optional, for local development)
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_warning "Node.js not found. Required only for local development."
fi

print_success "Pre-flight checks passed"

# ============================================
# Environment setup
# ============================================
print_step "Setting up environment..."

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Create .env if not exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
        print_warning "Please edit .env and add your API keys before starting!"
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Check for required environment variables
source .env 2>/dev/null || true

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-openai-api-key-here" ]; then
    print_warning "OPENAI_API_KEY is not set in .env file!"
    print_warning "The mcp-research service will fail without a valid API key."
fi

if [ -z "$MCP_AUTH_TOKEN" ] || [ "$MCP_AUTH_TOKEN" = "your-secure-auth-token-here" ]; then
    print_warning "MCP_AUTH_TOKEN is not set. Generating a random token..."
    NEW_TOKEN=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
    sed -i "s/MCP_AUTH_TOKEN=.*/MCP_AUTH_TOKEN=$NEW_TOKEN/" .env
    print_success "Generated MCP_AUTH_TOKEN"
fi

# ============================================
# Install dependencies for MCP servers
# ============================================
print_step "Installing MCP server dependencies..."

# mcp-standards
if [ -d "mcp-standards" ]; then
    print_step "Installing mcp-standards dependencies..."
    cd mcp-standards
    if [ -f package.json ]; then
        npm install
        npm run build
        print_success "mcp-standards built successfully"
    fi
    cd ..
fi

# mcp-research
if [ -d "mcp-research" ]; then
    print_step "Installing mcp-research dependencies..."
    cd mcp-research
    if [ -f package.json ]; then
        npm install
        npm run build
        print_success "mcp-research built successfully"
    fi
    cd ..
fi

# admin-fe
if [ -d "admin-fe" ]; then
    print_step "Installing admin-fe dependencies..."
    cd admin-fe
    if [ -f package.json ]; then
        npm install
        print_success "admin-fe dependencies installed"
    fi
    cd ..
fi

# ============================================
# Sync n8n-skills to .claude/skills
# ============================================
print_step "Syncing n8n-skills..."

if [ -d "n8n-skills/skills" ] && [ -d ".claude/skills" ]; then
    cp -r n8n-skills/skills/* .claude/skills/ 2>/dev/null || true
    print_success "n8n-skills synced to .claude/skills"
else
    print_warning "n8n-skills or .claude/skills directory not found"
fi

# ============================================
# Build Docker images
# ============================================
print_step "Building Docker images..."

# Use docker compose or docker-compose based on availability
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD build --no-cache

print_success "Docker images built successfully"

# ============================================
# Create required directories
# ============================================
print_step "Creating required directories..."

mkdir -p output
mkdir -p screenshots
mkdir -p tests/product-definitions

print_success "Directories created"

# ============================================
# Print summary
# ============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Before starting the system, please ensure:"
echo ""
echo "  1. Edit .env and set your OPENAI_API_KEY"
echo "  2. (Optional) Set N8N_API_KEY for n8n integration"
echo ""
echo "To start all services:"
echo -e "  ${BLUE}docker compose up -d${NC}"
echo ""
echo "To check service status:"
echo -e "  ${BLUE}docker compose ps${NC}"
echo ""
echo "Access points:"
echo "  - n8n:            http://localhost:5678"
echo "  - Admin Dashboard: http://localhost:3001"
echo "  - Qdrant:         http://localhost:6333"
echo "  - MCP Standards:  http://localhost:3002"
echo "  - MCP Research:   http://localhost:3003"
echo "  - n8n-MCP:        http://localhost:3000"
echo ""
echo "To view logs:"
echo -e "  ${BLUE}docker compose logs -f [service_name]${NC}"
echo ""
print_success "Happy automating!"
