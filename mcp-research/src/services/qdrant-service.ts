import { QdrantClient, Schemas } from '@qdrant/js-client-rest';
import {
  DocumentMetadata,
  SearchFilter,
  SearchResult,
  HybridSearchResult,
  IngestionResult,
  ServiceStatus,
} from '../types';
import { getEmbeddingService } from './embedding-service';
import { createWpiTextSplitter } from './text-splitter';
import { v4 as uuidv4 } from 'uuid';

type Filter = Schemas['Filter'];

export interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
}

/**
 * Qdrant Vector Database Service
 */
export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;
  private isConnected: boolean = false;
  private dimensions: number = 1536;

  constructor(config: QdrantConfig) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey,
    });
    this.collectionName = config.collectionName;
  }

  /**
   * Initialize collection if it doesn't exist
   */
  async initialize(): Promise<void> {
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
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to initialize Qdrant: ${error}`);
    }
  }

  /**
   * Check service health
   */
  async getStatus(): Promise<ServiceStatus> {
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
    } catch (error) {
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
  async ingestAndEmbed(text: string, metadata: DocumentMetadata): Promise<IngestionResult> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const embeddingService = getEmbeddingService();
    const splitter = createWpiTextSplitter();

    // Split text into chunks
    const chunks = splitter.splitText(text, metadata);

    if (chunks.length === 0) {
      throw new Error('No chunks generated from text');
    }

    // Generate embeddings for all chunks
    const texts = chunks.map(c => c.text);
    const embeddings = await embeddingService.embedBatch(texts);

    // Prepare points for Qdrant
    const documentId = uuidv4();
    const points = chunks.map((chunk, index) => ({
      id: uuidv4(),
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
  async hybridSearch(
    query: string,
    filter?: SearchFilter,
    limit: number = 10,
    vectorWeight: number = 0.7,
    keywordWeight: number = 0.3
  ): Promise<HybridSearchResult[]> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const embeddingService = getEmbeddingService();

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
    const keywordConditions: Schemas['Condition'][] = [
      {
        key: 'text',
        match: {
          text: query,
        },
      },
    ];

    if (filterConditions?.must) {
      keywordConditions.push(...(filterConditions.must as Schemas['Condition'][]));
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
    const resultMap = new Map<string, HybridSearchResult>();

    // Process vector results
    for (const result of vectorResults) {
      const id = String(result.id);
      const payload = result.payload as Record<string, unknown>;

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
      const payload = point.payload as Record<string, unknown>;

      // Normalize keyword score (higher rank = higher score)
      const normalizedKeywordScore = (maxKeywordScore - i) / maxKeywordScore;

      if (resultMap.has(id)) {
        const existing = resultMap.get(id)!;
        existing.keyword_score = normalizedKeywordScore;
      } else {
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
  async vectorSearch(
    query: string,
    filter?: SearchFilter,
    limit: number = 10
  ): Promise<SearchResult[]> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const embeddingService = getEmbeddingService();
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
      text: String((result.payload as Record<string, unknown>).text || ''),
      score: result.score,
      metadata: this.extractMetadata(result.payload as Record<string, unknown>),
    }));
  }

  /**
   * Build filter conditions for Qdrant queries
   */
  private buildFilterConditions(filter?: SearchFilter): Filter | undefined {
    if (!filter) {
      return undefined;
    }

    const conditions: Schemas['Condition'][] = [];

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
  private extractMetadata(payload: Record<string, unknown>): DocumentMetadata {
    return {
      source: payload.source as string | undefined,
      title: payload.title as string | undefined,
      author: payload.author as string | undefined,
      created_at: payload.created_at as string | undefined,
      document_type: payload.document_type as string | undefined,
      domain_id: payload.domain_id as string | undefined,
      topic_id: payload.topic_id as string | undefined,
      tags: payload.tags as string[] | undefined,
      language: (payload.language as string) || 'en',
      chunk_index: payload.chunk_index as number | undefined,
      total_chunks: payload.total_chunks as number | undefined,
    };
  }

  /**
   * Delete documents by filter
   */
  async deleteByFilter(filter: SearchFilter): Promise<number> {
    if (!this.isConnected) {
      await this.initialize();
    }

    const filterConditions = this.buildFilterConditions(filter);
    if (!filterConditions) {
      throw new Error('Filter is required for deletion');
    }

    const result = await this.client.delete(this.collectionName, {
      filter: filterConditions as Filter,
      wait: true,
    });

    return typeof result === 'object' && result !== null ? 1 : 0;
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(): Promise<{
    points_count: number;
    indexed_vectors_count: number;
  }> {
    const info = await this.client.getCollection(this.collectionName);
    return {
      points_count: info.points_count || 0,
      indexed_vectors_count: info.indexed_vectors_count || 0,
    };
  }
}

// Singleton instance
let qdrantServiceInstance: QdrantService | null = null;

export function getQdrantService(): QdrantService {
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
