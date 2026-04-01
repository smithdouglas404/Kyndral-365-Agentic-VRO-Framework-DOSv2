/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MASTRA ONTOLOGY TOOLS FOR KYNDRYL FABRIC [K360]
 * 
 * These tool definitions enable K360 agents to query the semantic layer
 * through Timbr.ai or Neo4j+n10s, providing ontology-aware reasoning.
 * 
 * File: mastra-ontology-tools.ts
 * Version: 1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createTool, Tool } from '@mastra/core';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: TIMBR.AI CLIENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface TimbrConfig {
  endpoint: string;
  knowledgeGraph: string;
  apiKey: string;
}

const timbrConfig: TimbrConfig = {
  endpoint: process.env.TIMBR_ENDPOINT || 'https://your-timbr-instance.timbr.ai',
  knowledgeGraph: 'k360_enterprise_ontology',
  apiKey: process.env.TIMBR_API_KEY || '',
};

/**
 * Execute a semantic SQL query against Timbr.ai
 */
async function executeTimbrQuery<T>(query: string): Promise<T[]> {
  const response = await fetch(`${timbrConfig.endpoint}/api/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${timbrConfig.apiKey}`,
    },
    body: JSON.stringify({
      knowledge_graph: timbrConfig.knowledgeGraph,
      query,
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error(`Timbr query failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data as T[];
}

/**
 * Execute a SPARQL query against Timbr.ai
 */
async function executeSparqlQuery<T>(sparql: string): Promise<T[]> {
  const response = await fetch(`${timbrConfig.endpoint}/api/v1/sparql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      'Authorization': `Bearer ${timbrConfig.apiKey}`,
      'Accept': 'application/json',
    },
    body: sparql,
  });

  if (!response.ok) {
    throw new Error(`SPARQL query failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.results.bindings as T[];
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SHARED ONTOLOGY TOOLS (All Agents)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Find entities by concept type
 * Used by all agents to discover entities of a specific class
 */
export const findEntitiesByConcept = createTool({
  id: 'find-entities-by-concept',
  description: 'Find all entities of a specific ontology concept type (e.g., Epic, Project, Risk)',
  inputSchema: z.object({
    concept: z.string().describe('Ontology concept name (e.g., "safe:Epic", "k360:Project", "k360:Risk")'),
    filters: z.record(z.string()).optional().describe('Property filters as key-value pairs'),
    limit: z.number().optional().default(100).describe('Maximum number of results'),
  }),
  execute: async ({ context }) => {
    const { concept, filters, limit } = context;
    
    // Build semantic SQL query
    let query = `SELECT * FROM \`${concept}\``;
    
    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters)
        .map(([key, value]) => `\`${key}\` = '${value}'`)
        .join(' AND ');
      query += ` WHERE ${conditions}`;
    }
    
    query += ` LIMIT ${limit}`;
    
    const results = await executeTimbrQuery(query);
    return { entities: results, count: results.length };
  },
});

/**
 * Tool: Get entity relationships
 * Traverse ontology relationships from a given entity
 */
export const getEntityRelationships = createTool({
  id: 'get-entity-relationships',
  description: 'Get all relationships for an entity, optionally filtered by relationship type',
  inputSchema: z.object({
    entityId: z.string().describe('Entity ID'),
    entityType: z.string().describe('Entity concept type'),
    relationshipType: z.string().optional().describe('Specific relationship to follow (e.g., "k360:alignsTo")'),
    direction: z.enum(['outgoing', 'incoming', 'both']).optional().default('both'),
  }),
  execute: async ({ context }) => {
    const { entityId, entityType, relationshipType, direction } = context;
    
    const sparql = `
      PREFIX k360: <https://kyndryl.com/k360/ontology#>
      PREFIX safe: <https://scaledagileframework.com/ontology#>
      
      SELECT ?relationship ?targetType ?targetId ?targetLabel
      WHERE {
        ${direction !== 'incoming' ? `
          <${entityId}> ?relationship ?target .
          ?target a ?targetType .
          OPTIONAL { ?target rdfs:label ?targetLabel }
          BIND(?target AS ?targetId)
        ` : ''}
        ${direction === 'both' ? 'UNION' : ''}
        ${direction !== 'outgoing' ? `
          ?source ?relationship <${entityId}> .
          ?source a ?targetType .
          OPTIONAL { ?source rdfs:label ?targetLabel }
          BIND(?source AS ?targetId)
        ` : ''}
        ${relationshipType ? `FILTER(?relationship = ${relationshipType})` : ''}
      }
    `;
    
    const results = await executeSparqlQuery(sparql);
    return { relationships: results };
  },
});

/**
 * Tool: Temporal query - point in time
 * Get entity state at a specific point in time
 */
export const getEntityAtTime = createTool({
  id: 'get-entity-at-time',
  description: 'Get the state of an entity at a specific point in time (for TKG temporal queries)',
  inputSchema: z.object({
    entityId: z.string().describe('Entity ID'),
    entityType: z.string().describe('Entity concept type'),
    timestamp: z.string().describe('ISO timestamp for point-in-time query'),
  }),
  execute: async ({ context }) => {
    const { entityId, entityType, timestamp } = context;
    
    const query = `
      SELECT * FROM \`${entityType}\`
      WHERE id = '${entityId}'
        AND valid_from <= '${timestamp}'
        AND (valid_to IS NULL OR valid_to > '${timestamp}')
    `;
    
    const results = await executeTimbrQuery(query);
    return { entity: results[0] || null };
  },
});

/**
 * Tool: Causal chain traversal
 * Trace causedBy relationships for root cause analysis
 */
export const traceCausalChain = createTool({
  id: 'trace-causal-chain',
  description: 'Trace the causal chain backwards from an entity to find root causes',
  inputSchema: z.object({
    entityId: z.string().describe('Starting entity ID'),
    maxDepth: z.number().optional().default(5).describe('Maximum depth to traverse'),
  }),
  execute: async ({ context }) => {
    const { entityId, maxDepth } = context;
    
    const sparql = `
      PREFIX k360: <https://kyndryl.com/k360/ontology#>
      
      SELECT ?entity ?cause ?depth
      WHERE {
        {
          SELECT ?entity ?cause (1 AS ?depth)
          WHERE { <${entityId}> k360:causedBy ?cause }
        }
        UNION
        {
          SELECT ?entity ?cause ?depth
          WHERE {
            ?entity k360:causedBy ?cause .
            ?prevCause k360:causedBy ?entity .
            BIND(?prevDepth + 1 AS ?depth)
            FILTER(?depth <= ${maxDepth})
          }
        }
      }
      ORDER BY ?depth
    `;
    
    const results = await executeSparqlQuery(sparql);
    return { causalChain: results };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: VRO AGENT TOOLS (Value Realization)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Get investment portfolio analysis
 */
export const analyzeInvestmentPortfolio = createTool({
  id: 'vro-analyze-investment-portfolio',
  description: 'VRO Agent: Analyze investments with ROI, NPV, and benefit realization status',
  inputSchema: z.object({
    portfolioId: z.string().optional().describe('Filter by portfolio ID'),
    roiThreshold: z.number().optional().describe('Minimum ROI threshold'),
    includeRealizations: z.boolean().optional().default(true),
  }),
  execute: async ({ context }) => {
    const { portfolioId, roiThreshold, includeRealizations } = context;
    
    let query = `
      SELECT 
        i.id,
        i.name,
        i.roi,
        i.npv,
        i.irr,
        i.payback_months,
        i.status,
        e.name as epic_name,
        e.status as epic_status
      FROM \`k360:Investment\` i
      LEFT JOIN \`safe:Epic\` e ON i.fundsEpic = e.id
    `;
    
    const conditions = [];
    if (portfolioId) conditions.push(`i.belongsToPortfolio = '${portfolioId}'`);
    if (roiThreshold) conditions.push(`i.roi >= ${roiThreshold}`);
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const investments = await executeTimbrQuery(query);
    
    let realizations = [];
    if (includeRealizations) {
      const realizationQuery = `
        SELECT 
          br.id,
          br.actual_value,
          b.target_value,
          b.investment_id,
          (br.actual_value / b.target_value) as realization_rate
        FROM \`k360:BenefitRealization\` br
        JOIN \`k360:Benefit\` b ON br.tracks_realization_of = b.id
      `;
      realizations = await executeTimbrQuery(realizationQuery);
    }
    
    return { investments, realizations };
  },
});

/**
 * Tool: Find underperforming investments
 */
export const findUnderperformingInvestments = createTool({
  id: 'vro-find-underperforming-investments',
  description: 'VRO Agent: Identify investments where ROI is below target or benefits are not being realized',
  inputSchema: z.object({
    roiThreshold: z.number().optional().default(0.1).describe('ROI below this is underperforming'),
    benefitRealizationThreshold: z.number().optional().default(0.8).describe('Realization below this percentage is flagged'),
  }),
  execute: async ({ context }) => {
    const { roiThreshold, benefitRealizationThreshold } = context;
    
    // Low ROI investments
    const lowRoiQuery = `
      SELECT i.*, 'low_roi' as issue_type
      FROM \`k360:Investment\` i
      WHERE i.roi < ${roiThreshold}
        AND i.status = 'Active'
    `;
    
    // Unrealized benefits
    const unrealizedQuery = `
      SELECT 
        i.id as investment_id,
        i.name as investment_name,
        b.name as benefit_name,
        b.target_value,
        COALESCE(br.actual_value, 0) as actual_value,
        'unrealized_benefit' as issue_type
      FROM \`k360:Investment\` i
      JOIN \`k360:Benefit\` b ON b.delivered_by = i.id
      LEFT JOIN \`k360:BenefitRealization\` br ON br.tracks_realization_of = b.id
      WHERE COALESCE(br.actual_value, 0) / b.target_value < ${benefitRealizationThreshold}
    `;
    
    const lowRoi = await executeTimbrQuery(lowRoiQuery);
    const unrealized = await executeTimbrQuery(unrealizedQuery);
    
    return { 
      lowRoiInvestments: lowRoi, 
      unrealizedBenefits: unrealized,
      summary: {
        lowRoiCount: lowRoi.length,
        unrealizedCount: unrealized.length,
      }
    };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: PMO AGENT TOOLS (Portfolio Delivery)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Get project health dashboard
 */
export const getProjectHealthDashboard = createTool({
  id: 'pmo-project-health-dashboard',
  description: 'PMO Agent: Get comprehensive project health including RAG status, flow metrics, and schedule variance',
  inputSchema: z.object({
    divisionId: z.string().optional().describe('Filter by division'),
    statusFilter: z.array(z.string()).optional().describe('Filter by RAG status'),
  }),
  execute: async ({ context }) => {
    const { divisionId, statusFilter } = context;
    
    let query = `
      SELECT 
        p.id,
        p.name,
        p.rag_status,
        p.percent_complete,
        p.start_date,
        p.planned_end_date,
        d.name as division_name,
        sv.spi,
        sv.sv_days as schedule_variance_days,
        fm.cycle_time,
        fm.throughput,
        fm.wip,
        fm.flow_efficiency
      FROM \`k360:Project\` p
      LEFT JOIN \`safe:Division\` d ON p.belongs_to_division = d.id
      LEFT JOIN \`k360:ScheduleVariance\` sv ON sv.variance_for_project = p.id
      LEFT JOIN \`k360:FlowMetric\` fm ON fm.metrics_for_project = p.id
      WHERE p.status NOT IN ('Completed', 'Cancelled')
    `;
    
    if (divisionId) query += ` AND p.belongs_to_division = '${divisionId}'`;
    if (statusFilter?.length) {
      query += ` AND p.rag_status IN (${statusFilter.map(s => `'${s}'`).join(',')})`;
    }
    
    const projects = await executeTimbrQuery(query);
    
    // Aggregate by RAG status
    const ragSummary = {
      red: projects.filter((p: any) => p.rag_status === 'Red').length,
      amber: projects.filter((p: any) => p.rag_status === 'Amber').length,
      green: projects.filter((p: any) => p.rag_status === 'Green').length,
    };
    
    return { projects, ragSummary };
  },
});

/**
 * Tool: Detect schedule slippage
 */
export const detectScheduleSlippage = createTool({
  id: 'pmo-detect-schedule-slippage',
  description: 'PMO Agent: Identify projects with declining velocity or schedule performance',
  inputSchema: z.object({
    spiThreshold: z.number().optional().default(0.9).describe('SPI below this indicates slippage'),
    velocityDeclinePercent: z.number().optional().default(0.15).describe('Velocity decline percentage to flag'),
  }),
  execute: async ({ context }) => {
    const { spiThreshold, velocityDeclinePercent } = context;
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.rag_status,
        sv.spi,
        sv.sv_days,
        fm.flow_velocity as current_velocity,
        LAG(fm.flow_velocity) OVER (PARTITION BY p.id ORDER BY fm.measured_at) as prev_velocity,
        CASE 
          WHEN LAG(fm.flow_velocity) OVER (PARTITION BY p.id ORDER BY fm.measured_at) > 0 
          THEN (LAG(fm.flow_velocity) OVER (PARTITION BY p.id ORDER BY fm.measured_at) - fm.flow_velocity) 
               / LAG(fm.flow_velocity) OVER (PARTITION BY p.id ORDER BY fm.measured_at)
          ELSE 0 
        END as velocity_decline
      FROM \`k360:Project\` p
      JOIN \`k360:ScheduleVariance\` sv ON sv.variance_for_project = p.id
      JOIN \`k360:FlowMetric\` fm ON fm.metrics_for_project = p.id
      WHERE p.status = 'Active'
        AND (sv.spi < ${spiThreshold} OR 
             (LAG(fm.flow_velocity) OVER (PARTITION BY p.id ORDER BY fm.measured_at) - fm.flow_velocity) 
             / NULLIF(LAG(fm.flow_velocity) OVER (PARTITION BY p.id ORDER BY fm.measured_at), 0) > ${velocityDeclinePercent})
    `;
    
    const slippingProjects = await executeTimbrQuery(query);
    return { slippingProjects };
  },
});

/**
 * Tool: Analyze dependencies
 */
export const analyzeDependencies = createTool({
  id: 'pmo-analyze-dependencies',
  description: 'PMO Agent: Analyze cross-project dependencies and identify blocking risks',
  inputSchema: z.object({
    projectId: z.string().optional().describe('Analyze dependencies for specific project'),
    includeTransitive: z.boolean().optional().default(true),
  }),
  execute: async ({ context }) => {
    const { projectId, includeTransitive } = context;
    
    const sparql = `
      PREFIX k360: <https://kyndryl.com/k360/ontology#>
      PREFIX safe: <https://scaledagileframework.com/ontology#>
      
      SELECT ?project ?projectName ?dependsOn ?dependsOnName ?status ?riskLevel
      WHERE {
        ?dep a safe:Dependency ;
             k360:sourceWorkItem ?project ;
             k360:targetWorkItem ?dependsOn ;
             k360:dependencyStatus ?status ;
             k360:dependencyRisk ?riskLevel .
        ?project rdfs:label ?projectName .
        ?dependsOn rdfs:label ?dependsOnName .
        ${projectId ? `FILTER(?project = <${projectId}>)` : ''}
      }
      ORDER BY DESC(?riskLevel)
    `;
    
    const dependencies = await executeSparqlQuery(sparql);
    
    // Find blocking dependencies (high risk + target not completed)
    const blockingDeps = dependencies.filter((d: any) => 
      d.riskLevel?.value === 'High' && d.status?.value !== 'Completed'
    );
    
    return { dependencies, blockingDependencies: blockingDeps };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: FINOPS AGENT TOOLS (Financial Operations)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Budget utilization analysis
 */
export const analyzeBudgetUtilization = createTool({
  id: 'finops-budget-utilization',
  description: 'FinOps Agent: Analyze budget utilization across projects and identify anomalies',
  inputSchema: z.object({
    utilizationThreshold: z.number().optional().default(0.9).describe('Flag projects above this utilization'),
    includeForecast: z.boolean().optional().default(true),
  }),
  execute: async ({ context }) => {
    const { utilizationThreshold, includeForecast } = context;
    
    const query = `
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.percent_complete,
        b.budget_amount,
        b.actual_spend,
        b.actual_spend / NULLIF(b.budget_amount, 0) as utilization,
        b.cpi,
        f.burn_rate,
        f.estimate_at_completion as eac,
        f.estimate_to_complete as etc,
        CASE 
          WHEN b.actual_spend / NULLIF(b.budget_amount, 0) > p.percent_complete 
          THEN 'Over-spending'
          WHEN b.actual_spend / NULLIF(b.budget_amount, 0) < p.percent_complete * 0.8 
          THEN 'Under-spending'
          ELSE 'On-track'
        END as budget_health
      FROM \`k360:Project\` p
      JOIN \`k360:Budget\` b ON b.budget_for_project = p.id
      ${includeForecast ? "LEFT JOIN `k360:Forecast` f ON f.forecast_for_budget = b.id" : ""}
      WHERE p.status = 'Active'
      ORDER BY utilization DESC
    `;
    
    const budgets = await executeTimbrQuery(query);
    
    const overBudget = budgets.filter((b: any) => b.utilization > utilizationThreshold);
    const atRisk = budgets.filter((b: any) => b.budget_health === 'Over-spending');
    
    return { 
      budgets, 
      overBudget, 
      atRisk,
      summary: {
        totalBudget: budgets.reduce((sum: number, b: any) => sum + (b.budget_amount || 0), 0),
        totalSpend: budgets.reduce((sum: number, b: any) => sum + (b.actual_spend || 0), 0),
        overBudgetCount: overBudget.length,
        atRiskCount: atRisk.length,
      }
    };
  },
});

/**
 * Tool: Detect cost anomalies
 */
export const detectCostAnomalies = createTool({
  id: 'finops-detect-cost-anomalies',
  description: 'FinOps Agent: Identify unusual spending patterns or cost spikes',
  inputSchema: z.object({
    projectId: z.string().optional(),
    lookbackDays: z.number().optional().default(30),
    stdDevThreshold: z.number().optional().default(2).describe('Standard deviations from mean to flag'),
  }),
  execute: async ({ context }) => {
    const { projectId, lookbackDays, stdDevThreshold } = context;
    
    const query = `
      WITH cost_stats AS (
        SELECT 
          project_id,
          AVG(amount) as avg_cost,
          STDDEV(amount) as stddev_cost
        FROM \`k360:CostRecord\`
        WHERE transaction_date >= CURRENT_DATE - INTERVAL '${lookbackDays}' DAY
        GROUP BY project_id
      )
      SELECT 
        cr.id,
        cr.project_id,
        cr.amount,
        cr.transaction_date,
        cr.description,
        cr.cost_type,
        cs.avg_cost,
        cs.stddev_cost,
        (cr.amount - cs.avg_cost) / NULLIF(cs.stddev_cost, 0) as z_score
      FROM \`k360:CostRecord\` cr
      JOIN cost_stats cs ON cr.project_id = cs.project_id
      WHERE ABS((cr.amount - cs.avg_cost) / NULLIF(cs.stddev_cost, 0)) > ${stdDevThreshold}
      ${projectId ? `AND cr.project_id = '${projectId}'` : ''}
      ORDER BY ABS((cr.amount - cs.avg_cost) / NULLIF(cs.stddev_cost, 0)) DESC
    `;
    
    const anomalies = await executeTimbrQuery(query);
    return { anomalies };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: OKR AGENT TOOLS (Strategy Execution)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Analyze strategic alignment
 */
export const analyzeStrategicAlignment = createTool({
  id: 'okr-analyze-alignment',
  description: 'OKR Agent: Analyze how well projects and epics align to strategic OKRs',
  inputSchema: z.object({
    okrId: z.string().optional().describe('Specific OKR to analyze'),
    quarter: z.string().optional().describe('OKR quarter (e.g., "Q1")'),
    year: z.number().optional(),
  }),
  execute: async ({ context }) => {
    const { okrId, quarter, year } = context;
    
    const query = `
      SELECT 
        o.id as okr_id,
        o.title as okr_title,
        o.level as okr_level,
        o.quarter,
        o.year,
        obj.description as objective,
        kr.title as key_result,
        kr.target_value,
        kr.current_value,
        kr.current_value / NULLIF(kr.target_value, 0) as progress,
        e.id as epic_id,
        e.name as epic_name,
        e.status as epic_status,
        al.alignment_score
      FROM \`k360:OKR\` o
      JOIN \`k360:Objective\` obj ON obj.belongs_to_okr = o.id
      JOIN \`k360:KeyResult\` kr ON kr.belongs_to_objective = obj.id
      LEFT JOIN \`k360:AlignmentScore\` al ON al.aligns_to_okr = o.id
      LEFT JOIN \`safe:Epic\` e ON al.alignment_for_epic = e.id
      WHERE 1=1
      ${okrId ? `AND o.id = '${okrId}'` : ''}
      ${quarter ? `AND o.quarter = '${quarter}'` : ''}
      ${year ? `AND o.year = ${year}` : ''}
      ORDER BY o.level, o.id, al.alignment_score DESC
    `;
    
    const alignment = await executeTimbrQuery(query);
    
    // Calculate aggregate stats
    const okrProgress = alignment.reduce((acc: any, row: any) => {
      if (!acc[row.okr_id]) {
        acc[row.okr_id] = { 
          title: row.okr_title, 
          keyResults: [], 
          alignedEpics: [] 
        };
      }
      if (row.key_result) {
        acc[row.okr_id].keyResults.push({
          name: row.key_result,
          progress: row.progress,
        });
      }
      if (row.epic_id) {
        acc[row.okr_id].alignedEpics.push({
          id: row.epic_id,
          name: row.epic_name,
          alignmentScore: row.alignment_score,
        });
      }
      return acc;
    }, {});
    
    return { alignment, okrProgress };
  },
});

/**
 * Tool: Find orphaned projects
 */
export const findOrphanedProjects = createTool({
  id: 'okr-find-orphaned-projects',
  description: 'OKR Agent: Find projects not aligned to any OKR (orphaned work)',
  inputSchema: z.object({
    includeCompleted: z.boolean().optional().default(false),
  }),
  execute: async ({ context }) => {
    const { includeCompleted } = context;
    
    // Use the semantic view defined in Timbr
    const query = `
      SELECT 
        p.id,
        p.name,
        p.status,
        p.rag_status,
        p.percent_complete,
        d.name as division_name,
        b.budget_amount,
        b.actual_spend
      FROM \`k360:OrphanedProject\` op
      JOIN \`k360:Project\` p ON op.id = p.id
      LEFT JOIN \`safe:Division\` d ON p.belongs_to_division = d.id
      LEFT JOIN \`k360:Budget\` b ON b.budget_for_project = p.id
      ${!includeCompleted ? "WHERE p.status NOT IN ('Completed', 'Cancelled')" : ''}
    `;
    
    const orphanedProjects = await executeTimbrQuery(query);
    
    const totalOrphanedBudget = orphanedProjects.reduce(
      (sum: number, p: any) => sum + (p.budget_amount || 0), 
      0
    );
    
    return { 
      orphanedProjects, 
      count: orphanedProjects.length,
      totalOrphanedBudget,
    };
  },
});

/**
 * Tool: Track key result progress
 */
export const trackKeyResultProgress = createTool({
  id: 'okr-track-key-result-progress',
  description: 'OKR Agent: Track progress of key results over time',
  inputSchema: z.object({
    keyResultId: z.string().optional(),
    objectiveId: z.string().optional(),
    okrId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { keyResultId, objectiveId, okrId } = context;
    
    const query = `
      SELECT 
        kr.id,
        kr.title,
        kr.target_value,
        kr.current_value,
        kr.current_value / NULLIF(kr.target_value, 0) as progress,
        kr.status,
        kr.unit,
        obj.description as objective,
        o.title as okr_title,
        o.quarter,
        o.year
      FROM \`k360:KeyResult\` kr
      JOIN \`k360:Objective\` obj ON kr.belongs_to_objective = obj.id
      JOIN \`k360:OKR\` o ON obj.belongs_to_okr = o.id
      WHERE 1=1
      ${keyResultId ? `AND kr.id = '${keyResultId}'` : ''}
      ${objectiveId ? `AND obj.id = '${objectiveId}'` : ''}
      ${okrId ? `AND o.id = '${okrId}'` : ''}
      ORDER BY kr.current_value / NULLIF(kr.target_value, 0) ASC
    `;
    
    const keyResults = await executeTimbrQuery(query);
    
    const atRisk = keyResults.filter((kr: any) => kr.progress < 0.5);
    const onTrack = keyResults.filter((kr: any) => kr.progress >= 0.7);
    
    return { 
      keyResults, 
      atRisk, 
      onTrack,
      summary: {
        total: keyResults.length,
        atRiskCount: atRisk.length,
        onTrackCount: onTrack.length,
        avgProgress: keyResults.reduce((sum: number, kr: any) => sum + (kr.progress || 0), 0) / keyResults.length,
      }
    };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: GOVERNANCE AGENT TOOLS (Compliance & Risk)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Check policy compliance
 */
export const checkPolicyCompliance = createTool({
  id: 'governance-check-compliance',
  description: 'Governance Agent: Check compliance status across projects against active policies',
  inputSchema: z.object({
    projectId: z.string().optional(),
    policyId: z.string().optional(),
    statusFilter: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    const { projectId, policyId, statusFilter } = context;
    
    const query = `
      SELECT 
        cc.id,
        cc.name as checkpoint_name,
        cc.status as compliance_status,
        cc.type as checkpoint_type,
        cc.checked_at,
        cc.findings_json,
        p.id as project_id,
        p.name as project_name,
        pol.id as policy_id,
        pol.name as policy_name,
        pol.type as policy_type
      FROM \`k360:ComplianceCheckpoint\` cc
      JOIN \`k360:Project\` p ON cc.checkpoint_for_project = p.id
      JOIN \`k360:Policy\` pol ON cc.checks_policy = pol.id
      WHERE pol.status = 'Active'
      ${projectId ? `AND p.id = '${projectId}'` : ''}
      ${policyId ? `AND pol.id = '${policyId}'` : ''}
      ${statusFilter?.length ? `AND cc.status IN (${statusFilter.map(s => `'${s}'`).join(',')})` : ''}
      ORDER BY cc.checked_at DESC
    `;
    
    const checkpoints = await executeTimbrQuery(query);
    
    const nonCompliant = checkpoints.filter((c: any) => c.compliance_status === 'Non-Compliant');
    const pendingReview = checkpoints.filter((c: any) => c.compliance_status === 'Pending Review');
    
    return { 
      checkpoints, 
      nonCompliant, 
      pendingReview,
      summary: {
        total: checkpoints.length,
        compliant: checkpoints.filter((c: any) => c.compliance_status === 'Compliant').length,
        nonCompliantCount: nonCompliant.length,
        pendingCount: pendingReview.length,
      }
    };
  },
});

/**
 * Tool: Analyze risk register
 */
export const analyzeRiskRegister = createTool({
  id: 'governance-analyze-risks',
  description: 'Governance Agent: Analyze the enterprise risk register with severity scoring',
  inputSchema: z.object({
    projectId: z.string().optional(),
    minSeverity: z.number().optional().default(0.5),
    status: z.array(z.string()).optional().default(['Open']),
  }),
  execute: async ({ context }) => {
    const { projectId, minSeverity, status } = context;
    
    const query = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.probability,
        r.impact,
        r.probability * r.impact as severity,
        r.status,
        r.category,
        r.proximity,
        p.id as project_id,
        p.name as project_name,
        COUNT(rm.id) as mitigation_count,
        STRING_AGG(rm.title, '; ') as mitigations
      FROM \`k360:Risk\` r
      LEFT JOIN \`k360:Project\` p ON r.risk_for_project = p.id
      LEFT JOIN \`k360:RiskMitigation\` rm ON rm.mitigates_risk = r.id
      WHERE r.probability * r.impact >= ${minSeverity}
        AND r.status IN (${status.map(s => `'${s}'`).join(',')})
        ${projectId ? `AND p.id = '${projectId}'` : ''}
      GROUP BY r.id, r.title, r.description, r.probability, r.impact, 
               r.status, r.category, r.proximity, p.id, p.name
      ORDER BY r.probability * r.impact DESC
    `;
    
    const risks = await executeTimbrQuery(query);
    
    // Use semantic view for unmitigated critical risks
    const criticalUnmitigatedQuery = `
      SELECT * FROM \`k360:UnmitigatedCriticalRisk\`
    `;
    const criticalUnmitigated = await executeTimbrQuery(criticalUnmitigatedQuery);
    
    return { 
      risks, 
      criticalUnmitigated,
      summary: {
        totalRisks: risks.length,
        criticalCount: risks.filter((r: any) => r.severity > 0.8).length,
        highCount: risks.filter((r: any) => r.severity > 0.6 && r.severity <= 0.8).length,
        unmitigatedCritical: criticalUnmitigated.length,
      }
    };
  },
});

/**
 * Tool: Get policy version history
 */
export const getPolicyVersionHistory = createTool({
  id: 'governance-policy-history',
  description: 'Governance Agent: Get the temporal version history of a policy (TKG query)',
  inputSchema: z.object({
    policyId: z.string().describe('Policy ID to get history for'),
  }),
  execute: async ({ context }) => {
    const { policyId } = context;
    
    const sparql = `
      PREFIX k360: <https://kyndryl.com/k360/ontology#>
      
      SELECT ?version ?validFrom ?validTo ?status ?supersededBy
      WHERE {
        ?policy a k360:Policy ;
                k360:version ?version ;
                k360:valid_from ?validFrom .
        OPTIONAL { ?policy k360:valid_to ?validTo }
        OPTIONAL { ?policy k360:policyStatus ?status }
        OPTIONAL { ?superseding k360:supersedes ?policy . 
                   BIND(?superseding AS ?supersededBy) }
        
        # Traverse supersedes chain
        {
          BIND(<${policyId}> AS ?policy)
        }
        UNION
        {
          <${policyId}> k360:supersedes+ ?policy
        }
      }
      ORDER BY ?validFrom
    `;
    
    const history = await executeSparqlQuery(sparql);
    return { policyHistory: history };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: OCM AGENT TOOLS (Organizational Change Management)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Assess stakeholder readiness
 */
export const assessStakeholderReadiness = createTool({
  id: 'ocm-assess-readiness',
  description: 'OCM Agent: Assess stakeholder readiness across ADKAR dimensions',
  inputSchema: z.object({
    initiativeId: z.string().optional(),
    stakeholderGroupId: z.string().optional(),
    readinessThreshold: z.number().optional().default(0.6),
  }),
  execute: async ({ context }) => {
    const { initiativeId, stakeholderGroupId, readinessThreshold } = context;
    
    const query = `
      SELECT 
        ra.id,
        ra.overall_score as readiness_score,
        ra.awareness,
        ra.desire,
        ra.knowledge,
        ra.ability,
        ra.reinforcement,
        ra.assessed_at,
        i.id as initiative_id,
        i.name as initiative_name,
        sg.id as stakeholder_group_id,
        sg.name as stakeholder_group_name,
        sg.size as group_size,
        sg.influence_level,
        sg.impact_level
      FROM \`k360:ReadinessAssessment\` ra
      JOIN \`k360:Initiative\` i ON ra.assessment_for_initiative = i.id
      JOIN \`k360:StakeholderGroup\` sg ON ra.assessment_for_group = sg.id
      WHERE 1=1
      ${initiativeId ? `AND i.id = '${initiativeId}'` : ''}
      ${stakeholderGroupId ? `AND sg.id = '${stakeholderGroupId}'` : ''}
      ORDER BY ra.overall_score ASC
    `;
    
    const assessments = await executeTimbrQuery(query);
    
    const lowReadiness = assessments.filter((a: any) => a.readiness_score < readinessThreshold);
    
    // Identify ADKAR bottlenecks
    const adkarBottlenecks = assessments.map((a: any) => {
      const dimensions = [
        { name: 'Awareness', score: a.awareness },
        { name: 'Desire', score: a.desire },
        { name: 'Knowledge', score: a.knowledge },
        { name: 'Ability', score: a.ability },
        { name: 'Reinforcement', score: a.reinforcement },
      ];
      const bottleneck = dimensions.reduce((min, d) => d.score < min.score ? d : min);
      return {
        ...a,
        bottleneck: bottleneck.name,
        bottleneckScore: bottleneck.score,
      };
    });
    
    return { 
      assessments: adkarBottlenecks, 
      lowReadiness,
      summary: {
        avgReadiness: assessments.reduce((sum: number, a: any) => sum + a.readiness_score, 0) / assessments.length,
        lowReadinessCount: lowReadiness.length,
        totalAssessed: assessments.length,
      }
    };
  },
});

/**
 * Tool: Detect adoption barriers
 */
export const detectAdoptionBarriers = createTool({
  id: 'ocm-detect-adoption-barriers',
  description: 'OCM Agent: Identify barriers to change adoption and their impact',
  inputSchema: z.object({
    initiativeId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { initiativeId } = context;
    
    const query = `
      SELECT 
        am.id as metric_id,
        am.adoption_rate,
        am.target_rate,
        am.velocity,
        am.measured_at,
        i.id as initiative_id,
        i.name as initiative_name,
        ab.id as barrier_id,
        ab.type as barrier_type,
        ab.description as barrier_description,
        ab.severity as barrier_severity
      FROM \`k360:AdoptionMetric\` am
      JOIN \`k360:Initiative\` i ON am.adoption_for_initiative = i.id
      LEFT JOIN \`k360:AdoptionBarrier\` ab ON am.blocked_by = ab.id
      WHERE am.velocity < 0 OR ab.id IS NOT NULL
      ${initiativeId ? `AND i.id = '${initiativeId}'` : ''}
      ORDER BY am.velocity ASC
    `;
    
    const barriers = await executeTimbrQuery(query);
    
    // Group by barrier type
    const barriersByType = barriers.reduce((acc: any, b: any) => {
      if (b.barrier_type) {
        if (!acc[b.barrier_type]) acc[b.barrier_type] = [];
        acc[b.barrier_type].push(b);
      }
      return acc;
    }, {});
    
    return { barriers, barriersByType };
  },
});

/**
 * Tool: Track training completion
 */
export const trackTrainingCompletion = createTool({
  id: 'ocm-track-training',
  description: 'OCM Agent: Track training completion rates across initiatives',
  inputSchema: z.object({
    initiativeId: z.string().optional(),
    completionThreshold: z.number().optional().default(0.8),
  }),
  execute: async ({ context }) => {
    const { initiativeId, completionThreshold } = context;
    
    const query = `
      SELECT 
        tr.id,
        tr.training_name,
        tr.completion_percent,
        tr.status,
        tr.completed_at,
        i.id as initiative_id,
        i.name as initiative_name,
        sg.name as stakeholder_group,
        sg.size as group_size
      FROM \`k360:TrainingRecord\` tr
      JOIN \`k360:Initiative\` i ON tr.training_for_initiative = i.id
      LEFT JOIN \`k360:StakeholderGroup\` sg ON tr.training_for_group = sg.id
      WHERE 1=1
      ${initiativeId ? `AND i.id = '${initiativeId}'` : ''}
      ORDER BY tr.completion_percent ASC
    `;
    
    const training = await executeTimbrQuery(query);
    
    const belowThreshold = training.filter((t: any) => t.completion_percent < completionThreshold);
    
    return { 
      trainingRecords: training, 
      belowThreshold,
      summary: {
        avgCompletion: training.reduce((sum: number, t: any) => sum + t.completion_percent, 0) / training.length,
        belowThresholdCount: belowThreshold.length,
      }
    };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: TMO AGENT TOOLS (Transformation Management)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Analyze transformation progress
 */
export const analyzeTransformationProgress = createTool({
  id: 'tmo-analyze-transformation',
  description: 'TMO Agent: Analyze overall transformation program progress and health',
  inputSchema: z.object({
    programId: z.string().optional(),
    portfolioId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { programId, portfolioId } = context;
    
    const query = `
      SELECT 
        tp.id as program_id,
        tp.name as program_name,
        tp.status as program_status,
        tp.phase,
        tp.start_date,
        tp.target_end_date,
        COUNT(DISTINCT i.id) as initiative_count,
        AVG(am.adoption_rate) as avg_adoption_rate,
        AVG(am.velocity) as avg_adoption_velocity,
        AVG(ra.overall_score) as avg_readiness,
        SUM(CASE WHEN i.status = 'Completed' THEN 1 ELSE 0 END) as completed_initiatives,
        SUM(CASE WHEN i.status = 'At Risk' THEN 1 ELSE 0 END) as at_risk_initiatives
      FROM \`k360:TransformationProgram\` tp
      LEFT JOIN \`k360:Initiative\` i ON i.belongs_to_program = tp.id
      LEFT JOIN \`k360:AdoptionMetric\` am ON am.adoption_for_initiative = i.id
      LEFT JOIN \`k360:ReadinessAssessment\` ra ON ra.assessment_for_initiative = i.id
      WHERE 1=1
      ${programId ? `AND tp.id = '${programId}'` : ''}
      ${portfolioId ? `AND tp.transforms_portfolio = '${portfolioId}'` : ''}
      GROUP BY tp.id, tp.name, tp.status, tp.phase, tp.start_date, tp.target_end_date
    `;
    
    const programs = await executeTimbrQuery(query);
    return { transformationPrograms: programs };
  },
});

/**
 * Tool: Detect transformation fatigue
 */
export const detectTransformationFatigue = createTool({
  id: 'tmo-detect-fatigue',
  description: 'TMO Agent: Detect divisions or teams showing signs of transformation fatigue',
  inputSchema: z.object({
    velocityDeclineThreshold: z.number().optional().default(0).describe('Flag if velocity below this'),
    minDecliningInitiatives: z.number().optional().default(3),
  }),
  execute: async ({ context }) => {
    const { velocityDeclineThreshold, minDecliningInitiatives } = context;
    
    // Use the semantic view
    const query = `
      SELECT 
        tfi.division_id,
        tfi.division_name,
        tfi.declining_initiatives,
        d.total_initiatives,
        d.avg_readiness
      FROM \`k360:TransformationFatigueIndicator\` tfi
      JOIN (
        SELECT 
          d.id,
          COUNT(DISTINCT i.id) as total_initiatives,
          AVG(ra.overall_score) as avg_readiness
        FROM \`safe:Division\` d
        LEFT JOIN \`k360:Initiative\` i ON i.division_id = d.id
        LEFT JOIN \`k360:ReadinessAssessment\` ra ON ra.assessment_for_initiative = i.id
        GROUP BY d.id
      ) d ON tfi.division_id = d.id
      WHERE tfi.declining_initiatives >= ${minDecliningInitiatives}
    `;
    
    const fatigueIndicators = await executeTimbrQuery(query);
    return { fatigueIndicators };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: PLANNING AGENT TOOLS (Capacity & Roadmap)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Analyze capacity utilization
 */
export const analyzeCapacityUtilization = createTool({
  id: 'planning-analyze-capacity',
  description: 'Planning Agent: Analyze resource capacity across ARTs and identify gaps',
  inputSchema: z.object({
    artId: z.string().optional(),
    piId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { artId, piId } = context;
    
    const query = `
      SELECT 
        cp.id,
        cp.name as plan_name,
        cp.total_fte,
        cp.allocated_fte,
        cp.total_fte - cp.allocated_fte as available_fte,
        cp.allocated_fte / NULLIF(cp.total_fte, 0) as utilization,
        cp.period_start,
        cp.period_end,
        art.id as art_id,
        art.name as art_name,
        pi.id as pi_id,
        pi.name as pi_name
      FROM \`k360:CapacityPlan\` cp
      LEFT JOIN \`safe:ART\` art ON cp.capacity_for_art = art.id
      LEFT JOIN \`safe:ProgramIncrement\` pi ON cp.capacity_for_pi = pi.id
      WHERE 1=1
      ${artId ? `AND art.id = '${artId}'` : ''}
      ${piId ? `AND pi.id = '${piId}'` : ''}
      ORDER BY cp.period_start
    `;
    
    const capacityPlans = await executeTimbrQuery(query);
    
    const overAllocated = capacityPlans.filter((cp: any) => cp.utilization > 1);
    const underUtilized = capacityPlans.filter((cp: any) => cp.utilization < 0.7);
    
    return { 
      capacityPlans, 
      overAllocated, 
      underUtilized,
      summary: {
        totalCapacity: capacityPlans.reduce((sum: number, cp: any) => sum + cp.total_fte, 0),
        totalAllocated: capacityPlans.reduce((sum: number, cp: any) => sum + cp.allocated_fte, 0),
        overAllocatedCount: overAllocated.length,
        underUtilizedCount: underUtilized.length,
      }
    };
  },
});

/**
 * Tool: Run capacity scenario
 */
export const runCapacityScenario = createTool({
  id: 'planning-run-scenario',
  description: 'Planning Agent: Run what-if scenario for capacity planning',
  inputSchema: z.object({
    artId: z.string().describe('ART to run scenario for'),
    capacityChange: z.number().describe('Change in FTE capacity (positive or negative)'),
    piId: z.string().optional().describe('Specific PI to evaluate'),
  }),
  execute: async ({ context }) => {
    const { artId, capacityChange, piId } = context;
    
    // Get current state
    const currentQuery = `
      SELECT 
        cp.id,
        cp.total_fte,
        cp.allocated_fte,
        cp.period_start,
        cp.period_end,
        COUNT(wi.id) as work_items,
        SUM(wi.story_points) as total_story_points
      FROM \`k360:CapacityPlan\` cp
      LEFT JOIN \`safe:WorkItem\` wi ON wi.assigned_to_art = '${artId}'
      WHERE cp.capacity_for_art = '${artId}'
      ${piId ? `AND cp.capacity_for_pi = '${piId}'` : ''}
      GROUP BY cp.id, cp.total_fte, cp.allocated_fte, cp.period_start, cp.period_end
    `;
    
    const current = await executeTimbrQuery(currentQuery);
    
    // Calculate scenario impact
    const scenario = current.map((cp: any) => {
      const newCapacity = cp.total_fte + capacityChange;
      const newUtilization = cp.allocated_fte / newCapacity;
      const capacityGap = newCapacity - cp.allocated_fte;
      
      return {
        ...cp,
        scenario_total_fte: newCapacity,
        scenario_utilization: newUtilization,
        scenario_capacity_gap: capacityGap,
        scenario_feasible: newUtilization <= 1.0,
        velocity_impact: capacityChange > 0 
          ? `Can potentially deliver ${Math.round(capacityChange * 10)} more story points`
          : `May need to descope ${Math.round(Math.abs(capacityChange) * 10)} story points`,
      };
    });
    
    return { 
      currentState: current, 
      scenarioResults: scenario,
      recommendation: scenario.every((s: any) => s.scenario_feasible) 
        ? 'Scenario is feasible'
        : 'Scenario creates over-allocation risk',
    };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: NOTIFICATION ORCHESTRATOR TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Get pending notifications
 */
export const getPendingNotifications = createTool({
  id: 'notification-get-pending',
  description: 'Notification Orchestrator: Get all pending notifications for routing',
  inputSchema: z.object({
    sourceAgent: z.string().optional().describe('Filter by source agent'),
    priority: z.array(z.string()).optional(),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ context }) => {
    const { sourceAgent, priority, limit } = context;
    
    const query = `
      SELECT 
        n.id,
        n.type,
        n.priority,
        n.status,
        n.created_at,
        af.summary,
        af.details_json,
        af.confidence,
        a.name as source_agent_name,
        a.type as source_agent_type
      FROM \`k360:Notification\` n
      LEFT JOIN \`k360:AgentFinding\` af ON n.triggered_by = af.id
      LEFT JOIN \`k360:Agent\` a ON af.finding_by_agent = a.id
      WHERE n.status = 'Pending'
      ${sourceAgent ? `AND a.type = '${sourceAgent}'` : ''}
      ${priority?.length ? `AND n.priority IN (${priority.map(p => `'${p}'`).join(',')})` : ''}
      ORDER BY 
        CASE n.priority 
          WHEN 'Critical' THEN 1 
          WHEN 'High' THEN 2 
          WHEN 'Medium' THEN 3 
          WHEN 'Low' THEN 4 
          ELSE 5 
        END,
        n.created_at ASC
      LIMIT ${limit}
    `;
    
    const notifications = await executeTimbrQuery(query);
    return { notifications };
  },
});

/**
 * Tool: Deduplicate notifications
 */
export const deduplicateNotifications = createTool({
  id: 'notification-deduplicate',
  description: 'Notification Orchestrator: Find and mark duplicate notifications',
  inputSchema: z.object({
    timeWindowMinutes: z.number().optional().default(60),
  }),
  execute: async ({ context }) => {
    const { timeWindowMinutes } = context;
    
    const query = `
      SELECT 
        n1.id as notification_id,
        n1.type,
        n1.priority,
        n1.created_at,
        af1.summary,
        COUNT(n2.id) as duplicate_count,
        ARRAY_AGG(n2.id) as duplicate_ids
      FROM \`k360:Notification\` n1
      JOIN \`k360:AgentFinding\` af1 ON n1.triggered_by = af1.id
      JOIN \`k360:Notification\` n2 ON n1.id != n2.id
      JOIN \`k360:AgentFinding\` af2 ON n2.triggered_by = af2.id
      WHERE n1.status = 'Pending'
        AND n2.status = 'Pending'
        AND af1.summary = af2.summary
        AND ABS(EXTRACT(EPOCH FROM (n1.created_at - n2.created_at))) < ${timeWindowMinutes * 60}
        AND n1.created_at <= n2.created_at
      GROUP BY n1.id, n1.type, n1.priority, n1.created_at, af1.summary
      HAVING COUNT(n2.id) > 0
    `;
    
    const duplicates = await executeTimbrQuery(query);
    return { duplicateGroups: duplicates };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12: A2A COLLABORATION TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tool: Initiate A2A conversation
 */
export const initiateA2AConversation = createTool({
  id: 'a2a-initiate-conversation',
  description: 'Initiate an Agent-to-Agent conversation for cross-domain analysis',
  inputSchema: z.object({
    topic: z.string().describe('Conversation topic'),
    initiatingAgentType: z.string().describe('Type of agent initiating'),
    targetAgentType: z.string().describe('Type of agent to collaborate with'),
    context: z.record(z.any()).describe('Context data to share'),
    priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional().default('Medium'),
  }),
  execute: async ({ context: params }) => {
    const { topic, initiatingAgentType, targetAgentType, context, priority } = params;
    
    // In real implementation, this would create database records and trigger agents
    // Here we return the structure that would be created
    
    return {
      conversation: {
        id: `conv_${Date.now()}`,
        topic,
        status: 'Active',
        created_at: new Date().toISOString(),
        participants: [initiatingAgentType, targetAgentType],
        priority,
      },
      initialMessage: {
        type: 'request',
        from: initiatingAgentType,
        to: targetAgentType,
        content: {
          topic,
          context,
          requested_analysis: `Please analyze ${topic} from your domain perspective`,
        },
      },
    };
  },
});

/**
 * Tool: Query agent skills
 */
export const queryAgentSkills = createTool({
  id: 'a2a-query-skills',
  description: 'Query available skills from other agents for task delegation',
  inputSchema: z.object({
    skillCategory: z.string().optional().describe('Filter by skill category'),
  }),
  execute: async ({ context }) => {
    const { skillCategory } = context;
    
    const query = `
      SELECT 
        a.id as agent_id,
        a.name as agent_name,
        a.type as agent_type,
        sk.id as skill_id,
        sk.name as skill_name,
        sk.description as skill_description,
        sk.category as skill_category
      FROM \`k360:Agent\` a
      JOIN \`k360:AgentSkill\` sk ON a.has_skill = sk.id
      WHERE 1=1
      ${skillCategory ? `AND sk.category = '${skillCategory}'` : ''}
      ORDER BY a.type, sk.name
    `;
    
    const skills = await executeTimbrQuery(query);
    
    // Group by agent
    const agentSkills = skills.reduce((acc: any, s: any) => {
      if (!acc[s.agent_type]) {
        acc[s.agent_type] = { agentName: s.agent_name, skills: [] };
      }
      acc[s.agent_type].skills.push({
        id: s.skill_id,
        name: s.skill_name,
        description: s.skill_description,
        category: s.skill_category,
      });
      return acc;
    }, {});
    
    return { agentSkills };
  },
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13: TOOL REGISTRY EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All ontology tools grouped by agent domain
 */
export const ontologyTools = {
  // Shared tools (all agents)
  shared: [
    findEntitiesByConcept,
    getEntityRelationships,
    getEntityAtTime,
    traceCausalChain,
  ],
  
  // VRO Agent tools
  vro: [
    analyzeInvestmentPortfolio,
    findUnderperformingInvestments,
  ],
  
  // PMO Agent tools
  pmo: [
    getProjectHealthDashboard,
    detectScheduleSlippage,
    analyzeDependencies,
  ],
  
  // FinOps Agent tools
  finops: [
    analyzeBudgetUtilization,
    detectCostAnomalies,
  ],
  
  // OKR Agent tools
  okr: [
    analyzeStrategicAlignment,
    findOrphanedProjects,
    trackKeyResultProgress,
  ],
  
  // Governance Agent tools
  governance: [
    checkPolicyCompliance,
    analyzeRiskRegister,
    getPolicyVersionHistory,
  ],
  
  // OCM Agent tools
  ocm: [
    assessStakeholderReadiness,
    detectAdoptionBarriers,
    trackTrainingCompletion,
  ],
  
  // TMO Agent tools
  tmo: [
    analyzeTransformationProgress,
    detectTransformationFatigue,
  ],
  
  // Planning Agent tools
  planning: [
    analyzeCapacityUtilization,
    runCapacityScenario,
  ],
  
  // Notification Orchestrator tools
  notification: [
    getPendingNotifications,
    deduplicateNotifications,
  ],
  
  // A2A collaboration tools
  a2a: [
    initiateA2AConversation,
    queryAgentSkills,
  ],
};

/**
 * Get tools for a specific agent type
 */
export function getToolsForAgent(agentType: string): Tool[] {
  const sharedTools = ontologyTools.shared;
  const a2aTools = ontologyTools.a2a;
  
  const agentSpecificTools = ontologyTools[agentType.toLowerCase() as keyof typeof ontologyTools] || [];
  
  return [...sharedTools, ...agentSpecificTools, ...a2aTools];
}

/**
 * Get all available tools
 */
export function getAllTools(): Tool[] {
  return Object.values(ontologyTools).flat();
}
