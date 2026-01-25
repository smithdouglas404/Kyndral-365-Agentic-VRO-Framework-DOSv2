/**
 * Retool Vectors MCP (Model Context Protocol) Server
 *
 * Purpose: Enable agents to access Retool's vector database for RAG (Retrieval Augmented Generation)
 *
 * Features:
 * - Query vector database for relevant documents
 * - Upload documents (PDFs, text, URLs) with automatic chunking & embeddings
 * - Filter by domain/metadata
 * - Semantic search with relevance scoring
 *
 * Benefits:
 * - Agents get context-aware knowledge from documents
 * - Reduced hallucinations
 * - Auditable knowledge sources
 * - Automatic embeddings via OpenAI
 *
 * Docs: https://docs.retool.com/data-sources/quickstarts/retool-vectors
 */

import { MCPBase } from './base/MCPBase.js';
import type { IStorage } from '../storage.js';

export interface RetoolVectorsConfig {
  instanceUrl: string;    // e.g., https://yourcompany.retool.com
  apiKey: string;
  vectorId: string;       // Vector database ID from Retool
}

export interface VectorQueryOptions {
  text: string;
  topK?: number;          // Number of results (default: 5)
  filter?: Record<string, any>; // Metadata filters
  includeMetadata?: boolean;
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    domain?: string;
    type?: string;
    [key: string]: any;
  };
  score: number;          // Relevance score (0-1)
}

export interface UploadOptions {
  content?: string;       // Text content
  url?: string;          // URL to fetch and embed
  file?: Buffer;         // File buffer (PDF, txt, etc.)
  metadata: {
    source: string;
    domain?: string;
    type?: string;
    [key: string]: any;
  };
}

export interface UploadResult {
  documentId: string;
  chunkCount: number;
  status: 'success' | 'failed';
  error?: string;
}

/**
 * Retool Vectors MCP Client
 * Extends MCPBase for production-grade reliability (circuit breaker, retry, rate limiting)
 */
export class RetoolVectorsMCP extends MCPBase {
  private config: RetoolVectorsConfig;
  private baseUrl: string;

  constructor(storage: IStorage, config: RetoolVectorsConfig) {
    super(storage, 'RetoolVectorsMCP', {
      circuitBreaker: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 60000,
        monitoringPeriod: 120000,
      },
      rateLimiter: {
        maxRequests: 100,     // Retool Vectors rate limit
        windowMs: 60000,      // Per minute
      },
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '429', '503', '504'],
      },
    });

    this.config = config;
    this.baseUrl = `${config.instanceUrl}/api/public/v1`;

    console.log('[RetoolVectorsMCP] Initialized with vector ID:', config.vectorId);
  }

  /**
   * Query vector database for relevant documents
   */
  async query(options: VectorQueryOptions): Promise<VectorDocument[]> {
    return this.executeWithSafeguards(async () => {
      const { text, topK = 5, filter = {}, includeMetadata = true } = options;

      console.log(`[RetoolVectorsMCP] Querying vectors: "${text.substring(0, 50)}..." (topK: ${topK})`);

      const response = await fetch(`${this.baseUrl}/vectors/${this.config.vectorId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          top_k: topK,
          filter: filter,
          include_metadata: includeMetadata,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Vectors query failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      // Transform to our schema
      const documents: VectorDocument[] = (data.results || []).map((result: any) => ({
        id: result.id,
        content: result.content || result.text,
        metadata: result.metadata || {},
        score: result.score || result.similarity,
      }));

      console.log(`[RetoolVectorsMCP] Found ${documents.length} documents`);

      return documents;
    });
  }

  /**
   * Upload document to vector database
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    return this.executeWithSafeguards(async () => {
      console.log(`[RetoolVectorsMCP] Uploading document: ${options.metadata.source}`);

      let body: any = {
        metadata: options.metadata,
      };

      // Handle different upload types
      if (options.content) {
        body.content = options.content;
      } else if (options.url) {
        body.url = options.url;
      } else if (options.file) {
        // Convert buffer to base64 for API
        body.file = options.file.toString('base64');
      } else {
        throw new Error('Must provide content, url, or file');
      }

      const response = await fetch(`${this.baseUrl}/vectors/${this.config.vectorId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Vectors upload failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      const result: UploadResult = {
        documentId: data.document_id || data.id,
        chunkCount: data.chunk_count || 0,
        status: 'success',
      };

      console.log(`[RetoolVectorsMCP] Upload successful: ${result.documentId} (${result.chunkCount} chunks)`);

      return result;
    });
  }

  /**
   * Upload from URL
   */
  async uploadUrl(url: string, metadata: Record<string, any>): Promise<UploadResult> {
    return this.upload({
      url,
      metadata: {
        source: url,
        ...metadata,
      },
    });
  }

  /**
   * Delete document from vector database
   */
  async delete(documentId: string): Promise<boolean> {
    return this.executeWithSafeguards(async () => {
      console.log(`[RetoolVectorsMCP] Deleting document: ${documentId}`);

      const response = await fetch(`${this.baseUrl}/vectors/${this.config.vectorId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Vectors delete failed: ${response.status} ${error}`);
      }

      console.log(`[RetoolVectorsMCP] Document deleted: ${documentId}`);

      return true;
    });
  }

  /**
   * List all documents in vector database
   */
  async listDocuments(options?: { limit?: number; offset?: number }): Promise<Array<{ id: string; metadata: any }>> {
    return this.executeWithSafeguards(async () => {
      const { limit = 100, offset = 0 } = options || {};

      const response = await fetch(`${this.baseUrl}/vectors/${this.config.vectorId}/documents?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Vectors list failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      return (data.documents || []).map((doc: any) => ({
        id: doc.id,
        metadata: doc.metadata || {},
      }));
    });
  }

  /**
   * Get vector database stats
   */
  async getStats(): Promise<{ documentCount: number; vectorCount: number }> {
    return this.executeWithSafeguards(async () => {
      const response = await fetch(`${this.baseUrl}/vectors/${this.config.vectorId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Retool Vectors stats failed: ${response.status} ${error}`);
      }

      const data = await response.json();

      return {
        documentCount: data.document_count || 0,
        vectorCount: data.vector_count || 0,
      };
    });
  }

  /**
   * Test connection to Retool Vectors
   */
  async testConnection(): Promise<boolean> {
    try {
      const stats = await this.getStats();
      console.log(`[RetoolVectorsMCP] Connection test successful. Documents: ${stats.documentCount}`);
      return true;
    } catch (error: any) {
      console.error('[RetoolVectorsMCP] Connection test failed:', error.message);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let retoolVectorsInstance: RetoolVectorsMCP | null = null;

/**
 * Initialize Retool Vectors MCP
 */
export function initializeRetoolVectorsMCP(storage: IStorage, config: RetoolVectorsConfig): RetoolVectorsMCP {
  if (!retoolVectorsInstance) {
    retoolVectorsInstance = new RetoolVectorsMCP(storage, config);
  }
  return retoolVectorsInstance;
}

/**
 * Get Retool Vectors MCP instance
 */
export function getRetoolVectorsMCP(): RetoolVectorsMCP | null {
  if (!retoolVectorsInstance) {
    console.warn('[RetoolVectorsMCP] Not initialized. Call initializeRetoolVectorsMCP() first.');
  }
  return retoolVectorsInstance;
}
