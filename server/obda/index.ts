import { ontologyService } from '../ontology/index.js';
import type { IStorage } from '../storage.js';
import crypto from 'crypto';

export interface OBDAQuery {
  sparql?: string;
  filters?: Record<string, any>;
}

export interface OBDAResult {
  data: any[];
  metadata: {
    sources: string[];
    executionTime: number;
    cached: boolean;
    queryPlan?: string;
  };
}

interface QuerySource {
  system: string;
  query: string;
  type: 'sql' | 'jql' | 'wiql' | 'api';
}

/**
 * OBDA (Ontology-Based Data Access) Service
 * Implements virtual data federation without materialization
 * Rewrites SPARQL queries to native source queries (SQL, JQL, WIQL)
 */
export class OBDAService {
  private storage: IStorage;
  private cacheEnabled: boolean = true;
  private cacheTTL: number = 300000; // 5 minutes

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Execute SPARQL query with virtual data federation
   */
  async executeSPARQL(query: string): Promise<OBDAResult> {
    const startTime = Date.now();
    const queryHash = this.hashQuery(query);

    console.log('[OBDA] Executing SPARQL query:', query.substring(0, 100) + '...');

    // Check cache
    if (this.cacheEnabled) {
      const cached = await this.getFromCache(queryHash);
      if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
        console.log('[OBDA] Cache hit for query');
        return {
          data: JSON.parse(cached.resultSet || '[]'),
          metadata: {
            sources: JSON.parse(cached.sourceSystems || '[]'),
            executionTime: Date.now() - startTime,
            cached: true,
          },
        };
      }
    }

    // Parse SPARQL and rewrite to source queries
    const rewrittenQueries = await this.rewriteQuery(query);

    // Execute federated query
    const results = await this.executeFederatedQuery(rewrittenQueries);

    // Cache results
    if (this.cacheEnabled && results.length > 0) {
      await this.cacheResults(queryHash, query, results, rewrittenQueries);
    }

    const executionTime = Date.now() - startTime;
    console.log(`[OBDA] Query executed in ${executionTime}ms, ${results.length} results`);

    return {
      data: results,
      metadata: {
        sources: rewrittenQueries.map(q => q.system),
        executionTime,
        cached: false,
        queryPlan: JSON.stringify(rewrittenQueries, null, 2),
      },
    };
  }

  /**
   * Simplified SPARQL parser and query rewriter
   * In production, use a full SPARQL parser library
   * This implementation handles basic SELECT queries
   */
  private async rewriteQuery(sparql: string): Promise<QuerySource[]> {
    const queries: QuerySource[] = [];

    // Extract entity type from SPARQL (simplified parsing)
    // Example: "?project a pm:Project" → look for pm:Project
    const entityTypeMatch = sparql.match(/a\s+(\w+):(\w+)/);

    if (!entityTypeMatch) {
      console.warn('[OBDA] Could not parse entity type from SPARQL, querying PostgreSQL only');
      // Default to PostgreSQL projects query
      queries.push({
        system: 'postgresql',
        query: 'SELECT * FROM projects LIMIT 100',
        type: 'sql',
      });
      return queries;
    }

    const [, namespace, className] = entityTypeMatch;
    const conceptURI = `http://nextera.energy/ontology/${namespace}#${className}`;

    console.log('[OBDA] Query targets concept:', conceptURI);

    // Determine which sources to query based on entity type
    // For projects, query PostgreSQL
    if (className === 'Project' || className === 'Epic' || className === 'Feature') {
      queries.push(await this.buildPostgreSQLQuery(sparql, className));
    }

    // For Jira-related entities, add Jira query
    // (In production, check if Jira source is configured)

    // For Azure-related entities, add Azure query
    // (In production, check if Azure source is configured)

    return queries;
  }

  /**
   * Build PostgreSQL query from SPARQL
   */
  private async buildPostgreSQLQuery(sparql: string, entityType: string): Promise<QuerySource> {
    // Map ontology entity types to database tables
    const tableMapping: Record<string, string> = {
      'Project': 'projects',
      'Epic': 'epics',
      'Feature': 'features',
      'Story': 'stories',
      'Task': 'tasks',
      'Risk': 'risks',
      'Resource': 'resources',
    };

    const table = tableMapping[entityType] || 'projects';

    // Extract filters from SPARQL (simplified)
    // Example: "?project pm:projectStatus ?status" with FILTER (?status = "active")
    const statusMatch = sparql.match(/FILTER\s*\(\s*\?status\s*=\s*"([^"]+)"/);
    const portfolioMatch = sparql.match(/pm:belongsToPortfolio\s+<([^>]+)>/);

    let sqlQuery = `SELECT * FROM ${table}`;
    const conditions: string[] = [];

    if (statusMatch) {
      conditions.push(`status = '${statusMatch[1]}'`);
    }

    if (portfolioMatch) {
      // Extract portfolio ID from URI
      const portfolioId = portfolioMatch[1].split('/').pop();
      conditions.push(`portfolio_id = '${portfolioId}'`);
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ' LIMIT 100'; // Safety limit

    return {
      system: 'postgresql',
      query: sqlQuery,
      type: 'sql',
    };
  }

  /**
   * Execute federated query across multiple sources
   */
  private async executeFederatedQuery(queries: QuerySource[]): Promise<any[]> {
    const results: any[] = [];

    for (const querySource of queries) {
      try {
        const sourceResults = await this.querySource(querySource);
        results.push(...sourceResults);
      } catch (error) {
        console.error(`[OBDA] Error querying ${querySource.system}:`, error);
        // Continue with other sources
      }
    }

    // Merge and deduplicate results
    return this.mergeResults(results);
  }

  /**
   * Query individual source (PostgreSQL, Jira, Azure, etc.)
   */
  private async querySource(querySource: QuerySource): Promise<any[]> {
    console.log(`[OBDA] Querying ${querySource.system}:`, querySource.query);

    switch (querySource.system) {
      case 'postgresql':
        return await this.queryPostgreSQL(querySource.query);

      case 'jira':
        return await this.queryJira(querySource.query);

      case 'azure':
        return await this.queryAzure(querySource.query);

      default:
        console.warn(`[OBDA] Unknown source system: ${querySource.system}`);
        return [];
    }
  }

  /**
   * Query PostgreSQL database
   */
  private async queryPostgreSQL(sql: string): Promise<any[]> {
    try {
      // Use storage layer to execute raw SQL
      if (!this.storage.executeRawQuery) {
        console.warn('[OBDA] executeRawQuery not available on storage');
        return [];
      }
      const results = await this.storage.executeRawQuery(sql);

      // Transform to RDF-like format with URIs
      return results.map((row: any) => ({
        uri: `http://nextera.energy/data/${row.id || 'unknown'}`,
        ...row,
        source: 'postgresql',
      }));
    } catch (error) {
      console.error('[OBDA] PostgreSQL query error:', error);
      return [];
    }
  }

  /**
   * Query Jira via JQL
   * Uses the Jira REST API client if configured
   */
  private async queryJira(jql: string): Promise<any[]> {
    // Check if Jira is configured
    if (!process.env.JIRA_DOMAIN || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
      console.warn('[OBDA] Jira not configured, skipping Jira query');
      console.warn('[OBDA] To enable Jira: Set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN in environment');
      return [];
    }

    try {
      const { JiraClient } = await import('../jiraClient.js');
      const jiraClient = new JiraClient({
        domain: process.env.JIRA_DOMAIN,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
      });

      // Parse JQL to determine what to query
      // For now, we'll get all issues and filter based on JQL patterns
      const projects = await jiraClient.getProjects();
      const results: any[] = [];

      for (const project of projects.slice(0, 3)) {
        // Limit to 3 projects to avoid overload
        const issues = await jiraClient.getIssues(project.key, undefined, 50);
        results.push(...issues.map(issue => ({
          source: 'jira',
          id: issue.id,
          key: issue.key,
          title: issue.fields.summary,
          description: issue.fields.description,
          type: issue.fields.issuetype.name,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee?.displayName,
          created: issue.fields.created,
          updated: issue.fields.updated,
        })));
      }

      console.log(`[OBDA] Jira query returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[OBDA] Jira query error:', error);
      return [];
    }
  }

  /**
   * Query Azure DevOps via WIQL
   * Uses the Azure DevOps REST API client if configured
   */
  private async queryAzure(wiql: string): Promise<any[]> {
    // Check if Azure DevOps is configured
    if (!process.env.AZURE_DEVOPS_ORG || !process.env.AZURE_DEVOPS_PAT || !process.env.AZURE_DEVOPS_PROJECT) {
      console.warn('[OBDA] Azure DevOps not configured, skipping Azure query');
      console.warn('[OBDA] To enable Azure DevOps: Set AZURE_DEVOPS_ORG, AZURE_DEVOPS_PAT, and AZURE_DEVOPS_PROJECT in environment');
      return [];
    }

    try {
      const { AzureDevOpsClient } = await import('../azureDevOpsClient.js');
      const azureClient = new AzureDevOpsClient({
        organization: process.env.AZURE_DEVOPS_ORG,
        personalAccessToken: process.env.AZURE_DEVOPS_PAT,
        project: process.env.AZURE_DEVOPS_PROJECT,
      });

      // Query work items using WIQL
      const workItemIds = await azureClient.queryWorkItems(wiql);
      const workItems = await azureClient.getWorkItemsByIds(workItemIds);

      const results = workItems.map(item => ({
        source: 'azure-devops',
        id: item.id.toString(),
        title: item.fields['System.Title'],
        description: item.fields['System.Description'],
        type: item.fields['System.WorkItemType'],
        status: item.fields['System.State'],
        assignee: item.fields['System.AssignedTo']?.displayName,
        created: item.fields['System.CreatedDate'],
        updated: item.fields['System.ChangedDate'],
      }));

      console.log(`[OBDA] Azure DevOps query returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[OBDA] Azure DevOps query error:', error);
      return [];
    }
  }

  /**
   * Merge results from multiple sources and deduplicate
   */
  private mergeResults(results: any[][]): any[] {
    // Flatten results
    const merged = results.flat();

    // Deduplicate by URI
    const seen = new Set<string>();
    return merged.filter(item => {
      const uri = item.uri || `temp_${Math.random()}`;
      if (seen.has(uri)) {
        return false;
      }
      seen.add(uri);
      return true;
    });
  }

  /**
   * Generate query hash for caching
   */
  private hashQuery(query: string): string {
    return crypto.createHash('sha256').update(query).digest('hex');
  }

  /**
   * Get cached query results
   */
  private async getFromCache(queryHash: string): Promise<any | null> {
    try {
      // Query obda_query_cache table
      const cached = await this.storage.getOBDAQueryCache?.(queryHash);
      return cached || null;
    } catch (error) {
      console.error('[OBDA] Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Cache query results
   */
  private async cacheResults(
    queryHash: string,
    sparql: string,
    results: any[],
    rewrittenQueries: QuerySource[]
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.cacheTTL);

      await this.storage.cacheOBDAQuery?.({
        queryHash,
        sparqlQuery: sparql,
        rewrittenQuery: JSON.stringify(rewrittenQueries),
        resultSet: JSON.stringify(results),
        sourceSystems: JSON.stringify(rewrittenQueries.map(q => q.system)),
        executionTimeMs: 0, // Will be updated on actual execution
        expiresAt,
      });

      console.log('[OBDA] Results cached successfully');
    } catch (error) {
      console.error('[OBDA] Cache storage error:', error);
    }
  }

  /**
   * Execute simplified query using filters (alternative to SPARQL)
   */
  async executeQuery(filters: {
    entityType?: string;
    status?: string;
    portfolioId?: string;
    limit?: number;
  }): Promise<OBDAResult> {
    const startTime = Date.now();

    // Build simple SQL query
    const table = filters.entityType || 'projects';
    let sql = `SELECT * FROM ${table}`;
    const conditions: string[] = [];

    if (filters.status) {
      conditions.push(`status = '${filters.status}'`);
    }

    if (filters.portfolioId) {
      conditions.push(`portfolio_id = '${filters.portfolioId}'`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` LIMIT ${filters.limit || 100}`;

    const results = await this.queryPostgreSQL(sql);

    return {
      data: results,
      metadata: {
        sources: ['postgresql'],
        executionTime: Date.now() - startTime,
        cached: false,
      },
    };
  }

  /**
   * Get query statistics
   */
  async getStatistics(): Promise<{
    totalCachedQueries: number;
    cacheHitRate: number;
    averageExecutionTime: number;
  }> {
    // TODO: Implement statistics tracking
    return {
      totalCachedQueries: 0,
      cacheHitRate: 0,
      averageExecutionTime: 0,
    };
  }
}

// Export factory function to create OBDA service with storage
export function createOBDAService(storage: IStorage): OBDAService {
  return new OBDAService(storage);
}
