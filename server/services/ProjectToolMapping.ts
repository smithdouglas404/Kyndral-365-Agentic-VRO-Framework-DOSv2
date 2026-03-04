/**
 * PROJECT-TO-TOOL MAPPING SERVICE
 *
 * Maps projects to different PM tools based on:
 * - Project methodology (SAFe, Scrum, Kanban, Waterfall)
 * - Tool capabilities
 * - Data type support
 *
 * Supported tools:
 * - Jira: Enterprise standard, good Scrum/Kanban support
 * - Monday.com: Visual boards, custom workflows
 * - OpenProject: Open-source, Gantt charts, work packages, SAFe support
 *
 * AIP Value: Semantic translation layer unifies all tools into
 * a common SAFe portfolio view regardless of source tool.
 */

import { JiraClient, createJiraClientFromAdapter } from '../jiraClient.js';
import { MondayClient } from '../mondayClient.js';
import { storage } from '../storage.js';

export type PMTool = 'jira' | 'monday' | 'openproject';
export type Methodology = 'safe' | 'scrum' | 'kanban' | 'waterfall' | 'hybrid';

export interface ToolCapabilities {
  tool: PMTool;
  supportsEpics: boolean;
  supportsFeatures: boolean;
  supportsStories: boolean;
  supportsTasks: boolean;
  supportsSprints: boolean;
  supportsPI: boolean; // Program Increment
  supportsReleaseTrains: boolean;
  supportsStoryPoints: boolean;
  supportsCustomFields: boolean;
  methodology: Methodology[];
}

export interface ProjectToolMapping {
  projectId: string;
  projectName: string;
  tool: PMTool;
  externalProjectId: string;
  externalProjectKey?: string;
  adapterId: string;
  methodology: Methodology;
  syncEnabled: boolean;
  lastSyncAt?: Date;
  dataMapping: DataMapping;
}

export interface DataMapping {
  // How to map internal entities to external tool entities
  epic: string;      // e.g., "Epic" in Jira, "Epic" in OpenProject
  feature: string;   // e.g., "Story" in Jira (if no Feature type), "Feature" in OpenProject
  story: string;     // e.g., "Story" in Jira, "User Story" in OpenProject
  task: string;      // e.g., "Sub-task" in Jira, "Task" in OpenProject
  sprint: string;    // e.g., "Sprint" in Jira, "Sprint" in OpenProject
}

// Tool capabilities matrix
export const TOOL_CAPABILITIES: Record<PMTool, ToolCapabilities> = {
  jira: {
    tool: 'jira',
    supportsEpics: true,
    supportsFeatures: false, // Requires custom issue type
    supportsStories: true,
    supportsTasks: true,
    supportsSprints: true,
    supportsPI: false, // Requires Advanced Roadmaps
    supportsReleaseTrains: false,
    supportsStoryPoints: true,
    supportsCustomFields: true,
    methodology: ['scrum', 'kanban', 'hybrid'],
  },
  monday: {
    tool: 'monday',
    supportsEpics: false, // Groups can simulate
    supportsFeatures: false,
    supportsStories: true, // Items
    supportsTasks: true,  // Subitems
    supportsSprints: false, // Timeline/Gantt
    supportsPI: false,
    supportsReleaseTrains: false,
    supportsStoryPoints: false, // Custom column needed
    supportsCustomFields: true,
    methodology: ['kanban', 'hybrid'],
  },
  openproject: {
    tool: 'openproject',
    supportsEpics: true,
    supportsFeatures: true,
    supportsStories: true,
    supportsTasks: true,
    supportsSprints: true,
    supportsPI: true,       // Can model with Milestones
    supportsReleaseTrains: false,
    supportsStoryPoints: true,
    supportsCustomFields: true,
    methodology: ['safe', 'scrum', 'waterfall', 'hybrid'],
  },
};

// Default data mappings per tool
export const DEFAULT_DATA_MAPPINGS: Record<PMTool, DataMapping> = {
  jira: {
    epic: 'Epic',
    feature: 'Story', // Jira doesn't have Feature by default
    story: 'Story',
    task: 'Sub-task',
    sprint: 'Sprint',
  },
  monday: {
    epic: 'Group',
    feature: 'Item',
    story: 'Item',
    task: 'Subitem',
    sprint: 'Timeline',
  },
  openproject: {
    epic: 'Epic',
    feature: 'Feature',
    story: 'User Story',
    task: 'Task',
    sprint: 'Sprint',
  },
};

class ProjectToolMappingService {
  private mappings: Map<string, ProjectToolMapping> = new Map();

  constructor() {
    // Initialize with demo mappings
    this.initializeDemoMappings();
  }

  /**
   * Initialize project-to-tool mappings for all 22 SAFe projects
   * Distributed across 4 PM tools to demonstrate multi-tool support
   */
  private initializeDemoMappings() {
    // =========================================================================
    // DIGITAL PLATFORM VALUE STREAM - Jira (Scrum/Kanban)
    // =========================================================================
    this.addMapping({
      projectId: 'prj-001',
      projectName: 'Customer Portal 2.0',
      tool: 'jira',
      externalProjectId: 'CP2',
      externalProjectKey: 'CP2',
      adapterId: 'jira-adapter-1',
      methodology: 'scrum',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.jira,
    });

    this.addMapping({
      projectId: 'prj-002',
      projectName: 'Mobile App Modernization',
      tool: 'jira',
      externalProjectId: 'MAM',
      externalProjectKey: 'MAM',
      adapterId: 'jira-adapter-1',
      methodology: 'scrum',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.jira,
    });

    this.addMapping({
      projectId: 'prj-003',
      projectName: 'API Gateway Modernization',
      tool: 'jira',
      externalProjectId: 'AGM',
      externalProjectKey: 'AGM',
      adapterId: 'jira-adapter-1',
      methodology: 'kanban',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.jira,
    });

    this.addMapping({
      projectId: 'prj-004',
      projectName: 'Design System Implementation',
      tool: 'jira',
      externalProjectId: 'DSI',
      externalProjectKey: 'DSI',
      adapterId: 'jira-adapter-1',
      methodology: 'kanban',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.jira,
    });

    this.addMapping({
      projectId: 'prj-005',
      projectName: 'Headless CMS Migration',
      tool: 'jira',
      externalProjectId: 'HCM',
      externalProjectKey: 'HCM',
      adapterId: 'jira-adapter-1',
      methodology: 'scrum',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.jira,
    });

    // =========================================================================
    // DATA & ANALYTICS VALUE STREAM - OpenProject (SAFe/Hybrid)
    // =========================================================================
    this.addMapping({
      projectId: 'prj-006',
      projectName: 'Enterprise Data Lake',
      tool: 'openproject',
      externalProjectId: 'atlas', // OpenProject project with migrated work packages
      adapterId: 'openproject-adapter-1',
      methodology: 'safe',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-007',
      projectName: 'ML Ops Platform',
      tool: 'openproject',
      externalProjectId: 'atlas', // OpenProject project with migrated work packages
      adapterId: 'openproject-adapter-1',
      methodology: 'safe',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });
    this.addMapping({
      projectId: 'prj-008',
      projectName: 'Real-Time Analytics Engine',
      tool: 'openproject',
      externalProjectId: 'realtime-analytics',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-009',
      projectName: 'Customer 360 Platform',
      tool: 'openproject',
      externalProjectId: 'customer-360',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-010',
      projectName: 'Sustainability Dashboard',
      tool: 'openproject',
      externalProjectId: 'sustainability-dash',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    // =========================================================================
    // CLOUD INFRASTRUCTURE VALUE STREAM - OpenProject (Waterfall/Hybrid)
    // =========================================================================
    this.addMapping({
      projectId: 'prj-011',
      projectName: 'AWS Migration Wave 1',
      tool: 'openproject',
      externalProjectId: 'aws-migration-1',
      adapterId: 'openproject-adapter-1',
      methodology: 'waterfall',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-012',
      projectName: 'Kubernetes Platform',
      tool: 'openproject',
      externalProjectId: 'k8s-platform',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-013',
      projectName: 'Zero Trust Security',
      tool: 'openproject',
      externalProjectId: 'zero-trust',
      adapterId: 'openproject-adapter-1',
      methodology: 'waterfall',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-014',
      projectName: 'DevOps Transformation',
      tool: 'openproject',
      externalProjectId: 'devops-transform',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-015',
      projectName: 'Governance Risk & Compliance',
      tool: 'openproject',
      externalProjectId: 'grc-platform',
      adapterId: 'openproject-adapter-1',
      methodology: 'waterfall',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    // =========================================================================
    // CUSTOMER OPERATIONS VALUE STREAM - Monday.com (Kanban/Visual)
    // =========================================================================
    this.addMapping({
      projectId: 'prj-016',
      projectName: 'Contact Center Modernization',
      tool: 'monday',
      externalProjectId: '1001',
      adapterId: 'monday-adapter-1',
      methodology: 'kanban',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.monday,
    });

    this.addMapping({
      projectId: 'prj-017',
      projectName: 'Salesforce CRM Upgrade',
      tool: 'monday',
      externalProjectId: '1002',
      adapterId: 'monday-adapter-1',
      methodology: 'kanban',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.monday,
    });

    this.addMapping({
      projectId: 'prj-018',
      projectName: 'Field Service Automation',
      tool: 'monday',
      externalProjectId: '1003',
      adapterId: 'monday-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.monday,
    });

    this.addMapping({
      projectId: 'prj-019',
      projectName: 'Customer Success Platform',
      tool: 'monday',
      externalProjectId: '1004',
      adapterId: 'monday-adapter-1',
      methodology: 'kanban',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.monday,
    });

    // =========================================================================
    // ENTERPRISE APPLICATIONS VALUE STREAM - OpenProject (Waterfall/Hybrid)
    // =========================================================================
    this.addMapping({
      projectId: 'prj-020',
      projectName: 'ERP Modernization (SAP S/4HANA)',
      tool: 'openproject', // ERP projects suit waterfall approach
      externalProjectId: 'erp-s4hana',
      adapterId: 'openproject-adapter-1',
      methodology: 'waterfall',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-021',
      projectName: 'Supply Chain Optimization',
      tool: 'openproject',
      externalProjectId: 'supply-chain-opt',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    this.addMapping({
      projectId: 'prj-022',
      projectName: 'Procurement Digital Transformation',
      tool: 'openproject',
      externalProjectId: 'procurement-dt',
      adapterId: 'openproject-adapter-1',
      methodology: 'hybrid',
      syncEnabled: true,
      dataMapping: DEFAULT_DATA_MAPPINGS.openproject,
    });

    console.log(`[ProjectToolMapping] Initialized ${this.mappings.size} project-to-tool mappings for all 22 SAFe projects`);
  }

  /**
   * Add a project-to-tool mapping
   */
  addMapping(mapping: ProjectToolMapping): void {
    this.mappings.set(mapping.projectId, mapping);
  }

  /**
   * Get mapping for a project
   */
  getMapping(projectId: string): ProjectToolMapping | undefined {
    return this.mappings.get(projectId);
  }

  /**
   * Get all mappings
   */
  getAllMappings(): ProjectToolMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get mappings by tool
   */
  getMappingsByTool(tool: PMTool): ProjectToolMapping[] {
    return this.getAllMappings().filter(m => m.tool === tool);
  }

  /**
   * Get mappings by methodology
   */
  getMappingsByMethodology(methodology: Methodology): ProjectToolMapping[] {
    return this.getAllMappings().filter(m => m.methodology === methodology);
  }

  /**
   * Get tool capabilities
   */
  getToolCapabilities(tool: PMTool): ToolCapabilities {
    return TOOL_CAPABILITIES[tool];
  }

  /**
   * Check if a tool supports a methodology
   */
  toolSupportsMethodology(tool: PMTool, methodology: Methodology): boolean {
    return TOOL_CAPABILITIES[tool].methodology.includes(methodology);
  }

  /**
   * Get recommended tool for a methodology
   */
  getRecommendedTool(methodology: Methodology): PMTool {
    switch (methodology) {
      case 'safe':
        return 'openproject'; // SAFe support with work packages
      case 'scrum':
        return 'jira';  // Enterprise standard
      case 'kanban':
        return 'monday'; // Visual boards
      case 'waterfall':
        return 'openproject'; // Gantt charts
      case 'hybrid':
        return 'jira'; // Most flexible
      default:
        return 'jira';
    }
  }

  /**
   * Get data deprecation warnings for a tool
   * Some tools don't support certain data types
   */
  getDataDeprecationWarnings(tool: PMTool): string[] {
    const warnings: string[] = [];
    const caps = TOOL_CAPABILITIES[tool];

    if (!caps.supportsEpics) {
      warnings.push('Epics will be converted to Groups or parent items');
    }
    if (!caps.supportsFeatures) {
      warnings.push('Features will be merged into Stories/Epics');
    }
    if (!caps.supportsPI) {
      warnings.push('Program Increments will be represented as Milestones/Releases');
    }
    if (!caps.supportsReleaseTrains) {
      warnings.push('Agile Release Trains will be represented as Projects/Boards');
    }
    if (!caps.supportsStoryPoints) {
      warnings.push('Story Points will be stored in custom fields');
    }

    return warnings;
  }

  /**
   * Get the AIP semantic translation explanation
   */
  getAIPValueExplanation(): string {
    return `
# AIP Semantic Translation Layer

## The Challenge
Different PM tools use different terminology and data models:
- Jira: Epic → Story → Sub-task
- Monday: Board → Group → Item → Subitem
- OpenProject: Work Package with types (Epic, Feature, User Story, Task)

## AIP Solution
Palantir's Semantic Layer provides:

1. **Unified Data Model**: All tools map to SAFe 6.0 hierarchy
   - Value Stream → Solution → Program Increment → Feature → Story → Task

2. **Bidirectional Sync**: Changes in any tool sync to Palantir and back
   - Write to Jira → Updates Palantir → Reflects in dashboards
   - Write via Atlas → Updates Palantir → Syncs to source tool

3. **Methodology Translation**:
   - Kanban (Monday) → SAFe Continuous Flow
   - Scrum (Jira) → SAFe Team Iteration
   - Waterfall (OpenProject) → SAFe Milestone-based

4. **KPI Aggregation**:
   - Velocity from all tools aggregated at portfolio level
   - Predictability calculated across methodologies
   - Flow metrics unified regardless of source

5. **Single Source of Truth**:
   - Palantir Foundry stores canonical data
   - Tools serve as input/output interfaces
   - Analytics run on unified dataset

## Benefits
- **For Executives**: Single portfolio view regardless of team tool choice
- **For PMO**: Consistent metrics across diverse project types
- **For Teams**: Use preferred tools without portfolio fragmentation
- **For AIP**: Rich ontology for AI-powered insights and predictions
    `.trim();
  }
}

// Singleton
let _mappingService: ProjectToolMappingService | null = null;

export function getProjectToolMappingService(): ProjectToolMappingService {
  if (!_mappingService) {
    _mappingService = new ProjectToolMappingService();
  }
  return _mappingService;
}
