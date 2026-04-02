import neo4j, { Driver, Session } from 'neo4j-driver';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

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

class Neo4jInsightService {
  private driver: Driver | null = null;
  private connected = false;
  private verified = false;
  private initialized = false;
  private lastSyncTime = 0;
  private consecutiveFailures = 0;
  private static SYNC_INTERVAL_MS = 300_000;
  private static MAX_FAILURES_BEFORE_FALLBACK = 3;

  constructor() {
    this.connect();
  }

  private connect(): void {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !password) {
      console.warn('[Neo4jInsight] NEO4J_URI or NEO4J_PASSWORD not set — graph insights disabled');
      return;
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionPoolSize: 20,
        connectionAcquisitionTimeout: 30000,
        disableLosslessIntegers: true,
      });
      this.connected = true;
      console.log('[Neo4jInsight] Driver created — will verify on first use');
      this.verifyConnection();
    } catch (error: any) {
      console.warn('[Neo4jInsight] Failed to create driver:', error.message);
      this.connected = false;
    }
  }

  private async verifyConnection(): Promise<boolean> {
    if (!this.driver) return false;
    try {
      await this.driver.verifyConnectivity();
      this.verified = true;
      this.consecutiveFailures = 0;
      console.log('[Neo4jInsight] Connected to Neo4j (verified)');
      return true;
    } catch (error: any) {
      console.warn('[Neo4jInsight] Connection verification failed:', error.message);
      this.verified = false;
      this.connected = false;
      return false;
    }
  }

  isAvailable(): boolean {
    if (this.consecutiveFailures >= Neo4jInsightService.MAX_FAILURES_BEFORE_FALLBACK) {
      return false;
    }
    return this.connected && !!this.driver;
  }

  private async session(): Promise<Session | null> {
    if (!this.driver || !this.connected) return null;
    return this.driver.session();
  }

  private async run(cypher: string, params: Record<string, any> = {}, throwOnError = false): Promise<any[]> {
    const s = await this.session();
    if (!s) return [];
    try {
      const result = await s.run(cypher, params);
      this.consecutiveFailures = 0;
      return result.records.map(r => {
        const keys = r.keys;
        if (keys.length === 1) return r.get(keys[0]);
        const obj: Record<string, any> = {};
        for (const k of keys) obj[k as string] = r.get(k);
        return obj;
      });
    } catch (error: any) {
      this.consecutiveFailures++;
      console.error(`[Neo4jInsight] Cypher error (failure #${this.consecutiveFailures}):`, error.message);
      if (throwOnError) throw error;
      return [];
    } finally {
      await s.close();
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.isAvailable()) return;

    try {
      await this.run(`
        CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT risk_id IF NOT EXISTS FOR (r:Risk) REQUIRE r.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT objective_id IF NOT EXISTS FOR (o:Objective) REQUIRE o.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT dependency_id IF NOT EXISTS FOR (d:Dependency) REQUIRE d.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT team_id IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT budget_id IF NOT EXISTS FOR (b:Budget) REQUIRE b.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT kpi_id IF NOT EXISTS FOR (k:KPI) REQUIRE k.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT keyresult_id IF NOT EXISTS FOR (kr:KeyResult) REQUIRE kr.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT checkpoint_id IF NOT EXISTS FOR (c:GovernanceCheckpoint) REQUIRE c.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT readiness_id IF NOT EXISTS FOR (r:ReadinessMetric) REQUIRE r.id IS UNIQUE
      `);
      await this.run(`
        CREATE CONSTRAINT transformation_id IF NOT EXISTS FOR (t:Transformation) REQUIRE t.id IS UNIQUE
      `);
      console.log('[Neo4jInsight] Schema constraints created');
      this.initialized = true;
    } catch (error: any) {
      console.warn('[Neo4jInsight] Schema init warning:', error.message);
      this.initialized = true;
    }
  }

  async syncFromPalantir(): Promise<void> {
    if (!this.isAvailable()) return;

    const now = Date.now();
    if (now - this.lastSyncTime < Neo4jInsightService.SYNC_INTERVAL_MS) return;
    this.lastSyncTime = now;

    await this.initialize();

    const palantir = getPalantirService();
    if (!palantir) {
      console.warn('[Neo4jInsight] Palantir not available for sync');
      return;
    }

    console.log('[Neo4jInsight] Syncing Palantir data to Neo4j knowledge graph...');
    const startTime = Date.now();

    const objectTypes: Array<{ palantirType: string; label: string; props: string[] }> = [
      { palantirType: 'AtlasProject', label: 'Project', props: ['title', 'name', 'status', 'budget', 'actualCost', 'cpi', 'spi', 'percentComplete', 'priority', 'startDate', 'endDate', 'objectiveId', 'teamId'] },
      { palantirType: 'AtlasRisk', label: 'Risk', props: ['title', 'name', 'severity', 'probability', 'impact', 'status', 'projectId', 'mitigationPlan', 'mitigationStrategy', 'category'] },
      { palantirType: 'AtlasObjective', label: 'Objective', props: ['title', 'name', 'status', 'progress', 'linkedProjectIds', 'quarter'] },
      { palantirType: 'AtlasKeyResult', label: 'KeyResult', props: ['title', 'name', 'target', 'actual', 'progress', 'objectiveId'] },
      { palantirType: 'AtlasDependency', label: 'Dependency', props: ['title', 'name', 'sourceProjectId', 'targetProjectId', 'status', 'criticality', 'dependencyType', 'lagDays'] },
      { palantirType: 'AtlasTeam', label: 'Team', props: ['title', 'name', 'velocity', 'capacity', 'memberCount'] },
      { palantirType: 'AtlasPerson', label: 'Person', props: ['title', 'name', 'role', 'teamId', 'totalAllocation', 'email'] },
      { palantirType: 'AtlasBudget', label: 'Budget', props: ['title', 'name', 'total', 'spent', 'remaining', 'projectId', 'budgetVariance'] },
      { palantirType: 'AtlasKpi', label: 'KPI', props: ['title', 'name', 'value', 'target', 'status', 'projectId', 'category'] },
      { palantirType: 'AtlasGovernanceCheckpoint', label: 'GovernanceCheckpoint', props: ['title', 'name', 'status', 'projectId', 'decision', 'date'] },
      { palantirType: 'AtlasReadinessMetric', label: 'ReadinessMetric', props: ['title', 'name', 'score', 'projectId', 'category'] },
      { palantirType: 'AtlasTransformation', label: 'Transformation', props: ['title', 'name', 'status', 'progress', 'projectId'] },
      { palantirType: 'AtlasFinancialRecord', label: 'FinancialRecord', props: ['title', 'name', 'amount', 'category', 'projectId', 'date'] },
      { palantirType: 'AtlasInsight', label: 'Insight', props: ['title', 'description', 'severity', 'sourceAgent', 'insightType'] },
    ];

    let totalNodes = 0;
    let failedNodes = 0;

    for (const ot of objectTypes) {
      try {
        const result = await palantir.listObjects(ot.palantirType, { pageSize: 200 });
        const objects = result.data || [];
        if (objects.length === 0) continue;

        for (const obj of objects) {
          const props: Record<string, any> = { id: obj.id || obj.__primaryKey || `${ot.label}-${Math.random().toString(36).slice(2)}` };
          for (const p of ot.props) {
            if (obj[p] !== undefined && obj[p] !== null) {
              if (Array.isArray(obj[p])) {
                props[p] = JSON.stringify(obj[p]);
              } else if (typeof obj[p] === 'object') {
                props[p] = JSON.stringify(obj[p]);
              } else {
                props[p] = obj[p];
              }
            }
          }

          try {
            await this.run(
              `MERGE (n:${ot.label} {id: $id}) SET n += $props`,
              { id: props.id, props },
              true
            );
            totalNodes++;
          } catch {
            failedNodes++;
          }
        }
      } catch (error: any) {
        console.warn(`[Neo4jInsight] Failed to sync ${ot.palantirType}:`, error.message);
      }
    }

    if (this.consecutiveFailures >= Neo4jInsightService.MAX_FAILURES_BEFORE_FALLBACK) {
      console.warn(`[Neo4jInsight] Too many Neo4j failures (${this.consecutiveFailures}) — will fallback to Palantir`);
      return;
    }

    await this.createRelationships(palantir);

    console.log(`[Neo4jInsight] Synced ${totalNodes} nodes (${failedNodes} failed) to Neo4j in ${Date.now() - startTime}ms`);
  }

  private async createRelationships(palantir?: any): Promise<void> {
    const rels = [
      `MATCH (p:Project), (r:Risk) WHERE r.projectId = p.id MERGE (p)-[:HAS_RISK]->(r)`,
      `MATCH (p:Project), (b:Budget) WHERE b.projectId = p.id MERGE (p)-[:HAS_BUDGET]->(b)`,
      `MATCH (p:Project), (k:KPI) WHERE k.projectId = p.id MERGE (p)-[:MEASURED_BY]->(k)`,
      `MATCH (p:Project), (gc:GovernanceCheckpoint) WHERE gc.projectId = p.id MERGE (p)-[:HAS_CHECKPOINT]->(gc)`,
      `MATCH (p:Project), (rm:ReadinessMetric) WHERE rm.projectId = p.id MERGE (p)-[:HAS_READINESS]->(rm)`,
      `MATCH (p:Project), (t:Transformation) WHERE t.projectId = p.id MERGE (p)-[:TRANSFORMS]->(t)`,
      `MATCH (p:Project), (fr:FinancialRecord) WHERE fr.projectId = p.id MERGE (p)-[:HAS_FINANCIAL]->(fr)`,
      `MATCH (p:Project), (t:Team) WHERE t.id = p.teamId MERGE (p)-[:ASSIGNED_TO]->(t)`,
      `MATCH (t:Team), (pe:Person) WHERE pe.teamId = t.id MERGE (t)-[:INCLUDES]->(pe)`,
      `MATCH (o:Objective), (kr:KeyResult) WHERE kr.objectiveId = o.id MERGE (o)-[:HAS_KEY_RESULT]->(kr)`,
      `MATCH (p:Project), (o:Objective) WHERE p.objectiveId = o.id MERGE (p)-[:ALIGNED_TO]->(o)`,
      `MATCH (d:Dependency), (src:Project) WHERE d.sourceProjectId = src.id MERGE (src)-[:DEPENDS_ON]->(d)`,
      `MATCH (d:Dependency), (tgt:Project) WHERE d.targetProjectId = tgt.id MERGE (d)-[:BLOCKS]->(tgt)`,
      `MATCH (r:Risk)-[:HAS_RISK]-(p:Project)-[:HAS_BUDGET]-(b:Budget) MERGE (r)-[:IMPACTS_BUDGET]->(b)`,
    ];

    for (const cypher of rels) {
      await this.run(cypher);
    }

    if (palantir) {
      try {
        const objectivesResult = await palantir.listObjects('AtlasObjective', { pageSize: 200 });
        const objectives = objectivesResult.data || [];
        for (const obj of objectives) {
          let linkedIds: string[] = [];
          if (Array.isArray(obj.linkedProjectIds)) {
            linkedIds = obj.linkedProjectIds;
          } else if (typeof obj.linkedProjectIds === 'string') {
            try { linkedIds = JSON.parse(obj.linkedProjectIds); } catch { /* ignore */ }
          }
          for (const projectId of linkedIds) {
            await this.run(
              `MATCH (p:Project {id: $projectId}), (o:Objective {id: $objectiveId}) MERGE (p)-[:ALIGNED_TO]->(o)`,
              { projectId, objectiveId: obj.id || obj.__primaryKey }
            );
          }
        }
      } catch (error: any) {
        console.warn('[Neo4jInsight] Failed to create linkedProjectIds relationships:', error.message);
      }
    }
  }

  async generateCrossDomainInsights(): Promise<CrossDomainInsight[]> {
    if (!this.isAvailable()) {
      console.warn('[Neo4jInsight] Neo4j not available — falling back to Palantir-only insights');
      return this.generatePalantirFallbackInsights();
    }

    await this.syncFromPalantir();

    const insights: CrossDomainInsight[] = [];
    const startTime = Date.now();

    console.log('[Neo4jInsight] Running cross-domain insight queries on Neo4j...');

    const insightGenerators = [
      this.findOrphanedProjects(),
      this.findBudgetScheduleCorrelation(),
      this.findHighRiskLowReadiness(),
      this.findUnmitigatedCriticalRisks(),
      this.findDependencyBottlenecks(),
      this.findResourceContention(),
      this.findCascadeRiskChains(),
      this.findOverallocatedTeams(),
    ];

    const results = await Promise.all(insightGenerators);

    for (const batch of results) {
      insights.push(...batch);
    }

    console.log(`[Neo4jInsight] Generated ${insights.length} cross-domain insights in ${Date.now() - startTime}ms`);
    return insights;
  }

  private async findOrphanedProjects(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (p:Project)
      WHERE p.status <> 'completed' AND p.status <> 'cancelled'
      AND NOT (p)-[:ALIGNED_TO]->(:Objective)
      RETURN p.id AS id, p.title AS title, p.name AS name, p.status AS status
    `);

    if (records.length === 0) return [];

    return [{
      type: 'orphaned_project',
      severity: records.length > 5 ? 'high' : 'warning',
      title: 'Projects Without Strategic Alignment',
      description: `${records.length} projects are not linked to any OKR or strategic objective`,
      affectedEntities: records.map(r => r.title || r.name || r.id),
      affectedDomains: ['VRO', 'OKR'],
      recommendedActions: [
        'Review project objectives and link to relevant OKRs',
        'Consider deprioritizing unaligned projects',
        'Engage VRO agent to assess value delivery'
      ],
      recommendation: 'Review these projects for strategic alignment',
      sourceAgents: ['OKR', 'VRO', 'PMO'],
      confidence: 0.95,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findBudgetScheduleCorrelation(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (p:Project)-[:HAS_BUDGET]->(b:Budget)
      WHERE p.status = 'active'
        AND toFloat(coalesce(p.cpi, '1.0')) < 0.9
        AND toFloat(coalesce(p.spi, '1.0')) < 0.9
      RETURN p.id AS id, p.title AS title, p.name AS name,
             p.cpi AS cpi, p.spi AS spi, b.total AS budget
    `);

    if (records.length === 0) return [];

    return [{
      type: 'budget_schedule_correlation',
      severity: 'critical',
      title: 'Budget Overruns with Schedule Delays',
      description: `${records.length} projects have both budget overruns (CPI < 0.9) and schedule delays (SPI < 0.9)`,
      affectedEntities: records.map(r => r.title || r.name || r.id),
      affectedDomains: ['FinOps', 'PMO'],
      recommendedActions: [
        'Conduct root cause analysis for correlated issues',
        'Consider scope reduction or resource reallocation',
        'Escalate to governance for decision'
      ],
      recommendation: 'Investigate root cause of correlated budget and schedule issues',
      sourceAgents: ['FinOps', 'PMO', 'Governance'],
      confidence: 0.90,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findHighRiskLowReadiness(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (p:Project)-[:HAS_RISK]->(r:Risk)
      WHERE (r.severity = 'critical' OR r.severity = 'high')
        AND r.status <> 'resolved'
      OPTIONAL MATCH (p)-[:HAS_READINESS]->(rm:ReadinessMetric)
      WITH p, r, rm
      WHERE rm IS NULL OR toFloat(coalesce(rm.score, '100')) < 50
      RETURN DISTINCT p.id AS id, p.title AS title, p.name AS name,
             r.severity AS riskSeverity, rm.score AS readinessScore
    `);

    if (records.length === 0) return [];

    return [{
      type: 'risk_readiness_gap',
      severity: 'critical',
      title: 'High-Risk Projects with Low Change Readiness',
      description: `${records.length} high-risk projects have stakeholder readiness below 50%`,
      affectedEntities: records.map(r => r.title || r.name || r.id),
      affectedDomains: ['Risk', 'OCM'],
      recommendedActions: [
        'Increase OCM engagement and communication',
        'Consider risk mitigation through phased rollout',
        'Assess training completion status'
      ],
      recommendation: 'Address readiness gaps before proceeding',
      sourceAgents: ['Risk', 'OCM', 'TMO'],
      confidence: 0.85,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findUnmitigatedCriticalRisks(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (r:Risk)
      WHERE (r.severity = 'critical' OR r.severity = 'high')
        AND r.status <> 'resolved'
        AND (r.mitigationPlan IS NULL OR r.mitigationPlan = '')
        AND (r.mitigationStrategy IS NULL OR r.mitigationStrategy = '')
      RETURN r.id AS id, r.title AS title, r.name AS name, r.severity AS severity
    `);

    if (records.length === 0) return [];

    return [{
      type: 'unmitigated_critical_risk',
      severity: 'critical',
      title: 'Critical Risks Without Mitigation',
      description: `${records.length} critical risks have no assigned mitigation plan`,
      affectedEntities: records.map(r => r.title || r.name || r.id),
      affectedDomains: ['Risk', 'Governance'],
      recommendedActions: [
        'Immediately assign risk owners',
        'Develop mitigation plans within 48 hours',
        'Escalate to governance board'
      ],
      recommendation: 'Urgent: Create mitigation plans for critical risks',
      sourceAgents: ['Risk', 'Governance', 'PMO'],
      confidence: 0.95,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findDependencyBottlenecks(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (src:Project)-[:DEPENDS_ON]->(d:Dependency)-[:BLOCKS]->(tgt:Project)
      WHERE d.status IN ['blocked', 'at_risk']
      WITH src, count(DISTINCT tgt) AS blockedCount
      WHERE blockedCount >= 2
      RETURN src.id AS id, src.title AS title, src.name AS name, blockedCount
      ORDER BY blockedCount DESC
    `);

    if (records.length === 0) return [];

    return [{
      type: 'dependency_bottleneck',
      severity: records.length > 3 ? 'high' : 'warning',
      title: 'Cross-Project Dependency Bottlenecks',
      description: `${records.length} projects are blocking multiple downstream deliverables`,
      affectedEntities: records.map(r => r.title || r.name || r.id),
      affectedDomains: ['Planning', 'PMO'],
      recommendedActions: [
        'Prioritize blocking work items',
        'Consider parallel execution alternatives',
        'Communicate delays to downstream teams'
      ],
      recommendation: 'Prioritize resolution of blocking dependencies',
      sourceAgents: ['PMO', 'Planning', 'Notification'],
      confidence: 0.85,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findResourceContention(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (pe:Person)
      WHERE toFloat(coalesce(pe.totalAllocation, '0')) > 100
      RETURN pe.id AS id, pe.title AS title, pe.name AS name,
             pe.totalAllocation AS allocation, pe.role AS role
    `);

    if (records.length === 0) return [];

    return [{
      type: 'resource_contention',
      severity: 'warning',
      title: 'Resource Over-Allocation Detected',
      description: `${records.length} resources are allocated beyond 100% capacity`,
      affectedEntities: records.map(r => r.title || r.name || r.id),
      affectedDomains: ['PMO', 'Planning'],
      recommendedActions: [
        'Rebalance resource assignments',
        'Prioritize critical projects',
        'Consider hiring or contracting'
      ],
      recommendation: 'Rebalance workload to prevent burnout',
      sourceAgents: ['PMO', 'Planning'],
      confidence: 0.80,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findCascadeRiskChains(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH path = (p1:Project)-[:DEPENDS_ON]->(:Dependency)-[:BLOCKS]->(p2:Project)-[:DEPENDS_ON]->(:Dependency)-[:BLOCKS]->(p3:Project)
      WHERE p1.status <> 'completed' AND p2.status <> 'completed' AND p3.status <> 'completed'
      RETURN p1.title AS source, p2.title AS middle, p3.title AS downstream,
             p1.id AS sourceId, p2.id AS middleId, p3.id AS downstreamId
      LIMIT 10
    `);

    if (records.length === 0) return [];

    return [{
      type: 'cascade_risk_chain',
      severity: 'high',
      title: 'Multi-Hop Dependency Risk Chains',
      description: `${records.length} three-project dependency chains detected — delays cascade across portfolio`,
      affectedEntities: records.map(r => `${r.source} → ${r.middle} → ${r.downstream}`),
      affectedDomains: ['PMO', 'Planning', 'Risk'],
      recommendedActions: [
        'Map full cascade chains and identify critical nodes',
        'Add buffers at chain junction points',
        'Assign dedicated coordinators for multi-project chains'
      ],
      recommendation: 'Break or buffer multi-hop dependency chains to contain cascade risk',
      sourceAgents: ['PMO', 'Planning', 'Risk'],
      confidence: 0.88,
      relatedEntities: records.slice(0, 5),
    }];
  }

  private async findOverallocatedTeams(): Promise<CrossDomainInsight[]> {
    const records = await this.run(`
      MATCH (t:Team)<-[:ASSIGNED_TO]-(p:Project)
      WHERE p.status = 'active'
      WITH t, count(p) AS projectCount, collect(p.title) AS projects
      WHERE projectCount > 3
      RETURN t.id AS id, t.title AS title, t.name AS name,
             projectCount, projects
      ORDER BY projectCount DESC
    `);

    if (records.length === 0) return [];

    return [{
      type: 'team_overallocation',
      severity: 'warning',
      title: 'Teams Spread Across Too Many Projects',
      description: `${records.length} teams are assigned to 4+ active projects simultaneously`,
      affectedEntities: records.map(r => `${r.title || r.name} (${r.projectCount} projects)`),
      affectedDomains: ['PMO', 'Planning', 'OCM'],
      recommendedActions: [
        'Consolidate team assignments to reduce context switching',
        'Prioritize projects for focused delivery',
        'Assess impact on velocity and morale'
      ],
      recommendation: 'Reduce team assignments to improve focus and delivery speed',
      sourceAgents: ['PMO', 'Planning'],
      confidence: 0.82,
      relatedEntities: records.slice(0, 5),
    }];
  }

  async getAgentDomainInsights(agentType: string): Promise<CrossDomainInsight[]> {
    const allInsights = await this.generateCrossDomainInsights();
    const normalizedType = agentType.toLowerCase().replace(/agent$/i, '');
    return allInsights.filter(insight =>
      insight.sourceAgents.some(a => a.toLowerCase() === normalizedType) ||
      insight.affectedDomains?.some(d => d.toLowerCase() === normalizedType)
    );
  }

  async writeInsightToPalantir(insight: CrossDomainInsight): Promise<boolean> {
    const palantir = getPalantirService();
    if (!palantir) {
      console.warn('[Neo4jInsight] Cannot write insight — Palantir not available');
      return false;
    }

    try {
      await palantir.executeAction('atlas-create-insight', {
        title: insight.title,
        description: insight.description,
        insightType: insight.type,
        severity: insight.severity,
        sourceAgent: insight.sourceAgents.join(', '),
        affectedEntities: insight.affectedEntities,
        recommendation: insight.recommendedActions.join('; '),
        confidence: insight.confidence,
      });
      console.log(`[Neo4jInsight] Wrote insight to Palantir: ${insight.title}`);
      return true;
    } catch (error) {
      console.error('[Neo4jInsight] Failed to write insight to Palantir:', error);
      return false;
    }
  }

  private async generatePalantirFallbackInsights(): Promise<CrossDomainInsight[]> {
    const palantir = getPalantirService();
    if (!palantir) return [];

    const insights: CrossDomainInsight[] = [];

    try {
      const projectsResult = await palantir.listObjects('AtlasProject', { pageSize: 100 });
      const projects = projectsResult.data || [];

      const troubled = projects.filter((p: any) =>
        p.status === 'active' &&
        ((p.cpi !== undefined && p.cpi < 0.9) || (p.spi !== undefined && p.spi < 0.9))
      );

      if (troubled.length > 0) {
        insights.push({
          type: 'budget_schedule_correlation',
          severity: 'critical',
          title: 'Projects with Performance Issues',
          description: `${troubled.length} active projects have CPI or SPI below threshold`,
          affectedEntities: troubled.map((p: any) => p.title || p.name || p.id),
          affectedDomains: ['FinOps', 'PMO'],
          recommendedActions: ['Review performance metrics', 'Consider corrective action'],
          sourceAgents: ['FinOps', 'PMO'],
          confidence: 0.80,
        });
      }
    } catch (error) {
      console.warn('[Neo4jInsight] Palantir fallback also failed:', error);
    }

    return insights;
  }

  getStatus() {
    return {
      connected: this.connected,
      verified: this.verified,
      initialized: this.initialized,
      consecutiveFailures: this.consecutiveFailures,
      lastSyncTime: this.lastSyncTime > 0 ? new Date(this.lastSyncTime).toISOString() : null,
      dataSource: this.isAvailable() ? 'neo4j+palantir' : 'palantir-only',
    };
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.connected = false;
      console.log('[Neo4jInsight] Connection closed');
    }
  }
}

export const neo4jInsightService = new Neo4jInsightService();
