"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantService = void 0;
exports.getQdrantService = getQdrantService;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const embedding_service_1 = require("./embedding-service");
const text_splitter_1 = require("./text-splitter");
const uuid_1 = require("uuid");
/**
 * Qdrant Vector Database Service
 */
class QdrantService {
    client;
    collectionName;
    isConnected = false;
    dimensions = 1536;
    constructor(config) {
        this.client = new js_client_rest_1.QdrantClient({
            url: config.url,
            apiKey: config.apiKey,
        });
        this.collectionName = config.collectionName;
    }
    /**
     * Initialize collection if it doesn't exist
     */
    async initialize() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some(c => c.name === this.collectionName);
            if (!exists) {
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: this.dimensions,
                        distance: 'Cosine',
                    },
                    optimizers_config: {
                        default_segment_number: 2,
                    },
                    replication_factor: 1,
                });
                // Create payload indexes for filtering
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: 'source',
                    field_schema: 'keyword',
                });
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: 'document_type',
                    field_schema: 'keyword',
                });
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: 'domain_id',
                    field_schema: 'keyword',
                });
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: 'topic_id',
                    field_schema: 'keyword',
                });
                // Full-text index for keyword search
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: 'text',
                    field_schema: {
                        type: 'text',
                        tokenizer: 'word',
                        min_token_len: 2,
                        max_token_len: 15,
                        lowercase: true,
                    },
                });
                console.log(`Created collection: ${this.collectionName}`);
            }
            this.isConnected = true;
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`Failed to initialize Qdrant: ${error}`);
        }
    }
    /**
     * Check service health
     */
    async getStatus() {
        try {
            const collections = await this.client.getCollections();
            const collectionExists = collections.collections.some(c => c.name === this.collectionName);
            let documentCount = 0;
            if (collectionExists) {
                const info = await this.client.getCollection(this.collectionName);
                documentCount = info.points_count || 0;
            }
            return {
                status: 'healthy',
                qdrant_connected: true,
                collection_exists: collectionExists,
                document_count: documentCount,
                last_check: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: 'unavailable',
                qdrant_connected: false,
                collection_exists: false,
                document_count: 0,
                last_check: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Ingest and embed text with chunking
     */
    async ingestAndEmbed(text, metadata) {
        if (!this.isConnected) {
            await this.initialize();
        }
        const embeddingService = (0, embedding_service_1.getEmbeddingService)();
        const splitter = (0, text_splitter_1.createWpiTextSplitter)();
        // Split text into chunks
        const chunks = splitter.splitText(text, metadata);
        if (chunks.length === 0) {
            throw new Error('No chunks generated from text');
        }
        // Generate embeddings for all chunks
        const texts = chunks.map(c => c.text);
        const embeddings = await embeddingService.embedBatch(texts);
        // Prepare points for Qdrant
        const documentId = (0, uuid_1.v4)();
        const points = chunks.map((chunk, index) => ({
            id: (0, uuid_1.v4)(),
            vector: embeddings[index],
            payload: {
                text: chunk.text,
                document_id: documentId,
                ...chunk.metadata,
                ingested_at: new Date().toISOString(),
            },
        }));
        // Upsert points to Qdrant
        await this.client.upsert(this.collectionName, {
            wait: true,
            points,
        });
        return {
            success: true,
            document_id: documentId,
            chunks_created: chunks.length,
            metadata: {
                ...metadata,
                total_chunks: chunks.length,
            },
        };
    }
    /**
     * Hybrid search combining vector similarity and keyword matching
     */
    async hybridSearch(query, filter, limit = 10, vectorWeight = 0.7, keywordWeight = 0.3) {
        if (!this.isConnected) {
            await this.initialize();
        }
        const embeddingService = (0, embedding_service_1.getEmbeddingService)();
        // Generate query embedding
        const queryEmbedding = await embeddingService.embed(query);
        // Build filter conditions
        const filterConditions = this.buildFilterConditions(filter);
        // Vector search
        const vectorResults = await this.client.search(this.collectionName, {
            vector: queryEmbedding,
            limit: limit * 2, // Get more results for merging
            filter: filterConditions,
            with_payload: true,
        });
        // Keyword search (full-text search on 'text' field)
        const keywordConditions = [
            {
                key: 'text',
                match: {
                    text: query,
                },
            },
        ];
        if (filterConditions?.must) {
            keywordConditions.push(...filterConditions.must);
        }
        const keywordResults = await this.client.scroll(this.collectionName, {
            filter: {
                must: keywordConditions,
            },
            limit: limit * 2,
            with_payload: true,
            with_vector: false,
        });
        // Merge and rank results
        const resultMap = new Map();
        // Process vector results
        for (const result of vectorResults) {
            const id = String(result.id);
            const payload = result.payload;
            resultMap.set(id, {
                id,
                text: String(payload.text || ''),
                score: 0,
                vector_score: result.score,
                keyword_score: 0,
                metadata: this.extractMetadata(payload),
            });
        }
        // Process keyword results
        const maxKeywordScore = keywordResults.points.length;
        for (let i = 0; i < keywordResults.points.length; i++) {
            const point = keywordResults.points[i];
            const id = String(point.id);
            const payload = point.payload;
            // Normalize keyword score (higher rank = higher score)
            const normalizedKeywordScore = (maxKeywordScore - i) / maxKeywordScore;
            if (resultMap.has(id)) {
                const existing = resultMap.get(id);
                existing.keyword_score = normalizedKeywordScore;
            }
            else {
                resultMap.set(id, {
                    id,
                    text: String(payload.text || ''),
                    score: 0,
                    vector_score: 0,
                    keyword_score: normalizedKeywordScore,
                    metadata: this.extractMetadata(payload),
                });
            }
        }
        // Calculate combined scores
        for (const result of resultMap.values()) {
            result.score =
                result.vector_score * vectorWeight +
                    result.keyword_score * keywordWeight;
        }
        // Sort by combined score and limit
        const sortedResults = Array.from(resultMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return sortedResults;
    }
    /**
     * Pure vector similarity search
     */
    async vectorSearch(query, filter, limit = 10) {
        if (!this.isConnected) {
            await this.initialize();
        }
        const embeddingService = (0, embedding_service_1.getEmbeddingService)();
        const queryEmbedding = await embeddingService.embed(query);
        const filterConditions = this.buildFilterConditions(filter);
        const results = await this.client.search(this.collectionName, {
            vector: queryEmbedding,
            limit,
            filter: filterConditions,
            with_payload: true,
        });
        return results.map(result => ({
            id: String(result.id),
            text: String(result.payload.text || ''),
            score: result.score,
            metadata: this.extractMetadata(result.payload),
        }));
    }
    /**
     * Build filter conditions for Qdrant queries
     */
    buildFilterConditions(filter) {
        if (!filter) {
            return undefined;
        }
        const conditions = [];
        if (filter.source) {
            conditions.push({ key: 'source', match: { value: filter.source } });
        }
        if (filter.document_type) {
            conditions.push({ key: 'document_type', match: { value: filter.document_type } });
        }
        if (filter.domain_id) {
            conditions.push({ key: 'domain_id', match: { value: filter.domain_id } });
        }
        if (filter.topic_id) {
            conditions.push({ key: 'topic_id', match: { value: filter.topic_id } });
        }
        if (filter.tags && filter.tags.length > 0) {
            for (const tag of filter.tags) {
                conditions.push({ key: 'tags', match: { value: tag } });
            }
        }
        if (conditions.length === 0) {
            return undefined;
        }
        return { must: conditions };
    }
    /**
     * Extract metadata from payload
     */
    extractMetadata(payload) {
        return {
            source: payload.source,
            title: payload.title,
            author: payload.author,
            created_at: payload.created_at,
            document_type: payload.document_type,
            domain_id: payload.domain_id,
            topic_id: payload.topic_id,
            tags: payload.tags,
            language: payload.language || 'en',
            chunk_index: payload.chunk_index,
            total_chunks: payload.total_chunks,
        };
    }
    /**
     * Delete documents by filter
     */
    async deleteByFilter(filter) {
        if (!this.isConnected) {
            await this.initialize();
        }
        const filterConditions = this.buildFilterConditions(filter);
        if (!filterConditions) {
            throw new Error('Filter is required for deletion');
        }
        const result = await this.client.delete(this.collectionName, {
            filter: filterConditions,
            wait: true,
        });
        return typeof result === 'object' && result !== null ? 1 : 0;
    }
    /**
     * Get collection stats
     */
    async getCollectionStats() {
        const info = await this.client.getCollection(this.collectionName);
        return {
            points_count: info.points_count || 0,
            indexed_vectors_count: info.indexed_vectors_count || 0,
        };
    }
}
exports.QdrantService = QdrantService;
// Singleton instance
let qdrantServiceInstance = null;
function getQdrantService() {
    if (!qdrantServiceInstance) {
        const url = process.env.QDRANT_URL || 'http://localhost:6333';
        const apiKey = process.env.QDRANT_API_KEY;
        const collectionName = process.env.QDRANT_COLLECTION || 'wpi_content';
        qdrantServiceInstance = new QdrantService({
            url,
            apiKey,
            collectionName,
        });
    }
    return qdrantServiceInstance;
}
//# sourceMappingURL=qdrant-service.js.map