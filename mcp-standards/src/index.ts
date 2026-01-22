import express, { Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';

import { TOOL_DEFINITIONS } from './tools/schemas';
import {
  handleGetSyllabusSection,
  handleValidateIsoCompliance,
  handleSearchSyllabus,
  handleGetAllDomains,
  handleLoadSyllabus,
  handleExportSyllabus,
  handleGetIsoRequirements,
  handleGetEditorialGuide,
  handleGetChapterTemplate,
} from './tools/handlers';
import { syllabusService } from './services/syllabus-service';

config();

const PORT = parseInt(process.env.PORT || '3002', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Load default syllabus if provided
const DEFAULT_SYLLABUS_PATH = process.env.DEFAULT_SYLLABUS_PATH;
if (DEFAULT_SYLLABUS_PATH) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    const syllabusData = JSON.parse(fs.readFileSync(DEFAULT_SYLLABUS_PATH, 'utf-8'));
    syllabusService.loadSyllabus(syllabusData);
    console.log(`Loaded default syllabus from ${DEFAULT_SYLLABUS_PATH}`);
  } catch (error) {
    console.warn(`Could not load default syllabus: ${error}`);
  }
}

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'mcp-standards', version: '1.0.0' });
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
      case 'get_syllabus_section':
        result = handleGetSyllabusSection(args);
        break;
      case 'validate_iso_compliance':
        result = handleValidateIsoCompliance(args);
        break;
      case 'search_syllabus':
        result = handleSearchSyllabus(args);
        break;
      case 'get_all_domains':
        result = handleGetAllDomains(args);
        break;
      case 'load_syllabus':
        result = handleLoadSyllabus(args);
        break;
      case 'export_syllabus':
        result = handleExportSyllabus(args);
        break;
      case 'get_iso_requirements':
        result = handleGetIsoRequirements(args);
        break;
      case 'get_editorial_guide':
        result = handleGetEditorialGuide();
        break;
      case 'get_chapter_template':
        result = handleGetChapterTemplate();
        break;
      default:
        res.status(404).json({ error: `Unknown tool: ${name}` });
        return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error handling tool call:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Syllabus management endpoints (for admin dashboard)
app.get('/syllabus', authMiddleware, (_req: Request, res: Response) => {
  try {
    const syllabus = syllabusService.getSyllabus();
    if (!syllabus) {
      res.status(404).json({ error: 'No syllabus loaded' });
      return;
    }
    res.json(syllabus);
  } catch {
    res.status(500).json({ error: 'Failed to get syllabus' });
  }
});

app.post('/syllabus', authMiddleware, (req: Request, res: Response) => {
  try {
    syllabusService.loadSyllabus(req.body);
    res.json({ success: true, message: 'Syllabus loaded successfully' });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Invalid syllabus data',
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`mcp-standards server running on port ${PORT}`);
});
