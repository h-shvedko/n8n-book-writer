export interface EmbeddingConfig {
    apiKey: string;
    model?: string;
    dimensions?: number;
}
/**
 * Service for generating text embeddings using OpenAI
 */
export declare class EmbeddingService {
    private client;
    private model;
    private dimensions;
    constructor(config: EmbeddingConfig);
    /**
     * Generate embedding for a single text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts (batch)
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Get the embedding dimensions
     */
    getDimensions(): number;
    /**
     * Get the model name
     */
    getModel(): string;
}
export declare function getEmbeddingService(): EmbeddingService;
//# sourceMappingURL=embedding-service.d.ts.map