/**
 * SERVICENOW MCP SERVICE
 * Real API integration for ServiceNow
 */

export interface ServiceNowConfig {
  instance: string; // e.g., "dev12345.service-now.com"
  username: string;
  password: string;
}

export interface ServiceNowIncident {
  sys_id?: string;
  number?: string;
  short_description: string;
  description?: string;
  urgency?: '1' | '2' | '3'; // 1=High, 2=Medium, 3=Low
  impact?: '1' | '2' | '3';
  priority?: '1' | '2' | '3' | '4' | '5';
  assignment_group?: string;
  assigned_to?: string;
  state?: '1' | '2' | '3' | '6' | '7' | '8'; // 1=New, 2=In Progress, 6=Resolved, 7=Closed, etc.
  category?: string;
  subcategory?: string;
  caller_id?: string;
  [key: string]: any;
}

export class ServiceNowService {
  private config: ServiceNowConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ServiceNowConfig) {
    this.config = config;
    this.baseUrl = `https://${config.instance}/api/now`;

    // ServiceNow uses Basic Auth
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Create a new ServiceNow incident
   */
  async createIncident(incident: ServiceNowIncident): Promise<any> {
    const response = await fetch(`${this.baseUrl}/table/incident`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(incident),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ServiceNow API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[ServiceNow] Created incident: ${data.result.number}`);
    return data.result;
  }

  /**
   * Update an existing ServiceNow incident
   */
  async updateIncident(sysId: string, updates: Partial<ServiceNowIncident>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/table/incident/${sysId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ServiceNow API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[ServiceNow] Updated incident: ${data.result.number}`);
    return data.result;
  }

  /**
   * Get a ServiceNow incident by sys_id
   */
  async getIncident(sysId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/table/incident/${sysId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ServiceNow API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[ServiceNow] Retrieved incident: ${data.result.number}`);
    return data.result;
  }

  /**
   * Search for ServiceNow incidents
   */
  async searchIncidents(query: string, limit: number = 50): Promise<any> {
    const response = await fetch(`${this.baseUrl}/table/incident?sysparm_query=${encodeURIComponent(query)}&sysparm_limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': this.authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ServiceNow API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    console.log(`[ServiceNow] Search found ${data.result.length} incidents`);
    return data.result;
  }

  /**
   * Add a work note to an incident
   */
  async addWorkNote(sysId: string, note: string): Promise<any> {
    return await this.updateIncident(sysId, {
      work_notes: note,
    });
  }

  /**
   * Add a comment to an incident
   */
  async addComment(sysId: string, comment: string): Promise<any> {
    return await this.updateIncident(sysId, {
      comments: comment,
    });
  }

  /**
   * Resolve an incident
   */
  async resolveIncident(sysId: string, resolutionNotes: string): Promise<any> {
    return await this.updateIncident(sysId, {
      state: '6', // Resolved
      close_notes: resolutionNotes,
      close_code: 'Solved (Permanently)',
    });
  }

  /**
   * Close an incident
   */
  async closeIncident(sysId: string, closeNotes: string): Promise<any> {
    return await this.updateIncident(sysId, {
      state: '7', // Closed
      close_notes: closeNotes,
      close_code: 'Closed/Resolved by Caller',
    });
  }
}
