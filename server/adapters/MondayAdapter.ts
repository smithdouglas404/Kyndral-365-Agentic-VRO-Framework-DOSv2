/**
 * MONDAY.COM ADAPTER
 *
 * Maps Monday.com items/boards → Canonical Ontology
 *
 * Monday.com Data Model:
 * - Boards (workspaces with items)
 * - Items (rows in boards - projects/tasks)
 * - Columns (custom fields)
 * - Groups (sections within boards)
 * - Workspaces (collections of boards)
 *
 * Canonical Mapping:
 * - Monday Board → Portfolio
 * - Monday Item → Project
 * - Monday Group → Workstream
 * - Monday Workspace → Division
 *
 * API Reference:
 * https://developer.monday.com/api-reference/docs
 */

import { UniversalDataAdapter, UniversalStatus, UniversalPriority, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

export class MondayAdapter extends UniversalDataAdapter {
  constructor(storage: IStorage) {
    super(storage, DataSourceType.MONDAY);
  }

  /**
   * Monday Status Label → Universal Status Mapping
   *
   * Monday uses customizable status columns
   */
  protected statusMapping: Record<string, UniversalStatus> = {
    'not started': UniversalStatus.PLANNED,
    'planned': UniversalStatus.PLANNED,

    'working on it': UniversalStatus.ACTIVE,
    'in progress': UniversalStatus.ACTIVE,
    'active': UniversalStatus.ACTIVE,

    'done': UniversalStatus.COMPLETED,
    'complete': UniversalStatus.COMPLETED,
    'closed': UniversalStatus.COMPLETED,

    'stuck': UniversalStatus.AT_RISK,
    'blocked': UniversalStatus.AT_RISK,

    'on hold': UniversalStatus.ON_HOLD,
    'paused': UniversalStatus.ON_HOLD,
  };

  /**
   * Monday Priority → Universal Priority Mapping
   */
  protected priorityMapping: Record<string, UniversalPriority> = {
    'critical': UniversalPriority.CRITICAL,
    'urgent': UniversalPriority.CRITICAL,
    'high': UniversalPriority.HIGH,
    'medium': UniversalPriority.MEDIUM,
    'low': UniversalPriority.LOW,
  };

  /**
   * Monday Field Names → Canonical Field Names
   *
   * Monday uses GraphQL API with dynamic column structure
   */
  protected fieldMapping: Record<string, string> = {
    externalId: 'id',
    name: 'name',
  };

  /**
   * Monday-specific transformation logic
   */
  async transform(rawItem: any): Promise<any> {
    // Monday-specific preprocessing
    const preprocessed = this.preprocessMondayData(rawItem);

    // Call base transformation
    const result = await super.transform(preprocessed);

    if (result.success && result.canonicalProject) {
      // Monday-specific post-processing
      result.canonicalProject = this.postProcessMondayData(result.canonicalProject, rawItem);
    }

    return result;
  }

  /**
   * Preprocess Monday data before transformation
   */
  private preprocessMondayData(item: any): any {
    const processed: any = {
      id: item.id,
      name: item.name,
    };

    // Parse column values
    if (item.column_values) {
      for (const column of item.column_values) {
        const columnTitle = column.title?.toLowerCase() || '';
        const columnType = column.type;

        try {
          let value = column.text || column.value;

          // Parse JSON values
          if (typeof column.value === 'string' && (column.value.startsWith('{') || column.value.startsWith('['))) {
            try {
              value = JSON.parse(column.value);
            } catch {
              // Keep as string
            }
          }

          // Map common column types
          if (columnType === 'status' || columnTitle.includes('status')) {
            processed.status = column.text || value?.label;
          } else if (columnTitle.includes('priority')) {
            processed.priority = column.text || value?.label;
          } else if (columnType === 'date' || columnTitle.includes('start')) {
            if (value?.date) {
              processed.startDate = value.date;
            }
          } else if (columnType === 'date' || columnTitle.includes('end') || columnTitle.includes('due')) {
            if (value?.date) {
              processed.endDate = value.date;
            }
          } else if (columnType === 'numbers' || columnTitle.includes('budget')) {
            processed.budget = parseFloat(column.text || value || '0');
          } else if (columnTitle.includes('spent')) {
            processed.budgetSpent = parseFloat(column.text || value || '0');
          } else if (columnType === 'progress' || columnTitle.includes('progress')) {
            processed.percentComplete = parseInt(column.text || value || '0');
          } else if (columnType === 'people' || columnTitle.includes('owner') || columnTitle.includes('assigned')) {
            if (value?.personsAndTeams) {
              processed.owner = value.personsAndTeams.map((p: any) => p.name).join(', ');
            }
          } else if (columnType === 'long-text' || columnTitle.includes('description')) {
            processed.description = column.text || value;
          } else if (columnTitle.includes('portfolio') || columnTitle.includes('theme')) {
            processed.portfolioTheme = column.text || value;
          } else if (columnTitle.includes('roi')) {
            processed.expectedROI = parseFloat(column.text || value || '0');
          }
        } catch (error) {
          console.warn(`[MondayAdapter] Error parsing column ${column.title}:`, error);
        }
      }
    }

    // Extract group (workstream)
    if (item.group?.title) {
      processed.workstream = item.group.title;
    }

    return processed;
  }

  /**
   * Post-process after transformation
   */
  private postProcessMondayData(canonical: any, rawItem: any): any {
    // Extract board info (portfolio)
    if (rawItem.board?.name) {
      canonical.portfolioTheme = rawItem.board.name;
    }

    // Extract workspace (division)
    if (rawItem.board?.workspace?.name) {
      canonical.divisionId = rawItem.board.workspace.name;
    }

    // Extract group (workstream)
    if (rawItem.group?.title) {
      canonical.workstream = rawItem.group.title;
    }

    // Count subitems
    if (rawItem.subitems) {
      canonical.subtaskCount = rawItem.subitems.length;
    }

    // Count updates (comments)
    if (rawItem.updates) {
      canonical.commentCount = rawItem.updates.length;
    }

    return canonical;
  }

  /**
   * Fetch items from Monday.com API using GraphQL
   */
  async fetchFromMonday(config: {
    apiToken: string;
    boardId?: string;
    workspaceId?: string;
  }): Promise<any[]> {
    try {
      const { apiToken, boardId, workspaceId } = config;

      let items: any[] = [];

      if (boardId) {
        // Fetch items from specific board
        items = await this.fetchBoardItems(apiToken, boardId);
      } else if (workspaceId) {
        // Fetch all boards in workspace, then items
        const boards = await this.fetchWorkspaceBoards(apiToken, workspaceId);
        for (const board of boards) {
          const boardItems = await this.fetchBoardItems(apiToken, board.id);
          items.push(...boardItems);
        }
      } else {
        // Fetch all boards accessible to user
        const boards = await this.fetchAllBoards(apiToken);
        console.log(`[MondayAdapter] Found ${boards.length} boards`);

        // Limit to first 10 boards for large accounts
        const boardsToFetch = boards.slice(0, 10);
        for (const board of boardsToFetch) {
          const boardItems = await this.fetchBoardItems(apiToken, board.id);
          items.push(...boardItems);
        }
      }

      console.log(`[MondayAdapter] Fetched ${items.length} total items`);
      return items;

    } catch (error: any) {
      console.error('[MondayAdapter] Error fetching from Monday:', error);
      throw error;
    }
  }

  /**
   * Fetch all boards
   */
  private async fetchAllBoards(apiToken: string): Promise<any[]> {
    const query = `query {
      boards(limit: 100) {
        id
        name
        workspace {
          id
          name
        }
      }
    }`;

    return this.executeMondayQuery(apiToken, query, 'boards');
  }

  /**
   * Fetch boards in workspace
   */
  private async fetchWorkspaceBoards(apiToken: string, workspaceId: string): Promise<any[]> {
    const query = `query {
      boards(workspace_ids: [${workspaceId}], limit: 100) {
        id
        name
      }
    }`;

    return this.executeMondayQuery(apiToken, query, 'boards');
  }

  /**
   * Fetch items from a board
   */
  private async fetchBoardItems(apiToken: string, boardId: string): Promise<any[]> {
    const query = `query {
      boards(ids: [${boardId}]) {
        id
        name
        workspace {
          id
          name
        }
        items_page(limit: 500) {
          items {
            id
            name
            group {
              id
              title
            }
            column_values {
              id
              title
              type
              text
              value
            }
            subitems {
              id
            }
            updates {
              id
            }
          }
        }
      }
    }`;

    const result = await this.executeMondayQuery(apiToken, query, 'boards');

    if (result.length > 0 && result[0].items_page?.items) {
      // Add board reference to each item
      return result[0].items_page.items.map((item: any) => ({
        ...item,
        board: {
          id: result[0].id,
          name: result[0].name,
          workspace: result[0].workspace,
        },
      }));
    }

    return [];
  }

  /**
   * Execute Monday.com GraphQL query
   */
  private async executeMondayQuery(apiToken: string, query: string, dataKey: string): Promise<any> {
    const url = 'https://api.monday.com/v2';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiToken,
        'Content-Type': 'application/json',
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Monday API error: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`Monday GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data?.[dataKey] || [];
  }

  /**
   * Test connection to Monday.com
   */
  async testConnection(config: {
    apiToken: string;
  }): Promise<{ success: boolean; message: string; userInfo?: any }> {
    try {
      const { apiToken } = config;

      const query = `query {
        me {
          id
          name
          email
          account {
            name
          }
        }
      }`;

      const result = await this.executeMondayQuery(apiToken, query, 'me');

      return {
        success: true,
        message: 'Connection successful',
        userInfo: {
          id: result.id,
          name: result.name,
          email: result.email,
          account: result.account?.name,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }
}
