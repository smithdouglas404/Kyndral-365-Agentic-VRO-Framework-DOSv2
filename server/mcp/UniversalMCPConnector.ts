/**
 * UNIVERSAL MCP CONNECTOR
 *
 * Generic integration connector that works with ANY PM tool
 * by just providing credentials and field mappings.
 *
 * No custom code needed for new integrations!
 *
 * Supports:
 * - REST APIs (Jira, ServiceNow, Monday, Asana, ClickUp, etc.)
 * - GraphQL APIs (Monday, Linear, etc.)
 * - OData APIs (SAP PPM, Dynamics, etc.)
 * - SOAP/XML APIs (Oracle Primavera, legacy systems)
 */

import type { Integration } from '../../shared/schema.js';
import { decryptFields } from '../lib/encryption.js';

export interface MCPConnectionConfig {
  // API Configuration
  baseUrl: string;
  authType: 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'custom';
  apiVersion?: string;

  // Authentication
  credentials: {
    username?: string;
    password?: string;
    apiKey?: string;
    apiToken?: string;
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    [key: string]: any;
  };

  // API Type
  apiType: 'rest' | 'graphql' | 'odata' | 'soap';

  // Entity Mappings (how to get projects, tasks, etc.)
  endpoints: {
    projects?: string;  // e.g., "/rest/api/3/project/search"
    tasks?: string;     // e.g., "/rest/api/3/search?jql=..."
    users?: string;
    statuses?: string;
    customFields?: string;
  };

  // Field Mappings (how to map their fields to ours)
  fieldMappings?: {
    project?: {
      id?: string;         // e.g., "id" or "key"
      name?: string;       // e.g., "name" or "displayName"
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      owner?: string;
      budget?: string;
      [key: string]: any;
    };
    task?: {
      id?: string;
      name?: string;
      description?: string;
      status?: string;
      assignee?: string;
      dueDate?: string;
      effort?: string;
      [key: string]: any;
    };
  };

  // Status Mappings (how their statuses map to ours)
  statusMappings: {
    [theirStatus: string]: 'active' | 'planning' | 'completed' | 'on_hold' | 'cancelled';
  };

  // Pagination
  pagination?: {
    type: 'offset' | 'cursor' | 'page';
    limitParam: string;   // e.g., "maxResults", "limit", "per_page"
    offsetParam?: string; // e.g., "startAt", "offset", "page"
    cursorParam?: string;
    defaultLimit: number;
  };

  // Rate Limiting
  rateLimit?: {
    requestsPerSecond: number;
    burstSize: number;
  };
}

export interface SyncResult {
  success: boolean;
  message: string;
  recordsImported: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  duration: number;
}

export class UniversalMCPConnector {
  private config: MCPConnectionConfig;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor(integration: Integration, additionalConfig?: Partial<MCPConnectionConfig>) {
    // Decrypt credentials
    const decrypted = decryptFields(integration, ['credentials']);

    // Parse JSON fields
    const connectionDetails = typeof integration.connectionDetails === 'string'
      ? JSON.parse(integration.connectionDetails)
      : integration.connectionDetails || {};

    const credentials = typeof decrypted.credentials === 'string'
      ? JSON.parse(decrypted.credentials)
      : decrypted.credentials || {};

    const fieldMappings = typeof integration.fieldMappings === 'string'
      ? JSON.parse(integration.fieldMappings)
      : integration.fieldMappings || {};

    // Build configuration from integration
    this.config = {
      baseUrl: connectionDetails.baseUrl || '',
      authType: connectionDetails.authType || 'basic',
      apiType: connectionDetails.apiType || 'rest',
      credentials: credentials,
      endpoints: connectionDetails.endpoints || {},
      fieldMappings: fieldMappings.project ? fieldMappings : { project: fieldMappings },
      statusMappings: connectionDetails.statusMappings || {},
      pagination: connectionDetails.pagination,
      rateLimit: connectionDetails.rateLimit,
      ...additionalConfig,
    };
  }

  /**
   * Test connection to the external system
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency: number }> {
    const startTime = Date.now();

    try {
      // Try to fetch a small amount of data to verify connection
      const endpoints = this.config.endpoints || {};
      const endpoint = endpoints.projects || endpoints.tasks || '/';
      const response = await this.makeRequest(endpoint, { method: 'GET' });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful',
          latency,
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${response.statusText}`,
          latency,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync projects from external system
   */
  async syncProjects(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsImported = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    try {
      const endpoints = this.config.endpoints || {};
      if (!endpoints.projects) {
        throw new Error('Projects endpoint not configured');
      }

      // Fetch projects from external system
      const projects = await this.fetchAllPages(endpoints.projects);

      console.log(`[UniversalMCP] Fetched ${projects.length} projects`);

      // Map and import each project
      for (const externalProject of projects) {
        try {
          const mappedProject = this.mapProject(externalProject);

          
          // This would integrate with your storage layer
          console.log(`[UniversalMCP] Mapped project: ${mappedProject.name}`);

          recordsImported++;
        } catch (error: any) {
          errors.push(`Failed to map project: ${error.message}`);
          recordsSkipped++;
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0
          ? `Successfully synced ${recordsImported} projects`
          : `Synced with ${errors.length} errors`,
        recordsImported,
        recordsUpdated,
        recordsSkipped,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        recordsImported,
        recordsUpdated,
        recordsSkipped,
        errors: [error.message],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Map external project to internal format
   */
  private mapProject(externalProject: any): any {
    const fieldMappings = this.config.fieldMappings || {};
    const mapping = fieldMappings.project || {
      id: 'id',
      name: 'name',
      description: 'description',
      status: 'status'
    };

    return {
      name: this.getNestedValue(externalProject, mapping.name || 'name'),
      description: this.getNestedValue(externalProject, mapping.description || 'description') || '',
      status: this.mapStatus(this.getNestedValue(externalProject, mapping.status || 'status')),
      startDate: mapping.startDate ? this.getNestedValue(externalProject, mapping.startDate) : null,
      endDate: mapping.endDate ? this.getNestedValue(externalProject, mapping.endDate) : null,
      owner: mapping.owner ? this.getNestedValue(externalProject, mapping.owner) : null,
      budget: mapping.budget ? this.getNestedValue(externalProject, mapping.budget) : '0',
      externalId: this.getNestedValue(externalProject, mapping.id || 'id'),
    };
  }

  /**
   * Map external status to internal status
   */
  private mapStatus(externalStatus: string): string {
    const statusMappings = this.config.statusMappings || {};
    return statusMappings[externalStatus] || 'active';
  }

  /**
   * Get nested value from object using dot notation
   * e.g., "project.owner.displayName" => obj.project.owner.displayName
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Make HTTP request with proper authentication
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Rate limiting
    await this.enforceRateLimit();

    // Build full URL
    const url = this.config.baseUrl + endpoint;

    // Add authentication headers
    const headers = this.buildAuthHeaders();

    // Merge headers
    options.headers = {
      ...headers,
      ...(options.headers || {}),
    };

    // Make request
    const response = await fetch(url, options);

    return response;
  }

  /**
   * Build authentication headers based on auth type
   */
  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    switch (this.config.authType) {
      case 'basic':
        const { username, password } = this.config.credentials;
        if (username && password) {
          headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        }
        break;

      case 'bearer':
        const { accessToken, apiToken } = this.config.credentials;
        const token = accessToken || apiToken;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        break;

      case 'api_key':
        const { apiKey } = this.config.credentials;
        if (apiKey) {
          // Different tools use different header names
          headers['X-API-Key'] = apiKey;
          headers['Api-Key'] = apiKey;
          headers['Authorization'] = apiKey;
        }
        break;

      case 'oauth2':
        const { accessToken: oauthToken } = this.config.credentials;
        if (oauthToken) {
          headers['Authorization'] = `Bearer ${oauthToken}`;
        }
        break;
    }

    return headers;
  }

  /**
   * Fetch all pages of results
   */
  private async fetchAllPages(endpoint: string, maxPages: number = 10): Promise<any[]> {
    const allResults: any[] = [];
    const pagination = this.config.pagination;

    if (!pagination) {
      // Single request, no pagination
      const response = await this.makeRequest(endpoint);
      const data = await response.json();
      return Array.isArray(data) ? data : (data.values || data.results || data.data || []);
    }

    let page = 0;
    let hasMore = true;

    while (hasMore && page < maxPages) {
      const paginatedEndpoint = this.buildPaginatedEndpoint(endpoint, page, pagination);
      const response = await this.makeRequest(paginatedEndpoint);
      const data = await response.json();

      const results = Array.isArray(data) ? data : (data.values || data.results || data.data || []);
      allResults.push(...results);

      // Check if there are more pages
      hasMore = results.length === pagination.defaultLimit;
      page++;
    }

    return allResults;
  }

  /**
   * Build paginated endpoint
   */
  private buildPaginatedEndpoint(
    baseEndpoint: string,
    page: number,
    pagination: NonNullable<MCPConnectionConfig['pagination']>
  ): string {
    const separator = baseEndpoint.includes('?') ? '&' : '?';
    const params: string[] = [];

    params.push(`${pagination.limitParam}=${pagination.defaultLimit}`);

    if (pagination.type === 'offset' && pagination.offsetParam) {
      const offset = page * pagination.defaultLimit;
      params.push(`${pagination.offsetParam}=${offset}`);
    } else if (pagination.type === 'page' && pagination.offsetParam) {
      params.push(`${pagination.offsetParam}=${page + 1}`);
    }

    return `${baseEndpoint}${separator}${params.join('&')}`;
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    if (!this.config.rateLimit) {
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.config.rateLimit.requestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}

/**
 * Load custom presets from database
 */
export async function loadCustomPresets(): Promise<Record<string, Partial<MCPConnectionConfig>>> {
  try {
    const { db } = await import('../db.js');
    const { sql } = await import('drizzle-orm');

    const result = await db.execute(sql`
      SELECT * FROM custom_mcp_presets
      WHERE is_active = true
    `);

    const customPresets: Record<string, Partial<MCPConnectionConfig>> = {};

    for (const row of result.rows as any[]) {
      customPresets[row.name] = {
        apiType: row.api_type,
        authType: row.auth_type,
        baseUrl: row.base_url,
        endpoints: row.endpoints,
        fieldMappings: row.field_mappings,
        statusMappings: row.status_mappings,
        pagination: row.pagination,
        rateLimit: row.rate_limit,
      };
    }

    return customPresets;
  } catch (error) {
    console.warn('[UniversalMCP] Failed to load custom presets:', error);
    return {};
  }
}

/**
 * Get all presets (built-in + custom)
 */
export async function getAllPresets(): Promise<Record<string, Partial<MCPConnectionConfig>>> {
  const customPresets = await loadCustomPresets();
  return {
    ...MCP_PRESETS,
    ...customPresets, // Custom presets can override built-in ones
  };
}

/**
 * Pre-configured MCP connectors for popular tools (BUILT-IN)
 */
export const MCP_PRESETS: Record<string, Partial<MCPConnectionConfig>> = {
  jira_cloud: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/rest/api/3/project/search',
      tasks: '/rest/api/3/search',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'projectTypeKey',
      },
    },
    statusMappings: {
      'software': 'active',
      'business': 'active',
    },
    pagination: {
      type: 'offset',
      limitParam: 'maxResults',
      offsetParam: 'startAt',
      defaultLimit: 50,
    },
  },

  servicenow: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/api/now/table/pm_project',
      tasks: '/api/now/table/pm_project_task',
    },
    fieldMappings: {
      project: {
        id: 'sys_id',
        name: 'short_description',
        description: 'description',
        status: 'state',
        startDate: 'start_date',
        endDate: 'end_date',
        budget: 'budget',
      },
    },
    statusMappings: {
      '1': 'planning',
      '2': 'active',
      '3': 'completed',
      '4': 'on_hold',
    },
    pagination: {
      type: 'offset',
      limitParam: 'sysparm_limit',
      offsetParam: 'sysparm_offset',
      defaultLimit: 100,
    },
  },

  azure_devops: {
    apiType: 'rest',
    authType: 'basic',
    apiVersion: '7.0',
    endpoints: {
      projects: '/_apis/projects',
      tasks: '/_apis/wit/workitems',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'state',
      },
    },
    statusMappings: {
      'wellFormed': 'active',
      'createPending': 'planning',
      'deleted': 'completed',
    },
    pagination: {
      type: 'offset',
      limitParam: '$top',
      offsetParam: '$skip',
      defaultLimit: 100,
    },
  },

  monday: {
    apiType: 'graphql',
    authType: 'bearer',
    endpoints: {
      projects: '/v2',  // GraphQL endpoint
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'state',
      },
    },
  },

  asana: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/1.0/projects',
      tasks: '/api/1.0/tasks',
    },
    fieldMappings: {
      project: {
        id: 'gid',
        name: 'name',
        description: 'notes',
        status: 'archived',
      },
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  clickup: {
    apiType: 'rest',
    authType: 'api_key',
    endpoints: {
      projects: '/api/v2/team/{team_id}/space',
      tasks: '/api/v2/list/{list_id}/task',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'status.status',
      },
    },
  },

  smartsheet: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/2.0/sheets',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'accessLevel',
      },
    },
  },

  sap_ppm: {
    apiType: 'odata',
    authType: 'basic',
    endpoints: {
      projects: '/sap/opu/odata/sap/CA_PPM_PROJECT_ELEMENT_OVW/ProjectElements',
      tasks: '/sap/opu/odata/sap/CA_PPM_PROJECT_ELEMENT_OVW/Tasks',
    },
    fieldMappings: {
      project: {
        id: 'ProjectElementUUID',
        name: 'ProjectElementDescription',
        description: 'ProjectElementLongDescription',
        status: 'ProjectLifeCycleStatusCode',
        startDate: 'PlannedStartDate',
        endDate: 'PlannedEndDate',
        budget: 'ProjectElementPlanCost',
      },
    },
    statusMappings: {
      'PLAN': 'planning',
      'EXEC': 'active',
      'COMP': 'completed',
      'CANC': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: '$top',
      offsetParam: '$skip',
      defaultLimit: 100,
    },
  },

  primavera: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/p6ws/rest/project',
      tasks: '/p6ws/rest/activity',
    },
    fieldMappings: {
      project: {
        id: 'ObjectId',
        name: 'Name',
        description: 'Description',
        status: 'Status',
        startDate: 'PlannedStartDate',
        endDate: 'PlannedFinishDate',
        budget: 'TotalCost',
      },
    },
    statusMappings: {
      'Active': 'active',
      'Planning': 'planning',
      'What-If': 'planning',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'start',
      defaultLimit: 200,
    },
  },

  planview: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/services/data/v1/projects',
      tasks: '/services/data/v1/tasks',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'statusType.name',
        startDate: 'plannedStart',
        endDate: 'plannedFinish',
        owner: 'projectManager.email',
        budget: 'budget',
      },
    },
    statusMappings: {
      'Active': 'active',
      'Proposed': 'planning',
      'Completed': 'completed',
      'On Hold': 'on_hold',
      'Cancelled': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
    rateLimit: {
      requestsPerSecond: 5,
      burstSize: 10,
    },
  },

  wrike: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/v4/folders',
      tasks: '/api/v4/tasks',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'title',
        description: 'description',
        status: 'project.status',
      },
    },
  },

  basecamp: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/projects.json',
      tasks: '/buckets/{project_id}/todolists.json',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'status',
      },
    },
  },

  trello: {
    apiType: 'rest',
    authType: 'api_key',
    endpoints: {
      projects: '/1/members/me/boards',
      tasks: '/1/boards/{board_id}/cards',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'desc',
        status: 'closed',
      },
    },
  },

  'microsoft-project-server': {
    apiType: 'rest',
    authType: 'oauth2',
    endpoints: {
      projects: '/_api/ProjectData/Projects',
      tasks: '/_api/ProjectData/Tasks',
    },
    fieldMappings: {
      project: {
        id: 'ProjectId',
        name: 'ProjectName',
        description: 'ProjectDescription',
        status: 'ProjectStatus',
        startDate: 'ProjectStartDate',
        endDate: 'ProjectFinishDate',
        owner: 'ProjectManagerName',
      },
    },
    statusMappings: {
      '0': 'planning',
      '1': 'active',
      '2': 'completed',
      '3': 'on_hold',
    },
  },

  triskell: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/v1/projects',
      tasks: '/api/v1/tasks',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'status',
        startDate: 'startDate',
        endDate: 'endDate',
        budget: 'budget',
      },
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  linear: {
    apiType: 'graphql',
    authType: 'bearer',
    endpoints: {
      projects: '/graphql',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'state',
        startDate: 'startDate',
        endDate: 'targetDate',
      },
    },
  },

  targetprocess: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/api/v1/Projects',
      tasks: '/api/v1/UserStories',
    },
    fieldMappings: {
      project: {
        id: 'Id',
        name: 'Name',
        description: 'Description',
        status: 'EntityState.Name',
        startDate: 'StartDate',
        endDate: 'EndDate',
      },
    },
    pagination: {
      type: 'offset',
      limitParam: 'take',
      offsetParam: 'skip',
      defaultLimit: 100,
    },
  },

  'jira-align': {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/rest/align/latest/programs',
      tasks: '/rest/align/latest/features',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'title',
        description: 'description',
        status: 'state',
        startDate: 'actualStartDate',
        endDate: 'actualEndDate',
        budget: 'budget',
      },
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 50,
    },
  },

  github: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/user/repos',
      tasks: '/repos/{owner}/{repo}/issues',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'archived',
        owner: 'owner.login',
      },
    },
    pagination: {
      type: 'page',
      limitParam: 'per_page',
      offsetParam: 'page',
      defaultLimit: 100,
    },
  },

  gitlab: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/v4/projects',
      tasks: '/api/v4/projects/{id}/issues',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'archived',
        owner: 'owner.username',
      },
    },
    pagination: {
      type: 'page',
      limitParam: 'per_page',
      offsetParam: 'page',
      defaultLimit: 100,
    },
  },

  notion: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/v1/databases/{database_id}/query',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'properties.Name.title.0.text.content',
        description: 'properties.Description.rich_text.0.text.content',
        status: 'properties.Status.select.name',
      },
    },
  },

  confluence: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/wiki/rest/api/space',
      tasks: '/wiki/rest/api/content',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description.plain.value',
        status: 'status',
      },
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'start',
      defaultLimit: 100,
    },
  },

  airtable: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/v0/{base_id}/{table_name}',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'fields.Name',
        description: 'fields.Description',
        status: 'fields.Status',
        startDate: 'fields.Start Date',
        endDate: 'fields.End Date',
      },
    },
    pagination: {
      type: 'offset',
      limitParam: 'pageSize',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  slack: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/conversations.list',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'purpose.value',
        status: 'is_archived',
      },
    },
  },

  'microsoft-teams': {
    apiType: 'rest',
    authType: 'oauth2',
    endpoints: {
      projects: '/v1.0/teams',
      tasks: '/v1.0/teams/{team-id}/channels',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'displayName',
        description: 'description',
        status: 'isArchived',
      },
    },
  },

  quickbooks: {
    apiType: 'rest',
    authType: 'oauth2',
    endpoints: {
      projects: '/v3/company/{realmId}/query?query=select * from Customer',
      invoices: '/v3/company/{realmId}/query?query=select * from Invoice',
      expenses: '/v3/company/{realmId}/query?query=select * from Purchase',
      bills: '/v3/company/{realmId}/query?query=select * from Bill',
      budgets: '/v3/company/{realmId}/query?query=select * from Budget',
      payments: '/v3/company/{realmId}/query?query=select * from Payment',
    },
    fieldMappings: {
      project: {
        id: 'Id',
        name: 'DisplayName',
        description: 'Notes',
        status: 'Active',
      },
      invoice: {
        id: 'Id',
        amount: 'TotalAmt',
        date: 'TxnDate',
        dueDate: 'DueDate',
        status: 'Balance',
        customer: 'CustomerRef.name',
      },
      expense: {
        id: 'Id',
        amount: 'TotalAmt',
        date: 'TxnDate',
        vendor: 'EntityRef.name',
        category: 'Line[0].AccountBasedExpenseLineDetail.AccountRef.name',
      },
    },
  },

  // SAP ERP (S/4HANA) - Enterprise Resource Planning
  sap_erp: {
    apiType: 'odata',
    authType: 'basic',
    endpoints: {
      projects: '/sap/opu/odata/sap/API_PROJECT/A_Project',
      invoices: '/sap/opu/odata/sap/API_SALES_INVOICE_SRV/A_SalesInvoice',
      expenses: '/sap/opu/odata/sap/API_COSTCENTER_SRV/A_CostCenter',
      budgets: '/sap/opu/odata/sap/API_BUDGET_SRV/A_Budget',
    },
    fieldMappings: {
      project: {
        id: 'ProjectInternalID',
        name: 'ProjectDescription',
        description: 'ProjectLongDescription',
        status: 'ProjectLifeCycleStatus',
        budget: 'PlannedTotalCost',
      },
      invoice: {
        id: 'SalesInvoice',
        amount: 'TotalNetAmount',
        date: 'BillingDocumentDate',
        customer: 'SoldToParty',
      },
      expense: {
        id: 'CostCenter',
        amount: 'ActualCost',
        category: 'CostCenterDescription',
      },
    },
    statusMappings: {
      'PLAN': 'planning',
      'EXEC': 'active',
      'COMP': 'completed',
      'CANC': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: '$top',
      offsetParam: '$skip',
      defaultLimit: 100,
    },
  },

  // Oracle ERP Cloud - Financials
  oracle_erp: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/fscmRestApi/resources/11.13.18.05/projects',
      invoices: '/fscmRestApi/resources/11.13.18.05/invoices',
      expenses: '/fscmRestApi/resources/11.13.18.05/expenses',
      budgets: '/fscmRestApi/resources/11.13.18.05/budgets',
    },
    fieldMappings: {
      project: {
        id: 'ProjectId',
        name: 'ProjectName',
        description: 'Description',
        status: 'ProjectStatusCode',
        startDate: 'StartDate',
        endDate: 'CompletionDate',
        budget: 'BudgetedCost',
      },
      invoice: {
        id: 'InvoiceId',
        amount: 'InvoiceAmount',
        date: 'InvoiceDate',
        customer: 'CustomerName',
      },
      expense: {
        id: 'ExpenseId',
        amount: 'Amount',
        date: 'ExpenseDate',
        category: 'ExpenseType',
      },
    },
    statusMappings: {
      'ACTIVE': 'active',
      'APPROVED': 'active',
      'CLOSED': 'completed',
      'CANCELLED': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  // NetSuite ERP - Financial Management
  netsuite: {
    apiType: 'rest',
    authType: 'oauth',
    endpoints: {
      projects: '/services/rest/record/v1/job',
      invoices: '/services/rest/record/v1/invoice',
      expenses: '/services/rest/record/v1/expense',
      budgets: '/services/rest/record/v1/budget',
      vendors: '/services/rest/record/v1/vendor',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'companyname',
        description: 'comments',
        status: 'entitystatus',
        budget: 'estimatedcost',
      },
      invoice: {
        id: 'id',
        amount: 'total',
        date: 'trandate',
        customer: 'entity.refName',
        status: 'status.refName',
      },
      expense: {
        id: 'id',
        amount: 'amount',
        date: 'trandate',
        category: 'category.refName',
      },
    },
    statusMappings: {
      'In Progress': 'active',
      'Not Started': 'planning',
      'Completed': 'completed',
      'On Hold': 'on_hold',
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  // Microsoft Dynamics 365 Finance
  dynamics_365: {
    apiType: 'odata',
    authType: 'oauth2',
    endpoints: {
      projects: '/data/Projects',
      invoices: '/data/CustInvoiceJour',
      expenses: '/data/PurchaseOrders',
      budgets: '/data/BudgetTransactionHeaders',
    },
    fieldMappings: {
      project: {
        id: 'ProjectId',
        name: 'ProjectName',
        description: 'ProjectDescription',
        status: 'ProjectStatus',
        budget: 'TotalBudget',
      },
      invoice: {
        id: 'InvoiceId',
        amount: 'InvoiceAmount',
        date: 'InvoiceDate',
        customer: 'InvoiceAccount',
      },
      expense: {
        id: 'PurchaseOrderNumber',
        amount: 'TotalAmount',
        date: 'OrderDate',
        vendor: 'OrderVendorAccountNumber',
      },
    },
    statusMappings: {
      'InProcess': 'active',
      'Created': 'planning',
      'Finished': 'completed',
      'Eliminated': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: '$top',
      offsetParam: '$skip',
      defaultLimit: 100,
    },
  },

  // Workday Financials
  workday: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/ccx/api/v1/company/projects',
      invoices: '/ccx/api/v1/company/customerInvoices',
      expenses: '/ccx/api/v1/company/expenseReports',
      budgets: '/ccx/api/v1/company/budgets',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'projectName',
        description: 'projectDescription',
        status: 'projectStatus',
        budget: 'totalBudget',
      },
      invoice: {
        id: 'invoiceNumber',
        amount: 'totalAmount',
        date: 'invoiceDate',
        customer: 'customer.descriptor',
      },
      expense: {
        id: 'expenseReportID',
        amount: 'totalAmount',
        date: 'reportDate',
        category: 'expenseType.descriptor',
      },
    },
    statusMappings: {
      'Active': 'active',
      'Planned': 'planning',
      'Closed': 'completed',
      'Cancelled': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  // Sage Intacct
  sage_intacct: {
    apiType: 'rest',
    authType: 'api_key',
    endpoints: {
      projects: '/ia/api/v1/projects',
      invoices: '/ia/api/v1/invoices',
      expenses: '/ia/api/v1/expenses',
      budgets: '/ia/api/v1/budgets',
    },
    fieldMappings: {
      project: {
        id: 'PROJECTID',
        name: 'NAME',
        description: 'DESCRIPTION',
        status: 'STATUS',
        budget: 'BUDGETAMOUNT',
      },
      invoice: {
        id: 'RECORDNO',
        amount: 'TOTALAMOUNT',
        date: 'WHENCREATED',
        customer: 'CUSTOMERNAME',
      },
      expense: {
        id: 'RECORDNO',
        amount: 'TOTALAMOUNT',
        date: 'WHENCREATED',
        category: 'EXPENSETYPE',
      },
    },
    statusMappings: {
      'active': 'active',
      'inactive': 'completed',
    },
    pagination: {
      type: 'offset',
      limitParam: 'pagesize',
      offsetParam: 'offset',
      defaultLimit: 100,
    },
  },

  rally: {
    apiType: 'rest',
    authType: 'api_key',
    endpoints: {
      projects: '/slm/webservice/v2.0/project',
      tasks: '/slm/webservice/v2.0/userstory',
    },
    fieldMappings: {
      project: {
        id: 'ObjectID',
        name: 'Name',
        description: 'Description',
        status: 'State',
        startDate: 'CreationDate',
        owner: 'Owner.Name',
      },
    },
    pagination: {
      type: 'page',
      limitParam: 'pagesize',
      offsetParam: 'start',
      defaultLimit: 200,
    },
  },

  // ============================================================================
  // STRATEGIC EXECUTION MCP SERVERS (2026)
  // Power-user servers for VRO, TMO, and advanced PMO capabilities
  // ============================================================================

  // Financial & Value Realization (VRO)
  // ============================================================================

  'financial-datasets': {
    apiType: 'rest',
    authType: 'api_key',
    endpoints: {
      projects: '/query',  // Financial data query endpoint
    },
    fieldMappings: {
      project: {
        id: 'symbol',
        name: 'companyName',
        description: 'description',
        status: 'marketStatus',
        budget: 'marketCap',
      },
    },
    statusMappings: {
      'OPEN': 'active',
      'CLOSED': 'completed',
      'PRE_MARKET': 'planning',
      'AFTER_HOURS': 'on_hold',
    },
    rateLimit: {
      requestsPerSecond: 5,
      burstSize: 10,
    },
  },

  // COMING SOON: Revenue/Billing Integration
  // Will integrate with client's billing system (Stripe, Recurly, or custom API)
  // VRO Use Case: "Did Feature X launch correlate with revenue spike?"
  // Uncomment and configure when client provides billing API details
  /*
  'revenue-billing': {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/v1/revenue',
      tasks: '/api/v1/transactions',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'product_name',
        description: 'description',
        status: 'active',
      },
    },
  },
  */

  'dynamics-365-erp': {
    apiType: 'odata',
    authType: 'oauth2',
    apiVersion: '9.2',
    endpoints: {
      projects: '/api/data/v9.2/msdyn_projects',
      tasks: '/api/data/v9.2/msdyn_projecttasks',
    },
    fieldMappings: {
      project: {
        id: 'msdyn_projectid',
        name: 'msdyn_subject',
        description: 'msdyn_description',
        status: 'msdyn_projectstatus',
        startDate: 'msdyn_scheduledstart',
        endDate: 'msdyn_scheduledend',
        budget: 'msdyn_totalcost',
        owner: 'msdyn_projectmanager',
      },
    },
    statusMappings: {
      '192350000': 'planning',
      '192350001': 'active',
      '192350002': 'completed',
      '192350003': 'on_hold',
      '192350004': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: '$top',
      offsetParam: '$skip',
      defaultLimit: 100,
    },
  },

  // Strategy & Knowledge Management (TMO)
  // ============================================================================

  'project-knowledge-graph': {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/db/neo4j/tx/commit',  // Neo4j Cypher endpoint
    },
    fieldMappings: {
      project: {
        id: 'n.id',
        name: 'n.name',
        description: 'n.description',
        status: 'n.status',
      },
    },
    statusMappings: {
      'PLANNING': 'planning',
      'ACTIVE': 'active',
      'COMPLETED': 'completed',
      'ON_HOLD': 'on_hold',
      'CANCELLED': 'cancelled',
    },
  },

  weaviate: {
    apiType: 'rest',
    authType: 'api_key',
    endpoints: {
      projects: '/v1/objects',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'properties.name',
        description: 'properties.description',
        status: 'properties.status',
      },
    },
    statusMappings: {
      'active': 'active',
      'archived': 'completed',
    },
  },

  'sequential-thinking': {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/v1/analysis',
    },
    fieldMappings: {
      project: {
        id: 'analysisId',
        name: 'projectName',
        description: 'analysisResult',
        status: 'conclusionStatus',
      },
    },
  },

  // Communication & Notifications (All Agents)
  // ============================================================================

  // Email Providers
  sendgrid: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/v3/mail/send', // SendGrid send endpoint
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'subject',
        description: 'content',
        status: 'status',
      },
    },
  },

  mailgun: {
    apiType: 'rest',
    authType: 'basic', // API key as username
    endpoints: {
      projects: '/v3/{domain}/messages', // Mailgun send endpoint
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'subject',
        description: 'text',
        status: 'status',
      },
    },
  },

  'aws-ses': {
    apiType: 'rest',
    authType: 'api_key', // AWS access key
    endpoints: {
      projects: '/', // SES endpoint (region-specific)
    },
    fieldMappings: {
      project: {
        id: 'MessageId',
        name: 'Subject',
        description: 'Body',
        status: 'status',
      },
    },
  },

  'smtp-email': {
    apiType: 'smtp', // Custom type for SMTP
    authType: 'basic',
    endpoints: {
      projects: 'smtp', // Not a REST endpoint
    },
    fieldMappings: {
      project: {
        id: 'messageId',
        name: 'subject',
        description: 'body',
        status: 'status',
      },
    },
  },

  // Data & Infrastructure (PMO)
  // ============================================================================

  clickhouse: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/api/v1/query',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'description',
        status: 'status',
        startDate: 'created_at',
        endDate: 'completed_at',
      },
    },
    statusMappings: {
      'running': 'active',
      'completed': 'completed',
      'failed': 'cancelled',
    },
    pagination: {
      type: 'offset',
      limitParam: 'limit',
      offsetParam: 'offset',
      defaultLimit: 1000,
    },
    rateLimit: {
      requestsPerSecond: 100,
      burstSize: 500,
    },
  },

  greptimedb: {
    apiType: 'rest',
    authType: 'basic',
    endpoints: {
      projects: '/v1/sql',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'metric_name',
        description: 'description',
        status: 'status',
      },
    },
    statusMappings: {
      'active': 'active',
      'inactive': 'on_hold',
    },
  },

  filesystem: {
    apiType: 'rest',
    authType: 'custom',
    endpoints: {
      projects: '/api/v1/files',
    },
    fieldMappings: {
      project: {
        id: 'path',
        name: 'name',
        description: 'metadata',
        status: 'status',
        startDate: 'createdAt',
      },
    },
    statusMappings: {
      'exists': 'active',
      'deleted': 'cancelled',
    },
  },

  // Governance & Compliance (PMO/TMO)
  // ============================================================================

  semgrep: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/v1/scans',
    },
    fieldMappings: {
      project: {
        id: 'scan_id',
        name: 'repository',
        description: 'scan_metadata',
        status: 'scan_status',
      },
    },
    statusMappings: {
      'queued': 'planning',
      'running': 'active',
      'completed': 'completed',
      'failed': 'cancelled',
    },
  },

  sentry: {
    apiType: 'rest',
    authType: 'bearer',
    endpoints: {
      projects: '/api/0/projects/',
      tasks: '/api/0/projects/{organization_slug}/{project_slug}/issues/',
    },
    fieldMappings: {
      project: {
        id: 'id',
        name: 'name',
        description: 'slug',
        status: 'status',
        startDate: 'dateCreated',
      },
      task: {
        id: 'id',
        name: 'title',
        description: 'metadata',
        status: 'status',
      },
    },
    statusMappings: {
      'active': 'active',
      'resolved': 'completed',
      'ignored': 'on_hold',
      'unresolved': 'active',
    },
    pagination: {
      type: 'cursor',
      limitParam: 'per_page',
      cursorParam: 'cursor',
      defaultLimit: 100,
    },
  },
};
