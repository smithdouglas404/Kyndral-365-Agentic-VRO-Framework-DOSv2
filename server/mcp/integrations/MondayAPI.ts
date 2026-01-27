/**
 * MONDAY.COM GRAPHQL API INTEGRATION
 *
 * Real implementation of Monday.com GraphQL API v2
 * Documentation: https://developer.monday.com/api-reference/docs
 *
 * Supports:
 * - Create item (task/project)
 * - Update item
 * - Get item
 * - Query items
 * - Get boards
 * - Update column values
 * - Archive/delete items
 */

import { MCPBase } from '../base/MCPBase.js';
import type { IStorage } from '../../storage.js';

export interface MondayConfig {
  apiToken: string;      // API token from Profile > Admin > API
  apiVersion?: string;   // Default: '2023-10' or '2024-01'
}

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  board_kind: string;
  state: string;
  workspace?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  columns?: MondayColumn[];
}

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  settings_str?: string;
}

export interface MondayItem {
  id: string;
  name: string;
  state?: string;
  board?: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    title: string;
  };
  column_values?: Array<{
    id: string;
    title: string;
    type: string;
    text?: string;
    value?: string;
    additional_info?: any;
  }>;
  created_at?: string;
  updated_at?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateItemRequest {
  boardId: string;
  groupId?: string;
  itemName: string;
  columnValues?: Record<string, any>;  // Column ID -> value mapping
}

export interface UpdateItemRequest {
  itemId: string;
  boardId?: string;
  itemName?: string;
  columnValues?: Record<string, any>;
}

export interface QueryItemsRequest {
  boardId: string;
  limit?: number;
  page?: number;
  groupId?: string;
  columnId?: string;
  columnValue?: string;
}

export class MondayAPI extends MCPBase {
  private config: MondayConfig;
  private apiUrl: string;
  private authHeader: string;

  constructor(storage: IStorage, config: MondayConfig) {
    super(storage, 'MondayAPI', {
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        monitoringPeriod: 120000,
      },
      rateLimiter: {
        maxRequests: 60,    // Monday.com has lower rate limits
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
    this.apiUrl = 'https://api.monday.com/v2';
    this.authHeader = config.apiToken;

    console.log('[MondayAPI] Initialized');
  }

  /**
   * Execute GraphQL query
   */
  private async executeGraphQL(query: string, variables?: Record<string, any>): Promise<any> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'API-Version': this.config.apiVersion || '2024-01',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Monday.com API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e: any) => e.message).join(', ');
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }

    return result.data;
  }

  /**
   * Test connection to Monday.com
   */
  async testConnection(): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          query {
            me {
              id
              name
              email
              account {
                name
              }
            }
          }
        `;

        const data = await this.executeGraphQL(query);
        console.log(`[MondayAPI] Connected as: ${data.me.name} (${data.me.email})`);
        console.log(`[MondayAPI] Account: ${data.me.account.name}`);
        return true;
      },
      'testConnection'
    );

    return result.success;
  }

  /**
   * Get all boards
   */
  async getBoards(limit: number = 50): Promise<MondayBoard[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          query GetBoards($limit: Int) {
            boards(limit: $limit) {
              id
              name
              description
              board_kind
              state
              workspace {
                id
                name
              }
              owner {
                id
                name
                email
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

        const data = await this.executeGraphQL(query, { limit });
        console.log(`[MondayAPI] Found ${data.boards.length} boards`);
        return data.boards || [];
      },
      'getBoards'
    );

    if (!result.success) {
      console.error('[MondayAPI] Failed to get boards:', result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Get a single board by ID
   */
  async getBoard(boardId: string): Promise<MondayBoard | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          query GetBoard($boardId: [ID!]) {
            boards(ids: $boardId) {
              id
              name
              description
              board_kind
              state
              workspace {
                id
                name
              }
              owner {
                id
                name
                email
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

        const data = await this.executeGraphQL(query, { boardId: [boardId] });

        if (!data.boards || data.boards.length === 0) {
          throw new Error(`Board ${boardId} not found`);
        }

        return data.boards[0];
      },
      'getBoard'
    );

    if (!result.success) {
      console.error(`[MondayAPI] Failed to get board ${boardId}:`, result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Create a new item (task/project)
   */
  async createItem(request: CreateItemRequest): Promise<MondayItem | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        // Build column values JSON
        let columnValuesJson = '{}';
        if (request.columnValues && Object.keys(request.columnValues).length > 0) {
          columnValuesJson = JSON.stringify(request.columnValues);
        }

        const query = `
          mutation CreateItem($boardId: ID!, $groupId: String, $itemName: String!, $columnValues: JSON) {
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
              column_values {
                id
                title
                type
                text
                value
              }
              created_at
              updated_at
              creator {
                id
                name
                email
              }
            }
          }
        `;

        const variables = {
          boardId: request.boardId,
          groupId: request.groupId || null,
          itemName: request.itemName,
          columnValues: columnValuesJson,
        };

        console.log('[MondayAPI] Creating item:', JSON.stringify(variables, null, 2));

        const data = await this.executeGraphQL(query, variables);
        const item = data.create_item;
        console.log(`[MondayAPI] Item created: ${item.name} (${item.id})`);

        return item;
      },
      'createItem'
    );

    if (!result.success) {
      console.error('[MondayAPI] Failed to create item:', result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Update an existing item
   */
  async updateItem(request: UpdateItemRequest): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        // Update item name if provided
        if (request.itemName) {
          const nameQuery = `
            mutation UpdateItemName($itemId: ID!, $itemName: String!) {
              change_simple_column_value(
                item_id: $itemId,
                column_id: "name",
                value: $itemName
              ) {
                id
              }
            }
          `;

          await this.executeGraphQL(nameQuery, {
            itemId: request.itemId,
            itemName: request.itemName,
          });
        }

        // Update column values if provided
        if (request.columnValues && Object.keys(request.columnValues).length > 0) {
          const columnValuesJson = JSON.stringify(request.columnValues);

          const valuesQuery = `
            mutation UpdateColumnValues($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
              change_multiple_column_values(
                board_id: $boardId,
                item_id: $itemId,
                column_values: $columnValues
              ) {
                id
                name
              }
            }
          `;

          if (!request.boardId) {
            throw new Error('boardId is required when updating column values');
          }

          await this.executeGraphQL(valuesQuery, {
            boardId: request.boardId,
            itemId: request.itemId,
            columnValues: columnValuesJson,
          });
        }

        console.log(`[MondayAPI] Item ${request.itemId} updated successfully`);
        return true;
      },
      'updateItem'
    );

    return result.success;
  }

  /**
   * Get a single item by ID
   */
  async getItem(itemId: string): Promise<MondayItem | null> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          query GetItem($itemIds: [ID!]) {
            items(ids: $itemIds) {
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
                value
                additional_info
              }
              created_at
              updated_at
              creator {
                id
                name
                email
              }
            }
          }
        `;

        const data = await this.executeGraphQL(query, { itemIds: [itemId] });

        if (!data.items || data.items.length === 0) {
          throw new Error(`Item ${itemId} not found`);
        }

        return data.items[0];
      },
      'getItem'
    );

    if (!result.success) {
      console.error(`[MondayAPI] Failed to get item ${itemId}:`, result.error);
      return null;
    }

    return result.data || null;
  }

  /**
   * Query items from a board
   */
  async queryItems(request: QueryItemsRequest): Promise<MondayItem[]> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          query QueryItems($boardId: [ID!]!, $limit: Int, $page: Int) {
            boards(ids: $boardId) {
              items_page(limit: $limit, query_params: {}) {
                cursor
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
                    value
                  }
                  created_at
                  updated_at
                  creator {
                    id
                    name
                    email
                  }
                }
              }
            }
          }
        `;

        const variables = {
          boardId: [request.boardId],
          limit: request.limit || 50,
          page: request.page || 1,
        };

        const data = await this.executeGraphQL(query, variables);

        if (!data.boards || data.boards.length === 0) {
          return [];
        }

        const items = data.boards[0].items_page?.items || [];
        console.log(`[MondayAPI] Found ${items.length} items in board ${request.boardId}`);

        // Filter by group if specified
        if (request.groupId) {
          return items.filter((item: MondayItem) => item.group?.id === request.groupId);
        }

        return items;
      },
      'queryItems'
    );

    if (!result.success) {
      console.error('[MondayAPI] Failed to query items:', result.error);
      return [];
    }

    return result.data || [];
  }

  /**
   * Archive an item
   */
  async archiveItem(itemId: string): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          mutation ArchiveItem($itemId: ID!) {
            archive_item(item_id: $itemId) {
              id
            }
          }
        `;

        await this.executeGraphQL(query, { itemId });
        console.log(`[MondayAPI] Item ${itemId} archived`);
        return true;
      },
      'archiveItem'
    );

    return result.success;
  }

  /**
   * Delete an item permanently
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          mutation DeleteItem($itemId: ID!) {
            delete_item(item_id: $itemId) {
              id
            }
          }
        `;

        await this.executeGraphQL(query, { itemId });
        console.log(`[MondayAPI] Item ${itemId} deleted`);
        return true;
      },
      'deleteItem'
    );

    return result.success;
  }

  /**
   * Create a new update (comment) on an item
   */
  async createUpdate(itemId: string, body: string): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          mutation CreateUpdate($itemId: ID!, $body: String!) {
            create_update(item_id: $itemId, body: $body) {
              id
              text_body
            }
          }
        `;

        await this.executeGraphQL(query, { itemId, body });
        console.log(`[MondayAPI] Update created on item ${itemId}`);
        return true;
      },
      'createUpdate'
    );

    return result.success;
  }

  /**
   * Get column values for an item
   */
  async getColumnValues(itemId: string): Promise<Array<any>> {
    const item = await this.getItem(itemId);
    return item?.column_values || [];
  }

  /**
   * Update a single column value
   */
  async updateColumnValue(
    boardId: string,
    itemId: string,
    columnId: string,
    value: any
  ): Promise<boolean> {
    const result = await this.executeWithSafeguards(
      async () => {
        const query = `
          mutation UpdateColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
            change_column_value(
              board_id: $boardId,
              item_id: $itemId,
              column_id: $columnId,
              value: $value
            ) {
              id
            }
          }
        `;

        const valueJson = typeof value === 'string' ? value : JSON.stringify(value);

        await this.executeGraphQL(query, {
          boardId,
          itemId,
          columnId,
          value: valueJson,
        });

        console.log(`[MondayAPI] Column ${columnId} updated for item ${itemId}`);
        return true;
      },
      'updateColumnValue'
    );

    return result.success;
  }
}
