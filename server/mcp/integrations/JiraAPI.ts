/**
 * JIRA REST API INTEGRATION
 *
 * Real implementation of Jira Cloud REST API v3
 * Documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/
 *
 * Supports:
 * - Create issue
 * - Update issue
 * - Get issue
 * - Search issues (JQL)
 * - Get projects
 * - Get issue types
 * - Transitions
 */

import { MCPBase } from '../base/MCPBase.js';
import type { IStorage } from '../../storage.js';

export interface JiraConfig {
  domain: string;        // e.g., "your-company.atlassian.net"
  email: string;         // Atlassian account email
  apiToken: string;      // API token from https://id.atlassian.com/manage-profile/security/api-tokens
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: any;
    status: {
      name: string;
      id: string;
    };
    priority?: {
      name: string;
      id: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
    };
    reporter?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
    };
    created: string;
    updated: string;
    duedate?: string;
    project: {
      id: string;
      key: string;
      name: string;
    };
    issuetype: {
      id: string;
      name: string;
    };
    [key: string]: any;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  lead?: {
    accountId: string;
    displayName: string;
  };
  avatarUrls?: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
}

export interface CreateIssueRequest {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: string;        // e.g., "Task", "Story", "Bug"
  priority?: string;         // e.g., "High", "Medium", "Low"
  assignee?: string;         // accountId
  labels?: string[];
  customFields?: Record<string, any>;
}

export interface UpdateIssueRequest {
  issueIdOrKey: string;
  summary?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  customFields?: Record<string, any>;
}

export interface JQLSearchRequest {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
}

export class JiraAPI extends MCPBase {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(storage: IStorage, config: JiraConfig) {
    super(storage, 'JiraAPI', {
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
    this.baseUrl = `https://${config.domain}/rest/api/3`;

    // Jira uses Basic Auth with email:apiToken
    const credentials = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;

    console.log(`[JiraAPI] Initialized for domain: ${config.domain}`);
  }

  /**
   * Test connection to Jira
   */
  async testConnection(): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const response = await fetch(`${this.baseUrl}/myself`, {
          method: 'GET',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Jira auth failed: ${response.status} ${response.statusText}`);
        }

        const user = await response.json();
        console.log(`[JiraAPI] Connected as: ${user.displayName} (${user.emailAddress})`);
        return true;
      },
      'testConnection'
    );

    return result.success;
  }

  /**
   * Get all projects
   */
  async getProjects(maxResults: number = 50): Promise<JiraProject[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/project/search?maxResults=${maxResults}`,
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
        return data.values || [];
      },
      'getProjects'
    );

    if (!result.success) {
      console.error('[JiraAPI] Failed to get projects:', result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Create a new issue
   */
  async createIssue(request: CreateIssueRequest): Promise<JiraIssue | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        // Build the issue payload
        const payload: any = {
          fields: {
            project: {
              key: request.projectKey,
            },
            summary: request.summary,
            issuetype: {
              name: request.issueType,
            },
          },
        };

        // Add optional fields
        if (request.description) {
          // Jira Cloud uses Atlassian Document Format (ADF) for descriptions
          payload.fields.description = {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: request.description,
                  },
                ],
              },
            ],
          };
        }

        if (request.priority) {
          payload.fields.priority = { name: request.priority };
        }

        if (request.assignee) {
          payload.fields.assignee = { accountId: request.assignee };
        }

        if (request.labels && request.labels.length > 0) {
          payload.fields.labels = request.labels;
        }

        // Add custom fields
        if (request.customFields) {
          Object.assign(payload.fields, request.customFields);
        }

        console.log('[JiraAPI] Creating issue:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${this.baseUrl}/issue`, {
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
          throw new Error(`Failed to create issue: ${response.status} - ${error}`);
        }

        const created = await response.json();
        console.log(`[JiraAPI] Issue created: ${created.key} (${created.id})`);

        // Get full issue details
        return await this.getIssue(created.key);
      },
      'createIssue'
    );

    if (!result.success) {
      console.error('[JiraAPI] Failed to create issue:', result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Update an existing issue
   */
  async updateIssue(request: UpdateIssueRequest): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const payload: any = {
          fields: {},
        };

        if (request.summary) {
          payload.fields.summary = request.summary;
        }

        if (request.description) {
          payload.fields.description = {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: request.description,
                  },
                ],
              },
            ],
          };
        }

        if (request.priority) {
          payload.fields.priority = { name: request.priority };
        }

        if (request.assignee) {
          payload.fields.assignee = { accountId: request.assignee };
        }

        if (request.labels) {
          payload.fields.labels = request.labels;
        }

        if (request.customFields) {
          Object.assign(payload.fields, request.customFields);
        }

        console.log(`[JiraAPI] Updating issue ${request.issueIdOrKey}:`, JSON.stringify(payload, null, 2));

        const response = await fetch(`${this.baseUrl}/issue/${request.issueIdOrKey}`, {
          method: 'PUT',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update issue: ${response.status} - ${error}`);
        }

        console.log(`[JiraAPI] Issue ${request.issueIdOrKey} updated successfully`);
        return true;
      },
      'updateIssue'
    );

    return result.success;
  }

  /**
   * Get a single issue by ID or key
   */
  async getIssue(issueIdOrKey: string): Promise<JiraIssue | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}`, {
          method: 'GET',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Issue ${issueIdOrKey} not found`);
          }
          const error = await response.text();
          throw new Error(`Failed to get issue: ${response.status} - ${error}`);
        }

        const issue = await response.json();
        return issue;
      },
      'getIssue'
    );

    if (!result.success) {
      console.error(`[JiraAPI] Failed to get issue ${issueIdOrKey}:`, result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Search issues using JQL (Jira Query Language)
   */
  async searchIssues(request: JQLSearchRequest): Promise<JiraIssue[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const params = new URLSearchParams({
          jql: request.jql,
          startAt: String(request.startAt || 0),
          maxResults: String(request.maxResults || 50),
        });

        if (request.fields && request.fields.length > 0) {
          params.append('fields', request.fields.join(','));
        }

        const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to search issues: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log(`[JiraAPI] Found ${data.total} issues matching JQL: ${request.jql}`);
        return data.issues || [];
      },
      'searchIssues'
    );

    if (!result.success) {
      console.error('[JiraAPI] Failed to search issues:', result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Transition an issue (change status)
   */
  async transitionIssue(issueIdOrKey: string, transitionId: string): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const payload = {
          transition: {
            id: transitionId,
          },
        };

        const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}/transitions`, {
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
          throw new Error(`Failed to transition issue: ${response.status} - ${error}`);
        }

        console.log(`[JiraAPI] Issue ${issueIdOrKey} transitioned successfully`);
        return true;
      },
      'transitionIssue'
    );

    return result.success;
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueIdOrKey: string): Promise<any[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}/transitions`, {
          method: 'GET',
          headers: {
            'Authorization': this.authHeader,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get transitions: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.transitions || [];
      },
      'getTransitions'
    );

    if (!result.success) {
      console.error(`[JiraAPI] Failed to get transitions for ${issueIdOrKey}:`, result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueIdOrKey: string, comment: string): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const payload = {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment,
                  },
                ],
              },
            ],
          },
        };

        const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}/comment`, {
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
          throw new Error(`Failed to add comment: ${response.status} - ${error}`);
        }

        console.log(`[JiraAPI] Comment added to ${issueIdOrKey}`);
        return true;
      },
      'addComment'
    );

    return result.success;
  }
}
