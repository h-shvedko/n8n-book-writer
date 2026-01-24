"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const schemas_1 = require("./tools/schemas");
const handlers_1 = require("./tools/handlers");
const syllabus_service_1 = require("./services/syllabus-service");
(0, dotenv_1.config)();
const PORT = parseInt(process.env.PORT || '3002', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;
// Load default syllabus if provided
const DEFAULT_SYLLABUS_PATH = process.env.DEFAULT_SYLLABUS_PATH;
if (DEFAULT_SYLLABUS_PATH) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        const syllabusData = JSON.parse(fs.readFileSync(DEFAULT_SYLLABUS_PATH, 'utf-8'));
        syllabus_service_1.syllabusService.loadSyllabus(syllabusData);
        console.log(`Loaded default syllabus from ${DEFAULT_SYLLABUS_PATH}`);
    }
    catch (error) {
        console.warn(`Could not load default syllabus: ${error}`);
    }
}
// Create Express app
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
            case 'get_editorial_guide':
                result = (0, handlers_1.handleGetEditorialGuide)();
                break;
            case 'get_chapter_template':
                result = (0, handlers_1.handleGetChapterTemplate)();
                break;
            case 'get_masterprompt':
                result = (0, handlers_1.handleGetMasterPrompt)();
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
// List all available syllabuses (for form dropdown)
app.get('/syllabuses', authMiddleware, (_req, res) => {
    try {
        const syllabus = syllabus_service_1.syllabusService.getSyllabus();
        if (!syllabus) {
            res.json({ syllabuses: [] });
            return;
        }
        // Return list of available syllabuses with basic info
        res.json({
            syllabuses: [
                {
                    id: syllabus.id,
                    name: syllabus.name,
                    version: syllabus.version,
                    domain_count: syllabus.domains?.length || 0
                }
            ]
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to list syllabuses' });
    }
});
// Get full syllabus with domains (for chapter generation)
app.get('/syllabus', authMiddleware, (_req, res) => {
    try {
        const syllabus = syllabus_service_1.syllabusService.getSyllabus();
        if (!syllabus) {
            res.status(404).json({ error: 'No syllabus loaded' });
            return;
        }
        res.json(syllabus);
    }
    catch {
        res.status(500).json({ error: 'Failed to get syllabus' });
    }
});
// Get syllabus domains as chapters (for workflow)
app.get('/syllabus/domains', authMiddleware, (_req, res) => {
    try {
        const syllabus = syllabus_service_1.syllabusService.getSyllabus();
        if (!syllabus) {
            res.status(404).json({ error: 'No syllabus loaded' });
            return;
        }
        // Transform domains into chapter format
        const chapters = (syllabus.domains || []).map((domain, index) => {
            // Extract all learning objectives from all topics
            const learningObjectives = [];
            for (const topic of domain.topics || []) {
                for (const lo of topic.learningObjectives || []) {
                    learningObjectives.push({
                        id: lo.id,
                        description: lo.description,
                        bloomLevel: lo.bloomLevel,
                        keywords: lo.keywords,
                        topic_id: topic.id,
                        topic_title: topic.title
                    });
                }
            }
            return {
                chapter_number: index + 1,
                domain_id: domain.id,
                title: domain.name,
                description: domain.description,
                weight: domain.weight,
                topics: domain.topics || [],
                learning_objectives: learningObjectives,
                prerequisites: domain.prerequisites || []
            };
        });
        res.json({
            syllabus_id: syllabus.id,
            syllabus_name: syllabus.name,
            total_chapters: chapters.length,
            chapters: chapters
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get syllabus domains' });
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
// Chapter accumulator for workflow loops
// In-memory storage for processed chapters (per book_id)
const chapterAccumulator = new Map();
// Store a processed chapter
app.post('/chapters/:bookId', authMiddleware, (req, res) => {
    try {
        const { bookId } = req.params;
        const chapter = req.body;
        if (!chapterAccumulator.has(bookId)) {
            chapterAccumulator.set(bookId, []);
        }
        chapterAccumulator.get(bookId).push(chapter);
        console.log(`Stored chapter ${chapter.chapter_number || '?'} for book ${bookId}. Total: ${chapterAccumulator.get(bookId).length}`);
        res.json({
            success: true,
            chapter_count: chapterAccumulator.get(bookId).length,
            chapter_number: chapter.chapter_number
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to store chapter',
        });
    }
});
// Get all chapters for a book
app.get('/chapters/:bookId', authMiddleware, (req, res) => {
    try {
        const { bookId } = req.params;
        const chapters = chapterAccumulator.get(bookId) || [];
        console.log(`Retrieved ${chapters.length} chapters for book ${bookId}`);
        res.json({
            book_id: bookId,
            chapters: chapters,
            count: chapters.length
        });
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get chapters',
        });
    }
});
// Clear chapters for a book (call at start of workflow)
app.delete('/chapters/:bookId', authMiddleware, (req, res) => {
    try {
        const { bookId } = req.params;
        chapterAccumulator.delete(bookId);
        console.log(`Cleared chapters for book ${bookId}`);
        res.json({ success: true, message: `Cleared chapters for ${bookId}` });
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to clear chapters',
        });
    }
});
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`mcp-standards server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map