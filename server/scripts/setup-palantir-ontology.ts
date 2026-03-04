/**
 * PALANTIR ONTOLOGY SETUP SCRIPT
 *
 * Creates all required object types and action types in Palantir Foundry.
 * Run this ONCE to set up the ontology structure, then run the seed script.
 *
 * Usage: npx tsx server/scripts/setup-palantir-ontology.ts
 */

import { getPalantirService } from "../mcp/MCPServiceFactory.js";

// ============================================================================
// OBJECT TYPE DEFINITIONS - SAFe 6.0 Portfolio Structure
// ============================================================================

const OBJECT_TYPES = [
  {
    apiName: "Project",
    displayName: "Project",
    description: "SAFe Portfolio Project / Engagement",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Project ID", required: true },
      name: { dataType: "string", description: "Project name", required: true },
      description: { dataType: "string", description: "Project description" },
      status: { dataType: "string", description: "Current status" },
      divisionId: { dataType: "string", description: "Value Stream ID" },
      priority: { dataType: "string", description: "Priority level" },
      safeStage: { dataType: "string", description: "SAFe implementation stage" },
      currentPi: { dataType: "string", description: "Current Program Increment" },
      velocity: { dataType: "string", description: "Team velocity" },
      predictability: { dataType: "string", description: "Predictability measure" },
      flowEfficiency: { dataType: "string", description: "Flow efficiency percentage" },
      budgetTotal: { dataType: "double", description: "Total budget" },
      budgetSpent: { dataType: "double", description: "Budget spent" },
      budgetUnit: { dataType: "string", description: "Budget currency unit" },
      startDate: { dataType: "timestamp", description: "Project start date" },
      endDate: { dataType: "timestamp", description: "Project end date" },
      expectedRoi: { dataType: "string", description: "Expected ROI" },
      roiValue: { dataType: "double", description: "ROI value" },
      cpiValue: { dataType: "double", description: "Cost Performance Index" },
      spiValue: { dataType: "double", description: "Schedule Performance Index" },
      earnedValue: { dataType: "double", description: "Earned Value" },
      plannedValue: { dataType: "double", description: "Planned Value" },
      progress: { dataType: "integer", description: "Progress percentage" },
      epicId: { dataType: "string", description: "Epic ID" },
      epicName: { dataType: "string", description: "Epic name" },
      epicProgress: { dataType: "string", description: "Epic progress" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "AtlasDivision",
    displayName: "[Atlas] Division",
    description: "Business Unit / Division / Segment (NOT Value Stream - EPICs are Value Streams)",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Division ID", required: true },
      name: { dataType: "string", description: "Division name", required: true },
      head: { dataType: "string", description: "Division Head / Leader" },
      description: { dataType: "string", description: "Description" },
      color: { dataType: "string", description: "Color code" },
      profit2023: { dataType: "double", description: "2023 profit" },
      profit2024: { dataType: "double", description: "2024 profit" },
      changePercent: { dataType: "double", description: "YoY change percent" },
      portfolioId: { dataType: "string", description: "Portfolio ID" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "Feature",
    displayName: "Feature",
    description: "SAFe Feature",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Feature ID", required: true },
      projectId: { dataType: "string", description: "Parent Project ID", required: true },
      name: { dataType: "string", description: "Feature name", required: true },
      description: { dataType: "string", description: "Feature description" },
      status: { dataType: "string", description: "Status" },
      storyPoints: { dataType: "integer", description: "Story points" },
      completedPoints: { dataType: "integer", description: "Completed points" },
      priority: { dataType: "string", description: "Priority" },
      targetPi: { dataType: "string", description: "Target PI" },
      wsjfScore: { dataType: "double", description: "WSJF Score" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "Story",
    displayName: "Story",
    description: "SAFe User Story",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Story ID", required: true },
      featureId: { dataType: "string", description: "Parent Feature ID" },
      projectId: { dataType: "string", description: "Parent Project ID" },
      name: { dataType: "string", description: "Story name", required: true },
      description: { dataType: "string", description: "Story description" },
      status: { dataType: "string", description: "Status" },
      storyPoints: { dataType: "integer", description: "Story points" },
      sprint: { dataType: "string", description: "Sprint" },
      assignedTeam: { dataType: "string", description: "Assigned team" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "Task",
    displayName: "Task",
    description: "SAFe Task",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Task ID", required: true },
      storyId: { dataType: "string", description: "Parent Story ID" },
      featureId: { dataType: "string", description: "Parent Feature ID" },
      projectId: { dataType: "string", description: "Parent Project ID" },
      name: { dataType: "string", description: "Task name", required: true },
      description: { dataType: "string", description: "Task description" },
      status: { dataType: "string", description: "Status" },
      effortHours: { dataType: "double", description: "Effort in hours" },
      assignee: { dataType: "string", description: "Assignee" },
      skills: { dataType: "string", description: "Required skills" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "KPI",
    displayName: "KPI",
    description: "Key Performance Indicator",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "KPI ID", required: true },
      divisionId: { dataType: "string", description: "Division ID" },
      name: { dataType: "string", description: "KPI name", required: true },
      value2023: { dataType: "double", description: "2023 value" },
      value2024: { dataType: "double", description: "2024 value" },
      target2025: { dataType: "double", description: "2025 target" },
      unit: { dataType: "string", description: "Unit of measure" },
      trend: { dataType: "string", description: "Trend direction" },
      status: { dataType: "string", description: "Status" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "OKR",
    displayName: "OKR",
    description: "Objective and Key Results",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "OKR ID", required: true },
      divisionId: { dataType: "string", description: "Division ID" },
      objective: { dataType: "string", description: "Objective", required: true },
      keyResults: { dataType: "string", description: "Key Results JSON" },
      owner: { dataType: "string", description: "Owner" },
      dueDate: { dataType: "string", description: "Due date" },
      progress: { dataType: "integer", description: "Progress percentage" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "Risk",
    displayName: "Risk",
    description: "Enterprise Risk",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Risk ID", required: true },
      title: { dataType: "string", description: "Risk title", required: true },
      description: { dataType: "string", description: "Risk description" },
      categoryId: { dataType: "string", description: "Risk category" },
      severity: { dataType: "string", description: "Severity level" },
      probability: { dataType: "double", description: "Probability" },
      impact: { dataType: "double", description: "Impact" },
      projectId: { dataType: "string", description: "Related Project ID" },
      owner: { dataType: "string", description: "Risk owner" },
      mitigationPlan: { dataType: "string", description: "Mitigation plan" },
      trend: { dataType: "string", description: "Trend direction" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "Agent",
    displayName: "Agent",
    description: "AI Agent Definition",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Agent ID", required: true },
      name: { dataType: "string", description: "Agent name", required: true },
      description: { dataType: "string", description: "Agent description" },
      category: { dataType: "string", description: "Agent category" },
      enabled: { dataType: "boolean", description: "Is enabled" },
      capabilities: { dataType: "string", description: "Capabilities JSON" },
      defaultPriority: { dataType: "string", description: "Default priority" },
      icon: { dataType: "string", description: "Icon name" },
      color: { dataType: "string", description: "Color code" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "AgentAttribute",
    displayName: "Agent Attribute",
    description: "Agent Attribute / Metric Definition",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Attribute ID", required: true },
      agentId: { dataType: "string", description: "Agent ID", required: true },
      name: { dataType: "string", description: "Attribute name", required: true },
      displayName: { dataType: "string", description: "Display name" },
      description: { dataType: "string", description: "Description" },
      category: { dataType: "string", description: "Category" },
      dataType: { dataType: "string", description: "Data type" },
      unit: { dataType: "string", description: "Unit of measure" },
      currentValue: { dataType: "string", description: "Current value" },
      previousValue: { dataType: "string", description: "Previous value" },
      targetValue: { dataType: "string", description: "Target value" },
      source: { dataType: "string", description: "Data source" },
      syncedAt: { dataType: "timestamp", description: "Last sync timestamp" },
    },
  },
  {
    apiName: "Intervention",
    displayName: "Intervention",
    description: "HITL Intervention Request",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Intervention ID", required: true },
      title: { dataType: "string", description: "Title", required: true },
      description: { dataType: "string", description: "Description" },
      interventionType: { dataType: "string", description: "Type" },
      severity: { dataType: "string", description: "Severity" },
      agentSource: { dataType: "string", description: "Source agent" },
      projectId: { dataType: "string", description: "Related Project" },
      entityType: { dataType: "string", description: "Entity type" },
      entityId: { dataType: "string", description: "Entity ID" },
      recommendation: { dataType: "string", description: "Recommendation" },
      status: { dataType: "string", description: "Status" },
      approvedBy: { dataType: "string", description: "Approved by" },
      rejectedBy: { dataType: "string", description: "Rejected by" },
      createdAt: { dataType: "timestamp", description: "Created timestamp" },
      source: { dataType: "string", description: "Data source" },
    },
  },
  {
    apiName: "Alert",
    displayName: "Alert",
    description: "System Alert / Notification",
    primaryKey: ["id"],
    properties: {
      id: { dataType: "string", description: "Alert ID", required: true },
      title: { dataType: "string", description: "Title", required: true },
      message: { dataType: "string", description: "Message" },
      alertType: { dataType: "string", description: "Alert type" },
      severity: { dataType: "string", description: "Severity" },
      agentSource: { dataType: "string", description: "Source agent" },
      projectId: { dataType: "string", description: "Related Project" },
      status: { dataType: "string", description: "Status" },
      acknowledgedBy: { dataType: "string", description: "Acknowledged by" },
      createdAt: { dataType: "timestamp", description: "Created timestamp" },
      source: { dataType: "string", description: "Data source" },
    },
  },
];

// ============================================================================
// ACTION TYPE DEFINITIONS
// ============================================================================

const ACTION_TYPES = [
  // Project Actions
  {
    apiName: "upsertProject",
    displayName: "Upsert Project",
    description: "Create or update a project",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
      { name: "description", dataType: "string", required: false },
      { name: "status", dataType: "string", required: false },
      { name: "divisionId", dataType: "string", required: false },
      { name: "priority", dataType: "string", required: false },
      { name: "budgetTotal", dataType: "double", required: false },
      { name: "budgetSpent", dataType: "double", required: false },
      { name: "progress", dataType: "integer", required: false },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Project" }],
  },
  {
    apiName: "createProject",
    displayName: "Create Project",
    description: "Create a new project",
    parameters: [
      { name: "name", dataType: "string", required: true },
      { name: "description", dataType: "string", required: false },
      { name: "status", dataType: "string", required: true },
      { name: "businessUnit", dataType: "string", required: true },
      { name: "priority", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Project" }],
  },
  {
    apiName: "updateProject",
    displayName: "Update Project",
    description: "Update an existing project",
    parameters: [
      { name: "projectId", dataType: "string", required: true },
      { name: "name", dataType: "string", required: false },
      { name: "status", dataType: "string", required: false },
      { name: "progress", dataType: "integer", required: false },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Project" }],
  },
  {
    apiName: "deleteProject",
    displayName: "Delete Project",
    description: "Delete a project",
    parameters: [{ name: "projectId", dataType: "string", required: true }],
    operations: [{ type: "deleteObject" as const, objectTypeApiName: "Project" }],
  },

  // Division Actions
  {
    apiName: "upsertDivision",
    displayName: "Upsert Division",
    description: "Create or update a division",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "AtlasDivision" }],
  },

  // Feature Actions
  {
    apiName: "upsertFeature",
    displayName: "Upsert Feature",
    description: "Create or update a feature",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "projectId", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Feature" }],
  },

  // Story Actions
  {
    apiName: "upsertStory",
    displayName: "Upsert Story",
    description: "Create or update a story",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Story" }],
  },

  // Task Actions
  {
    apiName: "upsertTask",
    displayName: "Upsert Task",
    description: "Create or update a task",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "externalId", dataType: "string", required: false },
      { name: "id", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
      { name: "status", dataType: "string", required: false },
      { name: "source", dataType: "string", required: false },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Task" }],
  },

  // Risk Actions
  {
    apiName: "upsertRisk",
    displayName: "Upsert Risk",
    description: "Create or update a risk",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "title", dataType: "string", required: true },
      { name: "severity", dataType: "string", required: false },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Risk" }],
  },
  {
    apiName: "createRisk",
    displayName: "Create Risk",
    description: "Create a new risk",
    parameters: [
      { name: "title", dataType: "string", required: true },
      { name: "severity", dataType: "string", required: true },
      { name: "probability", dataType: "double", required: false },
      { name: "impact", dataType: "double", required: false },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Risk" }],
  },
  {
    apiName: "updateRisk",
    displayName: "Update Risk",
    description: "Update a risk",
    parameters: [
      { name: "riskId", dataType: "string", required: true },
      { name: "severity", dataType: "string", required: false },
      { name: "mitigationPlan", dataType: "string", required: false },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Risk" }],
  },

  // KPI & OKR Actions
  {
    apiName: "upsertKPI",
    displayName: "Upsert KPI",
    description: "Create or update a KPI",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "KPI" }],
  },
  {
    apiName: "upsertOKR",
    displayName: "Upsert OKR",
    description: "Create or update an OKR",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "objective", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "OKR" }],
  },
  {
    apiName: "createOKR",
    displayName: "Create OKR",
    description: "Create a new OKR",
    parameters: [
      { name: "objective", dataType: "string", required: true },
      { name: "keyResults", dataType: "string", required: false },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "OKR" }],
  },
  {
    apiName: "updateOKR",
    displayName: "Update OKR Progress",
    description: "Update OKR progress",
    parameters: [
      { name: "okrId", dataType: "string", required: true },
      { name: "progress", dataType: "integer", required: false },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "OKR" }],
  },

  // Agent Actions
  {
    apiName: "upsertAgent",
    displayName: "Upsert Agent",
    description: "Create or update an agent",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Agent" }],
  },
  {
    apiName: "upsertAgentAttribute",
    displayName: "Upsert Agent Attribute",
    description: "Create or update an agent attribute",
    parameters: [
      { name: "primaryKey", dataType: "string", required: true },
      { name: "id", dataType: "string", required: true },
      { name: "agentId", dataType: "string", required: true },
      { name: "name", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "AgentAttribute" }],
  },

  // HITL Actions
  {
    apiName: "createIntervention",
    displayName: "Create Intervention",
    description: "Create an intervention requiring human approval",
    parameters: [
      { name: "interventionId", dataType: "string", required: true },
      { name: "title", dataType: "string", required: true },
      { name: "description", dataType: "string", required: true },
      { name: "severity", dataType: "string", required: true },
      { name: "agentSource", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Intervention" }],
  },
  {
    apiName: "approveIntervention",
    displayName: "Approve Intervention",
    description: "Approve an intervention",
    parameters: [
      { name: "interventionId", dataType: "string", required: true },
      { name: "approvedBy", dataType: "string", required: true },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Intervention" }],
  },
  {
    apiName: "rejectIntervention",
    displayName: "Reject Intervention",
    description: "Reject an intervention",
    parameters: [
      { name: "interventionId", dataType: "string", required: true },
      { name: "rejectedBy", dataType: "string", required: true },
      { name: "rejectionReason", dataType: "string", required: true },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Intervention" }],
  },
  {
    apiName: "escalateIntervention",
    displayName: "Escalate Intervention",
    description: "Escalate an intervention",
    parameters: [
      { name: "interventionId", dataType: "string", required: true },
      { name: "escalatedTo", dataType: "string", required: true },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Intervention" }],
  },

  // Alert Actions
  {
    apiName: "createAlert",
    displayName: "Create Alert",
    description: "Create a new alert",
    parameters: [
      { name: "alertId", dataType: "string", required: true },
      { name: "title", dataType: "string", required: true },
      { name: "message", dataType: "string", required: true },
      { name: "severity", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Alert" }],
  },
  {
    apiName: "acknowledgeAlert",
    displayName: "Acknowledge Alert",
    description: "Acknowledge an alert",
    parameters: [
      { name: "alertId", dataType: "string", required: true },
      { name: "acknowledgedBy", dataType: "string", required: true },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Alert" }],
  },
  {
    apiName: "dismissAlert",
    displayName: "Dismiss Alert",
    description: "Dismiss an alert",
    parameters: [
      { name: "alertId", dataType: "string", required: true },
      { name: "dismissedBy", dataType: "string", required: true },
    ],
    operations: [{ type: "modifyObject" as const, objectTypeApiName: "Alert" }],
  },

  // Sync Actions
  {
    apiName: "syncFromExternal",
    displayName: "Sync from External",
    description: "Sync data from external system",
    parameters: [
      { name: "source", dataType: "string", required: true },
      { name: "objectType", dataType: "string", required: true },
      { name: "data", dataType: "string", required: true },
    ],
    operations: [{ type: "createObject" as const, objectTypeApiName: "Task" }],
  },
];

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("=".repeat(70));
  console.log("PALANTIR ONTOLOGY SETUP");
  console.log("Creating Object Types and Action Types");
  console.log("=".repeat(70));
  console.log("");

  const palantir = getPalantirService();

  if (!palantir) {
    console.error("ERROR: Palantir service not configured!");
    console.error("Set PALANTIR_HOSTNAME and PALANTIR_TOKEN environment variables");
    process.exit(1);
  }

  // Test connection
  console.log("Testing Palantir connection...");
  const testResult = await palantir.testConnection();

  if (!testResult.connected) {
    console.error(`ERROR: Could not connect to Palantir: ${testResult.error}`);
    process.exit(1);
  }

  console.log(`Connected to Palantir at ${testResult.hostname}`);
  console.log(`Found ${testResult.ontologies} ontologies, ${testResult.objectTypes} existing object types`);
  console.log("");

  // Create Object Types
  console.log("=".repeat(70));
  console.log(`CREATING ${OBJECT_TYPES.length} OBJECT TYPES`);
  console.log("=".repeat(70));

  let objectTypesCreated = 0;
  let objectTypesSkipped = 0;
  let objectTypesFailed = 0;

  for (const objectType of OBJECT_TYPES) {
    try {
      console.log(`Creating object type: ${objectType.apiName}...`);
      await palantir.createObjectType(objectType);
      objectTypesCreated++;
      console.log(`  ✓ Created ${objectType.apiName}`);
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        objectTypesSkipped++;
        console.log(`  - Skipped ${objectType.apiName} (already exists)`);
      } else {
        objectTypesFailed++;
        console.error(`  ✗ Failed ${objectType.apiName}: ${error.message}`);
      }
    }
  }

  console.log("");
  console.log(`Object Types: ${objectTypesCreated} created, ${objectTypesSkipped} skipped, ${objectTypesFailed} failed`);
  console.log("");

  // Create Action Types
  console.log("=".repeat(70));
  console.log(`CREATING ${ACTION_TYPES.length} ACTION TYPES`);
  console.log("=".repeat(70));

  let actionTypesCreated = 0;
  let actionTypesSkipped = 0;
  let actionTypesFailed = 0;

  for (const actionType of ACTION_TYPES) {
    try {
      console.log(`Creating action type: ${actionType.apiName}...`);
      await palantir.createActionType(actionType);
      actionTypesCreated++;
      console.log(`  ✓ Created ${actionType.apiName}`);
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        actionTypesSkipped++;
        console.log(`  - Skipped ${actionType.apiName} (already exists)`);
      } else {
        actionTypesFailed++;
        console.error(`  ✗ Failed ${actionType.apiName}: ${error.message}`);
      }
    }
  }

  console.log("");
  console.log(`Action Types: ${actionTypesCreated} created, ${actionTypesSkipped} skipped, ${actionTypesFailed} failed`);
  console.log("");

  // Final Summary
  console.log("=".repeat(70));
  console.log("SETUP COMPLETE");
  console.log("=".repeat(70));
  console.log("");
  console.log("Object Types:");
  console.log(`  Created: ${objectTypesCreated}`);
  console.log(`  Skipped: ${objectTypesSkipped}`);
  console.log(`  Failed:  ${objectTypesFailed}`);
  console.log("");
  console.log("Action Types:");
  console.log(`  Created: ${actionTypesCreated}`);
  console.log(`  Skipped: ${actionTypesSkipped}`);
  console.log(`  Failed:  ${actionTypesFailed}`);
  console.log("");

  if (objectTypesFailed > 0 || actionTypesFailed > 0) {
    console.log("Some items failed. Check the errors above.");
    console.log("You may need to check Palantir permissions or existing conflicting definitions.");
  } else {
    console.log("SUCCESS! Palantir ontology is ready.");
    console.log("");
    console.log("Next step: Run the seed script to populate data:");
    console.log("  npx tsx server/scripts/seed-complete-safe-to-palantir.ts");
  }

  console.log("=".repeat(70));
}

main().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
