/**
 * DOCUMENT PARSING SERVICE
 *
 * Extracts text content from various document formats:
 * - PDF files (using pdf-parse)
 * - Word documents (.docx via mammoth - pending install)
 * - Plain text files
 * - Integrates with Knowledge Base for RAG indexing
 */

import fs from 'fs/promises';
import path from 'path';
import * as pdfParse from 'pdf-parse';

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

/**
 * Parse PDF document and extract text
 */
export async function parsePDF(filePath: string): Promise<ParsedDocument> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    // @ts-ignore - pdf-parse has complex export structure
    const parse = (pdfParse as any).default || pdfParse;
    const pdfData = await parse(dataBuffer);

    return {
      text: pdfData.text,
      pageCount: pdfData.numpages,
      metadata: {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        keywords: pdfData.info?.Keywords,
        creationDate: pdfData.info?.CreationDate ? new Date(pdfData.info.CreationDate) : undefined,
        modificationDate: pdfData.info?.ModDate ? new Date(pdfData.info.ModDate) : undefined,
      },
    };
  } catch (error: any) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse Word document and extract text
 * NOTE: Requires mammoth package - install with: npm install mammoth
 */
export async function parseWordDocument(filePath: string): Promise<ParsedDocument> {
  try {
    // Dynamic import to handle mammoth not being installed yet
    let mammoth: any;
    try {
      mammoth = await import('mammoth');
    } catch (importError) {
      throw new Error(
        'mammoth package not installed. Install with: npm install mammoth'
      );
    }

    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });

    return {
      text: result.value,
      metadata: {},
    };
  } catch (error: any) {
    throw new Error(`Word document parsing failed: ${error.message}`);
  }
}

/**
 * Parse plain text file
 */
export async function parseTextFile(filePath: string): Promise<ParsedDocument> {
  try {
    const text = await fs.readFile(filePath, 'utf-8');

    return {
      text,
      metadata: {},
    };
  } catch (error: any) {
    throw new Error(`Text file parsing failed: ${error.message}`);
  }
}

/**
 * Detect file type and parse accordingly
 */
export async function parseDocument(filePath: string, mimeType?: string): Promise<ParsedDocument> {
  // Determine file type from mime type or extension
  const ext = path.extname(filePath).toLowerCase();
  const detectedMimeType = mimeType || getMimeTypeFromExtension(ext);

  console.log(`[DocumentParsing] Parsing ${filePath} (type: ${detectedMimeType})`);

  switch (detectedMimeType) {
    case 'application/pdf':
      return parsePDF(filePath);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return parseWordDocument(filePath);

    case 'text/plain':
    case 'text/csv':
      return parseTextFile(filePath);

    default:
      throw new Error(`Unsupported document type: ${detectedMimeType}`);
  }
}

/**
 * Get mime type from file extension
 */
function getMimeTypeFromExtension(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Chunk text for RAG ingestion
 * Splits text into overlapping chunks for better vector search
 */
export function chunkText(
  text: string,
  options: {
    chunkSize?: number;
    overlap?: number;
  } = {}
): string[] {
  const { chunkSize = 1000, overlap = 100 } = options;

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunk = text.slice(startIndex, endIndex);

    chunks.push(chunk.trim());

    // Move forward by chunkSize minus overlap
    startIndex += chunkSize - overlap;

    // Prevent infinite loop
    if (startIndex <= endIndex - chunkSize + overlap) {
      startIndex = endIndex;
    }
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Extract key phrases and metadata from parsed text
 * Uses simple heuristics - can be enhanced with NLP
 */
export function extractMetadata(text: string): {
  wordCount: number;
  sentences: number;
  keyPhrases: string[];
} {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Simple key phrase extraction - find repeated capitalized phrases
  const capitalizedPhrases = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  const phraseCounts = capitalizedPhrases.reduce((acc, phrase) => {
    acc[phrase] = (acc[phrase] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const keyPhrases = Object.entries(phraseCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  return {
    wordCount: words.length,
    sentences: sentences.length,
    keyPhrases,
  };
}

export const documentParsingService = {
  parseDocument,
  parsePDF,
  parseWordDocument,
  parseTextFile,
  chunkText,
  extractMetadata,
};
