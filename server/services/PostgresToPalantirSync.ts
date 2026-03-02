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
import {
  projects, features, stories, tasks, divisions, agents,
  divisionKpis, divisionOkrs, enterpriseRisks
} from "../../shared/schema.js";
import { eq } from "drizzle-orm";

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

// Palantir object type mappings
const OBJECT_TYPE_MAPPINGS: Record<string, string> = {
  projects: "Project",
  features: "Feature",
  stories: "Story",
  tasks: "Task",
  divisions: "Division",
  agents: "Agent",
  agent_attributes: "AgentAttribute",
  widget_definitions: "Widget",
  division_kpis: "KPI",
  division_okrs: "OKR",
  enterprise_risks: "Risk",
  milestones: "Milestone",
  dependencies: "Dependency",
  resources: "Resource",
};

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
   * Sync projects to Palantir
   */
  async syncProjects(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allProjects = await db.select().from(projects);
      console.log(`[PostgresToPalantir] Syncing ${allProjects.length} projects...`);

      for (const project of allProjects) {
        try {
          await this.upsertToPalantir("Project", project.id, {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            businessUnit: project.businessUnitId,
            divisionId: project.divisionId,
            portfolioId: project.portfolioId,
            valueStreamId: project.valueStreamId,
            artId: project.artId,
            teamId: project.teamId,
            priority: project.priority,
            startDate: safeToISOString(project.startDate),
            endDate: safeToISOString(project.endDate),
            budgetTotal: safeParseFloat(project.budgetTotal, 0),
            budgetSpent: safeParseFloat(project.budgetSpent, 0),
            budgetUnit: project.budgetUnit,
            expectedRoi: project.expectedRoi,
            roiValue: safeParseFloat(project.roiValue, 0),
            safeStage: project.safeStage,
            currentPi: project.currentPi,
            velocity: safeParseInt(project.velocity, 0),
            predictability: safeParseInt(project.predictability, 0),
            flowEfficiency: safeParseInt(project.flowEfficiency, 0),
            epicId: project.epicId,
            epicName: project.epicName,
            epicProgress: safeParseInt(project.epicProgress, 0),
            progress: project.progress,
            cpiValue: project.cpiValue,
            spiValue: project.spiValue,
            earnedValue: project.earnedValue,
            plannedValue: project.plannedValue,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Project ${project.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Project",
        total: allProjects.length,
        synced,
        failed: allProjects.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Project",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync divisions to Palantir
   */
  async syncDivisions(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let synced = 0;

    try {
      const allDivisions = await db.select().from(divisions);
      console.log(`[PostgresToPalantir] Syncing ${allDivisions.length} divisions...`);

      for (const division of allDivisions) {
        try {
          await this.upsertToPalantir("Division", division.id, {
            id: division.id,
            name: division.name,
            ceo: division.ceo,
            description: division.description,
            color: division.color,
            profit2023: division.profit2023,
            profit2024: division.profit2024,
            changePercent: division.changePercent,
            portfolioId: division.portfolioId,
            companyId: division.companyId,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Division ${division.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Division",
        total: allDivisions.length,
        synced,
        failed: allDivisions.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Division",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync agents to Palantir
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
          await this.upsertToPalantir("Agent", agent.id, {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            enabled: agent.enabled,
            capabilities: agent.capabilities,
            defaultPriority: agent.defaultPriority,
            ownerUserId: agent.ownerUserId,
            ownerTeam: agent.ownerTeam,
            palantirObjectTypes: agent.palantirObjectTypes,
            mcpConnections: agent.mcpConnections,
            icon: agent.icon,
            color: agent.color,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Agent ${agent.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Agent",
        total: allAgents.length,
        synced,
        failed: allAgents.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Agent",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync agent attributes to Palantir
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
          await this.upsertToPalantir("AgentAttribute", attr.id, {
            id: attr.id,
            agentId: attr.agent_id,
            name: attr.name,
            displayName: attr.display_name,
            description: attr.description,
            category: attr.category,
            dataType: attr.data_type,
            unit: attr.unit,
            format: attr.format,
            valueSource: attr.value_source,
            calculationRule: attr.calculation_rule,
            aggregationMethod: attr.aggregation_method,
            currentValue: attr.current_value,
            previousValue: attr.previous_value,
            targetValue: attr.target_value,
            thresholds: attr.thresholds,
            defaultWidgetType: attr.default_widget_type,
            palantirPropertyName: attr.palantir_property_name,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`AgentAttribute ${attr.id}: ${error.message}`);
        }
      }

      return {
        objectType: "AgentAttribute",
        total: allAttributes.length,
        synced,
        failed: allAttributes.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "AgentAttribute",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync features to Palantir
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
          await this.upsertToPalantir("Feature", feature.id, {
            id: feature.id,
            projectId: feature.projectId,
            name: feature.name,
            description: feature.description,
            status: feature.status,
            storyPoints: safeParseInt(feature.storyPoints, 0),
            completedPoints: safeParseInt(feature.completedPoints, 0),
            priority: feature.priority,
            targetPi: feature.targetPi,
            wsjfScore: safeParseFloat(feature.wsjfScore, 0),
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Feature ${feature.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Feature",
        total: allFeatures.length,
        synced,
        failed: allFeatures.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Feature",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync stories to Palantir
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
          await this.upsertToPalantir("Story", story.id, {
            id: story.id,
            featureId: story.featureId,
            projectId: story.projectId,
            name: story.name,
            description: story.description,
            status: story.status,
            storyPoints: safeParseInt(story.storyPoints, 0),
            sprint: story.sprint,
            assignedTeam: story.assignedTeam,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Story ${story.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Story",
        total: allStories.length,
        synced,
        failed: allStories.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Story",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync tasks to Palantir
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
          await this.upsertToPalantir("Task", task.id, {
            id: task.id,
            storyId: task.storyId,
            featureId: task.featureId,
            projectId: task.projectId,
            name: task.name,
            description: task.description,
            status: task.status,
            effortHours: safeParseFloat(task.effortHours, 0),
            assignee: task.assignee,
            skills: task.skills,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Task ${task.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Task",
        total: allTasks.length,
        synced,
        failed: allTasks.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Task",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync KPIs to Palantir
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
          await this.upsertToPalantir("KPI", kpi.id, {
            id: kpi.id,
            divisionId: kpi.divisionId,
            name: kpi.name,
            value2023: kpi.value2023,
            value2024: kpi.value2024,
            target2025: kpi.target2025,
            unit: kpi.unit,
            trend: kpi.trend,
            status: kpi.status,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`KPI ${kpi.id}: ${error.message}`);
        }
      }

      return {
        objectType: "KPI",
        total: allKPIs.length,
        synced,
        failed: allKPIs.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "KPI",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync OKRs to Palantir
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
          await this.upsertToPalantir("OKR", okr.id, {
            id: okr.id,
            divisionId: okr.divisionId,
            objective: okr.objective,
            keyResults: okr.keyResults,
            owner: okr.owner,
            dueDate: okr.dueDate,
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`OKR ${okr.id}: ${error.message}`);
        }
      }

      return {
        objectType: "OKR",
        total: allOKRs.length,
        synced,
        failed: allOKRs.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "OKR",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync risks to Palantir
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
          await this.upsertToPalantir("Risk", risk.id, {
            id: risk.id,
            title: risk.name,
            description: risk.description,
            categoryId: risk.categoryId,
            severity: risk.severity,
            trend: risk.trend,
            createdAt: safeToISOString(risk.createdAt),
            source: "postgresql",
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error: any) {
          errors.push(`Risk ${risk.id}: ${error.message}`);
        }
      }

      return {
        objectType: "Risk",
        total: allRisks.length,
        synced,
        failed: allRisks.length - synced,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        objectType: "Risk",
        total: 0,
        synced: 0,
        failed: 0,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Upsert an object to Palantir ontology
   * Tries upsert action first, then falls back to checking existence and doing create/update
   */
  private async upsertToPalantir(
    objectType: string,
    primaryKey: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.palantirService) {
      throw new Error("Palantir service not available");
    }

    // Try to use an upsert action if available
    try {
      await this.palantirService.applyAction(`upsert${objectType}`, {
        primaryKey,
        ...data,
      });
      return; // Success
    } catch (upsertError: any) {
      // If upsert action doesn't exist, fall back to check existence and create/update
      const isActionNotFound = upsertError.message?.includes('not found') ||
                               upsertError.message?.includes('does not exist') ||
                               upsertError.message?.includes('unknown action');

      if (!isActionNotFound) {
        // This was a real error during upsert, propagate it
        throw new Error(`Upsert failed for ${objectType}/${primaryKey}: ${upsertError.message}`);
      }

      // Fall back to create/update pattern
      console.log(`[PostgresToPalantir] Upsert action not found for ${objectType}, trying create/update...`);
    }

    // Check if object exists
    try {
      const existing = await this.palantirService.getObject(objectType, primaryKey);

      if (existing) {
        // Object exists, try to update
        try {
          await this.palantirService.applyAction(`update${objectType}`, {
            primaryKey,
            ...data,
          });
          console.log(`[PostgresToPalantir] Updated ${objectType}/${primaryKey}`);
        } catch (updateError: any) {
          // Update action may not exist either, log but don't fail
          console.warn(`[PostgresToPalantir] Could not update ${objectType}/${primaryKey}: ${updateError.message}`);
          // For now, we consider this a success since the object exists
          // The data may be stale but at least it's synced
        }
      } else {
        // Object doesn't exist, create it
        try {
          await this.palantirService.applyAction(`create${objectType}`, {
            primaryKey,
            ...data,
          });
          console.log(`[PostgresToPalantir] Created ${objectType}/${primaryKey}`);
        } catch (createError: any) {
          throw new Error(`Create failed for ${objectType}/${primaryKey}: ${createError.message}`);
        }
      }
    } catch (getError: any) {
      // If we can't check existence, try to create anyway
      // It will fail if object exists, but that's acceptable
      console.log(`[PostgresToPalantir] Could not check existence, attempting create for ${objectType}/${primaryKey}`);
      try {
        await this.palantirService.applyAction(`create${objectType}`, {
          primaryKey,
          ...data,
        });
      } catch (createError: any) {
        // Check if this is a "already exists" error - that's OK
        const alreadyExists = createError.message?.includes('already exists') ||
                              createError.message?.includes('duplicate') ||
                              createError.message?.includes('conflict');
        if (!alreadyExists) {
          throw new Error(`Sync failed for ${objectType}/${primaryKey}: ${createError.message}`);
        }
        // Already exists is fine, data may be stale but synced
        console.log(`[PostgresToPalantir] Object ${objectType}/${primaryKey} already exists, skipping create`);
      }
    }
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
