/**
 * MCP SERVICE FACTORY
 * Loads and manages real MCP service implementations
 */

import { JiraService } from './JiraService.js';
import { ServiceNowService } from './ServiceNowService.js';
import { MondayService } from './MondayService.js';
import { PalantirAIPService } from './PalantirAIPService.js';

interface MCPServiceConfig {
  jira?: {
    domain: string;
    email: string;
    apiToken: string;
  };
  servicenow?: {
    instance: string;
    username: string;
    password: string;
  };
  monday?: {
    apiToken: string;
  };
  palantir?: {
    hostname: string;
    token: string;
    ontologyRid?: string;
  };
}

/**
 * Base interface for all MCP services
 */
export interface IMCPService {
  executeAction(action: string, params: any): Promise<any>;
}

/**
 * Wrapper for Jira Service
 */
class JiraMCPService implements IMCPService {
  private jira: JiraService;

  constructor(config: NonNullable<MCPServiceConfig['jira']>) {
    this.jira = new JiraService(config);
  }

  async executeAction(action: string, params: any): Promise<any> {
    switch (action) {
      case 'createIssue':
      case 'create_issue':
        return await this.jira.createIssue(params);

      case 'updateIssue':
      case 'update_issue':
        return await this.jira.updateIssue(params.issueIdOrKey, params.updates);

      case 'getIssue':
      case 'get_issue':
        return await this.jira.getIssue(params.issueIdOrKey, params.fields);

      case 'searchIssues':
      case 'search':
        return await this.jira.searchIssues(params.jql, params.maxResults);

      case 'addComment':
      case 'add_comment':
        return await this.jira.addComment(params.issueIdOrKey, params.comment);

      case 'transitionIssue':
      case 'transition':
        return await this.jira.transitionIssue(params.issueIdOrKey, params.transitionId);

      default:
        throw new Error(`Unknown Jira action: ${action}`);
    }
  }
}

/**
 * Wrapper for ServiceNow Service
 */
class ServiceNowMCPService implements IMCPService {
  private servicenow: ServiceNowService;

  constructor(config: NonNullable<MCPServiceConfig['servicenow']>) {
    this.servicenow = new ServiceNowService(config);
  }

  async executeAction(action: string, params: any): Promise<any> {
    switch (action) {
      case 'createIncident':
      case 'create_incident':
        return await this.servicenow.createIncident(params);

      case 'updateIncident':
      case 'update_incident':
        return await this.servicenow.updateIncident(params.sysId, params.updates);

      case 'getIncident':
      case 'get_incident':
        return await this.servicenow.getIncident(params.sysId);

      case 'searchIncidents':
      case 'search':
        return await this.servicenow.searchIncidents(params.query, params.limit);

      case 'addWorkNote':
      case 'add_work_note':
        return await this.servicenow.addWorkNote(params.sysId, params.note);

      case 'addComment':
      case 'add_comment':
        return await this.servicenow.addComment(params.sysId, params.comment);

      case 'resolveIncident':
      case 'resolve':
        return await this.servicenow.resolveIncident(params.sysId, params.resolutionNotes);

      case 'closeIncident':
      case 'close':
        return await this.servicenow.closeIncident(params.sysId, params.closeNotes);

      default:
        throw new Error(`Unknown ServiceNow action: ${action}`);
    }
  }
}

/**
 * Wrapper for Monday.com Service
 */
class MondayMCPService implements IMCPService {
  private monday: MondayService;

  constructor(config: NonNullable<MCPServiceConfig['monday']>) {
    this.monday = new MondayService(config);
  }

  async executeAction(action: string, params: any): Promise<any> {
    switch (action) {
      case 'createItem':
      case 'create_item':
        return await this.monday.createItem(params);

      case 'updateItem':
      case 'update_item':
        return await this.monday.updateItem(params.itemId, params.updates);

      case 'getItem':
      case 'get_item':
        return await this.monday.getItem(params.itemId);

      case 'searchItems':
      case 'search':
        return await this.monday.searchItems(params.boardId, params.columnId, params.columnValue);

      case 'addUpdate':
      case 'add_update':
      case 'add_comment':
        return await this.monday.addUpdate(params.itemId, params.body);

      case 'moveItemToGroup':
      case 'move_to_group':
        return await this.monday.moveItemToGroup(params.itemId, params.groupId);

      case 'archiveItem':
      case 'archive':
        return await this.monday.archiveItem(params.itemId);

      case 'getBoards':
      case 'get_boards':
      case 'list_boards':
        return await this.monday.getBoards(params.limit || 10);

      default:
        throw new Error(`Unknown Monday.com action: ${action}`);
    }
  }
}

class PalantirMCPService implements IMCPService {
  private palantir: PalantirAIPService;

  constructor(config: NonNullable<MCPServiceConfig['palantir']>) {
    this.palantir = new PalantirAIPService(config);
  }

  getService(): PalantirAIPService {
    return this.palantir;
  }

  async executeAction(action: string, params: any): Promise<any> {
    switch (action) {
      case 'testConnection':
      case 'test_connection':
        return await this.palantir.testConnection();

      case 'listOntologies':
      case 'list_ontologies':
        return await this.palantir.listOntologies();

      case 'getOntology':
      case 'get_ontology':
        return await this.palantir.getOntology(params.ontologyRid);

      case 'getOntologyFullMetadata':
      case 'get_full_metadata':
        return await this.palantir.getOntologyFullMetadata(params.ontologyRid);

      case 'listObjectTypes':
      case 'list_object_types':
        return await this.palantir.listObjectTypes(params.ontologyRid);

      case 'getObjectType':
      case 'get_object_type':
        return await this.palantir.getObjectType(params.objectType, params.ontologyRid);

      case 'listObjects':
      case 'list_objects':
        return await this.palantir.listObjects(params.objectType, {
          pageSize: params.pageSize,
          pageToken: params.pageToken,
          orderBy: params.orderBy,
          select: params.select,
          ontologyRid: params.ontologyRid,
        });

      case 'getObject':
      case 'get_object':
        return await this.palantir.getObject(params.objectType, params.primaryKey, {
          select: params.select,
          ontologyRid: params.ontologyRid,
        });

      case 'searchObjects':
      case 'search_objects':
      case 'search':
        return await this.palantir.searchObjects(params.objectType, params.filter || params.where, {
          pageSize: params.pageSize,
          pageToken: params.pageToken,
          orderBy: params.orderBy,
          select: params.select,
          ontologyRid: params.ontologyRid,
        });

      case 'applyAction':
      case 'apply_action':
        return await this.palantir.applyAction(params.actionApiName, params.parameters, params.ontologyRid);

      case 'executeQuery':
      case 'execute_query':
        return await this.palantir.executeQuery(params.queryApiName, params.parameters, params.ontologyRid);

      case 'listQueryTypes':
      case 'list_query_types':
        return await this.palantir.listQueryTypes(params.ontologyRid);

      default:
        throw new Error(`Unknown Palantir AIP action: ${action}`);
    }
  }
}

const serviceRegistry: Map<string, IMCPService> = new Map();

/**
 * Load MCP configuration from environment or database
 */
function loadMCPConfig(): MCPServiceConfig {
  const config: MCPServiceConfig = {};

  // Load from environment variables
  if (process.env.JIRA_DOMAIN && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) {
    config.jira = {
      domain: process.env.JIRA_DOMAIN,
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    };
  }

  if (process.env.SERVICENOW_INSTANCE && process.env.SERVICENOW_USERNAME && process.env.SERVICENOW_PASSWORD) {
    config.servicenow = {
      instance: process.env.SERVICENOW_INSTANCE,
      username: process.env.SERVICENOW_USERNAME,
      password: process.env.SERVICENOW_PASSWORD,
    };
  }

  if (process.env.MONDAY_API_KEY || process.env.MONDAY_API_TOKEN) {
    config.monday = {
      apiToken: (process.env.MONDAY_API_KEY || process.env.MONDAY_API_TOKEN)!,
    };
  }

  if (process.env.PALANTIR_HOSTNAME && process.env.PALANTIR_TOKEN) {
    config.palantir = {
      hostname: process.env.PALANTIR_HOSTNAME,
      token: process.env.PALANTIR_TOKEN,
      ontologyRid: process.env.PALANTIR_ONTOLOGY_RID || undefined,
    };
  }

  return config;
}

/**
 * Initialize MCP services
 */
export function initializeMCPServices(): void {
  const config = loadMCPConfig();

  if (config.jira) {
    serviceRegistry.set('jira', new JiraMCPService(config.jira));
    console.log('[MCP] Jira service initialized');
  }

  if (config.servicenow) {
    serviceRegistry.set('servicenow', new ServiceNowMCPService(config.servicenow));
    console.log('[MCP] ServiceNow service initialized');
  }

  if (config.monday) {
    serviceRegistry.set('monday', new MondayMCPService(config.monday));
    console.log('[MCP] Monday.com service initialized');
  }

  if (config.palantir) {
    serviceRegistry.set('palantir', new PalantirMCPService(config.palantir));
    console.log('[MCP] Palantir AIP service initialized');
  }

  if (serviceRegistry.size === 0) {
    console.warn('[MCP] No services configured - using mock responses. Add credentials to .env file.');
  } else {
    console.log(`[MCP] ${serviceRegistry.size} services ready`);
  }
}

/**
 * Get an MCP service by name
 */
export async function getMCPService(serviceName: string): Promise<IMCPService | null> {
  // Normalize service name
  const normalizedName = serviceName.toLowerCase().replace(/[^a-z]/g, '');

  // Initialize services if not done yet
  if (serviceRegistry.size === 0) {
    initializeMCPServices();
  }

  return serviceRegistry.get(normalizedName) || null;
}

/**
 * Get list of configured services
 */
export function getConfiguredServices(): string[] {
  if (serviceRegistry.size === 0) {
    initializeMCPServices();
  }
  return Array.from(serviceRegistry.keys());
}

export function getPalantirService(): PalantirAIPService | null {
  if (serviceRegistry.size === 0) {
    initializeMCPServices();
  }
  const svc = serviceRegistry.get('palantir');
  if (svc && svc instanceof PalantirMCPService) {
    return (svc as PalantirMCPService).getService();
  }
  return null;
}
