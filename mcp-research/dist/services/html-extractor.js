"use strict";
/**
 * Semantic HTML Extractor Service
 *
 * Uses Mozilla Readability for content extraction and Turndown for
 * HTML to Markdown conversion. This preserves semantic structure
 * (headers, lists, tables) which LLMs understand better.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromHTML = extractFromHTML;
exports.extractForRAG = extractForRAG;
exports.extractSectionsFromHTML = extractSectionsFromHTML;
const jsdom_1 = require("jsdom");
const turndown_1 = __importDefault(require("turndown"));
// Readability doesn't have proper types, so we need to use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Readability } = require('@mozilla/readability');
const DEFAULT_OPTIONS = {
    useReadability: true,
    convertToMarkdown: true,
    preserveElements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'code', 'pre'],
    removeSelectors: ['script', 'style', 'nav', 'header', 'footer', 'aside', '.sidebar', '.ads', '.comments'],
};
/**
 * Create a configured Turndown service for HTML to Markdown conversion
 */
function createTurndownService() {
    const turndown = new turndown_1.default({
        headingStyle: 'atx', // Use # for headers
        codeBlockStyle: 'fenced', // Use ``` for code blocks
        bulletListMarker: '-',
        emDelimiter: '_',
        strongDelimiter: '**',
    });
    // Add custom rules for better handling of technical content
    turndown.addRule('codeBlocks', {
        filter: ['pre'],
        replacement: function (content, node) {
            const element = node;
            const language = element.querySelector('code')?.className.match(/language-(\w+)/)?.[1] || '';
            return `\n\`\`\`${language}\n${content.trim()}\n\`\`\`\n`;
        },
    });
    // Preserve table structure
    turndown.addRule('tables', {
        filter: ['table'],
        replacement: function (content, node) {
            const element = node;
            const rows = Array.from(element.querySelectorAll('tr'));
            if (rows.length === 0)
                return content;
            let markdown = '\n';
            rows.forEach((row, idx) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                const cellContents = cells.map(cell => cell.textContent?.trim() || '');
                markdown += '| ' + cellContents.join(' | ') + ' |\n';
                // Add header separator after first row
                if (idx === 0) {
                    markdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
                }
            });
            return markdown + '\n';
        },
    });
    return turndown;
}
/**
 * Extract clean content from HTML using basic DOM manipulation
 */
function extractBasicContent(htmlContent, options) {
    const dom = new jsdom_1.JSDOM(htmlContent);
    const { document } = dom.window;
    // Remove unwanted elements
    if (options.removeSelectors) {
        for (const selector of options.removeSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        }
    }
    // Get text content
    const text = document.body.textContent || '';
    // Clean up whitespace
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
}
/**
 * Extract content using Mozilla Readability (best for articles/blog posts)
 */
function extractWithReadability(htmlContent) {
    const dom = new jsdom_1.JSDOM(htmlContent, { url: 'https://example.com' });
    const reader = new Readability(dom.window.document);
    return reader.parse();
}
/**
 * Main extraction function - extracts semantic content from HTML
 */
function extractFromHTML(htmlContent, options = DEFAULT_OPTIONS) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    let title = '';
    let content = '';
    let markdown = '';
    let excerpt = '';
    let byline = null;
    let siteName = null;
    let lang = null;
    let publishedTime = null;
    // Try Readability first for article-style content
    if (mergedOptions.useReadability) {
        const readabilityResult = extractWithReadability(htmlContent);
        if (readabilityResult && readabilityResult.textContent.length > 100) {
            title = readabilityResult.title || '';
            content = readabilityResult.textContent || '';
            excerpt = readabilityResult.excerpt || '';
            byline = readabilityResult.byline;
            siteName = readabilityResult.siteName;
            lang = readabilityResult.lang;
            publishedTime = readabilityResult.publishedTime;
            // Convert the cleaned HTML to Markdown if requested
            if (mergedOptions.convertToMarkdown && readabilityResult.content) {
                const turndown = createTurndownService();
                markdown = turndown.turndown(readabilityResult.content);
            }
        }
    }
    // Fallback to basic extraction if Readability didn't work well
    if (content.length < 100) {
        content = extractBasicContent(htmlContent, mergedOptions);
        // Extract title from HTML
        const dom = new jsdom_1.JSDOM(htmlContent);
        const titleElement = dom.window.document.querySelector('title');
        title = titleElement?.textContent || 'Untitled';
        // Convert full body to Markdown if requested
        if (mergedOptions.convertToMarkdown) {
            const turndown = createTurndownService();
            // Remove unwanted elements first
            if (mergedOptions.removeSelectors) {
                for (const selector of mergedOptions.removeSelectors) {
                    const elements = dom.window.document.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                }
            }
            const bodyHtml = dom.window.document.body.innerHTML;
            markdown = turndown.turndown(bodyHtml);
        }
    }
    // Calculate stats
    const words = content.split(/\s+/).filter(w => w.length > 0);
    return {
        title,
        content,
        markdown: markdown || content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        byline,
        siteName,
        lang,
        publishedTime,
        wordCount: words.length,
        charCount: content.length,
    };
}
/**
 * Extract content optimized for RAG ingestion
 * Returns Markdown for better LLM comprehension
 */
function extractForRAG(htmlContent) {
    const extracted = extractFromHTML(htmlContent, {
        useReadability: true,
        convertToMarkdown: true,
    });
    return {
        text: extracted.markdown || extracted.content,
        metadata: {
            title: extracted.title,
            excerpt: extracted.excerpt,
            author: extracted.byline,
            wordCount: extracted.wordCount,
            format: 'markdown',
        },
    };
}
/**
 * Process multiple HTML sections with parent-child relationship
 * Useful for maintaining context in RAG retrieval
 */
function extractSectionsFromHTML(htmlContent) {
    const dom = new jsdom_1.JSDOM(htmlContent);
    const { document } = dom.window;
    // Remove unwanted elements
    const unwanted = document.querySelectorAll('script, style, nav, header, footer');
    unwanted.forEach(el => el.remove());
    const sections = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const parentStack = [];
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName[1]);
        const headingText = heading.textContent?.trim() || `Section ${index + 1}`;
        const id = `section-${index}`;
        // Find content until next heading
        let content = '';
        let sibling = heading.nextElementSibling;
        while (sibling && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
            content += sibling.textContent?.trim() + '\n';
            sibling = sibling.nextElementSibling;
        }
        // Update parent stack
        while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
            parentStack.pop();
        }
        const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1].id : null;
        sections.push({
            level,
            heading: headingText,
            content: content.trim(),
            parentId,
            id,
        });
        parentStack.push({ level, id });
    });
    return sections;
}
//# sourceMappingURL=html-extractor.js.map