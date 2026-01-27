import express, { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');
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
import { extractForRAG } from './services/html-extractor';
import { RecursiveCharacterTextSplitter } from './services/text-splitter';
import { getIngestionDb } from './services/ingestion-db';

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req: unknown, file: { mimetype: string; originalname: string }, cb: (error: Error | null, acceptFile?: boolean) => void) => {
    const allowedTypes = [
      'text/html',
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(html|htm|txt|md|pdf|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// HTML/File ingestion endpoint for admin dashboard
app.post('/admin/ingest-file', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (req as any).file as { buffer: Buffer; originalname: string; mimetype: string } | undefined;
    const { domainId, topicId, category, language, chunkSize, chunkOverlap } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const fileContent = file.buffer.toString('utf-8');
    const fileName = file.originalname;
    const isHtml = fileName.match(/\.(html|htm)$/i) || file.mimetype === 'text/html';

    let textToIngest: string;
    let extractedTitle: string = fileName;

    // Extract content based on file type
    if (isHtml) {
      const extracted = extractForRAG(fileContent);
      textToIngest = extracted.text;
      extractedTitle = extracted.metadata.title || fileName;
      console.log(`HTML extracted: ${extracted.metadata.wordCount} words, title: "${extractedTitle}"`);
    } else {
      textToIngest = fileContent;
    }

    // Chunk the content
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(chunkSize, 10) || 2000,
      chunkOverlap: parseInt(chunkOverlap, 10) || 300,
    });

    const baseMetadata = {
      source: fileName,
      title: extractedTitle,
      document_type: isHtml ? 'html' : (fileName.split('.').pop() || 'text'),
      domain_id: domainId || undefined,
      topic_id: topicId || undefined,
      tags: category ? [category] : [],
      language: language || 'de',
    };

    const chunks = splitter.splitText(textToIngest, baseMetadata);
    console.log(`Created ${chunks.length} chunks from ${fileName}`);

    // Ingest chunks into Qdrant in parallel batches for speed
    const qdrant = getQdrantService();
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 10; // Process 10 chunks in parallel

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (chunk) => {
          const metadata = {
            ...chunk.metadata,
            tags: [...(chunk.metadata.tags || []), category || 'Legacy Material'].filter((v, idx, a) => a.indexOf(v) === idx),
          };
          return qdrant.ingestAndEmbed(chunk.text, metadata);
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          console.error(`Chunk ingestion error: ${result.reason}`);
        }
      }

      console.log(`Ingested ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
    }

    // Get updated status
    const status = await qdrant.getStatus();

    // Store file info in database
    const ingestionDb = getIngestionDb();
    const fileRecord = ingestionDb.addFile({
      fileName,
      title: extractedTitle,
      fileSize: file.buffer.length,
      fileType: isHtml ? 'html' : (fileName.split('.').pop() || 'text'),
      chunksCreated: chunks.length,
      chunksIngested: successCount,
      chunksErrored: errorCount,
      domainId: domainId || undefined,
      topicId: topicId || undefined,
      category: category || undefined,
      language: language || 'de',
    });

    res.json({
      success: true,
      id: fileRecord.id,
      fileName,
      title: extractedTitle,
      format: isHtml ? 'html' : 'text',
      chunksCreated: chunks.length,
      chunksIngested: successCount,
      chunksErrored: errorCount,
      metadata: baseMetadata,
      qdrantStatus: {
        status: status.status,
        documentCount: status.document_count,
      },
    });
  } catch (error) {
    console.error('File ingestion error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Raw HTML content ingestion endpoint
app.post('/admin/ingest-html', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { htmlContent, fileName, domainId, topicId, category, language, chunkSize, chunkOverlap } = req.body;

    if (!htmlContent) {
      res.status(400).json({ error: 'No htmlContent provided' });
      return;
    }

    // Extract content using semantic extraction
    const extracted = extractForRAG(htmlContent);
    const extractedTitle = extracted.metadata.title || fileName || 'Untitled';

    console.log(`HTML extracted: ${extracted.metadata.wordCount} words, title: "${extractedTitle}"`);

    // Chunk the content
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(chunkSize, 10) || 2000,
      chunkOverlap: parseInt(chunkOverlap, 10) || 300,
    });

    const baseMetadata = {
      source: fileName || 'html-content',
      title: extractedTitle,
      document_type: 'html',
      domain_id: domainId || undefined,
      topic_id: topicId || undefined,
      tags: category ? [category] : [],
      language: language || 'de',
    };

    const chunks = splitter.splitText(extracted.text, baseMetadata);
    console.log(`Created ${chunks.length} chunks`);

    // Ingest chunks into Qdrant in parallel batches for speed
    const qdrant = getQdrantService();
    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (chunk) => {
          const metadata = {
            ...chunk.metadata,
            tags: [...(chunk.metadata.tags || []), category || 'Legacy Material'].filter((v, idx, a) => a.indexOf(v) === idx),
          };
          return qdrant.ingestAndEmbed(chunk.text, metadata);
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          console.error(`Chunk ingestion error: ${result.reason}`);
        }
      }

      console.log(`Ingested ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
    }

    // Get updated status
    const status = await qdrant.getStatus();

    res.json({
      success: true,
      title: extractedTitle,
      wordCount: extracted.metadata.wordCount,
      chunksCreated: chunks.length,
      chunksIngested: successCount,
      chunksErrored: errorCount,
      metadata: baseMetadata,
      qdrantStatus: {
        status: status.status,
        documentCount: status.document_count,
      },
    });
  } catch (error) {
    console.error('HTML ingestion error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// Ingested Files Management Endpoints
// ============================================

// List ingested files
app.get('/admin/ingested-files', authMiddleware, (req: Request, res: Response) => {
  try {
    const { limit, offset, category, status } = req.query;
    const ingestionDb = getIngestionDb();
    const result = ingestionDb.listFiles({
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
      category: category as string | undefined,
      status: status as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Error listing ingested files:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get single ingested file
app.get('/admin/ingested-files/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ingestionDb = getIngestionDb();
    const file = ingestionDb.getFile(id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json(file);
  } catch (error) {
    console.error('Error getting ingested file:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete ingested file record
app.delete('/admin/ingested-files/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ingestionDb = getIngestionDb();
    const deleted = ingestionDb.deleteFile(id);
    if (!deleted) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json({ success: true, message: 'File record deleted' });
  } catch (error) {
    console.error('Error deleting ingested file:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get ingestion stats
app.get('/admin/ingestion-stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const ingestionDb = getIngestionDb();
    const stats = ingestionDb.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting ingestion stats:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// Vector DB Document Management Endpoints
// ============================================

// Browse/list documents in vector DB
app.get('/admin/documents', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { limit, offset, source, document_type, domain_id } = req.query;
    const qdrant = getQdrantService();

    const filter: { source?: string; document_type?: string; domain_id?: string } = {};
    if (source) filter.source = source as string;
    if (document_type) filter.document_type = document_type as string;
    if (domain_id) filter.domain_id = domain_id as string;

    const result = await qdrant.browseDocuments({
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset as string | null,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('Error browsing documents:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get single document by ID
app.get('/admin/documents/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const qdrant = getQdrantService();

    const document = await qdrant.getDocument(id);
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete single document by ID
app.delete('/admin/documents/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const qdrant = getQdrantService();

    const deleted = await qdrant.deleteDocument(id);
    if (!deleted) {
      res.status(404).json({ error: 'Document not found or delete failed' });
      return;
    }

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete all documents by source (file name)
app.delete('/admin/documents/by-source/:source', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { source } = req.params;
    const qdrant = getQdrantService();

    const deletedCount = await qdrant.deleteBySource(decodeURIComponent(source));

    res.json({
      success: true,
      message: `Deleted ${deletedCount} documents`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting documents by source:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get source statistics (unique sources with document counts)
app.get('/admin/source-stats', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const qdrant = getQdrantService();
    const stats = await qdrant.getSourceStats();
    res.json({ sources: stats });
  } catch (error) {
    console.error('Error getting source stats:', error);
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
