export interface PalantirConfig {
  hostname: string;
  token: string;
  ontologyRid?: string;
}

export interface PalantirObjectType {
  apiName: string;
  displayName: string;
  description?: string;
  primaryKey: string[];
  properties: Record<string, { dataType: string; description?: string }>;
}

export interface PalantirObject {
  __apiName: string;
  __primaryKey: Record<string, any>;
  __rid?: string;
  [key: string]: any;
}

export interface PalantirSearchFilter {
  type: string;
  field?: string;
  value?: any;
  filters?: PalantirSearchFilter[];
}

export class PalantirAIPService {
  private config: PalantirConfig;
  private baseUrl: string;
  private defaultOntology: string | null = null;

  constructor(config: PalantirConfig) {
    this.config = config;
    const host = config.hostname.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.baseUrl = `https://${host}/api/v2`;
    if (config.ontologyRid) {
      this.defaultOntology = config.ontologyRid;
    }
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.errorName || errorJson.message || errorText;
      } catch {
        errorDetail = errorText;
      }
      throw new Error(`Palantir API error (${response.status}): ${errorDetail}`);
    }

    return response.json();
  }

  async listOntologies(): Promise<any[]> {
    const data = await this.request('GET', '/ontologies');
    console.log(`[Palantir] Found ${data.data?.length || 0} ontologies`);
    return data.data || [];
  }

  async getOntology(ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || this.defaultOntology;
    if (!rid) {
      const ontologies = await this.listOntologies();
      if (ontologies.length === 0) throw new Error('No ontologies found');
      this.defaultOntology = ontologies[0].rid || ontologies[0].apiName;
      return ontologies[0];
    }
    return this.request('GET', `/ontologies/${rid}`);
  }

  async getOntologyFullMetadata(ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    return this.request('GET', `/ontologies/${rid}/fullMetadata`);
  }

  async listObjectTypes(ontologyRid?: string): Promise<PalantirObjectType[]> {
    const rid = ontologyRid || await this.resolveOntology();
    const data = await this.request('GET', `/ontologies/${rid}/objectTypes`);
    console.log(`[Palantir] Found ${data.data?.length || 0} object types`);
    return data.data || [];
  }

  async getObjectType(objectTypeApiName: string, ontologyRid?: string): Promise<PalantirObjectType> {
    const rid = ontologyRid || await this.resolveOntology();
    return this.request('GET', `/ontologies/${rid}/objectTypes/${objectTypeApiName}`);
  }

  async listObjects(objectType: string, options?: {
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
    select?: string[];
    ontologyRid?: string;
  }): Promise<{ data: PalantirObject[]; nextPageToken?: string }> {
    const rid = options?.ontologyRid || await this.resolveOntology();
    const params = new URLSearchParams();
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));
    if (options?.pageToken) params.set('pageToken', options.pageToken);
    if (options?.orderBy) params.set('orderBy', options.orderBy);
    if (options?.select) params.set('select', JSON.stringify(options.select));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const data = await this.request('GET', `/ontologies/${rid}/objects/${objectType}${qs}`);
    console.log(`[Palantir] Listed ${data.data?.length || 0} ${objectType} objects`);
    return data;
  }

  async getObject(objectType: string, primaryKey: string, options?: {
    select?: string[];
    ontologyRid?: string;
  }): Promise<PalantirObject> {
    const rid = options?.ontologyRid || await this.resolveOntology();
    const params = new URLSearchParams();
    if (options?.select) params.set('select', JSON.stringify(options.select));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request('GET', `/ontologies/${rid}/objects/${objectType}/${primaryKey}${qs}`);
  }

  async searchObjects(objectType: string, filter: PalantirSearchFilter, options?: {
    pageSize?: number;
    pageToken?: string;
    orderBy?: { fields: Array<{ field: string; direction: 'asc' | 'desc' }> };
    select?: string[];
    ontologyRid?: string;
  }): Promise<{ data: PalantirObject[]; nextPageToken?: string }> {
    const rid = options?.ontologyRid || await this.resolveOntology();
    const body: any = { where: filter };
    if (options?.pageSize) body.pageSize = options.pageSize;
    if (options?.pageToken) body.pageToken = options.pageToken;
    if (options?.orderBy) body.orderBy = options.orderBy;
    if (options?.select) body.select = options.select;

    const data = await this.request('POST', `/ontologies/${rid}/objects/${objectType}/search`, body);
    console.log(`[Palantir] Search found ${data.data?.length || 0} ${objectType} objects`);
    return data;
  }

  async applyAction(actionApiName: string, parameters: Record<string, any>, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    return this.request('POST', `/ontologies/${rid}/actions/${actionApiName}/apply`, { parameters });
  }

  /**
   * Execute an action by RID (alias for applyAction with RID support)
   */
  async executeAction(ontologyRid: string, actionRid: string, parameters: Record<string, any>): Promise<any> {
    // Extract action API name from RID if needed
    const actionName = actionRid.includes('.action.')
      ? actionRid.split('.action.')[1]
      : actionRid;
    return this.request('POST', `/ontologies/${ontologyRid}/actions/${actionName}/apply`, { parameters });
  }

  /**
   * Validate action parameters before execution
   */
  async listActionTypes(ontologyRid?: string): Promise<any[]> {
    const rid = ontologyRid || await this.resolveOntology();
    try {
      const result = await this.request('GET', `/ontologies/${rid}/actionTypes`);
      return result?.data || result || [];
    } catch (error: any) {
      console.warn(`[PalantirAIP] listActionTypes failed: ${error.message}`);
      return [];
    }
  }

  async validateAction(ontologyRid: string, actionRid: string, parameters: Record<string, any>): Promise<{
    valid: boolean;
    errors?: Array<{ parameter: string; message: string; code: string }>;
  }> {
    try {
      const actionName = actionRid.includes('.action.')
        ? actionRid.split('.action.')[1]
        : actionRid;
      const result = await this.request('POST', `/ontologies/${ontologyRid}/actions/${actionName}/validate`, { parameters });
      return { valid: true, errors: [] };
    } catch (error: any) {
      return {
        valid: false,
        errors: [{ parameter: '', message: error.message, code: 'VALIDATION_ERROR' }],
      };
    }
  }

  /**
   * List all available actions in the ontology
   */
  async listActions(ontologyRid?: string): Promise<Array<{
    rid: string;
    apiName: string;
    displayName: string;
    description?: string;
    parameters: Array<{ name: string; type: string; required: boolean }>;
  }>> {
    const rid = ontologyRid || await this.resolveOntology();
    try {
      const data = await this.request('GET', `/ontologies/${rid}/actionTypes`);
      return (data.data || []).map((action: any) => {
        // Parameters can be an object or array - handle both cases
        let paramsList: Array<{ name: string; type: string; required: boolean }> = [];
        const params = action.parameters;
        if (params) {
          if (Array.isArray(params)) {
            // Array format
            paramsList = params.map((p: any) => ({
              name: p.name || p.id,
              type: p.dataType?.type || 'string',
              required: p.required ?? true,
            }));
          } else if (typeof params === 'object') {
            // Object format (key-value pairs)
            paramsList = Object.entries(params).map(([key, p]: [string, any]) => ({
              name: key,
              type: p.dataType?.type || 'string',
              required: p.required ?? false,
            }));
          }
        }
        return {
          rid: action.rid || action.apiName,
          apiName: action.apiName,
          displayName: action.displayName || action.apiName,
          description: action.description,
          parameters: paramsList,
        };
      });
    } catch (error: any) {
      console.warn(`[Palantir] Could not list actions: ${error.message}`);
      return [];
    }
  }

  async executeQuery(queryApiName: string, parameters: Record<string, any>, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    return this.request('POST', `/ontologies/${rid}/queries/${queryApiName}/execute`, { parameters });
  }

  async listQueryTypes(ontologyRid?: string): Promise<any[]> {
    const rid = ontologyRid || await this.resolveOntology();
    const data = await this.request('GET', `/ontologies/${rid}/queryTypes`);
    return data.data || [];
  }

  async testConnection(): Promise<{
    connected: boolean;
    hostname: string;
    ontologies: number;
    objectTypes: number;
    defaultOntology: string | null;
    error?: string;
  }> {
    try {
      const ontologies = await this.listOntologies();
      let objectTypeCount = 0;

      const resolvedRid = await this.resolveOntology();
      try {
        const objectTypes = await this.listObjectTypes(resolvedRid);
        objectTypeCount = objectTypes.length;
      } catch (e: any) {
        console.warn(`[Palantir] Could not list object types: ${e.message}`);
      }

      return {
        connected: true,
        hostname: this.config.hostname,
        ontologies: ontologies.length,
        objectTypes: objectTypeCount,
        defaultOntology: this.defaultOntology,
      };
    } catch (error: any) {
      return {
        connected: false,
        hostname: this.config.hostname,
        ontologies: 0,
        objectTypes: 0,
        defaultOntology: null,
        error: error.message,
      };
    }
  }

  private async resolveOntology(): Promise<string> {
    if (this.defaultOntology) return this.defaultOntology;
    const ontologies = await this.listOntologies();
    if (ontologies.length === 0) throw new Error('No ontologies found in Palantir instance');

    if (ontologies.length > 1) {
      for (const ont of ontologies) {
        const rid = ont.rid || ont.apiName;
        if (rid === 'ri.ontology.main.ontology.00000000-0000-0000-0000-000000000000') continue;
        if (ont.apiName === 'default' && ont.displayName === 'Ontology') continue;
        try {
          const types = await this.request('GET', `/ontologies/${rid}/objectTypes`);
          if (types.data && types.data.length > 0) {
            console.log(`[Palantir] Auto-selected ontology "${ont.displayName}" (${rid}) with ${types.data.length} object types`);
            this.defaultOntology = rid;
            return this.defaultOntology;
          }
        } catch {}
      }
    }

    this.defaultOntology = ontologies[0].rid || ontologies[0].apiName;
    return this.defaultOntology;
  }

  // ============================================================================
  // ONTOLOGY MANAGEMENT - Create Object Types and Action Types
  // ============================================================================

  /**
   * Create a new object type in the ontology
   * Tries multiple API endpoints for compatibility
   */
  async createObjectType(definition: {
    apiName: string;
    displayName: string;
    description?: string;
    primaryKey: string[];
    properties: Record<string, { dataType: string; description?: string; required?: boolean }>;
  }, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    console.log(`[Palantir] Creating object type: ${definition.apiName}`);

    const body = {
      apiName: definition.apiName,
      displayName: definition.displayName,
      description: definition.description || '',
      primaryKey: definition.primaryKey,
      properties: Object.entries(definition.properties).map(([name, prop]) => ({
        apiName: name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
        dataType: { type: prop.dataType },
        description: prop.description || '',
        required: prop.required ?? false,
      })),
    };

    // Try different API endpoints
    const endpoints = [
      `/ontologies/${rid}/objectTypes`,
      `/ontology/objectTypes`,
      `/ontologies/${rid}/objectTypes/create`,
      `/v1/ontologies/${rid}/objectTypes`,
    ];

    let lastError: any;
    for (const endpoint of endpoints) {
      try {
        return await this.request('POST', endpoint, body);
      } catch (error: any) {
        lastError = error;
        // Try next endpoint
      }
    }

    // If all endpoints fail, throw the last error
    throw lastError;
  }

  /**
   * Create a new action type in the ontology
   */
  async createActionType(definition: {
    apiName: string;
    displayName: string;
    description?: string;
    parameters: Array<{
      name: string;
      dataType: string;
      description?: string;
      required?: boolean;
    }>;
    operations: Array<{
      type: 'createObject' | 'modifyObject' | 'deleteObject';
      objectTypeApiName: string;
    }>;
  }, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    console.log(`[Palantir] Creating action type: ${definition.apiName}`);

    const body = {
      apiName: definition.apiName,
      displayName: definition.displayName,
      description: definition.description || '',
      parameters: definition.parameters.map(p => ({
        id: p.name,
        displayName: p.name.charAt(0).toUpperCase() + p.name.slice(1).replace(/([A-Z])/g, ' $1'),
        dataType: { type: p.dataType },
        description: p.description || '',
        required: p.required ?? true,
      })),
      operations: definition.operations,
    };

    return this.request('POST', `/ontologies/${rid}/actionTypes`, body);
  }

  /**
   * Create or update object - direct write to Palantir
   * This uses the object edit API for direct CRUD without predefined actions
   */
  async createObject(objectType: string, primaryKey: string, properties: Record<string, any>, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    console.log(`[Palantir] Creating object: ${objectType}/${primaryKey}`);

    // Use the objects creation endpoint
    const body = {
      primaryKey: { id: primaryKey },
      ...properties,
    };

    return this.request('POST', `/ontologies/${rid}/objects/${objectType}`, body);
  }

  /**
   * Update an existing object
   */
  async updateObject(objectType: string, primaryKey: string, properties: Record<string, any>, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    console.log(`[Palantir] Updating object: ${objectType}/${primaryKey}`);

    return this.request('PATCH', `/ontologies/${rid}/objects/${objectType}/${primaryKey}`, properties);
  }

  /**
   * Delete an object
   */
  async deleteObject(objectType: string, primaryKey: string, ontologyRid?: string): Promise<any> {
    const rid = ontologyRid || await this.resolveOntology();
    console.log(`[Palantir] Deleting object: ${objectType}/${primaryKey}`);

    return this.request('DELETE', `/ontologies/${rid}/objects/${objectType}/${primaryKey}`);
  }

  /**
   * Batch create/update objects
   */
  async batchUpsertObjects(objectType: string, objects: Array<{ primaryKey: string; properties: Record<string, any> }>, ontologyRid?: string): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: string[];
  }> {
    const rid = ontologyRid || await this.resolveOntology();
    console.log(`[Palantir] Batch upserting ${objects.length} ${objectType} objects`);

    const results = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

    for (const obj of objects) {
      try {
        // Try to get existing object first
        try {
          await this.getObject(objectType, obj.primaryKey, { ontologyRid: rid });
          // Object exists, update it
          await this.updateObject(objectType, obj.primaryKey, obj.properties, rid);
          results.updated++;
        } catch (getError: any) {
          // Object doesn't exist, create it
          if (getError.message?.includes('404') || getError.message?.includes('not found')) {
            await this.createObject(objectType, obj.primaryKey, obj.properties, rid);
            results.created++;
          } else {
            throw getError;
          }
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${obj.primaryKey}: ${error.message}`);
      }
    }

    console.log(`[Palantir] Batch complete: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);
    return results;
  }
}
