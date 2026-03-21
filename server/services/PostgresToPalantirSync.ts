/**
 * POSTGRES TO PALANTIR SYNC SERVICE
 *
 * Syncs all data FROM PostgreSQL TO Palantir Foundry.
 * This establishes Palantir as the ontology source of truth.
 *
 * Data Flow:
 * PostgreSQL (current data) → Palantir Foundry (ontology) → Application (reads)
 *
 * Object Type Mappings:
 * - projects → Project
 * - agents → Agent
 * - agent_attributes → AgentAttribute
 * - features → Feature
 * - stories → Story
 * - tasks → Task
 * - divisions → Division
 * - enterprise_risks → Risk
 * - etc.
 */

import { db } from "../db.js";
import { storage } from "../storage.js";
import { getPalantirService, PalantirAIPService } from "../mcp/MCPServiceFactory.js";
import { getPalantirLLMBridge } from "./PalantirLLMBridge.js";
import {
  projects, features, stories, tasks, divisions, agents,
  divisionKpis, divisionOkrs, enterpriseRisks
} from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { PALANTIR_OBJECT_TYPES, PALANTIR_ACTIONS, TABLE_TO_OBJECT_TYPE } from "../constants/palantirOntology.js";

// ============================================================================
// SAFE PARSING UTILITIES
// ============================================================================

/**
 * Safely parse a string to integer, returning defaultValue if parsing fails
 */
function safeParseInt(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : Math.floor(value);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse a string to float, returning defaultValue if parsing fails
 */
function safeParseFloat(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely convert date to ISO string
 */
function safeToISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SyncResult {
  objectType: string;
  total: number;
  synced: number;
  failed: number;
  errors: string[];
  duration: number;
}

export interface FullSyncResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  duration: number;
  results: SyncResult[];
  summary: {
    totalObjects: number;
    totalSynced: number;
    totalFailed: number;
  };
}

// Palantir object type mappings - Use centralized constants
// TABLE_TO_OBJECT_TYPE is imported from palantirOntology.ts

// ============================================================================
// POSTGRES TO PALANTIR SYNC SERVICE
// ============================================================================

export class PostgresToPalantirSync {
  private palantirService: PalantirAIPService | null = null;
  private isSyncing = false;

  constructor() {
    this.palantirService = getPalantirService();
  }

  /**
   * Check if Palantir is configured and available
   */
  isAvailable(): boolean {
    return !!this.palantirService;
  }

  /**
   * Sync all data from PostgreSQL to Palantir
   */
  async syncAll(): Promise<FullSyncResult> {
    if (!this.palantirService) {
      throw new Error("Palantir service not configured");
    }

    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    this.isSyncing = true;
    const startedAt = new Date().toISOString();
    const results: SyncResult[] = [];

    try {
      console.log("[PostgresToPalantir] Starting full sync...");

      // Sync each entity type
      results.push(await this.syncProjects());
      results.push(await this.syncDivisions());
      results.push(await this.syncAgents());
      results.push(await this.syncAgentAttributes());
      results.push(await this.syncFeatures());
      results.push(await this.syncStories());
      results.push(await this.syncTasks());
      results.push(await this.syncKPIs());
      results.push(await this.syncOKRs());
      results.push(await this.syncRisks());

      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      const summary = {
        totalObjects: results.reduce((sum, r) => sum + r.total, 0),
        totalSynced: results.reduce((sum, r) => sum + r.synced, 0),
        totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
      };

      console.log(`[PostgresToPalantir] Sync complete: ${summary.totalSynced}/${summary.totalObjects} objects synced in ${duration}ms`);

      return {
        success: summary.totalFailed === 0,
        startedAt,
        completedAt,
        duration,
        results,
        summary,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync projects to Palantir using atlas-create-project action
   * Parameters: project_id (required), name (required), status (required),
   * description, priority, start_date, end_date, transformation_id, milestone_progress
   */
  async syncProjects(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allProjects = await db.select().from(projects);
      console.log(`[PostgresToPalantir] Syncing ${allProjects.length} projects using upsertProject...`);

      for (const project of allProjects) {
        try {
          // Map status to valid Palantir values: "Not Started, In Progress, Complete, At Risk, Blocked"
          const statusMap: Record<string, string> = {
            'planning': 'Not Started',
            'not_started': 'Not Started',
            'not-started': 'Not Started',
            'in_progress': 'In Progress',
            'in-progress': 'In Progress',
            'active': 'In Progress',
            'complete': 'Complete',
            'completed': 'Complete',
            'done': 'Complete',
            'at_risk': 'At Risk',
            'at-risk': 'At Risk',
            'blocked': 'Blocked',
            'on_hold': 'Blocked',
            'on-hold': 'Blocked',
          };
          const normalizedStatus = (project.status || 'planning').toLowerCase().replace(/\s+/g, '_');
          const palantirStatus = statusMap[normalizedStatus] || 'In Progress';

          // Map priority to valid values: "Critical, High, Medium, Low"
          const priorityMap: Record<string, string> = {
            'critical': 'Critical',
            'urgent': 'Critical',
            'high': 'High',
            'medium': 'Medium',
            'normal': 'Medium',
            'low': 'Low',
          };
          const normalizedPriority = (project.priority || 'medium').toLowerCase();
          const palantirPriority = priorityMap[normalizedPriority] || 'Medium';

          // Calculate milestone progress as a decimal (0.0 to 1.0)
          const progress = project.progress ? safeParseFloat(project.progress, 0) / 100 : 0;

          // Use only parameters supported by atlas-create-project action
          // Note: Additional data (budget, EVM, SAFe) stored in PostgreSQL and served via API
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_PROJECT, {
            project_id: String(project.id),
            name: project.name || 'Unnamed Project',
            status: palantirStatus,
            description: project.description || '',
            priority: palantirPriority,
            start_date: safeToISOString(project.startDate),
            end_date: safeToISOString(project.endDate),
            transformation_id: project.divisionId || 'vs-digital-platform',
            milestone_progress: progress,
          });
          synced++;
          console.log(`  ✓ Created project: ${project.id}`);
        } catch (error: any) {
          // Check if it's "already exists" - that's actually success
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Project already exists: ${project.id}`);
          } else {
            errors.push(`Project ${project.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.PROJECT,
        total: allProjects.length,
        synced,
        failed: allProjects.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.PROJECT,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync divisions to Palantir using AtlasDivision object type
   *
   * Parameters for create-atlas-division:
   * - id, name, head, description, color, changePercent, portfolioId, profit2024, source, syncedAt
   */
  async syncDivisions(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allDivisions = await db.select().from(divisions);
      console.log(`[PostgresToPalantir] Syncing ${allDivisions.length} divisions to AtlasDivision...`);

      for (const division of allDivisions) {
        try {
          // Use create-atlas-division action with AtlasDivision parameters
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_DIVISION, {
            id: String(division.id),
            name: division.name || 'Unnamed Division',
            head: division.ceo || 'TBD',
            description: division.description || '',
            color: division.color || '#4A90D9',
            changePercent: division.changePercent ?? 0,
            portfolioId: division.portfolioId || 'default',
            profit2023: division.profit2023 ?? 0,
            profit2024: division.profit2024 ?? 0,
            source: 'nexus-ppm',
            syncedAt: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created division: ${division.id} - ${division.name}`);
        } catch (error: any) {
          // Check if it's "already exists" - that's actually success
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Division already exists: ${division.id}`);
          } else {
            errors.push(`Division ${division.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.DIVISION,
        total: allDivisions.length,
        synced,
        failed: allDivisions.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.DIVISION,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync agents to Palantir using upsertAgent action
   */
  async syncAgents(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allAgents = await db.select().from(agents);
      console.log(`[PostgresToPalantir] Syncing ${allAgents.length} agents...`);

      for (const agent of allAgents) {
        try {
          // atlas-create-project requires: project_id, name, status
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_AGENT, {
            project_id: `agent-${agent.id}`,
            name: `[Agent] ${agent.name || 'Unnamed Agent'}`,
            status: agent.enabled ? 'active' : 'inactive',
            description: agent.description || '',
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created agent: ${agent.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Agent already exists: ${agent.id}`);
          } else {
            errors.push(`Agent ${agent.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.AGENT,
        total: allAgents.length,
        synced,
        failed: allAgents.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.AGENT,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync agent attributes to Palantir using upsertAgentAttribute action
   */
  async syncAgentAttributes(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      // Query agent_attributes table directly
      const result = await db.execute<any>(`SELECT * FROM agent_attributes`);
      const allAttributes = result.rows || [];
      console.log(`[PostgresToPalantir] Syncing ${allAttributes.length} agent attributes...`);

      for (const attr of allAttributes) {
        try {
          const currentValue = safeParseFloat(attr.current_value, 0);
          const targetValue = safeParseFloat(attr.target_value, 100);

          // atlas-create-insight requires: insight_id, title
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_AGENT_ATTRIBUTE, {
            insight_id: `attr-${attr.id}`,
            title: `[Attribute] ${attr.display_name || attr.name || 'Unnamed Attribute'}`,
            description: attr.description || `Current: ${currentValue}, Target: ${targetValue} ${attr.unit || '%'}`,
            source_agent_id: attr.agent_id,
            insight_type: 'agent_attribute',
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created agent attribute: ${attr.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Agent attribute already exists: ${attr.id}`);
          } else {
            errors.push(`AgentAttribute ${attr.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.AGENT_ATTRIBUTE,
        total: allAttributes.length,
        synced,
        failed: allAttributes.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.AGENT_ATTRIBUTE,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync features to Palantir using upsertFeature action
   */
  async syncFeatures(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allFeatures = await db.select().from(features);
      console.log(`[PostgresToPalantir] Syncing ${allFeatures.length} features...`);

      for (const feature of allFeatures) {
        try {
          const storyPoints = safeParseInt(feature.storyPoints, 0);
          const completedPoints = safeParseInt(feature.completedPoints, 0);
          const progress = storyPoints > 0 ? (completedPoints / storyPoints) * 100 : 0;

          // atlas-create-insight requires: insight_id, title
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_FEATURE, {
            insight_id: `feature-${feature.id}`,
            title: `[Feature] ${feature.name || 'Unnamed Feature'}`,
            description: feature.description || '',
            related_project_id: feature.projectId,
            status: feature.status || 'backlog',
            severity: feature.priority || 'Medium',
            insight_type: 'feature',
            confidence_score: progress / 100, // Convert progress to 0-1 scale
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created feature: ${feature.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Feature already exists: ${feature.id}`);
          } else {
            errors.push(`Feature ${feature.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.FEATURE,
        total: allFeatures.length,
        synced,
        failed: allFeatures.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.FEATURE,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync stories to Palantir using upsertStory action
   */
  async syncStories(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allStories = await db.select().from(stories);
      console.log(`[PostgresToPalantir] Syncing ${allStories.length} stories...`);

      for (const story of allStories) {
        try {
          // atlas-create-project requires: project_id, name, status
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_STORY, {
            project_id: `story-${story.id}`,
            name: `[Story] ${story.name || 'Unnamed Story'}`,
            status: story.status || 'backlog',
            description: story.description || '',
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created story: ${story.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Story already exists: ${story.id}`);
          } else {
            errors.push(`Story ${story.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.STORY,
        total: allStories.length,
        synced,
        failed: allStories.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.STORY,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync tasks to Palantir using upsertTask action
   */
  async syncTasks(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allTasks = await db.select().from(tasks);
      console.log(`[PostgresToPalantir] Syncing ${allTasks.length} tasks...`);

      for (const task of allTasks) {
        try {
          // atlas-create-project requires: project_id, name, status
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_TASK, {
            project_id: `task-${task.id}`,
            name: `[Task] ${task.name || 'Unnamed Task'}`,
            status: task.status || 'todo',
            description: task.description || '',
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created task: ${task.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Task already exists: ${task.id}`);
          } else {
            errors.push(`Task ${task.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.TASK,
        total: allTasks.length,
        synced,
        failed: allTasks.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.TASK,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync KPIs to Palantir using upsertKPI action
   */
  async syncKPIs(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allKPIs = await db.select().from(divisionKpis);
      console.log(`[PostgresToPalantir] Syncing ${allKPIs.length} KPIs...`);

      for (const kpi of allKPIs) {
        try {
          const currentValue = safeParseFloat(kpi.value2024, 0);
          const targetValue = safeParseFloat(kpi.target2025, 100);

          // atlas-create-kpi requires: kpi_id, name
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_KPI, {
            kpi_id: `kpi-${kpi.id}`,
            name: kpi.name || 'Unnamed KPI',
            description: `Division: ${kpi.divisionId}, Unit: ${kpi.unit || '%'}, Trend: ${kpi.trend || 'stable'}`,
            current_value: currentValue,
            target_value: targetValue,
            unit: kpi.unit || '%',
            status: kpi.status || 'On Track',
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created KPI: ${kpi.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ KPI already exists: ${kpi.id}`);
          } else {
            errors.push(`KPI ${kpi.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.KPI,
        total: allKPIs.length,
        synced,
        failed: allKPIs.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.KPI,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync OKRs to Palantir using upsertOKR action
   */
  async syncOKRs(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allOKRs = await db.select().from(divisionOkrs);
      console.log(`[PostgresToPalantir] Syncing ${allOKRs.length} OKRs...`);

      for (const okr of allOKRs) {
        try {
          // atlas-create-objective requires: objective_id, name, status
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_OKR, {
            objective_id: `okr-${okr.id}`,
            name: okr.objective || 'Unnamed Objective',
            status: okr.status || 'active',
            description: `Owner: ${okr.owner || 'TBD'}, Progress: ${safeParseFloat(okr.progress, 0)}%`,
            timeframe: safeToISOString(okr.dueDate),
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created OKR: ${okr.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ OKR already exists: ${okr.id}`);
          } else {
            errors.push(`OKR ${okr.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.OKR,
        total: allOKRs.length,
        synced,
        failed: allOKRs.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.OKR,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync risks to Palantir using upsertRisk action
   */
  async syncRisks(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allRisks = await db.select().from(enterpriseRisks);
      console.log(`[PostgresToPalantir] Syncing ${allRisks.length} risks...`);

      for (const risk of allRisks) {
        try {
          // atlas-create-risk requires: risk_id, description
          await this.palantirService!.applyAction(PALANTIR_ACTIONS.UPSERT_RISK, {
            risk_id: `risk-${risk.id}`,
            description: `${risk.name || 'Risk'}: ${risk.description || 'No description'}`,
            impact: risk.severity || 'medium',
            probability: risk.likelihood || 'possible',
            project_id: risk.projectId,
            mitigation_plan: risk.mitigationPlan || '',
            owner: risk.owner || '',
            status: risk.status || 'open',
            identified_date: safeToISOString(risk.identifiedDate),
            risk_score: 0, // Will be calculated based on impact/probability
            created_at: new Date().toISOString(),
          });
          synced++;
          console.log(`  ✓ Created risk: ${risk.id}`);
        } catch (error: any) {
          if (error.message?.includes('ObjectAlreadyExists') || error.message?.includes('already exists')) {
            synced++;
            console.log(`  ≈ Risk already exists: ${risk.id}`);
          } else {
            errors.push(`Risk ${risk.id}: ${error.message}`);
          }
        }
      }

      return {
        objectType: PALANTIR_OBJECT_TYPES.RISK,
        total: allRisks.length,
        synced,
        failed: allRisks.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: PALANTIR_OBJECT_TYPES.RISK,
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Upsert an object to Palantir ontology using direct API calls
   * Uses batchUpsertObjects for reliable CRUD operations
   */
  private async upsertToPalantir(
    objectType: string,
    primaryKey: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.palantirService) {
      throw new Error("Palantir service not available");
    }

    // Map to correct Palantir object type
    const palantirType = TABLE_TO_OBJECT_TYPE[objectType.toLowerCase()] || objectType;

    // Use direct batch upsert
    const result = await this.palantirService.batchUpsertObjects(palantirType, [
      { primaryKey, properties: data }
    ]);

    if (result.failed > 0) {
      throw new Error(`Upsert failed: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Bulk upsert objects to Palantir using direct API
   */
  private async bulkUpsertToPalantir(
    objectType: string,
    dataArray: Array<{ primaryKey: string; data: Record<string, unknown> }>
  ): Promise<{ synced: number; failed: number; errors: string[] }> {
    if (!this.palantirService) {
      return { synced: 0, failed: dataArray.length, errors: ['Palantir service not available'] };
    }

    // Map to correct Palantir object type
    const palantirType = TABLE_TO_OBJECT_TYPE[objectType.toLowerCase()] || objectType;

    // Transform data for batch upsert
    const objects = dataArray.map(item => ({
      primaryKey: item.primaryKey,
      properties: item.data,
    }));

    const result = await this.palantirService.batchUpsertObjects(palantirType, objects);

    return {
      synced: result.created + result.updated,
      failed: result.failed,
      errors: result.errors,
    };
  }
}

// Singleton instance
let syncInstance: PostgresToPalantirSync | null = null;

export function getPostgresToPalantirSync(): PostgresToPalantirSync {
  if (!syncInstance) {
    syncInstance = new PostgresToPalantirSync();
  }
  return syncInstance;
}
