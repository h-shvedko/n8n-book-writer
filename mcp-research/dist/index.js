"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');
const dotenv_1 = require("dotenv");
const schemas_1 = require("./tools/schemas");
const handlers_1 = require("./tools/handlers");
const qdrant_service_1 = require("./services/qdrant-service");
const html_extractor_1 = require("./services/html-extractor");
const text_splitter_1 = require("./services/text-splitter");
const ingestion_db_1 = require("./services/ingestion-db");
(0, dotenv_1.config)();
const PORT = parseInt(process.env.PORT || '3003', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;
// Initialize Qdrant connection
async function initializeQdrant() {
    try {
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        await qdrant.initialize();
        console.log('Qdrant connection initialized');
    }
    catch (error) {
        console.warn(`Qdrant initialization warning: ${error}. Service will retry on first request.`);
    }
}
// Create Express app
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '50mb' }));
// Health check endpoint
app.get('/health', async (_req, res) => {
    try {
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        const status = await qdrant.getStatus();
        res.json({
            status: status.status === 'healthy' ? 'healthy' : 'degraded',
            service: 'mcp-research',
            version: '1.0.0',
            qdrant: status,
        });
    }
    catch {
        res.status(503).json({
            status: 'unavailable',
            service: 'mcp-research',
            error: 'SERVICE_UNAVAILABLE',
        });
    }
});
// Auth middleware
const authMiddleware = (req, res, next) => {
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
app.get('/tools', authMiddleware, (_req, res) => {
    res.json({ tools: schemas_1.TOOL_DEFINITIONS });
});
// MCP call endpoint
app.post('/call', authMiddleware, async (req, res) => {
    try {
        const { name, arguments: args } = req.body;
        let result;
        switch (name) {
            case 'hybrid_search':
                result = await (0, handlers_1.handleHybridSearch)(args);
                break;
            case 'ingest_and_embed':
                result = await (0, handlers_1.handleIngestAndEmbed)(args);
                break;
            case 'vector_search':
                result = await (0, handlers_1.handleVectorSearch)(args);
                break;
            case 'delete_documents':
                result = await (0, handlers_1.handleDeleteDocuments)(args);
                break;
            case 'get_collection_status':
                result = await (0, handlers_1.handleGetStatus)(args);
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
    }
    catch (error) {
        console.error('Error handling tool call:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ENOTFOUND') ||
            errorMessage.includes('ETIMEDOUT')) {
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
app.post('/ingest', authMiddleware, async (req, res) => {
    try {
        const result = await (0, handlers_1.handleIngestAndEmbed)(req.body);
        if (result.isError) {
            res.status(500).json(JSON.parse(result.content[0].text));
            return;
        }
        res.json(JSON.parse(result.content[0].text));
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
app.post('/search', authMiddleware, async (req, res) => {
    try {
        const result = await (0, handlers_1.handleHybridSearch)({ ...req.body, output_format: 'json' });
        if (result.isError) {
            res.status(500).json(JSON.parse(result.content[0].text));
            return;
        }
        res.json(JSON.parse(result.content[0].text));
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
app.get('/status', authMiddleware, async (_req, res) => {
    try {
        const result = await (0, handlers_1.handleGetStatus)({ output_format: 'json' });
        res.json(JSON.parse(result.content[0].text));
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'text/html',
            'text/plain',
            'text/markdown',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(html|htm|txt|md|pdf|docx)$/i)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    },
});
// HTML/File ingestion endpoint for admin dashboard
app.post('/admin/ingest-file', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const file = req.file;
        const { domainId, topicId, category, language, chunkSize, chunkOverlap } = req.body;
        if (!file) {
            res.status(400).json({ error: 'No file provided' });
            return;
        }
        const fileContent = file.buffer.toString('utf-8');
        const fileName = file.originalname;
        const isHtml = fileName.match(/\.(html|htm)$/i) || file.mimetype === 'text/html';
        let textToIngest;
        let extractedTitle = fileName;
        // Extract content based on file type
        if (isHtml) {
            const extracted = (0, html_extractor_1.extractForRAG)(fileContent);
            textToIngest = extracted.text;
            extractedTitle = extracted.metadata.title || fileName;
            console.log(`HTML extracted: ${extracted.metadata.wordCount} words, title: "${extractedTitle}"`);
        }
        else {
            textToIngest = fileContent;
        }
        // Chunk the content
        const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
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
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        let successCount = 0;
        let errorCount = 0;
        const BATCH_SIZE = 10; // Process 10 chunks in parallel
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async (chunk) => {
                const metadata = {
                    ...chunk.metadata,
                    tags: [...(chunk.metadata.tags || []), category || 'Legacy Material'].filter((v, idx, a) => a.indexOf(v) === idx),
                };
                return qdrant.ingestAndEmbed(chunk.text, metadata);
            }));
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    successCount++;
                }
                else {
                    errorCount++;
                    console.error(`Chunk ingestion error: ${result.reason}`);
                }
            }
            console.log(`Ingested ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
        }
        // Get updated status
        const status = await qdrant.getStatus();
        // Store file info in database
        const ingestionDb = (0, ingestion_db_1.getIngestionDb)();
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
    }
    catch (error) {
        console.error('File ingestion error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Raw HTML content ingestion endpoint
app.post('/admin/ingest-html', authMiddleware, async (req, res) => {
    try {
        const { htmlContent, fileName, domainId, topicId, category, language, chunkSize, chunkOverlap } = req.body;
        if (!htmlContent) {
            res.status(400).json({ error: 'No htmlContent provided' });
            return;
        }
        // Extract content using semantic extraction
        const extracted = (0, html_extractor_1.extractForRAG)(htmlContent);
        const extractedTitle = extracted.metadata.title || fileName || 'Untitled';
        console.log(`HTML extracted: ${extracted.metadata.wordCount} words, title: "${extractedTitle}"`);
        // Chunk the content
        const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
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
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        let successCount = 0;
        let errorCount = 0;
        const BATCH_SIZE = 10;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async (chunk) => {
                const metadata = {
                    ...chunk.metadata,
                    tags: [...(chunk.metadata.tags || []), category || 'Legacy Material'].filter((v, idx, a) => a.indexOf(v) === idx),
                };
                return qdrant.ingestAndEmbed(chunk.text, metadata);
            }));
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    successCount++;
                }
                else {
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
    }
    catch (error) {
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
app.get('/admin/ingested-files', authMiddleware, (req, res) => {
    try {
        const { limit, offset, category, status } = req.query;
        const ingestionDb = (0, ingestion_db_1.getIngestionDb)();
        const result = ingestionDb.listFiles({
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
            category: category,
            status: status,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error listing ingested files:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get single ingested file
app.get('/admin/ingested-files/:id', authMiddleware, (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const ingestionDb = (0, ingestion_db_1.getIngestionDb)();
        const file = ingestionDb.getFile(id);
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        res.json(file);
    }
    catch (error) {
        console.error('Error getting ingested file:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Delete ingested file record
app.delete('/admin/ingested-files/:id', authMiddleware, (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const ingestionDb = (0, ingestion_db_1.getIngestionDb)();
        const deleted = ingestionDb.deleteFile(id);
        if (!deleted) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        res.json({ success: true, message: 'File record deleted' });
    }
    catch (error) {
        console.error('Error deleting ingested file:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get ingestion stats
app.get('/admin/ingestion-stats', authMiddleware, (req, res) => {
    try {
        const ingestionDb = (0, ingestion_db_1.getIngestionDb)();
        const stats = ingestionDb.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting ingestion stats:', error);
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
//# sourceMappingURL=index.js.map