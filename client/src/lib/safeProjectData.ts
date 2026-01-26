// Comprehensive SAFe 6.0 Project Data Model
// This provides full depth: Portfolio Epic → Features → Stories → Tasks
// With Resources, Milestones, Dependencies, and Financials

// ============ TYPE DEFINITIONS ============

export interface Resource {
  id: string;
  name: string;
  role: 'RTE' | 'PM' | 'PO' | 'Architect' | 'Developer' | 'QA' | 'BA' | 'Scrum Master';
  allocation: number; // 0-100 percentage
  team: string;
  costRate: number; // daily rate in $
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  status: 'completed' | 'on-track' | 'at-risk' | 'missed';
  deliverables: string[];
  piNumber: number; // Which PI this belongs to
}

export interface Dependency {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  sourceFeatureId?: string;
  targetFeatureId?: string;
  type: 'blocks' | 'blocked-by' | 'related' | 'data-dependency' | 'api-dependency';
  health: 'green' | 'yellow' | 'red';
  description: string;
  impactIfDelayed: string;
  financialImpact?: number; // $ impact if delayed
}

export interface Financials {
  budget: number;
  spent: number;
  forecast: number;
  currency: '$';
  laborCost: number;
  vendorCost: number;
  infrastructureCost: number;
  contingency: number;
  roi: {
    projected: number;
    confidence: number;
    paybackMonths: number;
  };
}

export interface Task {
  id: string;
  storyId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  assignee: string;
  estimatedHours: number;
  actualHours: number;
  priority: 'low' | 'medium' | 'high';
  // Optional schedule fields - computed by enrichment layer if not provided
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  blockedBy?: string[]; // Task IDs this is blocked by
}

export interface Story {
  id: string;
  featureId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  status: 'backlog' | 'ready' | 'in-progress' | 'done' | 'accepted';
  sprint: number;
  assignedTeam: string;
  tasks: Task[];
}

export interface Feature {
  id: string;
  epicId: string;
  title: string;
  description: string;
  benefitHypothesis: string;
  acceptanceCriteria: string[];
  wsjfScore: number; // Weighted Shortest Job First
  status: 'funnel' | 'analyzing' | 'backlog' | 'implementing' | 'done';
  targetPI: number;
  stories: Story[];
  dependencies: string[]; // Feature IDs this depends on
}

export interface SAFeProject {
  id: string;
  name: string;
  description: string;
  bu: 'Florida Power & Light' | 'NextEra Energy Resources' | 'Corporate & Other';
  portfolioTheme: string;
  artName: string; // Agile Release Train name
  
  // SAFe Stage
  safeStage: 'funnel' | 'reviewing' | 'analyzing' | 'backlog' | 'implementing' | 'done';
  
  // Status & Priority
  status: 'green' | 'amber' | 'red';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Timing
  startDate: string;
  targetEndDate: string;
  currentPI: number; // Current Program Increment (1-4)
  totalPIs: number;
  
  // Hierarchy
  features: Feature[];
  
  // Resources
  resources: Resource[];
  totalFTE: number;
  
  // Milestones
  milestones: Milestone[];
  
  // Dependencies (cross-project)
  dependencies: Dependency[];
  
  // Financials
  financials: Financials;
  
  // AI & VRO
  aiRecommendations: string[];
  vroInsights: string[];
  pmoDataFeeds: string[];
  riskFlags: string[];
  
  // Metrics
  velocity: number; // Story points per sprint
  burndownHealth: number; // 0-100
  qualityScore: number; // 0-100
}

// ============ PROJECT DATA ============
// ⚠️ DEPRECATED: Hardcoded project data removed January 26, 2026
//
// This file previously contained 1,500+ lines of hardcoded SAFe project data
// that has been removed and replaced with database-backed API endpoints.
//
// ✅ USE INSTEAD: Fetch projects from API endpoints:
//    - /api/safe-projects - Get SAFe project hierarchy
//    - /api/projects - Get enriched project data
//    - /api/portfolio/* - Get portfolio-level data
//
// This file now only exports TypeScript types for backwards compatibility.
// The types are used by:
//   - client/src/pages/ProjectDetailPage.tsx (type imports only)
//   - client/src/lib/projects.ts (being phased out)

/**
 * @deprecated Use /api/safe-projects instead
 * Empty array maintained for backwards compatibility only
 */
export const safeProjects: SAFeProject[] = [];
