"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DEFINITIONS = exports.GetRequirementsInputSchema = exports.LoadSyllabusInputSchema = exports.UpdateSyllabusSectionInputSchema = exports.SearchSyllabusInputSchema = exports.ValidateIsoComplianceInputSchema = exports.GetSyllabusSectionInputSchema = void 0;
const zod_1 = require("zod");
// Tool Input Schemas
exports.GetSyllabusSectionInputSchema = zod_1.z.object({
    domain_id: zod_1.z.string().describe('The domain ID to search for (e.g., "D1", "D1.1", "LO-001")'),
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format for the result'),
});
exports.ValidateIsoComplianceInputSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).describe('The content text to validate against ISO 17024 requirements'),
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format for the compliance report'),
});
exports.SearchSyllabusInputSchema = zod_1.z.object({
    keyword: zod_1.z.string().min(1).describe('Keyword to search for in the syllabus'),
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format for the result'),
});
exports.UpdateSyllabusSectionInputSchema = zod_1.z.object({
    domain_id: zod_1.z.string().describe('The domain ID to update'),
    domain_data: zod_1.z.string().describe('JSON string of the updated domain data'),
});
exports.LoadSyllabusInputSchema = zod_1.z.object({
    syllabus_json: zod_1.z.string().describe('JSON string containing the complete syllabus'),
});
exports.GetRequirementsInputSchema = zod_1.z.object({
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format for requirements list'),
});
// Tool Definitions for MCP
exports.TOOL_DEFINITIONS = [
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
];
//# sourceMappingURL=schemas.js.map