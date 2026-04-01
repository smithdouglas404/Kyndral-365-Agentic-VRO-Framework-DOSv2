/**
 * ONTOLOGY TOOLS FOR DYNAMIC AGENTS
 *
 * These tools enable agents to query the K360 semantic layer
 * for cross-domain insights and entity discovery.
 *
 * Tools are registered in the dynamic agent tool registry
 * so any agent can use semantic queries.
 */

import { z } from 'zod';
import { timbrQueryService } from '../services/TimbrQueryService.js';
import { ontologyService } from '../ontology/index.js';

// Tool definition interface (matches dynamic agent tool registry)
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: z.ZodSchema;
  execute: (input: any) => Promise<any>;
}

/**
 * Tool: Query entities by ontology concept
 */
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
    await timbrQueryService.initialize();
    return timbrQueryService.query(input.concept, input.filters, input.limit);
  },
};

/**
 * Tool: Get cross-domain insights
 */
export const getCrossDomainInsights: ToolDefinition = {
  id: 'get-cross-domain-insights',
  name: 'Get Cross-Domain Insights',
  description: 'Generate insights that span multiple agent domains (e.g., budget-schedule correlations, risk-readiness gaps)',
  category: 'ontology',
  inputSchema: z.object({
    agentFilter: z.string().optional().describe('Filter insights by agent type'),
  }),
  execute: async (input) => {
    await timbrQueryService.initialize();

    if (input.agentFilter) {
      return {
        insights: await timbrQueryService.getAgentDomainInsights(input.agentFilter),
      };
    }

    return {
      insights: await timbrQueryService.generateCrossDomainInsights(),
    };
  },
};

/**
 * Tool: Find orphaned projects
 */
export const findOrphanedProjects: ToolDefinition = {
  id: 'find-orphaned-projects',
  name: 'Find Orphaned Projects',
  description: 'Identify projects not linked to any OKR or strategic objective',
  category: 'ontology',
  inputSchema: z.object({}),
  execute: async () => {
    await timbrQueryService.initialize();
    const result = await timbrQueryService.query('k360:OrphanedProject');
    return {
      orphanedProjects: result.entities,
      count: result.count,
      recommendation: result.count > 0
        ? 'Review these projects and align to strategic objectives'
        : 'All projects are aligned to OKRs',
    };
  },
};

/**
 * Tool: Analyze strategic alignment
 */
export const analyzeStrategicAlignment: ToolDefinition = {
  id: 'analyze-strategic-alignment',
  name: 'Analyze Strategic Alignment',
  description: 'Assess how well projects align with OKRs and strategic themes',
  category: 'ontology',
  inputSchema: z.object({
    portfolioId: z.string().optional().describe('Limit to specific portfolio'),
  }),
  execute: async (input) => {
    await timbrQueryService.initialize();

    // Get all projects
    const projects = await timbrQueryService.query('k360:Project', input.portfolioId ? { portfolio_id: input.portfolioId } : undefined);

    // Get alignment scores
    const alignments = await timbrQueryService.query('k360:AlignmentScore');

    // Calculate overall alignment
    const alignedProjects = alignments.entities.filter((a: any) => a.alignment_score > 0.5);
    const alignmentRate = projects.count > 0 ? alignedProjects.length / projects.count : 0;

    return {
      totalProjects: projects.count,
      alignedProjects: alignedProjects.length,
      alignmentRate: Math.round(alignmentRate * 100),
      status: alignmentRate > 0.8 ? 'healthy' : alignmentRate > 0.5 ? 'needs_attention' : 'critical',
      insights: alignmentRate < 0.8
        ? ['Review unaligned projects for strategic fit', 'Consider deprioritizing low-alignment work']
        : ['Strategic alignment is strong'],
    };
  },
};

/**
 * Tool: Get agent domain concepts
 */
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

/**
 * Tool: Find related entities across domains
 */
export const findRelatedEntities: ToolDefinition = {
  id: 'find-related-entities',
  name: 'Find Related Entities',
  description: 'Find entities related to a given entity across agent domains',
  category: 'ontology',
  inputSchema: z.object({
    entityId: z.string().describe('Entity ID'),
    entityType: z.string().describe('Entity type (e.g., "k360:Project")'),
    relationshipTypes: z.array(z.string()).optional().describe('Filter by relationship types'),
  }),
  execute: async (input) => {
    await timbrQueryService.initialize();

    // Query for related entities based on common relationships
    const relationships: Record<string, any[]> = {};

    // Project relationships
    if (input.entityType.includes('Project')) {
      const risks = await timbrQueryService.query('k360:Risk', { project_id: input.entityId });
      const budgets = await timbrQueryService.query('k360:Budget', { project_id: input.entityId });

      relationships.risks = risks.entities;
      relationships.budgets = budgets.entities;
    }

    // Epic relationships
    if (input.entityType.includes('Epic')) {
      const features = await timbrQueryService.query('safe:Feature', { epic_id: input.entityId });
      relationships.features = features.entities;
    }

    return {
      entityId: input.entityId,
      entityType: input.entityType,
      relationships,
      relatedCount: Object.values(relationships).reduce((sum, arr) => sum + arr.length, 0),
    };
  },
};

/**
 * Tool: Detect compliance gaps
 */
export const detectComplianceGaps: ToolDefinition = {
  id: 'detect-compliance-gaps',
  name: 'Detect Compliance Gaps',
  description: 'Find entities that violate governance policies or lack required compliance checkpoints',
  category: 'ontology',
  inputSchema: z.object({
    framework: z.enum(['safe', 'pmbok', 'prince2', 'custom']).optional(),
  }),
  execute: async (input) => {
    await timbrQueryService.initialize();

    const insights = await timbrQueryService.generateCrossDomainInsights();
    const complianceInsights = insights.filter(i =>
      i.type.includes('compliance') || i.type.includes('risk') || i.type.includes('policy')
    );

    return {
      gaps: complianceInsights,
      count: complianceInsights.length,
      severity: complianceInsights.some(i => i.severity === 'critical') ? 'critical' : 'warning',
    };
  },
};

/**
 * Tool: Analyze resource contention
 */
export const analyzeResourceContention: ToolDefinition = {
  id: 'analyze-resource-contention',
  name: 'Analyze Resource Contention',
  description: 'Find resources over-allocated across multiple projects',
  category: 'ontology',
  inputSchema: z.object({
    threshold: z.number().optional().default(1.0).describe('Allocation threshold (1.0 = 100%)'),
  }),
  execute: async (input) => {
    await timbrQueryService.initialize();

    const resources = await timbrQueryService.query('k360:Resource');
    const overAllocated = resources.entities.filter((r: any) =>
      r.total_allocation > input.threshold
    );

    return {
      totalResources: resources.count,
      overAllocatedCount: overAllocated.length,
      overAllocatedResources: overAllocated.map((r: any) => ({
        id: r.id,
        name: r.name,
        allocation: r.total_allocation,
        projects: r.project_count,
      })),
      recommendation: overAllocated.length > 0
        ? 'Rebalance resource assignments to reduce contention'
        : 'Resource allocation is balanced',
    };
  },
};

/**
 * Tool: Get ontology status
 */
export const getOntologyStatus: ToolDefinition = {
  id: 'get-ontology-status',
  name: 'Get Ontology Status',
  description: 'Get current status of the ontology service and semantic query engine',
  category: 'ontology',
  inputSchema: z.object({}),
  execute: async () => {
    await timbrQueryService.initialize();
    return timbrQueryService.getStatus();
  },
};

// Export all tools as a registry
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

// Export tool map for easy lookup
export const ontologyToolMap = Object.fromEntries(
  ontologyTools.map(tool => [tool.id, tool])
);

/**
 * Get all ontology tools for a specific agent type
 */
export function getOntologyToolsForAgent(agentType: string): ToolDefinition[] {
  // All agents can use basic ontology tools
  const baseTools = [
    queryEntitiesByConcept,
    getAgentDomainConcepts,
    findRelatedEntities,
    getOntologyStatus,
  ];

  // Add domain-specific tools
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
