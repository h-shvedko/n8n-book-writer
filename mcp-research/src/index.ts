import express, { Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';

import { TOOL_DEFINITIONS } from './tools/schemas';
import {
  handleHybridSearch,
  handleIngestAndEmbed,
  handleVectorSearch,
  handleDeleteDocuments,
  handleGetStatus,
} from './tools/handlers';
import { getQdrantService } from './services/qdrant-service';

config();

const PORT = parseInt(process.env.PORT || '3003', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Initialize Qdrant connection
async function initializeQdrant(): Promise<void> {
  try {
    const qdrant = getQdrantService();
    await qdrant.initialize();
    console.log('Qdrant connection initialized');
  } catch (error) {
    console.warn(`Qdrant initialization warning: ${error}. Service will retry on first request.`);
  }
}

// Create Express app
const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const qdrant = getQdrantService();
    const status = await qdrant.getStatus();

    res.json({
      status: status.status === 'healthy' ? 'healthy' : 'degraded',
      service: 'mcp-research',
      version: '1.0.0',
      qdrant: status,
    });
  } catch {
    res.status(503).json({
      status: 'unavailable',
      service: 'mcp-research',
      error: 'SERVICE_UNAVAILABLE',
    });
  }
});

// Auth middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (AUTH_TOKEN) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== AUTH_TOKEN) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }
  next();
};

// MCP tools endpoint
app.get('/tools', authMiddleware, (_req: Request, res: Response) => {
  res.json({ tools: TOOL_DEFINITIONS });
});

// MCP call endpoint
app.post('/call', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, arguments: args } = req.body;

    let result;
    switch (name) {
      case 'hybrid_search':
        result = await handleHybridSearch(args);
        break;
      case 'ingest_and_embed':
        result = await handleIngestAndEmbed(args);
        break;
      case 'vector_search':
        result = await handleVectorSearch(args);
        break;
      case 'delete_documents':
        result = await handleDeleteDocuments(args);
        break;
      case 'get_collection_status':
        result = await handleGetStatus(args);
        break;
      default:
        res.status(404).json({ error: `Unknown tool: ${name}` });
        return;
    }

    // Check if result indicates service unavailable
    if (result.isError) {
      const content = result.content[0]?.text;
      if (content && content.includes('SERVICE_UNAVAILABLE')) {
        res.status(503).json(JSON.parse(content));
        return;
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error handling tool call:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ETIMEDOUT')
    ) {
      res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: `Qdrant service unavailable: ${errorMessage}`,
        retryable: true,
        suggested_action: 'pause_and_retry',
      });
      return;
    }

    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Direct API endpoints for admin dashboard
app.post('/ingest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await handleIngestAndEmbed(req.body);
    if (result.isError) {
      res.status(500).json(JSON.parse(result.content[0].text));
      return;
    }
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await handleHybridSearch({ ...req.body, output_format: 'json' });
    if (result.isError) {
      res.status(500).json(JSON.parse(result.content[0].text));
      return;
    }
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/status', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await handleGetStatus({ output_format: 'json' });
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
async function main() {
  await initializeQdrant();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`mcp-research server running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
