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
const syllabus_service_1 = require("./services/syllabus-service");
(0, dotenv_1.config)();
const MCP_MODE = process.env.MCP_MODE || 'stdio';
const PORT = parseInt(process.env.PORT || '3002', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;
// Load default syllabus if provided
const DEFAULT_SYLLABUS_PATH = process.env.DEFAULT_SYLLABUS_PATH;
if (DEFAULT_SYLLABUS_PATH) {
    try {
        const fs = require('fs');
        const syllabusData = JSON.parse(fs.readFileSync(DEFAULT_SYLLABUS_PATH, 'utf-8'));
        syllabus_service_1.syllabusService.loadSyllabus(syllabusData);
        console.log(`Loaded default syllabus from ${DEFAULT_SYLLABUS_PATH}`);
    }
    catch (error) {
        console.warn(`Could not load default syllabus: ${error}`);
    }
}
// Create MCP Server
const server = new index_js_1.Server({
    name: 'mcp-standards',
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
        case 'get_syllabus_section':
            return (0, handlers_1.handleGetSyllabusSection)(args);
        case 'validate_iso_compliance':
            return (0, handlers_1.handleValidateIsoCompliance)(args);
        case 'search_syllabus':
            return (0, handlers_1.handleSearchSyllabus)(args);
        case 'get_all_domains':
            return (0, handlers_1.handleGetAllDomains)(args);
        case 'load_syllabus':
            return (0, handlers_1.handleLoadSyllabus)(args);
        case 'export_syllabus':
            return (0, handlers_1.handleExportSyllabus)(args);
        case 'get_iso_requirements':
            return (0, handlers_1.handleGetIsoRequirements)(args);
        default:
            throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
});
// Start server based on mode
async function main() {
    if (MCP_MODE === 'http') {
        // HTTP mode for n8n integration
        const app = (0, express_1.default)();
        app.use(express_1.default.json({ limit: '10mb' }));
        // Health check endpoint
        app.get('/health', (_req, res) => {
            res.json({ status: 'healthy', service: 'mcp-standards', version: '1.0.0' });
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
                    case 'get_syllabus_section':
                        result = (0, handlers_1.handleGetSyllabusSection)(args);
                        break;
                    case 'validate_iso_compliance':
                        result = (0, handlers_1.handleValidateIsoCompliance)(args);
                        break;
                    case 'search_syllabus':
                        result = (0, handlers_1.handleSearchSyllabus)(args);
                        break;
                    case 'get_all_domains':
                        result = (0, handlers_1.handleGetAllDomains)(args);
                        break;
                    case 'load_syllabus':
                        result = (0, handlers_1.handleLoadSyllabus)(args);
                        break;
                    case 'export_syllabus':
                        result = (0, handlers_1.handleExportSyllabus)(args);
                        break;
                    case 'get_iso_requirements':
                        result = (0, handlers_1.handleGetIsoRequirements)(args);
                        break;
                    default:
                        res.status(404).json({ error: `Unknown tool: ${name}` });
                        return;
                }
                res.json(result);
            }
            catch (error) {
                console.error('Error handling tool call:', error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Internal server error',
                });
            }
        });
        // Syllabus management endpoints (for admin dashboard)
        app.get('/syllabus', authMiddleware, (_req, res) => {
            try {
                const syllabus = syllabus_service_1.syllabusService.getSyllabus();
                if (!syllabus) {
                    res.status(404).json({ error: 'No syllabus loaded' });
                    return;
                }
                res.json(syllabus);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get syllabus' });
            }
        });
        app.post('/syllabus', authMiddleware, (req, res) => {
            try {
                syllabus_service_1.syllabusService.loadSyllabus(req.body);
                res.json({ success: true, message: 'Syllabus loaded successfully' });
            }
            catch (error) {
                res.status(400).json({
                    error: error instanceof Error ? error.message : 'Invalid syllabus data',
                });
            }
        });
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`mcp-standards server running in HTTP mode on port ${PORT}`);
        });
    }
    else {
        // STDIO mode for direct MCP communication
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error('mcp-standards server running in STDIO mode');
    }
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map