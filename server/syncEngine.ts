import { storage } from "./storage";
import type { 
  SourceSystem, FieldMapping, IngestionJob, 
  InsertIngestionJob, InsertAgentActivityLog 
} from "@shared/schema";

export type EntityType = 
  | 'portfolio' | 'value_stream' | 'art' | 'team' | 'program_increment'
  | 'epic' | 'capability' | 'feature' | 'story' | 'task'
  | 'project' | 'milestone' | 'risk' | 'resource' | 'dependency'
  | 'okr' | 'key_result' | 'kpi';

export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';

export interface SyncConflict {
  id: string;
  entityType: EntityType;
  entityId: string;
  fieldName: string;
  localValue: any;
  remoteValue: any;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  resolution?: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
  resolvedValue?: any;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SyncResult {
  jobId: string;
  sourceSystemId: string;
  status: 'success' | 'partial' | 'failed';
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  conflicts: SyncConflict[];
  errors: string[];
  duration: number;
  startedAt: Date;
  completedAt: Date;
}

export interface TransformRule {
  sourceField: string;
  targetField: string;
  transformType: 'direct' | 'lookup' | 'formula' | 'custom';
  lookupTable?: Record<string, any>;
  formula?: string;
  customTransform?: (value: any, record: any) => any;
  defaultValue?: any;
  required?: boolean;
  validation?: (value: any) => boolean;
}

export interface EntityMapping {
  sourceEntityType: string;
  targetEntityType: EntityType;
  fieldRules: TransformRule[];
  identityFields: string[];
  conflictResolution: 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
}

const defaultEntityMappings: Record<string, EntityMapping> = {
  'jira_epic': {
    sourceEntityType: 'jira_epic',
    targetEntityType: 'epic',
    identityFields: ['externalId'],
    conflictResolution: 'newest_wins',
    fieldRules: [
      { sourceField: 'key', targetField: 'externalId', transformType: 'direct' },
      { sourceField: 'summary', targetField: 'name', transformType: 'direct', required: true },
      { sourceField: 'description', targetField: 'description', transformType: 'direct' },
      { sourceField: 'status.name', targetField: 'status', transformType: 'lookup', lookupTable: { 'To Do': 'funnel', 'In Progress': 'analyzing', 'Done': 'done' } },
      { sourceField: 'priority.name', targetField: 'priority', transformType: 'lookup', lookupTable: { 'Highest': 'critical', 'High': 'high', 'Medium': 'medium', 'Low': 'low' } },
      { sourceField: 'customfield_10001', targetField: 'businessValue', transformType: 'direct' },
      { sourceField: 'customfield_10002', targetField: 'timeCriticality', transformType: 'direct' },
    ]
  },
  'jira_story': {
    sourceEntityType: 'jira_story',
    targetEntityType: 'story',
    identityFields: ['externalId'],
    conflictResolution: 'newest_wins',
    fieldRules: [
      { sourceField: 'key', targetField: 'externalId', transformType: 'direct' },
      { sourceField: 'summary', targetField: 'name', transformType: 'direct', required: true },
      { sourceField: 'description', targetField: 'description', transformType: 'direct' },
      { sourceField: 'status.name', targetField: 'status', transformType: 'lookup', lookupTable: { 'To Do': 'todo', 'In Progress': 'in-progress', 'Done': 'done' } },
      { sourceField: 'customfield_10004', targetField: 'storyPoints', transformType: 'direct' },
      { sourceField: 'assignee.displayName', targetField: 'assignee', transformType: 'direct' },
    ]
  },
  'azure_work_item': {
    sourceEntityType: 'azure_work_item',
    targetEntityType: 'feature',
    identityFields: ['externalId'],
    conflictResolution: 'newest_wins',
    fieldRules: [
      { sourceField: 'id', targetField: 'externalId', transformType: 'direct' },
      { sourceField: 'fields.System.Title', targetField: 'name', transformType: 'direct', required: true },
      { sourceField: 'fields.System.Description', targetField: 'description', transformType: 'direct' },
      { sourceField: 'fields.System.State', targetField: 'status', transformType: 'lookup', lookupTable: { 'New': 'planned', 'Active': 'in-progress', 'Resolved': 'done', 'Closed': 'done' } },
      { sourceField: 'fields.Microsoft.VSTS.Scheduling.StoryPoints', targetField: 'storyPoints', transformType: 'direct' },
    ]
  },
  'servicenow_project': {
    sourceEntityType: 'servicenow_project',
    targetEntityType: 'project',
    identityFields: ['externalId'],
    conflictResolution: 'newest_wins',
    fieldRules: [
      { sourceField: 'sys_id', targetField: 'externalId', transformType: 'direct' },
      { sourceField: 'short_description', targetField: 'name', transformType: 'direct', required: true },
      { sourceField: 'description', targetField: 'description', transformType: 'direct' },
      { sourceField: 'state', targetField: 'status', transformType: 'lookup', lookupTable: { '1': 'green', '2': 'amber', '3': 'red' } },
      { sourceField: 'budget', targetField: 'budgetTotal', transformType: 'direct' },
      { sourceField: 'actual_cost', targetField: 'budgetSpent', transformType: 'direct' },
    ]
  }
};

export class SyncEngine {
  private entityMappings: Map<string, EntityMapping>;
  
  constructor() {
    this.entityMappings = new Map(Object.entries(defaultEntityMappings));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  private transformValue(value: any, rule: TransformRule, record: any): any {
    if (value === undefined || value === null) {
      return rule.defaultValue;
    }

    switch (rule.transformType) {
      case 'direct':
        return value;
      case 'lookup':
        return rule.lookupTable?.[value] ?? rule.defaultValue ?? value;
      case 'formula':
        try {
          const fn = new Function('value', 'record', `return ${rule.formula}`);
          return fn(value, record);
        } catch {
          return rule.defaultValue;
        }
      case 'custom':
        return rule.customTransform?.(value, record) ?? value;
      default:
        return value;
    }
  }

  private transformRecord(sourceRecord: any, mapping: EntityMapping): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const rule of mapping.fieldRules) {
      const sourceValue = this.getNestedValue(sourceRecord, rule.sourceField);
      const transformedValue = this.transformValue(sourceValue, rule, sourceRecord);
      
      if (rule.required && (transformedValue === undefined || transformedValue === null)) {
        throw new Error(`Required field '${rule.sourceField}' is missing`);
      }
      
      if (rule.validation && transformedValue !== undefined && !rule.validation(transformedValue)) {
        throw new Error(`Validation failed for field '${rule.sourceField}'`);
      }
      
      if (transformedValue !== undefined) {
        result[rule.targetField] = transformedValue;
      }
    }
    
    return result;
  }

  private detectConflict(
    localRecord: any, 
    remoteRecord: any, 
    mapping: EntityMapping,
    entityId: string
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    
    for (const rule of mapping.fieldRules) {
      const localValue = localRecord[rule.targetField];
      const remoteValue = this.getNestedValue(remoteRecord, rule.sourceField);
      const transformedRemote = this.transformValue(remoteValue, rule, remoteRecord);
      
      if (localValue !== transformedRemote && localValue !== undefined && transformedRemote !== undefined) {
        conflicts.push({
          id: `conflict-${entityId}-${rule.targetField}-${Date.now()}`,
          entityType: mapping.targetEntityType,
          entityId,
          fieldName: rule.targetField,
          localValue,
          remoteValue: transformedRemote,
          localUpdatedAt: localRecord.updatedAt || new Date(),
          remoteUpdatedAt: remoteRecord.updated || remoteRecord.changedDate || new Date(),
        });
      }
    }
    
    return conflicts;
  }

  private resolveConflict(conflict: SyncConflict, strategy: EntityMapping['conflictResolution']): SyncConflict {
    switch (strategy) {
      case 'local_wins':
        return { ...conflict, resolution: 'local_wins', resolvedValue: conflict.localValue, resolvedAt: new Date() };
      case 'remote_wins':
        return { ...conflict, resolution: 'remote_wins', resolvedValue: conflict.remoteValue, resolvedAt: new Date() };
      case 'newest_wins':
        if (conflict.remoteUpdatedAt > conflict.localUpdatedAt) {
          return { ...conflict, resolution: 'remote_wins', resolvedValue: conflict.remoteValue, resolvedAt: new Date() };
        }
        return { ...conflict, resolution: 'local_wins', resolvedValue: conflict.localValue, resolvedAt: new Date() };
      case 'manual':
      default:
        return { ...conflict, resolution: 'manual' };
    }
  }

  async startIngestionJob(
    sourceSystemId: string, 
    entityTypes: EntityType[], 
    direction: SyncDirection = 'inbound'
  ): Promise<IngestionJob> {
    const job = await storage.createIngestionJob({
      sourceSystemId,
      jobType: direction === 'inbound' ? 'full_import' : direction === 'outbound' ? 'full_export' : 'full_sync',
      status: 'pending',
      triggerType: 'manual',
      sourceData: JSON.stringify({ entityTypes }),
    });

    await this.logActivity('sync_started', `Starting ${direction} sync for ${entityTypes.join(', ')}`, sourceSystemId);
    
    return job;
  }

  async processInboundRecords(
    jobId: string,
    sourceSystemId: string,
    records: any[],
    sourceEntityType: string
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      jobId,
      sourceSystemId,
      status: 'success',
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      conflicts: [],
      errors: [],
      duration: 0,
      startedAt: new Date(),
      completedAt: new Date(),
    };

    await storage.updateIngestionJobStatus(jobId, 'running');
    
    const mapping = this.entityMappings.get(sourceEntityType);
    if (!mapping) {
      result.status = 'failed';
      result.errors.push(`No mapping found for entity type: ${sourceEntityType}`);
      await storage.updateIngestionJobStatus(jobId, 'failed');
      return result;
    }

    for (const record of records) {
      try {
        result.itemsProcessed++;
        const transformedData = this.transformRecord(record, mapping);
        
        transformedData.externalSystem = sourceSystemId;
        transformedData.externalUrl = record.self || record._links?.self?.href;
        transformedData.lastSyncAt = new Date();
        transformedData.syncStatus = 'synced';

        const existingId = transformedData.externalId;
        
        if (existingId) {
          const conflicts = this.detectConflict({}, record, mapping, existingId);
          
          for (const conflict of conflicts) {
            const resolved = this.resolveConflict(conflict, mapping.conflictResolution);
            result.conflicts.push(resolved);
            
            if (resolved.resolution !== 'manual') {
              transformedData[conflict.fieldName] = resolved.resolvedValue;
            }
          }
          
          result.itemsUpdated++;
        } else {
          result.itemsCreated++;
        }

        await this.logActivity(
          'record_synced', 
          `Synced ${mapping.targetEntityType}: ${transformedData.name || existingId}`,
          sourceSystemId
        );
        
      } catch (error: any) {
        result.itemsFailed++;
        result.errors.push(`Failed to process record: ${error.message}`);
      }
    }

    result.completedAt = new Date();
    result.duration = Date.now() - startTime;
    result.status = result.itemsFailed === 0 ? 'success' : result.itemsFailed < result.itemsProcessed ? 'partial' : 'failed';

    await storage.updateIngestionJobStatus(jobId, result.status === 'success' ? 'completed' : 'failed', {
      processed: result.itemsProcessed,
      created: result.itemsCreated,
      updated: result.itemsUpdated,
      failed: result.itemsFailed,
    });

    await this.logActivity(
      'sync_completed',
      `Sync completed: ${result.itemsCreated} created, ${result.itemsUpdated} updated, ${result.itemsFailed} failed`,
      sourceSystemId
    );

    return result;
  }

  async analyzeDataForMapping(
    sourceSystemId: string,
    sampleRecords: any[],
    sourceEntityType: string
  ): Promise<{
    suggestedMapping: EntityMapping | null;
    detectedFields: string[];
    matchConfidence: number;
    recommendations: string[];
  }> {
    const detectedFields: Set<string> = new Set();
    
    for (const record of sampleRecords.slice(0, 10)) {
      this.extractFields(record, '', detectedFields);
    }

    const fieldList = Array.from(detectedFields);
    let bestMatch: EntityMapping | null = null;
    let bestMatchScore = 0;

    for (const mapping of Array.from(this.entityMappings.values())) {
      let matchScore = 0;
      for (const rule of mapping.fieldRules) {
        if (fieldList.includes(rule.sourceField)) {
          matchScore++;
        }
      }
      
      const normalizedScore = matchScore / mapping.fieldRules.length;
      if (normalizedScore > bestMatchScore) {
        bestMatchScore = normalizedScore;
        bestMatch = mapping;
      }
    }

    const recommendations: string[] = [];
    if (bestMatchScore < 0.5) {
      recommendations.push('Consider creating custom field mappings for better data alignment');
    }
    if (fieldList.length > 20) {
      recommendations.push('Large number of fields detected - review which fields are essential for SAFe ontology');
    }

    return {
      suggestedMapping: bestMatch,
      detectedFields: fieldList,
      matchConfidence: bestMatchScore,
      recommendations,
    };
  }

  private extractFields(obj: any, prefix: string, fields: Set<string>): void {
    for (const key of Object.keys(obj || {})) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      fields.add(fullPath);
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        this.extractFields(obj[key], fullPath, fields);
      }
    }
  }

  async getFieldMappingsForSource(sourceSystemId: string): Promise<FieldMapping[]> {
    return await storage.getFieldMappings(sourceSystemId);
  }

  async getSyncHistory(sourceSystemId?: string, limit: number = 20): Promise<IngestionJob[]> {
    return await storage.getIngestionJobs(sourceSystemId);
  }

  private async logActivity(eventType: string, summary: string, sourceSystemId?: string): Promise<void> {
    await storage.createAgentActivityLog({
      eventType,
      primaryAgentId: 'sync-engine',
      primaryAgentName: 'Sync Engine',
      summary,
      details: sourceSystemId ? JSON.stringify({ sourceSystemId }) : undefined,
    });
  }

  registerEntityMapping(key: string, mapping: EntityMapping): void {
    this.entityMappings.set(key, mapping);
  }

  getAvailableMappings(): string[] {
    return Array.from(this.entityMappings.keys());
  }
}

export const syncEngine = new SyncEngine();
