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

      if (ontologies.length > 0) {
        const ontRid = ontologies[0].rid || ontologies[0].apiName;
        this.defaultOntology = ontRid;
        try {
          const objectTypes = await this.listObjectTypes(ontRid);
          objectTypeCount = objectTypes.length;
        } catch (e: any) {
          console.warn(`[Palantir] Could not list object types: ${e.message}`);
        }
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
    this.defaultOntology = ontologies[0].rid || ontologies[0].apiName;
    return this.defaultOntology;
  }
}
