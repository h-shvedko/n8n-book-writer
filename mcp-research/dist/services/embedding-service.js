"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
exports.getEmbeddingService = getEmbeddingService;
const openai_1 = __importDefault(require("openai"));
/**
 * Service for generating text embeddings using OpenAI
 */
class EmbeddingService {
    client;
    model;
    dimensions;
    constructor(config) {
        this.client = new openai_1.default({
            apiKey: config.apiKey,
        });
        this.model = config.model || 'text-embedding-3-small';
        this.dimensions = config.dimensions || 1536;
    }
    /**
     * Generate embedding for a single text
     */
    async embed(text) {
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
    async embedBatch(texts) {
        if (texts.length === 0) {
            return [];
        }
        // OpenAI allows up to 2048 inputs per batch
        const batchSize = 100;
        const allEmbeddings = [];
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
    getDimensions() {
        return this.dimensions;
    }
    /**
     * Get the model name
     */
    getModel() {
        return this.model;
    }
}
exports.EmbeddingService = EmbeddingService;
// Singleton instance (lazy initialization)
let embeddingServiceInstance = null;
function getEmbeddingService() {
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
//# sourceMappingURL=embedding-service.js.map