/**
 * JIRA MCP SERVICE
 * Real API integration for Jira Cloud
 */

export interface JiraConfig {
  domain: string; // e.g., "mycompany.atlassian.net"
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id?: string;
  key?: string;
  fields: {
    project: { key: string };
    summary: string;
    description?: string;
    issuetype: { name: string };
    priority?: { name: string };
    assignee?: { accountId: string } | null;
    labels?: string[];
    [key: string]: any;
  };
}

export class JiraService {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `https://${config.domain}/rest/api/3`;

    // Jira uses Basic Auth with email:apiToken
    const credentials = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Create a new Jira issue
   */
  async createIssue(issue: JiraIssue): Promise<any> {
    const response = await fetch(`${this.baseUrl}/issue`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ fields: issue.fields }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[Jira] Created issue: ${data.key}`);
    return data;
  }

  /**
   * Update an existing Jira issue
   */
  async updateIssue(issueIdOrKey: string, updates: Partial<JiraIssue>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ fields: updates.fields || updates }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    console.log(`[Jira] Updated issue: ${issueIdOrKey}`);
    return { success: true, issueIdOrKey };
  }

  /**
   * Get a Jira issue by ID or key
   */
  async getIssue(issueIdOrKey: string, fields?: string[]): Promise<any> {
    const fieldsParam = fields ? `?fields=${fields.join(',')}` : '';
    const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}${fieldsParam}`, {
      method: 'GET',
      headers: {
        'Authorization': this.authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[Jira] Retrieved issue: ${data.key}`);
    return data;
  }

  /**
   * Search for Jira issues using JQL
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<any> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ jql, maxResults }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[Jira] Search found ${data.total} issues`);
    return data;
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueIdOrKey: string, comment: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}/comment`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: comment }],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[Jira] Added comment to ${issueIdOrKey}`);
    return data;
  }

  /**
   * Transition an issue (change status)
   */
  async transitionIssue(issueIdOrKey: string, transitionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/issue/${issueIdOrKey}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        transition: { id: transitionId },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    console.log(`[Jira] Transitioned issue ${issueIdOrKey} to ${transitionId}`);
    return { success: true };
  }
}
