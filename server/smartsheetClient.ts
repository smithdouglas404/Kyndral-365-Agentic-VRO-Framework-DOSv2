import { storage } from "./storage";

export interface SmartsheetConfig {
  accessToken: string;
}

export interface SmartsheetSheet {
  id: number;
  name: string;
  permalink: string;
  createdAt: string;
  modifiedAt: string;
  totalRowCount: number;
}

export interface SmartsheetRow {
  id: number;
  sheetId: number;
  rowNumber: number;
  expanded: boolean;
  createdAt: string;
  modifiedAt: string;
  cells: SmartsheetCell[];
  parentId?: number;
  siblingId?: number;
}

export interface SmartsheetCell {
  columnId: number;
  value: any;
  displayValue: string;
  formula?: string;
}

export interface SmartsheetColumn {
  id: number;
  index: number;
  title: string;
  type: string;
  primary: boolean;
}

export interface SmartsheetSyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class SmartsheetClient {
  private baseUrl = 'https://api.smartsheet.com/2.0';
  private accessToken: string;

  constructor(config: SmartsheetConfig) {
    this.accessToken = config.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Smartsheet API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/users/me');
      return { success: true, message: 'Successfully connected to Smartsheet' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getSheets(): Promise<SmartsheetSheet[]> {
    const response = await this.request<{ data: SmartsheetSheet[] }>('/sheets');
    return response.data || [];
  }

  async getSheet(sheetId: string): Promise<{ sheet: SmartsheetSheet; columns: SmartsheetColumn[]; rows: SmartsheetRow[] }> {
    const response = await this.request<any>(`/sheets/${sheetId}`);
    return {
      sheet: response,
      columns: response.columns || [],
      rows: response.rows || [],
    };
  }

  async getWorkspaces(): Promise<any[]> {
    const response = await this.request<{ data: any[] }>('/workspaces');
    return response.data || [];
  }

  async getWorkspace(workspaceId: string): Promise<any> {
    return this.request(`/workspaces/${workspaceId}`);
  }

  private getCellValue(row: SmartsheetRow, columnId: number): string {
    const cell = row.cells.find(c => c.columnId === columnId);
    return cell?.displayValue || cell?.value?.toString() || '';
  }

  private findColumnByTitle(columns: SmartsheetColumn[], title: string): SmartsheetColumn | undefined {
    const lowerTitle = title.toLowerCase();
    return columns.find(c => 
      c.title.toLowerCase().includes(lowerTitle) ||
      c.title.toLowerCase() === lowerTitle
    );
  }

  private mapSmartsheetStatusToSafe(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('done') || statusLower.includes('closed')) {
      return 'completed';
    }
    if (statusLower.includes('progress') || statusLower.includes('active') || statusLower.includes('working')) {
      return 'in-progress';
    }
    return 'not-started';
  }

  private mapSmartsheetPriorityToSafe(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower.includes('urgent') || priorityLower === 'high') {
      return 'high';
    }
    if (priorityLower.includes('low')) {
      return 'low';
    }
    return 'medium';
  }

  async syncSheet(sheetId: string, sourceSystemId: string): Promise<SmartsheetSyncResult> {
    const result: SmartsheetSyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const { sheet, columns, rows } = await this.getSheet(sheetId);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === sheet.name);

      if (!project) {
        project = await storage.createProject({
          name: sheet.name,
          description: `Imported from Smartsheet: ${sheet.permalink || ''}`,
          status: 'green',
        });
        result.projectsCreated++;
      }

      const titleCol = columns.find(c => c.primary) || columns[0];
      const statusCol = this.findColumnByTitle(columns, 'status');
      const priorityCol = this.findColumnByTitle(columns, 'priority');
      const assigneeCol = this.findColumnByTitle(columns, 'assigned') || this.findColumnByTitle(columns, 'owner');
      const descCol = this.findColumnByTitle(columns, 'description') || this.findColumnByTitle(columns, 'notes');

      const parentRows = rows.filter(r => !r.parentId);
      const childRows = rows.filter(r => r.parentId);

      const featureIdMap: Record<number, string> = {};

      for (const row of parentRows) {
        try {
          const name = this.getCellValue(row, titleCol.id);
          const status = statusCol ? this.getCellValue(row, statusCol.id) : '';
          const priority = priorityCol ? this.getCellValue(row, priorityCol.id) : '';
          const description = descCol ? this.getCellValue(row, descCol.id) : '';

          const feature = await storage.createFeature({
            projectId: project.id,
            name: name || `Row ${row.rowNumber}`,
            description,
            status: this.mapSmartsheetStatusToSafe(status),
            priority: this.mapSmartsheetPriorityToSafe(priority),
          });
          featureIdMap[row.id] = feature.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from row ${row.rowNumber}: ${error.message}`);
        }
      }

      const storyIdMap: Record<number, string> = {};
      const defaultFeatureId = Object.values(featureIdMap)[0];

      if (defaultFeatureId) {
        for (const row of childRows) {
          try {
            const name = this.getCellValue(row, titleCol.id);
            const status = statusCol ? this.getCellValue(row, statusCol.id) : '';
            const assignee = assigneeCol ? this.getCellValue(row, assigneeCol.id) : '';
            const description = descCol ? this.getCellValue(row, descCol.id) : '';
            const featureId = row.parentId ? featureIdMap[row.parentId] : defaultFeatureId;

            const hasChildren = rows.some(r => r.parentId === row.id);

            if (hasChildren) {
              const story = await storage.createStory({
                projectId: project.id,
                featureId: featureId || defaultFeatureId,
                name: name || `Row ${row.rowNumber}`,
                description,
                status: this.mapSmartsheetStatusToSafe(status),
                assignedTeam: assignee,
              });
              storyIdMap[row.id] = story.id;
              result.storiesCreated++;
            } else {
              const storyId = row.parentId ? storyIdMap[row.parentId] : null;
              
              if (storyId) {
                await storage.createTask({
                  projectId: project.id,
                  featureId: featureId || defaultFeatureId,
                  storyId,
                  name: name || `Row ${row.rowNumber}`,
                  description,
                  status: this.mapSmartsheetStatusToSafe(status),
                  priority: 'medium',
                  assignee,
                });
                result.tasksCreated++;
              } else {
                const story = await storage.createStory({
                  projectId: project.id,
                  featureId: featureId || defaultFeatureId,
                  name: name || `Row ${row.rowNumber}`,
                  description,
                  status: this.mapSmartsheetStatusToSafe(status),
                  assignedTeam: assignee,
                });
                storyIdMap[row.id] = story.id;
                result.storiesCreated++;
              }
            }
          } catch (error: any) {
            result.errors.push(`Failed to process row ${row.rowNumber}: ${error.message}`);
          }
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Smartsheet Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from ${sheet.name}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'smartsheet_sync',
        sourceId: sheetId,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'Smartsheet Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'smartsheet_sync',
        sourceId: sheetId,
      });
    }

    return result;
  }
}

export async function createSmartsheetClientFromAdapter(adapterId: string): Promise<SmartsheetClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'smartsheet') {
    console.error(`Smartsheet adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.accessToken) {
      console.error('Smartsheet adapter missing required field: accessToken');
      return null;
    }
    
    return new SmartsheetClient({
      accessToken: config.accessToken,
    });
  } catch (error) {
    console.error('Failed to create Smartsheet client:', error);
    return null;
  }
}
