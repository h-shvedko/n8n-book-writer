import { TextChunk, DocumentMetadata } from '../types';
export interface SplitterOptions {
    chunkSize: number;
    chunkOverlap: number;
    separators?: string[];
}
/**
 * Recursive Character Text Splitter
 * Splits text into chunks using a hierarchy of separators
 */
export declare class RecursiveCharacterTextSplitter {
    private chunkSize;
    private chunkOverlap;
    private separators;
    constructor(options: SplitterOptions);
    /**
     * Split text into chunks with metadata
     */
    splitText(text: string, baseMetadata: DocumentMetadata): TextChunk[];
    /**
     * Recursive splitting algorithm
     */
    private splitTextRecursive;
    /**
     * Split text by separator keeping the separator
     */
    private splitBySeparator;
    /**
     * Merge splits into chunks respecting size limits
     */
    private mergeSplits;
    /**
     * Join documents with separator
     */
    private joinDocs;
}
/**
 * Create a text splitter with default WPI settings
 */
export declare function createWpiTextSplitter(): RecursiveCharacterTextSplitter;
//# sourceMappingURL=text-splitter.d.ts.map