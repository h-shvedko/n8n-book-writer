import { z } from 'zod';

// Metadata schema for documents
export const DocumentMetadataSchema = z.object({
  source: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  created_at: z.string().optional(),
  document_type: z.string().optional(),
  domain_id: z.string().optional(),
  topic_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().default('en'),
  chunk_index: z.number().optional(),
  total_chunks: z.number().optional(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

// Search filter schema
export const SearchFilterSchema = z.object({
  source: z.string().optional(),
  document_type: z.string().optional(),
  domain_id: z.string().optional(),
  topic_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export type SearchFilter = z.infer<typeof SearchFilterSchema>;

// Search result
export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: DocumentMetadata;
}

// Hybrid search result with combined scores
export interface HybridSearchResult extends SearchResult {
  vector_score: number;
  keyword_score: number;
}

// Ingestion result
export interface IngestionResult {
  success: boolean;
  document_id: string;
  chunks_created: number;
  metadata: DocumentMetadata;
}

// Service status
export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unavailable';
  qdrant_connected: boolean;
  collection_exists: boolean;
  document_count: number;
  last_check: string;
  error?: string;
}

// Text chunk
export interface TextChunk {
  text: string;
  metadata: DocumentMetadata;
  start_index: number;
  end_index: number;
}
