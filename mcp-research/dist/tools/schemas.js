"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DEFINITIONS = exports.GetStatusInputSchema = exports.DeleteDocumentsInputSchema = exports.VectorSearchInputSchema = exports.IngestAndEmbedInputSchema = exports.HybridSearchInputSchema = exports.IngestMetadataSchema = exports.FilterMetadataSchema = void 0;
const zod_1 = require("zod");
// Filter metadata schema for search
exports.FilterMetadataSchema = zod_1.z.object({
    source: zod_1.z.string().optional().describe('Filter by document source'),
    document_type: zod_1.z.string().optional().describe('Filter by document type (e.g., "pdf", "docx", "markdown")'),
    domain_id: zod_1.z.string().optional().describe('Filter by syllabus domain ID'),
    topic_id: zod_1.z.string().optional().describe('Filter by syllabus topic ID'),
    tags: zod_1.z.array(zod_1.z.string()).optional().describe('Filter by tags'),
});
// Metadata schema for ingestion
exports.IngestMetadataSchema = zod_1.z.object({
    source: zod_1.z.string().optional().describe('Document source identifier'),
    title: zod_1.z.string().optional().describe('Document title'),
    author: zod_1.z.string().optional().describe('Document author'),
    document_type: zod_1.z.string().optional().describe('Document type'),
    domain_id: zod_1.z.string().optional().describe('Related syllabus domain ID'),
    topic_id: zod_1.z.string().optional().describe('Related syllabus topic ID'),
    tags: zod_1.z.array(zod_1.z.string()).optional().describe('Document tags'),
    language: zod_1.z.string().default('en').describe('Document language'),
});
// Tool Input Schemas
exports.HybridSearchInputSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).describe('Search query text'),
    filter_metadata: exports.FilterMetadataSchema.optional().describe('Optional filter conditions'),
    limit: zod_1.z.number().min(1).max(100).default(10).describe('Maximum number of results to return'),
    vector_weight: zod_1.z.number().min(0).max(1).default(0.7).describe('Weight for vector similarity (0-1)'),
    keyword_weight: zod_1.z.number().min(0).max(1).default(0.3).describe('Weight for keyword matching (0-1)'),
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format'),
});
exports.IngestAndEmbedInputSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).describe('Text content to ingest and embed'),
    metadata: exports.IngestMetadataSchema.describe('Metadata for the document'),
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format'),
});
exports.VectorSearchInputSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).describe('Search query text'),
    filter_metadata: exports.FilterMetadataSchema.optional().describe('Optional filter conditions'),
    limit: zod_1.z.number().min(1).max(100).default(10).describe('Maximum number of results'),
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format'),
});
exports.DeleteDocumentsInputSchema = zod_1.z.object({
    filter_metadata: exports.FilterMetadataSchema.describe('Filter conditions for documents to delete'),
});
exports.GetStatusInputSchema = zod_1.z.object({
    output_format: zod_1.z.enum(['json', 'markdown']).default('json').describe('Output format'),
});
// Tool Definitions for MCP
exports.TOOL_DEFINITIONS = [
    {
        name: 'hybrid_search',
        description: 'Performs a hybrid search combining vector similarity and keyword matching. Returns the most relevant text chunks from the knowledge base.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query text',
                },
                filter_metadata: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: 'Filter by document source' },
                        document_type: { type: 'string', description: 'Filter by document type' },
                        domain_id: { type: 'string', description: 'Filter by syllabus domain ID' },
                        topic_id: { type: 'string', description: 'Filter by syllabus topic ID' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                    },
                    description: 'Optional filter conditions',
                },
                limit: {
                    type: 'number',
                    default: 10,
                    description: 'Maximum number of results (1-100)',
                },
                vector_weight: {
                    type: 'number',
                    default: 0.7,
                    description: 'Weight for vector similarity (0-1)',
                },
                keyword_weight: {
                    type: 'number',
                    default: 0.3,
                    description: 'Weight for keyword matching (0-1)',
                },
                output_format: {
                    type: 'string',
                    enum: ['json', 'markdown'],
                    default: 'json',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'ingest_and_embed',
        description: 'Chunks text using Recursive Character Splitting (chunk size 500, overlap 50), generates embeddings, and stores in the vector database. Use this to add new knowledge to the system.',
        inputSchema: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'Text content to ingest and embed',
                },
                metadata: {
                    type: 'object',
                    properties: {
                        source: { type: 'string', description: 'Document source identifier' },
                        title: { type: 'string', description: 'Document title' },
                        author: { type: 'string', description: 'Document author' },
                        document_type: { type: 'string', description: 'Document type' },
                        domain_id: { type: 'string', description: 'Related syllabus domain ID' },
                        topic_id: { type: 'string', description: 'Related syllabus topic ID' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'Document tags' },
                        language: { type: 'string', default: 'en', description: 'Document language' },
                    },
                    description: 'Metadata for the document',
                },
                output_format: {
                    type: 'string',
                    enum: ['json', 'markdown'],
                    default: 'json',
                },
            },
            required: ['text', 'metadata'],
        },
    },
    {
        name: 'vector_search',
        description: 'Performs pure vector similarity search without keyword matching. Useful for semantic search when exact keywords are not important.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query text',
                },
                filter_metadata: {
                    type: 'object',
                    properties: {
                        source: { type: 'string' },
                        document_type: { type: 'string' },
                        domain_id: { type: 'string' },
                        topic_id: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                    },
                },
                limit: {
                    type: 'number',
                    default: 10,
                },
                output_format: {
                    type: 'string',
                    enum: ['json', 'markdown'],
                    default: 'json',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'delete_documents',
        description: 'Delete documents from the vector database by filter criteria.',
        inputSchema: {
            type: 'object',
            properties: {
                filter_metadata: {
                    type: 'object',
                    properties: {
                        source: { type: 'string' },
                        document_type: { type: 'string' },
                        domain_id: { type: 'string' },
                        topic_id: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                    },
                    description: 'Filter conditions for documents to delete',
                },
            },
            required: ['filter_metadata'],
        },
    },
    {
        name: 'get_collection_status',
        description: 'Get the status of the vector database including connection status, document count, and health information.',
        inputSchema: {
            type: 'object',
            properties: {
                output_format: {
                    type: 'string',
                    enum: ['json', 'markdown'],
                    default: 'json',
                },
            },
        },
    },
];
//# sourceMappingURL=schemas.js.map