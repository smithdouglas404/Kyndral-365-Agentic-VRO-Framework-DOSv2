/**
 * AGENT RAG SERVICE
 *
 * Retrieval Augmented Generation service for agent learning and knowledge retrieval.
 *
 * Capabilities:
 * 1. Store agent decisions with embeddings
 * 2. Find similar historical decisions
 * 3. Find matching outcome patterns
 * 4. Search knowledge base (SOPs, PMBOK, playbooks)
 * 5. Record outcomes for learning loop
 * 6. Extract and store patterns
 */

import Anthropic from "@anthropic-ai/sdk";
import type { IStorage } from "../storage.js";

interface SimilarDecision {
  decisionId: string;
  agentName: string;
  decisionType: string;
  recommendation: string;
  reasoning: string;
  outcome: any;
  similarity: number;
  projectContext: any;
  confidence: number;
}

interface PatternMatch {
  patternId: string;
  patternName: string;
  signature: any;
  typicalOutcome: any;
  successInterventions: any[];
  failedInterventions: any[];
  successRate: number;
  occurrenceCount: number;
  similarity: number;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  similarity: number;
}

export class AgentRAGService {
  private anthropic: Anthropic;
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.storage = storage;
  }

  /**
   * Generate embedding for text
   * Uses a simple deterministic hash-based embedding for MVP
   * In production, consider using Claude or a dedicated embedding model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.simpleHashEmbedding(text);
  }

  /**
   * Simple deterministic embedding (for MVP)
   * Creates a 1536-dimensional vector from text
   * In production, use proper embedding model (Claude, OpenAI, etc.)
   */
  private simpleHashEmbedding(text: string): number[] {
    const embedding = new Array(1536).fill(0);
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter(w => w.length > 2);

    // TF-IDF-like approach
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Distribute word influence across embedding dimensions
    Object.entries(wordFreq).forEach(([word, freq]) => {
      const hash = this.hashString(word);
      const weight = Math.log(1 + freq); // Log-scaled frequency

      // Spread each word across multiple dimensions
      for (let i = 0; i < 5; i++) {
        const idx = (hash + i * 307) % 1536; // Prime number spread
        embedding[idx] += weight;
      }
    });

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Store agent decision in memory with embedding
   */
  async storeDecision(decision: {
    agentName: string;
    decisionType: string;
    projectId?: string;
    contextSnapshot: any;
    recommendation: string;
    reasoning: string;
    confidenceScore: number;
    predictedOutcome: any;
  }): Promise<string> {
    const id = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create semantic representation for embedding
    const semanticText = `${decision.agentName} ${decision.decisionType} ${decision.recommendation} ${decision.reasoning} ${JSON.stringify(decision.contextSnapshot)}`;
    const embedding = await this.generateEmbedding(semanticText);

    await this.storage.db.query(`
      INSERT INTO agent_decision_history
      (id, agent_name, decision_type, project_id, context_snapshot, recommendation, reasoning, confidence_score, predicted_outcome, embedding, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      id,
      decision.agentName,
      decision.decisionType,
      decision.projectId || null,
      JSON.stringify(decision.contextSnapshot),
      decision.recommendation,
      decision.reasoning,
      decision.confidenceScore,
      JSON.stringify(decision.predictedOutcome),
      JSON.stringify(embedding),
    ]);

    console.log(`[RAG] Stored decision ${id} for ${decision.agentName}`);
    return id;
  }

  /**
   * Find similar decisions from history (RAG retrieval)
   */
  async findSimilarDecisions(
    currentContext: any,
    agentName: string,
    limit: number = 5
  ): Promise<SimilarDecision[]> {
    // Create query embedding
    const queryText = JSON.stringify(currentContext);
    const queryEmbedding = await this.generateEmbedding(queryText);

    const result = await this.storage.db.query(`
      SELECT
        id,
        agent_name,
        decision_type,
        recommendation,
        reasoning,
        actual_outcome,
        context_snapshot,
        confidence_score,
        1 - (embedding <=> $1::vector) as similarity
      FROM agent_decision_history
      WHERE agent_name = $2
        AND actual_outcome IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `, [JSON.stringify(queryEmbedding), agentName, limit]);

    return result.rows.map(row => ({
      decisionId: row.id,
      agentName: row.agent_name,
      decisionType: row.decision_type,
      recommendation: row.recommendation,
      reasoning: row.reasoning,
      outcome: row.actual_outcome,
      similarity: parseFloat(row.similarity) || 0,
      projectContext: row.context_snapshot,
      confidence: parseFloat(row.confidence_score) || 0,
    }));
  }

  /**
   * Find matching patterns from historical projects
   */
  async findPatternMatches(
    projectSignature: any,
    limit: number = 3
  ): Promise<PatternMatch[]> {
    const signatureText = JSON.stringify(projectSignature);
    const embedding = await this.generateEmbedding(signatureText);

    const result = await this.storage.db.query(`
      SELECT
        id,
        pattern_name,
        pattern_signature,
        typical_outcome,
        success_interventions,
        failed_interventions,
        success_rate,
        occurrence_count,
        1 - (embedding <=> $1::vector) as similarity
      FROM project_outcome_patterns
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `, [JSON.stringify(embedding), limit]);

    return result.rows.map(row => ({
      patternId: row.id,
      patternName: row.pattern_name,
      signature: row.pattern_signature,
      typicalOutcome: row.typical_outcome,
      successInterventions: row.success_interventions || [],
      failedInterventions: row.failed_interventions || [],
      successRate: parseFloat(row.success_rate) || 0,
      occurrenceCount: parseInt(row.occurrence_count) || 0,
      similarity: parseFloat(row.similarity) || 0,
    }));
  }

  /**
   * Search knowledge base (SOPs, playbooks, PMBOK)
   */
  async searchKnowledge(
    query: string,
    category?: string,
    limit: number = 5
  ): Promise<KnowledgeArticle[]> {
    const embedding = await this.generateEmbedding(query);

    const sql = category
      ? `
        SELECT
          id,
          title,
          content,
          category,
          tags,
          source,
          1 - (embedding <=> $1::vector) as similarity
        FROM knowledge_base
        WHERE category = $3
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `
      : `
        SELECT
          id,
          title,
          content,
          category,
          tags,
          source,
          1 - (embedding <=> $1::vector) as similarity
        FROM knowledge_base
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

    const params = category
      ? [JSON.stringify(embedding), limit, category]
      : [JSON.stringify(embedding), limit];

    const result = await this.storage.db.query(sql, params);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags || [],
      source: row.source || 'Unknown',
      similarity: parseFloat(row.similarity) || 0,
    }));
  }

  /**
   * Record outcome feedback (learning loop)
   */
  async recordOutcome(
    decisionId: string,
    actualOutcome: any,
    accuracyScore?: number
  ): Promise<void> {
    // Update decision history with actual outcome
    await this.storage.db.query(`
      UPDATE agent_decision_history
      SET actual_outcome = $1, outcome_measured_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(actualOutcome), decisionId]);

    // Create learning feedback
    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.storage.db.query(`
      INSERT INTO agent_learning_feedback
      (id, decision_id, feedback_type, actual_result, accuracy_score, created_at)
      VALUES ($1, $2, 'outcome_confirmed', $3, $4, NOW())
    `, [
      feedbackId,
      decisionId,
      JSON.stringify(actualOutcome),
      accuracyScore || null,
    ]);

    console.log(`[RAG] Recorded outcome for decision ${decisionId}, accuracy: ${accuracyScore || 'N/A'}`);

    // Extract and store pattern (async, non-blocking)
    this.extractAndStorePattern(decisionId).catch(err => {
      console.error(`[RAG] Pattern extraction failed for ${decisionId}:`, err);
    });
  }

  /**
   * Extract pattern from successful/failed decision and store in pattern library
   */
  private async extractAndStorePattern(decisionId: string): Promise<void> {
    try {
      // Get decision details
      const result = await this.storage.db.query(`
        SELECT * FROM agent_decision_history WHERE id = $1
      `, [decisionId]);

      if (result.rows.length === 0) return;

      const decision = result.rows[0];

      // Use Claude to extract reusable pattern
      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Analyze this agent decision and extract a reusable pattern if applicable:

Decision Type: ${decision.decision_type}
Context: ${JSON.stringify(decision.context_snapshot, null, 2)}
Recommendation: ${decision.recommendation}
Outcome: ${JSON.stringify(decision.actual_outcome, null, 2)}

If this represents a repeatable pattern (e.g., "CPI drop below 0.85 at 40% completion"), extract:
1. Pattern name
2. Key signature (what conditions define this pattern)
3. Typical outcome
4. Successful interventions

Respond with JSON or "NO_PATTERN" if not a repeatable pattern.`
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') return;

      const text = content.text.trim();
      if (text === 'NO_PATTERN' || !text.includes('{')) return;

      // Parse pattern
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;

      const pattern = JSON.parse(jsonMatch[0]);

      // Check if pattern already exists
      const existingPattern = await this.storage.db.query(`
        SELECT id, occurrence_count, observed_projects
        FROM project_outcome_patterns
        WHERE pattern_name = $1
      `, [pattern.patternName]);

      if (existingPattern.rows.length > 0) {
        // Update existing pattern
        const existing = existingPattern.rows[0];
        const projectId = decision.project_id;
        const observedProjects = existing.observed_projects || [];
        if (projectId && !observedProjects.includes(projectId)) {
          observedProjects.push(projectId);
        }

        await this.storage.db.query(`
          UPDATE project_outcome_patterns
          SET
            occurrence_count = occurrence_count + 1,
            observed_projects = $1,
            last_observed = NOW()
          WHERE id = $2
        `, [observedProjects, existing.id]);

        console.log(`[RAG] Updated existing pattern: ${pattern.patternName}`);
      } else {
        // Create new pattern
        const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const embedding = await this.generateEmbedding(JSON.stringify(pattern.signature));

        await this.storage.db.query(`
          INSERT INTO project_outcome_patterns
          (id, pattern_name, pattern_signature, observed_projects, typical_outcome, success_interventions, occurrence_count, embedding, last_observed)
          VALUES ($1, $2, $3, $4, $5, $6, 1, $7, NOW())
        `, [
          patternId,
          pattern.patternName,
          JSON.stringify(pattern.signature),
          decision.project_id ? [decision.project_id] : [],
          JSON.stringify(pattern.typicalOutcome),
          JSON.stringify(pattern.successInterventions || []),
          JSON.stringify(embedding),
        ]);

        console.log(`[RAG] Created new pattern: ${pattern.patternName}`);
      }
    } catch (error) {
      console.error('[RAG] Pattern extraction error:', error);
    }
  }

  /**
   * Store knowledge base article
   */
  async storeKnowledge(knowledge: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    source?: string;
    metadata?: any;
  }): Promise<string> {
    const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const embedding = await this.generateEmbedding(`${knowledge.title} ${knowledge.content}`);

    await this.storage.db.query(`
      INSERT INTO knowledge_base
      (id, title, content, category, tags, source, metadata, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      id,
      knowledge.title,
      knowledge.content,
      knowledge.category,
      knowledge.tags || [],
      knowledge.source || 'Internal',
      JSON.stringify(knowledge.metadata || {}),
      JSON.stringify(embedding),
    ]);

    console.log(`[RAG] Stored knowledge: ${knowledge.title}`);
    return id;
  }

  /**
   * Get agent accuracy stats
   */
  async getAgentAccuracy(agentName: string): Promise<{
    totalDecisions: number;
    measuredOutcomes: number;
    averageAccuracy: number;
  }> {
    const result = await this.storage.db.query(`
      SELECT
        COUNT(*) as total_decisions,
        COUNT(actual_outcome) as measured_outcomes,
        AVG(
          CASE
            WHEN lf.accuracy_score IS NOT NULL THEN lf.accuracy_score
            ELSE NULL
          END
        ) as average_accuracy
      FROM agent_decision_history adh
      LEFT JOIN agent_learning_feedback lf ON lf.decision_id = adh.id
      WHERE adh.agent_name = $1
    `, [agentName]);

    const row = result.rows[0];
    return {
      totalDecisions: parseInt(row.total_decisions) || 0,
      measuredOutcomes: parseInt(row.measured_outcomes) || 0,
      averageAccuracy: parseFloat(row.average_accuracy) || 0,
    };
  }

  /**
   * Get popular knowledge articles
   */
  async getPopularKnowledge(limit: number = 10): Promise<any[]> {
    const result = await this.storage.db.query(`
      SELECT
        id,
        title,
        category,
        source,
        tags
      FROM knowledge_base
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}
