"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHybridSearch = handleHybridSearch;
exports.handleIngestAndEmbed = handleIngestAndEmbed;
exports.handleVectorSearch = handleVectorSearch;
exports.handleDeleteDocuments = handleDeleteDocuments;
exports.handleGetStatus = handleGetStatus;
const qdrant_service_1 = require("../services/qdrant-service");
const schemas_1 = require("./schemas");
// Service unavailable error code
const SERVICE_UNAVAILABLE_ERROR = 'SERVICE_UNAVAILABLE';
/**
 * Format error response for n8n workflow handling
 */
function createServiceUnavailableResponse(error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
        content: [{
                type: 'text',
                text: JSON.stringify({
                    error: SERVICE_UNAVAILABLE_ERROR,
                    message: `Qdrant service unavailable: ${errorMessage}`,
                    retryable: true,
                    suggested_action: 'pause_and_retry',
                }),
            }],
        isError: true,
    };
}
/**
 * Handle hybrid_search tool call
 */
async function handleHybridSearch(args) {
    try {
        const input = schemas_1.HybridSearchInputSchema.parse(args);
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        // Check service health first
        const status = await qdrant.getStatus();
        if (status.status === 'unavailable') {
            return createServiceUnavailableResponse(new Error(status.error || 'Qdrant unavailable'));
        }
        const results = await qdrant.hybridSearch(input.query, input.filter_metadata, input.limit, input.vector_weight, input.keyword_weight);
        if (input.output_format === 'markdown') {
            return {
                content: [{
                        type: 'text',
                        text: formatHybridResultsAsMarkdown(input.query, results),
                    }],
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        query: input.query,
                        results_count: results.length,
                        results,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        if (isConnectionError(error)) {
            return createServiceUnavailableResponse(error);
        }
        return {
            content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
            isError: true,
        };
    }
}
/**
 * Handle ingest_and_embed tool call
 */
async function handleIngestAndEmbed(args) {
    try {
        const input = schemas_1.IngestAndEmbedInputSchema.parse(args);
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        // Check service health first
        const status = await qdrant.getStatus();
        if (status.status === 'unavailable') {
            return createServiceUnavailableResponse(new Error(status.error || 'Qdrant unavailable'));
        }
        const result = await qdrant.ingestAndEmbed(input.text, {
            ...input.metadata,
            language: input.metadata.language || 'en',
        });
        if (input.output_format === 'markdown') {
            let md = `# Ingestion Complete\n\n`;
            md += `**Document ID:** ${result.document_id}\n`;
            md += `**Chunks Created:** ${result.chunks_created}\n`;
            md += `**Status:** ${result.success ? 'Success' : 'Failed'}\n\n`;
            md += `## Metadata\n\n`;
            md += '```json\n' + JSON.stringify(result.metadata, null, 2) + '\n```\n';
            return { content: [{ type: 'text', text: md }] };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                }],
        };
    }
    catch (error) {
        if (isConnectionError(error)) {
            return createServiceUnavailableResponse(error);
        }
        return {
            content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
            isError: true,
        };
    }
}
/**
 * Handle vector_search tool call
 */
async function handleVectorSearch(args) {
    try {
        const input = schemas_1.VectorSearchInputSchema.parse(args);
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        const status = await qdrant.getStatus();
        if (status.status === 'unavailable') {
            return createServiceUnavailableResponse(new Error(status.error || 'Qdrant unavailable'));
        }
        const results = await qdrant.vectorSearch(input.query, input.filter_metadata, input.limit);
        if (input.output_format === 'markdown') {
            return {
                content: [{
                        type: 'text',
                        text: formatSearchResultsAsMarkdown(input.query, results),
                    }],
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        query: input.query,
                        results_count: results.length,
                        results,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        if (isConnectionError(error)) {
            return createServiceUnavailableResponse(error);
        }
        return {
            content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
            isError: true,
        };
    }
}
/**
 * Handle delete_documents tool call
 */
async function handleDeleteDocuments(args) {
    try {
        const input = schemas_1.DeleteDocumentsInputSchema.parse(args);
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        const status = await qdrant.getStatus();
        if (status.status === 'unavailable') {
            return createServiceUnavailableResponse(new Error(status.error || 'Qdrant unavailable'));
        }
        const deletedCount = await qdrant.deleteByFilter(input.filter_metadata);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        deleted_count: deletedCount,
                        filter: input.filter_metadata,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        if (isConnectionError(error)) {
            return createServiceUnavailableResponse(error);
        }
        return {
            content: [{
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                }],
            isError: true,
        };
    }
}
/**
 * Handle get_collection_status tool call
 */
async function handleGetStatus(args) {
    try {
        const outputFormat = args?.output_format ?? 'json';
        const qdrant = (0, qdrant_service_1.getQdrantService)();
        const status = await qdrant.getStatus();
        if (outputFormat === 'markdown') {
            let md = `# Vector Database Status\n\n`;
            md += `| Property | Value |\n`;
            md += `|----------|-------|\n`;
            md += `| Status | ${status.status.toUpperCase()} |\n`;
            md += `| Qdrant Connected | ${status.qdrant_connected ? 'Yes' : 'No'} |\n`;
            md += `| Collection Exists | ${status.collection_exists ? 'Yes' : 'No'} |\n`;
            md += `| Document Count | ${status.document_count} |\n`;
            md += `| Last Check | ${status.last_check} |\n`;
            if (status.error) {
                md += `| Error | ${status.error} |\n`;
            }
            return { content: [{ type: 'text', text: md }] };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(status, null, 2),
                }],
        };
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: SERVICE_UNAVAILABLE_ERROR,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    }),
                }],
            isError: true,
        };
    }
}
/**
 * Check if error is a connection error
 */
function isConnectionError(error) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('econnrefused') ||
            message.includes('enotfound') ||
            message.includes('etimedout') ||
            message.includes('connection') ||
            message.includes('network') ||
            message.includes('unavailable'));
    }
    return false;
}
/**
 * Format hybrid search results as Markdown
 */
function formatHybridResultsAsMarkdown(query, results) {
    let md = `# Hybrid Search Results\n\n`;
    md += `**Query:** "${query}"\n`;
    md += `**Results Found:** ${results.length}\n\n`;
    if (results.length === 0) {
        md += `_No matching documents found._\n`;
        return md;
    }
    md += `---\n\n`;
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        md += `## Result ${i + 1}\n\n`;
        md += `**Score:** ${result.score.toFixed(4)} `;
        md += `(Vector: ${result.vector_score.toFixed(4)}, Keyword: ${result.keyword_score.toFixed(4)})\n\n`;
        if (result.metadata.title) {
            md += `**Title:** ${result.metadata.title}\n`;
        }
        if (result.metadata.source) {
            md += `**Source:** ${result.metadata.source}\n`;
        }
        if (result.metadata.domain_id) {
            md += `**Domain:** ${result.metadata.domain_id}\n`;
        }
        md += `\n> ${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}\n\n`;
        md += `---\n\n`;
    }
    return md;
}
/**
 * Format vector search results as Markdown
 */
function formatSearchResultsAsMarkdown(query, results) {
    let md = `# Vector Search Results\n\n`;
    md += `**Query:** "${query}"\n`;
    md += `**Results Found:** ${results.length}\n\n`;
    if (results.length === 0) {
        md += `_No matching documents found._\n`;
        return md;
    }
    md += `---\n\n`;
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        md += `## Result ${i + 1} (Score: ${result.score.toFixed(4)})\n\n`;
        if (result.metadata.title) {
            md += `**Title:** ${result.metadata.title}\n`;
        }
        if (result.metadata.source) {
            md += `**Source:** ${result.metadata.source}\n`;
        }
        md += `\n> ${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}\n\n`;
        md += `---\n\n`;
    }
    return md;
}
//# sourceMappingURL=handlers.js.map