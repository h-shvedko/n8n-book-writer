import { z } from 'zod';
export declare const DocumentMetadataSchema: z.ZodObject<{
    source: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    document_type: z.ZodOptional<z.ZodString>;
    domain_id: z.ZodOptional<z.ZodString>;
    topic_id: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodString>;
    chunk_index: z.ZodOptional<z.ZodNumber>;
    total_chunks: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    language: string;
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
    title?: string | undefined;
    author?: string | undefined;
    created_at?: string | undefined;
    chunk_index?: number | undefined;
    total_chunks?: number | undefined;
}, {
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
    title?: string | undefined;
    author?: string | undefined;
    language?: string | undefined;
    created_at?: string | undefined;
    chunk_index?: number | undefined;
    total_chunks?: number | undefined;
}>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export declare const SearchFilterSchema: z.ZodObject<{
    source: z.ZodOptional<z.ZodString>;
    document_type: z.ZodOptional<z.ZodString>;
    domain_id: z.ZodOptional<z.ZodString>;
    topic_id: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    source?: string | undefined;
    document_type?: string | undefined;
    domain_id?: string | undefined;
    topic_id?: string | undefined;
    tags?: string[] | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}>;
export type SearchFilter = z.infer<typeof SearchFilterSchema>;
export interface SearchResult {
    id: string;
    text: string;
    score: number;
    metadata: DocumentMetadata;
}
export interface HybridSearchResult extends SearchResult {
    vector_score: number;
    keyword_score: number;
}
export interface IngestionResult {
    success: boolean;
    document_id: string;
    chunks_created: number;
    metadata: DocumentMetadata;
}
export interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'unavailable';
    qdrant_connected: boolean;
    collection_exists: boolean;
    document_count: number;
    last_check: string;
    error?: string;
}
export interface TextChunk {
    text: string;
    metadata: DocumentMetadata;
    start_index: number;
    end_index: number;
}
//# sourceMappingURL=index.d.ts.map