import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';

import {
  validateCodeSnippet,
  generateTangibleExample,
  testRegexPattern,
  toolDefinitions,
  ValidateCodeSnippetInput,
  GenerateTangibleExampleInput,
  TestRegexPatternInput
} from './tools/index.js';

const MCP_MODE = process.env.MCP_MODE || 'stdio';
const PORT = parseInt(process.env.PORT || '3004', 10);
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// ============================================
// MCP Server Setup
// ============================================

const server = new Server(
  {
    name: 'mcp-coder',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'validate_code_snippet': {
        const input = ValidateCodeSnippetInput.parse(args);
        const result = await validateCodeSnippet(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'generate_tangible_example': {
        const input = GenerateTangibleExampleInput.parse(args);
        const result = await generateTangibleExample(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'test_regex_pattern': {
        const input = TestRegexPatternInput.parse(args);
        const result = await testRegexPattern(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const err = error as Error;

    // Return helpful error messages for self-correction
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            tool: name,
            message: err.message,
            suggestion: getSuggestionForError(name, err)
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Generate helpful suggestions based on error type
function getSuggestionForError(tool: string, error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('required')) {
    return 'Please ensure all required parameters are provided.';
  }

  if (message.includes('invalid') || message.includes('parse')) {
    return 'Check the parameter types and format. Refer to the tool schema for valid values.';
  }

  if (tool === 'validate_code_snippet') {
    if (message.includes('language')) {
      return 'Valid languages: javascript, typescript, html, css, json, markdown';
    }
    return 'Ensure the code parameter is a valid string and language is one of the supported types.';
  }

  if (tool === 'generate_tangible_example') {
    if (message.includes('topic')) {
      return 'Use a valid topic like "json-ld-product", "fetch-api", "regex-email", etc. Or use "custom" with custom_topic parameter.';
    }
    return 'Check the topic parameter against the list of available topics.';
  }

  if (tool === 'test_regex_pattern') {
    if (message.includes('regex') || message.includes('pattern')) {
      return 'The regex pattern may have syntax errors. Check for unescaped special characters.';
    }
    return 'Ensure the pattern is a valid regex string and test_string is provided.';
  }

  return 'Please verify your input parameters and try again.';
}

// ============================================
// HTTP Server for n8n Integration
// ============================================

function createHttpServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Authentication middleware
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!AUTH_TOKEN) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token !== AUTH_TOKEN) {
      return res.status(403).json({ error: 'Invalid authentication token' });
    }

    next();
  };

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'mcp-coder',
      version: '1.0.0',
      tools: toolDefinitions.map(t => t.name)
    });
  });

  // List tools endpoint
  app.get('/tools', authMiddleware, (_req, res) => {
    res.json({ tools: toolDefinitions });
  });

  // Call tool endpoint (MCP-compatible)
  app.post('/call', authMiddleware, async (req, res) => {
    const { name, arguments: args } = req.body;

    if (!name) {
      return res.status(400).json({
        error: true,
        message: 'Tool name is required'
      });
    }

    try {
      let result;

      switch (name) {
        case 'validate_code_snippet': {
          const input = ValidateCodeSnippetInput.parse(args);
          result = await validateCodeSnippet(input);
          break;
        }

        case 'generate_tangible_example': {
          const input = GenerateTangibleExampleInput.parse(args);
          result = await generateTangibleExample(input);
          break;
        }

        case 'test_regex_pattern': {
          const input = TestRegexPatternInput.parse(args);
          result = await testRegexPattern(input);
          break;
        }

        default:
          return res.status(400).json({
            error: true,
            message: `Unknown tool: ${name}`,
            available_tools: toolDefinitions.map(t => t.name)
          });
      }

      // Return in MCP-compatible format
      res.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      });

    } catch (error) {
      const err = error as Error;

      res.status(400).json({
        error: true,
        tool: name,
        message: err.message,
        suggestion: getSuggestionForError(name, err)
      });
    }
  });

  // Direct tool endpoints for convenience
  app.post('/validate', authMiddleware, async (req, res) => {
    try {
      const input = ValidateCodeSnippetInput.parse(req.body);
      const result = await validateCodeSnippet(input);
      res.json(result);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({
        error: true,
        message: err.message,
        suggestion: getSuggestionForError('validate_code_snippet', err)
      });
    }
  });

  app.post('/generate', authMiddleware, async (req, res) => {
    try {
      const input = GenerateTangibleExampleInput.parse(req.body);
      const result = await generateTangibleExample(input);
      res.json(result);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({
        error: true,
        message: err.message,
        suggestion: getSuggestionForError('generate_tangible_example', err)
      });
    }
  });

  app.post('/regex', authMiddleware, async (req, res) => {
    try {
      const input = TestRegexPatternInput.parse(req.body);
      const result = await testRegexPattern(input);
      res.json(result);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({
        error: true,
        message: err.message,
        suggestion: getSuggestionForError('test_regex_pattern', err)
      });
    }
  });

  return app;
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
  console.log(`Starting MCP Coder Server in ${MCP_MODE} mode...`);

  if (MCP_MODE === 'http') {
    const app = createHttpServer();

    app.listen(PORT, () => {
      console.log(`MCP Coder HTTP server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Tools endpoint: http://localhost:${PORT}/tools`);
      console.log(`Call endpoint: http://localhost:${PORT}/call`);
      if (AUTH_TOKEN) {
        console.log('Authentication: ENABLED');
      } else {
        console.log('Authentication: DISABLED (set AUTH_TOKEN to enable)');
      }
    });

  } else {
    // STDIO mode for direct MCP communication
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Coder Server running on STDIO');
  }
}

main().catch((error) => {
  console.error('Failed to start MCP Coder Server:', error);
  process.exit(1);
});
