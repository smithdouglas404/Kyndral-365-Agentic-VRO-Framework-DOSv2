/**
 * PALANTIR SYNC SERVICE
 *
 * Syncs data from external systems (Jira, OpenProject, Monday.com) TO Palantir Foundry.
 * This is the key component for ontology-first architecture where Palantir is the source of truth.
 *
 * Flow:
 * 1. Fetch data from external system (Jira, OpenProject, Monday)
 * 2. Map to Palantir ontology object types
 * 3. Push to Palantir via Actions/Object creation
 * 4. Record sync status
 *
 * The app then reads ALL data from Palantir, not from external systems directly.
 */

import { PalantirAIPService, PalantirSearchFilter } from '../mcp/PalantirAIPService';
import { OntologySchemaService } from './OntologySchemaService';
import { PALANTIR_ACTIONS, PALANTIR_OBJECT_TYPES } from '../constants/palantirOntology.js';
import { db } from '../db';
import { integrations, projects, syncLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// VALIDATION & SAFE PARSING UTILITIES
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
 * Validate a URL string
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate required string field
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate ISO date string
 */
function isValidISODate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true; // null/undefined dates are OK
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Safely get nested property from object
 */
function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = current[key];
  }
  return current === undefined || current === null ? defaultValue : current;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validate external system configuration
 */
function validateExternalConfig(
  config: Record<string, any>,
  type: 'jira' | 'openproject' | 'monday'
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (type === 'jira') {
    if (!isNonEmptyString(config.baseUrl)) {
      errors.push({ field: 'baseUrl', message: 'Base URL is required' });
    } else if (!isValidUrl(config.baseUrl)) {
      errors.push({ field: 'baseUrl', message: 'Invalid URL format', value: config.baseUrl });
    }
    if (!isNonEmptyString(config.email)) {
      errors.push({ field: 'email', message: 'Email is required' });
    }
    if (!isNonEmptyString(config.apiToken)) {
      errors.push({ field: 'apiToken', message: 'API token is required' });
    }
  } else if (type === 'openproject') {
    if (!isNonEmptyString(config.baseUrl)) {
      errors.push({ field: 'baseUrl', message: 'Base URL is required' });
    } else if (!isValidUrl(config.baseUrl)) {
      errors.push({ field: 'baseUrl', message: 'Invalid URL format', value: config.baseUrl });
    }
    if (!isNonEmptyString(config.apiToken)) {
      errors.push({ field: 'apiToken', message: 'API token is required' });
    }
  } else if (type === 'monday') {
    if (!isNonEmptyString(config.apiToken)) {
      errors.push({ field: 'apiToken', message: 'API token is required' });
    }
    if (!isNonEmptyString(config.boardId)) {
      errors.push({ field: 'boardId', message: 'Board ID is required' });
    }
  }

  return errors;
}

export interface SyncResult {
  source: string;
  objectType: string;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  syncedAt: Date;
}

export interface ExternalSystemConfig {
  type: 'jira' | 'openproject' | 'monday';
  baseUrl: string;
  apiToken: string;
  // Jira specific
  projectKey?: string;
  jql?: string;
  // OpenProject specific
  projectId?: number;
  // Monday specific
  boardId?: string;
}

// Object type mappings for each source
const SOURCE_TO_ONTOLOGY: Record<string, Record<string, string>> = {
  jira: {
    issue: 'AtlasProject', // Jira issues map to projects/work items
    project: 'AtlasPortfolio',
    sprint: 'AtlasSprint',
    epic: 'AtlasEpic',
    risk: 'AtlasRisk',
  },
  openproject: {
    work_package: 'AtlasProject',
    project: 'AtlasPortfolio',
    risk: 'AtlasRisk',
    meeting: 'AtlasMeeting',
  },
  monday: {
    item: 'AtlasProject',
    board: 'AtlasPortfolio',
    update: 'AtlasInsight',
  },
};

class PalantirSyncServiceClass {
  private palantirService: PalantirAIPService | null = null;
  private syncInProgress = new Map<string, boolean>();

  /**
   * Initialize with Palantir service
   */
  initialize(palantirService: PalantirAIPService): void {
    this.palantirService = palantirService;
    console.log('[PalantirSync] Service initialized');
  }

  /**
   * Sync data from Jira to Palantir
   */
  async syncFromJira(config: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey?: string;
    jql?: string;
  }): Promise<SyncResult> {
    // Validate configuration first
    const validationErrors = validateExternalConfig(config, 'jira');
    if (validationErrors.length > 0) {
      return {
        source: 'jira',
        objectType: 'AtlasProject',
        created: 0,
        updated: 0,
        failed: 0,
        errors: validationErrors.map(e => `Validation: ${e.field} - ${e.message}`),
        syncedAt: new Date(),
      };
    }

    const syncKey = `jira:${config.projectKey || 'all'}`;
    if (this.syncInProgress.get(syncKey)) {
      throw new Error('Sync already in progress for this source');
    }

    this.syncInProgress.set(syncKey, true);
    const result: SyncResult = {
      source: 'jira',
      objectType: 'AtlasProject',
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      syncedAt: new Date(),
    };

    try {
      console.log(`[PalantirSync] Starting Jira sync from ${config.baseUrl}`);

      // Fetch issues from Jira
      const jql = config.jql || (config.projectKey ? `project = ${config.projectKey}` : 'order by created DESC');
      const issues = await this.fetchJiraIssues(config.baseUrl, config.email, config.apiToken, jql);

      console.log(`[PalantirSync] Fetched ${issues.length} issues from Jira`);

      // Transform and push each issue to Palantir
      for (const issue of issues) {
        try {
          const ontologyObject = this.mapJiraToOntology(issue);
          await this.upsertToPalantir('AtlasProject', ontologyObject);

          // Check if exists to determine created vs updated
          const existing = await this.findInPalantir('AtlasProject', issue.key);
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (err: any) {
          result.failed++;
          result.errors.push(`Issue ${issue.key}: ${err.message}`);
        }
      }

      // Log sync result
      await this.logSync('jira', 'AtlasProject', result);

    } finally {
      this.syncInProgress.set(syncKey, false);
    }

    return result;
  }

  /**
   * Sync data from OpenProject to Palantir
   */
  async syncFromOpenProject(config: {
    baseUrl: string;
    apiToken: string;
    projectId?: number;
  }): Promise<SyncResult> {
    // Validate configuration first
    const validationErrors = validateExternalConfig(config, 'openproject');
    if (validationErrors.length > 0) {
      return {
        source: 'openproject',
        objectType: 'AtlasProject',
        created: 0,
        updated: 0,
        failed: 0,
        errors: validationErrors.map(e => `Validation: ${e.field} - ${e.message}`),
        syncedAt: new Date(),
      };
    }

    const syncKey = `openproject:${config.projectId || 'all'}`;
    if (this.syncInProgress.get(syncKey)) {
      throw new Error('Sync already in progress for this source');
    }

    this.syncInProgress.set(syncKey, true);
    const result: SyncResult = {
      source: 'openproject',
      objectType: 'AtlasProject',
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      syncedAt: new Date(),
    };

    try {
      console.log(`[PalantirSync] Starting OpenProject sync from ${config.baseUrl}`);

      // Fetch work packages from OpenProject
      const workPackages = await this.fetchOpenProjectWorkPackages(
        config.baseUrl,
        config.apiToken,
        config.projectId
      );

      console.log(`[PalantirSync] Fetched ${workPackages.length} work packages from OpenProject`);

      // Transform and push each work package to Palantir + broadcast facts to agents
      for (const wp of workPackages) {
        try {
          const ontologyObject = this.mapOpenProjectToOntology(wp);
          await this.upsertToPalantir('AtlasProject', ontologyObject);

          const existing = await this.findInPalantir('AtlasProject', `op-${wp.id}`);
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }

          // Broadcast facts to Mem0 so subscribed agents get notified
          try {
            const { getMem0Service } = await import('../lib/Mem0Service.js');
            const mem0 = getMem0Service();
            if (mem0) {
              const entity = `project_op-${wp.id}`;
              // Schedule variance: if dueDate exists, compute days from today
              if (wp.dueDate) {
                const daysUntilDue = Math.floor((new Date(wp.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilDue < 0) {
                  await mem0.writeFact(entity, 'schedule_variance', daysUntilDue, 'openproject-sync', 0.9);
                }
              }
              // Health score from percentage done
              if (wp.percentageDone !== undefined) {
                await mem0.writeFact(entity, 'progress', wp.percentageDone, 'openproject-sync', 0.9);
              }
              // Status changes
              const status = wp._links?.status?.title;
              if (status) {
                await mem0.writeFact(entity, 'status', status, 'openproject-sync', 0.9);
              }
            }
          } catch (factErr: any) {
            // Don't fail sync if fact broadcast fails
            console.warn(`[PalantirSync] Fact broadcast failed for WP ${wp.id}: ${factErr.message}`);
          }
        } catch (err: any) {
          result.failed++;
          result.errors.push(`WP ${wp.id}: ${err.message}`);
        }
      }

      await this.logSync('openproject', 'AtlasProject', result);

    } finally {
      this.syncInProgress.set(syncKey, false);
    }

    return result;
  }

  /**
   * Sync data from Monday.com to Palantir
   */
  async syncFromMonday(config: {
    apiToken: string;
    boardId: string;
  }): Promise<SyncResult> {
    // Validate configuration first
    const validationErrors = validateExternalConfig(config, 'monday');
    if (validationErrors.length > 0) {
      return {
        source: 'monday',
        objectType: 'AtlasProject',
        created: 0,
        updated: 0,
        failed: 0,
        errors: validationErrors.map(e => `Validation: ${e.field} - ${e.message}`),
        syncedAt: new Date(),
      };
    }

    const syncKey = `monday:${config.boardId}`;
    if (this.syncInProgress.get(syncKey)) {
      throw new Error('Sync already in progress for this source');
    }

    this.syncInProgress.set(syncKey, true);
    const result: SyncResult = {
      source: 'monday',
      objectType: 'AtlasProject',
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      syncedAt: new Date(),
    };

    try {
      console.log(`[PalantirSync] Starting Monday.com sync for board ${config.boardId}`);

      // Fetch items from Monday.com
      const items = await this.fetchMondayItems(config.apiToken, config.boardId);

      console.log(`[PalantirSync] Fetched ${items.length} items from Monday.com`);

      // Transform and push each item to Palantir
      for (const item of items) {
        try {
          const ontologyObject = this.mapMondayToOntology(item, config.boardId);
          await this.upsertToPalantir('AtlasProject', ontologyObject);

          const existing = await this.findInPalantir('AtlasProject', `monday-${item.id}`);
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (err: any) {
          result.failed++;
          result.errors.push(`Item ${item.id}: ${err.message}`);
        }
      }

      await this.logSync('monday', 'AtlasProject', result);

    } finally {
      this.syncInProgress.set(syncKey, false);
    }

    return result;
  }

  /**
   * Sync all configured integrations to Palantir
   */
  async syncAllIntegrations(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Get all enabled integrations from database
    const enabledIntegrations = await db
      .select()
      .from(integrations)
      .where(eq(integrations.enabled, true));

    for (const integration of enabledIntegrations) {
      const config = integration.connectionConfig as Record<string, any>;

      try {
        let result: SyncResult;

        switch (integration.type) {
          case 'jira':
            result = await this.syncFromJira({
              baseUrl: config.baseUrl,
              email: config.email,
              apiToken: config.apiToken,
              projectKey: config.projectKey,
            });
            break;

          case 'openproject':
            result = await this.syncFromOpenProject({
              baseUrl: config.baseUrl,
              apiToken: config.apiToken,
              projectId: config.projectId,
            });
            break;

          case 'monday':
            result = await this.syncFromMonday({
              apiToken: config.apiToken,
              boardId: config.boardId,
            });
            break;

          default:
            console.log(`[PalantirSync] Unsupported integration type: ${integration.type}`);
            continue;
        }

        results.push(result);
      } catch (err: any) {
        console.error(`[PalantirSync] Failed to sync ${integration.name}: ${err.message}`);
        results.push({
          source: integration.type,
          objectType: 'AtlasProject',
          created: 0,
          updated: 0,
          failed: 1,
          errors: [err.message],
          syncedAt: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Get sync status for a source
   */
  isSyncing(source: string): boolean {
    for (const [key, value] of this.syncInProgress.entries()) {
      if (key.startsWith(source) && value) {
        return true;
      }
    }
    return false;
  }

  // Private: Fetch from external systems

  private async fetchJiraIssues(
    baseUrl: string,
    email: string,
    apiToken: string,
    jql: string
  ): Promise<any[]> {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    // Use new Jira API endpoint (old /rest/api/3/search was deprecated)
    const url = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.issues || [];
  }

  private async fetchOpenProjectWorkPackages(
    baseUrl: string,
    apiToken: string,
    projectId?: number
  ): Promise<any[]> {
    const url = projectId
      ? `${baseUrl}/api/v3/projects/${projectId}/work_packages?pageSize=100`
      : `${baseUrl}/api/v3/work_packages?pageSize=100`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`apikey:${apiToken}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenProject API error: ${response.status}`);
    }

    const data = await response.json();
    return data._embedded?.elements || [];
  }

  private async fetchMondayItems(apiToken: string, boardId: string): Promise<any[]> {
    const query = `
      query {
        boards(ids: [${boardId}]) {
          items_page(limit: 100) {
            items {
              id
              name
              state
              column_values {
                id
                text
                value
              }
              created_at
              updated_at
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Monday.com API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.boards?.[0]?.items_page?.items || [];
  }

  // Private: Map to ontology

  private mapJiraToOntology(issue: any): Record<string, any> {
    if (!issue || typeof issue !== 'object') {
      throw new Error('Invalid Jira issue object');
    }

    const fields = issue.fields || {};
    const issueKey = issue.key || issue.id || 'unknown';

    // Safely extract description from Jira's Atlassian Document Format or plain text
    let description = '';
    if (fields.description) {
      if (typeof fields.description === 'string') {
        description = fields.description;
      } else if (fields.description?.content) {
        // ADF format - extract text from first paragraph
        description = safeGet(fields.description, 'content.0.content.0.text', '');
      }
    }

    // Validate dates
    const created = isValidISODate(fields.created) ? fields.created : null;
    const updated = isValidISODate(fields.updated) ? fields.updated : null;
    const dueDate = isValidISODate(fields.duedate) ? fields.duedate : null;

    return {
      id: issueKey,
      sourceId: issueKey,
      source: 'jira',
      name: fields.summary || issueKey,
      description,
      status: safeGet(fields, 'status.name', 'Unknown'),
      priority: this.mapPriority(safeGet(fields, 'priority.name', undefined)),
      projectKey: safeGet(fields, 'project.key', null),
      assignee: safeGet(fields, 'assignee.displayName', null),
      reporter: safeGet(fields, 'reporter.displayName', null),
      created,
      updated,
      dueDate,
      issueType: safeGet(fields, 'issuetype.name', null),
      labels: Array.isArray(fields.labels) ? fields.labels : [],
      components: Array.isArray(fields.components)
        ? fields.components.map((c: any) => c?.name).filter(Boolean)
        : [],
      // Custom fields for budget/cost - use safe parsing
      estimatedCost: safeParseFloat(fields.customfield_10001, 0) || null,
      actualCost: safeParseFloat(fields.customfield_10002, 0) || null,
      storyPoints: safeParseInt(fields.customfield_10003, 0) || null,
      syncedAt: new Date().toISOString(),
    };
  }

  private mapOpenProjectToOntology(wp: any): Record<string, any> {
    if (!wp || typeof wp !== 'object') {
      throw new Error('Invalid OpenProject work package object');
    }

    const wpId = wp.id || 'unknown';

    // Extract project ID from href safely
    const projectHref = safeGet(wp, '_links.project.href', '');
    const projectId = projectHref ? projectHref.split('/').pop() : null;

    // Validate dates
    const createdAt = isValidISODate(wp.createdAt) ? wp.createdAt : null;
    const updatedAt = isValidISODate(wp.updatedAt) ? wp.updatedAt : null;
    const startDate = isValidISODate(wp.startDate) ? wp.startDate : null;
    const dueDate = isValidISODate(wp.dueDate) ? wp.dueDate : null;

    return {
      id: `op-${wpId}`,
      sourceId: String(wpId),
      source: 'openproject',
      name: wp.subject || `Work Package ${wpId}`,
      description: safeGet(wp, 'description.raw', ''),
      status: safeGet(wp, '_links.status.title', 'Unknown'),
      priority: this.mapPriority(safeGet(wp, '_links.priority.title', undefined)),
      projectId,
      assignee: safeGet(wp, '_links.assignee.title', null),
      responsible: safeGet(wp, '_links.responsible.title', null),
      created: createdAt,
      updated: updatedAt,
      startDate,
      dueDate,
      percentageDone: safeParseInt(wp.percentageDone, 0),
      estimatedTime: wp.estimatedTime || null,
      remainingTime: wp.remainingTime || null,
      type: safeGet(wp, '_links.type.title', null),
      syncedAt: new Date().toISOString(),
    };
  }

  private mapMondayToOntology(item: any, boardId: string): Record<string, any> {
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid Monday.com item object');
    }

    const itemId = item.id || 'unknown';
    const columnValues = Array.isArray(item.column_values) ? item.column_values : [];

    const getColumnValue = (id: string): string | null => {
      const col = columnValues.find((cv: any) => cv?.id === id);
      return col?.text || null;
    };

    // Validate dates
    const createdAt = isValidISODate(item.created_at) ? item.created_at : null;
    const updatedAt = isValidISODate(item.updated_at) ? item.updated_at : null;
    const dueDate = getColumnValue('date');
    const validDueDate = isValidISODate(dueDate) ? dueDate : null;

    // Build column values map safely
    const columnValuesMap: Record<string, string> = {};
    for (const cv of columnValues) {
      if (cv?.id && cv?.text !== undefined) {
        columnValuesMap[cv.id] = String(cv.text);
      }
    }

    return {
      id: `monday-${itemId}`,
      sourceId: String(itemId),
      source: 'monday',
      boardId,
      name: item.name || `Item ${itemId}`,
      status: getColumnValue('status') || item.state || 'Unknown',
      priority: this.mapPriority(getColumnValue('priority') || undefined),
      assignee: getColumnValue('person'),
      created: createdAt,
      updated: updatedAt,
      dueDate: validDueDate,
      columnValues: columnValuesMap,
      syncedAt: new Date().toISOString(),
    };
  }

  private mapPriority(priority: string | undefined): number {
    if (!priority) return 3;
    const lower = priority.toLowerCase();
    if (lower.includes('highest') || lower.includes('critical')) return 1;
    if (lower.includes('high')) return 2;
    if (lower.includes('medium') || lower.includes('normal')) return 3;
    if (lower.includes('low')) return 4;
    if (lower.includes('lowest')) return 5;
    return 3;
  }

  // Private: Palantir operations

  private async upsertToPalantir(objectType: string, data: Record<string, any>): Promise<void> {
    if (!this.palantirService) {
      throw new Error('Palantir service not initialized');
    }

    // Map objectType to the correct Palantir action from constants
    const actionMap: Record<string, string> = {
      'Project': PALANTIR_ACTIONS.CREATE_PROJECT,
      'AtlasProject': PALANTIR_ACTIONS.CREATE_PROJECT,
      'Risk': PALANTIR_ACTIONS.CREATE_RISK,
      'AtlasRisk': PALANTIR_ACTIONS.CREATE_RISK,
      'KPI': PALANTIR_ACTIONS.CREATE_KPI,
      'AtlasKpi': PALANTIR_ACTIONS.CREATE_KPI,
      'Objective': PALANTIR_ACTIONS.CREATE_OBJECTIVE,
      'OKR': PALANTIR_ACTIONS.CREATE_OBJECTIVE,
      'AtlasObjective': PALANTIR_ACTIONS.CREATE_OBJECTIVE,
      'Transformation': PALANTIR_ACTIONS.CREATE_TRANSFORMATION,
      'Division': PALANTIR_ACTIONS.CREATE_TRANSFORMATION,
      'AtlasTransformation': PALANTIR_ACTIONS.CREATE_TRANSFORMATION,
      'Insight': PALANTIR_ACTIONS.CREATE_INSIGHT,
      'Feature': PALANTIR_ACTIONS.CREATE_INSIGHT,
      'AtlasInsight': PALANTIR_ACTIONS.CREATE_INSIGHT,
      'Dependency': PALANTIR_ACTIONS.CREATE_DEPENDENCY,
      'AtlasDependency': PALANTIR_ACTIONS.CREATE_DEPENDENCY,
    };

    const actionName = actionMap[objectType];
    if (!actionName) {
      console.warn(`[PalantirSync] No action mapping for objectType: ${objectType}`);
      return;
    }

    const palantirParams = this.mapToActionParameters(objectType, actionName, data);

    try {
      await this.palantirService.applyAction(actionName, palantirParams);
      console.log(`[PalantirSync] ✓ Synced ${objectType} ${palantirParams.project_id || palantirParams.insight_id || data.id} to Palantir`);
    } catch (err: any) {
      console.error(`[PalantirSync] ✗ Failed to sync ${objectType}: ${err.message}`);
      throw err;
    }
  }

  private mapToActionParameters(objectType: string, actionName: string, data: Record<string, any>): Record<string, any> {
    const id = data.id || data.sourceId || `sync-${Date.now()}`;
    const source = data.source || 'unknown';

    if (actionName === PALANTIR_ACTIONS.CREATE_PROJECT || actionName === PALANTIR_ACTIONS.UPDATE_PROJECT) {
      return {
        project_id: data.project_id || id,
        name: data.name || `[${source}] Item ${id}`,
        status: data.status || 'Planning',
        description: data.description || `Synced from ${source}`,
        ...(data.priority !== undefined && { priority: String(data.priority) }),
        ...(data.assignee && { owner: data.assignee }),
        ...(data.dueDate && { end_date: data.dueDate }),
        ...(data.startDate && { start_date: data.startDate }),
      };
    }

    if (actionName === PALANTIR_ACTIONS.CREATE_RISK) {
      return {
        risk_id: data.risk_id || id,
        title: data.name || data.title || `Risk from ${source}`,
        status: data.status || 'New',
        ...(data.description && { description: data.description }),
        ...(data.severity && { severity: data.severity }),
        ...(data.probability && { probability: String(data.probability) }),
      };
    }

    if (actionName === PALANTIR_ACTIONS.CREATE_KPI) {
      return {
        kpi_id: data.kpi_id || id,
        name: data.name || `KPI from ${source}`,
        ...(data.value !== undefined && { current_value: String(data.value) }),
        ...(data.target !== undefined && { target_value: String(data.target) }),
      };
    }

    if (actionName === PALANTIR_ACTIONS.CREATE_OBJECTIVE) {
      return {
        objective_id: data.objective_id || id,
        title: data.name || data.title || `Objective from ${source}`,
        status: data.status || 'Draft',
        ...(data.description && { description: data.description }),
      };
    }

    if (actionName === PALANTIR_ACTIONS.CREATE_INSIGHT) {
      return {
        insight_id: data.insight_id || id,
        title: data.name || data.title || `Insight from ${source}`,
        status: data.status || 'New',
        insight_type: data.insight_type || data.type || 'Observation',
        ...(data.description && { description: data.description }),
      };
    }

    if (actionName === PALANTIR_ACTIONS.CREATE_TRANSFORMATION) {
      return {
        transformation_id: data.transformation_id || id,
        name: data.name || `Transformation from ${source}`,
        status: data.status || 'Planning',
        ...(data.description && { description: data.description }),
      };
    }

    if (actionName === PALANTIR_ACTIONS.CREATE_DEPENDENCY) {
      return {
        dependency_id: data.dependency_id || id,
        source_project_id: data.source_project_id || data.sourceProjectId || id,
        target_project_id: data.target_project_id || data.targetProjectId || id,
        dependency_type: data.dependency_type || data.type || 'blocks',
      };
    }

    return { ...data, project_id: data.project_id || id };
  }

  private async findInPalantir(objectType: string, id: string): Promise<any | null> {
    if (!this.palantirService) return null;

    try {
      return await this.palantirService.getObject(objectType, id);
    } catch {
      return null;
    }
  }

  private async storeLocally(objectType: string, data: Record<string, any>): Promise<void> {
    // Store synced data in ontology_entities table for tracking
    // Palantir is the source of truth, this just tracks what was synced
    try {
      const entityUri = `urn:atlas:${data.source}:${objectType.toLowerCase()}:${data.sourceId}`;

      // Check if entity already exists
      const existing = await db.execute(
        `SELECT id FROM ontology_entities WHERE entity_uri = '${entityUri}' LIMIT 1`
      );

      if (existing.rows && existing.rows.length > 0) {
        // Update existing
        await db.execute(`
          UPDATE ontology_entities
          SET metadata = '${JSON.stringify(data).replace(/'/g, "''")}',
              updated_at = NOW()
          WHERE entity_uri = '${entityUri}'
        `);
      } else {
        // Insert new
        await db.execute(`
          INSERT INTO ontology_entities (entity_uri, entity_type, external_system, external_id, metadata)
          VALUES ('${entityUri}', '${objectType}', '${data.source}', '${data.sourceId}', '${JSON.stringify(data).replace(/'/g, "''")}')
        `);
      }
    } catch (err: any) {
      // Don't fail the sync if local storage fails - Palantir is source of truth
      console.warn(`[PalantirSync] Local storage failed for ${objectType}/${data.sourceId}: ${err.message}`);
    }
  }

  private async logSync(source: string, objectType: string, result: SyncResult): Promise<void> {
    console.log(`[PalantirSync] ${source} -> ${objectType}: created=${result.created}, updated=${result.updated}, failed=${result.failed}`);

    // Could store in sync_logs table if it exists
    // For now, just console log
  }
}

// Singleton instance
export const PalantirSyncService = new PalantirSyncServiceClass();
