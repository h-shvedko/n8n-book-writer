import { TextChunk, DocumentMetadata } from '../types';

export interface SplitterOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''];

/**
 * Recursive Character Text Splitter
 * Splits text into chunks using a hierarchy of separators
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: SplitterOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    this.separators = options.separators || DEFAULT_SEPARATORS;
  }

  /**
   * Split text into chunks with metadata
   */
  splitText(text: string, baseMetadata: DocumentMetadata): TextChunk[] {
    const chunks = this.splitTextRecursive(text, this.separators);

    const result: TextChunk[] = [];
    let currentIndex = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const startIndex = text.indexOf(chunk, currentIndex);
      const endIndex = startIndex + chunk.length;

      result.push({
        text: chunk.trim(),
        metadata: {
          ...baseMetadata,
          chunk_index: i,
          total_chunks: chunks.length,
        },
        start_index: startIndex,
        end_index: endIndex,
      });

      currentIndex = Math.max(currentIndex, startIndex + 1);
    }

    return result.filter(chunk => chunk.text.length > 0);
  }

  /**
   * Recursive splitting algorithm
   */
  private splitTextRecursive(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];

    // Get the appropriate separator
    let separator = separators[separators.length - 1];
    let newSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === '') {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    // Split by the separator
    const splits = this.splitBySeparator(text, separator);

    // Merge splits into chunks
    let goodSplits: string[] = [];
    const separatorForJoin = separator === '' ? '' : separator;

    for (const s of splits) {
      if (s.length < this.chunkSize) {
        goodSplits.push(s);
      } else {
        if (goodSplits.length > 0) {
          const mergedText = this.mergeSplits(goodSplits, separatorForJoin);
          finalChunks.push(...mergedText);
          goodSplits = [];
        }
        if (newSeparators.length === 0) {
          finalChunks.push(s);
        } else {
          const otherChunks = this.splitTextRecursive(s, newSeparators);
          finalChunks.push(...otherChunks);
        }
      }
    }

    if (goodSplits.length > 0) {
      const mergedText = this.mergeSplits(goodSplits, separatorForJoin);
      finalChunks.push(...mergedText);
    }

    return finalChunks;
  }

  /**
   * Split text by separator keeping the separator
   */
  private splitBySeparator(text: string, separator: string): string[] {
    if (separator === '') {
      return text.split('');
    }

    const splits = text.split(separator);
    const result: string[] = [];

    for (let i = 0; i < splits.length; i++) {
      if (i < splits.length - 1) {
        result.push(splits[i] + separator);
      } else if (splits[i]) {
        result.push(splits[i]);
      }
    }

    return result;
  }

  /**
   * Merge splits into chunks respecting size limits
   */
  private mergeSplits(splits: string[], separator: string): string[] {
    const chunks: string[] = [];
    const currentDoc: string[] = [];
    let total = 0;

    for (const d of splits) {
      const len = d.length;

      if (total + len + (currentDoc.length > 0 ? separator.length : 0) > this.chunkSize) {
        if (currentDoc.length > 0) {
          const doc = this.joinDocs(currentDoc, separator);
          if (doc !== null) {
            chunks.push(doc);
          }

          // Handle overlap
          while (
            total > this.chunkOverlap ||
            (total + len + (currentDoc.length > 0 ? separator.length : 0) > this.chunkSize &&
              total > 0)
          ) {
            total -= currentDoc[0].length + (currentDoc.length > 1 ? separator.length : 0);
            currentDoc.shift();
          }
        }
      }

      currentDoc.push(d);
      total += len + (currentDoc.length > 1 ? separator.length : 0);
    }

    const doc = this.joinDocs(currentDoc, separator);
    if (doc !== null) {
      chunks.push(doc);
    }

    return chunks;
  }

  /**
   * Join documents with separator
   */
  private joinDocs(docs: string[], separator: string): string | null {
    const text = docs.join(separator).trim();
    return text === '' ? null : text;
  }
}

/**
 * Create a text splitter with default WPI settings
 */
export function createWpiTextSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
}
