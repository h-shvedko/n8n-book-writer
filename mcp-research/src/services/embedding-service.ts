import OpenAI from 'openai';

export interface EmbeddingConfig {
  apiKey: string;
  model?: string;
  dimensions?: number;
}

/**
 * Service for generating text embeddings using OpenAI
 */
export class EmbeddingService {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(config: EmbeddingConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'text-embedding-3-small';
    this.dimensions = config.dimensions || 1536;
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimensions,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // OpenAI allows up to 2048 inputs per batch
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
        dimensions: this.dimensions,
      });

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map(d => d.embedding);

      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  /**
   * Get the embedding dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Get the model name
   */
  getModel(): string {
    return this.model;
  }
}

// Singleton instance (lazy initialization)
let embeddingServiceInstance: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    embeddingServiceInstance = new EmbeddingService({
      apiKey,
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10),
    });
  }

  return embeddingServiceInstance;
}
