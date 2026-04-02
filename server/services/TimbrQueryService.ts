/**
 * TIMBR QUERY SERVICE
 *
 * Provides semantic query capabilities for the K360 ontology.
 *
 * ARCHITECTURE:
 * - Palantir Foundry = Source of truth (stores all data, Actions execute there)
 * - Timbr.ai = Semantic query layer (virtual knowledge graph on top of Palantir)
 *
 * The Flow:
 * 1. Palantir provides the data (27 object types)
 * 2. Timbr provides the connections (cross-domain queries in one shot)
 * 3. Agent generates insight based on cross-domain correlation
 * 4. Palantir records the result via atlas-create-insight action
 */

import { ontologyService } from '../ontology/index.js';
import { getPalantirDataProvider } from '../mcp/PalantirDataProvider.js';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

// Timbr.ai configuration (sits on top of Palantir)
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
  source: 'timbr' | 'palantir';
  executionTime: number;
}

interface CrossDomainInsight {
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'high';
  title: string;
  description: string;
  affectedEntities: string[];
  affectedDomains?: string[];
  recommendedActions: string[];
  recommendation?: string;
  relatedEntities?: any[];
  sourceAgents: string[];
  confidence: number;
  details?: Record<string, any>;
}

// K360 Concept to Palantir Object Type mapping
const CONCEPT_PALANTIR_MAP: Record<string, string> = {
  // SAFe hierarchy -> Palantir objects
  'safe:Portfolio': 'AtlasPortfolio',
  'safe:ValueStream': 'AtlasValueStream',
  'safe:ART': 'AtlasART',
  'safe:Team': 'AtlasTeam',
  'safe:Epic': 'AtlasEpic',
  'safe:Feature': 'AtlasFeature',
  'safe:Story': 'AtlasStory',
  'safe:Task': 'AtlasTask',
  'safe:ProgramIncrement': 'AtlasProgramIncrement',
  'safe:Sprint': 'AtlasSprint',

  // K360 agent domains -> Palantir objects
  'k360:Project': 'AtlasProject',
  'k360:Transformation': 'AtlasTransformation',
  'k360:Budget': 'AtlasBudget',
  'k360:Risk': 'AtlasRisk',
  'k360:Objective': 'AtlasObjective',
  'k360:KeyResult': 'AtlasKeyResult',
  'k360:Kpi': 'AtlasKpi',
  'k360:Insight': 'AtlasInsight',
  'k360:Resource': 'AtlasPerson',
  'k360:Team': 'AtlasTeam',
  'k360:Dependency': 'AtlasDependency',
  'k360:GovernanceCheckpoint': 'AtlasGovernanceCheckpoint',
  'k360:ReadinessMetric': 'AtlasReadinessMetric',
  'k360:FinancialRecord': 'AtlasFinancialRecord',
  'k360:Agent': 'AtlasAgent',
};

// Property to Palantir property mapping
const PROPERTY_PALANTIR_MAP: Record<string, string> = {
  'rdfs:label': 'title',
  'k360:projectStatus': 'status',
  'k360:percentComplete': 'progressPercent',
  'k360:budgetAmount': 'budgetTotal',
  'k360:actualSpend': 'actualCost',
  'k360:budgetUtilization': 'budgetVariance',
  'k360:riskSeverity': 'severity',
  'k360:riskProbability': 'probability',
  'k360:riskImpact': 'impact',
  'k360:cpiValue': 'cpi',
  'k360:spiValue': 'spi',
};

class TimbrQueryService {
  private config: TimbrConfig;
  private initialized = false;
  private palantirProvider: ReturnType<typeof getPalantirDataProvider> | null = null;
  private palantirService: ReturnType<typeof getPalantirService> | null = null;

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

    // Initialize Palantir connection (source of truth)
    this.palantirProvider = getPalantirDataProvider();
    this.palantirService = getPalantirService();

    // Load ontology definitions
    await ontologyService.loadOntologies();

    // Log initialization status
    const palantirAvailable = this.palantirProvider?.isAvailable() || false;

    if (this.config.enabled) {
      console.log('[TimbrQueryService] Timbr.ai enabled - semantic queries via Timbr → Palantir');
      console.log(`[TimbrQueryService] Endpoint: ${this.config.endpoint}`);
      console.log(`[TimbrQueryService] Knowledge Graph: ${this.config.knowledgeGraph}`);
    } else if (palantirAvailable) {
      console.log('[TimbrQueryService] Palantir direct mode - queries go straight to Foundry');
    } else {
      console.warn('[TimbrQueryService] WARNING: Palantir not available - cross-domain queries will return empty results');
    }

    this.initialized = true;
  }

  /**
   * Check if Palantir is available as source of truth
   */
  isPalantirAvailable(): boolean {
    return this.palantirProvider?.isAvailable() || false;
  }

  /**
   * Execute a semantic query against the knowledge graph
   * Priority: Timbr (if enabled) → Palantir direct
   */
  async query(
    concept: string,
    filters?: Record<string, any>,
    limit = 100
  ): Promise<SemanticQueryResult> {
    const startTime = Date.now();

    // Priority 1: Use Timbr.ai if enabled (semantic layer on top of Palantir)
    if (this.config.enabled) {
      return this.executeTimbrQuery(concept, filters, limit, startTime);
    }

    // Priority 2: Query Palantir directly
    return this.executePalantirQuery(concept, filters, limit, startTime);
  }

  /**
   * Execute query via Timbr.ai (semantic layer on top of Palantir)
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
      console.error('[TimbrQueryService] Timbr query failed, falling back to Palantir direct:', error);
      return this.executePalantirQuery(concept, filters, limit, startTime);
    }
  }

  /**
   * Execute query directly against Palantir Foundry
   */
  private async executePalantirQuery(
    concept: string,
    filters: Record<string, any> | undefined,
    limit: number,
    startTime: number
  ): Promise<SemanticQueryResult> {
    const palantirObjectType = CONCEPT_PALANTIR_MAP[concept];

    if (!palantirObjectType) {
      console.warn(`[TimbrQueryService] No Palantir mapping for concept: ${concept}`);
      return {
        entities: [],
        count: 0,
        query: `Palantir: ${concept} (unmapped)`,
        source: 'palantir',
        executionTime: Date.now() - startTime,
      };
    }

    if (!this.palantirService) {
      console.warn('[TimbrQueryService] Palantir service not available');
      return {
        entities: [],
        count: 0,
        query: `Palantir: ${palantirObjectType} (unavailable)`,
        source: 'palantir',
        executionTime: Date.now() - startTime,
      };
    }

    try {
      let data: any;

      if (filters && Object.keys(filters).length > 0) {
        const palantirFilter = this.buildPalantirFilter(filters);
        data = await this.palantirService.searchObjects(palantirObjectType, palantirFilter, {
          pageSize: limit,
        });
      } else {
        data = await this.palantirService.listObjects(palantirObjectType, {
          pageSize: limit,
        });
      }

      const objects = data.data || [];

      return {
        entities: objects,
        count: objects.length,
        query: `Palantir: ${palantirObjectType}`,
        source: 'palantir',
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[TimbrQueryService] Palantir query failed for ${concept}:`, error);
      return {
        entities: [],
        count: 0,
        query: `Palantir: ${palantirObjectType} (error)`,
        source: 'palantir',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Build Palantir filter from semantic filters
   */
  private buildPalantirFilter(filters: Record<string, any>): any {
    const conditions = Object.entries(filters).map(([key, value]) => {
      const palantirProperty = PROPERTY_PALANTIR_MAP[key] || key;
      return {
        type: 'eq',
        field: palantirProperty,
        value,
      };
    });

    if (conditions.length === 1) {
      return conditions[0];
    }

    return {
      type: 'and',
      conditions,
    };
  }

  /**
   * Generate cross-domain insights by querying multiple agent domains
   * Reads from Palantir, correlates across domains, returns actionable insights
   */
  async generateCrossDomainInsights(): Promise<CrossDomainInsight[]> {
    const insights: CrossDomainInsight[] = [];
    const startTime = Date.now();

    if (!this.isPalantirAvailable() || !this.palantirService) {
      console.warn('[TimbrQueryService] Palantir not available - cannot generate cross-domain insights');
      return insights;
    }

    console.log('[TimbrQueryService] Generating cross-domain insights from Palantir...');

    // 1. Find orphaned projects (no OKR alignment)
    const orphanedProjects = await this.findOrphanedProjects();
    if (orphanedProjects.length > 0) {
      insights.push({
        type: 'orphaned_project',
        severity: orphanedProjects.length > 5 ? 'high' : 'warning',
        title: 'Projects Without Strategic Alignment',
        description: `${orphanedProjects.length} projects are not linked to any OKR or strategic objective`,
        affectedEntities: orphanedProjects.map(p => p.title || p.name || p.id),
        affectedDomains: ['VRO', 'OKR'],
        recommendedActions: [
          'Review project objectives and link to relevant OKRs',
          'Consider deprioritizing unaligned projects',
          'Engage VRO agent to assess value delivery'
        ],
        recommendation: 'Review these projects for strategic alignment',
        sourceAgents: ['OKR', 'VRO', 'PMO'],
        confidence: 0.95,
        relatedEntities: orphanedProjects.slice(0, 5),
      });
    }

    // 2. Find budget overruns correlated with schedule delays
    const budgetScheduleCorrelation = await this.findBudgetScheduleCorrelation();
    if (budgetScheduleCorrelation.length > 0) {
      insights.push({
        type: 'budget_schedule_correlation',
        severity: 'critical',
        title: 'Budget Overruns with Schedule Delays',
        description: `${budgetScheduleCorrelation.length} projects have both budget overruns (CPI < 0.9) and schedule delays (SPI < 0.9)`,
        affectedEntities: budgetScheduleCorrelation.map(p => p.title || p.name || p.id),
        affectedDomains: ['FinOps', 'PMO'],
        recommendedActions: [
          'Conduct root cause analysis for correlated issues',
          'Consider scope reduction or resource reallocation',
          'Escalate to governance for decision'
        ],
        recommendation: 'Investigate root cause of correlated budget and schedule issues',
        sourceAgents: ['FinOps', 'PMO', 'Governance'],
        confidence: 0.90,
        relatedEntities: budgetScheduleCorrelation.slice(0, 5),
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
        affectedEntities: highRiskLowReadiness.map(p => p.title || p.name || p.id),
        affectedDomains: ['Risk', 'OCM'],
        recommendedActions: [
          'Increase OCM engagement and communication',
          'Consider risk mitigation through phased rollout',
          'Assess training completion status'
        ],
        recommendation: 'Address readiness gaps before proceeding',
        sourceAgents: ['Risk', 'OCM', 'TMO'],
        confidence: 0.85,
        relatedEntities: highRiskLowReadiness.slice(0, 5),
      });
    }

    // 4. Find unmitigated critical risks
    const unmitigatedRisks = await this.findUnmitigatedCriticalRisks();
    if (unmitigatedRisks.length > 0) {
      insights.push({
        type: 'unmitigated_critical_risk',
        severity: 'critical',
        title: 'Critical Risks Without Mitigation',
        description: `${unmitigatedRisks.length} critical risks have no assigned mitigation plan`,
        affectedEntities: unmitigatedRisks.map(r => r.title || r.name || r.id),
        affectedDomains: ['Risk', 'Governance'],
        recommendedActions: [
          'Immediately assign risk owners',
          'Develop mitigation plans within 48 hours',
          'Escalate to governance board'
        ],
        recommendation: 'Urgent: Create mitigation plans for critical risks',
        sourceAgents: ['Risk', 'Governance', 'PMO'],
        confidence: 0.95,
        relatedEntities: unmitigatedRisks.slice(0, 5),
      });
    }

    // 5. Find dependency bottlenecks
    const dependencyBottlenecks = await this.findDependencyBottlenecks();
    if (dependencyBottlenecks.length > 0) {
      insights.push({
        type: 'dependency_bottleneck',
        severity: dependencyBottlenecks.length > 3 ? 'high' : 'warning',
        title: 'Cross-Project Dependency Bottlenecks',
        description: `${dependencyBottlenecks.length} projects are blocking multiple downstream deliverables`,
        affectedEntities: dependencyBottlenecks.map(p => p.title || p.name || p.id),
        affectedDomains: ['Planning', 'PMO'],
        recommendedActions: [
          'Prioritize blocking work items',
          'Consider parallel execution alternatives',
          'Communicate delays to downstream teams'
        ],
        recommendation: 'Prioritize resolution of blocking dependencies',
        sourceAgents: ['PMO', 'Planning', 'Notification'],
        confidence: 0.85,
        relatedEntities: dependencyBottlenecks.slice(0, 5),
      });
    }

    // 6. Find resource contention
    const resourceContention = await this.findResourceContention();
    if (resourceContention.length > 0) {
      insights.push({
        type: 'resource_contention',
        severity: 'warning',
        title: 'Resource Over-Allocation Detected',
        description: `${resourceContention.length} resources are allocated beyond 100% capacity`,
        affectedEntities: resourceContention.map(r => r.title || r.name || r.id),
        affectedDomains: ['PMO', 'Planning'],
        recommendedActions: [
          'Rebalance resource assignments',
          'Prioritize critical projects',
          'Consider hiring or contracting'
        ],
        recommendation: 'Rebalance workload to prevent burnout',
        sourceAgents: ['PMO', 'Planning'],
        confidence: 0.80,
        relatedEntities: resourceContention.slice(0, 5),
      });
    }

    console.log(`[TimbrQueryService] Generated ${insights.length} cross-domain insights in ${Date.now() - startTime}ms`);

    return insights;
  }

  // Cross-domain query implementations - All query Palantir

  private async findOrphanedProjects(): Promise<any[]> {
    if (!this.palantirService) return [];

    try {
      // Query Palantir for projects
      const projectsResult = await this.palantirService.listObjects('AtlasProject', { pageSize: 100 });
      const projects = projectsResult.data || [];

      // Query for objectives
      const objectivesResult = await this.palantirService.listObjects('AtlasObjective', { pageSize: 100 });
      const objectives = objectivesResult.data || [];

      // Find projects not linked to objectives
      const linkedProjectIds = new Set(objectives.flatMap((o: any) => o.linkedProjectIds || []));
      const orphaned = projects.filter((p: any) =>
        !linkedProjectIds.has(p.id) &&
        !p.objectiveId &&
        p.status !== 'completed' &&
        p.status !== 'cancelled'
      );

      return orphaned;
    } catch (error) {
      console.warn('[TimbrQueryService] Failed to find orphaned projects:', error);
      return [];
    }
  }

  private async findBudgetScheduleCorrelation(): Promise<any[]> {
    if (!this.palantirService) return [];

    try {
      const projectsResult = await this.palantirService.listObjects('AtlasProject', { pageSize: 100 });
      const projects = projectsResult.data || [];

      // Find projects with both CPI and SPI below threshold
      return projects.filter((p: any) =>
        (p.cpi !== undefined && p.cpi < 0.9) &&
        (p.spi !== undefined && p.spi < 0.9) &&
        p.status === 'active'
      );
    } catch (error) {
      console.warn('[TimbrQueryService] Failed to find budget-schedule correlation:', error);
      return [];
    }
  }

  private async findHighRiskLowReadiness(): Promise<any[]> {
    if (!this.palantirService) return [];

    try {
      // Get risks
      const risksResult = await this.palantirService.listObjects('AtlasRisk', { pageSize: 100 });
      const risks = risksResult.data || [];

      // Get readiness metrics
      const readinessResult = await this.palantirService.listObjects('AtlasReadinessMetric', { pageSize: 100 });
      const readiness = readinessResult.data || [];

      // Create readiness lookup by project
      const readinessMap = new Map(readiness.map((r: any) => [r.projectId, r]));

      // Find high-risk projects with low readiness
      const highRisks = risks.filter((r: any) =>
        (r.severity === 'critical' || r.severity === 'high') &&
        r.status !== 'resolved'
      );

      return highRisks.filter((r: any) => {
        const projectReadiness = readinessMap.get(r.projectId);
        return !projectReadiness || projectReadiness.score < 50;
      });
    } catch (error) {
      console.warn('[TimbrQueryService] Failed to find high-risk/low-readiness:', error);
      return [];
    }
  }

  private async findUnmitigatedCriticalRisks(): Promise<any[]> {
    if (!this.palantirService) return [];

    try {
      const risksResult = await this.palantirService.listObjects('AtlasRisk', { pageSize: 100 });
      const risks = risksResult.data || [];

      return risks.filter((r: any) =>
        (r.severity === 'critical' || r.severity === 'high') &&
        r.status !== 'resolved' &&
        !r.mitigationPlan &&
        !r.mitigationStrategy
      );
    } catch (error) {
      console.warn('[TimbrQueryService] Failed to find unmitigated risks:', error);
      return [];
    }
  }

  private async findDependencyBottlenecks(): Promise<any[]> {
    if (!this.palantirService) return [];

    try {
      const depsResult = await this.palantirService.listObjects('AtlasDependency', { pageSize: 100 });
      const deps = depsResult.data || [];

      // Count blocked dependencies per project
      const blockingCount = new Map<string, { count: number; project: any }>();

      for (const dep of deps) {
        if (dep.status === 'blocked' || dep.status === 'at_risk') {
          const sourceId = dep.sourceProjectId;
          const existing = blockingCount.get(sourceId) || { count: 0, project: null };
          existing.count++;
          existing.project = dep;
          blockingCount.set(sourceId, existing);
        }
      }

      // Return projects blocking 2+ others
      const bottlenecks: any[] = [];
      for (const [id, data] of blockingCount) {
        if (data.count >= 2) {
          bottlenecks.push({
            id,
            title: data.project?.sourceProjectName || id,
            blockingCount: data.count,
          });
        }
      }

      return bottlenecks;
    } catch (error) {
      console.warn('[TimbrQueryService] Failed to find dependency bottlenecks:', error);
      return [];
    }
  }

  private async findResourceContention(): Promise<any[]> {
    if (!this.palantirService) return [];

    try {
      const personsResult = await this.palantirService.listObjects('AtlasPerson', { pageSize: 100 });
      const persons = personsResult.data || [];

      return persons.filter((p: any) =>
        p.totalAllocation !== undefined && p.totalAllocation > 100
      );
    } catch (error) {
      console.warn('[TimbrQueryService] Failed to find resource contention:', error);
      return [];
    }
  }

  /**
   * Get insights for a specific agent's domain
   */
  async getAgentDomainInsights(agentType: string): Promise<CrossDomainInsight[]> {
    const allInsights = await this.generateCrossDomainInsights();

    // Filter insights relevant to this agent
    const normalizedType = agentType.toLowerCase().replace(/agent$/i, '');
    return allInsights.filter(insight =>
      insight.sourceAgents.some(a =>
        a.toLowerCase() === normalizedType
      ) ||
      insight.affectedDomains?.some(d =>
        d.toLowerCase() === normalizedType
      )
    );
  }

  /**
   * Write an insight back to Palantir via the Create Insight action
   * This completes the read → reason → write cycle
   */
  async writeInsightToPalantir(insight: CrossDomainInsight): Promise<boolean> {
    if (!this.palantirService) {
      console.warn('[TimbrQueryService] Cannot write insight - Palantir not available');
      return false;
    }

    try {
      await this.palantirService.executeAction('atlas-create-insight', {
        title: insight.title,
        description: insight.description,
        insightType: insight.type,
        severity: insight.severity,
        sourceAgent: insight.sourceAgents.join(', '),
        affectedEntities: insight.affectedEntities,
        recommendation: insight.recommendedActions.join('; '),
        confidence: insight.confidence,
      });

      console.log(`[TimbrQueryService] Wrote insight to Palantir: ${insight.title}`);
      return true;
    } catch (error) {
      console.error('[TimbrQueryService] Failed to write insight to Palantir:', error);
      return false;
    }
  }

  /**
   * Execute a SPARQL-style query via Timbr
   * Timbr provides SPARQL endpoint for complex relationship queries
   */
  async executeSparql(sparql: string): Promise<any[]> {
    if (!this.config.enabled) {
      console.warn('[TimbrQueryService] SPARQL requires Timbr.ai - use query() for direct Palantir access');
      return [];
    }

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

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      timbrEnabled: this.config.enabled,
      palantirAvailable: this.isPalantirAvailable(),
      dataSource: this.config.enabled ? 'timbr' : 'palantir',
      endpoint: this.config.enabled ? this.config.endpoint : null,
      knowledgeGraph: this.config.knowledgeGraph,
      ontologyStats: ontologyService.getStatistics(),
    };
  }
}

// Singleton instance
export const timbrQueryService = new TimbrQueryService();
