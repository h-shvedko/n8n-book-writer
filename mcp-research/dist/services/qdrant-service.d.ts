import { DocumentMetadata, SearchFilter, SearchResult, HybridSearchResult, IngestionResult, ServiceStatus } from '../types';
export interface QdrantConfig {
    url: string;
    apiKey?: string;
    collectionName: string;
}
/**
 * Qdrant Vector Database Service
 */
export declare class QdrantService {
    private client;
    private collectionName;
    private isConnected;
    private dimensions;
    constructor(config: QdrantConfig);
    /**
     * Initialize collection if it doesn't exist
     */
    initialize(): Promise<void>;
    /**
     * Check service health
     */
    getStatus(): Promise<ServiceStatus>;
    /**
     * Ingest and embed text with chunking
     */
    ingestAndEmbed(text: string, metadata: DocumentMetadata): Promise<IngestionResult>;
    /**
     * Hybrid search combining vector similarity and keyword matching
     */
    hybridSearch(query: string, filter?: SearchFilter, limit?: number, vectorWeight?: number, keywordWeight?: number): Promise<HybridSearchResult[]>;
    /**
     * Pure vector similarity search
     */
    vectorSearch(query: string, filter?: SearchFilter, limit?: number): Promise<SearchResult[]>;
    /**
     * Build filter conditions for Qdrant queries
     */
    private buildFilterConditions;
    /**
     * Extract metadata from payload
     */
    private extractMetadata;
    /**
     * Delete documents by filter
     */
    deleteByFilter(filter: SearchFilter): Promise<number>;
    /**
     * Get collection stats
     */
    getCollectionStats(): Promise<{
        points_count: number;
        indexed_vectors_count: number;
    }>;
}
export declare function getQdrantService(): QdrantService;
//# sourceMappingURL=qdrant-service.d.ts.map