import { z } from 'zod';
import { neo4jInsightService } from '../services/Neo4jInsightService.js';
import { ontologyService } from '../ontology/index.js';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: z.ZodSchema;
  execute: (input: any) => Promise<any>;
}

export const queryEntitiesByConcept: ToolDefinition = {
  id: 'query-entities-by-concept',
  name: 'Query Entities by Concept',
  description: 'Find all entities of a specific ontology concept type (e.g., k360:Project, safe:Epic, k360:Risk)',
  category: 'ontology',
  inputSchema: z.object({
    concept: z.string().describe('Ontology concept (e.g., "k360:Project", "safe:Epic")'),
    filters: z.record(z.any()).optional().describe('Property filters'),
    limit: z.number().optional().default(50),
  }),
  execute: async (input) => {
    const palantir = getPalantirService();
    if (!palantir) return { entities: [], count: 0, source: 'unavailable' };

    const conceptMap: Record<string, string> = {
      'k360:Project': 'AtlasProject',
      'k360:Risk': 'AtlasRisk',
      'k360:Budget': 'AtlasBudget',
      'k360:Objective': 'AtlasObjective',
      'k360:KeyResult': 'AtlasKeyResult',
      'k360:Dependency': 'AtlasDependency',
      'k360:Team': 'AtlasTeam',
      'k360:Resource': 'AtlasPerson',
      'k360:Kpi': 'AtlasKpi',
      'safe:Epic': 'AtlasEpic',
      'safe:Feature': 'AtlasFeature',
      'safe:Team': 'AtlasTeam',
    };

    const palantirType = conceptMap[input.concept] || input.concept;
    try {
      const result = await palantir.listObjects(palantirType, { pageSize: input.limit });
      let data = result.data || [];

      if (input.filters && Object.keys(input.filters).length > 0) {
        data = data.filter((entity: any) =>
          Object.entries(input.filters!).every(([key, value]) => entity[key] === value)
        );
      }

      return { entities: data, count: data.length, source: 'palantir' };
    } catch (error: any) {
      return { entities: [], count: 0, source: 'error', error: error.message };
    }
  },
};

export const getCrossDomainInsights: ToolDefinition = {
  id: 'get-cross-domain-insights',
  name: 'Get Cross-Domain Insights',
  description: 'Generate insights that span multiple agent domains via Neo4j graph traversal',
  category: 'ontology',
  inputSchema: z.object({
    agentFilter: z.string().optional().describe('Filter insights by agent type'),
  }),
  execute: async (input) => {
    await neo4jInsightService.initialize();

    if (input.agentFilter) {
      return {
        insights: await neo4jInsightService.getAgentDomainInsights(input.agentFilter),
      };
    }

    return {
      insights: await neo4jInsightService.generateCrossDomainInsights(),
    };
  },
};

export const findOrphanedProjects: ToolDefinition = {
  id: 'find-orphaned-projects',
  name: 'Find Orphaned Projects',
  description: 'Identify projects not linked to any OKR or strategic objective',
  category: 'ontology',
  inputSchema: z.object({}),
  execute: async () => {
    await neo4jInsightService.initialize();
    const insights = await neo4jInsightService.generateCrossDomainInsights();
    const orphanInsight = insights.find(i => i.type === 'orphaned_project');

    return {
      orphanedProjects: orphanInsight?.relatedEntities || [],
      count: orphanInsight?.affectedEntities?.length || 0,
      recommendation: orphanInsight
        ? orphanInsight.recommendation
        : 'All projects are aligned to OKRs',
    };
  },
};

export const analyzeStrategicAlignment: ToolDefinition = {
  id: 'analyze-strategic-alignment',
  name: 'Analyze Strategic Alignment',
  description: 'Assess how well projects align with OKRs and strategic themes',
  category: 'ontology',
  inputSchema: z.object({
    portfolioId: z.string().optional().describe('Limit to specific portfolio'),
  }),
  execute: async (input) => {
    const palantir = getPalantirService();
    if (!palantir) return { totalProjects: 0, alignedProjects: 0, alignmentRate: 0, status: 'unavailable' };

    try {
      const projectsResult = await palantir.listObjects('AtlasProject', { pageSize: 100 });
      const projects = projectsResult.data || [];
      const objectivesResult = await palantir.listObjects('AtlasObjective', { pageSize: 100 });
      const objectives = objectivesResult.data || [];

      const linkedProjectIds = new Set(objectives.flatMap((o: any) => o.linkedProjectIds || []));
      const active = projects.filter((p: any) => p.status !== 'completed' && p.status !== 'cancelled');
      const aligned = active.filter((p: any) => linkedProjectIds.has(p.id) || p.objectiveId);
      const alignmentRate = active.length > 0 ? aligned.length / active.length : 0;

      return {
        totalProjects: active.length,
        alignedProjects: aligned.length,
        alignmentRate: Math.round(alignmentRate * 100),
        status: alignmentRate > 0.8 ? 'healthy' : alignmentRate > 0.5 ? 'needs_attention' : 'critical',
        insights: alignmentRate < 0.8
          ? ['Review unaligned projects for strategic fit', 'Consider deprioritizing low-alignment work']
          : ['Strategic alignment is strong'],
      };
    } catch (error: any) {
      return { totalProjects: 0, alignedProjects: 0, alignmentRate: 0, status: 'error', error: error.message };
    }
  },
};

export const getAgentDomainConcepts: ToolDefinition = {
  id: 'get-agent-domain-concepts',
  name: 'Get Agent Domain Concepts',
  description: 'List all ontology concepts for a specific agent domain',
  category: 'ontology',
  inputSchema: z.object({
    agentType: z.string().describe('Agent type (e.g., "VRO", "PMO", "FinOps")'),
  }),
  execute: async (input) => {
    await ontologyService.loadOntologies();
    const concepts = ontologyService.getAgentDomainConcepts(input.agentType);
    return {
      agentType: input.agentType,
      concepts,
      count: concepts.length,
    };
  },
};

export const findRelatedEntities: ToolDefinition = {
  id: 'find-related-entities',
  name: 'Find Related Entities',
  description: 'Find entities related to a given entity across agent domains via Neo4j graph',
  category: 'ontology',
  inputSchema: z.object({
    entityId: z.string().describe('Entity ID'),
    entityType: z.string().describe('Entity type (e.g., "k360:Project")'),
    relationshipTypes: z.array(z.string()).optional().describe('Filter by relationship types'),
  }),
  execute: async (input) => {
    const palantir = getPalantirService();
    if (!palantir) return { entityId: input.entityId, entityType: input.entityType, relationships: {}, relatedCount: 0 };

    const relationships: Record<string, any[]> = {};

    try {
      if (input.entityType.includes('Project')) {
        const risksResult = await palantir.listObjects('AtlasRisk', { pageSize: 100 });
        const budgetsResult = await palantir.listObjects('AtlasBudget', { pageSize: 100 });

        relationships.risks = (risksResult.data || []).filter((r: any) => r.projectId === input.entityId);
        relationships.budgets = (budgetsResult.data || []).filter((b: any) => b.projectId === input.entityId);
      }

      if (input.entityType.includes('Epic')) {
        const featuresResult = await palantir.listObjects('AtlasFeature', { pageSize: 100 });
        relationships.features = (featuresResult.data || []).filter((f: any) => f.epicId === input.entityId);
      }
    } catch (error: any) {
      // Graceful fallback
    }

    return {
      entityId: input.entityId,
      entityType: input.entityType,
      relationships,
      relatedCount: Object.values(relationships).reduce((sum, arr) => sum + arr.length, 0),
    };
  },
};

export const detectComplianceGaps: ToolDefinition = {
  id: 'detect-compliance-gaps',
  name: 'Detect Compliance Gaps',
  description: 'Find entities that violate governance policies or lack required compliance checkpoints',
  category: 'ontology',
  inputSchema: z.object({
    framework: z.enum(['safe', 'pmbok', 'prince2', 'custom']).optional(),
  }),
  execute: async (input) => {
    await neo4jInsightService.initialize();

    const insights = await neo4jInsightService.generateCrossDomainInsights();
    const complianceInsights = insights.filter(i =>
      i.type.includes('compliance') || i.type.includes('risk') || i.type.includes('policy') || i.type.includes('unmitigated')
    );

    return {
      gaps: complianceInsights,
      count: complianceInsights.length,
      severity: complianceInsights.some(i => i.severity === 'critical') ? 'critical' : 'warning',
    };
  },
};

export const analyzeResourceContention: ToolDefinition = {
  id: 'analyze-resource-contention',
  name: 'Analyze Resource Contention',
  description: 'Find resources over-allocated across multiple projects',
  category: 'ontology',
  inputSchema: z.object({
    threshold: z.number().optional().default(1.0).describe('Allocation threshold (1.0 = 100%)'),
  }),
  execute: async (input) => {
    const palantir = getPalantirService();
    if (!palantir) return { totalResources: 0, overAllocatedCount: 0, overAllocatedResources: [] };

    try {
      const personsResult = await palantir.listObjects('AtlasPerson', { pageSize: 100 });
      const resources = personsResult.data || [];
      const thresholdPercent = input.threshold * 100;
      const overAllocated = resources.filter((r: any) =>
        r.totalAllocation !== undefined && r.totalAllocation > thresholdPercent
      );

      return {
        totalResources: resources.length,
        overAllocatedCount: overAllocated.length,
        overAllocatedResources: overAllocated.map((r: any) => ({
          id: r.id,
          name: r.name || r.title,
          allocation: r.totalAllocation,
          projects: r.projectCount,
        })),
        recommendation: overAllocated.length > 0
          ? 'Rebalance resource assignments to reduce contention'
          : 'Resource allocation is balanced',
      };
    } catch (error: any) {
      return { totalResources: 0, overAllocatedCount: 0, overAllocatedResources: [], error: error.message };
    }
  },
};

export const getOntologyStatus: ToolDefinition = {
  id: 'get-ontology-status',
  name: 'Get Ontology Status',
  description: 'Get current status of the ontology service and graph query engine',
  category: 'ontology',
  inputSchema: z.object({}),
  execute: async () => {
    const neo4jStatus = neo4jInsightService.getStatus();
    return {
      ...neo4jStatus,
      ontologyStats: ontologyService.getStatistics(),
    };
  },
};

export const ontologyTools: ToolDefinition[] = [
  queryEntitiesByConcept,
  getCrossDomainInsights,
  findOrphanedProjects,
  analyzeStrategicAlignment,
  getAgentDomainConcepts,
  findRelatedEntities,
  detectComplianceGaps,
  analyzeResourceContention,
  getOntologyStatus,
];

export const ontologyToolMap = Object.fromEntries(
  ontologyTools.map(tool => [tool.id, tool])
);

export function getOntologyToolsForAgent(agentType: string): ToolDefinition[] {
  const baseTools = [
    queryEntitiesByConcept,
    getAgentDomainConcepts,
    findRelatedEntities,
    getOntologyStatus,
  ];

  const normalizedType = agentType.toLowerCase().replace(/agent$/i, '');

  switch (normalizedType) {
    case 'okr':
    case 'vro':
      return [...baseTools, analyzeStrategicAlignment, findOrphanedProjects];
    case 'governance':
    case 'risk':
      return [...baseTools, detectComplianceGaps, getCrossDomainInsights];
    case 'planning':
    case 'pmo':
      return [...baseTools, analyzeResourceContention, getCrossDomainInsights];
    default:
      return [...baseTools, getCrossDomainInsights];
  }
}
