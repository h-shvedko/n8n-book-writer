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
  handleGetMasterPrompt,
} from './tools/handlers';
import { syllabusService } from './services/syllabus-service';
import { getSyllabusDb } from './services/syllabus-db';

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
      case 'get_masterprompt':
        result = handleGetMasterPrompt();
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

// List all available syllabuses (summary)
app.get('/syllabuses', authMiddleware, (_req: Request, res: Response) => {
  try {
    const db = getSyllabusDb();
    const syllabuses = db.listSyllabuses();
    res.json({ syllabuses });
  } catch (error) {
    console.error('Error listing syllabuses:', error);
    res.status(500).json({ error: 'Failed to list syllabuses' });
  }
});

// Create a new syllabus
app.post('/syllabuses', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, certificationBody } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const db = getSyllabusDb();
    const syllabus = db.createSyllabus(name, certificationBody || 'Unknown');

    // Also load into in-memory service for MCP tools compatibility
    syllabusService.loadSyllabus(syllabus);

    res.json(syllabus);
  } catch (error) {
    console.error('Error creating syllabus:', error);
    res.status(500).json({ error: 'Failed to create syllabus' });
  }
});

// Duplicate a syllabus
app.post('/syllabuses/:id/duplicate', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name for the duplicate is required' });
      return;
    }

    const db = getSyllabusDb();
    const duplicate = db.duplicateSyllabus(id, name);

    if (!duplicate) {
      res.status(404).json({ error: 'Source syllabus not found' });
      return;
    }

    res.json(duplicate);
  } catch (error) {
    console.error('Error duplicating syllabus:', error);
    res.status(500).json({ error: 'Failed to duplicate syllabus' });
  }
});

// Get a specific syllabus by ID
app.get('/syllabuses/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getSyllabusDb();
    const syllabus = db.getSyllabus(id);

    if (!syllabus) {
      res.status(404).json({ error: 'Syllabus not found' });
      return;
    }

    res.json(syllabus);
  } catch (error) {
    console.error('Error getting syllabus:', error);
    res.status(500).json({ error: 'Failed to get syllabus' });
  }
});

// Update a syllabus
app.put('/syllabuses/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const syllabus = req.body;

    if (syllabus.id !== id) {
      res.status(400).json({ error: 'Syllabus ID mismatch' });
      return;
    }

    const db = getSyllabusDb();
    db.saveSyllabus(syllabus);

    // Also update in-memory service if this is the currently loaded syllabus
    const currentSyllabus = syllabusService.getSyllabus();
    if (currentSyllabus?.id === id) {
      syllabusService.loadSyllabus(syllabus);
    }

    res.json({ success: true, message: 'Syllabus updated successfully' });
  } catch (error) {
    console.error('Error updating syllabus:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Invalid syllabus data',
    });
  }
});

// Delete a syllabus
app.delete('/syllabuses/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getSyllabusDb();
    const deleted = db.deleteSyllabus(id);

    if (!deleted) {
      res.status(404).json({ error: 'Syllabus not found' });
      return;
    }

    res.json({ success: true, message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    res.status(500).json({ error: 'Failed to delete syllabus' });
  }
});

// Legacy endpoint: Get current in-memory syllabus (for backward compatibility)
app.get('/syllabus', authMiddleware, (_req: Request, res: Response) => {
  try {
    // First try in-memory service
    let syllabus = syllabusService.getSyllabus();

    // If not in memory, try to get from database
    if (!syllabus) {
      const db = getSyllabusDb();
      const syllabuses = db.listSyllabuses();
      if (syllabuses.length > 0) {
        syllabus = db.getSyllabus(syllabuses[0].id);
        if (syllabus) {
          syllabusService.loadSyllabus(syllabus);
        }
      }
    }

    if (!syllabus) {
      res.status(404).json({ error: 'No syllabus loaded' });
      return;
    }
    res.json(syllabus);
  } catch (error) {
    console.error('Error getting syllabus:', error);
    res.status(500).json({ error: 'Failed to get syllabus' });
  }
});

// Get syllabus domains as chapters (for workflow)
app.get('/syllabus/domains', authMiddleware, (_req: Request, res: Response) => {
  try {
    const syllabus = syllabusService.getSyllabus();
    if (!syllabus) {
      res.status(404).json({ error: 'No syllabus loaded' });
      return;
    }

    // Transform domains into chapter format
    const chapters = (syllabus.domains || []).map((domain, index: number) => {
      // Extract all learning objectives from all topics
      const learningObjectives: Array<Record<string, unknown>> = [];
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
  } catch (error) {
    console.error('Error getting syllabus domains:', error);
    res.status(500).json({ error: 'Failed to get syllabus domains' });
  }
});

// Legacy endpoint: Load syllabus into memory (for backward compatibility)
app.post('/syllabus', authMiddleware, (req: Request, res: Response) => {
  try {
    const syllabus = req.body;

    // Save to database
    const db = getSyllabusDb();
    db.saveSyllabus(syllabus);

    // Load into memory
    syllabusService.loadSyllabus(syllabus);

    res.json({ success: true, message: 'Syllabus loaded successfully' });
  } catch (error) {
    console.error('Error loading syllabus:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Invalid syllabus data',
    });
  }
});

// Load a specific syllabus into memory (for MCP tools)
app.post('/syllabuses/:id/activate', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getSyllabusDb();
    const syllabus = db.getSyllabus(id);

    if (!syllabus) {
      res.status(404).json({ error: 'Syllabus not found' });
      return;
    }

    syllabusService.loadSyllabus(syllabus);
    res.json({ success: true, message: 'Syllabus activated for MCP tools' });
  } catch (error) {
    console.error('Error activating syllabus:', error);
    res.status(500).json({ error: 'Failed to activate syllabus' });
  }
});

// Chapter accumulator for workflow loops
// In-memory storage for processed chapters (per book_id)
const chapterAccumulator: Map<string, Array<Record<string, unknown>>> = new Map();

// Store a processed chapter
app.post('/chapters/:bookId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const chapter = req.body;

    if (!chapterAccumulator.has(bookId)) {
      chapterAccumulator.set(bookId, []);
    }

    chapterAccumulator.get(bookId)!.push(chapter);
    console.log(`Stored chapter ${chapter.chapter_number || '?'} for book ${bookId}. Total: ${chapterAccumulator.get(bookId)!.length}`);

    res.json({
      success: true,
      chapter_count: chapterAccumulator.get(bookId)!.length,
      chapter_number: chapter.chapter_number
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to store chapter',
    });
  }
});

// Get all chapters for a book
app.get('/chapters/:bookId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const chapters = chapterAccumulator.get(bookId) || [];

    console.log(`Retrieved ${chapters.length} chapters for book ${bookId}`);

    res.json({
      book_id: bookId,
      chapters: chapters,
      count: chapters.length
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get chapters',
    });
  }
});

// Clear chapters for a book (call at start of workflow)
app.delete('/chapters/:bookId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    chapterAccumulator.delete(bookId);

    console.log(`Cleared chapters for book ${bookId}`);

    res.json({ success: true, message: `Cleared chapters for ${bookId}` });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to clear chapters',
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`mcp-standards server running on port ${PORT}`);
});
