/**
 * MONDAY.COM MCP SERVICE
 * Real API integration for Monday.com
 */

export interface MondayConfig {
  apiToken: string;
  apiVersion?: string; // Default: "2023-10"
}

export interface MondayItem {
  id?: string;
  name: string;
  board_id: string;
  group_id?: string;
  column_values?: Array<{
    id: string;
    value: string | object;
  }>;
  [key: string]: any;
}

export class MondayService {
  private config: MondayConfig;
  private baseUrl: string;
  private apiVersion: string;

  constructor(config: MondayConfig) {
    this.config = config;
    this.baseUrl = 'https://api.monday.com/v2';
    this.apiVersion = config.apiVersion || '2023-10';
  }

  /**
   * Execute a GraphQL query
   */
  private async executeQuery(query: string, variables?: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiToken,
        'Content-Type': 'application/json',
        'API-Version': this.apiVersion,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Monday.com API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Monday.com GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  /**
   * Create a new Monday.com item
   */
  async createItem(item: MondayItem): Promise<any> {
    const columnValuesJson = item.column_values
      ? JSON.stringify(Object.fromEntries(
          item.column_values.map(cv => [
            cv.id,
            typeof cv.value === 'string' ? cv.value : JSON.stringify(cv.value)
          ])
        ))
      : undefined;

    const query = `
      mutation ($boardId: ID!, $groupId: String, $itemName: String!, $columnValues: JSON) {
        create_item (
          board_id: $boardId,
          group_id: $groupId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
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
            text
            value
          }
        }
      }
    `;

    const variables = {
      boardId: item.board_id,
      groupId: item.group_id,
      itemName: item.name,
      columnValues: columnValuesJson,
    };

    const data = await this.executeQuery(query, variables);
    console.log(`[Monday.com] Created item: ${data.create_item.name} (ID: ${data.create_item.id})`);
    return data.create_item;
  }

  /**
   * Update an existing Monday.com item
   */
  async updateItem(itemId: string, updates: Partial<MondayItem>): Promise<any> {
    const columnValuesJson = updates.column_values
      ? JSON.stringify(Object.fromEntries(
          updates.column_values.map(cv => [
            cv.id,
            typeof cv.value === 'string' ? cv.value : JSON.stringify(cv.value)
          ])
        ))
      : undefined;

    const query = `
      mutation ($itemId: ID!, $columnValues: JSON) {
        change_multiple_column_values (
          item_id: $itemId,
          board_id: null,
          column_values: $columnValues
        ) {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    `;

    const variables = {
      itemId,
      columnValues: columnValuesJson,
    };

    const data = await this.executeQuery(query, variables);
    console.log(`[Monday.com] Updated item: ${itemId}`);
    return data.change_multiple_column_values;
  }

  /**
   * Get a Monday.com item by ID
   */
  async getItem(itemId: string): Promise<any> {
    const query = `
      query ($itemIds: [ID!]!) {
        items (ids: $itemIds) {
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
            text
            value
            type
          }
          updates {
            id
            body
            created_at
            creator {
              name
              email
            }
          }
        }
      }
    `;

    const variables = {
      itemIds: [itemId],
    };

    const data = await this.executeQuery(query, variables);

    if (!data.items || data.items.length === 0) {
      throw new Error(`Monday.com item not found: ${itemId}`);
    }

    console.log(`[Monday.com] Retrieved item: ${data.items[0].name}`);
    return data.items[0];
  }

  /**
   * Search for Monday.com items
   */
  async searchItems(boardId: string, columnId?: string, columnValue?: string): Promise<any> {
    const query = `
      query ($boardIds: [ID!]!) {
        boards (ids: $boardIds) {
          items_page (limit: 50) {
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
                title
                text
                value
              }
            }
          }
        }
      }
    `;

    const variables = {
      boardIds: [boardId],
    };

    const data = await this.executeQuery(query, variables);
    const items = data.boards[0]?.items_page?.items || [];

    // Filter by column value if specified
    const filtered = columnId && columnValue
      ? items.filter((item: any) =>
          item.column_values.some((cv: any) =>
            cv.id === columnId && cv.text?.includes(columnValue)
          )
        )
      : items;

    console.log(`[Monday.com] Search found ${filtered.length} items`);
    return filtered;
  }

  /**
   * Add an update (comment) to an item
   */
  async addUpdate(itemId: string, body: string): Promise<any> {
    const query = `
      mutation ($itemId: ID!, $body: String!) {
        create_update (item_id: $itemId, body: $body) {
          id
          body
          created_at
        }
      }
    `;

    const variables = {
      itemId,
      body,
    };

    const data = await this.executeQuery(query, variables);
    console.log(`[Monday.com] Added update to item ${itemId}`);
    return data.create_update;
  }

  /**
   * Move item to a different group
   */
  async moveItemToGroup(itemId: string, groupId: string): Promise<any> {
    const query = `
      mutation ($itemId: ID!, $groupId: String!) {
        move_item_to_group (item_id: $itemId, group_id: $groupId) {
          id
          group {
            id
            title
          }
        }
      }
    `;

    const variables = {
      itemId,
      groupId,
    };

    const data = await this.executeQuery(query, variables);
    console.log(`[Monday.com] Moved item ${itemId} to group ${groupId}`);
    return data.move_item_to_group;
  }

  /**
   * Archive (delete) an item
   */
  async archiveItem(itemId: string): Promise<any> {
    const query = `
      mutation ($itemId: ID!) {
        archive_item (item_id: $itemId) {
          id
        }
      }
    `;

    const variables = {
      itemId,
    };

    const data = await this.executeQuery(query, variables);
    console.log(`[Monday.com] Archived item ${itemId}`);
    return data.archive_item;
  }
}
