/**
 * INTEGRATION SYNC SERVICE
 *
 * Implements real data synchronization for major PM tools:
 * - Jira (REST API)
 * - Azure DevOps (REST API)
 * - ServiceNow (REST API)
 * - Monday.com (GraphQL API)
 * - Asana (REST API)
 * - Smartsheet (REST API)
 * - SAP PPM (OData/REST API)
 * - Oracle Primavera (REST API)
 * - Planview (REST API)
 */

import type { IStorage } from '../storage.js';
import type { Integration } from '../../shared/schema.js';
import { decryptFields } from '../lib/encryption.js';

export interface SyncResult {
  success: boolean;
  message: string;
  details: {
    recordsImported: number;
    recordsUpdated: number;
    recordsSkipped: number;
    errors: number;
    errorMessages?: string[];
    duration: number;
    timestamp: string;
  };
}

export interface IntegrationCredentials {
  apiKey?: string;
  apiToken?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  organizationId?: string;
  projectId?: string;
  baseUrl?: string;
  [key: string]: any;
}

export class IntegrationSyncService {
  constructor(private storage: IStorage) {}

  /**
   * Test connection for an integration
   */
  async testConnection(integration: Integration): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // Decrypt credentials
      const decrypted = decryptFields(integration, ['credentials']);
      const credentials = decrypted.credentials as IntegrationCredentials;

      switch (integration.type) {
        case 'jira':
          return await this.testJiraConnection(credentials);
        case 'azure_devops':
          return await this.testAzureDevOpsConnection(credentials);
        case 'servicenow':
          return await this.testServiceNowConnection(credentials);
        case 'monday':
          return await this.testMondayConnection(credentials);
        case 'asana':
          return await this.testAsanaConnection(credentials);
        case 'smartsheet':
          return await this.testSmartsheetConnection(credentials);
        case 'sap_ppm':
          return await this.testSAPPPMConnection(credentials);
        case 'primavera':
          return await this.testPrimaveraConnection(credentials);
        case 'planview':
          return await this.testPlanviewConnection(credentials);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 1,
          errorMessages: [error.message],
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Sync data from an integration
   */
  async syncIntegration(integration: Integration): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // Decrypt credentials
      const decrypted = decryptFields(integration, ['credentials']);
      const credentials = decrypted.credentials as IntegrationCredentials;

      switch (integration.type) {
        case 'jira':
          return await this.syncJira(integration, credentials);
        case 'azure_devops':
          return await this.syncAzureDevOps(integration, credentials);
        case 'servicenow':
          return await this.syncServiceNow(integration, credentials);
        case 'monday':
          return await this.syncMonday(integration, credentials);
        case 'asana':
          return await this.syncAsana(integration, credentials);
        case 'smartsheet':
          return await this.syncSmartsheet(integration, credentials);
        case 'sap_ppm':
          return await this.syncSAPPPM(integration, credentials);
        case 'primavera':
          return await this.syncPrimavera(integration, credentials);
        case 'planview':
          return await this.syncPlanview(integration, credentials);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 1,
          errorMessages: [error.message],
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // ============================================================================
  // JIRA SYNC
  // ============================================================================

  private async testJiraConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();

    if (!credentials.baseUrl || !credentials.apiToken || !credentials.username) {
      throw new Error('Missing required Jira credentials: baseUrl, apiToken, username');
    }

    try {
      // Test Jira connection by fetching server info
      const response = await fetch(`${credentials.baseUrl}/rest/api/3/serverInfo`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.apiToken}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jira API returned ${response.status}: ${response.statusText}`);
      }

      const serverInfo = await response.json();

      return {
        success: true,
        message: `Connected to Jira Cloud (${serverInfo.version})`,
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 0,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`Jira connection failed: ${error.message}`);
    }
  }

  private async syncJira(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsImported = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    try {
      // Fetch projects from Jira
      const projectsResponse = await fetch(`${credentials.baseUrl}/rest/api/3/project/search`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.apiToken}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch Jira projects: ${projectsResponse.statusText}`);
      }

      const projectsData = await projectsResponse.json();
      const jiraProjects = projectsData.values || [];

      // Import each project
      for (const jiraProject of jiraProjects) {
        try {
          // Check if project already exists
          const existing = await this.storage.getProjects();
          const existingProject = existing.find(p =>
            p.externalId === jiraProject.id || p.name === jiraProject.name
          );

          if (existingProject) {
            // Update existing project with latest data from Jira
            await this.storage.updateProject(existingProject.id, {
              name: jiraProject.name,
              description: jiraProject.description || '',
              status: 'active',
              externalId: jiraProject.id,
              externalSource: 'jira',
            });
            recordsUpdated++;
          } else {
            // Create new project
            await this.storage.createProject({
              name: jiraProject.name,
              description: jiraProject.description || '',
              status: 'active',
              startDate: new Date(),
              endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
              owner: 'system',
              budget: '0',
              teamSize: '0',
              priority: 'medium',
              risks: '',
              dependencies: '',
              spi: '0',
              cpi: '0',
              percentComplete: '0',
              externalId: jiraProject.id,
              externalSource: 'jira',
            });
            recordsImported++;
          }

          // Fetch and sync issues (tasks) for this project
          const issuesResponse = await fetch(
            `${credentials.baseUrl}/rest/api/3/search?jql=project=${jiraProject.key}&maxResults=100`,
            {
              headers: {
                'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.apiToken}`).toString('base64')}`,
                'Accept': 'application/json',
              },
            }
          );

          if (issuesResponse.ok) {
            const issuesData = await issuesResponse.json();
            // TODO: Import issues as tasks (would need to extend storage interface)
            console.log(`[Jira Sync] Found ${issuesData.total} issues for project ${jiraProject.name}`);
          }
        } catch (error: any) {
          errors.push(`Failed to import project ${jiraProject.name}: ${error.message}`);
          recordsSkipped++;
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0
          ? `Successfully synced ${recordsImported + recordsUpdated} projects from Jira`
          : `Synced with ${errors.length} errors`,
        details: {
          recordsImported,
          recordsUpdated,
          recordsSkipped,
          errors: errors.length,
          errorMessages: errors.length > 0 ? errors : undefined,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`Jira sync failed: ${error.message}`);
    }
  }

  private mapJiraStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'To Do': 'planning',
      'In Progress': 'active',
      'Done': 'completed',
      'Cancelled': 'on_hold',
    };
    return statusMap[status] || 'active';
  }

  // ============================================================================
  // AZURE DEVOPS SYNC
  // ============================================================================

  private async testAzureDevOpsConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();

    if (!credentials.organizationId || !credentials.accessToken) {
      throw new Error('Missing required Azure DevOps credentials: organizationId, accessToken');
    }

    try {
      const response = await fetch(
        `https://dev.azure.com/${credentials.organizationId}/_apis/projects?api-version=7.0`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`:${credentials.accessToken}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Azure DevOps API returned ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Connected to Azure DevOps',
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 0,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`Azure DevOps connection failed: ${error.message}`);
    }
  }

  private async syncAzureDevOps(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsImported = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    try {
      // Fetch projects from Azure DevOps
      const response = await fetch(
        `https://dev.azure.com/${credentials.organizationId}/_apis/projects?api-version=7.0`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`:${credentials.accessToken}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Azure DevOps projects: ${response.statusText}`);
      }

      const data = await response.json();
      const adoProjects = data.value || [];

      // Import each project
      for (const adoProject of adoProjects) {
        try {
          const existing = await this.storage.getProjects();
          const existingProject = existing.find(p =>
            p.externalId === adoProject.id || p.name === adoProject.name
          );

          if (existingProject) {
            // Update existing project with latest data from Azure DevOps
            await this.storage.updateProject(existingProject.id, {
              name: adoProject.name,
              description: adoProject.description || '',
              status: this.mapAzureStatus(adoProject.state),
              externalId: adoProject.id,
              externalSource: 'azure_devops',
            });
            recordsUpdated++;
          } else {
            await this.storage.createProject({
              name: adoProject.name,
              description: adoProject.description || '',
              status: this.mapAzureStatus(adoProject.state),
              startDate: new Date(),
              endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              owner: 'system',
              budget: '0',
              teamSize: '0',
              priority: 'medium',
              risks: '',
              dependencies: '',
              spi: '0',
              cpi: '0',
              percentComplete: '0',
              externalId: adoProject.id,
              externalSource: 'azure_devops',
            });
            recordsImported++;
          }
        } catch (error: any) {
          errors.push(`Failed to import project ${adoProject.name}: ${error.message}`);
          recordsSkipped++;
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0
          ? `Successfully synced ${recordsImported + recordsUpdated} projects from Azure DevOps`
          : `Synced with ${errors.length} errors`,
        details: {
          recordsImported,
          recordsUpdated,
          recordsSkipped,
          errors: errors.length,
          errorMessages: errors.length > 0 ? errors : undefined,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`Azure DevOps sync failed: ${error.message}`);
    }
  }

  private mapAzureStatus(state: string): string {
    const statusMap: Record<string, string> = {
      'wellFormed': 'active',
      'createPending': 'planning',
      'deleting': 'on_hold',
      'deleted': 'completed',
    };
    return statusMap[state] || 'active';
  }

  // ============================================================================
  // SERVICENOW SYNC
  // ============================================================================

  private async testServiceNowConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();

    if (!credentials.baseUrl || !credentials.username || !credentials.password) {
      throw new Error('Missing required ServiceNow credentials: baseUrl, username, password');
    }

    try {
      const response = await fetch(
        `${credentials.baseUrl}/api/now/table/pm_project?sysparm_limit=1`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ServiceNow API returned ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Connected to ServiceNow',
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 0,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`ServiceNow connection failed: ${error.message}`);
    }
  }

  private async syncServiceNow(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsImported = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    try {
      // Fetch projects from ServiceNow PPM
      const response = await fetch(
        `${credentials.baseUrl}/api/now/table/pm_project?sysparm_limit=100`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ServiceNow projects: ${response.statusText}`);
      }

      const data = await response.json();
      const snowProjects = data.result || [];

      // Import each project
      for (const snowProject of snowProjects) {
        try {
          const existing = await this.storage.getProjects();
          const existingProject = existing.find(p =>
            p.externalId === snowProject.sys_id || p.name === snowProject.short_description
          );

          if (existingProject) {
            // Update existing project with latest data from ServiceNow
            await this.storage.updateProject(existingProject.id, {
              name: snowProject.short_description,
              description: snowProject.description || '',
              status: this.mapServiceNowStatus(snowProject.state),
              startDate: snowProject.start_date ? new Date(snowProject.start_date) : undefined,
              endDate: snowProject.end_date ? new Date(snowProject.end_date) : undefined,
              budget: snowProject.budget || undefined,
              percentComplete: snowProject.percent_complete || undefined,
              externalId: snowProject.sys_id,
              externalSource: 'servicenow',
            });
            recordsUpdated++;
          } else {
            await this.storage.createProject({
              name: snowProject.short_description,
              description: snowProject.description || '',
              status: this.mapServiceNowStatus(snowProject.state),
              startDate: snowProject.start_date ? new Date(snowProject.start_date) : new Date(),
              endDate: snowProject.end_date ? new Date(snowProject.end_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              owner: 'system',
              budget: snowProject.budget || '0',
              teamSize: '0',
              priority: 'medium',
              risks: '',
              dependencies: '',
              spi: '0',
              cpi: '0',
              percentComplete: snowProject.percent_complete || '0',
              externalId: snowProject.sys_id,
              externalSource: 'servicenow',
            });
            recordsImported++;
          }
        } catch (error: any) {
          errors.push(`Failed to import project ${snowProject.short_description}: ${error.message}`);
          recordsSkipped++;
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0
          ? `Successfully synced ${recordsImported + recordsUpdated} projects from ServiceNow`
          : `Synced with ${errors.length} errors`,
        details: {
          recordsImported,
          recordsUpdated,
          recordsSkipped,
          errors: errors.length,
          errorMessages: errors.length > 0 ? errors : undefined,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`ServiceNow sync failed: ${error.message}`);
    }
  }

  private mapServiceNowStatus(state: string): string {
    const statusMap: Record<string, string> = {
      '1': 'planning',     // Pending
      '2': 'active',       // In Progress
      '3': 'completed',    // Completed
      '4': 'on_hold',      // Cancelled
      '5': 'on_hold',      // On Hold
    };
    return statusMap[state] || 'active';
  }

  // ============================================================================
  // UNIVERSAL MCP CONNECTOR IMPLEMENTATIONS
  // All remaining integrations use the Universal MCP Connector
  // ============================================================================

  private async testMondayConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.testUniversalConnection('monday', credentials);
  }

  private async syncMonday(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.syncUniversal('monday', integration);
  }

  private async testAsanaConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.testUniversalConnection('asana', credentials);
  }

  private async syncAsana(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.syncUniversal('asana', integration);
  }

  private async testSmartsheetConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.testUniversalConnection('smartsheet', credentials);
  }

  private async syncSmartsheet(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.syncUniversal('smartsheet', integration);
  }

  private async testSAPPPMConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.testUniversalConnection('sap_ppm', credentials);
  }

  private async syncSAPPPM(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.syncUniversal('sap_ppm', integration);
  }

  private async testPrimaveraConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.testUniversalConnection('primavera', credentials);
  }

  private async syncPrimavera(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.syncUniversal('primavera', integration);
  }

  private async testPlanviewConnection(credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.testUniversalConnection('planview', credentials);
  }

  private async syncPlanview(integration: Integration, credentials: IntegrationCredentials): Promise<SyncResult> {
    return await this.syncUniversal('planview', integration);
  }

  /**
   * Universal connection test using MCP presets
   */
  private async testUniversalConnection(presetName: string, credentials: IntegrationCredentials): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      const { UniversalMCPConnector, MCP_PRESETS } = await import('../mcp/UniversalMCPConnector.js');

      const preset = (MCP_PRESETS as any)[presetName];
      if (!preset) {
        throw new Error(`No preset found for ${presetName}`);
      }

      // Create mock integration for testing
      const mockIntegration: any = {
        connectionDetails: {
          baseUrl: credentials.baseUrl,
          authType: preset.authType,
          apiType: preset.apiType,
          endpoints: preset.endpoints,
          statusMappings: preset.statusMappings,
          pagination: preset.pagination,
        },
        credentials: JSON.stringify(credentials),
        fieldMappings: preset.fieldMappings,
      };

      const connector = new UniversalMCPConnector(mockIntegration);
      const result = await connector.testConnection();

      return {
        success: result.success,
        message: result.message,
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 0,
          duration: result.latency,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 1,
          errorMessages: [error.message],
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Universal sync using MCP presets
   */
  private async syncUniversal(presetName: string, integration: Integration): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      const { UniversalMCPConnector, MCP_PRESETS } = await import('../mcp/UniversalMCPConnector.js');

      const preset = (MCP_PRESETS as any)[presetName];
      if (!preset) {
        throw new Error(`No preset found for ${presetName}`);
      }

      // Parse JSON fields
      const connectionDetails = typeof integration.connectionDetails === 'string'
        ? JSON.parse(integration.connectionDetails)
        : integration.connectionDetails || {};

      const fieldMappings = typeof integration.fieldMappings === 'string'
        ? JSON.parse(integration.fieldMappings)
        : integration.fieldMappings;

      // Merge integration config with preset
      const enrichedIntegration = {
        ...integration,
        connectionDetails: {
          ...connectionDetails,
          ...preset,
        },
        fieldMappings: fieldMappings || preset.fieldMappings,
      };

      const connector = new UniversalMCPConnector(enrichedIntegration as any);
      const syncResult = await connector.syncProjects();

      return {
        success: syncResult.success,
        message: syncResult.message,
        details: {
          recordsImported: syncResult.recordsImported,
          recordsUpdated: syncResult.recordsUpdated,
          recordsSkipped: syncResult.recordsSkipped,
          errors: syncResult.errors.length,
          errorMessages: syncResult.errors.length > 0 ? syncResult.errors : undefined,
          duration: syncResult.duration,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        details: {
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 1,
          errorMessages: [error.message],
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
