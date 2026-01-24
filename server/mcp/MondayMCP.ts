/**
 * MONDAY.COM MCP (Model Context Protocol) Server
 *
 * Purpose: Enable agents to read project data from Monday.com
 * and perform write operations (create items, update statuses, etc.)
 *
 * Monday.com is a popular work management platform.
 * This MCP allows agents to query and manage:
 * - Boards (work containers)
 * - Items (rows in boards - projects/tasks)
 * - Columns (custom fields)
 * - Groups (sections within boards)
 * - Updates (comments/activity)
 * - Workspaces (board collections)
 *
 * API: Monday.com uses GraphQL exclusively
 * Reference: https://developer.monday.com/api-reference/docs
 */

import { MCPBase } from './base/MCPBase.js';
import type { IStorage } from '../storage.js';

interface MondayConfig {
  apiKey: string;
  apiVersion?: string;
}

interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  state: string; // active, archived, deleted
  boardKind: string; // public, private, share
  itemsCount?: number;
  groups: MondayGroup[];
  columns: MondayColumn[];
}

interface MondayGroup {
  id: string;
  title: string;
  color?: string;
  position?: string;
}

interface MondayColumn {
  id: string;
  title: string;
  type: string; // text, status, date, people, numbers, etc.
  settings_str?: string; // JSON string of column settings
}

interface MondayItem {
  id: string;
  name: string;
  board: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    title: string;
  };
  state: string; // active, archived, deleted
  column_values: MondayColumnValue[];
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
}

interface MondayColumnValue {
  id: string;
  title: string;
  type: string;
  text?: string;
  value?: string; // JSON string
}

interface MondayUpdate {
  id: string;
  body: string;
  created_at: string;
  creator: {
    id: string;
    name: string;
  };
}

interface MondayUser {
  id: string;
  name: string;
  email: string;
  title?: string;
  photo_small?: string;
}

export class MondayMCP extends MCPBase {
  private config: MondayConfig;
  private apiUrl: string = 'https://api.monday.com/v2';

  constructor(storage: IStorage, config?: Partial<MondayConfig>) {
    super(storage, 'MondayMCP', {
      circuitBreaker: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 60000,
        monitoringPeriod: 120000,
      },
      rateLimiter: {
        maxRequests: 60, // Monday.com has rate limits
        windowMs: 60000,
      },
      retry: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '429', '503', '504'],
      },
    });

    this.config = {
      apiKey: config?.apiKey || process.env.MONDAY_API_KEY || '',
      apiVersion: config?.apiVersion || 'v2',
    };

    if (!this.config.apiKey) {
      console.warn('[MondayMCP] No API key provided - set MONDAY_API_KEY environment variable');
    }

    console.log('[MondayMCP] Initialized with production-grade safeguards');
  }

  /**
   * Test connection to Monday.com
   */
  async testConnection(): Promise<boolean> {
    try {
      const query = `query { me { id name email } }`;
      const result = await this.executeQuery(query);
      return !!result?.data?.me;
    } catch (error) {
      console.error('[MondayMCP] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute a GraphQL query against Monday.com API
   */
  private async executeQuery(query: string, variables?: Record<string, any>): Promise<any> {
    const result = await this.executeWithSafeguards(async () => {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiKey,
          'API-Version': this.config.apiVersion || '2024-01',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Monday.com API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`Monday.com GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data;
    }, 'GraphQL Query');

    if (!result.success) {
      throw result.error || new Error('Query execution failed');
    }

    return result.data;
  }

  /**
   * Fetch all boards
   */
  async fetchBoards(options?: {
    limit?: number;
    state?: 'active' | 'archived' | 'deleted' | 'all';
  }): Promise<MondayBoard[]> {
    try {
      const limit = options?.limit || 50;
      const state = options?.state || 'active';

      const query = `
        query ($limit: Int!, $state: State!) {
          boards(limit: $limit, state: $state) {
            id
            name
            description
            state
            board_kind
            items_count
            groups {
              id
              title
              color
            }
            columns {
              id
              title
              type
              settings_str
            }
          }
        }
      `;

      const data = await this.executeQuery(query, { limit, state });
      return data?.data?.boards || [];
    } catch (error) {
      console.error('[MondayMCP] Error fetching boards:', error);
      return [];
    }
  }

  /**
   * Fetch items from a specific board
   */
  async fetchBoardItems(boardId: string, options?: {
    limit?: number;
    page?: number;
  }): Promise<MondayItem[]> {
    try {
      const limit = options?.limit || 100;
      const page = options?.page || 1;

      const query = `
        query ($boardId: [ID!]!, $limit: Int!, $page: Int!) {
          boards(ids: $boardId) {
            items_page(limit: $limit, query_params: {page: $page}) {
              items {
                id
                name
                state
                created_at
                updated_at
                creator_id
                board {
                  id
                  name
                }
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
              }
            }
          }
        }
      `;

      const data = await this.executeQuery(query, {
        boardId: [boardId],
        limit,
        page
      });

      return data?.data?.boards?.[0]?.items_page?.items || [];
    } catch (error) {
      console.error(`[MondayMCP] Error fetching items for board ${boardId}:`, error);
      return [];
    }
  }

  /**
   * Fetch a specific item by ID
   */
  async fetchItem(itemId: string): Promise<MondayItem | null> {
    try {
      const query = `
        query ($itemId: [ID!]!) {
          items(ids: $itemId) {
            id
            name
            state
            created_at
            updated_at
            creator_id
            board {
              id
              name
            }
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
          }
        }
      `;

      const data = await this.executeQuery(query, { itemId: [itemId] });
      return data?.data?.items?.[0] || null;
    } catch (error) {
      console.error(`[MondayMCP] Error fetching item ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Create a new item in a board
   */
  async createItem(
    boardId: string,
    groupId: string,
    itemName: string,
    columnValues?: Record<string, any>
  ): Promise<MondayItem | null> {
    try {
      const query = `
        mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON) {
          create_item(
            board_id: $boardId,
            group_id: $groupId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
            name
            state
            board {
              id
              name
            }
            group {
              id
              title
            }
          }
        }
      `;

      const data = await this.executeQuery(query, {
        boardId,
        groupId,
        itemName,
        columnValues: columnValues ? JSON.stringify(columnValues) : undefined,
      });

      return data?.data?.create_item || null;
    } catch (error) {
      console.error('[MondayMCP] Error creating item:', error);
      return null;
    }
  }

  /**
   * Update an item's column values
   */
  async updateItemColumnValues(
    itemId: string,
    boardId: string,
    columnValues: Record<string, any>
  ): Promise<boolean> {
    try {
      const query = `
        mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(
            board_id: $boardId,
            item_id: $itemId,
            column_values: $columnValues
          ) {
            id
          }
        }
      `;

      const data = await this.executeQuery(query, {
        boardId,
        itemId,
        columnValues: JSON.stringify(columnValues),
      });

      return !!data?.data?.change_multiple_column_values;
    } catch (error) {
      console.error(`[MondayMCP] Error updating item ${itemId}:`, error);
      return false;
    }
  }

  /**
   * Add an update (comment) to an item
   */
  async createUpdate(itemId: string, body: string): Promise<MondayUpdate | null> {
    try {
      const query = `
        mutation ($itemId: ID!, $body: String!) {
          create_update(item_id: $itemId, body: $body) {
            id
            body
            created_at
            creator {
              id
              name
            }
          }
        }
      `;

      const data = await this.executeQuery(query, { itemId, body });
      return data?.data?.create_update || null;
    } catch (error) {
      console.error(`[MondayMCP] Error creating update for item ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Fetch updates (comments) for an item
   */
  async fetchUpdates(itemId: string, limit: number = 10): Promise<MondayUpdate[]> {
    try {
      const query = `
        query ($itemId: [ID!]!, $limit: Int!) {
          items(ids: $itemId) {
            updates(limit: $limit) {
              id
              body
              created_at
              creator {
                id
                name
              }
            }
          }
        }
      `;

      const data = await this.executeQuery(query, { itemId: [itemId], limit });
      return data?.data?.items?.[0]?.updates || [];
    } catch (error) {
      console.error(`[MondayMCP] Error fetching updates for item ${itemId}:`, error);
      return [];
    }
  }

  /**
   * Archive an item
   */
  async archiveItem(itemId: string): Promise<boolean> {
    try {
      const query = `
        mutation ($itemId: ID!) {
          archive_item(item_id: $itemId) {
            id
          }
        }
      `;

      const data = await this.executeQuery(query, { itemId });
      return !!data?.data?.archive_item;
    } catch (error) {
      console.error(`[MondayMCP] Error archiving item ${itemId}:`, error);
      return false;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<boolean> {
    try {
      const query = `
        mutation ($itemId: ID!) {
          delete_item(item_id: $itemId) {
            id
          }
        }
      `;

      const data = await this.executeQuery(query, { itemId });
      return !!data?.data?.delete_item;
    } catch (error) {
      console.error(`[MondayMCP] Error deleting item ${itemId}:`, error);
      return false;
    }
  }

  /**
   * Fetch current user info
   */
  async fetchCurrentUser(): Promise<MondayUser | null> {
    try {
      const query = `
        query {
          me {
            id
            name
            email
            title
            photo_small
          }
        }
      `;

      const data = await this.executeQuery(query);
      return data?.data?.me || null;
    } catch (error) {
      console.error('[MondayMCP] Error fetching current user:', error);
      return null;
    }
  }

  /**
   * Search items across boards
   */
  async searchItems(query: string, options?: {
    boardIds?: string[];
    limit?: number;
  }): Promise<MondayItem[]> {
    try {
      const limit = options?.limit || 50;
      const boardIds = options?.boardIds || [];

      const graphqlQuery = `
        query ($boardIds: [ID!], $limit: Int!) {
          items_page_by_column_values(
            limit: $limit
            ${boardIds.length > 0 ? 'board_ids: $boardIds' : ''}
            columns: [{ column_id: "name", column_values: ["${query}"] }]
          ) {
            items {
              id
              name
              state
              board {
                id
                name
              }
              group {
                id
                title
              }
              column_values {
                id
                title
                type
                text
              }
            }
          }
        }
      `;

      const data = await this.executeQuery(graphqlQuery, {
        boardIds: boardIds.length > 0 ? boardIds : undefined,
        limit,
      });

      return data?.data?.items_page_by_column_values?.items || [];
    } catch (error) {
      console.error('[MondayMCP] Error searching items:', error);
      return [];
    }
  }

  /**
   * Fetch workspace boards
   */
  async fetchWorkspaceBoards(workspaceId: string): Promise<MondayBoard[]> {
    try {
      const query = `
        query ($workspaceId: [ID!]!) {
          workspaces(ids: $workspaceId) {
            id
            name
            boards {
              id
              name
              description
              state
              board_kind
            }
          }
        }
      `;

      const data = await this.executeQuery(query, { workspaceId: [workspaceId] });
      return data?.data?.workspaces?.[0]?.boards || [];
    } catch (error) {
      console.error(`[MondayMCP] Error fetching boards for workspace ${workspaceId}:`, error);
      return [];
    }
  }

  /**
   * Create a new board
   */
  async createBoard(
    boardName: string,
    boardKind: 'public' | 'private' | 'share',
    workspaceId?: string
  ): Promise<MondayBoard | null> {
    try {
      const query = `
        mutation ($boardName: String!, $boardKind: BoardKind!, $workspaceId: ID) {
          create_board(
            board_name: $boardName,
            board_kind: $boardKind,
            workspace_id: $workspaceId
          ) {
            id
            name
            description
            state
            board_kind
          }
        }
      `;

      const data = await this.executeQuery(query, {
        boardName,
        boardKind,
        workspaceId,
      });

      return data?.data?.create_board || null;
    } catch (error) {
      console.error('[MondayMCP] Error creating board:', error);
      return null;
    }
  }
}
