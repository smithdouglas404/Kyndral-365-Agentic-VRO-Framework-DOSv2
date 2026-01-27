/**
 * SERVICENOW REST API INTEGRATION
 *
 * Real implementation of ServiceNow REST API
 * Documentation: https://docs.servicenow.com/bundle/tokyo-application-development/page/integrate/inbound-rest/concept/c_RESTAPI.html
 *
 * Supports:
 * - Create incident
 * - Update incident
 * - Get incident
 * - Query incidents
 * - Get projects (pm_project table)
 * - Get project tasks
 */

import { MCPBase } from '../base/MCPBase.js';
import type { IStorage } from '../../storage.js';

export interface ServiceNowConfig {
  instance: string;      // e.g., "your-company.service-now.com"
  username: string;
  password: string;
  // Optional OAuth
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
}

export interface ServiceNowIncident {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  state: string;
  priority: string;
  urgency: string;
  impact: string;
  assigned_to?: {
    value: string;
    display_value: string;
  };
  assignment_group?: {
    value: string;
    display_value: string;
  };
  caller_id?: {
    value: string;
    display_value: string;
  };
  category?: string;
  subcategory?: string;
  opened_at: string;
  updated_on: string;
  closed_at?: string;
  sys_created_on: string;
  sys_updated_on: string;
  [key: string]: any;
}

export interface ServiceNowProject {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  state: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  percent_complete?: string;
  project_manager?: {
    value: string;
    display_value: string;
  };
  [key: string]: any;
}

export interface CreateIncidentRequest {
  shortDescription: string;
  description?: string;
  urgency?: '1' | '2' | '3';      // 1=High, 2=Medium, 3=Low
  impact?: '1' | '2' | '3';        // 1=High, 2=Medium, 3=Low
  priority?: '1' | '2' | '3' | '4' | '5';
  callerId?: string;               // sys_id of caller
  assignedTo?: string;             // sys_id of assigned user
  assignmentGroup?: string;        // sys_id of assignment group
  category?: string;
  subcategory?: string;
  customFields?: Record<string, any>;
}

export interface UpdateIncidentRequest {
  sysId: string;
  shortDescription?: string;
  description?: string;
  state?: '1' | '2' | '3' | '4' | '5' | '6' | '7';  // 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed
  urgency?: '1' | '2' | '3';
  impact?: '1' | '2' | '3';
  priority?: '1' | '2' | '3' | '4' | '5';
  assignedTo?: string;
  assignmentGroup?: string;
  workNotes?: string;
  closeNotes?: string;
  customFields?: Record<string, any>;
}

export interface QueryRequest {
  query?: string;              // Encoded query string
  limit?: number;
  offset?: number;
  sysparmFields?: string[];    // Specific fields to return
  sysparmDisplayValue?: 'true' | 'false' | 'all';
}

export class ServiceNowAPI extends MCPBase {
  private config: ServiceNowConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(storage: IStorage, config: ServiceNowConfig) {
    super(storage, 'ServiceNowAPI', {
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        monitoringPeriod: 120000,
      },
      rateLimiter: {
        maxRequests: 100,
        windowMs: 60000,
      },
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '429', '503', '504'],
      },
    });

    this.config = config;

    // Build base URL
    const instanceUrl = config.instance.startsWith('http')
      ? config.instance
      : `https://${config.instance}`;
    this.baseUrl = `${instanceUrl}/api/now`;

    // Use OAuth if available, otherwise Basic Auth
    if (config.accessToken) {
      this.authHeader = `Bearer ${config.accessToken}`;
    } else {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.authHeader = `Basic ${credentials}`;
    }

    console.log(`[ServiceNowAPI] Initialized for instance: ${config.instance}`);
  }

  /**
   * Test connection to ServiceNow
   */
  async testConnection(): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        // Try to query the user table to verify auth
        const response = await fetch(
          `${this.baseUrl}/table/sys_user?sysparm_limit=1&sysparm_query=user_name=${this.config.username}`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.authHeader,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`ServiceNow auth failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.result && data.result.length > 0) {
          console.log(`[ServiceNowAPI] Connected as: ${data.result[0].name || this.config.username}`);
        }
        return true;
      },
      'testConnection'
    );

    return result.success;
  }

  /**
   * Create a new incident
   */
  async createIncident(request: CreateIncidentRequest): Promise<ServiceNowIncident | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        const payload: any = {
          short_description: request.shortDescription,
        };

        if (request.description) payload.description = request.description;
        if (request.urgency) payload.urgency = request.urgency;
        if (request.impact) payload.impact = request.impact;
        if (request.priority) payload.priority = request.priority;
        if (request.callerId) payload.caller_id = request.callerId;
        if (request.assignedTo) payload.assigned_to = request.assignedTo;
        if (request.assignmentGroup) payload.assignment_group = request.assignmentGroup;
        if (request.category) payload.category = request.category;
        if (request.subcategory) payload.subcategory = request.subcategory;

        // Add custom fields
        if (request.customFields) {
          Object.assign(payload, request.customFields);
        }

        console.log('[ServiceNowAPI] Creating incident:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${this.baseUrl}/table/incident`, {
          method: 'POST',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create incident: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const incident = data.result;
        console.log(`[ServiceNowAPI] Incident created: ${incident.number} (${incident.sys_id})`);

        return incident;
      },
      'createIncident'
    );

    if (!result.success) {
      console.error('[ServiceNowAPI] Failed to create incident:', result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Update an existing incident
   */
  async updateIncident(request: UpdateIncidentRequest): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const payload: any = {};

        if (request.shortDescription) payload.short_description = request.shortDescription;
        if (request.description) payload.description = request.description;
        if (request.state) payload.state = request.state;
        if (request.urgency) payload.urgency = request.urgency;
        if (request.impact) payload.impact = request.impact;
        if (request.priority) payload.priority = request.priority;
        if (request.assignedTo) payload.assigned_to = request.assignedTo;
        if (request.assignmentGroup) payload.assignment_group = request.assignmentGroup;
        if (request.workNotes) payload.work_notes = request.workNotes;
        if (request.closeNotes) payload.close_notes = request.closeNotes;

        // Add custom fields
        if (request.customFields) {
          Object.assign(payload, request.customFields);
        }

        console.log(`[ServiceNowAPI] Updating incident ${request.sysId}:`, JSON.stringify(payload, null, 2));

        const response = await fetch(`${this.baseUrl}/table/incident/${request.sysId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update incident: ${response.status} - ${error}`);
        }

        console.log(`[ServiceNowAPI] Incident ${request.sysId} updated successfully`);
        return true;
      },
      'updateIncident'
    );

    return result.success;
  }

  /**
   * Get a single incident by sys_id
   */
  async getIncident(sysId: string): Promise<ServiceNowIncident | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/table/incident/${sysId}?sysparm_display_value=all`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.authHeader,
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Incident ${sysId} not found`);
          }
          const error = await response.text();
          throw new Error(`Failed to get incident: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.result;
      },
      'getIncident'
    );

    if (!result.success) {
      console.error(`[ServiceNowAPI] Failed to get incident ${sysId}:`, result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Query incidents with filters
   */
  async queryIncidents(request: QueryRequest = {}): Promise<ServiceNowIncident[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const params = new URLSearchParams();

        if (request.query) params.append('sysparm_query', request.query);
        if (request.limit) params.append('sysparm_limit', String(request.limit));
        if (request.offset) params.append('sysparm_offset', String(request.offset));
        if (request.sysparmFields) params.append('sysparm_fields', request.sysparmFields.join(','));
        if (request.sysparmDisplayValue) params.append('sysparm_display_value', request.sysparmDisplayValue);

        const response = await fetch(
          `${this.baseUrl}/table/incident?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.authHeader,
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to query incidents: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log(`[ServiceNowAPI] Found ${data.result.length} incidents`);
        return data.result || [];
      },
      'queryIncidents'
    );

    if (!result.success) {
      console.error('[ServiceNowAPI] Failed to query incidents:', result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Get projects from pm_project table
   */
  async getProjects(limit: number = 50): Promise<ServiceNowProject[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const params = new URLSearchParams({
          sysparm_limit: String(limit),
          sysparm_display_value: 'all',
        });

        const response = await fetch(
          `${this.baseUrl}/table/pm_project?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.authHeader,
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get projects: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log(`[ServiceNowAPI] Found ${data.result.length} projects`);
        return data.result || [];
      },
      'getProjects'
    );

    if (!result.success) {
      console.error('[ServiceNowAPI] Failed to get projects:', result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Get a single project by sys_id
   */
  async getProject(sysId: string): Promise<ServiceNowProject | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/table/pm_project/${sysId}?sysparm_display_value=all`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.authHeader,
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Project ${sysId} not found`);
          }
          const error = await response.text();
          throw new Error(`Failed to get project: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.result;
      },
      'getProject'
    );

    if (!result.success) {
      console.error(`[ServiceNowAPI] Failed to get project ${sysId}:`, result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Generic table query (for any ServiceNow table)
   */
  async queryTable(
    tableName: string,
    query: QueryRequest = {}
  ): Promise<any[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const params = new URLSearchParams();

        if (query.query) params.append('sysparm_query', query.query);
        if (query.limit) params.append('sysparm_limit', String(query.limit));
        if (query.offset) params.append('sysparm_offset', String(query.offset));
        if (query.sysparmFields) params.append('sysparm_fields', query.sysparmFields.join(','));
        if (query.sysparmDisplayValue) params.append('sysparm_display_value', query.sysparmDisplayValue);

        const response = await fetch(
          `${this.baseUrl}/table/${tableName}?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.authHeader,
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to query table ${tableName}: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.result || [];
      },
      `queryTable:${tableName}`
    );

    if (!result.success) {
      console.error(`[ServiceNowAPI] Failed to query table ${tableName}:`, result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Add work notes to an incident
   */
  async addWorkNotes(sysId: string, notes: string): Promise<boolean> {
    return await this.updateIncident({
      sysId,
      workNotes: notes,
    });
  }
}
