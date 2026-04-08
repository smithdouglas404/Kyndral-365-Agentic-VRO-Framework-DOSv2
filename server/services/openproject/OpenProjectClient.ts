/**
 * OpenProject Headless PPM Client
 *
 * Comprehensive APIv3 client for OpenProject running as a headless PPM backbone.
 * Extends the existing basic client with full coverage: budgets, time entries,
 * versions, relations, memberships, notifications, webhooks, custom fields,
 * meetings, and queries.
 *
 * Used by:
 * - Agents (read/write project data, create work packages, log time)
 * - Sync pipeline (bidirectional OP ↔ Palantir ↔ external tools)
 * - Webhook handler (event-driven updates)
 * - Bootstrap script (SAFe structure setup)
 */

import type {
  HALCollection,
  OPProject, OPCreateProject,
  OPWorkPackage, OPCreateWorkPackage,
  OPVersion, OPCreateVersion,
  OPRelation, OPCreateRelation,
  OPTimeEntry, OPCreateTimeEntry,
  OPBudget,
  OPMembership,
  OPActivity,
  OPNotification,
  OPWebhook,
  OPCustomField,
  OPMeeting, OPCreateMeeting,
  OPQuery,
  OPType, OPStatus, OPPriority,
  OPUser, OPGroup,
} from './types.js';

// ============================================================================
// Client Configuration
// ============================================================================

export interface OpenProjectClientConfig {
  baseUrl: string;   // e.g., "http://openproject:80" or "http://localhost:8080"
  apiKey: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

// ============================================================================
// Filter builder helper
// ============================================================================

function buildFilters(filters: Record<string, { operator: string; values: (string | number)[] }>): string {
  return JSON.stringify(
    Object.entries(filters).map(([key, { operator, values }]) => ({
      [key]: { operator, values: values.map(String) },
    }))
  );
}

// ============================================================================
// Main Client
// ============================================================================

export class OpenProjectClient {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: OpenProjectClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }

  // --------------------------------------------------------------------------
  // Core HTTP with retry + auth
  // --------------------------------------------------------------------------

  private async request<T = any>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}/api/v3${endpoint}`;
    const auth = Buffer.from(`apikey:${this.apiKey}`).toString('base64');

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/hal+json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Retry on 5xx or 429
          if ((response.status >= 500 || response.status === 429) && attempt < this.maxRetries) {
            const delay = this.retryDelayMs * Math.pow(2, attempt);
            console.warn(`[OpenProjectClient] ${method} ${endpoint} failed (${response.status}), retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw new Error(`OpenProject API ${method} ${endpoint} failed (${response.status}): ${errorText.substring(0, 500)}`);
        }

        // DELETE returns no content
        if (response.status === 204 || method === 'DELETE') return {} as T;

        return response.json() as Promise<T>;
      } catch (err: any) {
        if (attempt < this.maxRetries && err.code === 'ECONNREFUSED') {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          console.warn(`[OpenProjectClient] Connection refused, retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`[OpenProjectClient] Max retries exceeded for ${method} ${endpoint}`);
  }

  private async paginate<T>(endpoint: string, pageSize = 100): Promise<T[]> {
    const results: T[] = [];
    let offset = 1;

    while (true) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const data = await this.request<HALCollection<T>>('GET', `${endpoint}${separator}pageSize=${pageSize}&offset=${offset}`);
      const elements = data._embedded?.elements || [];
      results.push(...elements);

      if (results.length >= data.total || elements.length === 0) break;
      offset += pageSize;
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Connection test
  // --------------------------------------------------------------------------

  async testConnection(): Promise<{ connected: boolean; version?: string; instanceName?: string; error?: string }> {
    try {
      const data = await this.request('GET', '/');
      return { connected: true, version: data.coreVersion, instanceName: data.instanceName };
    } catch (err: any) {
      return { connected: false, error: err.message };
    }
  }

  // ==========================================================================
  // PROJECTS (SAFe Portfolio / Value Stream / ART)
  // ==========================================================================

  async listProjects(filters?: Record<string, { operator: string; values: (string | number)[] }>): Promise<OPProject[]> {
    let endpoint = '/projects';
    if (filters) endpoint += `?filters=${encodeURIComponent(buildFilters(filters))}`;
    return this.paginate<OPProject>(endpoint);
  }

  async getProject(id: string | number): Promise<OPProject> {
    return this.request<OPProject>('GET', `/projects/${id}`);
  }

  async createProject(project: OPCreateProject): Promise<OPProject> {
    const payload: any = {
      name: project.name,
      identifier: project.identifier,
      description: project.description,
      public: project.public ?? false,
    };
    if (project.parent) {
      payload._links = { parent: project.parent };
    }
    return this.request<OPProject>('POST', '/projects', payload);
  }

  async updateProject(id: string | number, updates: Partial<OPCreateProject>): Promise<OPProject> {
    return this.request<OPProject>('PATCH', `/projects/${id}`, updates);
  }

  async deleteProject(id: string | number): Promise<void> {
    await this.request('DELETE', `/projects/${id}`);
  }

  // ==========================================================================
  // WORK PACKAGES (SAFe Epic / Feature / Story / Task / Risk)
  // ==========================================================================

  async listWorkPackages(options?: {
    projectId?: string | number;
    filters?: Record<string, { operator: string; values: (string | number)[] }>;
    sortBy?: string;
    pageSize?: number;
  }): Promise<OPWorkPackage[]> {
    const base = options?.projectId
      ? `/projects/${options.projectId}/work_packages`
      : '/work_packages';

    const params = new URLSearchParams();
    if (options?.filters) params.set('filters', buildFilters(options.filters));
    if (options?.sortBy) params.set('sortBy', options.sortBy);

    const qs = params.toString();
    return this.paginate<OPWorkPackage>(qs ? `${base}?${qs}` : base, options?.pageSize);
  }

  async getWorkPackage(id: number): Promise<OPWorkPackage> {
    return this.request<OPWorkPackage>('GET', `/work_packages/${id}`);
  }

  async createWorkPackage(projectId: string | number, wp: OPCreateWorkPackage): Promise<OPWorkPackage> {
    return this.request<OPWorkPackage>('POST', `/projects/${projectId}/work_packages`, wp);
  }

  async updateWorkPackage(id: number, updates: Partial<OPCreateWorkPackage>): Promise<OPWorkPackage> {
    // Optimistic locking — get current lockVersion
    const current = await this.getWorkPackage(id);
    return this.request<OPWorkPackage>('PATCH', `/work_packages/${id}`, {
      lockVersion: current.lockVersion,
      ...updates,
    });
  }

  async deleteWorkPackage(id: number): Promise<void> {
    await this.request('DELETE', `/work_packages/${id}`);
  }

  /** Add a comment/journal entry to a work package (for agent notifications) */
  async addWorkPackageComment(id: number, comment: string): Promise<OPActivity> {
    return this.request<OPActivity>('POST', `/work_packages/${id}/activities`, {
      comment: { raw: comment },
    });
  }

  /** Get work package activities/journal (audit trail) */
  async getWorkPackageActivities(id: number): Promise<OPActivity[]> {
    const data = await this.request<HALCollection<OPActivity>>('GET', `/work_packages/${id}/activities`);
    return data._embedded?.elements || [];
  }

  /** Add a watcher to a work package */
  async addWatcher(workPackageId: number, userId: number): Promise<void> {
    await this.request('POST', `/work_packages/${workPackageId}/watchers`, {
      _links: { user: { href: `/api/v3/users/${userId}` } },
    });
  }

  // ==========================================================================
  // VERSIONS (SAFe PI / Sprint / Release)
  // ==========================================================================

  async listVersions(projectId: string | number): Promise<OPVersion[]> {
    return this.paginate<OPVersion>(`/projects/${projectId}/versions`);
  }

  async getVersion(id: number): Promise<OPVersion> {
    return this.request<OPVersion>('GET', `/versions/${id}`);
  }

  async createVersion(projectId: string | number, version: OPCreateVersion): Promise<OPVersion> {
    return this.request<OPVersion>('POST', `/projects/${projectId}/versions`, version);
  }

  async updateVersion(id: number, updates: Partial<OPCreateVersion>): Promise<OPVersion> {
    return this.request<OPVersion>('PATCH', `/versions/${id}`, updates);
  }

  // ==========================================================================
  // RELATIONS (SAFe Dependencies / AtlasDependency)
  // ==========================================================================

  async listRelations(workPackageId: number): Promise<OPRelation[]> {
    const data = await this.request<HALCollection<OPRelation>>('GET', `/work_packages/${workPackageId}/relations`);
    return data._embedded?.elements || [];
  }

  async createRelation(relation: OPCreateRelation): Promise<OPRelation> {
    // Relations must be created under a work package endpoint
    const fromId = relation._links.from.href.split('/').pop();
    return this.request<OPRelation>('POST', `/work_packages/${fromId}/relations`, relation);
  }

  async deleteRelation(id: number): Promise<void> {
    await this.request('DELETE', `/relations/${id}`);
  }

  // ==========================================================================
  // TIME ENTRIES (enables real EVM from actuals)
  // ==========================================================================

  async listTimeEntries(options?: {
    projectId?: string | number;
    workPackageId?: number;
    filters?: Record<string, { operator: string; values: (string | number)[] }>;
  }): Promise<OPTimeEntry[]> {
    let endpoint = '/time_entries';
    const params = new URLSearchParams();

    const filters: Record<string, { operator: string; values: (string | number)[] }> = options?.filters || {};
    if (options?.projectId) filters.project = { operator: '=', values: [options.projectId] };
    if (options?.workPackageId) filters.workPackage = { operator: '=', values: [options.workPackageId] };

    if (Object.keys(filters).length > 0) params.set('filters', buildFilters(filters));

    const qs = params.toString();
    return this.paginate<OPTimeEntry>(qs ? `${endpoint}?${qs}` : endpoint);
  }

  async createTimeEntry(entry: OPCreateTimeEntry): Promise<OPTimeEntry> {
    return this.request<OPTimeEntry>('POST', '/time_entries', entry);
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await this.request('DELETE', `/time_entries/${id}`);
  }

  // ==========================================================================
  // BUDGETS (labor + material line items)
  // ==========================================================================

  async listBudgets(projectId: string | number): Promise<OPBudget[]> {
    return this.paginate<OPBudget>(`/projects/${projectId}/budgets`);
  }

  async getBudget(id: number): Promise<OPBudget> {
    return this.request<OPBudget>('GET', `/budgets/${id}`);
  }

  // ==========================================================================
  // MEMBERSHIPS (SAFe Team / resource allocation)
  // ==========================================================================

  async listMemberships(projectId: string | number): Promise<OPMembership[]> {
    return this.paginate<OPMembership>(`/projects/${projectId}/memberships`);
  }

  async createMembership(projectId: string | number, userId: number, roleIds: number[]): Promise<OPMembership> {
    return this.request<OPMembership>('POST', `/projects/${projectId}/memberships`, {
      _links: {
        principal: { href: `/api/v3/users/${userId}` },
        roles: roleIds.map(id => ({ href: `/api/v3/roles/${id}` })),
      },
    });
  }

  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================

  async listNotifications(filters?: Record<string, { operator: string; values: (string | number)[] }>): Promise<OPNotification[]> {
    let endpoint = '/notifications';
    if (filters) endpoint += `?filters=${encodeURIComponent(buildFilters(filters))}`;
    return this.paginate<OPNotification>(endpoint);
  }

  async markNotificationRead(id: number): Promise<void> {
    await this.request('POST', `/notifications/${id}/read_ian`);
  }

  // ==========================================================================
  // WEBHOOKS (event-driven sync)
  // ==========================================================================

  async listWebhooks(): Promise<OPWebhook[]> {
    const data = await this.request<HALCollection<OPWebhook>>('GET', '/webhooks');
    return data._embedded?.elements || [];
  }

  async createWebhook(webhook: OPWebhook): Promise<OPWebhook> {
    return this.request<OPWebhook>('POST', '/webhooks', webhook);
  }

  async updateWebhook(id: number, updates: Partial<OPWebhook>): Promise<OPWebhook> {
    return this.request<OPWebhook>('PATCH', `/webhooks/${id}`, updates);
  }

  async deleteWebhook(id: number): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}`);
  }

  // ==========================================================================
  // CUSTOM FIELDS
  // ==========================================================================

  async listCustomFields(): Promise<OPCustomField[]> {
    const data = await this.request<HALCollection<OPCustomField>>('GET', '/custom_fields');
    return data._embedded?.elements || [];
  }

  // ==========================================================================
  // MEETINGS (Governance gate reviews)
  // ==========================================================================

  async listMeetings(projectId: string | number): Promise<OPMeeting[]> {
    return this.paginate<OPMeeting>(`/projects/${projectId}/meetings`);
  }

  async createMeeting(meeting: OPCreateMeeting): Promise<OPMeeting> {
    return this.request<OPMeeting>('POST', '/meetings', meeting);
  }

  // ==========================================================================
  // QUERIES (saved filters for agent dashboards)
  // ==========================================================================

  async listQueries(projectId?: string | number): Promise<OPQuery[]> {
    const endpoint = projectId ? `/projects/${projectId}/queries` : '/queries';
    return this.paginate<OPQuery>(endpoint);
  }

  async executeQuery(queryId: number): Promise<OPWorkPackage[]> {
    const data = await this.request<HALCollection<OPWorkPackage>>('GET', `/queries/${queryId}/results`);
    return data._embedded?.elements || [];
  }

  // ==========================================================================
  // REFERENCE DATA (types, statuses, priorities)
  // ==========================================================================

  async listTypes(): Promise<OPType[]> {
    const data = await this.request<HALCollection<OPType>>('GET', '/types');
    return data._embedded?.elements || [];
  }

  async listStatuses(): Promise<OPStatus[]> {
    const data = await this.request<HALCollection<OPStatus>>('GET', '/statuses');
    return data._embedded?.elements || [];
  }

  async listPriorities(): Promise<OPPriority[]> {
    const data = await this.request<HALCollection<OPPriority>>('GET', '/priorities');
    return data._embedded?.elements || [];
  }

  // ==========================================================================
  // USERS & GROUPS
  // ==========================================================================

  async listUsers(filters?: Record<string, { operator: string; values: (string | number)[] }>): Promise<OPUser[]> {
    let endpoint = '/users';
    if (filters) endpoint += `?filters=${encodeURIComponent(buildFilters(filters))}`;
    return this.paginate<OPUser>(endpoint);
  }

  async getUser(id: number): Promise<OPUser> {
    return this.request<OPUser>('GET', `/users/${id}`);
  }

  async listGroups(): Promise<OPGroup[]> {
    const data = await this.request<HALCollection<OPGroup>>('GET', '/groups');
    return data._embedded?.elements || [];
  }

  // ==========================================================================
  // GANTT / SCHEDULE helpers (computed from work packages + relations)
  // ==========================================================================

  /** Get all work packages with their relations for a project — enough to render a Gantt chart */
  async getGanttData(projectId: string | number): Promise<{
    workPackages: OPWorkPackage[];
    relations: OPRelation[];
    versions: OPVersion[];
  }> {
    const [workPackages, versions] = await Promise.all([
      this.listWorkPackages({ projectId }),
      this.listVersions(projectId),
    ]);

    // Collect all relations for all work packages
    const relationsMap = new Map<number, OPRelation[]>();
    const allRelations: OPRelation[] = [];

    // Batch relation fetches (avoid N+1)
    await Promise.all(
      workPackages.map(async (wp) => {
        const relations = await this.listRelations(wp.id);
        relationsMap.set(wp.id, relations);
        allRelations.push(...relations);
      })
    );

    // Deduplicate relations by id
    const uniqueRelations = Array.from(
      new Map(allRelations.map(r => [r.id, r])).values()
    );

    return { workPackages, relations: uniqueRelations, versions };
  }

  /** Get resource capacity data — memberships + time entries for capacity analysis */
  async getResourceData(projectId: string | number): Promise<{
    memberships: OPMembership[];
    timeEntries: OPTimeEntry[];
  }> {
    const [memberships, timeEntries] = await Promise.all([
      this.listMemberships(projectId),
      this.listTimeEntries({ projectId }),
    ]);
    return { memberships, timeEntries };
  }
}

// ============================================================================
// Singleton factory
// ============================================================================

let clientInstance: OpenProjectClient | null = null;

export function getOpenProjectClient(): OpenProjectClient {
  if (!clientInstance) {
    const baseUrl = process.env.OPENPROJECT_URL || 'http://localhost:8080';
    const apiKey = process.env.OPENPROJECT_API_KEY || '';

    if (!apiKey) {
      console.warn('[OpenProjectClient] No OPENPROJECT_API_KEY configured. OP integration disabled.');
    }

    clientInstance = new OpenProjectClient({ baseUrl, apiKey });
  }
  return clientInstance;
}

export function resetOpenProjectClient(): void {
  clientInstance = null;
}

export default OpenProjectClient;
