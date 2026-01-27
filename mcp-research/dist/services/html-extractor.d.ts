/**
 * Semantic HTML Extractor Service
 *
 * Uses Mozilla Readability for content extraction and Turndown for
 * HTML to Markdown conversion. This preserves semantic structure
 * (headers, lists, tables) which LLMs understand better.
 */
export interface ExtractedContent {
    title: string;
    content: string;
    markdown: string;
    excerpt: string;
    byline: string | null;
    siteName: string | null;
    lang: string | null;
    publishedTime: string | null;
    wordCount: number;
    charCount: number;
}
export interface ExtractionOptions {
    /** Use Readability for article extraction (recommended for blog/article content) */
    useReadability?: boolean;
    /** Convert to Markdown (better for LLM understanding) */
    convertToMarkdown?: boolean;
    /** Preserve specific HTML elements as text */
    preserveElements?: string[];
    /** Remove specific selectors before extraction */
    removeSelectors?: string[];
}
/**
 * Main extraction function - extracts semantic content from HTML
 */
export declare function extractFromHTML(htmlContent: string, options?: ExtractionOptions): ExtractedContent;
/**
 * Extract content optimized for RAG ingestion
 * Returns Markdown for better LLM comprehension
 */
export declare function extractForRAG(htmlContent: string): {
    text: string;
    metadata: {
        title: string;
        excerpt: string;
        author: string | null;
        wordCount: number;
        format: 'markdown';
    };
};
/**
 * Process multiple HTML sections with parent-child relationship
 * Useful for maintaining context in RAG retrieval
 */
export declare function extractSectionsFromHTML(htmlContent: string): Array<{
    level: number;
    heading: string;
    content: string;
    parentId: string | null;
    id: string;
}>;
//# sourceMappingURL=html-extractor.d.ts.map