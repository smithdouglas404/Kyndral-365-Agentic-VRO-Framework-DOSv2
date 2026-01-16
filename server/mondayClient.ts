import { storage } from "./storage";

export interface MondayConfig {
  apiKey: string;
}

export interface MondayBoard {
  id: string;
  name: string;
  description: string;
  state: string;
  board_kind: string;
  owner: { id: string; name: string };
}

export interface MondayGroup {
  id: string;
  title: string;
  color: string;
  position: string;
}

export interface MondayItem {
  id: string;
  name: string;
  state: string;
  group: { id: string; title: string };
  column_values: MondayColumnValue[];
  subitems?: MondayItem[];
  parent_item?: { id: string };
}

export interface MondayColumnValue {
  id: string;
  title: string;
  text: string;
  value: string;
  type: string;
}

export interface MondaySyncResult {
  projectsCreated: number;
  featuresCreated: number;
  storiesCreated: number;
  tasksCreated: number;
  errors: string[];
}

export class MondayClient {
  private baseUrl = 'https://api.monday.com/v2';
  private apiKey: string;

  constructor(config: MondayConfig) {
    this.apiKey = config.apiKey;
  }

  private async graphql<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Monday.com API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Monday.com GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.graphql(`query { me { id name } }`);
      return { success: true, message: 'Successfully connected to Monday.com' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getBoards(): Promise<MondayBoard[]> {
    const query = `
      query {
        boards(limit: 50) {
          id
          name
          description
          state
          board_kind
          owner {
            id
            name
          }
        }
      }
    `;
    const data = await this.graphql<{ boards: MondayBoard[] }>(query);
    return data.boards || [];
  }

  async getBoard(boardId: string): Promise<MondayBoard> {
    const query = `
      query($boardId: [ID!]) {
        boards(ids: $boardId) {
          id
          name
          description
          state
          board_kind
          owner {
            id
            name
          }
        }
      }
    `;
    const data = await this.graphql<{ boards: MondayBoard[] }>(query, { boardId: [boardId] });
    if (!data.boards || data.boards.length === 0) {
      throw new Error(`Board not found: ${boardId}`);
    }
    return data.boards[0];
  }

  async getGroups(boardId: string): Promise<MondayGroup[]> {
    const query = `
      query($boardId: [ID!]) {
        boards(ids: $boardId) {
          groups {
            id
            title
            color
            position
          }
        }
      }
    `;
    const data = await this.graphql<{ boards: { groups: MondayGroup[] }[] }>(query, { boardId: [boardId] });
    return data.boards[0]?.groups || [];
  }

  async getItems(boardId: string): Promise<MondayItem[]> {
    const query = `
      query($boardId: [ID!]) {
        boards(ids: $boardId) {
          items_page(limit: 500) {
            items {
              id
              name
              state
              group {
                id
                title
              }
              column_values {
                id
                title: text
                text
                value
                type
              }
              subitems {
                id
                name
                state
                column_values {
                  id
                  title: text
                  text
                  value
                  type
                }
              }
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ boards: { items_page: { items: MondayItem[] } }[] }>(query, { boardId: [boardId] });
    return data.boards[0]?.items_page?.items || [];
  }

  private getColumnValue(item: MondayItem, columnTitle: string): string {
    const col = item.column_values?.find(c => 
      c.id.toLowerCase().includes(columnTitle.toLowerCase()) ||
      (c.title && c.title.toLowerCase().includes(columnTitle.toLowerCase()))
    );
    return col?.text || '';
  }

  private mapMondayStateToSafe(state: string, statusText: string): string {
    const combined = `${state} ${statusText}`.toLowerCase();
    if (combined.includes('done') || combined.includes('complete') || combined.includes('closed')) {
      return 'completed';
    }
    if (combined.includes('working') || combined.includes('progress') || combined.includes('active')) {
      return 'in-progress';
    }
    return 'not-started';
  }

  private mapMondayPriorityToSafe(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower.includes('urgent')) {
      return 'critical';
    }
    if (priorityLower.includes('high')) {
      return 'high';
    }
    if (priorityLower.includes('low')) {
      return 'low';
    }
    return 'medium';
  }

  async syncBoard(boardId: string, sourceSystemId: string): Promise<MondaySyncResult> {
    const result: MondaySyncResult = {
      projectsCreated: 0,
      featuresCreated: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      errors: [],
    };

    try {
      const board = await this.getBoard(boardId);

      const existingProjects = await storage.getProjects();
      let project = existingProjects.find(p => p.name === board.name);

      if (!project) {
        project = await storage.createProject({
          name: board.name,
          description: board.description || `Imported from Monday.com`,
          status: 'green',
        });
        result.projectsCreated++;
      }

      const groups = await this.getGroups(boardId);
      const groupIdMap: Record<string, string> = {};

      for (const group of groups) {
        try {
          const feature = await storage.createFeature({
            projectId: project.id,
            name: group.title,
            description: `Group from Monday.com board`,
            status: 'not-started',
            priority: 'medium',
          });
          groupIdMap[group.id] = feature.id;
          result.featuresCreated++;
        } catch (error: any) {
          result.errors.push(`Failed to create feature from group ${group.title}: ${error.message}`);
        }
      }

      const items = await this.getItems(boardId);
      const itemIdMap: Record<string, string> = {};

      for (const item of items) {
        try {
          const featureId = item.group?.id ? groupIdMap[item.group.id] : Object.values(groupIdMap)[0];
          
          if (!featureId) {
            result.errors.push(`Item ${item.name} has no parent group, skipping`);
            continue;
          }

          const statusText = this.getColumnValue(item, 'status');
          const priority = this.getColumnValue(item, 'priority');
          const assignee = this.getColumnValue(item, 'person') || this.getColumnValue(item, 'owner');

          const story = await storage.createStory({
            projectId: project.id,
            featureId,
            name: item.name,
            description: '',
            status: this.mapMondayStateToSafe(item.state, statusText),
            assignedTeam: assignee,
          });
          itemIdMap[item.id] = story.id;
          result.storiesCreated++;

          if (item.subitems && item.subitems.length > 0) {
            for (const subitem of item.subitems) {
              try {
                const subStatusText = this.getColumnValue(subitem, 'status');
                const subAssignee = this.getColumnValue(subitem, 'person') || this.getColumnValue(subitem, 'owner');

                await storage.createTask({
                  projectId: project.id,
                  featureId,
                  storyId: story.id,
                  name: subitem.name,
                  description: '',
                  status: this.mapMondayStateToSafe(subitem.state, subStatusText),
                  priority: 'medium',
                  assignee: subAssignee,
                });
                result.tasksCreated++;
              } catch (error: any) {
                result.errors.push(`Failed to create task from subitem ${subitem.name}: ${error.message}`);
              }
            }
          }
        } catch (error: any) {
          result.errors.push(`Failed to create story from item ${item.name}: ${error.message}`);
        }
      }

      await storage.createNotification({
        type: 'success',
        title: 'Monday.com Sync Complete',
        message: `Synced ${result.projectsCreated} projects, ${result.featuresCreated} features, ${result.storiesCreated} stories, ${result.tasksCreated} tasks from ${board.name}`,
        severity: result.errors.length > 0 ? 'warning' : 'info',
        source: 'monday_sync',
        sourceId: boardId,
      });

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);

      await storage.createNotification({
        type: 'sync_failure',
        title: 'Monday.com Sync Failed',
        message: error.message,
        severity: 'error',
        source: 'monday_sync',
        sourceId: boardId,
      });
    }

    return result;
  }
}

export async function createMondayClientFromAdapter(adapterId: string): Promise<MondayClient | null> {
  const adapters = await storage.getMcpAdapters();
  const adapter = adapters.find(a => a.id === adapterId);
  if (!adapter || adapter.adapterType !== 'monday') {
    console.error(`Monday.com adapter not found or wrong type: ${adapterId}`);
    return null;
  }

  try {
    const config = JSON.parse(adapter.configuration || '{}');
    
    if (!config.apiKey) {
      console.error('Monday.com adapter missing required field: apiKey');
      return null;
    }
    
    return new MondayClient({
      apiKey: config.apiKey,
    });
  } catch (error) {
    console.error('Failed to create Monday.com client:', error);
    return null;
  }
}
