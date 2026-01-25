/**
 * Knowledge Base Repository
 *
 * Central repository for organizational knowledge that agents can leverage:
 * - PMBOK (Project Management Body of Knowledge)
 * - Prince2 (Projects in Controlled Environments)
 * - PMI Standards (Project Management Institute)
 * - SAFe (Scaled Agile Framework)
 * - Internal SOPs (Standard Operating Procedures)
 * - Playbooks and Best Practices
 * - Lessons Learned
 *
 * Features:
 * - Hierarchical organization (Category > Subcategory > Article)
 * - Full-text search with vector embeddings
 * - Versioning and change tracking
 * - Tag-based filtering
 * - Access control and permissions
 * - Usage analytics
 */

import type { IStorage } from "../storage.js";
import { getLLMRouter } from "./LLMRouter.js";
import OpenAI from "openai";

export type KnowledgeCategory =
  | "pmbok"
  | "prince2"
  | "pmi_standard"
  | "safe"
  | "sop"
  | "playbook"
  | "lesson_learned"
  | "best_practice"
  | "template"
  | "checklist";

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: KnowledgeCategory;
  subcategory?: string;
  content: string;
  summary?: string;
  tags: string[];
  source: string;
  version: string;
  author?: string;
  metadata: {
    section?: string;
    chapter?: string;
    pageReference?: string;
    applicability?: string[];
    relatedArticles?: string[];
    successRate?: number;
    usageCount?: number;
    lastUsed?: Date;
  };
  embedding?: number[];
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSearchOptions {
  category?: KnowledgeCategory;
  subcategory?: string;
  tags?: string[];
  query?: string;
  limit?: number;
  includeArchived?: boolean;
  sortBy?: "relevance" | "usage" | "date";
}

export interface KnowledgeUsageMetrics {
  articleId: string;
  totalReferences: number;
  referencedByAgents: string[];
  averageRelevanceScore: number;
  lastReferenced: Date;
  successfulApplications: number;
  totalApplications: number;
}

/**
 * Knowledge Base Repository Service
 */
export class KnowledgeBaseRepository {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Create a new knowledge article
   */
  async createArticle(article: Omit<KnowledgeArticle, "id" | "createdAt" | "updatedAt">): Promise<KnowledgeArticle> {
    const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(
      `${article.title} ${article.summary || ""} ${article.content.substring(0, 1000)}`
    );

    const now = new Date();
    const fullArticle: KnowledgeArticle = {
      id,
      ...article,
      embedding,
      createdAt: now,
      updatedAt: now,
      metadata: {
        usageCount: 0,
        ...article.metadata,
      }
    };

    await this.storage.db.query(`
      INSERT INTO knowledge_base (
        id, title, category, subcategory, content, summary, tags, source, version,
        author, metadata, embedding, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `, [
      fullArticle.id,
      fullArticle.title,
      fullArticle.category,
      fullArticle.subcategory || null,
      fullArticle.content,
      fullArticle.summary || null,
      fullArticle.tags,
      fullArticle.source,
      fullArticle.version,
      fullArticle.author || null,
      JSON.stringify(fullArticle.metadata),
      JSON.stringify(fullArticle.embedding),
      fullArticle.status,
      fullArticle.createdAt,
      fullArticle.updatedAt,
    ]);

    return fullArticle;
  }

  /**
   * Update an existing article
   */
  async updateArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const existing = await this.getArticleById(id);
    if (!existing) {
      throw new Error(`Article not found: ${id}`);
    }

    // Regenerate embedding if content changed
    let embedding = existing.embedding;
    if (updates.content || updates.title || updates.summary) {
      const textToEmbed = `${updates.title || existing.title} ${updates.summary || existing.summary || ""} ${(updates.content || existing.content).substring(0, 1000)}`;
      embedding = await this.generateEmbedding(textToEmbed);
    }

    const updated: KnowledgeArticle = {
      ...existing,
      ...updates,
      id: existing.id,
      embedding,
      updatedAt: new Date(),
    };

    await this.storage.db.query(`
      UPDATE knowledge_base
      SET title = $2, category = $3, subcategory = $4, content = $5, summary = $6,
          tags = $7, source = $8, version = $9, author = $10, metadata = $11,
          embedding = $12, status = $13, updated_at = $14
      WHERE id = $1
    `, [
      updated.id,
      updated.title,
      updated.category,
      updated.subcategory || null,
      updated.content,
      updated.summary || null,
      updated.tags,
      updated.source,
      updated.version,
      updated.author || null,
      JSON.stringify(updated.metadata),
      JSON.stringify(updated.embedding),
      updated.status,
      updated.updatedAt,
    ]);

    return updated;
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: string): Promise<KnowledgeArticle | null> {
    const result = await this.storage.db.query(`
      SELECT * FROM knowledge_base WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) return null;

    return this.mapRowToArticle(result.rows[0]);
  }

  /**
   * Search articles
   */
  async searchArticles(options: KnowledgeSearchOptions): Promise<KnowledgeArticle[]> {
    let query = `SELECT * FROM knowledge_base WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    // Filter by category
    if (options.category) {
      query += ` AND category = $${paramCount}`;
      params.push(options.category);
      paramCount++;
    }

    // Filter by subcategory
    if (options.subcategory) {
      query += ` AND subcategory = $${paramCount}`;
      params.push(options.subcategory);
      paramCount++;
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      query += ` AND tags && $${paramCount}`;
      params.push(options.tags);
      paramCount++;
    }

    // Filter by status
    if (!options.includeArchived) {
      query += ` AND status != 'archived'`;
    }

    // Text search
    if (options.query) {
      query += ` AND (
        title ILIKE $${paramCount} OR
        content ILIKE $${paramCount} OR
        summary ILIKE $${paramCount}
      )`;
      params.push(`%${options.query}%`);
      paramCount++;
    }

    // Sort order
    if (options.sortBy === "usage") {
      query += ` ORDER BY (metadata->>'usageCount')::int DESC`;
    } else if (options.sortBy === "date") {
      query += ` ORDER BY created_at DESC`;
    } else {
      query += ` ORDER BY updated_at DESC`;
    }

    // Limit
    if (options.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(options.limit);
    }

    const result = await this.storage.db.query(query, params);

    return result.rows.map(row => this.mapRowToArticle(row));
  }

  /**
   * Semantic search using vector embeddings
   */
  async semanticSearch(
    query: string,
    category?: KnowledgeCategory,
    limit: number = 10
  ): Promise<Array<KnowledgeArticle & { similarity: number }>> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    let sql = `
      SELECT *,
      1 - (embedding::vector <=> $1::vector) as similarity
      FROM knowledge_base
      WHERE 1=1
    `;
    const params: any[] = [JSON.stringify(queryEmbedding)];
    let paramCount = 2;

    if (category) {
      sql += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    sql += ` AND status = 'published'`;
    sql += ` ORDER BY similarity DESC`;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);

    const result = await this.storage.db.query(sql, params);

    return result.rows.map(row => ({
      ...this.mapRowToArticle(row),
      similarity: parseFloat(row.similarity),
    }));
  }

  /**
   * Track usage of an article
   */
  async trackUsage(articleId: string, agentName: string, relevanceScore: number): Promise<void> {
    // Update usage count in metadata
    const article = await this.getArticleById(articleId);
    if (!article) return;

    const usageCount = (article.metadata.usageCount || 0) + 1;
    article.metadata.usageCount = usageCount;
    article.metadata.lastUsed = new Date();

    await this.storage.db.query(`
      UPDATE knowledge_base
      SET metadata = $2, updated_at = NOW()
      WHERE id = $1
    `, [articleId, JSON.stringify(article.metadata)]);

    // Log usage event
    await this.storage.db.query(`
      INSERT INTO knowledge_usage_log
      (id, article_id, agent_name, relevance_score, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [
      `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      articleId,
      agentName,
      relevanceScore,
    ]);
  }

  /**
   * Get usage metrics for an article
   */
  async getUsageMetrics(articleId: string): Promise<KnowledgeUsageMetrics | null> {
    const result = await this.storage.db.query(`
      SELECT
        article_id,
        COUNT(*) as total_references,
        ARRAY_AGG(DISTINCT agent_name) as referenced_by_agents,
        AVG(relevance_score) as average_relevance_score,
        MAX(created_at) as last_referenced
      FROM knowledge_usage_log
      WHERE article_id = $1
      GROUP BY article_id
    `, [articleId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Query successful applications from interventions
    // An intervention is considered a successful application if:
    // 1. It was approved (status = 'approved')
    // 2. The agent that created it referenced this article
    const interventionResult = await this.storage.db.query(`
      SELECT
        COUNT(CASE WHEN i.status = 'approved' THEN 1 END) as successful_applications,
        COUNT(*) as total_applications
      FROM interventions i
      WHERE i.agent_source IN (
        SELECT DISTINCT agent_id
        FROM knowledge_base_usage
        WHERE article_id = $1
      )
      AND i.created_at >= (
        SELECT MIN(referenced_at)
        FROM knowledge_base_usage
        WHERE article_id = $1
      )
    `, [articleId]);

    const interventionRow = interventionResult.rows[0] || { successful_applications: '0', total_applications: '0' };

    return {
      articleId,
      totalReferences: parseInt(row.total_references),
      referencedByAgents: row.referenced_by_agents,
      averageRelevanceScore: parseFloat(row.average_relevance_score),
      lastReferenced: row.last_referenced,
      successfulApplications: parseInt(interventionRow.successful_applications),
      totalApplications: parseInt(interventionRow.total_applications),
    };
  }

  /**
   * List all categories with article counts
   */
  async listCategories(): Promise<Array<{ category: KnowledgeCategory; count: number }>> {
    const result = await this.storage.db.query(`
      SELECT category, COUNT(*) as count
      FROM knowledge_base
      WHERE status = 'published'
      GROUP BY category
      ORDER BY category
    `);

    return result.rows.map(row => ({
      category: row.category as KnowledgeCategory,
      count: parseInt(row.count),
    }));
  }

  /**
   * List subcategories for a category
   */
  async listSubcategories(category: KnowledgeCategory): Promise<string[]> {
    const result = await this.storage.db.query(`
      SELECT DISTINCT subcategory
      FROM knowledge_base
      WHERE category = $1 AND subcategory IS NOT NULL AND status = 'published'
      ORDER BY subcategory
    `, [category]);

    return result.rows.map(row => row.subcategory);
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 50): Promise<Array<{ tag: string; count: number }>> {
    const result = await this.storage.db.query(`
      SELECT tag, COUNT(*) as count
      FROM knowledge_base, unnest(tags) as tag
      WHERE status = 'published'
      GROUP BY tag
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      tag: row.tag,
      count: parseInt(row.count),
    }));
  }

  /**
   * Delete an article (soft delete - archive)
   */
  async deleteArticle(id: string): Promise<void> {
    await this.storage.db.query(`
      UPDATE knowledge_base
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1
    `, [id]);
  }

  /**
   * Bulk import articles
   */
  async bulkImport(articles: Array<Omit<KnowledgeArticle, "id" | "createdAt" | "updatedAt">>): Promise<number> {
    let imported = 0;

    for (const article of articles) {
      try {
        await this.createArticle(article);
        imported++;
      } catch (error) {
        console.error(`Failed to import article: ${article.title}`, error);
      }
    }

    return imported;
  }

  /**
   * Generate embedding for text using OpenAI or fallback to simple hash
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Try to use OpenAI embeddings if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.embeddings.create({
          model: "text-embedding-3-small", // 1536 dimensions, cost-effective
          input: text.substring(0, 8000), // Limit to ~8k chars to stay under token limit
        });

        return response.data[0].embedding;
      } catch (error) {
        console.warn('[KnowledgeBase] OpenAI embedding failed, falling back to hash-based:', error);
      }
    }

    // Fallback: Simple hash-based embedding for MVP
    const hash = this.simpleHash(text);
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = ((hash + i) % 1000) / 1000 - 0.5;
    }
    return embedding;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Map database row to KnowledgeArticle
   */
  private mapRowToArticle(row: any): KnowledgeArticle {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      subcategory: row.subcategory,
      content: row.content,
      summary: row.summary,
      tags: row.tags,
      source: row.source,
      version: row.version,
      author: row.author,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/**
 * Singleton instance
 */
let kbInstance: KnowledgeBaseRepository | null = null;

export function initKnowledgeBaseRepository(storage: IStorage): KnowledgeBaseRepository {
  if (!kbInstance) {
    kbInstance = new KnowledgeBaseRepository(storage);
  }
  return kbInstance;
}

export function getKnowledgeBaseRepository(): KnowledgeBaseRepository {
  if (!kbInstance) {
    throw new Error("Knowledge Base Repository not initialized. Call initKnowledgeBaseRepository first.");
  }
  return kbInstance;
}
