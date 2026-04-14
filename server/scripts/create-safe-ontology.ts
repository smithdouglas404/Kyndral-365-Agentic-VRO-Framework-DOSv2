/**
 * Create SAFe 6.0 Object Types in Palantir Foundry
 *
 * Creates the missing ontology types to model the full SAFe hierarchy:
 * Portfolio → ValueStream → ART → Team → Sprint/PI
 * Epic → Capability → Feature → Story → Task
 *
 * These types don't exist yet in Palantir — the current ontology only has
 * AtlasProject (overloaded), AtlasBudget, AtlasTeam (thin), AtlasRisk, etc.
 *
 * NOTE: If the Palantir API doesn't support creating object types directly,
 * these need to be created via the Foundry UI Ontology Manager.
 *
 * Usage: npx tsx server/scripts/create-safe-ontology.ts
 */

import 'dotenv/config';

const PALANTIR_HOST = process.env.PALANTIR_HOSTNAME?.replace(/\/$/, '');
const PALANTIR_TOKEN = process.env.PALANTIR_TOKEN;
const ONTOLOGY_RID = 'ri.ontology.main.ontology.84e2e319-c566-4304-a12a-8dbb05224f4f';
const ONTOLOGY_API = 'ontology-2af33f90-7f4f-4551-9f6a-e587e0605403';

if (!PALANTIR_HOST || !PALANTIR_TOKEN) {
  console.error('Missing PALANTIR_HOSTNAME or PALANTIR_TOKEN');
  process.exit(1);
}

async function request(method: string, endpoint: string, body?: any): Promise<any> {
  const host = PALANTIR_HOST!.startsWith('http') ? PALANTIR_HOST : `https://${PALANTIR_HOST}`;
  const url = `${host}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${PALANTIR_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Palantir API ${method} ${endpoint} failed (${response.status}): ${text.substring(0, 200)}`);
  }
  return text ? JSON.parse(text) : {};
}

// ============================================================================
// SAFe 6.0 Object Type Definitions
// ============================================================================

const SAFE_OBJECT_TYPES = [
  {
    apiName: 'AtlasPortfolio',
    displayName: '[Atlas] Portfolio',
    description: 'SAFe Portfolio — top-level strategic container. Contains Value Streams, Strategic Themes, Epics, and OKRs. Aligns with enterprise strategy.',
    properties: {
      portfolioId: { dataType: 'string', description: 'Unique Portfolio ID' },
      name: { dataType: 'string', description: 'Portfolio name' },
      description: { dataType: 'string', description: 'Portfolio description' },
      strategicThemes: { dataType: 'string', description: 'Strategic themes (JSON array)' },
      budgetAllocation: { dataType: 'double', description: 'Total budget allocated' },
      fiscalYear: { dataType: 'string', description: 'Fiscal year' },
      healthScore: { dataType: 'integer', description: 'Portfolio health score 0-100' },
      status: { dataType: 'string', description: 'Active, Planning, Complete' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasValueStream',
    displayName: '[Atlas] Value Stream',
    description: 'SAFe Value Stream — long-lived series of steps delivering value. Contains ARTs and aligns to portfolio strategy. Tracks flow metrics.',
    properties: {
      valueStreamId: { dataType: 'string', description: 'Unique Value Stream ID' },
      name: { dataType: 'string', description: 'Value Stream name' },
      description: { dataType: 'string', description: 'Value Stream description' },
      portfolioId: { dataType: 'string', description: 'Parent Portfolio ID' },
      type: { dataType: 'string', description: 'operational or development' },
      customerSegment: { dataType: 'string', description: 'Target customer segment' },
      leadTime: { dataType: 'double', description: 'Average lead time in days' },
      throughput: { dataType: 'double', description: 'Work items per sprint' },
      flowEfficiency: { dataType: 'double', description: 'Flow efficiency percentage' },
      status: { dataType: 'string', description: 'Active, Planning, Sunset' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasART',
    displayName: '[Atlas] Agile Release Train',
    description: 'SAFe ART — long-lived team of agile teams. Operates on a fixed cadence (PI typically 8-12 weeks). Tracks velocity, predictability, and flow.',
    properties: {
      artId: { dataType: 'string', description: 'Unique ART ID' },
      name: { dataType: 'string', description: 'ART name' },
      description: { dataType: 'string', description: 'ART description' },
      valueStreamId: { dataType: 'string', description: 'Parent Value Stream ID' },
      rte: { dataType: 'string', description: 'Release Train Engineer' },
      productManager: { dataType: 'string', description: 'Product Manager' },
      systemArchitect: { dataType: 'string', description: 'System Architect' },
      teamCount: { dataType: 'integer', description: 'Number of teams' },
      velocity: { dataType: 'double', description: 'Average velocity (story points per PI)' },
      predictability: { dataType: 'double', description: 'Predictability measure 0-100' },
      currentPi: { dataType: 'string', description: 'Current Program Increment' },
      piCadence: { dataType: 'string', description: 'PI cadence (e.g., 10 weeks)' },
      status: { dataType: 'string', description: 'Active, Forming, Sunset' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasProgramIncrement',
    displayName: '[Atlas] Program Increment',
    description: 'SAFe PI — 8-12 week timebox for planning, executing, and delivering value. Contains sprints and PI objectives.',
    properties: {
      piId: { dataType: 'string', description: 'Unique PI ID' },
      name: { dataType: 'string', description: 'PI name (e.g., PI 2026-Q2)' },
      artId: { dataType: 'string', description: 'Parent ART ID' },
      startDate: { dataType: 'date', description: 'PI start date' },
      endDate: { dataType: 'date', description: 'PI end date' },
      plannedVelocity: { dataType: 'double', description: 'Planned velocity' },
      actualVelocity: { dataType: 'double', description: 'Actual velocity delivered' },
      predictability: { dataType: 'double', description: 'PI predictability 0-100' },
      objectivesAchieved: { dataType: 'integer', description: 'PI objectives achieved' },
      objectivesTotal: { dataType: 'integer', description: 'Total PI objectives' },
      status: { dataType: 'string', description: 'Planning, Executing, Complete' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasSprint',
    displayName: '[Atlas] Sprint',
    description: 'SAFe Iteration/Sprint — 2-week timebox within a PI. Tracks story points planned vs completed, velocity, and team capacity.',
    properties: {
      sprintId: { dataType: 'string', description: 'Unique Sprint ID' },
      name: { dataType: 'string', description: 'Sprint name' },
      piId: { dataType: 'string', description: 'Parent PI ID' },
      teamId: { dataType: 'string', description: 'Team ID' },
      startDate: { dataType: 'date', description: 'Sprint start date' },
      endDate: { dataType: 'date', description: 'Sprint end date' },
      plannedPoints: { dataType: 'integer', description: 'Story points planned' },
      completedPoints: { dataType: 'integer', description: 'Story points completed' },
      velocity: { dataType: 'double', description: 'Sprint velocity' },
      status: { dataType: 'string', description: 'Planning, Active, Complete' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasEpic',
    displayName: '[Atlas] Epic',
    description: 'SAFe Epic — large initiative spanning multiple PIs. Has a lean business case, WSJF score, and hypothesis. Contains capabilities and features.',
    properties: {
      epicId: { dataType: 'string', description: 'Unique Epic ID' },
      name: { dataType: 'string', description: 'Epic name' },
      description: { dataType: 'string', description: 'Epic description' },
      portfolioId: { dataType: 'string', description: 'Parent Portfolio ID' },
      epicType: { dataType: 'string', description: 'business or enabler' },
      wsjfScore: { dataType: 'double', description: 'WSJF score for prioritization' },
      businessValue: { dataType: 'integer', description: 'Business value score' },
      costOfDelay: { dataType: 'double', description: 'Cost of delay' },
      leanBusinessCase: { dataType: 'string', description: 'Lean business case summary' },
      hypothesis: { dataType: 'string', description: 'Benefit hypothesis' },
      mvp: { dataType: 'string', description: 'Minimum viable product definition' },
      estimatedCost: { dataType: 'double', description: 'Estimated cost' },
      actualCost: { dataType: 'double', description: 'Actual cost to date' },
      safeStage: { dataType: 'string', description: 'funnel, reviewing, analyzing, portfolio-backlog, implementing, done' },
      owner: { dataType: 'string', description: 'Epic owner' },
      status: { dataType: 'string', description: 'Status' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasCapability',
    displayName: '[Atlas] Capability',
    description: 'SAFe Capability — higher-level solution behavior spanning multiple ARTs. Decomposes into features.',
    properties: {
      capabilityId: { dataType: 'string', description: 'Unique Capability ID' },
      name: { dataType: 'string', description: 'Capability name' },
      description: { dataType: 'string', description: 'Capability description' },
      epicId: { dataType: 'string', description: 'Parent Epic ID' },
      acceptanceCriteria: { dataType: 'string', description: 'Acceptance criteria (JSON)' },
      benefitHypothesis: { dataType: 'string', description: 'Benefit hypothesis' },
      status: { dataType: 'string', description: 'Status' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasFeature',
    displayName: '[Atlas] Feature',
    description: 'SAFe Feature — service or capability fulfilling a stakeholder need. Contains stories. Tracked for each PI with WSJF scoring.',
    properties: {
      featureId: { dataType: 'string', description: 'Unique Feature ID' },
      name: { dataType: 'string', description: 'Feature name' },
      description: { dataType: 'string', description: 'Feature description' },
      status: { dataType: 'string', description: 'Backlog, In Progress, Done' },
      priority: { dataType: 'string', description: 'Critical, High, Medium, Low' },
      projectId: { dataType: 'string', description: 'Parent Project/Epic ID' },
      capabilityId: { dataType: 'string', description: 'Parent Capability ID' },
      storyPoints: { dataType: 'integer', description: 'Total story points' },
      completedPoints: { dataType: 'integer', description: 'Completed story points' },
      targetPi: { dataType: 'string', description: 'Target Program Increment' },
      wsjfScore: { dataType: 'double', description: 'WSJF score' },
      benefitHypothesis: { dataType: 'string', description: 'Benefit hypothesis' },
      acceptanceCriteria: { dataType: 'string', description: 'Acceptance criteria (JSON)' },
      owner: { dataType: 'string', description: 'Feature owner' },
      startDate: { dataType: 'date', description: 'Start date' },
      targetDate: { dataType: 'date', description: 'Target date' },
      source: { dataType: 'string', description: 'Data source system' },
      externalId: { dataType: 'string', description: 'External system ID (Jira, OP, etc.)' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasStory',
    displayName: '[Atlas] Story',
    description: 'SAFe User Story — short description of desired functionality from user perspective. Assigned to sprints and teams.',
    properties: {
      storyId: { dataType: 'string', description: 'Unique Story ID' },
      name: { dataType: 'string', description: 'Story name' },
      description: { dataType: 'string', description: 'Story description (user story format)' },
      status: { dataType: 'string', description: 'Backlog, In Progress, In Review, Done' },
      priority: { dataType: 'string', description: 'Critical, High, Medium, Low' },
      featureId: { dataType: 'string', description: 'Parent Feature ID' },
      projectId: { dataType: 'string', description: 'Parent Project ID' },
      storyPoints: { dataType: 'integer', description: 'Story point estimate' },
      sprint: { dataType: 'string', description: 'Sprint name' },
      assignee: { dataType: 'string', description: 'Assigned team member' },
      teamId: { dataType: 'string', description: 'Assigned team ID' },
      acceptanceCriteria: { dataType: 'string', description: 'Acceptance criteria (JSON)' },
      blockedBy: { dataType: 'string', description: 'Blocking story/issue ID' },
      startDate: { dataType: 'date', description: 'Start date' },
      completedDate: { dataType: 'date', description: 'Completion date' },
      source: { dataType: 'string', description: 'Data source system' },
      externalId: { dataType: 'string', description: 'External system ID' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  {
    apiName: 'AtlasTask',
    displayName: '[Atlas] Task',
    description: 'SAFe Task — specific unit of work within a story. Tracks estimated vs actual hours for EVM calculations.',
    properties: {
      taskId: { dataType: 'string', description: 'Unique Task ID' },
      name: { dataType: 'string', description: 'Task name' },
      description: { dataType: 'string', description: 'Task description' },
      status: { dataType: 'string', description: 'To Do, In Progress, Done' },
      priority: { dataType: 'string', description: 'Priority' },
      storyId: { dataType: 'string', description: 'Parent Story ID' },
      featureId: { dataType: 'string', description: 'Parent Feature ID' },
      projectId: { dataType: 'string', description: 'Parent Project ID' },
      estimatedHours: { dataType: 'double', description: 'Estimated hours' },
      actualHours: { dataType: 'double', description: 'Actual hours spent' },
      remainingHours: { dataType: 'double', description: 'Remaining hours' },
      taskType: { dataType: 'string', description: 'Development, Testing, Documentation, Design, DevOps, Research' },
      assignee: { dataType: 'string', description: 'Assigned team member' },
      teamId: { dataType: 'string', description: 'Assigned team ID' },
      sprint: { dataType: 'string', description: 'Sprint name' },
      startDate: { dataType: 'date', description: 'Start date' },
      completedDate: { dataType: 'date', description: 'Completion date' },
      source: { dataType: 'string', description: 'Data source system' },
      externalId: { dataType: 'string', description: 'External system ID' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
];

// ============================================================================
// Enrich existing types that are too thin
// ============================================================================

const ENRICH_EXISTING = {
  AtlasProject: {
    missingProperties: {
      type: { dataType: 'string', description: 'Project type (strategic, operational, enabler)' },
      parentId: { dataType: 'string', description: 'Parent project/portfolio/VS ID for hierarchy' },
      portfolioId: { dataType: 'string', description: 'Portfolio ID' },
      valueStreamId: { dataType: 'string', description: 'Value Stream ID' },
      artId: { dataType: 'string', description: 'ART ID' },
      healthScore: { dataType: 'integer', description: 'Composite health score 0-100' },
      scheduleVariance: { dataType: 'double', description: 'Schedule variance in days' },
      cpiValue: { dataType: 'double', description: 'Cost Performance Index' },
      spiValue: { dataType: 'double', description: 'Schedule Performance Index' },
      earnedValue: { dataType: 'double', description: 'Earned Value (BCWP)' },
      plannedValue: { dataType: 'double', description: 'Planned Value (BCWS)' },
      actualCost: { dataType: 'double', description: 'Actual Cost (ACWP)' },
      budgetTotal: { dataType: 'double', description: 'Total budget' },
      budgetSpent: { dataType: 'double', description: 'Budget spent to date' },
      velocity: { dataType: 'double', description: 'Team velocity' },
      predictability: { dataType: 'double', description: 'Predictability measure 0-100' },
      flowEfficiency: { dataType: 'double', description: 'Flow efficiency percentage' },
      safeStage: { dataType: 'string', description: 'SAFe stage: funnel, reviewing, analyzing, portfolio-backlog, implementing, done' },
      progress: { dataType: 'integer', description: 'Progress percentage 0-100' },
      riskScore: { dataType: 'double', description: 'Aggregate risk score' },
      source: { dataType: 'string', description: 'Data source system' },
      externalId: { dataType: 'string', description: 'External system ID (Jira, OP, etc.)' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  AtlasTeam: {
    missingProperties: {
      artId: { dataType: 'string', description: 'Parent ART ID' },
      scrumMaster: { dataType: 'string', description: 'Scrum Master name' },
      productOwner: { dataType: 'string', description: 'Product Owner name' },
      techLead: { dataType: 'string', description: 'Tech Lead name' },
      memberCount: { dataType: 'integer', description: 'Number of team members' },
      velocity: { dataType: 'double', description: 'Average velocity' },
      predictability: { dataType: 'double', description: 'Predictability 0-100' },
      teamType: { dataType: 'string', description: 'feature, platform, enabler, shared-services' },
      skills: { dataType: 'string', description: 'Team skills (JSON array)' },
      source: { dataType: 'string', description: 'Data source system' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
  AtlasRisk: {
    missingProperties: {
      category: { dataType: 'string', description: 'schedule, cost, technical, resource, external, compliance' },
      severity: { dataType: 'string', description: 'critical, high, medium, low' },
      trend: { dataType: 'string', description: 'increasing, stable, decreasing' },
      responseStrategy: { dataType: 'string', description: 'avoid, mitigate, transfer, accept' },
      responseEffectiveness: { dataType: 'double', description: 'Effectiveness score 0-100' },
      source: { dataType: 'string', description: 'Data source system' },
      externalId: { dataType: 'string', description: 'External system ID' },
      syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
    },
  },
};

// ============================================================================
// Execute
// ============================================================================

async function createOntology() {
  console.log('=== SAFe 6.0 Ontology Creation ===\n');

  // Check existing types
  const existing = await request('GET', `/api/v2/ontologies/${ONTOLOGY_API}/objectTypes`);
  const existingNames = new Set((existing.data || []).map((t: any) => t.apiName));
  console.log(`Existing types: ${existingNames.size}`);
  console.log(`  Atlas types: ${[...existingNames].filter(n => n.startsWith('Atlas')).join(', ')}\n`);

  // Report what needs to be created
  console.log('=== Types to Create ===');
  for (const type of SAFE_OBJECT_TYPES) {
    if (existingNames.has(type.apiName)) {
      console.log(`  EXISTS: ${type.apiName}`);
    } else {
      console.log(`  CREATE: ${type.apiName} — ${type.description.substring(0, 80)}`);
      console.log(`          Properties: ${Object.keys(type.properties).length}`);
    }
  }

  // Report enrichments needed
  console.log('\n=== Existing Types to Enrich ===');
  for (const [typeName, config] of Object.entries(ENRICH_EXISTING)) {
    const existing_type = (existing.data || []).find((t: any) => t.apiName === typeName);
    if (existing_type) {
      const existingProps = Object.keys(existing_type.properties || {});
      const newProps = Object.keys(config.missingProperties).filter(p => !existingProps.includes(p));
      console.log(`  ${typeName}: has ${existingProps.length} props, needs ${newProps.length} more`);
      if (newProps.length > 0) {
        console.log(`    Add: ${newProps.join(', ')}`);
      }
    }
  }

  // Try to create types via API
  console.log('\n=== Creating Object Types ===');
  console.log('NOTE: Palantir v2 API may not support object type creation.');
  console.log('If creation fails, use Palantir Foundry Ontology Manager UI.\n');

  let created = 0, skipped = 0, failed = 0;

  for (const type of SAFE_OBJECT_TYPES) {
    if (existingNames.has(type.apiName)) {
      skipped++;
      continue;
    }

    // Build the property definitions for Palantir
    const propertyDefs: Record<string, any> = {};
    for (const [propName, propDef] of Object.entries(type.properties)) {
      propertyDefs[propName] = {
        dataType: { type: propDef.dataType },
        description: propDef.description,
      };
    }

    try {
      // Try the ontology editing API (v2)
      await request('POST', `/api/v2/ontologies/${ONTOLOGY_API}/objectTypes`, {
        apiName: type.apiName,
        displayName: type.displayName,
        description: type.description,
        primaryKey: [Object.keys(type.properties)[0]],
        properties: propertyDefs,
      });
      console.log(`  ✓ Created: ${type.apiName}`);
      created++;
    } catch (err: any) {
      if (err.message.includes('405') || err.message.includes('403') || err.message.includes('404')) {
        console.log(`  ✗ API doesn't support creation: ${type.apiName}`);
        console.log(`    → Create manually in Foundry Ontology Manager`);
      } else {
        console.log(`  ✗ Failed: ${type.apiName} — ${err.message.substring(0, 100)}`);
      }
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (exist): ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n=== Manual Creation Guide ===');
    console.log('Go to Palantir Foundry → Ontology Manager → Create Object Type');
    console.log('Create each type below with the listed properties:\n');

    for (const type of SAFE_OBJECT_TYPES) {
      if (!existingNames.has(type.apiName)) {
        console.log(`--- ${type.apiName} (${type.displayName}) ---`);
        console.log(`Description: ${type.description}`);
        console.log(`Primary Key: ${Object.keys(type.properties)[0]}`);
        console.log('Properties:');
        for (const [propName, propDef] of Object.entries(type.properties)) {
          console.log(`  ${propName} (${propDef.dataType}) — ${propDef.description}`);
        }
        console.log('');
      }
    }
  }
}

createOntology().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
