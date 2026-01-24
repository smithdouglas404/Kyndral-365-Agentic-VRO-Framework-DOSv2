/**
 * ENHANCED KNOWLEDGE BASE REPOSITORY
 *
 * Extended knowledge base with:
 * - Agent tagging (which agents can use which documents)
 * - Trigger rules (auto-attach documents based on conditions)
 * - Form schemas (fillable forms for compliance, RCAs, etc.)
 * - Document types (guidelines, SOPs, RCAs, forms, templates)
 * - Agent-specific RAG filtering
 */

import type { IStorage } from '../storage.js';
import { getEmbeddingsService } from '../services/EmbeddingsService.js';
import { getNotificationService } from './NotificationService.js';

export type KnowledgeCategory =
  | 'pmbok'
  | 'prince2'
  | 'pmi_standard'
  | 'safe'
  | 'sop'
  | 'playbook'
  | 'lesson_learned'
  | 'best_practice'
  | 'template'
  | 'checklist'
  | 'rca'
  | 'guideline'
  | 'manual'
  | 'form';

export type DocumentType =
  | 'guideline'  // Best practice guidelines
  | 'manual'     // User manuals, how-tos
  | 'sop'        // Standard Operating Procedures
  | 'rca'        // Root Cause Analysis documents
  | 'form'       // Fillable forms
  | 'template'   // Document templates
  | 'policy';    // Organizational policies

export interface TriggerCondition {
  agentId: string;                     // Which agent triggers this
  condition: string;                   // e.g., "compliance_violation", "risk_high", "budget_exceeded"
  action: 'notify' | 'email' | 'attach_document' | 'escalate';
  targetAgents?: string[];             // Additional agents to notify
  emailTemplate?: string;
  notificationMessage?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface EnhancedKnowledgeArticle {
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

  // NEW: Agent-specific fields
  relevantAgents: string[];            // ['governance', 'risk', 'pm']
  documentType: DocumentType;
  triggerConditions?: TriggerCondition[];

  // NEW: Regulatory document fields
  countryCode?: string;                // 'US', 'EU', 'UK', 'APAC', 'INTL'
  industry?: string;                   // 'financial', 'healthcare', 'technology', 'manufacturing', 'government'
  standardName?: string;               // 'PMBOK', 'ISO 31000', 'GDPR', 'SOX', 'NIST CSF'
  isRegulatoryDoc?: boolean;           // true for regulatory/compliance documents
  isPredocumented?: boolean;           // true for system-seeded documents, false for user uploads
  applicablePhases?: string[];         // ['initiation', 'planning', 'execution', 'monitoring', 'closing']

  // NEW: For fillable forms
  formSchema?: {
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
      required?: boolean;
      options?: string[];  // For select fields
      validation?: string; // Regex or validation rule
    }>;
  };
  requiredFields?: string[];

  // Original fields
  metadata: {
    section?: string;
    chapter?: string;
    pageReference?: string;
    applicability?: string[];
    relatedArticles?: string[];
    successRate?: number;
    usageCount?: number;
    lastUsed?: Date;
    usedByAgents?: Record<string, number>; // Usage count per agent
  };

  embedding?: number[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedSearchOptions {
  category?: KnowledgeCategory;
  subcategory?: string;
  tags?: string[];
  query?: string;
  limit?: number;
  includeArchived?: boolean;
  sortBy?: 'relevance' | 'usage' | 'date';

  // NEW: Agent-specific filtering
  agentId?: string;                    // Filter to documents relevant to this agent
  documentType?: DocumentType;
  triggerCondition?: string;           // Find documents triggered by this condition
}

export class EnhancedKnowledgeBaseRepository {
  private storage: IStorage;
  private embeddingsService: any;

  constructor(storage: IStorage) {
    this.storage = storage;

    // Initialize embeddings service if available
    try {
      this.embeddingsService = getEmbeddingsService({
        provider: 'openai',
        model: 'text-embedding-3-small',
        dimensions: 1536,
        vectorDB: { type: 'memory' },
      });
    } catch (error) {
      console.warn('[EnhancedKB] Embeddings service not available, search will be limited');
    }
  }

  /**
   * Initialize database table with enhanced schema
   */
  async initializeTable(): Promise<void> {
    await this.storage.db.execute(`
      CREATE TABLE IF NOT EXISTS enhanced_knowledge_base (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        content TEXT NOT NULL,
        summary TEXT,
        tags TEXT[] DEFAULT '{}',
        source TEXT NOT NULL,
        version TEXT NOT NULL,
        author TEXT,

        -- Agent-specific fields
        relevant_agents TEXT[] DEFAULT '{}',
        document_type TEXT NOT NULL,
        trigger_conditions JSONB,

        -- Regulatory document fields
        country_code TEXT,
        industry TEXT,
        standard_name TEXT,
        is_regulatory_doc BOOLEAN DEFAULT false,
        is_predocumented BOOLEAN DEFAULT false,
        applicable_phases TEXT[] DEFAULT '{}',

        -- Form fields
        form_schema JSONB,
        required_fields TEXT[] DEFAULT '{}',

        -- Metadata
        metadata JSONB DEFAULT '{}',
        embedding VECTOR(1536),

        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_relevant_agents ON enhanced_knowledge_base USING GIN(relevant_agents)
    `);
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_document_type ON enhanced_knowledge_base(document_type)
    `);
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_tags ON enhanced_knowledge_base USING GIN(tags)
    `);
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_country_code ON enhanced_knowledge_base(country_code)
    `);
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_industry ON enhanced_knowledge_base(industry)
    `);
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_standard_name ON enhanced_knowledge_base(standard_name)
    `);
    await this.storage.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_kb_is_predocumented ON enhanced_knowledge_base(is_predocumented)
    `);

    console.log('[EnhancedKB] Database table initialized');
  }

  /**
   * Create knowledge article
   */
  async createArticle(
    article: Omit<EnhancedKnowledgeArticle, 'id' | 'createdAt' | 'updatedAt' | 'embedding'>
  ): Promise<EnhancedKnowledgeArticle> {
    const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate embedding
    let embedding: number[] = [];
    if (this.embeddingsService) {
      try {
        embedding = await this.embeddingsService.generateEmbedding(
          `${article.title} ${article.summary || ''} ${article.content.substring(0, 1000)}`
        );
      } catch (error) {
        console.warn('[EnhancedKB] Failed to generate embedding:', error);
      }
    }

    const now = new Date();
    const fullArticle: EnhancedKnowledgeArticle = {
      id,
      ...article,
      embedding,
      metadata: {
        usageCount: 0,
        usedByAgents: {},
        ...article.metadata,
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.storage.db.execute(
      `INSERT INTO enhanced_knowledge_base (
        id, title, category, subcategory, content, summary, tags, source, version, author,
        relevant_agents, document_type, trigger_conditions,
        country_code, industry, standard_name, is_regulatory_doc, is_predocumented, applicable_phases,
        form_schema, required_fields,
        metadata, embedding, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
      [
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
        fullArticle.relevantAgents,
        fullArticle.documentType,
        JSON.stringify(fullArticle.triggerConditions || []),
        fullArticle.countryCode || null,
        fullArticle.industry || null,
        fullArticle.standardName || null,
        fullArticle.isRegulatoryDoc || false,
        fullArticle.isPredocumented || false,
        fullArticle.applicablePhases || [],
        JSON.stringify(fullArticle.formSchema || null),
        fullArticle.requiredFields || [],
        JSON.stringify(fullArticle.metadata),
        embedding.length > 0 ? `[${embedding.join(',')}]` : null,
        fullArticle.status,
        fullArticle.createdAt,
        fullArticle.updatedAt,
      ]
    );

    console.log(`[EnhancedKB] Created article: ${fullArticle.id} (${fullArticle.documentType})`);

    return fullArticle;
  }

  /**
   * Search articles with agent-specific filtering
   */
  async searchArticles(options: EnhancedSearchOptions): Promise<EnhancedKnowledgeArticle[]> {
    let query = 'SELECT * FROM enhanced_knowledge_base WHERE status = $1';
    const params: any[] = [options.includeArchived ? 'archived' : 'published'];
    let paramIndex = 2;

    // Filter by agent
    if (options.agentId) {
      query += ` AND $${paramIndex} = ANY(relevant_agents)`;
      params.push(options.agentId);
      paramIndex++;
    }

    // Filter by document type
    if (options.documentType) {
      query += ` AND document_type = $${paramIndex}`;
      params.push(options.documentType);
      paramIndex++;
    }

    // Filter by category
    if (options.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(options.category);
      paramIndex++;
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      params.push(options.tags);
      paramIndex++;
    }

    // Full-text search
    if (options.query) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${options.query}%`);
      paramIndex++;
    }

    // Sorting
    if (options.sortBy === 'usage') {
      query += ` ORDER BY (metadata->>'usageCount')::int DESC`;
    } else if (options.sortBy === 'date') {
      query += ` ORDER BY created_at DESC`;
    } else {
      query += ` ORDER BY updated_at DESC`;
    }

    // Limit
    query += ` LIMIT ${options.limit || 50}`;

    const result = await this.storage.db.query(query, params);
    return result.rows.map(this.rowToArticle);
  }

  /**
   * Semantic search for agent (using embeddings)
   */
  async semanticSearchForAgent(
    agentId: string,
    query: string,
    options: {
      limit?: number;
      documentTypes?: DocumentType[];
      threshold?: number;
    } = {}
  ): Promise<EnhancedKnowledgeArticle[]> {
    if (!this.embeddingsService) {
      console.warn('[EnhancedKB] Embeddings not available, falling back to text search');
      return this.searchArticles({
        agentId,
        query,
        limit: options.limit,
      });
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query);

      // Search using vector similarity
      let sqlQuery = `
        SELECT *, (embedding <=> $1::vector) AS distance
        FROM enhanced_knowledge_base
        WHERE status = 'published'
          AND $2 = ANY(relevant_agents)
      `;
      const params: any[] = [`[${queryEmbedding.join(',')}]`, agentId];
      let paramIndex = 3;

      if (options.documentTypes && options.documentTypes.length > 0) {
        sqlQuery += ` AND document_type = ANY($${paramIndex})`;
        params.push(options.documentTypes);
        paramIndex++;
      }

      sqlQuery += ` ORDER BY distance ASC LIMIT ${options.limit || 10}`;

      const result = await this.storage.db.query(sqlQuery, params);
      return result.rows.map(this.rowToArticle);
    } catch (error) {
      console.error('[EnhancedKB] Semantic search failed:', error);
      return this.searchArticles({ agentId, query, limit: options.limit });
    }
  }

  /**
   * Get articles triggered by condition
   */
  async getTriggeredArticles(
    agentId: string,
    condition: string
  ): Promise<EnhancedKnowledgeArticle[]> {
    const query = `
      SELECT * FROM enhanced_knowledge_base
      WHERE status = 'published'
        AND $1 = ANY(relevant_agents)
        AND trigger_conditions @> $2::jsonb
    `;

    const triggerFilter = JSON.stringify([{ agentId, condition }]);
    const result = await this.storage.db.query(query, [agentId, triggerFilter]);

    return result.rows.map(this.rowToArticle);
  }

  /**
   * Execute trigger actions for a given condition
   * This method fires notifications, emails, and inter-agent messages based on trigger rules
   */
  async executeTriggerActions(
    agentId: string,
    condition: string,
    context?: {
      userId?: string;
      projectId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; actionsExecuted: number; errors: string[] }> {
    try {
      console.log(`[EnhancedKB] Executing trigger actions for ${agentId}:${condition}`);

      // Get triggered articles
      const articles = await this.getTriggeredArticles(agentId, condition);

      if (articles.length === 0) {
        console.log(`[EnhancedKB] No articles triggered for ${agentId}:${condition}`);
        return { success: true, actionsExecuted: 0, errors: [] };
      }

      const notificationService = getNotificationService();
      let actionsExecuted = 0;
      const errors: string[] = [];

      // Execute actions for each triggered article
      for (const article of articles) {
        if (!article.triggerConditions) continue;

        // Find matching trigger conditions
        const matchingTriggers = article.triggerConditions.filter(
          (trigger) => trigger.agentId === agentId && trigger.condition === condition
        );

        for (const trigger of matchingTriggers) {
          try {
            // Execute action based on type
            switch (trigger.action) {
              case 'email':
                if (context?.userId) {
                  await notificationService.sendEmail({
                    to: context.userId, // Assuming userId is email
                    subject: `Alert: ${article.title}`,
                    body: `Condition "${condition}" was triggered for agent ${agentId}.\n\n${article.content}\n\nView document: [article link]`,
                    htmlBody: `<h2>Alert: ${article.title}</h2>
                      <p>Condition <strong>"${condition}"</strong> was triggered for agent <strong>${agentId}</strong>.</p>
                      <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #0078D4;">
                        ${article.content.replace(/\n/g, '<br>')}
                      </div>
                      <p><a href="/knowledge-base/${article.id}">View document</a></p>`,
                  });
                  actionsExecuted++;
                  console.log(`[EnhancedKB] Email sent for article: ${article.title}`);
                }
                break;

              case 'notify':
                if (context?.userId) {
                  await notificationService.sendInApp({
                    userId: context.userId,
                    agentId: agentId,
                    title: `${agentId.toUpperCase()}: ${article.title}`,
                    message: `Condition "${condition}" triggered. ${article.content.substring(0, 200)}...`,
                    actionUrl: `/knowledge-base/${article.id}`,
                    priority: condition.includes('high') || condition.includes('critical') ? 'high' : 'normal',
                    metadata: {
                      articleId: article.id,
                      condition: condition,
                      triggerId: trigger.agentId,
                      ...context.metadata,
                    },
                  });
                  actionsExecuted++;
                  console.log(`[EnhancedKB] In-app notification sent for article: ${article.title}`);
                }
                break;

              case 'attach_document':
                // Document is already retrieved by getTriggeredArticles
                // This action just logs that the document should be attached to the conversation
                console.log(`[EnhancedKB] Document attached: ${article.id} - ${article.title}`);
                actionsExecuted++;
                break;

              case 'escalate':
                // Send notifications to target agents
                if (trigger.targetAgents && trigger.targetAgents.length > 0) {
                  for (const targetAgent of trigger.targetAgents) {
                    if (context?.userId) {
                      await notificationService.sendInApp({
                        userId: context.userId,
                        agentId: targetAgent,
                        title: `Escalation from ${agentId}: ${article.title}`,
                        message: `Agent ${agentId} escalated condition "${condition}". ${article.content.substring(0, 200)}...`,
                        actionUrl: `/knowledge-base/${article.id}`,
                        priority: 'urgent',
                        metadata: {
                          articleId: article.id,
                          condition: condition,
                          sourceAgent: agentId,
                          targetAgent: targetAgent,
                          ...context.metadata,
                        },
                      });

                      // Also send email for escalations
                      await notificationService.sendEmail({
                        to: context.userId,
                        subject: `ESCALATION: ${article.title}`,
                        body: `Agent ${agentId} has escalated a ${condition} condition to ${targetAgent}.\n\nDocument: ${article.title}\n\n${article.content}`,
                        htmlBody: `<h2 style="color: #d32f2f;">ESCALATION: ${article.title}</h2>
                          <p>Agent <strong>${agentId}</strong> has escalated a <strong>${condition}</strong> condition to <strong>${targetAgent}</strong>.</p>
                          <div style="margin: 20px 0; padding: 15px; background: #ffebee; border-left: 4px solid #d32f2f;">
                            ${article.content.replace(/\n/g, '<br>')}
                          </div>
                          <p><a href="/knowledge-base/${article.id}">View document</a></p>`,
                      });
                    }
                    console.log(`[EnhancedKB] Escalated to ${targetAgent} for article: ${article.title}`);
                  }
                  actionsExecuted++;
                }
                break;

              default:
                console.warn(`[EnhancedKB] Unknown trigger action: ${trigger.action}`);
            }
          } catch (actionError: any) {
            console.error(`[EnhancedKB] Error executing action ${trigger.action}:`, actionError);
            errors.push(`${trigger.action}: ${actionError.message}`);
          }
        }
      }

      console.log(`[EnhancedKB] Executed ${actionsExecuted} trigger actions for ${agentId}:${condition}`);

      return {
        success: errors.length === 0,
        actionsExecuted,
        errors,
      };
    } catch (error: any) {
      console.error('[EnhancedKB] Failed to execute trigger actions:', error);
      return {
        success: false,
        actionsExecuted: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Record article usage by agent
   */
  async recordUsage(articleId: string, agentId: string): Promise<void> {
    await this.storage.db.execute(
      `UPDATE enhanced_knowledge_base
       SET metadata = jsonb_set(
         jsonb_set(
           metadata,
           '{usageCount}',
           (COALESCE((metadata->>'usageCount')::int, 0) + 1)::text::jsonb
         ),
         '{usedByAgents,${agentId}}',
         (COALESCE((metadata->'usedByAgents'->'${agentId}')::int, 0) + 1)::text::jsonb
       ),
       updated_at = NOW()
       WHERE id = $1`,
      [articleId]
    );
  }

  /**
   * Get most used articles by agent
   */
  async getTopArticlesForAgent(agentId: string, limit: number = 10): Promise<EnhancedKnowledgeArticle[]> {
    const query = `
      SELECT * FROM enhanced_knowledge_base
      WHERE status = 'published'
        AND $1 = ANY(relevant_agents)
      ORDER BY (metadata->'usedByAgents'->$1)::int DESC NULLS LAST
      LIMIT $2
    `;

    const result = await this.storage.db.query(query, [agentId, limit]);
    return result.rows.map(this.rowToArticle);
  }

  /**
   * Get fillable forms for agent
   */
  async getFormsForAgent(agentId: string): Promise<EnhancedKnowledgeArticle[]> {
    return this.searchArticles({
      agentId,
      documentType: 'form',
      limit: 100,
    });
  }

  /**
   * Convert database row to article object
   */
  private rowToArticle(row: any): EnhancedKnowledgeArticle {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      subcategory: row.subcategory,
      content: row.content,
      summary: row.summary,
      tags: row.tags || [],
      source: row.source,
      version: row.version,
      author: row.author,
      relevantAgents: row.relevant_agents || [],
      documentType: row.document_type,
      triggerConditions: row.trigger_conditions ? JSON.parse(row.trigger_conditions) : [],
      countryCode: row.country_code,
      industry: row.industry,
      standardName: row.standard_name,
      isRegulatoryDoc: row.is_regulatory_doc,
      isPredocumented: row.is_predocumented,
      applicablePhases: row.applicable_phases || [],
      formSchema: row.form_schema ? JSON.parse(row.form_schema) : undefined,
      requiredFields: row.required_fields || [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Get articles by IDs
   */
  async getArticlesByIds(ids: string[]): Promise<EnhancedKnowledgeArticle[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT * FROM enhanced_knowledge_base WHERE id IN (${placeholders})`;

    const result = await this.storage.db.query(query, ids);
    return result.rows.map(this.rowToArticle);
  }

  /**
   * Get document usage information
   * Returns where and how a document is being used
   */
  async getDocumentUsage(id: string): Promise<{
    isInUse: boolean;
    usageDetails: {
      agentCount: number;
      agents: Array<{ agentId: string; agentName: string }>;
      triggerRules: Array<{ articleId: string; articleTitle: string; condition: string }>;
      relatedArticles: Array<{ articleId: string; articleTitle: string }>;
      camundaRules: Array<{ ruleId: string; ruleName: string }>;
      totalReferences: number;
    };
  }> {
    const article = await this.getArticlesByIds([id]);
    if (article.length === 0) {
      return {
        isInUse: false,
        usageDetails: {
          agentCount: 0,
          agents: [],
          triggerRules: [],
          relatedArticles: [],
          camundaRules: [],
          totalReferences: 0,
        },
      };
    }

    const doc = article[0];
    const usageDetails = {
      agentCount: doc.relevantAgents?.length || 0,
      agents: (doc.relevantAgents || []).map((agentId) => ({
        agentId,
        agentName: agentId.toUpperCase() + ' Agent',
      })),
      triggerRules: [] as Array<{ articleId: string; articleTitle: string; condition: string }>,
      relatedArticles: [] as Array<{ articleId: string; articleTitle: string }>,
      camundaRules: [] as Array<{ ruleId: string; ruleName: string }>,
      totalReferences: 0,
    };

    // Check if document has active trigger conditions
    if (doc.triggerConditions && doc.triggerConditions.length > 0) {
      usageDetails.triggerRules = doc.triggerConditions.map((trigger) => ({
        articleId: doc.id,
        articleTitle: doc.title,
        condition: trigger.condition,
      }));
    }

    // Check if document is referenced by other articles
    const referencingDocs = await this.storage.db.query(
      `SELECT id, title FROM enhanced_knowledge_base
       WHERE status = 'published'
       AND metadata @> $1::jsonb`,
      [JSON.stringify({ relatedArticles: [id] })]
    );

    if (referencingDocs.rows.length > 0) {
      usageDetails.relatedArticles = referencingDocs.rows.map((row) => ({
        articleId: row.id,
        articleTitle: row.title,
      }));
    }

    // Check usage count from metadata
    const usageCount = doc.metadata?.usageCount || 0;

    usageDetails.totalReferences =
      usageDetails.agentCount +
      usageDetails.triggerRules.length +
      usageDetails.relatedArticles.length +
      usageCount;

    const isInUse =
      usageDetails.agentCount > 0 ||
      usageDetails.triggerRules.length > 0 ||
      usageDetails.relatedArticles.length > 0 ||
      usageCount > 0;

    return { isInUse, usageDetails };
  }

  /**
   * Delete article (with optional force flag to bypass usage check)
   */
  async deleteArticle(id: string, force: boolean = false): Promise<void> {
    // Check usage before deletion
    if (!force) {
      const usage = await this.getDocumentUsage(id);
      if (usage.isInUse) {
        throw new Error(
          `Cannot delete document: it is currently in use by ${usage.usageDetails.totalReferences} reference(s). ` +
          `Use force=true to delete anyway, or replace the document first.`
        );
      }
    }

    await this.storage.db.execute('DELETE FROM enhanced_knowledge_base WHERE id = $1', [id]);
    console.log(`[EnhancedKB] Deleted article: ${id} (force=${force})`);
  }

  /**
   * Replace a document with another document
   * Updates all references to point to the new document
   */
  async replaceDocument(oldId: string, newId: string): Promise<void> {
    const oldDoc = await this.getArticlesByIds([oldId]);
    const newDoc = await this.getArticlesByIds([newId]);

    if (oldDoc.length === 0) {
      throw new Error(`Source document ${oldId} not found`);
    }
    if (newDoc.length === 0) {
      throw new Error(`Replacement document ${newId} not found`);
    }

    // Transfer agents from old to new document
    const combinedAgents = Array.from(
      new Set([...(newDoc[0].relevantAgents || []), ...(oldDoc[0].relevantAgents || [])])
    );

    await this.updateArticle(newId, {
      relevantAgents: combinedAgents,
    });

    // Update references in other documents
    await this.storage.db.execute(
      `UPDATE enhanced_knowledge_base
       SET metadata = jsonb_set(
         metadata,
         '{relatedArticles}',
         (
           SELECT jsonb_agg(
             CASE
               WHEN value::text = $1 THEN to_jsonb($2::text)
               ELSE value
             END
           )
           FROM jsonb_array_elements(metadata->'relatedArticles')
         ),
         true
       )
       WHERE metadata->'relatedArticles' @> $3::jsonb`,
      [`"${oldId}"`, newId, JSON.stringify([oldId])]
    );

    console.log(`[EnhancedKB] Replaced document ${oldId} with ${newId}`);
  }

  /**
   * Update article
   */
  async updateArticle(
    id: string,
    updates: Partial<Omit<EnhancedKnowledgeArticle, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<EnhancedKnowledgeArticle> {
    const existing = await this.getArticlesByIds([id]);
    if (existing.length === 0) {
      throw new Error(`Article ${id} not found`);
    }

    const updated = { ...existing[0], ...updates, updatedAt: new Date() };

    // Regenerate embedding if content changed
    if (updates.content || updates.title || updates.summary) {
      if (this.embeddingsService) {
        try {
          updated.embedding = await this.embeddingsService.generateEmbedding(
            `${updated.title} ${updated.summary || ''} ${updated.content.substring(0, 1000)}`
          );
        } catch (error) {
          console.warn('[EnhancedKB] Failed to regenerate embedding:', error);
        }
      }
    }

    await this.storage.db.execute(
      `UPDATE enhanced_knowledge_base SET
        title = $2, category = $3, subcategory = $4, content = $5, summary = $6,
        tags = $7, source = $8, version = $9, author = $10,
        relevant_agents = $11, document_type = $12, trigger_conditions = $13,
        country_code = $14, industry = $15, standard_name = $16,
        is_regulatory_doc = $17, is_predocumented = $18, applicable_phases = $19,
        form_schema = $20, required_fields = $21, metadata = $22,
        embedding = $23, status = $24, updated_at = $25
       WHERE id = $1`,
      [
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
        updated.relevantAgents,
        updated.documentType,
        JSON.stringify(updated.triggerConditions || []),
        updated.countryCode || null,
        updated.industry || null,
        updated.standardName || null,
        updated.isRegulatoryDoc || false,
        updated.isPredocumented || false,
        updated.applicablePhases || [],
        JSON.stringify(updated.formSchema || null),
        updated.requiredFields || [],
        JSON.stringify(updated.metadata),
        updated.embedding ? `[${updated.embedding.join(',')}]` : null,
        updated.status,
        updated.updatedAt,
      ]
    );

    console.log(`[EnhancedKB] Updated article: ${id}`);
    return updated;
  }
}

/**
 * Singleton instance
 */
let enhancedKBInstance: EnhancedKnowledgeBaseRepository | null = null;

export function getEnhancedKnowledgeBase(storage: IStorage): EnhancedKnowledgeBaseRepository {
  if (!enhancedKBInstance) {
    enhancedKBInstance = new EnhancedKnowledgeBaseRepository(storage);
    enhancedKBInstance.initializeTable().catch(console.error);
  }
  return enhancedKBInstance;
}
