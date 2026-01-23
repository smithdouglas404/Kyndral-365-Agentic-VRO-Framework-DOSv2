/**
 * INTELLIGENT DATA CONFLICT RESOLVER
 *
 * THE REAL POWER: Handling data from MULTIPLE sources simultaneously.
 *
 * Problem: Enterprise clients use MULTIPLE PM tools for the SAME project:
 * - Jira tracks Agile work (sprints, stories)
 * - ServiceNow tracks IT operations (infrastructure, changes)
 * - Planview tracks portfolio financials (budget, ROI)
 * - Azure DevOps tracks code/builds (CI/CD, releases)
 *
 * Example Conflict Scenario:
 * - Jira says project is "In Progress" (dev team is coding)
 * - ServiceNow says project is "On Hold" (IT ops blocked on infrastructure)
 * - Planview says project is "At Risk" (budget overrun)
 *
 * Which status is correct? ALL OF THEM - from different perspectives.
 *
 * Solution: INTELLIGENT CONFLICT RESOLUTION
 * - Detect conflicts across data sources
 * - Apply resolution strategies based on business rules
 * - Create "golden record" with highest confidence data
 * - Track data lineage (which field came from which source)
 * - Alert on significant conflicts (requires human decision)
 *
 * THIS IS WHAT EXCITES CLIENTS.
 * They don't have to choose one tool - they can use ALL tools,
 * and the system intelligently merges the data.
 */

import type { CanonicalProject, DataSourceType } from './UniversalDataAdapter.js';
import type { IStorage } from '../storage.js';

/**
 * Data Source Authority (which source is authoritative for which field)
 */
interface DataSourceAuthority {
  source: DataSourceType;
  fields: string[];                       // Fields this source is authoritative for
  priority: number;                       // 1 (highest) to 10 (lowest)
  confidenceModifier: number;             // Multiplier for confidence (0.8 - 1.2)
}

/**
 * Default authority rules (can be customized per client)
 */
const DEFAULT_AUTHORITY_RULES: DataSourceAuthority[] = [
  // Financial data: Planview is authoritative
  {
    source: 'planview' as DataSourceType,
    fields: ['budget', 'budgetSpent', 'expectedROI', 'actualROI', 'portfolioTheme'],
    priority: 1,
    confidenceModifier: 1.2,
  },

  // Agile metrics: Jira is authoritative
  {
    source: 'jira' as DataSourceType,
    fields: ['percentComplete', 'artName', 'epicId', 'piId', 'team'],
    priority: 1,
    confidenceModifier: 1.2,
  },

  // IT operations: ServiceNow is authoritative
  {
    source: 'servicenow' as DataSourceType,
    fields: ['owner', 'sponsor', 'divisionId', 'criticalRiskCount'],
    priority: 1,
    confidenceModifier: 1.2,
  },

  // DevOps metrics: Azure DevOps is authoritative
  {
    source: 'azure_devops' as DataSourceType,
    fields: ['defectCount', 'cpi', 'spi'],
    priority: 1,
    confidenceModifier: 1.2,
  },

  // Excel/Sheets: Lowest priority (manual data entry, prone to staleness)
  {
    source: 'excel' as DataSourceType,
    fields: [],
    priority: 9,
    confidenceModifier: 0.8,
  },
  {
    source: 'google_sheets' as DataSourceType,
    fields: [],
    priority: 9,
    confidenceModifier: 0.8,
  },
];

/**
 * Conflict severity
 */
enum ConflictSeverity {
  LOW = 'low',           // Minor differences, can auto-resolve
  MEDIUM = 'medium',     // Significant differences, flag for review
  HIGH = 'high',         // Critical differences, requires human decision
}

/**
 * Data conflict record
 */
interface DataConflict {
  field: string;
  severity: ConflictSeverity;
  values: Array<{
    source: DataSourceType;
    value: any;
    confidence: number;
    timestamp: Date;
  }>;
  resolvedValue?: any;
  resolutionStrategy: string;
  requiresHumanReview: boolean;
  recommendation: string;
}

/**
 * Golden Record (merged result)
 */
interface GoldenRecord extends CanonicalProject {
  dataLineage: Record<string, {
    source: DataSourceType;
    confidence: number;
    timestamp: Date;
  }>;
  conflicts: DataConflict[];
  qualityScore: number;
  lastMergedAt: Date;
}

/**
 * Merge result
 */
interface MergeResult {
  success: boolean;
  goldenRecord?: GoldenRecord;
  conflicts: DataConflict[];
  highSeverityConflicts: number;
  requiresHumanReview: boolean;
  recommendations: string[];
}

export class DataConflictResolver {
  private storage: IStorage;
  private authorityRules: DataSourceAuthority[];

  constructor(storage: IStorage, customRules?: DataSourceAuthority[]) {
    this.storage = storage;
    this.authorityRules = customRules || DEFAULT_AUTHORITY_RULES;

    console.log('[ConflictResolver] Initialized with authority rules for', this.authorityRules.length, 'sources');
  }

  /**
   * Merge multiple canonical projects from different sources
   *
   * THIS IS THE MAGIC.
   */
  async merge(projects: CanonicalProject[]): Promise<MergeResult> {
    const result: MergeResult = {
      success: false,
      conflicts: [],
      highSeverityConflicts: 0,
      requiresHumanReview: false,
      recommendations: [],
    };

    if (projects.length === 0) {
      result.success = false;
      return result;
    }

    if (projects.length === 1) {
      // No conflicts - single source
      result.success = true;
      result.goldenRecord = {
        ...projects[0],
        dataLineage: this.buildLineage(projects[0]),
        conflicts: [],
        qualityScore: projects[0].dataQualityScore || 50,
        lastMergedAt: new Date(),
      };
      return result;
    }

    console.log(`[ConflictResolver] Merging ${projects.length} projects from different sources...`);

    // Initialize golden record with first project as baseline
    const goldenRecord: any = { ...projects[0] };
    const dataLineage: Record<string, any> = {};
    const conflicts: DataConflict[] = [];

    // Get all field names
    const allFields = new Set<string>();
    projects.forEach(p => {
      Object.keys(p).forEach(field => allFields.add(field));
    });

    // For each field, resolve conflicts
    for (const field of allFields) {
      // Skip metadata fields
      if (['rawSourceData', 'lastSyncedAt', 'dataQualityScore'].includes(field)) {
        continue;
      }

      // Get all values for this field
      const values = projects
        .filter(p => (p as any)[field] !== undefined && (p as any)[field] !== null)
        .map(p => ({
          source: p.externalSource,
          value: (p as any)[field],
          confidence: this.getConfidence(field, p.externalSource),
          timestamp: p.lastSyncedAt,
        }));

      if (values.length === 0) {
        continue; // Field not present in any source
      }

      if (values.length === 1) {
        // No conflict - single source has this field
        goldenRecord[field] = values[0].value;
        dataLineage[field] = values[0];
        continue;
      }

      // Check for conflicts
      const conflict = this.detectConflict(field, values);

      if (conflict) {
        conflicts.push(conflict);

        if (conflict.severity === ConflictSeverity.HIGH) {
          result.highSeverityConflicts++;
          result.requiresHumanReview = true;
        }

        // Apply resolution strategy
        const resolvedValue = this.resolveConflict(conflict);
        goldenRecord[field] = resolvedValue;
        dataLineage[field] = {
          source: 'merged',
          confidence: 0.85, // Merged data has slightly lower confidence
          timestamp: new Date(),
        };

        result.recommendations.push(conflict.recommendation);
      } else {
        // Same value across sources - take highest confidence
        const bestValue = values.sort((a, b) => b.confidence - a.confidence)[0];
        goldenRecord[field] = bestValue.value;
        dataLineage[field] = bestValue;
      }
    }

    // Calculate overall quality score
    const qualityScore = this.calculateGoldenRecordQuality(goldenRecord, conflicts);

    result.success = true;
    result.goldenRecord = {
      ...goldenRecord,
      dataLineage,
      conflicts,
      qualityScore,
      lastMergedAt: new Date(),
    };
    result.conflicts = conflicts;

    console.log(`[ConflictResolver] Merge complete: ${conflicts.length} conflicts detected, ${result.highSeverityConflicts} require human review`);

    return result;
  }

  /**
   * Detect if field values conflict across sources
   */
  private detectConflict(field: string, values: Array<any>): DataConflict | null {
    // Check if all values are the same
    const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));

    if (uniqueValues.size === 1) {
      return null; // No conflict
    }

    // Determine severity
    let severity: ConflictSeverity = ConflictSeverity.LOW;

    // Critical fields get higher severity
    const criticalFields = ['status', 'budget', 'endDate', 'priority', 'percentComplete'];
    if (criticalFields.includes(field)) {
      severity = ConflictSeverity.MEDIUM;
    }

    // Check magnitude of difference for numeric fields
    if (field === 'budget' || field === 'budgetSpent') {
      const numericValues = values.map(v => parseFloat(v.value)).filter(v => !isNaN(v));
      if (numericValues.length >= 2) {
        const max = Math.max(...numericValues);
        const min = Math.min(...numericValues);
        const variance = ((max - min) / max) * 100;

        if (variance > 50) {
          severity = ConflictSeverity.HIGH; // >50% difference
        } else if (variance > 20) {
          severity = ConflictSeverity.MEDIUM;
        }
      }
    }

    // Status conflicts are always high severity
    if (field === 'status') {
      severity = ConflictSeverity.HIGH;
    }

    const conflict: DataConflict = {
      field,
      severity,
      values,
      resolutionStrategy: 'pending',
      requiresHumanReview: severity === ConflictSeverity.HIGH,
      recommendation: this.generateRecommendation(field, values, severity),
    };

    return conflict;
  }

  /**
   * Resolve conflict using strategy
   */
  private resolveConflict(conflict: DataConflict): any {
    // Strategy 1: Use authoritative source
    const authoritativeSource = this.getAuthoritativeSource(conflict.field);
    if (authoritativeSource) {
      const authValue = conflict.values.find(v => v.source === authoritativeSource);
      if (authValue) {
        conflict.resolvedValue = authValue.value;
        conflict.resolutionStrategy = `Authoritative source: ${authoritativeSource}`;
        return authValue.value;
      }
    }

    // Strategy 2: Most recent data wins
    const mostRecent = conflict.values.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    conflict.resolvedValue = mostRecent.value;
    conflict.resolutionStrategy = 'Most recent data';
    return mostRecent.value;
  }

  /**
   * Get authoritative source for field
   */
  private getAuthoritativeSource(field: string): DataSourceType | null {
    for (const rule of this.authorityRules) {
      if (rule.fields.includes(field)) {
        return rule.source;
      }
    }
    return null;
  }

  /**
   * Get confidence score for source/field combination
   */
  private getConfidence(field: string, source: DataSourceType): number {
    const rule = this.authorityRules.find(r => r.source === source);
    if (!rule) return 0.7; // Default confidence

    const isAuthoritativeField = rule.fields.includes(field);
    const baseConfidence = isAuthoritativeField ? 0.95 : 0.7;

    return baseConfidence * rule.confidenceModifier;
  }

  /**
   * Generate recommendation for conflict
   */
  private generateRecommendation(field: string, values: Array<any>, severity: ConflictSeverity): string {
    if (severity === ConflictSeverity.HIGH) {
      return `CRITICAL: ${field} has conflicting values across ${values.length} sources. Requires immediate human review to determine correct value.`;
    }

    if (field === 'status') {
      return `Status conflict detected. Different teams may have different views of project status. Consider using composite status (e.g., "Dev: In Progress, Ops: On Hold").`;
    }

    if (field === 'budget' || field === 'budgetSpent') {
      return `Financial data conflict. Verify with finance team which source is correct. Consider Planview as authoritative source for financial data.`;
    }

    return `${field} has minor differences across sources. Using most recent value, but recommend periodic reconciliation.`;
  }

  /**
   * Calculate quality score for golden record
   */
  private calculateGoldenRecordQuality(goldenRecord: any, conflicts: DataConflict[]): number {
    let score = 100;

    // Deduct points for conflicts
    conflicts.forEach(conflict => {
      if (conflict.severity === ConflictSeverity.HIGH) {
        score -= 15;
      } else if (conflict.severity === ConflictSeverity.MEDIUM) {
        score -= 8;
      } else {
        score -= 3;
      }
    });

    // Deduct points for missing critical fields
    const criticalFields = ['name', 'status', 'startDate', 'endDate', 'budget', 'owner'];
    criticalFields.forEach(field => {
      if (!goldenRecord[field]) {
        score -= 5;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Build data lineage for single project
   */
  private buildLineage(project: CanonicalProject): Record<string, any> {
    const lineage: Record<string, any> = {};

    Object.keys(project).forEach(field => {
      if ((project as any)[field] !== undefined) {
        lineage[field] = {
          source: project.externalSource,
          confidence: 1.0,
          timestamp: project.lastSyncedAt,
        };
      }
    });

    return lineage;
  }
}

/**
 * Export types
 */
export { ConflictSeverity, GoldenRecord, DataConflict, MergeResult, DataSourceAuthority };
