export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
/**
 * Handle hybrid_search tool call
 */
export declare function handleHybridSearch(args: unknown): Promise<ToolResult>;
/**
 * Handle ingest_and_embed tool call
 */
export declare function handleIngestAndEmbed(args: unknown): Promise<ToolResult>;
/**
 * Handle vector_search tool call
 */
export declare function handleVectorSearch(args: unknown): Promise<ToolResult>;
/**
 * Handle delete_documents tool call
 */
export declare function handleDeleteDocuments(args: unknown): Promise<ToolResult>;
/**
 * Handle get_collection_status tool call
 */
export declare function handleGetStatus(args: unknown): Promise<ToolResult>;
//# sourceMappingURL=handlers.d.ts.map