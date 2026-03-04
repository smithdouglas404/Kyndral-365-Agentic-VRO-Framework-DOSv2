/**
 * PALANTIR ONTOLOGY CONSTANTS
 *
 * Single source of truth for all Palantir object types and action names.
 * These match the EXISTING object types in the Palantir Foundry ontology.
 *
 * NOTE: Currently using Atlas* naming convention as that's what exists in Foundry.
 * To rename to simple names (Project, Risk, etc.), you need to:
 * 1. Create new object types in Palantir Foundry UI
 * 2. Update these constants to use the new names
 * 3. Run migration to copy data from Atlas* to new types
 *
 * ATLAS DIVISION STATUS:
 * - AtlasDivision needs to be deployed via Ontology as Code
 * - See: server/ontology/palantir/AtlasDivision.ts for OaC specification
 * - Set PALANTIR_ATLAS_DIVISION_ENABLED=true after deployment
 * - Verify with: npx tsx server/scripts/verify-atlas-division.ts
 *
 * Usage:
 *   import { PALANTIR_OBJECT_TYPES, PALANTIR_ACTIONS } from '../constants/palantirOntology.js';
 *   await palantir.listObjects(PALANTIR_OBJECT_TYPES.PROJECT, { pageSize: 100 });
 *   await palantir.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, { ... });
 */

// AtlasDivision is now deployed in Palantir Foundry
const ATLAS_DIVISION_ENABLED = true;

// ============================================================================
// OBJECT TYPE NAMES (as defined in Palantir ontology)
// Using existing Atlas* types until new types are created in Foundry UI
// ============================================================================

export const PALANTIR_OBJECT_TYPES = {
  // Core SAFe Portfolio Structure
  PROJECT: 'AtlasProject',           // Projects, EPICs, Value Streams
  DIVISION: ATLAS_DIVISION_ENABLED ? 'AtlasDivision' : 'AtlasProject', // Business Units / Divisions - enabled via PALANTIR_ATLAS_DIVISION_ENABLED
  TRANSFORMATION: 'AtlasTransformation', // TMO/PMO/VRO Offices
  FEATURE: 'AtlasProject',           // Features stored as AtlasProject with [Feature] prefix
  STORY: 'AtlasProject',             // Stories stored as AtlasProject with [Story] prefix
  TASK: 'AtlasProject',              // Tasks stored as AtlasProject with [Task] prefix

  // Metrics & Goals
  KPI: 'AtlasKpi',
  OKR: 'AtlasObjective',

  // Risk Management
  RISK: 'AtlasRisk',

  // Agent System
  AGENT: 'AtlasAgent',
  AGENT_ATTRIBUTE: 'AtlasInsight',  // Attributes stored as Insights

  // Human-in-the-Loop (HITL)
  INTERVENTION: 'AtlasInsight',
  ALERT: 'AtlasInsight',

  // Additional types in ontology
  BUDGET: 'AtlasBudget',
  KEY_RESULT: 'AtlasKeyResult',
  TEAM: 'AtlasTeam',
  DEPENDENCY: 'AtlasDependency',
  PERSON: 'AtlasPerson',
  CHECKPOINT: 'AtlasGovernanceCheckpoint',
} as const;

// ============================================================================
// ACTION NAMES (as defined in Palantir ontology)
// These are the ACTUAL actions that exist in Foundry - all use atlas-* prefix
// ============================================================================

export const PALANTIR_ACTIONS = {
  // Project Management
  CREATE_PROJECT: 'atlas-create-project',
  UPDATE_PROJECT: 'atlas-update-project',
  ADVANCE_PROJECT_STATUS: 'atlas-advance-project-status',

  // Division Management (Business Units)
  CREATE_DIVISION: 'create-atlas-division',

  // Transformation Management (TMO/PMO/VRO Offices)
  CREATE_TRANSFORMATION: 'atlas-create-transformation',

  // Risk Management
  CREATE_RISK: 'atlas-create-risk',
  UPDATE_RISK: 'atlas-update-risk',

  // KPI Management
  CREATE_KPI: 'atlas-create-kpi',

  // OKR / Objective Management
  CREATE_OBJECTIVE: 'atlas-create-objective',
  CREATE_KEY_RESULT: 'atlas-create-key-result',

  // Insight Management (used for Features, Agent Attributes, Interventions)
  CREATE_INSIGHT: 'atlas-create-insight',

  // Budget Management
  CREATE_BUDGET: 'atlas-create-budget',
  FLAG_BUDGET_ANOMALY: 'atlas-flag-budget-anomaly',

  // Dependencies
  CREATE_DEPENDENCY: 'atlas-create-dependency',

  // Readiness & Governance
  UPDATE_READINESS_SCORE: 'atlas-update-readiness-score',
  RECORD_GOVERNANCE_DECISION: 'atlas-record-governance-decision',

  // Aliases for convenience (map to existing actions)
  UPSERT_PROJECT: 'atlas-create-project',  // Palantir handles upsert automatically
  UPSERT_DIVISION: 'create-atlas-division', // Business Units
  UPSERT_TRANSFORMATION: 'atlas-create-transformation', // TMO/PMO/VRO use AtlasTransformation
  UPSERT_RISK: 'atlas-create-risk',
  UPSERT_KPI: 'atlas-create-kpi',
  UPSERT_OKR: 'atlas-create-objective',
  UPSERT_FEATURE: 'atlas-create-insight',  // Features stored as Insights
  UPSERT_STORY: 'atlas-create-project',    // Stories stored as Projects
  UPSERT_TASK: 'atlas-create-project',     // Tasks stored as Projects
  UPSERT_AGENT: 'atlas-create-project',    // Agents stored as Projects (needs own action)
  UPSERT_AGENT_ATTRIBUTE: 'atlas-create-insight',  // Agent attributes stored as Insights
  CREATE_INTERVENTION: 'atlas-create-insight',     // Interventions stored as Insights
  CREATE_ALERT: 'atlas-create-insight',            // Alerts stored as Insights
} as const;

// ============================================================================
// ACTION ALIASES (for code that uses different naming conventions)
// Since ontology uses atlas-* names, these map various conventions to actual actions
// ============================================================================

export const ACTION_ALIASES: Record<string, string> = {
  // Simple names → Atlas actions
  'createProject': PALANTIR_ACTIONS.CREATE_PROJECT,
  'updateProject': PALANTIR_ACTIONS.UPDATE_PROJECT,
  'upsertProject': PALANTIR_ACTIONS.CREATE_PROJECT,
  'createTransformation': PALANTIR_ACTIONS.CREATE_TRANSFORMATION,
  'upsertDivision': PALANTIR_ACTIONS.UPSERT_DIVISION,
  'createDivision': PALANTIR_ACTIONS.CREATE_DIVISION,
  'createRisk': PALANTIR_ACTIONS.CREATE_RISK,
  'updateRisk': PALANTIR_ACTIONS.UPDATE_RISK,
  'upsertRisk': PALANTIR_ACTIONS.CREATE_RISK,
  'createKPI': PALANTIR_ACTIONS.CREATE_KPI,
  'createKpi': PALANTIR_ACTIONS.CREATE_KPI,
  'upsertKPI': PALANTIR_ACTIONS.CREATE_KPI,
  'createObjective': PALANTIR_ACTIONS.CREATE_OBJECTIVE,
  'createOKR': PALANTIR_ACTIONS.CREATE_OBJECTIVE,
  'upsertOKR': PALANTIR_ACTIONS.CREATE_OBJECTIVE,
  'createInsight': PALANTIR_ACTIONS.CREATE_INSIGHT,
  'createFeature': PALANTIR_ACTIONS.CREATE_INSIGHT,
  'upsertFeature': PALANTIR_ACTIONS.CREATE_INSIGHT,
  'createBudget': PALANTIR_ACTIONS.CREATE_BUDGET,
  'createDependency': PALANTIR_ACTIONS.CREATE_DEPENDENCY,
};

// ============================================================================
// LEGACY OBJECT TYPE NAMES (for migration - maps old Atlas* to new simple names)
// ============================================================================

export const LEGACY_TO_NEW_OBJECT_TYPES: Record<string, string> = {
  AtlasProject: PALANTIR_OBJECT_TYPES.PROJECT,
  AtlasTransformation: PALANTIR_OBJECT_TYPES.DIVISION,
  AtlasRisk: PALANTIR_OBJECT_TYPES.RISK,
  AtlasKpi: PALANTIR_OBJECT_TYPES.KPI,
  AtlasObjective: PALANTIR_OBJECT_TYPES.OKR,
  AtlasInsight: PALANTIR_OBJECT_TYPES.INTERVENTION, // Context-dependent, could also be Feature
  AtlasAgent: PALANTIR_OBJECT_TYPES.AGENT,
  AtlasFeature: PALANTIR_OBJECT_TYPES.FEATURE,
  AtlasStory: PALANTIR_OBJECT_TYPES.STORY,
  AtlasTask: PALANTIR_OBJECT_TYPES.TASK,
  AtlasDivision: PALANTIR_OBJECT_TYPES.DIVISION,
  AtlasTeam: PALANTIR_OBJECT_TYPES.DIVISION, // Teams map to Division
  AtlasBudget: PALANTIR_OBJECT_TYPES.PROJECT, // Budget info stored on Project
  AtlasKeyResult: PALANTIR_OBJECT_TYPES.OKR, // Key results are part of OKR
  AtlasDependency: PALANTIR_OBJECT_TYPES.PROJECT, // Dependencies are project links
  AtlasPortfolio: PALANTIR_OBJECT_TYPES.DIVISION, // Portfolio maps to top-level Division
};

// ============================================================================
// DATABASE TABLE TO PALANTIR OBJECT TYPE MAPPING
// ============================================================================

export const TABLE_TO_OBJECT_TYPE: Record<string, string> = {
  projects: PALANTIR_OBJECT_TYPES.PROJECT,
  features: PALANTIR_OBJECT_TYPES.FEATURE,
  stories: PALANTIR_OBJECT_TYPES.STORY,
  tasks: PALANTIR_OBJECT_TYPES.TASK,
  divisions: PALANTIR_OBJECT_TYPES.DIVISION,
  division_kpis: PALANTIR_OBJECT_TYPES.KPI,
  division_okrs: PALANTIR_OBJECT_TYPES.OKR,
  enterprise_risks: PALANTIR_OBJECT_TYPES.RISK,
  risks: PALANTIR_OBJECT_TYPES.RISK,
  kpis: PALANTIR_OBJECT_TYPES.KPI,
  okrs: PALANTIR_OBJECT_TYPES.OKR,
  agents: PALANTIR_OBJECT_TYPES.AGENT,
  agent_attributes: PALANTIR_OBJECT_TYPES.AGENT_ATTRIBUTE,
  interventions: PALANTIR_OBJECT_TYPES.INTERVENTION,
  alerts: PALANTIR_OBJECT_TYPES.ALERT,
  dependencies: PALANTIR_OBJECT_TYPES.PROJECT, // Dependencies reference projects
  teams: PALANTIR_OBJECT_TYPES.DIVISION,
  budgets: PALANTIR_OBJECT_TYPES.PROJECT, // Budget data on projects
  portfolios: PALANTIR_OBJECT_TYPES.DIVISION, // Portfolios are top-level divisions
};

// ============================================================================
// AGENT TO PALANTIR OBJECT TYPE MAPPINGS
// ============================================================================

export const AGENT_OBJECT_MAPPINGS: Record<
  string,
  {
    objectTypes: string[];
    label: string;
  }
> = {
  finops: {
    objectTypes: [PALANTIR_OBJECT_TYPES.KPI, PALANTIR_OBJECT_TYPES.PROJECT],
    label: 'Financial data',
  },
  deepfinops: {
    objectTypes: [PALANTIR_OBJECT_TYPES.KPI, PALANTIR_OBJECT_TYPES.PROJECT],
    label: 'Financial data',
  },
  tmo: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.TASK],
    label: 'Transformation & schedule data',
  },
  deeptmo: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.TASK],
    label: 'Transformation & schedule data',
  },
  risk: {
    objectTypes: [PALANTIR_OBJECT_TYPES.RISK, PALANTIR_OBJECT_TYPES.PROJECT],
    label: 'Risk data',
  },
  deeprisk: {
    objectTypes: [PALANTIR_OBJECT_TYPES.RISK, PALANTIR_OBJECT_TYPES.PROJECT],
    label: 'Risk data',
  },
  pmo: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.DIVISION],
    label: 'Project health data',
  },
  deeppmo: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.DIVISION],
    label: 'Project health data',
  },
  vro: {
    objectTypes: [PALANTIR_OBJECT_TYPES.KPI, PALANTIR_OBJECT_TYPES.OKR],
    label: 'Value realization data',
  },
  deepvro: {
    objectTypes: [PALANTIR_OBJECT_TYPES.KPI, PALANTIR_OBJECT_TYPES.OKR],
    label: 'Value realization data',
  },
  governance: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.INTERVENTION],
    label: 'Governance data',
  },
  deepgovernance: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.INTERVENTION],
    label: 'Governance data',
  },
  okr: {
    objectTypes: [PALANTIR_OBJECT_TYPES.OKR, PALANTIR_OBJECT_TYPES.KPI],
    label: 'OKR data',
  },
  deepokrinference: {
    objectTypes: [PALANTIR_OBJECT_TYPES.OKR, PALANTIR_OBJECT_TYPES.KPI],
    label: 'OKR inference data',
  },
  ocm: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.DIVISION],
    label: 'Organizational change data',
  },
  deepocm: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.DIVISION],
    label: 'Organizational change data',
  },
  planning: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.FEATURE],
    label: 'Planning data',
  },
  deepplanning: {
    objectTypes: [PALANTIR_OBJECT_TYPES.PROJECT, PALANTIR_OBJECT_TYPES.FEATURE],
    label: 'Planning data',
  },
  notification: {
    objectTypes: [
      PALANTIR_OBJECT_TYPES.ALERT,
      PALANTIR_OBJECT_TYPES.INTERVENTION,
      PALANTIR_OBJECT_TYPES.AGENT,
    ],
    label: 'Notification & action gateway data',
  },
  deepnotification: {
    objectTypes: [
      PALANTIR_OBJECT_TYPES.ALERT,
      PALANTIR_OBJECT_TYPES.INTERVENTION,
      PALANTIR_OBJECT_TYPES.AGENT,
    ],
    label: 'Notification & action gateway data',
  },
  integrated: {
    objectTypes: [
      PALANTIR_OBJECT_TYPES.PROJECT,
      PALANTIR_OBJECT_TYPES.DIVISION,
      PALANTIR_OBJECT_TYPES.AGENT,
    ],
    label: 'Cross-domain data',
  },
  deepintegratedmgmt: {
    objectTypes: [
      PALANTIR_OBJECT_TYPES.PROJECT,
      PALANTIR_OBJECT_TYPES.DIVISION,
      PALANTIR_OBJECT_TYPES.AGENT,
    ],
    label: 'Cross-domain data',
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PalantirObjectType =
  (typeof PALANTIR_OBJECT_TYPES)[keyof typeof PALANTIR_OBJECT_TYPES];
export type PalantirAction = (typeof PALANTIR_ACTIONS)[keyof typeof PALANTIR_ACTIONS];
