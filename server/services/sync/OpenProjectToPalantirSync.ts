/**
 * OpenProject → Palantir Sync
 *
 * Maps OpenProject entities to SAFe 6.0 ontology objects and pushes to Palantir Foundry.
 * Triggered by:
 * - OP webhooks (real-time)
 * - Scheduled catch-up (every 5 minutes)
 *
 * Entity mapping follows the SAFe hierarchy:
 * - OP Project → AtlasProject / AtlasDivision (depending on hierarchy level)
 * - OP WP (by type) → AtlasEpic / AtlasFeature / AtlasStory / AtlasTask / AtlasRisk
 * - OP Version → PI/Sprint mapping
 * - OP Relation → AtlasDependency
 * - OP Time Entry → EVM data on AtlasProject
 * - OP Budget → AtlasBudget
 */

import { getOpenProjectClient } from '../openproject/OpenProjectClient.js';
import { PALANTIR_ACTIONS, PALANTIR_OBJECT_TYPES } from '../../constants/palantirOntology.js';
import type { OPWorkPackage, OPProject, OPVersion, OPRelation, OPTimeEntry } from '../openproject/types.js';
import { pushResourceFromAssignee, pushMilestoneFromWorkItem, isMilestoneLike } from './SyncOntologyMappers.js';

// ============================================================================
// SAFe type mapping: OP WP type name → Palantir object type + action
// ============================================================================

const WP_TYPE_TO_ONTOLOGY: Record<string, { objectType: string; action: string }> = {
  'Epic':            { objectType: 'AtlasProject', action: PALANTIR_ACTIONS.CREATE_PROJECT },
  'Capability':      { objectType: 'AtlasFeature', action: PALANTIR_ACTIONS.CREATE_FEATURE },
  'Feature':         { objectType: 'AtlasFeature', action: PALANTIR_ACTIONS.CREATE_FEATURE },
  'User Story':      { objectType: 'AtlasStory',   action: PALANTIR_ACTIONS.CREATE_STORY },
  'Task':            { objectType: 'AtlasTask',    action: PALANTIR_ACTIONS.CREATE_TASK },
  'Risk':            { objectType: 'AtlasRisk',    action: PALANTIR_ACTIONS.CREATE_RISK },
  'Agent Alert':     { objectType: 'AtlasInsight', action: PALANTIR_ACTIONS.CREATE_INSIGHT },
  'Governance Gate': { objectType: 'AtlasProject', action: PALANTIR_ACTIONS.CREATE_PROJECT },
  'Demand Request':  { objectType: 'AtlasProject', action: PALANTIR_ACTIONS.CREATE_PROJECT },
  'Change Request':  { objectType: 'AtlasProject', action: PALANTIR_ACTIONS.CREATE_PROJECT },
  // Default OpenProject types
  'Phase':           { objectType: 'AtlasProject', action: PALANTIR_ACTIONS.CREATE_PROJECT },
  'Milestone':       { objectType: 'AtlasProject', action: PALANTIR_ACTIONS.CREATE_PROJECT },
  'Bug':             { objectType: 'AtlasTask',    action: PALANTIR_ACTIONS.CREATE_TASK },
};

// ============================================================================
// Sync result tracking
// ============================================================================

export interface SyncResult {
  source: 'openproject';
  direction: 'op-to-palantir';
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
  syncedAt: Date;
  duration: number;
}

// ============================================================================
// Main Sync Service
// ============================================================================

export class OpenProjectToPalantirSync {
  private palantirService: any; // PalantirAIPService
  private lastSyncTimestamp: Date | null = null;

  constructor(palantirService: any) {
    this.palantirService = palantirService;
  }

  /**
   * Full sync — fetch all OP data and push to Palantir
   */
  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      source: 'openproject',
      direction: 'op-to-palantir',
      created: 0, updated: 0, skipped: 0, failed: 0,
      errors: [],
      syncedAt: new Date(),
      duration: 0,
    };

    try {
      const client = getOpenProjectClient();
      const conn = await client.testConnection();
      if (!conn.connected) {
        result.errors.push(`OpenProject not reachable: ${conn.error}`);
        result.duration = Date.now() - startTime;
        return result;
      }

      console.log(`[OPSync] Starting full sync from OpenProject ${conn.version}`);

      // 1. Sync projects → AtlasProject / AtlasDivision
      const projects = await client.listProjects();
      console.log(`[OPSync] Syncing ${projects.length} projects`);
      for (const project of projects) {
        try {
          await this.syncProject(project);
          result.updated++;
        } catch (err: any) {
          result.failed++;
          result.errors.push(`Project ${project.identifier}: ${err.message}`);
        }
      }

      // 2. Sync work packages → AtlasEpic / AtlasFeature / AtlasStory / AtlasTask / AtlasRisk
      const workPackages = await client.listWorkPackages({ pageSize: 200 });
      console.log(`[OPSync] Syncing ${workPackages.length} work packages`);
      for (const wp of workPackages) {
        try {
          await this.syncWorkPackage(wp);
          result.updated++;
        } catch (err: any) {
          result.failed++;
          result.errors.push(`WP ${wp.id} (${wp.subject}): ${err.message}`);
        }
      }

      // 3. Sync versions → PI/Sprint data
      for (const project of projects) {
        try {
          const versions = await client.listVersions(project.id);
          for (const version of versions) {
            await this.syncVersion(version, project);
            result.updated++;
          }
        } catch (err: any) {
          result.errors.push(`Versions for ${project.identifier}: ${err.message}`);
        }
      }

      this.lastSyncTimestamp = new Date();
      result.duration = Date.now() - startTime;
      console.log(`[OPSync] Sync complete: ${result.updated} updated, ${result.failed} failed in ${result.duration}ms`);

    } catch (err: any) {
      result.errors.push(`Sync failed: ${err.message}`);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Incremental sync — only items changed since last sync
   */
  async syncIncremental(): Promise<SyncResult> {
    if (!this.lastSyncTimestamp) {
      return this.syncAll();
    }

    const startTime = Date.now();
    const result: SyncResult = {
      source: 'openproject',
      direction: 'op-to-palantir',
      created: 0, updated: 0, skipped: 0, failed: 0,
      errors: [],
      syncedAt: new Date(),
      duration: 0,
    };

    try {
      const client = getOpenProjectClient();
      const since = this.lastSyncTimestamp.toISOString();

      // Fetch only recently updated work packages
      const workPackages = await client.listWorkPackages({
        filters: { updatedAt: { operator: '>t-', values: ['5'] } }, // last 5 minutes
      });

      console.log(`[OPSync] Incremental: ${workPackages.length} changed work packages`);

      for (const wp of workPackages) {
        try {
          await this.syncWorkPackage(wp);
          result.updated++;
        } catch (err: any) {
          result.failed++;
          result.errors.push(`WP ${wp.id}: ${err.message}`);
        }
      }

      this.lastSyncTimestamp = new Date();
      result.duration = Date.now() - startTime;

    } catch (err: any) {
      result.errors.push(`Incremental sync failed: ${err.message}`);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Sync a single work package (called by webhook handler)
   */
  async syncSingleWorkPackage(wpId: number): Promise<void> {
    const client = getOpenProjectClient();
    const wp = await client.getWorkPackage(wpId);
    await this.syncWorkPackage(wp);
  }

  // --------------------------------------------------------------------------
  // Entity mappers
  // --------------------------------------------------------------------------

  private async syncProject(project: OPProject): Promise<void> {
    if (!this.palantirService) return;

    const properties: Record<string, any> = {
      id: `op-project-${project.id}`,
      name: project.name,
      description: project.description?.raw || '',
      status: project.active ? 'active' : 'inactive',
      source: 'openproject',
      syncedAt: new Date().toISOString(),
    };

    // Determine if this is a portfolio/VS/ART based on hierarchy
    const parentHref = project._links?.parent?.href;
    if (!parentHref) {
      // Top-level = Portfolio
      properties.safeStage = 'implementing';
    }

    await this.pushToPalantir(PALANTIR_ACTIONS.CREATE_PROJECT, properties);
  }

  private async syncWorkPackage(wp: OPWorkPackage): Promise<void> {
    if (!this.palantirService) return;

    // Resolve WP type name from _links
    const typeName = wp._links?.type?.title || 'Task';
    const mapping = WP_TYPE_TO_ONTOLOGY[typeName] || WP_TYPE_TO_ONTOLOGY['Task'];

    // Build properties based on target ontology type
    const properties: Record<string, any> = {
      id: `op-wp-${wp.id}`,
      name: wp.subject,
      description: wp.description?.raw || '',
      status: wp._links?.status?.title || 'New',
      priority: wp._links?.priority?.title || 'Normal',
      source: 'openproject',
      syncedAt: new Date().toISOString(),
    };

    // Add project reference
    if (wp._links?.project) {
      properties.projectId = `op-project-${wp._links.project.href?.split('/').pop()}`;
    }

    // Add dates
    if (wp.startDate) properties.startDate = wp.startDate;
    if (wp.dueDate) properties.endDate = wp.dueDate;

    // Add progress
    if (wp.percentageDone !== undefined) {
      properties.progress = wp.percentageDone;
    }

    // Add estimated/spent time
    if (wp.estimatedTime) properties.estimatedHours = parseISODuration(wp.estimatedTime);
    if (wp.spentTime) properties.actualHours = parseISODuration(wp.spentTime);

    // Type-specific fields
    if (mapping.objectType === 'AtlasFeature') {
      properties.featureId = `op-wp-${wp.id}`;
      if (wp.customField1) properties.wsjfScore = wp.customField1; // custom field mapping
    } else if (mapping.objectType === 'AtlasStory') {
      properties.storyId = `op-wp-${wp.id}`;
      if (wp._links?.assignee) properties.assignee = wp._links.assignee.title;
    } else if (mapping.objectType === 'AtlasTask') {
      properties.taskId = `op-wp-${wp.id}`;
      if (wp._links?.assignee) properties.assignee = wp._links.assignee.title;
    } else if (mapping.objectType === 'AtlasRisk') {
      properties.severity = wp._links?.priority?.title || 'medium';
      // Custom fields for risk probability/impact
    }

    // Sync source deduplication marker
    const syncSource = wp[`customField_sync_source`] || 'openproject';
    if (syncSource === 'nextera-agent') {
      // This WP was created by our agent — don't sync back to avoid loops
      return;
    }

    await this.pushToPalantir(mapping.action, properties);

    // Backfill resource & milestone rows so cross-portfolio agents see them
    const projectIdForChildren = properties.projectId || `op-wp-${wp.id}`;
    const assigneeName = wp._links?.assignee?.title;
    if (assigneeName) {
      await pushResourceFromAssignee(this.palantirService, {
        source: 'openproject',
        projectId: projectIdForChildren,
        name: assigneeName,
        role: typeName === 'User Story' || typeName === 'Task' ? 'Engineer' : typeName,
        externalId: String(wp.id),
        startDate: wp.startDate || null,
        endDate: wp.dueDate || null,
      });
    }
    if (isMilestoneLike(typeName, wp.subject)) {
      const isDone = (wp._links?.status?.title || '').toLowerCase().includes('closed') ||
                     (wp.percentageDone || 0) >= 100;
      await pushMilestoneFromWorkItem(this.palantirService, {
        source: 'openproject',
        projectId: projectIdForChildren,
        name: wp.subject,
        status: isDone ? 'completed' : 'planned',
        dueDate: wp.dueDate || null,
        completedDate: isDone ? (wp.dueDate || null) : null,
        owner: assigneeName || '',
        type: typeName.toLowerCase(),
        externalId: String(wp.id),
      });
    }
  }

  private async syncVersion(version: OPVersion, project: OPProject): Promise<void> {
    if (!this.palantirService) return;

    // Versions map to PIs or Sprints depending on naming convention
    const isPI = version.name.toLowerCase().includes('pi') ||
                 version.name.toLowerCase().includes('program increment');

    const properties: Record<string, any> = {
      id: `op-version-${version.id}`,
      name: version.name,
      description: version.description?.raw || '',
      status: version.status,
      startDate: version.startDate,
      endDate: version.endDate,
      projectId: `op-project-${project.id}`,
      type: isPI ? 'program-increment' : 'sprint',
      source: 'openproject',
      syncedAt: new Date().toISOString(),
    };

    await this.pushToPalantir(PALANTIR_ACTIONS.CREATE_PROJECT, properties);
  }

  // --------------------------------------------------------------------------
  // Palantir push
  // --------------------------------------------------------------------------

  private async pushToPalantir(action: string, properties: Record<string, any>): Promise<void> {
    if (!this.palantirService) {
      console.log(`[OPSync] Palantir not initialized, skipping push for ${properties.id}`);
      return;
    }

    try {
      await this.palantirService.executeAction(action, properties);
    } catch (err: any) {
      // Log but don't throw — allow sync to continue for other items
      console.warn(`[OPSync] Palantir push failed for ${properties.id}: ${err.message}`);
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

/** Parse ISO 8601 duration (PT2H30M) to hours */
function parseISODuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours + minutes / 60;
}

// ============================================================================
// Singleton
// ============================================================================

let syncInstance: OpenProjectToPalantirSync | null = null;

export function getOPToPalantirSync(palantirService?: any): OpenProjectToPalantirSync {
  if (!syncInstance && palantirService) {
    syncInstance = new OpenProjectToPalantirSync(palantirService);
  }
  if (!syncInstance) {
    syncInstance = new OpenProjectToPalantirSync(null);
  }
  return syncInstance;
}

export default OpenProjectToPalantirSync;
