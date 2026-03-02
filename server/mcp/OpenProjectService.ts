/**
 * OPENPROJECT MCP SERVICE
 * Real API integration for OpenProject
 *
 * OpenProject API Documentation: https://www.openproject.org/docs/api/
 */

export interface OpenProjectConfig {
  baseUrl: string; // e.g., "https://community.openproject.org" or self-hosted URL
  apiKey: string;  // API key from OpenProject account settings
}

export interface OpenProjectWorkPackage {
  id?: number;
  subject: string;
  description?: { raw: string; html?: string };
  type?: string;
  status?: string;
  priority?: string;
  assignee?: { id: number; name?: string } | null;
  project?: { id: number; identifier?: string };
  startDate?: string;
  dueDate?: string;
  estimatedTime?: string;
  percentageDone?: number;
  [key: string]: any;
}

export interface OpenProjectProject {
  id: number;
  identifier: string;
  name: string;
  description?: { raw: string };
  status?: string;
  public?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class OpenProjectService {
  private config: OpenProjectConfig;
  private baseUrl: string;

  constructor(config: OpenProjectConfig) {
    this.config = config;
    // Remove trailing slash if present
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}/api/v3${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`apikey:${this.config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenProject API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * List all projects
   */
  async listProjects(filters?: { status?: string }): Promise<OpenProjectProject[]> {
    let endpoint = '/projects';
    const params = new URLSearchParams();

    if (filters?.status) {
      params.set('filters', JSON.stringify([{ status: { operator: '=', values: [filters.status] } }]));
    }

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    const data = await this.request('GET', endpoint);
    console.log(`[OpenProject] Found ${data._embedded?.elements?.length || 0} projects`);
    return data._embedded?.elements || [];
  }

  /**
   * Get a specific project
   */
  async getProject(projectId: string | number): Promise<OpenProjectProject> {
    return this.request('GET', `/projects/${projectId}`);
  }

  /**
   * List work packages (tasks/issues)
   */
  async listWorkPackages(options?: {
    projectId?: string | number;
    type?: string;
    status?: string;
    pageSize?: number;
    offset?: number;
  }): Promise<OpenProjectWorkPackage[]> {
    let endpoint = options?.projectId
      ? `/projects/${options.projectId}/work_packages`
      : '/work_packages';

    const params = new URLSearchParams();
    params.set('pageSize', String(options?.pageSize || 100));

    if (options?.offset) {
      params.set('offset', String(options.offset));
    }

    const filters: any[] = [];
    if (options?.type) {
      filters.push({ type: { operator: '=', values: [options.type] } });
    }
    if (options?.status) {
      filters.push({ status: { operator: '=', values: [options.status] } });
    }
    if (filters.length > 0) {
      params.set('filters', JSON.stringify(filters));
    }

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    const data = await this.request('GET', endpoint);
    console.log(`[OpenProject] Found ${data._embedded?.elements?.length || 0} work packages`);
    return data._embedded?.elements || [];
  }

  /**
   * Get a specific work package
   */
  async getWorkPackage(workPackageId: number): Promise<OpenProjectWorkPackage> {
    return this.request('GET', `/work_packages/${workPackageId}`);
  }

  /**
   * Create a work package
   */
  async createWorkPackage(projectId: string | number, workPackage: Partial<OpenProjectWorkPackage>): Promise<OpenProjectWorkPackage> {
    // Build _links only with defined values
    const links: Record<string, any> = {};
    if (workPackage.type) links.type = { href: `/api/v3/types/${workPackage.type}` };
    if (workPackage.status) links.status = { href: `/api/v3/statuses/${workPackage.status}` };
    if (workPackage.priority) links.priority = { href: `/api/v3/priorities/${workPackage.priority}` };
    if (workPackage.assignee?.id) links.assignee = { href: `/api/v3/users/${workPackage.assignee.id}` };

    const payload: any = {
      subject: workPackage.subject,
      description: workPackage.description,
      startDate: workPackage.startDate,
      dueDate: workPackage.dueDate,
      estimatedTime: workPackage.estimatedTime,
    };

    // Only add _links if there are any
    if (Object.keys(links).length > 0) {
      payload._links = links;
    }

    const data = await this.request('POST', `/projects/${projectId}/work_packages`, payload);
    console.log(`[OpenProject] Created work package: ${data.id}`);
    return data;
  }

  /**
   * Update a work package
   */
  async updateWorkPackage(workPackageId: number, updates: Partial<OpenProjectWorkPackage>): Promise<OpenProjectWorkPackage> {
    // First get current version for optimistic locking
    const current = await this.getWorkPackage(workPackageId);
    const lockVersion = current.lockVersion;

    const payload: any = { lockVersion };

    if (updates.subject !== undefined) payload.subject = updates.subject;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.startDate !== undefined) payload.startDate = updates.startDate;
    if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
    if (updates.percentageDone !== undefined) payload.percentageDone = updates.percentageDone;

    if (updates.status || updates.priority || updates.assignee !== undefined) {
      payload._links = {};
      if (updates.status) payload._links.status = { href: `/api/v3/statuses/${updates.status}` };
      if (updates.priority) payload._links.priority = { href: `/api/v3/priorities/${updates.priority}` };
      if (updates.assignee !== undefined) {
        payload._links.assignee = updates.assignee?.id
          ? { href: `/api/v3/users/${updates.assignee.id}` }
          : null;
      }
    }

    const data = await this.request('PATCH', `/work_packages/${workPackageId}`, payload);
    console.log(`[OpenProject] Updated work package: ${data.id}`);
    return data;
  }

  /**
   * Delete a work package
   */
  async deleteWorkPackage(workPackageId: number): Promise<void> {
    await this.request('DELETE', `/work_packages/${workPackageId}`);
    console.log(`[OpenProject] Deleted work package: ${workPackageId}`);
  }

  /**
   * List statuses
   */
  async listStatuses(): Promise<Array<{ id: number; name: string; isClosed: boolean }>> {
    const data = await this.request('GET', '/statuses');
    return (data._embedded?.elements || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      isClosed: s.isClosed,
    }));
  }

  /**
   * List types (work package types)
   */
  async listTypes(): Promise<Array<{ id: number; name: string }>> {
    const data = await this.request('GET', '/types');
    return (data._embedded?.elements || []).map((t: any) => ({
      id: t.id,
      name: t.name,
    }));
  }

  /**
   * List priorities
   */
  async listPriorities(): Promise<Array<{ id: number; name: string; position: number }>> {
    const data = await this.request('GET', '/priorities');
    return (data._embedded?.elements || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      position: p.position,
    }));
  }

  /**
   * Search users
   */
  async searchUsers(query: string): Promise<Array<{ id: number; name: string; login: string }>> {
    const params = new URLSearchParams();
    params.set('filters', JSON.stringify([{ name: { operator: '~', values: [query] } }]));

    const data = await this.request('GET', `/users?${params.toString()}`);
    return (data._embedded?.elements || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      login: u.login,
    }));
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{
    connected: boolean;
    version?: string;
    instanceName?: string;
    error?: string;
  }> {
    try {
      const data = await this.request('GET', '/');
      return {
        connected: true,
        version: data.coreVersion,
        instanceName: data.instanceName,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}
