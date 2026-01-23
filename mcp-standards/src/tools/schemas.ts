import { z } from 'zod';

// Tool Input Schemas
export const GetSyllabusSectionInputSchema = z.object({
  domain_id: z.string().describe('The domain ID to search for (e.g., "D1", "D1.1", "LO-001")'),
  output_format: z.enum(['json', 'markdown']).default('json').describe('Output format for the result'),
});

export const ValidateIsoComplianceInputSchema = z.object({
  content: z.string().min(1).describe('The content text to validate against ISO 17024 requirements'),
  output_format: z.enum(['json', 'markdown']).default('json').describe('Output format for the compliance report'),
});

export const SearchSyllabusInputSchema = z.object({
  keyword: z.string().min(1).describe('Keyword to search for in the syllabus'),
  output_format: z.enum(['json', 'markdown']).default('json').describe('Output format for the result'),
});

export const UpdateSyllabusSectionInputSchema = z.object({
  domain_id: z.string().describe('The domain ID to update'),
  domain_data: z.string().describe('JSON string of the updated domain data'),
});

export const LoadSyllabusInputSchema = z.object({
  syllabus_json: z.string().describe('JSON string containing the complete syllabus'),
});

export const GetRequirementsInputSchema = z.object({
  output_format: z.enum(['json', 'markdown']).default('json').describe('Output format for requirements list'),
});

// Tool Definitions for MCP
export const TOOL_DEFINITIONS = [
  {
    name: 'get_syllabus_section',
    description: 'Performs a deep search in a structured JSON syllabus to find domains, topics, or learning objectives by ID. Returns the matching section with full context path.',
    inputSchema: {
      type: 'object',
      properties: {
        domain_id: {
          type: 'string',
          description: 'The domain ID to search for (e.g., "D1", "D1.1", "LO-001")',
        },
        output_format: {
          type: 'string',
          enum: ['json', 'markdown'],
          default: 'json',
          description: 'Output format for the result',
        },
      },
      required: ['domain_id'],
    },
  },
  {
    name: 'validate_iso_compliance',
    description: 'Validates educational content against ISO 17024 certification requirements. Returns a detailed checklist with pass/fail status, findings, and recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content text to validate against ISO 17024 requirements',
        },
        output_format: {
          type: 'string',
          enum: ['json', 'markdown'],
          default: 'json',
          description: 'Output format for the compliance report',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'search_syllabus',
    description: 'Search the syllabus by keyword. Searches through domain names, descriptions, topic titles, and learning objectives.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to search for in the syllabus',
        },
        output_format: {
          type: 'string',
          enum: ['json', 'markdown'],
          default: 'json',
          description: 'Output format for the result',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_all_domains',
    description: 'Returns all domains in the syllabus with their weights and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        output_format: {
          type: 'string',
          enum: ['json', 'markdown'],
          default: 'json',
          description: 'Output format for the result',
        },
      },
    },
  },
  {
    name: 'load_syllabus',
    description: 'Load a new syllabus from JSON. Use this to initialize or replace the current syllabus.',
    inputSchema: {
      type: 'object',
      properties: {
        syllabus_json: {
          type: 'string',
          description: 'JSON string containing the complete syllabus',
        },
      },
      required: ['syllabus_json'],
    },
  },
  {
    name: 'export_syllabus',
    description: 'Export the current syllabus in JSON or Markdown format.',
    inputSchema: {
      type: 'object',
      properties: {
        output_format: {
          type: 'string',
          enum: ['json', 'markdown'],
          default: 'json',
          description: 'Output format for the syllabus',
        },
      },
    },
  },
  {
    name: 'get_iso_requirements',
    description: 'Returns the list of ISO 17024 requirements used for compliance validation.',
    inputSchema: {
      type: 'object',
      properties: {
        output_format: {
          type: 'string',
          enum: ['json', 'markdown'],
          default: 'json',
          description: 'Output format for requirements list',
        },
      },
    },
  },
  {
    name: 'get_editorial_guide',
    description: 'Returns the WPI Editorial Guide (Styleguide 2.9) containing tone of voice, structure templates, and content quality guidelines for technical authoring.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_chapter_template',
    description: 'Returns the "One-Shot" chapter template (Kapitel 1 example) demonstrating ideal structure, tone, code examples, and ISO alignment. Use this as a reference when generating new chapters.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_masterprompt',
    description: 'Returns the Master Prompt v4.4 (WPI Course Generator) - the comprehensive system prompt for the WPI Technical Architect role. Contains all rules for chapter generation: target audience, source priorities, editorial rules (3000-3500 words, workload calculation), Bloom levels K1-K6, HTML output structure, Zero-to-Hero flow, and Anti-Circular definitions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Type exports
export type GetSyllabusSectionInput = z.infer<typeof GetSyllabusSectionInputSchema>;
export type ValidateIsoComplianceInput = z.infer<typeof ValidateIsoComplianceInputSchema>;
export type SearchSyllabusInput = z.infer<typeof SearchSyllabusInputSchema>;
export type UpdateSyllabusSectionInput = z.infer<typeof UpdateSyllabusSectionInputSchema>;
export type LoadSyllabusInput = z.infer<typeof LoadSyllabusInputSchema>;
