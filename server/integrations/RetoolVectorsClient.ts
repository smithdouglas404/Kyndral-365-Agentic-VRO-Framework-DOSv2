/**
 * RETOOL VECTORS CLIENT
 *
 * Integration with Retool Vectors for RAG (Retrieval-Augmented Generation)
 * Provides knowledge base access for Deep Agents.
 *
 * Features:
 * - Upload documents to Retool Vectors
 * - Query vectors for relevant context
 * - Automatic embeddings via OpenAI
 * - Built-in chunking and tokenization
 *
 * Docs: https://docs.retool.com/data-sources/quickstarts/retool-vectors
 */

import axios, { AxiosInstance } from 'axios';

export interface RetoolVectorsConfig {
  apiKey: string;
  instanceUrl: string; // e.g., https://yourcompany.retool.com
  vectorId?: string; // Specific vector database ID
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    domain?: string;
    type?: string;
    created_at?: string;
    [key: string]: any;
  };
  score?: number; // Similarity score
}

export interface VectorQueryOptions {
  text: string;
  topK?: number; // Number of results (default 5)
  filter?: Record<string, any>; // Metadata filters
  threshold?: number; // Minimum similarity score
}

export interface VectorUploadOptions {
  content: string;
  metadata: {
    source: string;
    domain?: string;
    type?: string;
    [key: string]: any;
  };
}

/**
 * Retool Vectors Client
 * Provides RAG capabilities for Deep Agents
 */
export class RetoolVectorsClient {
  private client: AxiosInstance;
  private config: RetoolVectorsConfig;

  constructor(config: RetoolVectorsConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.instanceUrl}/api`,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('[RetoolVectors] Client initialized');
  }

  /**
   * Query vectors for relevant documents
   * Used by agents to get knowledge context
   */
  async query(options: VectorQueryOptions): Promise<VectorDocument[]> {
    try {
      const {
        text,
        topK = 5,
        filter = {},
        threshold = 0.7,
      } = options;

      console.log(`[RetoolVectors] Querying: "${text.substring(0, 50)}..."`);

      const response = await this.client.post('/vectors/query', {
        vector_id: this.config.vectorId,
        query: text,
        top_k: topK,
        filter,
        threshold,
      });

      const results: VectorDocument[] = response.data.results.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        score: result.score,
      }));

      console.log(`[RetoolVectors] Found ${results.length} relevant documents`);

      return results;
    } catch (error: any) {
      console.error('[RetoolVectors] Query error:', error.message);

      // Return empty array if Retool Vectors is not configured
      if (error.code === 'ECONNREFUSED' || error.response?.status === 401) {
        console.warn('[RetoolVectors] Not configured or unavailable, returning empty results');
        return [];
      }

      throw error;
    }
  }

  /**
   * Upload document to Retool Vectors
   * Automatically chunked, tokenized, and embedded
   */
  async upload(options: VectorUploadOptions): Promise<string> {
    try {
      const { content, metadata } = options;

      console.log(`[RetoolVectors] Uploading document: ${metadata.source}`);

      const response = await this.client.post('/vectors/upload', {
        vector_id: this.config.vectorId,
        content,
        metadata: {
          ...metadata,
          uploaded_at: new Date().toISOString(),
        },
      });

      const documentId = response.data.id;

      console.log(`[RetoolVectors] Document uploaded: ${documentId}`);

      return documentId;
    } catch (error: any) {
      console.error('[RetoolVectors] Upload error:', error.message);
      throw error;
    }
  }

  /**
   * Upload URL (Retool will crawl and index)
   */
  async uploadUrl(url: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      console.log(`[RetoolVectors] Uploading URL: ${url}`);

      const response = await this.client.post('/vectors/upload-url', {
        vector_id: this.config.vectorId,
        url,
        metadata: {
          ...metadata,
          source: url,
          type: 'url',
          uploaded_at: new Date().toISOString(),
        },
      });

      const documentId = response.data.id;

      console.log(`[RetoolVectors] URL uploaded: ${documentId}`);

      return documentId;
    } catch (error: any) {
      console.error('[RetoolVectors] Upload URL error:', error.message);
      throw error;
    }
  }

  /**
   * Delete document from vectors
   */
  async delete(documentId: string): Promise<void> {
    try {
      await this.client.delete(`/vectors/documents/${documentId}`);
      console.log(`[RetoolVectors] Document deleted: ${documentId}`);
    } catch (error: any) {
      console.error('[RetoolVectors] Delete error:', error.message);
      throw error;
    }
  }

  /**
   * List all documents in vector database
   */
  async listDocuments(filter?: Record<string, any>): Promise<VectorDocument[]> {
    try {
      const response = await this.client.get('/vectors/documents', {
        params: {
          vector_id: this.config.vectorId,
          filter: filter ? JSON.stringify(filter) : undefined,
        },
      });

      return response.data.documents;
    } catch (error: any) {
      console.error('[RetoolVectors] List documents error:', error.message);
      throw error;
    }
  }

  /**
   * Get vector database statistics
   */
  async getStats(): Promise<{
    documentCount: number;
    totalChunks: number;
    vectorDimension: number;
  }> {
    try {
      const response = await this.client.get(`/vectors/${this.config.vectorId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('[RetoolVectors] Get stats error:', error.message);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let retoolVectorsInstance: RetoolVectorsClient | null = null;

/**
 * Initialize Retool Vectors client
 */
export function initializeRetoolVectors(config: RetoolVectorsConfig): RetoolVectorsClient {
  if (!retoolVectorsInstance) {
    retoolVectorsInstance = new RetoolVectorsClient(config);
  }
  return retoolVectorsInstance;
}

/**
 * Get Retool Vectors client instance
 */
export function getRetoolVectorsClient(): RetoolVectorsClient | null {
  return retoolVectorsInstance;
}
