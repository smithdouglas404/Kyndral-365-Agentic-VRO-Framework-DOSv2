/**
 * POSTGRES TO EXTERNAL SYSTEMS SYNC SERVICE
 *
 * Syncs PostgreSQL data TO external PM systems (Jira, OpenProject, Monday.com)
 * This demonstrates multi-system portfolio management.
 *
 * Data Flow:
 * PostgreSQL → Jira (issues/epics)
 * PostgreSQL → OpenProject (work packages)
 * PostgreSQL → Monday.com (board items)
 *
 * Use Case: Show that the same project data can be viewed/managed
 * across multiple PM tools, all staying in sync.
 */

import { db } from "../db.js";
import {
  getJiraService,
  getMondayService,
  getOpenProjectService,
  JiraService,
  MondayService,
  OpenProjectService,
} from "../mcp/MCPServiceFactory.js";
import { projects, features, stories, tasks } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExternalSyncResult {
  system: "jira" | "openproject" | "monday";
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  duration: number;
  externalIds: Record<string, string>; // local ID -> external ID mapping
}

export interface FullExternalSyncResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  duration: number;
  results: ExternalSyncResult[];
}

// ============================================================================
// POSTGRES TO EXTERNAL SYSTEMS SYNC
// ============================================================================

export class PostgresToExternalSync {
  private jiraService: JiraService | null = null;
  private mondayService: MondayService | null = null;
  private openProjectService: OpenProjectService | null = null;

  // Track external IDs for synced items
  private externalIdMap: Map<string, Record<string, string>> = new Map();

  constructor() {
    this.jiraService = getJiraService();
    this.mondayService = getMondayService();
    this.openProjectService = getOpenProjectService();
  }

  /**
   * Get available systems
   */
  getAvailableSystems(): string[] {
    const systems: string[] = [];
    if (this.jiraService) systems.push("jira");
    if (this.openProjectService) systems.push("openproject");
    if (this.mondayService) systems.push("monday");
    return systems;
  }

  /**
   * Sync all projects to all available external systems
   */
  async syncAllToAllSystems(): Promise<FullExternalSyncResult> {
    const startedAt = new Date().toISOString();
    const results: ExternalSyncResult[] = [];

    if (this.jiraService) {
      results.push(await this.syncToJira());
    }

    if (this.openProjectService) {
      results.push(await this.syncToOpenProject());
    }

    if (this.mondayService) {
      results.push(await this.syncToMonday());
    }

    const completedAt = new Date().toISOString();
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    return {
      success: results.every((r) => r.failed === 0),
      startedAt,
      completedAt,
      duration,
      results,
    };
  }

  // ============================================================================
  // JIRA SYNC
  // ============================================================================

  /**
   * Sync projects to Jira as Epics, features as Stories
   */
  async syncToJira(projectKey?: string): Promise<ExternalSyncResult> {
    if (!this.jiraService) {
      throw new Error("Jira service not configured");
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const externalIds: Record<string, string> = {};
    let created = 0;
    let updated = 0;

    try {
      // Get all projects
      const allProjects = await db.select().from(projects);
      console.log(`[ExternalSync] Syncing ${allProjects.length} projects to Jira...`);

      const jiraProjectKey = projectKey || process.env.JIRA_PROJECT_KEY || "DEMO";

      for (const project of allProjects) {
        try {
          // Create/update as Epic in Jira
          const existingKey = this.getExternalId("jira", project.id);

          if (existingKey) {
            // Update existing epic - only send fields being updated
            await this.jiraService.updateIssue(existingKey, {
              summary: project.name,
              description: this.formatJiraDescription(project),
              priority: { name: this.mapPriorityToJira(project.priority) },
            } as any);
            updated++;
            externalIds[project.id] = existingKey;
          } else {
            // Create new epic
            const result = await this.jiraService.createIssue({
              fields: {
                project: { key: jiraProjectKey },
                summary: project.name,
                description: this.formatJiraDescription(project),
                issuetype: { name: "Epic" },
                priority: { name: this.mapPriorityToJira(project.priority) },
                labels: ["synced-from-nexus", project.status || "active"],
              },
            });
            created++;
            externalIds[project.id] = result.key;
            this.setExternalId("jira", project.id, result.key);
          }

          // Sync features as Stories under this Epic
          const projectFeatures = await db
            .select()
            .from(features)
            .where(eq(features.projectId, project.id));

          for (const feature of projectFeatures) {
            try {
              const featureKey = this.getExternalId("jira", feature.id);
              const epicKey = externalIds[project.id];

              if (featureKey) {
                await this.jiraService.updateIssue(featureKey, {
                  summary: feature.name,
                  description: feature.description || "",
                } as any);
                updated++;
              } else {
                const result = await this.jiraService.createIssue({
                  fields: {
                    project: { key: jiraProjectKey },
                    summary: feature.name,
                    description: feature.description || "",
                    issuetype: { name: "Story" },
                    priority: { name: this.mapPriorityToJira(feature.priority) },
                    labels: ["synced-from-nexus"],
                    // Link to epic - syntax depends on Jira config
                    customfield_10014: epicKey, // Epic Link field (may vary)
                  },
                });
                created++;
                externalIds[feature.id] = result.key;
                this.setExternalId("jira", feature.id, result.key);
              }
            } catch (error: any) {
              errors.push(`Feature ${feature.id}: ${error.message}`);
            }
          }
        } catch (error: any) {
          errors.push(`Project ${project.id}: ${error.message}`);
        }
      }

      return {
        system: "jira",
        total: allProjects.length,
        created,
        updated,
        failed: errors.length,
        errors,
        duration: Date.now() - startTime,
        externalIds,
      };
    } catch (error: any) {
      return {
        system: "jira",
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [error.message],
        duration: Date.now() - startTime,
        externalIds,
      };
    }
  }

  private formatJiraDescription(project: any): object {
    // Jira Cloud API v3 requires Atlassian Document Format (ADF)
    return {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Project synced from Nexus PPM", marks: [{ type: "strong" }] }
          ]
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: `Status: ${project.status || "Active"} | Priority: ${project.priority || "Medium"} | Business Unit: ${project.businessUnitId || "N/A"}` }
          ]
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: `Budget: ${project.budgetUnit || "$"}${project.budgetTotal || "0"} (Spent: ${project.budgetUnit || "$"}${project.budgetSpent || "0"})` }
          ]
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: project.description || "No description provided." }
          ]
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: `Synced at: ${new Date().toISOString()}`, marks: [{ type: "em" }] }
          ]
        }
      ]
    };
  }

  private mapPriorityToJira(priority: string | null): string {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "Highest";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "Medium";
    }
  }

  // ============================================================================
  // OPENPROJECT SYNC
  // ============================================================================

  /**
   * Sync projects to OpenProject as Work Packages
   */
  async syncToOpenProject(projectIdentifier?: string): Promise<ExternalSyncResult> {
    if (!this.openProjectService) {
      throw new Error("OpenProject service not configured");
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const externalIds: Record<string, string> = {};
    let created = 0;
    let updated = 0;

    try {
      const allProjects = await db.select().from(projects);
      console.log(`[ExternalSync] Syncing ${allProjects.length} projects to OpenProject...`);

      const opProjectId = projectIdentifier || process.env.OPENPROJECT_PROJECT_ID || "demo";

      for (const project of allProjects) {
        try {
          const existingId = this.getExternalId("openproject", project.id);

          if (existingId) {
            // Update existing work package
            await this.openProjectService.updateWorkPackage(parseInt(existingId), {
              subject: project.name,
              description: { raw: project.description || "" },
              percentageDone: project.progress || 0,
            });
            updated++;
            externalIds[project.id] = existingId;
          } else {
            // Create new work package
            const result = await this.openProjectService.createWorkPackage(opProjectId, {
              subject: project.name,
              description: { raw: this.formatOpenProjectDescription(project) },
              type: "1", // Usually "Task" or "Feature" - depends on config
              priority: this.mapPriorityToOpenProject(project.priority),
              startDate: project.startDate?.toISOString().split("T")[0],
              dueDate: project.endDate?.toISOString().split("T")[0],
            });
            created++;
            externalIds[project.id] = String(result.id);
            this.setExternalId("openproject", project.id, String(result.id));
          }

          // Sync features as child work packages
          const projectFeatures = await db
            .select()
            .from(features)
            .where(eq(features.projectId, project.id));

          for (const feature of projectFeatures) {
            try {
              const featureId = this.getExternalId("openproject", feature.id);

              if (featureId) {
                await this.openProjectService.updateWorkPackage(parseInt(featureId), {
                  subject: feature.name,
                  description: { raw: feature.description || "" },
                });
                updated++;
              } else {
                const result = await this.openProjectService.createWorkPackage(opProjectId, {
                  subject: feature.name,
                  description: { raw: feature.description || "" },
                  type: "2", // Feature type
                });
                created++;
                externalIds[feature.id] = String(result.id);
                this.setExternalId("openproject", feature.id, String(result.id));
              }
            } catch (error: any) {
              errors.push(`Feature ${feature.id}: ${error.message}`);
            }
          }
        } catch (error: any) {
          errors.push(`Project ${project.id}: ${error.message}`);
        }
      }

      return {
        system: "openproject",
        total: allProjects.length,
        created,
        updated,
        failed: errors.length,
        errors,
        duration: Date.now() - startTime,
        externalIds,
      };
    } catch (error: any) {
      return {
        system: "openproject",
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [error.message],
        duration: Date.now() - startTime,
        externalIds,
      };
    }
  }

  private formatOpenProjectDescription(project: any): string {
    return `
Project synced from Nexus PPM

**Status:** ${project.status || "Active"}
**Priority:** ${project.priority || "Medium"}
**Business Unit:** ${project.businessUnitId || "N/A"}

**Budget:**
- Total: ${project.budgetUnit || "$"}${project.budgetTotal || "0"}
- Spent: ${project.budgetUnit || "$"}${project.budgetSpent || "0"}

**SAFe Metrics:**
- Stage: ${project.safeStage || "Funnel"}
- Current PI: ${project.currentPi || "N/A"}

${project.description || ""}

---
Synced at: ${new Date().toISOString()}
    `.trim();
  }

  private mapPriorityToOpenProject(priority: string | null): string {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "7"; // Immediate
      case "high":
        return "8"; // High
      case "medium":
        return "9"; // Normal
      case "low":
        return "10"; // Low
      default:
        return "9";
    }
  }

  // ============================================================================
  // MONDAY.COM SYNC
  // ============================================================================

  /**
   * Sync projects to Monday.com as board items
   */
  async syncToMonday(boardId?: string): Promise<ExternalSyncResult> {
    if (!this.mondayService) {
      throw new Error("Monday.com service not configured");
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const externalIds: Record<string, string> = {};
    let created = 0;
    let updated = 0;

    try {
      const allProjects = await db.select().from(projects);
      console.log(`[ExternalSync] Syncing ${allProjects.length} projects to Monday.com...`);

      const mondayBoardId = boardId || process.env.MONDAY_BOARD_ID;
      if (!mondayBoardId) {
        throw new Error("MONDAY_BOARD_ID not configured");
      }

      for (const project of allProjects) {
        try {
          const existingId = this.getExternalId("monday", project.id);

          // Column values for Monday.com
          // Status column uses index: 0=Working on it, 1=Done, 2=Stuck
          const statusIndex = this.mapStatusToMondayIndex(project.status);

          if (existingId) {
            // Update existing item
            await this.mondayService.updateItem(existingId, {
              status: { index: statusIndex },
            });
            updated++;
            externalIds[project.id] = existingId;
          } else {
            // Create new item - pass values that MondayService will stringify
            // Status needs index format, text is just a string
            const result = await this.mondayService.createItem({
              name: project.name,
              board_id: mondayBoardId,
              column_values: [
                { id: "status", value: { index: statusIndex } },
              ],
            });
            created++;
            externalIds[project.id] = result.id;
            this.setExternalId("monday", project.id, result.id);
          }
        } catch (error: any) {
          errors.push(`Project ${project.id}: ${error.message}`);
        }
      }

      return {
        system: "monday",
        total: allProjects.length,
        created,
        updated,
        failed: errors.length,
        errors,
        duration: Date.now() - startTime,
        externalIds,
      };
    } catch (error: any) {
      return {
        system: "monday",
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [error.message],
        duration: Date.now() - startTime,
        externalIds,
      };
    }
  }

  private mapStatusToMonday(status: string | null): string {
    switch (status?.toLowerCase()) {
      case "green":
      case "active":
        return "Working on it";
      case "amber":
      case "at-risk":
        return "Stuck";
      case "red":
      case "blocked":
        return "Stuck";
      case "done":
      case "completed":
        return "Done";
      default:
        return "Working on it";
    }
  }

  private mapStatusToMondayIndex(status: string | null): number {
    // Monday.com status column uses index values: 0=Working on it, 1=Done, 2=Stuck
    switch (status?.toLowerCase()) {
      case "done":
      case "completed":
        return 1; // Done
      case "amber":
      case "at-risk":
      case "red":
      case "blocked":
        return 2; // Stuck
      case "green":
      case "active":
      default:
        return 0; // Working on it
    }
  }

  private mapPriorityToMonday(priority: string | null): string {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "Critical";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "Medium";
    }
  }

  // ============================================================================
  // EXTERNAL ID MANAGEMENT
  // ============================================================================

  private getExternalId(system: string, localId: string): string | undefined {
    const systemMap = this.externalIdMap.get(system);
    return systemMap?.[localId];
  }

  private setExternalId(system: string, localId: string, externalId: string): void {
    if (!this.externalIdMap.has(system)) {
      this.externalIdMap.set(system, {});
    }
    this.externalIdMap.get(system)![localId] = externalId;
  }

  /**
   * Load external ID mappings from database
   * In a real implementation, these would be stored in a mapping table
   */
  async loadExternalIdMappings(): Promise<void> {
    // TODO: Load from external_id_mappings table
    console.log("[ExternalSync] External ID mappings loaded (placeholder)");
  }

  /**
   * Save external ID mappings to database
   */
  async saveExternalIdMappings(): Promise<void> {
    // TODO: Save to external_id_mappings table
    console.log("[ExternalSync] External ID mappings saved (placeholder)");
  }
}

// Singleton instance
let syncInstance: PostgresToExternalSync | null = null;

export function getPostgresToExternalSync(): PostgresToExternalSync {
  if (!syncInstance) {
    syncInstance = new PostgresToExternalSync();
  }
  return syncInstance;
}
