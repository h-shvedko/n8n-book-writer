"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const schemas_1 = require("./tools/schemas");
const handlers_1 = require("./tools/handlers");
const qdrant_service_1 = require("./services/qdrant-service");
(0, dotenv_1.config)();
const MCP_MODE = process.env.MCP_MODE || 'stdio';
const PORT = parseInt(process.env.PORT || '3003', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;
// Create MCP Server
const server = new index_js_1.Server({
    name: 'mcp-research',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Register tool list handler
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return { tools: schemas_1.TOOL_DEFINITIONS };
});
// Register tool call handler
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'hybrid_search':
            return await (0, handlers_1.handleHybridSearch)(args);
        case 'ingest_and_embed':
            return await (0, handlers_1.handleIngestAndEmbed)(args);
        case 'vector_search':
            return await (0, handlers_1.handleVectorSearch)(args);
        case 'delete_documents':
            return await (0, handlers_1.handleDeleteDocuments)(args);
        case 'get_collection_status':
            return await (0, handlers_1.handleGetStatus)(args);
        default:
            throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
});
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
// Start server based on mode
async function main() {
    // Try to initialize Qdrant
    await initializeQdrant();
    if (MCP_MODE === 'http') {
        // HTTP mode for n8n integration
        const app = (0, express_1.default)();
        app.use(express_1.default.json({ limit: '50mb' })); // Larger limit for document ingestion
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
                // Return 503 for connection errors
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
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`mcp-research server running in HTTP mode on port ${PORT}`);
        });
    }
    else {
        // STDIO mode for direct MCP communication
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error('mcp-research server running in STDIO mode');
    }
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map