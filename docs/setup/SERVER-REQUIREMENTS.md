# WPI AI Content Factory - Server Requirements

This document outlines the server requirements for running the WPI AI Content Factory in production environments.

---

## Quick Start

```bash
# 1. Clone and setup
git clone <repository>
cd wpi-content-factory

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run setup
./scripts/setup.sh      # Linux/macOS
.\scripts\setup.ps1     # Windows

# 4. Start services
docker compose up -d

# 5. Access
# n8n:      http://localhost:5678
# Admin:    http://localhost:3001
# Qdrant:   http://localhost:6333
```

---

## Server Requirements

### Minimal Configuration
*Suitable for development and testing*

| Resource | Specification |
|----------|---------------|
| **CPU** | 2 vCPU |
| **RAM** | 4 GB |
| **Storage** | 20 GB SSD |
| **OS** | Ubuntu 22.04 LTS / Windows Server 2022 |
| **Docker** | 24.0+ with Compose v2 |

**Limitations:**
- Single concurrent workflow execution
- Limited vector database size (~10,000 documents)
- Basic response times
- Development/testing only

**Estimated Cost:**
- AWS: t3.medium ~$30/month
- Azure: B2s ~$35/month
- GCP: e2-medium ~$25/month

---

### Standard Configuration
*Recommended for production with moderate load*

| Resource | Specification |
|----------|---------------|
| **CPU** | 4 vCPU |
| **RAM** | 8 GB |
| **Storage** | 50 GB SSD |
| **Network** | 100 Mbps |
| **OS** | Ubuntu 22.04 LTS / Windows Server 2022 |
| **Docker** | 24.0+ with Compose v2 |

**Capabilities:**
- 3-5 concurrent workflow executions
- Medium vector database (~100,000 documents)
- Good response times (<2s for searches)
- Suitable for small teams (5-10 users)

**Resource Allocation:**

| Service | CPU | Memory |
|---------|-----|--------|
| n8n | 1.0 | 1 GB |
| Qdrant | 1.0 | 2 GB |
| mcp-standards | 0.25 | 256 MB |
| mcp-research | 0.5 | 512 MB |
| n8n-mcp | 0.5 | 512 MB |
| admin-fe | 0.25 | 128 MB |
| **Total** | 3.5 | 4.4 GB |

**Estimated Cost:**
- AWS: t3.xlarge ~$120/month
- Azure: B4ms ~$140/month
- GCP: e2-standard-4 ~$100/month

---

### Maximum Configuration
*For high-load production environments*

| Resource | Specification |
|----------|---------------|
| **CPU** | 8+ vCPU |
| **RAM** | 32 GB |
| **Storage** | 200 GB NVMe SSD |
| **Network** | 1 Gbps |
| **OS** | Ubuntu 22.04 LTS |
| **Docker** | 24.0+ with Compose v2 |

**Capabilities:**
- 10+ concurrent workflow executions
- Large vector database (1M+ documents)
- Excellent response times (<500ms)
- Suitable for enterprise teams (50+ users)
- High availability support

**Resource Allocation:**

| Service | CPU | Memory | Replicas |
|---------|-----|--------|----------|
| n8n | 2.0 | 4 GB | 1* |
| Qdrant | 4.0 | 16 GB | 1-3 |
| mcp-standards | 0.5 | 512 MB | 2 |
| mcp-research | 1.0 | 2 GB | 2 |
| n8n-mcp | 1.0 | 1 GB | 2 |
| admin-fe | 0.5 | 256 MB | 2 |
| Load Balancer | 0.5 | 256 MB | 1 |
| **Total** | ~10 | ~24 GB | - |

*n8n requires external database for multi-instance

**Additional Components for Max Configuration:**
- External PostgreSQL for n8n (RDS/Cloud SQL)
- Redis for caching (optional)
- Prometheus + Grafana for monitoring
- Nginx/Traefik for load balancing

**Estimated Cost:**
- AWS: m6i.2xlarge + RDS ~$400/month
- Azure: D8s_v5 + Azure SQL ~$450/month
- GCP: n2-standard-8 + Cloud SQL ~$380/month

---

## Software Requirements

### Required
- Docker Engine 24.0+
- Docker Compose v2.20+
- OpenAI API Key (for embeddings)

### Optional
- Node.js 22+ (for local development)
- Git (for version control)
- curl/wget (for health checks)

---

## Network Requirements

### Inbound Ports

| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 5678 | n8n | HTTP | Internal/External |
| 3001 | Admin Dashboard | HTTP | Internal/External |
| 6333 | Qdrant HTTP | HTTP | Internal only |
| 6334 | Qdrant gRPC | gRPC | Internal only |
| 3000 | n8n-MCP | HTTP | Internal only |
| 3002 | MCP-Standards | HTTP | Internal only |
| 3003 | MCP-Research | HTTP | Internal only |

### Outbound Requirements
- HTTPS (443) to api.openai.com (embeddings)
- HTTPS (443) to ghcr.io (Docker images)
- HTTPS (443) to registry.npmjs.org (npm packages)

---

## Storage Requirements

### Persistent Volumes

| Volume | Purpose | Min Size | Recommended |
|--------|---------|----------|-------------|
| n8n_data | Workflows, credentials | 5 GB | 20 GB |
| qdrant_data | Vector embeddings | 10 GB | 100 GB |
| n8n_mcp_data | Node database | 1 GB | 5 GB |

### Storage Growth Estimation

| Content | Storage per 1000 docs |
|---------|----------------------|
| Vector embeddings | ~50 MB |
| Full-text index | ~20 MB |
| Document metadata | ~10 MB |
| **Total** | ~80 MB |

---

## Environment Variables

### Required

```env
OPENAI_API_KEY=sk-...          # OpenAI API key for embeddings
MCP_AUTH_TOKEN=...             # MCP server authentication
```

### Recommended

```env
N8N_API_KEY=...                # n8n API integration
N8N_BASIC_AUTH_ACTIVE=true     # Enable basic auth
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=...
```

### Optional

```env
LOG_LEVEL=info                 # debug, info, warn, error
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
QDRANT_COLLECTION=wpi_content
TIMEZONE=Europe/Berlin
```

---

## Monitoring & Health Checks

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| n8n | GET /healthz | 200 OK |
| Qdrant | GET / | 200 OK |
| mcp-standards | GET /health | `{"status":"healthy"}` |
| mcp-research | GET /health | `{"status":"healthy"}` |
| n8n-mcp | GET /health | 200 OK |
| admin-fe | GET / | 200 OK |

### Recommended Monitoring

- **Minimal:** Docker health checks (built-in)
- **Standard:** Uptime Kuma / Healthchecks.io
- **Maximum:** Prometheus + Grafana + AlertManager

---

## Backup Strategy

### Critical Data

| Data | Location | Backup Frequency |
|------|----------|------------------|
| n8n workflows | n8n_data volume | Daily |
| Qdrant vectors | qdrant_data volume | Weekly |
| .env configuration | Git (encrypted) | On change |
| Syllabus JSON | Git | On change |

### Backup Commands

```bash
# Backup all volumes
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/n8n-backup-YYYYMMDD.tar.gz -C /
```

---

## Security Checklist

- [ ] Change default MCP_AUTH_TOKEN
- [ ] Enable n8n basic authentication
- [ ] Configure firewall rules
- [ ] Use HTTPS in production (reverse proxy)
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Log rotation configured
- [ ] Non-root container users (default)

---

## Troubleshooting

### Common Issues

**1. mcp-research fails to start**
```
Error: OPENAI_API_KEY is required
```
→ Set OPENAI_API_KEY in .env

**2. Qdrant connection refused**
```
Error: SERVICE_UNAVAILABLE
```
→ Wait for Qdrant to start: `docker compose logs qdrant`

**3. n8n webhook not receiving**
→ Check WEBHOOK_URL in .env matches external URL

**4. High memory usage**
→ Reduce Qdrant memory limit or upgrade server

### Support

- n8n Documentation: https://docs.n8n.io
- Qdrant Documentation: https://qdrant.tech/documentation
- MCP Protocol: https://modelcontextprotocol.io

---

## Version Information

| Component | Version |
|-----------|---------|
| n8n | latest |
| Qdrant | latest |
| n8n-mcp | 2.33.2 |
| Node.js | 22 |
| Docker | 24.0+ |

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
