/**
 * EMBEDDINGS SERVICE
 *
 * Real AI-powered embeddings for:
 * - Semantic search across projects, documents, and knowledge base
 * - Smart recommendations and similarity matching
 * - Code generation and policy generation
 * - Intelligent context retrieval for agents
 *
 * Supports:
 * - OpenAI text-embedding-3-small and text-embedding-3-large
 * - Local vector storage or external vector DB (Pinecone, Qdrant, Weaviate)
 * - Incremental updates and caching
 */

import type { IStorage } from '../storage.js';

export interface EmbeddingConfig {
  provider: 'openai' | 'local' | 'custom';
  model: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002';
  apiKey?: string;
  dimensions?: number; // For OpenAI's new models
  vectorDB?: {
    type: 'memory' | 'pinecone' | 'qdrant' | 'weaviate';
    url?: string;
    apiKey?: string;
    index?: string;
  };
}

export interface EmbeddingDocument {
  id: string;
  content: string;
  metadata: {
    type: 'project' | 'document' | 'policy' | 'code' | 'knowledge' | 'conversation';
    entityId?: string;
    title?: string;
    tags?: string[];
    createdAt: Date;
    [key: string]: any;
  };
  embedding?: number[];
}

export interface SearchResult {
  document: EmbeddingDocument;
  similarity: number;
  score: number;
}

export class EmbeddingsService {
  private config: EmbeddingConfig;
  private vectorStore: Map<string, EmbeddingDocument> = new Map();

  constructor(config: EmbeddingConfig, private storage?: IStorage) {
    this.config = {
      provider: config.provider || 'openai',
      model: config.model || 'text-embedding-3-small',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      dimensions: config.dimensions || 1536,
      vectorDB: config.vectorDB || { type: 'memory' },
    };

    console.log(`[Embeddings] Initialized with ${this.config.provider} provider using ${this.config.model}`);
  }

  /**
   * Generate embedding for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    switch (this.config.provider) {
      case 'openai':
        return await this.generateOpenAIEmbedding(text);
      case 'local':
        return await this.generateLocalEmbedding(text);
      case 'custom':
        throw new Error('Custom embedding provider not configured');
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Generate OpenAI embedding
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
          dimensions: this.config.dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error: any) {
      console.error('[Embeddings] OpenAI embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate local embedding (simple TF-IDF based)
   * Use this as fallback when OpenAI is not available
   */
  private async generateLocalEmbedding(text: string): Promise<number[]> {
    // Simple bag-of-words embedding for development/testing
    // In production, consider using sentence-transformers via Python bridge

    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const vocabulary = Array.from(new Set(words));

    // Create simple TF-IDF vector (1536 dimensions to match OpenAI)
    const embedding = new Array(1536).fill(0);

    words.forEach((word, idx) => {
      const vocabIndex = vocabulary.indexOf(word);
      if (vocabIndex !== -1) {
        const dimension = vocabIndex % 1536;
        embedding[dimension] += 1 / words.length; // Simple TF
      }
    });

    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Index document with embedding
   */
  async indexDocument(document: Omit<EmbeddingDocument, 'embedding'>): Promise<void> {
    console.log(`[Embeddings] Indexing document: ${document.id} (${document.metadata.type})`);

    // Generate embedding
    const embedding = await this.generateEmbedding(document.content);

    // Create full document
    const fullDocument: EmbeddingDocument = {
      ...document,
      embedding,
    };

    // Store in vector DB
    await this.storeVector(fullDocument);

    console.log(`[Embeddings] Indexed document ${document.id} with ${embedding.length}d vector`);
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(documents: Array<Omit<EmbeddingDocument, 'embedding'>>): Promise<void> {
    console.log(`[Embeddings] Batch indexing ${documents.length} documents`);

    const batchSize = 100;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      await Promise.all(
        batch.map(doc => this.indexDocument(doc).catch(err => {
          console.error(`[Embeddings] Failed to index ${doc.id}:`, err);
        }))
      );

      console.log(`[Embeddings] Indexed batch ${i / batchSize + 1} (${Math.min(i + batchSize, documents.length)}/${documents.length})`);
    }

    console.log(`[Embeddings] Batch indexing complete`);
  }

  /**
   * Semantic search for similar documents
   */
  async search(
    query: string,
    options: {
      limit?: number;
      type?: EmbeddingDocument['metadata']['type'];
      filters?: Record<string, any>;
      threshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    console.log(`[Embeddings] Searching: "${query.substring(0, 50)}..."`);

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Retrieve vectors from store
    const documents = await this.retrieveVectors(options.type, options.filters);

    // Calculate similarity scores
    const results = documents
      .map(doc => ({
        document: doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding || []),
        score: 0, // Will be calculated
      }))
      .filter(result => !options.threshold || result.similarity >= options.threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit || 10);

    // Calculate normalized scores (0-100)
    const maxSim = results[0]?.similarity || 1;
    results.forEach(result => {
      result.score = (result.similarity / maxSim) * 100;
    });

    console.log(`[Embeddings] Found ${results.length} results (best score: ${results[0]?.score.toFixed(2) || 0})`);

    return results;
  }

  /**
   * Find similar documents to a given document
   */
  async findSimilar(
    documentId: string,
    options: {
      limit?: number;
      type?: EmbeddingDocument['metadata']['type'];
      excludeSelf?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    const document = this.vectorStore.get(documentId);
    if (!document || !document.embedding) {
      throw new Error(`Document ${documentId} not found or has no embedding`);
    }

    // Retrieve vectors
    const documents = await this.retrieveVectors(options.type);

    // Calculate similarities
    const results = documents
      .filter(doc => !options.excludeSelf || doc.id !== documentId)
      .map(doc => ({
        document: doc,
        similarity: this.cosineSimilarity(document.embedding!, doc.embedding || []),
        score: 0,
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit || 5);

    // Normalize scores
    const maxSim = results[0]?.similarity || 1;
    results.forEach(result => {
      result.score = (result.similarity / maxSim) * 100;
    });

    return results;
  }

  /**
   * Generate smart recommendations based on context
   */
  async getRecommendations(
    context: string,
    options: {
      types?: Array<EmbeddingDocument['metadata']['type']>;
      limit?: number;
      diversity?: number; // 0-1, higher = more diverse
    } = {}
  ): Promise<SearchResult[]> {
    const results = await this.search(context, {
      limit: (options.limit || 5) * 3, // Get more for diversity
    });

    // Apply diversity if requested
    if (options.diversity && options.diversity > 0) {
      return this.diversifyResults(results, options.limit || 5, options.diversity);
    }

    return results.slice(0, options.limit || 5);
  }

  /**
   * Diversify results using Maximal Marginal Relevance (MMR)
   */
  private diversifyResults(
    results: SearchResult[],
    limit: number,
    lambda: number // 0-1, trade-off between relevance and diversity
  ): SearchResult[] {
    if (results.length === 0) return [];

    const selected: SearchResult[] = [results[0]]; // Start with most relevant
    const remaining = results.slice(1);

    while (selected.length < limit && remaining.length > 0) {
      let maxScore = -Infinity;
      let maxIndex = 0;

      // Find document that maximizes MMR score
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Relevance score
        const relevance = candidate.similarity;

        // Max similarity to already selected documents
        const maxSimilarity = Math.max(
          ...selected.map(s =>
            this.cosineSimilarity(
              candidate.document.embedding || [],
              s.document.embedding || []
            )
          )
        );

        // MMR score: λ * relevance - (1-λ) * max_similarity
        const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

        if (mmrScore > maxScore) {
          maxScore = mmrScore;
          maxIndex = i;
        }
      }

      selected.push(remaining[maxIndex]);
      remaining.splice(maxIndex, 1);
    }

    return selected;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Store vector in configured vector DB
   */
  private async storeVector(document: EmbeddingDocument): Promise<void> {
    const vectorDBType = this.config.vectorDB?.type || 'memory';

    switch (vectorDBType) {
      case 'memory':
        this.vectorStore.set(document.id, document);
        break;

      case 'pinecone':
        await this.storeToPinecone(document);
        break;

      case 'qdrant':
        await this.storeToQdrant(document);
        break;

      case 'weaviate':
        await this.storeToWeaviate(document);
        break;

      default:
        console.warn(`[Embeddings] Unknown vector DB type: ${vectorDBType}, using memory`);
        this.vectorStore.set(document.id, document);
    }
  }

  /**
   * Store to Pinecone vector database
   */
  private async storeToPinecone(document: EmbeddingDocument): Promise<void> {
    // Check if Pinecone is configured
    if (!this.config.vectorDB?.url || !this.config.vectorDB?.apiKey || !this.config.vectorDB?.index) {
      console.warn('[Embeddings] Pinecone not configured (missing url/apiKey/index), using memory fallback');
      console.warn('[Embeddings] To enable Pinecone: Set PINECONE_URL, PINECONE_API_KEY, and PINECONE_INDEX in environment');
      this.vectorStore.set(document.id, document);
      return;
    }

    try {
      // Pinecone REST API implementation
      const response = await fetch(`${this.config.vectorDB.url}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.config.vectorDB.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namespace: this.config.vectorDB.index,
          vectors: [
            {
              id: document.id,
              values: document.embedding || [],
              metadata: {
                content: document.content,
                ...document.metadata,
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Pinecone API error: ${response.statusText}`);
      }

      console.log(`[Embeddings] Stored document ${document.id} to Pinecone`);
    } catch (error) {
      console.error('[Embeddings] Pinecone storage failed, falling back to memory:', error);
      this.vectorStore.set(document.id, document);
    }
  }

  /**
   * Store to Qdrant vector database
   */
  private async storeToQdrant(document: EmbeddingDocument): Promise<void> {
    // Check if Qdrant is configured
    if (!this.config.vectorDB?.url || !this.config.vectorDB?.index) {
      console.warn('[Embeddings] Qdrant not configured (missing url/index), using memory fallback');
      console.warn('[Embeddings] To enable Qdrant: Set QDRANT_URL and QDRANT_COLLECTION in environment');
      this.vectorStore.set(document.id, document);
      return;
    }

    try {
      // Qdrant REST API implementation
      const response = await fetch(
        `${this.config.vectorDB.url}/collections/${this.config.vectorDB.index}/points`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.vectorDB.apiKey && { 'api-key': this.config.vectorDB.apiKey }),
          },
          body: JSON.stringify({
            points: [
              {
                id: document.id,
                vector: document.embedding || [],
                payload: {
                  content: document.content,
                  ...document.metadata,
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.statusText}`);
      }

      console.log(`[Embeddings] Stored document ${document.id} to Qdrant`);
    } catch (error) {
      console.error('[Embeddings] Qdrant storage failed, falling back to memory:', error);
      this.vectorStore.set(document.id, document);
    }
  }

  /**
   * Store to Weaviate vector database
   */
  private async storeToWeaviate(document: EmbeddingDocument): Promise<void> {
    // Check if Weaviate is configured
    if (!this.config.vectorDB?.url || !this.config.vectorDB?.index) {
      console.warn('[Embeddings] Weaviate not configured (missing url/index), using memory fallback');
      console.warn('[Embeddings] To enable Weaviate: Set WEAVIATE_URL and WEAVIATE_CLASS in environment');
      this.vectorStore.set(document.id, document);
      return;
    }

    try {
      // Weaviate REST API implementation
      const response = await fetch(`${this.config.vectorDB.url}/v1/objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.vectorDB.apiKey && { Authorization: `Bearer ${this.config.vectorDB.apiKey}` }),
        },
        body: JSON.stringify({
          class: this.config.vectorDB.index,
          id: document.id,
          properties: {
            content: document.content,
            ...document.metadata,
          },
          vector: document.embedding || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Weaviate API error: ${response.statusText}`);
      }

      console.log(`[Embeddings] Stored document ${document.id} to Weaviate`);
    } catch (error) {
      console.error('[Embeddings] Weaviate storage failed, falling back to memory:', error);
      this.vectorStore.set(document.id, document);
    }
  }

  /**
   * Retrieve vectors from store
   */
  private async retrieveVectors(
    type?: EmbeddingDocument['metadata']['type'],
    filters?: Record<string, any>
  ): Promise<EmbeddingDocument[]> {
    let documents = Array.from(this.vectorStore.values());

    // Filter by type
    if (type) {
      documents = documents.filter(doc => doc.metadata.type === type);
    }

    // Apply additional filters
    if (filters) {
      documents = documents.filter(doc => {
        return Object.entries(filters).every(([key, value]) => {
          return doc.metadata[key] === value;
        });
      });
    }

    return documents;
  }

  /**
   * Delete document from index
   */
  async deleteDocument(documentId: string): Promise<void> {
    this.vectorStore.delete(documentId);
    console.log(`[Embeddings] Deleted document ${documentId}`);
  }

  /**
   * Update document content and re-index
   */
  async updateDocument(
    documentId: string,
    newContent: string,
    newMetadata?: Partial<EmbeddingDocument['metadata']>
  ): Promise<void> {
    const existingDoc = this.vectorStore.get(documentId);
    if (!existingDoc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const updatedDoc = {
      ...existingDoc,
      content: newContent,
      metadata: {
        ...existingDoc.metadata,
        ...newMetadata,
      },
    };

    await this.indexDocument(updatedDoc);
  }

  /**
   * Get statistics about the vector store
   */
  getStats(): {
    totalDocuments: number;
    byType: Record<string, number>;
    vectorDimensions: number;
  } {
    const documents = Array.from(this.vectorStore.values());

    const byType: Record<string, number> = {};
    documents.forEach(doc => {
      byType[doc.metadata.type] = (byType[doc.metadata.type] || 0) + 1;
    });

    return {
      totalDocuments: documents.length,
      byType,
      vectorDimensions: this.config.dimensions || 1536,
    };
  }
}

/**
 * Create singleton embeddings service instance
 */
let embeddingsServiceInstance: EmbeddingsService | null = null;

export function getEmbeddingsService(config?: EmbeddingConfig): EmbeddingsService {
  if (!embeddingsServiceInstance) {
    embeddingsServiceInstance = new EmbeddingsService(
      config || {
        provider: 'openai',
        model: 'text-embedding-3-small',
        dimensions: 1536,
        vectorDB: { type: 'memory' },
      }
    );
  }
  return embeddingsServiceInstance;
}
