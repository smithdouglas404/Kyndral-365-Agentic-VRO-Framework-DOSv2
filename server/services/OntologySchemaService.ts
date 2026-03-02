/**
 * ONTOLOGY SCHEMA SERVICE
 *
 * Discovers and caches Palantir ontology schema dynamically.
 * Provides the source of truth for all object types, relationships, and agent mappings.
 *
 * Architecture:
 * - On startup: Fetches full ontology schema from Palantir Foundry
 * - Caches object types with TTL
 * - Auto-discovers agent-to-objectType mappings based on naming conventions
 * - Provides schema validation for incoming data
 */

import { PalantirAIPService, PalantirObjectType } from '../mcp/PalantirAIPService';

export interface OntologyObjectType {
  apiName: string;
  displayName: string;
  description?: string;
  primaryKey: string[];
  properties: Record<string, OntologyProperty>;
  relationships?: OntologyRelationship[];
  // Agent mappings - which agents can access this object type
  assignedAgents: string[];
  // Data source - where this data originates (jira, monday, openproject, manual)
  dataSources: string[];
}

export interface OntologyProperty {
  name: string;
  dataType: string;
  description?: string;
  required?: boolean;
  // For enum types
  allowedValues?: string[];
  // Source mapping - which external field maps to this
  externalMappings?: Record<string, string>; // { jira: 'customfield_10001', monday: 'column_123' }
}

export interface OntologyRelationship {
  name: string;
  targetObjectType: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey?: string;
}

export interface OntologySchema {
  ontologyRid: string;
  version: string;
  lastUpdated: Date;
  objectTypes: Map<string, OntologyObjectType>;
  agentMappings: Map<string, string[]>; // agentId -> [objectTypeApiNames]
}

// Naming convention patterns for auto-discovery
const AGENT_OBJECT_PATTERNS: Record<string, RegExp[]> = {
  finops: [/budget/i, /financial/i, /cost/i, /expense/i, /invoice/i],
  tmo: [/project/i, /dependency/i, /team/i, /transformation/i, /milestone/i],
  risk: [/risk/i, /issue/i, /incident/i, /threat/i],
  pmo: [/project/i, /portfolio/i, /program/i, /governance/i, /checkpoint/i],
  vro: [/objective/i, /keyresult/i, /kpi/i, /value/i, /benefit/i],
  governance: [/governance/i, /compliance/i, /audit/i, /policy/i, /checkpoint/i],
  ocm: [/change/i, /readiness/i, /adoption/i, /training/i, /person/i, /stakeholder/i],
  planning: [/plan/i, /sprint/i, /iteration/i, /pi/i, /roadmap/i, /objective/i],
  okr: [/objective/i, /keyresult/i, /okr/i, /kpi/i, /goal/i],
  integrated: [/project/i, /agent/i, /insight/i, /transformation/i],
  notification: [/alert/i, /notification/i, /insight/i, /risk/i, /person/i],
};

// External system field mappings
const EXTERNAL_FIELD_MAPPINGS: Record<string, Record<string, Record<string, string>>> = {
  AtlasProject: {
    jira: {
      key: 'key',
      name: 'summary',
      description: 'description',
      status: 'status.name',
      priority: 'priority.name',
      assignee: 'assignee.displayName',
      created: 'created',
      updated: 'updated',
    },
    openproject: {
      id: 'id',
      name: 'subject',
      description: 'description.raw',
      status: 'status.name',
      priority: 'priority.name',
      assignee: 'assignee.name',
      startDate: 'startDate',
      dueDate: 'dueDate',
    },
    monday: {
      id: 'id',
      name: 'name',
      status: 'column_values.status.text',
      priority: 'column_values.priority.text',
      assignee: 'column_values.person.text',
    },
  },
  AtlasBudget: {
    jira: {
      projectKey: 'project.key',
      estimatedCost: 'customfield_budget',
      actualCost: 'customfield_actual_cost',
    },
    monday: {
      budget: 'column_values.numbers.value',
      spent: 'column_values.spent.value',
    },
  },
  AtlasRisk: {
    jira: {
      key: 'key',
      summary: 'summary',
      description: 'description',
      severity: 'priority.name',
      status: 'status.name',
    },
    openproject: {
      id: 'id',
      name: 'subject',
      description: 'description.raw',
      severity: 'priority.name',
      probability: 'customField.probability',
    },
  },
};

class OntologySchemaServiceClass {
  private schema: OntologySchema | null = null;
  private palantirService: PalantirAIPService | null = null;
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private lastFetch: Date | null = null;
  private isInitialized = false;

  /**
   * Initialize the service with Palantir connection
   */
  async initialize(palantirService: PalantirAIPService): Promise<void> {
    this.palantirService = palantirService;
    await this.refreshSchema();
    this.isInitialized = true;
    console.log('[OntologySchema] Service initialized with Palantir connection');
  }

  /**
   * Refresh the ontology schema from Palantir
   */
  async refreshSchema(): Promise<OntologySchema> {
    if (!this.palantirService) {
      throw new Error('OntologySchemaService not initialized - call initialize() first');
    }

    console.log('[OntologySchema] Fetching schema from Palantir...');

    // Get full ontology metadata
    const metadata = await this.palantirService.getOntologyFullMetadata();
    const objectTypes = await this.palantirService.listObjectTypes();

    const ontologyRid = metadata.ontology?.rid || 'unknown';
    const version = metadata.ontology?.apiName || '1.0';

    // Build object type map with auto-discovered agent mappings
    const objectTypeMap = new Map<string, OntologyObjectType>();
    const agentMappings = new Map<string, string[]>();

    // Initialize agent mappings
    Object.keys(AGENT_OBJECT_PATTERNS).forEach(agent => {
      agentMappings.set(agent, []);
    });

    for (const objType of objectTypes) {
      const processedType = this.processObjectType(objType);
      objectTypeMap.set(objType.apiName, processedType);

      // Auto-discover agent assignments
      const assignedAgents = this.discoverAgentAssignments(objType.apiName, objType.displayName);
      processedType.assignedAgents = assignedAgents;

      // Update agent mappings
      for (const agent of assignedAgents) {
        const current = agentMappings.get(agent) || [];
        if (!current.includes(objType.apiName)) {
          current.push(objType.apiName);
          agentMappings.set(agent, current);
        }
      }
    }

    this.schema = {
      ontologyRid,
      version,
      lastUpdated: new Date(),
      objectTypes: objectTypeMap,
      agentMappings,
    };

    this.lastFetch = new Date();

    console.log(`[OntologySchema] Loaded ${objectTypeMap.size} object types`);
    console.log(`[OntologySchema] Agent mappings: ${JSON.stringify(Object.fromEntries(agentMappings))}`);

    return this.schema;
  }

  /**
   * Get the current schema (refreshes if stale)
   */
  async getSchema(): Promise<OntologySchema> {
    if (!this.schema || this.isStale()) {
      await this.refreshSchema();
    }
    return this.schema!;
  }

  /**
   * Get object types assigned to an agent
   */
  async getAgentObjectTypes(agentId: string): Promise<OntologyObjectType[]> {
    const schema = await this.getSchema();
    const normalizedAgentId = this.normalizeAgentId(agentId);
    const objectTypeNames = schema.agentMappings.get(normalizedAgentId) || [];

    return objectTypeNames
      .map(name => schema.objectTypes.get(name))
      .filter((t): t is OntologyObjectType => t !== undefined);
  }

  /**
   * Get object type by API name
   */
  async getObjectType(apiName: string): Promise<OntologyObjectType | undefined> {
    const schema = await this.getSchema();
    return schema.objectTypes.get(apiName);
  }

  /**
   * Get all object types
   */
  async getAllObjectTypes(): Promise<OntologyObjectType[]> {
    const schema = await this.getSchema();
    return Array.from(schema.objectTypes.values());
  }

  /**
   * Get external field mapping for an object type and source system
   */
  getExternalMapping(objectTypeApiName: string, source: 'jira' | 'openproject' | 'monday'): Record<string, string> | undefined {
    return EXTERNAL_FIELD_MAPPINGS[objectTypeApiName]?.[source];
  }

  /**
   * Map external data to ontology object
   */
  mapExternalToOntology(
    objectTypeApiName: string,
    source: 'jira' | 'openproject' | 'monday',
    externalData: Record<string, any>
  ): Record<string, any> {
    const mapping = this.getExternalMapping(objectTypeApiName, source);
    if (!mapping) {
      console.warn(`[OntologySchema] No mapping found for ${objectTypeApiName} from ${source}`);
      return externalData;
    }

    const mapped: Record<string, any> = {
      __source: source,
      __sourceId: externalData.id || externalData.key,
      __syncedAt: new Date().toISOString(),
    };

    for (const [ontologyField, externalPath] of Object.entries(mapping)) {
      const value = this.getNestedValue(externalData, externalPath);
      if (value !== undefined) {
        mapped[ontologyField] = value;
      }
    }

    return mapped;
  }

  /**
   * Get data sources for an object type
   */
  getDataSources(objectTypeApiName: string): string[] {
    const mappings = EXTERNAL_FIELD_MAPPINGS[objectTypeApiName];
    if (!mappings) return ['manual'];
    return Object.keys(mappings);
  }

  // Private helpers

  private processObjectType(objType: PalantirObjectType): OntologyObjectType {
    const properties: Record<string, OntologyProperty> = {};

    for (const [propName, propDef] of Object.entries(objType.properties || {})) {
      properties[propName] = {
        name: propName,
        dataType: propDef.dataType,
        description: propDef.description,
        externalMappings: this.getPropertyExternalMappings(objType.apiName, propName),
      };
    }

    return {
      apiName: objType.apiName,
      displayName: objType.displayName,
      description: objType.description,
      primaryKey: objType.primaryKey || [],
      properties,
      assignedAgents: [], // Will be filled by discoverAgentAssignments
      dataSources: this.getDataSources(objType.apiName),
    };
  }

  private discoverAgentAssignments(apiName: string, displayName: string): string[] {
    const agents: string[] = [];
    const searchText = `${apiName} ${displayName}`.toLowerCase();

    for (const [agent, patterns] of Object.entries(AGENT_OBJECT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(searchText)) {
          agents.push(agent);
          break;
        }
      }
    }

    // Ensure at least 'integrated' agent has access to all types
    if (!agents.includes('integrated')) {
      agents.push('integrated');
    }

    return agents;
  }

  private normalizeAgentId(agentId: string): string {
    // Handle variations: deep-finops, deepfinops, finops -> finops
    return agentId
      .toLowerCase()
      .replace(/^deep-?/, '')
      .replace(/agent$/, '')
      .trim();
  }

  private getPropertyExternalMappings(objectType: string, property: string): Record<string, string> | undefined {
    const result: Record<string, string> = {};
    const objectMappings = EXTERNAL_FIELD_MAPPINGS[objectType];

    if (!objectMappings) return undefined;

    for (const [source, fieldMap] of Object.entries(objectMappings)) {
      const externalField = fieldMap[property];
      if (externalField) {
        result[source] = externalField;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private isStale(): boolean {
    if (!this.lastFetch) return true;
    return Date.now() - this.lastFetch.getTime() > this.cacheTTL;
  }
}

// Singleton instance
export const OntologySchemaService = new OntologySchemaServiceClass();
