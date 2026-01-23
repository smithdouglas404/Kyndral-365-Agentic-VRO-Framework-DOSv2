/**
 * UNIVERSAL DATA ADAPTER FRAMEWORK
 *
 * THIS IS THE POWER OF THE ONTOLOGY.
 *
 * Problem: Organizations use 5-10 different project management tools:
 * - Jira (Agile teams)
 * - ServiceNow (IT Operations)
 * - Azure DevOps (Microsoft shops)
 * - Planview (Enterprise PMO)
 * - Smartsheet (Business teams)
 * - Rally (Large enterprises)
 * - Asana (Marketing/Creative)
 * - Monday.com (Small teams)
 * - MS Project (Traditional PM)
 *
 * Each tool has DIFFERENT data models:
 * - Jira: issues, epics, sprints
 * - ServiceNow: incidents, changes, projects
 * - Azure DevOps: work items, iterations
 * - Planview: projects, portfolios, work breakdown
 *
 * Solution: ONTOLOGY-DRIVEN TRANSFORMATION
 * - Define canonical ontology (our unified model)
 * - Each adapter maps tool-specific data → canonical ontology
 * - Agents work on UNIFIED data (don't care about source tool)
 * - Business sees ONE coherent view across ALL tools
 *
 * THIS IS WHAT EXCITES CLIENTS.
 * No more data silos. One unified portfolio view.
 */

import type { IStorage } from '../storage.js';
import { z } from 'zod';

/**
 * CANONICAL ONTOLOGY - The Universal Project Model
 *
 * This is our "source of truth" schema that ALL tools map to.
 * Based on PMI (Project Management Institute) standards + SAFe + ITIL.
 */

/**
 * Universal Project Status (mapped from all tools)
 */
export enum UniversalStatus {
  PLANNED = 'planned',           // Not started yet
  ACTIVE = 'active',             // In progress
  ON_HOLD = 'on_hold',          // Paused
  AT_RISK = 'at_risk',          // Issues detected
  COMPLETED = 'completed',       // Done
  CANCELLED = 'cancelled',       // Terminated
}

/**
 * Universal Priority (mapped from all tools)
 */
export enum UniversalPriority {
  CRITICAL = 'critical',         // P0 - Drop everything
  HIGH = 'high',                 // P1 - This sprint
  MEDIUM = 'medium',             // P2 - Next sprint
  LOW = 'low',                   // P3 - Backlog
}

/**
 * Data Source Types
 */
export enum DataSourceType {
  JIRA = 'jira',
  SERVICENOW = 'servicenow',
  AZURE_DEVOPS = 'azure_devops',
  PLANVIEW = 'planview',
  SMARTSHEET = 'smartsheet',
  RALLY = 'rally',
  ASANA = 'asana',
  MONDAY = 'monday',
  MS_PROJECT = 'ms_project',
  EXCEL = 'excel',
  GOOGLE_SHEETS = 'google_sheets',
}

/**
 * Canonical Project Schema (our ontology)
 */
export const CanonicalProjectSchema = z.object({
  // Identity
  externalId: z.string(),                    // ID in source system
  externalSource: z.nativeEnum(DataSourceType), // Which tool it came from
  name: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),

  // Status & Priority
  status: z.nativeEnum(UniversalStatus),
  priority: z.nativeEnum(UniversalPriority).optional(),

  // Timeline
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),

  // Financials
  budget: z.number().nonnegative().optional(),
  budgetSpent: z.number().nonnegative().optional(),
  budgetRemaining: z.number().optional(),
  expectedROI: z.number().optional(),
  actualROI: z.number().optional(),

  // Progress
  percentComplete: z.number().min(0).max(100).optional(),

  // Performance Metrics (Earned Value Management)
  cpi: z.number().optional(),                // Cost Performance Index
  spi: z.number().optional(),                // Schedule Performance Index

  // Ownership
  owner: z.string().max(200).optional(),
  sponsor: z.string().max(200).optional(),
  team: z.array(z.string()).optional(),

  // Hierarchy
  portfolioId: z.string().optional(),
  programId: z.string().optional(),
  parentProjectId: z.string().optional(),

  // Strategic Alignment (VRO)
  portfolioTheme: z.string().optional(),
  okrObjective: z.string().optional(),
  okrKeyResult: z.string().optional(),
  divisionId: z.string().optional(),

  // SAFe Integration
  artName: z.string().optional(),            // Agile Release Train
  epicId: z.string().optional(),
  piId: z.string().optional(),               // Program Increment

  // Quality & Risk
  defectCount: z.number().nonnegative().optional(),
  criticalRiskCount: z.number().nonnegative().optional(),

  // Metadata
  lastSyncedAt: z.date(),
  dataQualityScore: z.number().min(0).max(100).optional(),

  // Raw data from source (for debugging)
  rawSourceData: z.record(z.unknown()).optional(),
});

export type CanonicalProject = z.infer<typeof CanonicalProjectSchema>;

/**
 * Transformation Result
 */
interface TransformationResult {
  success: boolean;
  canonicalProject?: CanonicalProject;
  validationErrors: string[];
  warnings: string[];
  confidence: number;              // 0-1, how confident we are in the mapping
}

/**
 * Data Quality Assessment
 */
interface DataQualityReport {
  score: number;                   // 0-100
  completenessScore: number;       // 0-100
  accuracyScore: number;           // 0-100
  consistencyScore: number;        // 0-100
  missingCriticalFields: string[];
  ambiguousFields: string[];
  recommendations: string[];
}

/**
 * Abstract Base Adapter
 *
 * All tool-specific adapters extend this.
 * Provides common transformation logic.
 */
export abstract class UniversalDataAdapter {
  protected storage: IStorage;
  protected sourceType: DataSourceType;

  // Status mapping (tool-specific → canonical)
  protected abstract statusMapping: Record<string, UniversalStatus>;

  // Priority mapping (tool-specific → canonical)
  protected abstract priorityMapping: Record<string, UniversalPriority>;

  // Field mapping (tool field names → canonical field names)
  protected abstract fieldMapping: Record<string, string>;

  constructor(storage: IStorage, sourceType: DataSourceType) {
    this.storage = storage;
    this.sourceType = sourceType;
  }

  /**
   * Transform tool-specific data → canonical ontology
   *
   * This is where the MAGIC happens.
   */
  async transform(rawData: any): Promise<TransformationResult> {
    const result: TransformationResult = {
      success: false,
      validationErrors: [],
      warnings: [],
      confidence: 1.0,
    };

    try {
      // Step 1: Map fields using adapter-specific mapping
      const mapped = this.mapFields(rawData);

      // Step 2: Normalize status
      mapped.status = this.normalizeStatus(rawData.status || rawData.state);
      if (!mapped.status) {
        result.warnings.push('Could not map status, defaulting to ACTIVE');
        mapped.status = UniversalStatus.ACTIVE;
        result.confidence *= 0.9;
      }

      // Step 3: Normalize priority
      mapped.priority = this.normalizePriority(rawData.priority || rawData.severity);
      if (!mapped.priority) {
        result.warnings.push('Could not map priority, defaulting to MEDIUM');
        mapped.priority = UniversalPriority.MEDIUM;
        result.confidence *= 0.95;
      }

      // Step 4: Parse dates
      mapped.startDate = this.parseDate(rawData.startDate || rawData.start || rawData.createdDate);
      mapped.endDate = this.parseDate(rawData.endDate || rawData.end || rawData.dueDate || rawData.targetDate);

      // Step 5: Parse financials
      mapped.budget = this.parseNumber(rawData.budget || rawData.totalBudget || rawData.estimatedCost);
      mapped.budgetSpent = this.parseNumber(rawData.budgetSpent || rawData.actualCost || rawData.spent);

      if (mapped.budget && mapped.budgetSpent) {
        mapped.budgetRemaining = mapped.budget - mapped.budgetSpent;
      }

      // Step 6: Parse progress
      mapped.percentComplete = this.parseNumber(rawData.percentComplete || rawData.progress || rawData.completion);
      if (mapped.percentComplete !== undefined && (mapped.percentComplete < 0 || mapped.percentComplete > 100)) {
        result.warnings.push('Progress out of range 0-100, clamping');
        mapped.percentComplete = Math.max(0, Math.min(100, mapped.percentComplete));
        result.confidence *= 0.95;
      }

      // Step 7: Calculate EVM metrics if possible
      if (mapped.budget && mapped.budgetSpent && mapped.percentComplete) {
        const earnedValue = (mapped.budget * mapped.percentComplete) / 100;
        const plannedValue = mapped.budget; // Simplified - would need schedule baseline

        mapped.cpi = mapped.budgetSpent > 0 ? earnedValue / mapped.budgetSpent : 1.0;
        mapped.spi = plannedValue > 0 ? earnedValue / plannedValue : 1.0;
      }

      // Step 8: Add metadata
      mapped.externalSource = this.sourceType;
      mapped.lastSyncedAt = new Date();
      mapped.rawSourceData = rawData; // Keep original for debugging

      // Step 9: Validate against canonical schema
      const validated = CanonicalProjectSchema.parse(mapped);

      // Step 10: Assess data quality
      const qualityReport = this.assessDataQuality(validated);
      validated.dataQualityScore = qualityReport.score;

      result.warnings.push(...qualityReport.recommendations);

      result.success = true;
      result.canonicalProject = validated;

      console.log(`[UniversalAdapter] Transformed ${this.sourceType} data with ${result.confidence * 100}% confidence`);

    } catch (error: any) {
      result.validationErrors.push(error.message);
      console.error(`[UniversalAdapter] Transformation failed:`, error);
    }

    return result;
  }

  /**
   * Map tool-specific field names to canonical names
   */
  protected mapFields(rawData: any): any {
    const mapped: any = {};

    for (const [canonicalField, sourceField] of Object.entries(this.fieldMapping)) {
      const value = this.getNestedValue(rawData, sourceField);
      if (value !== undefined) {
        mapped[canonicalField] = value;
      }
    }

    return mapped;
  }

  /**
   * Normalize status using adapter-specific mapping
   */
  protected normalizeStatus(rawStatus: string): UniversalStatus | undefined {
    if (!rawStatus) return undefined;

    const normalized = rawStatus.toLowerCase().trim();

    // Try exact mapping first
    if (this.statusMapping[normalized]) {
      return this.statusMapping[normalized];
    }

    // Try fuzzy matching
    for (const [pattern, canonicalStatus] of Object.entries(this.statusMapping)) {
      if (normalized.includes(pattern) || pattern.includes(normalized)) {
        return canonicalStatus;
      }
    }

    return undefined;
  }

  /**
   * Normalize priority using adapter-specific mapping
   */
  protected normalizePriority(rawPriority: string): UniversalPriority | undefined {
    if (!rawPriority) return undefined;

    const normalized = rawPriority.toLowerCase().trim();

    // Try exact mapping
    if (this.priorityMapping[normalized]) {
      return this.priorityMapping[normalized];
    }

    // Try fuzzy matching
    for (const [pattern, canonicalPriority] of Object.entries(this.priorityMapping)) {
      if (normalized.includes(pattern) || pattern.includes(normalized)) {
        return canonicalPriority;
      }
    }

    return undefined;
  }

  /**
   * Parse date from various formats
   */
  protected parseDate(value: any): Date | undefined {
    if (!value) return undefined;

    if (value instanceof Date) return value;

    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Parse number safely
   */
  protected parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;

    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Get nested value from object using dot notation
   */
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Assess data quality of transformed project
   */
  protected assessDataQuality(project: CanonicalProject): DataQualityReport {
    const report: DataQualityReport = {
      score: 0,
      completenessScore: 0,
      accuracyScore: 100, // Assume accurate unless we find issues
      consistencyScore: 100,
      missingCriticalFields: [],
      ambiguousFields: [],
      recommendations: [],
    };

    // Check completeness of critical fields
    const criticalFields = [
      'name', 'status', 'startDate', 'endDate', 'budget',
      'owner', 'portfolioTheme', 'priority'
    ];

    let presentCount = 0;
    for (const field of criticalFields) {
      if ((project as any)[field]) {
        presentCount++;
      } else {
        report.missingCriticalFields.push(field);
      }
    }

    report.completenessScore = Math.round((presentCount / criticalFields.length) * 100);

    // Check consistency
    if (project.budget && project.budgetSpent && project.budgetSpent > project.budget * 1.5) {
      report.consistencyScore -= 20;
      report.recommendations.push('Budget spent exceeds budget by >50% - verify data');
    }

    if (project.startDate && project.endDate && project.startDate > project.endDate) {
      report.consistencyScore -= 30;
      report.recommendations.push('Start date after end date - invalid timeline');
    }

    if (project.percentComplete === 100 && project.status !== UniversalStatus.COMPLETED) {
      report.consistencyScore -= 10;
      report.recommendations.push('100% complete but status not COMPLETED - inconsistent');
    }

    // Calculate overall score (weighted average)
    report.score = Math.round(
      (report.completenessScore * 0.5) +
      (report.accuracyScore * 0.3) +
      (report.consistencyScore * 0.2)
    );

    return report;
  }

  /**
   * Batch transform multiple projects
   */
  async transformBatch(rawDataArray: any[]): Promise<{
    successful: CanonicalProject[];
    failed: Array<{ rawData: any; errors: string[] }>;
    stats: {
      total: number;
      successful: number;
      failed: number;
      averageConfidence: number;
      averageDataQuality: number;
    };
  }> {
    const successful: CanonicalProject[] = [];
    const failed: Array<{ rawData: any; errors: string[] }> = [];
    let totalConfidence = 0;
    let totalQuality = 0;

    for (const rawData of rawDataArray) {
      const result = await this.transform(rawData);

      if (result.success && result.canonicalProject) {
        successful.push(result.canonicalProject);
        totalConfidence += result.confidence;
        totalQuality += result.canonicalProject.dataQualityScore || 0;
      } else {
        failed.push({
          rawData,
          errors: result.validationErrors,
        });
      }
    }

    return {
      successful,
      failed,
      stats: {
        total: rawDataArray.length,
        successful: successful.length,
        failed: failed.length,
        averageConfidence: successful.length > 0 ? totalConfidence / successful.length : 0,
        averageDataQuality: successful.length > 0 ? totalQuality / successful.length : 0,
      },
    };
  }
}

/**
 * Export canonical types for use in adapters
 */
export { UniversalStatus, UniversalPriority, DataSourceType };
export type { DataQualityReport, TransformationResult };
