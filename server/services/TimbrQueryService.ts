/**
 * TIMBR QUERY SERVICE
 *
 * Provides semantic query capabilities for the K360 ontology.
 * Can use Timbr.ai (if configured) or fall back to local PostgreSQL
 * with ontology-based query rewriting.
 *
 * This service enables cross-domain insights by translating semantic
 * queries into data queries against the underlying tables.
 */

import { ontologyService } from '../ontology/index.js';
import { storage } from '../storage.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

// Timbr.ai configuration
interface TimbrConfig {
  endpoint: string;
  knowledgeGraph: string;
  apiKey: string;
  enabled: boolean;
}

// Query result types
interface SemanticQueryResult {
  entities: Record<string, any>[];
  count: number;
  query: string;
  source: 'timbr' | 'local';
  executionTime: number;
}

interface CrossDomainInsight {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedEntities: string[];
  recommendedActions: string[];
  sourceAgents: string[];
  confidence: number;
}

// Concept to table mapping (derived from timbr-mapping.yaml)
const CONCEPT_TABLE_MAP: Record<string, string> = {
  // SAFe hierarchy
  'safe:Portfolio': 'portfolios',
  'safe:ValueStream': 'value_streams',
  'safe:ART': 'arts',
  'safe:Team': 'teams',
  'safe:Division': 'divisions',
  'safe:Epic': 'epics',
  'safe:Feature': 'features',
  'safe:Story': 'stories',
  'safe:Task': 'tasks',
  'safe:ProgramIncrement': 'program_increments',
  'safe:Sprint': 'sprints',

  // K360 agent domains
  'k360:Project': 'projects',
  'k360:Program': 'programs',
  'k360:Investment': 'investments',
  'k360:Budget': 'budgets',
  'k360:Risk': 'risks',
  'k360:Policy': 'company_rules',
  'k360:Objective': 'strategic_objectives',
  'k360:KeyResult': 'key_results',
  'k360:Stakeholder': 'stakeholders',
  'k360:Resource': 'resources',
  'k360:Notification': 'notifications',
  'k360:AuditTrail': 'audit_logs',

  // Computed concepts (semantic views)
  'k360:OrphanedProject': 'v_orphaned_projects',
  'k360:OverAllocatedResource': 'v_over_allocated_resources',
  'k360:AtRiskProject': 'v_at_risk_projects',
  'k360:UnmitigatedCriticalRisk': 'v_unmitigated_critical_risks',
  'k360:DependencyBottleneck': 'v_dependency_bottlenecks',
  'k360:BudgetScheduleCorrelation': 'v_budget_schedule_correlation',
  'k360:LowVelocityTeam': 'v_low_velocity_projects',
  'k360:AlignmentScore': 'v_strategic_alignment',
  'k360:CrossDomainInsight': 'v_cross_domain_summary',
  'k360:AgentDomainEntity': 'v_agent_domain_entities',

  // Fallbacks
  'k360:Entity': 'company_ontology_instances',
};

// Property to column mapping
const PROPERTY_COLUMN_MAP: Record<string, string> = {
  'rdfs:label': 'name',
  'k360:projectStatus': 'status',
  'k360:percentComplete': 'percent_complete',
  'k360:budgetAmount': 'budget',
  'k360:actualSpend': 'actual_spend',
  'k360:budgetUtilization': 'utilization',
  'k360:riskSeverity': 'severity',
  'k360:riskProbability': 'probability',
  'k360:riskImpact': 'impact',
  'k360:keyResultProgress': 'progress',
  'k360:alignmentScoreValue': 'alignment_score',
  'k360:adoptionRate': 'adoption_rate',
  'k360:healthScore': 'health_score',
};

class TimbrQueryService {
  private config: TimbrConfig;
  private initialized = false;

  constructor() {
    this.config = {
      endpoint: process.env.TIMBR_ENDPOINT || '',
      knowledgeGraph: process.env.TIMBR_KNOWLEDGE_GRAPH || 'k360_enterprise_ontology',
      apiKey: process.env.TIMBR_API_KEY || '',
      enabled: !!(process.env.TIMBR_ENDPOINT && process.env.TIMBR_API_KEY),
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure ontology is loaded
    await ontologyService.loadOntologies();

    if (this.config.enabled) {
      console.log('[TimbrQueryService] Timbr.ai integration enabled');
      console.log(`[TimbrQueryService] Endpoint: ${this.config.endpoint}`);
      console.log(`[TimbrQueryService] Knowledge Graph: ${this.config.knowledgeGraph}`);
    } else {
      console.log('[TimbrQueryService] Using local semantic query engine (Timbr not configured)');
    }

    this.initialized = true;
  }

  /**
   * Execute a semantic query against the knowledge graph
   */
  async query(
    concept: string,
    filters?: Record<string, any>,
    limit = 100
  ): Promise<SemanticQueryResult> {
    const startTime = Date.now();

    if (this.config.enabled) {
      return this.executeTimbrQuery(concept, filters, limit, startTime);
    } else {
      return this.executeLocalQuery(concept, filters, limit, startTime);
    }
  }

  /**
   * Execute query via Timbr.ai
   */
  private async executeTimbrQuery(
    concept: string,
    filters: Record<string, any> | undefined,
    limit: number,
    startTime: number
  ): Promise<SemanticQueryResult> {
    // Build semantic SQL for Timbr
    let query = `SELECT * FROM \`${concept}\``;

    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters)
        .map(([key, value]) => `\`${key}\` = '${value}'`)
        .join(' AND ');
      query += ` WHERE ${conditions}`;
    }

    query += ` LIMIT ${limit}`;

    try {
      const response = await fetch(`${this.config.endpoint}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          knowledge_graph: this.config.knowledgeGraph,
          query,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error(`Timbr query failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        entities: result.data || [],
        count: result.data?.length || 0,
        query,
        source: 'timbr',
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[TimbrQueryService] Timbr query failed, falling back to local:', error);
      return this.executeLocalQuery(concept, filters, limit, startTime);
    }
  }

  /**
   * Execute query locally with ontology-based mapping
   */
  private async executeLocalQuery(
    concept: string,
    filters: Record<string, any> | undefined,
    limit: number,
    startTime: number
  ): Promise<SemanticQueryResult> {
    // Map concept to table
    const tableName = CONCEPT_TABLE_MAP[concept];

    if (!tableName) {
      console.warn(`[TimbrQueryService] No table mapping for concept: ${concept}`);
      return {
        entities: [],
        count: 0,
        query: `SELECT * FROM ${concept} (unmapped)`,
        source: 'local',
        executionTime: Date.now() - startTime,
      };
    }

    // Build SQL query
    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    if (filters && Object.keys(filters).length > 0) {
      const conditions: string[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(filters)) {
        const columnName = PROPERTY_COLUMN_MAP[key] || key;
        conditions.push(`${columnName} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }

      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` LIMIT ${limit}`;

    try {
      const result = await db.execute(sql.raw(query));
      const rows = Array.isArray(result) ? result : (result as any).rows || [];

      return {
        entities: rows,
        count: rows.length,
        query,
        source: 'local',
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[TimbrQueryService] Local query failed for ${tableName}:`, error);
      return {
        entities: [],
        count: 0,
        query,
        source: 'local',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate cross-domain insights by querying multiple agent domains
   * This is the key function for multi-agent reasoning
   */
  async generateCrossDomainInsights(): Promise<CrossDomainInsight[]> {
    const insights: CrossDomainInsight[] = [];
    const startTime = Date.now();

    console.log('[TimbrQueryService] Generating cross-domain insights...');

    // 1. Find orphaned projects (no OKR alignment)
    const orphanedProjects = await this.findOrphanedProjects();
    if (orphanedProjects.length > 0) {
      insights.push({
        type: 'orphaned_project',
        severity: 'warning',
        title: 'Projects Without Strategic Alignment',
        description: `${orphanedProjects.length} projects are not linked to any OKR or strategic objective`,
        affectedEntities: orphanedProjects.map(p => p.name || p.id),
        recommendedActions: [
          'Review project objectives and link to relevant OKRs',
          'Consider deprioritizing unaligned projects',
          'Engage VRO agent to assess value delivery'
        ],
        sourceAgents: ['OKR', 'VRO', 'PMO'],
        confidence: 0.95,
      });
    }

    // 2. Find budget overruns correlated with schedule delays
    const budgetScheduleCorrelation = await this.findBudgetScheduleCorrelation();
    if (budgetScheduleCorrelation.length > 0) {
      insights.push({
        type: 'budget_schedule_correlation',
        severity: 'critical',
        title: 'Budget Overruns with Schedule Delays',
        description: `${budgetScheduleCorrelation.length} projects have both budget overruns and schedule delays`,
        affectedEntities: budgetScheduleCorrelation.map(p => p.name || p.id),
        recommendedActions: [
          'Conduct root cause analysis for correlated issues',
          'Consider scope reduction or resource reallocation',
          'Escalate to governance for decision'
        ],
        sourceAgents: ['FinOps', 'PMO', 'Governance'],
        confidence: 0.90,
      });
    }

    // 3. Find high-risk projects with low readiness
    const highRiskLowReadiness = await this.findHighRiskLowReadiness();
    if (highRiskLowReadiness.length > 0) {
      insights.push({
        type: 'risk_readiness_gap',
        severity: 'critical',
        title: 'High-Risk Projects with Low Change Readiness',
        description: `${highRiskLowReadiness.length} high-risk projects have stakeholder readiness below 50%`,
        affectedEntities: highRiskLowReadiness.map(p => p.name || p.id),
        recommendedActions: [
          'Increase OCM engagement and communication',
          'Consider risk mitigation through phased rollout',
          'Assess training completion status'
        ],
        sourceAgents: ['Risk', 'OCM', 'TMO'],
        confidence: 0.85,
      });
    }

    // 4. Find transformation fatigue indicators
    const fatigueIndicators = await this.findTransformationFatigue();
    if (fatigueIndicators.length > 0) {
      insights.push({
        type: 'transformation_fatigue',
        severity: 'warning',
        title: 'Transformation Fatigue Detected',
        description: `${fatigueIndicators.length} divisions showing signs of change fatigue`,
        affectedEntities: fatigueIndicators.map(d => d.name || d.id),
        recommendedActions: [
          'Reduce concurrent initiatives in affected divisions',
          'Prioritize quick wins to rebuild momentum',
          'Increase leadership visibility and support'
        ],
        sourceAgents: ['TMO', 'OCM', 'Planning'],
        confidence: 0.80,
      });
    }

    // 5. Find unmitigated critical risks
    const unmitigatedRisks = await this.findUnmitigatedCriticalRisks();
    if (unmitigatedRisks.length > 0) {
      insights.push({
        type: 'unmitigated_critical_risk',
        severity: 'critical',
        title: 'Critical Risks Without Mitigation',
        description: `${unmitigatedRisks.length} critical risks have no assigned mitigation plan`,
        affectedEntities: unmitigatedRisks.map(r => r.name || r.id),
        recommendedActions: [
          'Immediately assign risk owners',
          'Develop mitigation plans within 48 hours',
          'Escalate to governance board'
        ],
        sourceAgents: ['Risk', 'Governance', 'PMO'],
        confidence: 0.95,
      });
    }

    // 6. Find dependency bottlenecks
    const dependencyBottlenecks = await this.findDependencyBottlenecks();
    if (dependencyBottlenecks.length > 0) {
      insights.push({
        type: 'dependency_bottleneck',
        severity: 'warning',
        title: 'Cross-Project Dependency Bottlenecks',
        description: `${dependencyBottlenecks.length} projects are blocking multiple downstream deliverables`,
        affectedEntities: dependencyBottlenecks.map(p => p.name || p.id),
        recommendedActions: [
          'Prioritize blocking work items',
          'Consider parallel execution alternatives',
          'Communicate delays to downstream teams'
        ],
        sourceAgents: ['PMO', 'Planning', 'Notification'],
        confidence: 0.85,
      });
    }

    console.log(`[TimbrQueryService] Generated ${insights.length} cross-domain insights in ${Date.now() - startTime}ms`);

    return insights;
  }

  // Cross-domain query implementations

  private async findOrphanedProjects(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT p.id, p.name, p.status
        FROM projects p
        LEFT JOIN project_okr_alignments poa ON p.id = poa.project_id
        WHERE poa.id IS NULL
        AND p.status IN ('active', 'in_progress', 'planning')
        LIMIT 50
      `);
      return Array.isArray(result) ? result : (result as any).rows || [];
    } catch {
      // Table might not exist, return empty
      return [];
    }
  }

  private async findBudgetScheduleCorrelation(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT p.id, p.name, p.budget_utilization, p.schedule_variance
        FROM projects p
        WHERE p.budget_utilization > 1.0
        AND p.schedule_variance < -0.1
        AND p.status = 'active'
        LIMIT 50
      `);
      return Array.isArray(result) ? result : (result as any).rows || [];
    } catch {
      return [];
    }
  }

  private async findHighRiskLowReadiness(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT p.id, p.name, r.severity as risk_severity, ra.readiness_score
        FROM projects p
        JOIN risks r ON r.project_id = p.id
        LEFT JOIN readiness_assessments ra ON ra.project_id = p.id
        WHERE r.severity > 0.7
        AND (ra.readiness_score IS NULL OR ra.readiness_score < 0.5)
        AND r.status = 'open'
        LIMIT 50
      `);
      return Array.isArray(result) ? result : (result as any).rows || [];
    } catch {
      return [];
    }
  }

  private async findTransformationFatigue(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT d.id, d.name, COUNT(i.id) as initiative_count
        FROM divisions d
        JOIN initiatives i ON i.division_id = d.id
        WHERE i.status = 'active'
        AND i.adoption_trend = 'declining'
        GROUP BY d.id, d.name
        HAVING COUNT(i.id) >= 3
        LIMIT 20
      `);
      return Array.isArray(result) ? result : (result as any).rows || [];
    } catch {
      return [];
    }
  }

  private async findUnmitigatedCriticalRisks(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT r.id, r.name, r.severity, r.probability, r.impact
        FROM risks r
        LEFT JOIN risk_mitigations rm ON rm.risk_id = r.id
        WHERE r.severity > 0.7
        AND r.status = 'open'
        AND rm.id IS NULL
        LIMIT 50
      `);
      return Array.isArray(result) ? result : (result as any).rows || [];
    } catch {
      return [];
    }
  }

  private async findDependencyBottlenecks(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT p.id, p.name, COUNT(d.id) as blocking_count
        FROM projects p
        JOIN dependencies d ON d.blocking_project_id = p.id
        WHERE d.status = 'blocked'
        GROUP BY p.id, p.name
        HAVING COUNT(d.id) >= 2
        ORDER BY blocking_count DESC
        LIMIT 20
      `);
      return Array.isArray(result) ? result : (result as any).rows || [];
    } catch {
      return [];
    }
  }

  /**
   * Get insights for a specific agent's domain
   */
  async getAgentDomainInsights(agentType: string): Promise<CrossDomainInsight[]> {
    const allInsights = await this.generateCrossDomainInsights();

    // Filter insights relevant to this agent
    return allInsights.filter(insight =>
      insight.sourceAgents.some(a =>
        a.toLowerCase() === agentType.toLowerCase().replace(/agent$/i, '')
      )
    );
  }

  /**
   * Execute a SPARQL-style query (for Timbr or future Neo4j integration)
   */
  async executeSparql(sparql: string): Promise<any[]> {
    if (this.config.enabled) {
      try {
        const response = await fetch(`${this.config.endpoint}/api/v1/sparql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sparql-query',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/json',
          },
          body: sparql,
        });

        if (!response.ok) {
          throw new Error(`SPARQL query failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.results?.bindings || [];
      } catch (error) {
        console.error('[TimbrQueryService] SPARQL query failed:', error);
        return [];
      }
    }

    // Local SPARQL not implemented yet - would need a SPARQL engine
    console.warn('[TimbrQueryService] Local SPARQL not available, use query() instead');
    return [];
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      timbrEnabled: this.config.enabled,
      endpoint: this.config.enabled ? this.config.endpoint : null,
      knowledgeGraph: this.config.knowledgeGraph,
      ontologyStats: ontologyService.getStatistics(),
    };
  }
}

// Singleton instance
export const timbrQueryService = new TimbrQueryService();
