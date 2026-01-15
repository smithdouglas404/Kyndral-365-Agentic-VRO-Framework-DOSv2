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
// 18 richly detailed projects (3-4 per Group Function Portfolio)

export const safeProjects: SAFeProject[] = [
  // ============ INSTITUTIONAL RETIREMENT (4 projects) ============
  {
    id: 'proj-prt-platform',
    name: 'PRT Platform Modernization',
    description: 'Complete modernization of the Pension Risk Transfer platform to support $10bn+ annual volume. Includes API-first architecture, real-time pricing engine, and automated underwriting workflows.',
    bu: 'Florida Power & Light',
    portfolioTheme: 'Digital Transformation',
    artName: 'Retirement Solutions ART',
    safeStage: 'implementing',
    status: 'amber',
    priority: 'critical',
    startDate: '2025-01-15',
    targetEndDate: '2026-06-30',
    currentPI: 3,
    totalPIs: 6,
    features: [
      {
        id: 'feat-prt-pricing',
        epicId: 'proj-prt-platform',
        title: 'Real-Time Pricing Engine',
        description: 'Sub-second pricing calculations for bulk annuity quotes using actuarial models',
        benefitHypothesis: 'Reduce quote turnaround from 5 days to 4 hours, improving win rate by 15%',
        acceptanceCriteria: ['Price 10,000 lives in <30 seconds', 'Support longevity hedging scenarios', 'Audit trail for all calculations'],
        wsjfScore: 28,
        status: 'implementing',
        targetPI: 3,
        stories: [
          {
            id: 'story-prt-001',
            featureId: 'feat-prt-pricing',
            title: 'Mortality table integration',
            description: 'Integrate CMI mortality projections with pricing model',
            acceptanceCriteria: ['Load 2024 CMI tables', 'Apply improvement factors', 'Validate against legacy system'],
            storyPoints: 8,
            status: 'done',
            sprint: 7,
            assignedTeam: 'Actuarial Engineering',
            tasks: [
              { id: 'task-001', storyId: 'story-prt-001', title: 'Parse CMI XML format', description: 'Extract mortality rates from CMI data files', status: 'done', assignee: 'James Chen', estimatedHours: 8, actualHours: 6, priority: 'high' },
              { id: 'task-002', storyId: 'story-prt-001', title: 'Build rate interpolation', description: 'Interpolate rates for non-standard ages', status: 'done', assignee: 'Sarah Williams', estimatedHours: 12, actualHours: 14, priority: 'high' },
              { id: 'task-003', storyId: 'story-prt-001', title: 'Validation test suite', description: 'Compare outputs against Excel model', status: 'done', assignee: 'Michael Brown', estimatedHours: 6, actualHours: 8, priority: 'medium' }
            ]
          },
          {
            id: 'story-prt-002',
            featureId: 'feat-prt-pricing',
            title: 'Bulk pricing API endpoint',
            description: 'REST API to accept member data CSV and return pricing',
            acceptanceCriteria: ['Handle 50,000 row CSV', 'Return JSON with member-level prices', 'Async processing for large files'],
            storyPoints: 13,
            status: 'in-progress',
            sprint: 8,
            assignedTeam: 'Platform API Team',
            tasks: [
              { id: 'task-004', storyId: 'story-prt-002', title: 'Design API schema', description: 'OpenAPI spec for pricing endpoint', status: 'done', assignee: 'Emily Davis', estimatedHours: 4, actualHours: 4, priority: 'high' },
              { id: 'task-005', storyId: 'story-prt-002', title: 'Implement file upload', description: 'S3 integration for CSV storage', status: 'done', assignee: 'David Wilson', estimatedHours: 8, actualHours: 10, priority: 'high' },
              { id: 'task-006', storyId: 'story-prt-002', title: 'Build async queue', description: 'SQS-based job queue for large files', status: 'in-progress', assignee: 'Lisa Anderson', estimatedHours: 16, actualHours: 12, priority: 'high' },
              { id: 'task-007', storyId: 'story-prt-002', title: 'Response aggregation', description: 'Compile member results into response', status: 'todo', assignee: 'Tom Harris', estimatedHours: 8, actualHours: 0, priority: 'medium' }
            ]
          },
          {
            id: 'story-prt-003',
            featureId: 'feat-prt-pricing',
            title: 'Longevity scenario modeling',
            description: 'Run multiple mortality improvement scenarios for risk analysis',
            acceptanceCriteria: ['Support 5 standard scenarios', 'Calculate confidence intervals', 'Export to Excel for trustees'],
            storyPoints: 8,
            status: 'ready',
            sprint: 9,
            assignedTeam: 'Actuarial Engineering',
            tasks: [
              { id: 'task-008', storyId: 'story-prt-003', title: 'Define scenario parameters', description: 'CMI scenarios S1-S5 configuration', status: 'done', assignee: 'James Chen', estimatedHours: 4, actualHours: 3, priority: 'medium' },
              { id: 'task-009', storyId: 'story-prt-003', title: 'Monte Carlo simulation', description: 'Stochastic mortality model', status: 'todo', assignee: 'Sarah Williams', estimatedHours: 20, actualHours: 0, priority: 'high' }
            ]
          }
        ],
        dependencies: ['feat-data-lake']
      },
      {
        id: 'feat-prt-underwriting',
        epicId: 'proj-prt-platform',
        title: 'Automated Underwriting Workflow',
        description: 'Rules-based underwriting with exception handling for medical evidence',
        benefitHypothesis: 'Reduce underwriting time by 60% and improve consistency',
        acceptanceCriteria: ['Auto-approve 70% of standard cases', 'Route exceptions to specialists', 'Full audit trail'],
        wsjfScore: 21,
        status: 'analyzing',
        targetPI: 4,
        stories: [
          {
            id: 'story-prt-004',
            featureId: 'feat-prt-underwriting',
            title: 'Rules engine integration',
            description: 'Connect to Drools for underwriting rules execution',
            acceptanceCriteria: ['Load 50+ underwriting rules', 'Sub-second decision time', 'Rules versioning'],
            storyPoints: 13,
            status: 'backlog',
            sprint: 10,
            assignedTeam: 'Underwriting Tech',
            tasks: []
          }
        ],
        dependencies: ['feat-prt-pricing']
      }
    ],
    resources: [
      { id: 'res-001', name: 'Sarah Mitchell', role: 'RTE', allocation: 100, team: 'Retirement Solutions ART', costRate: 850 },
      { id: 'res-002', name: 'James Chen', role: 'Architect', allocation: 80, team: 'Actuarial Engineering', costRate: 950 },
      { id: 'res-003', name: 'Emily Davis', role: 'PO', allocation: 100, team: 'Platform API Team', costRate: 750 },
      { id: 'res-004', name: 'David Wilson', role: 'Developer', allocation: 100, team: 'Platform API Team', costRate: 650 },
      { id: 'res-005', name: 'Lisa Anderson', role: 'Developer', allocation: 100, team: 'Platform API Team', costRate: 600 },
      { id: 'res-006', name: 'Michael Brown', role: 'QA', allocation: 50, team: 'Actuarial Engineering', costRate: 550 }
    ],
    totalFTE: 5.3,
    milestones: [
      { id: 'ms-001', name: 'PI 2 Demo - Pricing MVP', targetDate: '2025-06-15', status: 'completed', deliverables: ['Basic pricing API', 'Single life calculations'], piNumber: 2 },
      { id: 'ms-002', name: 'PI 3 Demo - Bulk Processing', targetDate: '2025-09-20', status: 'on-track', deliverables: ['Bulk upload capability', 'Async processing'], piNumber: 3 },
      { id: 'ms-003', name: 'PI 4 Demo - Underwriting', targetDate: '2025-12-15', status: 'on-track', deliverables: ['Rules engine integration', 'Exception workflows'], piNumber: 4 },
      { id: 'ms-004', name: 'Go-Live', targetDate: '2026-06-30', status: 'on-track', deliverables: ['Full platform launch', 'Legacy decommission'], piNumber: 6 }
    ],
    dependencies: [
      { id: 'dep-001', sourceProjectId: 'proj-prt-platform', targetProjectId: 'proj-data-foundation', type: 'data-dependency', health: 'yellow', description: 'Requires unified customer data from Data Lake', impactIfDelayed: 'Cannot consolidate member data for pricing', financialImpact: 2500000 },
      { id: 'dep-002', sourceProjectId: 'proj-prt-platform', targetProjectId: 'proj-api-gateway', type: 'api-dependency', health: 'green', description: 'Needs API Gateway for external partner access', impactIfDelayed: 'Delays consultant portal integration', financialImpact: 500000 }
    ],
    financials: {
      budget: 8500000,
      spent: 4200000,
      forecast: 8900000,
      currency: '$',
      laborCost: 3800000,
      vendorCost: 1200000,
      infrastructureCost: 800000,
      contingency: 700000,
      roi: { projected: 45000000, confidence: 78, paybackMonths: 18 }
    },
    aiRecommendations: [
      'Consider parallel-path development for underwriting rules to recover schedule',
      'Data Lake dependency on amber - recommend daily syncs with Data Foundation team',
      'Resource utilization at 92% - risk of burnout in PI 4, recommend 1 additional developer'
    ],
    vroInsights: [
      'VRO pattern match: Similar PRT modernization at competitor achieved 23% cost savings',
      'Value tracking: Current velocity suggests 85% probability of hitting $45M ROI target',
      'Risk-adjusted timeline: 72% confidence in June 2026 delivery based on dependency health'
    ],
    pmoDataFeeds: [
      'Jira: 47 stories completed, 12 in progress, 8 in backlog',
      'ServiceNow: 3 incidents linked to legacy integration',
      'PowerBI: Sprint burndown at 94% completion rate'
    ],
    riskFlags: [
      'Data Lake dependency health degraded from green to yellow',
      'Key architect (James Chen) has competing priorities with Data Foundation'
    ],
    velocity: 42,
    burndownHealth: 88,
    qualityScore: 91
  },

  {
    id: 'proj-member-portal',
    name: 'Pensioner Digital Portal',
    description: 'Self-service portal for 500,000+ pensioners to manage their retirement benefits, update personal details, and access payment information.',
    bu: 'Florida Power & Light',
    portfolioTheme: 'Customer Experience',
    artName: 'Member Services ART',
    safeStage: 'implementing',
    status: 'green',
    priority: 'high',
    startDate: '2025-03-01',
    targetEndDate: '2025-12-31',
    currentPI: 2,
    totalPIs: 4,
    features: [
      {
        id: 'feat-portal-auth',
        epicId: 'proj-member-portal',
        title: 'Secure Authentication',
        description: 'Multi-factor authentication with Gov.uk Verify integration',
        benefitHypothesis: 'Reduce call center volume by 30% through secure self-service',
        acceptanceCriteria: ['MFA for all logins', 'Gov.uk Verify option', 'Biometric on mobile'],
        wsjfScore: 32,
        status: 'done',
        targetPI: 1,
        stories: [
          {
            id: 'story-portal-001',
            featureId: 'feat-portal-auth',
            title: 'MFA implementation',
            description: 'SMS and authenticator app options for second factor',
            acceptanceCriteria: ['SMS delivery <10 seconds', 'TOTP support', 'Backup codes'],
            storyPoints: 8,
            status: 'done',
            sprint: 3,
            assignedTeam: 'Identity Team',
            tasks: [
              { id: 'task-p-001', storyId: 'story-portal-001', title: 'Twilio SMS integration', description: 'Send OTP via Twilio', status: 'done', assignee: 'Rachel Green', estimatedHours: 8, actualHours: 7, priority: 'high' },
              { id: 'task-p-002', storyId: 'story-portal-001', title: 'TOTP library setup', description: 'otplib integration for authenticator apps', status: 'done', assignee: 'Mark Taylor', estimatedHours: 4, actualHours: 4, priority: 'high' }
            ]
          }
        ],
        dependencies: []
      },
      {
        id: 'feat-portal-payments',
        epicId: 'proj-member-portal',
        title: 'Payment Information Dashboard',
        description: 'View pension payments, tax codes, and download P60s',
        benefitHypothesis: 'Reduce payment queries by 40% with transparent information',
        acceptanceCriteria: ['12-month payment history', 'Tax breakdown', 'PDF P60 download'],
        wsjfScore: 28,
        status: 'implementing',
        targetPI: 2,
        stories: [
          {
            id: 'story-portal-002',
            featureId: 'feat-portal-payments',
            title: 'Payment history API',
            description: 'Fetch and display historical payments from SAP',
            acceptanceCriteria: ['Last 24 months data', 'Gross/net breakdown', 'Tax year grouping'],
            storyPoints: 13,
            status: 'in-progress',
            sprint: 6,
            assignedTeam: 'Portal Dev Team',
            tasks: [
              { id: 'task-p-003', storyId: 'story-portal-002', title: 'SAP BAPI connector', description: 'Call SAP for payment data', status: 'done', assignee: 'Chris Evans', estimatedHours: 12, actualHours: 14, priority: 'high' },
              { id: 'task-p-004', storyId: 'story-portal-002', title: 'Payment history UI', description: 'React component for payment table', status: 'in-progress', assignee: 'Amy Liu', estimatedHours: 8, actualHours: 4, priority: 'high' }
            ]
          }
        ],
        dependencies: ['feat-portal-auth']
      }
    ],
    resources: [
      { id: 'res-p-001', name: 'Jennifer Walsh', role: 'PM', allocation: 100, team: 'Member Services ART', costRate: 800 },
      { id: 'res-p-002', name: 'Chris Evans', role: 'Developer', allocation: 100, team: 'Portal Dev Team', costRate: 650 },
      { id: 'res-p-003', name: 'Amy Liu', role: 'Developer', allocation: 100, team: 'Portal Dev Team', costRate: 600 },
      { id: 'res-p-004', name: 'Rachel Green', role: 'Developer', allocation: 50, team: 'Identity Team', costRate: 700 }
    ],
    totalFTE: 3.5,
    milestones: [
      { id: 'ms-p-001', name: 'Authentication Go-Live', targetDate: '2025-06-01', status: 'completed', deliverables: ['MFA enabled', 'Gov.uk Verify'], piNumber: 1 },
      { id: 'ms-p-002', name: 'Payments Dashboard', targetDate: '2025-09-30', status: 'on-track', deliverables: ['Payment history', 'P60 downloads'], piNumber: 2 },
      { id: 'ms-p-003', name: 'Full Portal Launch', targetDate: '2025-12-31', status: 'on-track', deliverables: ['All self-service features', 'Mobile app'], piNumber: 4 }
    ],
    dependencies: [
      { id: 'dep-p-001', sourceProjectId: 'proj-member-portal', targetProjectId: 'proj-prt-platform', type: 'data-dependency', health: 'green', description: 'Shares member data model with PRT Platform', impactIfDelayed: 'Duplicate data entry required', financialImpact: 150000 }
    ],
    financials: {
      budget: 3200000,
      spent: 1400000,
      forecast: 3100000,
      currency: '$',
      laborCost: 1100000,
      vendorCost: 400000,
      infrastructureCost: 300000,
      contingency: 200000,
      roi: { projected: 8500000, confidence: 85, paybackMonths: 12 }
    },
    aiRecommendations: [
      'Portal adoption trending above forecast - consider accelerating mobile app development',
      'Call center data shows top query type is address changes - prioritize this feature'
    ],
    vroInsights: [
      'Value pattern: Similar portals show 35% call volume reduction within 6 months',
      'Benchmark: Current development velocity 15% above industry average for member portals'
    ],
    pmoDataFeeds: [
      'Jira: 28 stories completed, 5 in progress, 15 in backlog',
      'Google Analytics: Beta users averaging 4.2 sessions/month'
    ],
    riskFlags: [],
    velocity: 38,
    burndownHealth: 94,
    qualityScore: 88
  },

  {
    id: 'proj-bulk-annuity-automation',
    name: 'Bulk Annuity Processing Automation',
    description: 'End-to-end automation of bulk annuity administration including member onboarding, benefit calculations, and payment setup for scheme transfers.',
    bu: 'Florida Power & Light',
    portfolioTheme: 'Operational Excellence',
    artName: 'Operations Excellence ART',
    safeStage: 'analyzing',
    status: 'green',
    priority: 'high',
    startDate: '2025-06-01',
    targetEndDate: '2026-03-31',
    currentPI: 1,
    totalPIs: 4,
    features: [
      {
        id: 'feat-ba-onboarding',
        epicId: 'proj-bulk-annuity-automation',
        title: 'Automated Member Onboarding',
        description: 'Ingest scheme data and auto-create member records with validation',
        benefitHypothesis: 'Reduce onboarding time from 6 weeks to 2 weeks per scheme',
        acceptanceCriteria: ['Parse multiple data formats', 'Auto-validation rules', 'Exception reporting'],
        wsjfScore: 25,
        status: 'analyzing',
        targetPI: 2,
        stories: [],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-ba-001', name: 'Peter Clarke', role: 'PM', allocation: 50, team: 'Operations Excellence ART', costRate: 800 },
      { id: 'res-ba-002', name: 'Helen Wright', role: 'BA', allocation: 100, team: 'Operations Excellence ART', costRate: 600 }
    ],
    totalFTE: 1.5,
    milestones: [
      { id: 'ms-ba-001', name: 'Requirements Complete', targetDate: '2025-08-15', status: 'on-track', deliverables: ['User stories defined', 'Process maps'], piNumber: 1 }
    ],
    dependencies: [
      { id: 'dep-ba-001', sourceProjectId: 'proj-bulk-annuity-automation', targetProjectId: 'proj-prt-platform', type: 'blocks', health: 'green', description: 'Builds on PRT Platform member data model', impactIfDelayed: 'Cannot start feature development', financialImpact: 300000 }
    ],
    financials: {
      budget: 2800000,
      spent: 280000,
      forecast: 2800000,
      currency: '$',
      laborCost: 200000,
      vendorCost: 0,
      infrastructureCost: 50000,
      contingency: 280000,
      roi: { projected: 12000000, confidence: 72, paybackMonths: 14 }
    },
    aiRecommendations: [
      'Early engagement with schemes already in pipeline recommended',
      'Consider RPA for legacy system integration as interim solution'
    ],
    vroInsights: [
      'Value opportunity: $4M annual savings from reduced manual processing',
      'Risk pattern: Similar automation projects average 20% scope creep - recommend fixed scope gates'
    ],
    pmoDataFeeds: [
      'Confluence: 12 process discovery sessions completed',
      'Miro: Current state process maps available'
    ],
    riskFlags: [],
    velocity: 0,
    burndownHealth: 100,
    qualityScore: 0
  },

  // ============ ASSET MANAGEMENT (3 projects) ============
  {
    id: 'proj-trading-platform',
    name: 'Next-Gen Trading Platform',
    description: 'Unified multi-asset trading platform supporting equities, fixed income, and derivatives with real-time risk analytics.',
    bu: 'NextEra Energy Resources',
    portfolioTheme: 'Digital Transformation',
    artName: 'Trading Technology ART',
    safeStage: 'implementing',
    status: 'amber',
    priority: 'critical',
    startDate: '2024-09-01',
    targetEndDate: '2026-03-31',
    currentPI: 5,
    totalPIs: 7,
    features: [
      {
        id: 'feat-trade-equities',
        epicId: 'proj-trading-platform',
        title: 'Equities Trading Module',
        description: 'Order management and execution for global equity markets',
        benefitHypothesis: 'Consolidate 5 legacy systems into 1, reducing operational risk',
        acceptanceCriteria: ['Support 40+ exchanges', 'FIX 4.4 connectivity', '<10ms order routing'],
        wsjfScore: 35,
        status: 'done',
        targetPI: 3,
        stories: [
          {
            id: 'story-trade-001',
            featureId: 'feat-trade-equities',
            title: 'FIX engine integration',
            description: 'Connect to market makers via FIX protocol',
            acceptanceCriteria: ['Support all major brokers', 'Session management', 'Message logging'],
            storyPoints: 21,
            status: 'done',
            sprint: 10,
            assignedTeam: 'Connectivity Team',
            tasks: [
              { id: 'task-t-001', storyId: 'story-trade-001', title: 'QuickFIX configuration', description: 'Setup FIX engine for each broker', status: 'done', assignee: 'Alex Johnson', estimatedHours: 40, actualHours: 45, priority: 'high' }
            ]
          }
        ],
        dependencies: []
      },
      {
        id: 'feat-trade-fixed-income',
        epicId: 'proj-trading-platform',
        title: 'Fixed Income Trading',
        description: 'Bond trading with pricing, inventory, and RFQ workflows',
        benefitHypothesis: 'Enable best execution across bond markets, saving $2M/year in spreads',
        acceptanceCriteria: ['Multi-dealer RFQ', 'Real-time pricing', 'Inventory management'],
        wsjfScore: 30,
        status: 'implementing',
        targetPI: 5,
        stories: [
          {
            id: 'story-trade-002',
            featureId: 'feat-trade-fixed-income',
            title: 'RFQ workflow engine',
            description: 'Request for quote workflow with dealer selection',
            acceptanceCriteria: ['Send to 10+ dealers', 'Auto-select best price', 'Audit trail'],
            storyPoints: 13,
            status: 'in-progress',
            sprint: 14,
            assignedTeam: 'Fixed Income Dev',
            tasks: [
              { id: 'task-t-002', storyId: 'story-trade-002', title: 'Dealer adapter framework', description: 'Generic adapter for dealer APIs', status: 'done', assignee: 'Maria Garcia', estimatedHours: 24, actualHours: 28, priority: 'high' },
              { id: 'task-t-003', storyId: 'story-trade-002', title: 'Price comparison engine', description: 'Normalize and compare dealer quotes', status: 'in-progress', assignee: 'Robert Kim', estimatedHours: 16, actualHours: 10, priority: 'high' }
            ]
          }
        ],
        dependencies: ['feat-trade-equities']
      }
    ],
    resources: [
      { id: 'res-t-001', name: 'Daniel Morgan', role: 'RTE', allocation: 100, team: 'Trading Technology ART', costRate: 950 },
      { id: 'res-t-002', name: 'Alex Johnson', role: 'Architect', allocation: 100, team: 'Connectivity Team', costRate: 1000 },
      { id: 'res-t-003', name: 'Maria Garcia', role: 'Developer', allocation: 100, team: 'Fixed Income Dev', costRate: 750 },
      { id: 'res-t-004', name: 'Robert Kim', role: 'Developer', allocation: 100, team: 'Fixed Income Dev', costRate: 700 }
    ],
    totalFTE: 4.0,
    milestones: [
      { id: 'ms-t-001', name: 'Equities Live', targetDate: '2025-03-31', status: 'completed', deliverables: ['Equities trading live', '15 brokers connected'], piNumber: 3 },
      { id: 'ms-t-002', name: 'Fixed Income Live', targetDate: '2025-12-31', status: 'at-risk', deliverables: ['Bond trading live', 'RFQ workflows'], piNumber: 5 },
      { id: 'ms-t-003', name: 'Full Platform', targetDate: '2026-03-31', status: 'on-track', deliverables: ['Derivatives module', 'Legacy decommission'], piNumber: 7 }
    ],
    dependencies: [
      { id: 'dep-t-001', sourceProjectId: 'proj-trading-platform', targetProjectId: 'proj-data-foundation', type: 'data-dependency', health: 'red', description: 'Requires market data from unified data lake', impactIfDelayed: 'Cannot calculate real-time P&L', financialImpact: 5000000 },
      { id: 'dep-t-002', sourceProjectId: 'proj-trading-platform', targetProjectId: 'proj-risk-engine', type: 'api-dependency', health: 'yellow', description: 'Real-time risk limits from risk engine', impactIfDelayed: 'Manual risk checks required', financialImpact: 1000000 }
    ],
    financials: {
      budget: 15000000,
      spent: 9500000,
      forecast: 16200000,
      currency: '$',
      laborCost: 7500000,
      vendorCost: 3500000,
      infrastructureCost: 2000000,
      contingency: 1200000,
      roi: { projected: 35000000, confidence: 68, paybackMonths: 24 }
    },
    aiRecommendations: [
      'CRITICAL: Market data dependency is blocking fixed income pricing - escalate to Data Foundation immediately',
      'Consider phased derivatives rollout to protect core timeline',
      'Resource conflict with Risk Engine project on shared architect'
    ],
    vroInsights: [
      'Value at risk: $5M annual benefit delayed due to data dependency',
      'Benchmark: Platform is 15% over budget - typical for trading platform programs',
      'Pattern match: Similar programs show 80% of value in first 2 asset classes'
    ],
    pmoDataFeeds: [
      'Jira: 156 stories completed, 23 in progress, 45 in backlog',
      'SonarQube: Code quality at 87%, test coverage 78%'
    ],
    riskFlags: [
      'Market data dependency RED - requires executive escalation',
      'Fixed Income milestone at-risk due to dealer integration delays'
    ],
    velocity: 48,
    burndownHealth: 72,
    qualityScore: 87
  },

  {
    id: 'proj-client-reporting',
    name: 'Institutional Client Reporting Platform',
    description: 'Automated client reporting with customizable templates, performance attribution, and ESG metrics.',
    bu: 'NextEra Energy Resources',
    portfolioTheme: 'Customer Experience',
    artName: 'Client Solutions ART',
    safeStage: 'implementing',
    status: 'green',
    priority: 'high',
    startDate: '2025-01-01',
    targetEndDate: '2025-11-30',
    currentPI: 3,
    totalPIs: 4,
    features: [
      {
        id: 'feat-report-templates',
        epicId: 'proj-client-reporting',
        title: 'Dynamic Report Templates',
        description: 'Customizable report templates with drag-and-drop configuration',
        benefitHypothesis: 'Reduce report production time from 5 days to same-day',
        acceptanceCriteria: ['50+ chart types', 'Client branding', 'Automated scheduling'],
        wsjfScore: 28,
        status: 'implementing',
        targetPI: 3,
        stories: [
          {
            id: 'story-rep-001',
            featureId: 'feat-report-templates',
            title: 'Template builder UI',
            description: 'React-based template designer with drag-drop',
            acceptanceCriteria: ['Component library', 'Preview mode', 'Save/load templates'],
            storyPoints: 13,
            status: 'done',
            sprint: 8,
            assignedTeam: 'Reporting UI Team',
            tasks: [
              { id: 'task-r-001', storyId: 'story-rep-001', title: 'React DnD setup', description: 'Drag and drop framework', status: 'done', assignee: 'Sophie Turner', estimatedHours: 12, actualHours: 10, priority: 'high' }
            ]
          }
        ],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-r-001', name: 'Oliver Scott', role: 'PM', allocation: 100, team: 'Client Solutions ART', costRate: 800 },
      { id: 'res-r-002', name: 'Sophie Turner', role: 'Developer', allocation: 100, team: 'Reporting UI Team', costRate: 650 }
    ],
    totalFTE: 2.0,
    milestones: [
      { id: 'ms-r-001', name: 'Template Builder Live', targetDate: '2025-09-30', status: 'on-track', deliverables: ['Template designer', '20 standard templates'], piNumber: 3 }
    ],
    dependencies: [],
    financials: {
      budget: 2500000,
      spent: 1600000,
      forecast: 2400000,
      currency: '$',
      laborCost: 1300000,
      vendorCost: 200000,
      infrastructureCost: 200000,
      contingency: 200000,
      roi: { projected: 6000000, confidence: 82, paybackMonths: 10 }
    },
    aiRecommendations: [
      'Client feedback shows ESG metrics highest priority - consider fast-tracking',
      'Template adoption accelerating - prepare for scale testing'
    ],
    vroInsights: [
      'Value tracking: 15 clients already expressing interest in new templates',
      'Competitive advantage: First to market with integrated ESG reporting'
    ],
    pmoDataFeeds: [
      'Jira: 42 stories completed, 8 in progress'
    ],
    riskFlags: [],
    velocity: 35,
    burndownHealth: 92,
    qualityScore: 90
  },

  {
    id: 'proj-risk-engine',
    name: 'Real-Time Risk Analytics Engine',
    description: 'Unified risk calculation engine providing VaR, stress testing, and limit monitoring across all asset classes.',
    bu: 'NextEra Energy Resources',
    portfolioTheme: 'Risk Management',
    artName: 'Risk Technology ART',
    safeStage: 'implementing',
    status: 'amber',
    priority: 'critical',
    startDate: '2024-06-01',
    targetEndDate: '2025-12-31',
    currentPI: 6,
    totalPIs: 7,
    features: [
      {
        id: 'feat-risk-var',
        epicId: 'proj-risk-engine',
        title: 'Value at Risk Calculation',
        description: 'Parametric and historical VaR with Monte Carlo simulation',
        benefitHypothesis: 'Regulatory compliance and improved risk management',
        acceptanceCriteria: ['Daily VaR reports', '99% confidence', 'Backtesting'],
        wsjfScore: 35,
        status: 'done',
        targetPI: 4,
        stories: [],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-risk-001', name: 'Andrew Phillips', role: 'RTE', allocation: 100, team: 'Risk Technology ART', costRate: 900 }
    ],
    totalFTE: 6.0,
    milestones: [
      { id: 'ms-risk-001', name: 'VaR Engine Live', targetDate: '2025-06-30', status: 'completed', deliverables: ['Daily VaR', 'Regulatory reports'], piNumber: 4 },
      { id: 'ms-risk-002', name: 'Stress Testing', targetDate: '2025-12-31', status: 'at-risk', deliverables: ['Scenario engine', 'Historical stress'], piNumber: 7 }
    ],
    dependencies: [
      { id: 'dep-risk-001', sourceProjectId: 'proj-risk-engine', targetProjectId: 'proj-trading-platform', type: 'blocked-by', health: 'yellow', description: 'Needs position data from trading platform', impactIfDelayed: 'Risk calculations on stale data', financialImpact: 2000000 }
    ],
    financials: {
      budget: 8000000,
      spent: 6200000,
      forecast: 8500000,
      currency: '$',
      laborCost: 5000000,
      vendorCost: 1800000,
      infrastructureCost: 700000,
      contingency: 500000,
      roi: { projected: 15000000, confidence: 75, paybackMonths: 20 }
    },
    aiRecommendations: [
      'Stress testing scope at risk - consider MVP approach for first release',
      'Synergy opportunity with Trading Platform on shared data layer'
    ],
    vroInsights: [
      'Regulatory deadline: PRA expects enhanced risk reporting by Q1 2026',
      'Value pattern: Real-time risk reduces capital requirements by 10-15%'
    ],
    pmoDataFeeds: [
      'Jira: 89 stories completed, 15 in progress, 22 in backlog'
    ],
    riskFlags: [
      'Stress testing milestone at-risk',
      'Shared resource conflict with Trading Platform'
    ],
    velocity: 44,
    burndownHealth: 78,
    qualityScore: 85
  },

  // ============ RETAIL (3 projects) ============
  {
    id: 'proj-digital-onboarding',
    name: 'Digital Customer Onboarding',
    description: 'Fully digital onboarding journey for retail customers including ID verification, risk assessment, and instant account opening.',
    bu: 'Florida Power & Light',
    portfolioTheme: 'Customer Experience',
    artName: 'FPL Digital ART',
    safeStage: 'implementing',
    status: 'green',
    priority: 'high',
    startDate: '2025-02-01',
    targetEndDate: '2025-10-31',
    currentPI: 2,
    totalPIs: 3,
    features: [
      {
        id: 'feat-digital-kyc',
        epicId: 'proj-digital-onboarding',
        title: 'Digital KYC Verification',
        description: 'Automated ID verification with document scanning and liveness check',
        benefitHypothesis: 'Reduce onboarding dropoff from 40% to 15%',
        acceptanceCriteria: ['Passport/driving license scanning', 'Face match', '<2 min verification'],
        wsjfScore: 32,
        status: 'done',
        targetPI: 1,
        stories: [],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-do-001', name: 'Emma Roberts', role: 'PM', allocation: 100, team: 'FPL Digital ART', costRate: 750 }
    ],
    totalFTE: 4.0,
    milestones: [
      { id: 'ms-do-001', name: 'KYC Live', targetDate: '2025-05-31', status: 'completed', deliverables: ['ID verification', 'Liveness check'], piNumber: 1 },
      { id: 'ms-do-002', name: 'Full Onboarding', targetDate: '2025-10-31', status: 'on-track', deliverables: ['Complete digital journey', 'Instant accounts'], piNumber: 3 }
    ],
    dependencies: [],
    financials: {
      budget: 2200000,
      spent: 1100000,
      forecast: 2100000,
      currency: '$',
      laborCost: 850000,
      vendorCost: 450000,
      infrastructureCost: 150000,
      contingency: 150000,
      roi: { projected: 5500000, confidence: 88, paybackMonths: 8 }
    },
    aiRecommendations: [
      'Conversion rates exceeding target - consider expanding to additional products',
      'Mobile completion rate 20% higher than desktop - prioritize mobile optimization'
    ],
    vroInsights: [
      'Value achieved: 65% reduction in manual processing already realized',
      'Benchmark: Outperforming industry average on customer satisfaction'
    ],
    pmoDataFeeds: [
      'Jira: 35 stories completed, 6 in progress'
    ],
    riskFlags: [],
    velocity: 40,
    burndownHealth: 95,
    qualityScore: 92
  },

  {
    id: 'proj-mobile-app-refresh',
    name: 'Retail Mobile App Modernization',
    description: 'Complete refresh of the retail mobile app with modern UX, biometric login, and expanded self-service capabilities.',
    bu: 'Florida Power & Light',
    portfolioTheme: 'Digital Transformation',
    artName: 'Mobile Experience ART',
    safeStage: 'backlog',
    status: 'green',
    priority: 'medium',
    startDate: '2025-10-01',
    targetEndDate: '2026-06-30',
    currentPI: 0,
    totalPIs: 3,
    features: [],
    resources: [
      { id: 'res-ma-001', name: 'Jack Thompson', role: 'PO', allocation: 50, team: 'Mobile Experience ART', costRate: 700 }
    ],
    totalFTE: 0.5,
    milestones: [
      { id: 'ms-ma-001', name: 'Design Sprint Complete', targetDate: '2025-11-30', status: 'on-track', deliverables: ['UX designs', 'Prototype'], piNumber: 1 }
    ],
    dependencies: [
      { id: 'dep-ma-001', sourceProjectId: 'proj-mobile-app-refresh', targetProjectId: 'proj-digital-onboarding', type: 'related', health: 'green', description: 'Will reuse onboarding components', impactIfDelayed: 'Duplicate development effort', financialImpact: 200000 }
    ],
    financials: {
      budget: 3500000,
      spent: 75000,
      forecast: 3500000,
      currency: '$',
      laborCost: 50000,
      vendorCost: 0,
      infrastructureCost: 0,
      contingency: 350000,
      roi: { projected: 8000000, confidence: 70, paybackMonths: 15 }
    },
    aiRecommendations: [
      'Consider React Native for cross-platform efficiency',
      'Early user research showing strong demand for investment tracking'
    ],
    vroInsights: [
      'Market opportunity: Competitor apps averaging 4.5 stars, ours at 3.8',
      'Strategic alignment: Supports 2026 digital-first customer strategy'
    ],
    pmoDataFeeds: [
      'Figma: 15 initial screens designed'
    ],
    riskFlags: [],
    velocity: 0,
    burndownHealth: 100,
    qualityScore: 0
  },

  {
    id: 'proj-advisor-portal',
    name: 'Financial Advisor Portal',
    description: 'B2B portal for financial advisors to manage client portfolios, submit applications, and access commission statements.',
    bu: 'Florida Power & Light',
    portfolioTheme: 'Partner Ecosystem',
    artName: 'Partner Solutions ART',
    safeStage: 'reviewing',
    status: 'green',
    priority: 'medium',
    startDate: '2025-09-01',
    targetEndDate: '2026-05-31',
    currentPI: 0,
    totalPIs: 3,
    features: [],
    resources: [
      { id: 'res-ap-001', name: 'Hannah Lee', role: 'BA', allocation: 100, team: 'Partner Solutions ART', costRate: 600 }
    ],
    totalFTE: 1.0,
    milestones: [
      { id: 'ms-ap-001', name: 'Business Case Approved', targetDate: '2025-08-31', status: 'on-track', deliverables: ['Requirements', 'ROI analysis'], piNumber: 0 }
    ],
    dependencies: [],
    financials: {
      budget: 2800000,
      spent: 45000,
      forecast: 2800000,
      currency: '$',
      laborCost: 30000,
      vendorCost: 0,
      infrastructureCost: 0,
      contingency: 280000,
      roi: { projected: 6500000, confidence: 65, paybackMonths: 16 }
    },
    aiRecommendations: [
      'Survey top 50 advisors before finalizing requirements',
      'Consider API-first approach for flexibility'
    ],
    vroInsights: [
      'Channel opportunity: Advisors represent 35% of new business',
      'Competitive gap: Major competitors already have advisor portals'
    ],
    pmoDataFeeds: [
      'Confluence: Discovery sessions ongoing'
    ],
    riskFlags: [],
    velocity: 0,
    burndownHealth: 100,
    qualityScore: 0
  },

  // ============ GROUP FUNCTIONS (3 projects) ============
  {
    id: 'proj-data-foundation',
    name: 'Enterprise Data Foundation',
    description: 'Unified data lake and master data management platform providing single source of truth across all business units.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Data & Analytics',
    artName: 'Data Platform ART',
    safeStage: 'implementing',
    status: 'amber',
    priority: 'critical',
    startDate: '2024-03-01',
    targetEndDate: '2025-12-31',
    currentPI: 7,
    totalPIs: 8,
    features: [
      {
        id: 'feat-data-lake',
        epicId: 'proj-data-foundation',
        title: 'Cloud Data Lake',
        description: 'AWS-based data lake with S3, Glue, and Athena',
        benefitHypothesis: 'Reduce data preparation time by 70% across organization',
        acceptanceCriteria: ['100TB capacity', 'Sub-minute query time', 'Data lineage'],
        wsjfScore: 40,
        status: 'implementing',
        targetPI: 7,
        stories: [
          {
            id: 'story-data-001',
            featureId: 'feat-data-lake',
            title: 'S3 data ingestion pipelines',
            description: 'Automated ingestion from 50+ source systems',
            acceptanceCriteria: ['CDC from major databases', 'File drop zones', 'Schema evolution'],
            storyPoints: 21,
            status: 'in-progress',
            sprint: 22,
            assignedTeam: 'Data Engineering',
            tasks: [
              { id: 'task-d-001', storyId: 'story-data-001', title: 'Glue job templates', description: 'Reusable Glue job for CDC', status: 'done', assignee: 'Kevin Zhang', estimatedHours: 24, actualHours: 28, priority: 'high' },
              { id: 'task-d-002', storyId: 'story-data-001', title: 'Source connectors', description: 'Connect to SAP, Oracle, SQL Server', status: 'in-progress', assignee: 'Priya Patel', estimatedHours: 40, actualHours: 25, priority: 'high' }
            ]
          }
        ],
        dependencies: []
      },
      {
        id: 'feat-mdm',
        epicId: 'proj-data-foundation',
        title: 'Master Data Management',
        description: 'Golden record management for customer, product, and counterparty data',
        benefitHypothesis: 'Eliminate duplicate customer records across 12 systems',
        acceptanceCriteria: ['Match/merge algorithms', 'Data stewardship UI', 'API access'],
        wsjfScore: 35,
        status: 'analyzing',
        targetPI: 8,
        stories: [],
        dependencies: ['feat-data-lake']
      }
    ],
    resources: [
      { id: 'res-d-001', name: 'Marcus Johnson', role: 'RTE', allocation: 100, team: 'Data Platform ART', costRate: 900 },
      { id: 'res-d-002', name: 'Kevin Zhang', role: 'Architect', allocation: 100, team: 'Data Engineering', costRate: 950 },
      { id: 'res-d-003', name: 'Priya Patel', role: 'Developer', allocation: 100, team: 'Data Engineering', costRate: 700 }
    ],
    totalFTE: 8.0,
    milestones: [
      { id: 'ms-d-001', name: 'Data Lake MVP', targetDate: '2025-03-31', status: 'completed', deliverables: ['Core lake operational', '20 sources connected'], piNumber: 5 },
      { id: 'ms-d-002', name: 'Full Data Lake', targetDate: '2025-09-30', status: 'at-risk', deliverables: ['All 50 sources', 'Self-service analytics'], piNumber: 7 },
      { id: 'ms-d-003', name: 'MDM Live', targetDate: '2025-12-31', status: 'on-track', deliverables: ['Customer golden record', 'Data quality dashboard'], piNumber: 8 }
    ],
    dependencies: [],
    financials: {
      budget: 12000000,
      spent: 8500000,
      forecast: 13200000,
      currency: '$',
      laborCost: 6500000,
      vendorCost: 3000000,
      infrastructureCost: 2000000,
      contingency: 1000000,
      roi: { projected: 40000000, confidence: 72, paybackMonths: 24 }
    },
    aiRecommendations: [
      'CRITICAL: This project is blocking 4 other initiatives - needs resource surge',
      'Consider phased MDM rollout starting with customer data only',
      'Data quality issues in source systems causing 30% rework'
    ],
    vroInsights: [
      'Value enabler: $40M+ downstream value dependent on this platform',
      'Pattern: 70% of enterprise data projects miss original deadline - plan for contingency',
      'Strategic priority: CEO visibility on this initiative'
    ],
    pmoDataFeeds: [
      'Jira: 178 stories completed, 28 in progress, 56 in backlog',
      'AWS Cost Explorer: $85K/month cloud spend'
    ],
    riskFlags: [
      'Full data lake milestone at-risk - 15 sources still pending',
      'Budget overrun of $1.2M expected',
      'Key architect shared with Trading Platform project'
    ],
    velocity: 52,
    burndownHealth: 68,
    qualityScore: 82
  },

  {
    id: 'proj-api-gateway',
    name: 'Enterprise API Gateway',
    description: 'Centralized API management platform for internal and external API consumption with security, rate limiting, and analytics.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Digital Infrastructure',
    artName: 'Platform Services ART',
    safeStage: 'implementing',
    status: 'green',
    priority: 'high',
    startDate: '2025-01-01',
    targetEndDate: '2025-09-30',
    currentPI: 2,
    totalPIs: 3,
    features: [
      {
        id: 'feat-api-security',
        epicId: 'proj-api-gateway',
        title: 'API Security Layer',
        description: 'OAuth 2.0, JWT validation, and API key management',
        benefitHypothesis: 'Standardized security reduces breach risk by 60%',
        acceptanceCriteria: ['OAuth 2.0 flows', 'Rate limiting', 'Threat detection'],
        wsjfScore: 35,
        status: 'done',
        targetPI: 1,
        stories: [],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-api-001', name: 'Laura Chen', role: 'PM', allocation: 100, team: 'Platform Services ART', costRate: 800 }
    ],
    totalFTE: 3.0,
    milestones: [
      { id: 'ms-api-001', name: 'Security Layer Live', targetDate: '2025-04-30', status: 'completed', deliverables: ['OAuth 2.0', 'API keys'], piNumber: 1 },
      { id: 'ms-api-002', name: 'Full Gateway', targetDate: '2025-09-30', status: 'on-track', deliverables: ['Rate limiting', 'Analytics', 'Developer portal'], piNumber: 3 }
    ],
    dependencies: [],
    financials: {
      budget: 1800000,
      spent: 950000,
      forecast: 1750000,
      currency: '$',
      laborCost: 750000,
      vendorCost: 300000,
      infrastructureCost: 200000,
      contingency: 150000,
      roi: { projected: 4500000, confidence: 85, paybackMonths: 10 }
    },
    aiRecommendations: [
      'Early adoption exceeding expectations - expand capacity planning',
      'Consider GraphQL gateway for future phases'
    ],
    vroInsights: [
      'Enabler value: 12 projects depend on API gateway services',
      'Security improvement: 100% API traffic now monitored'
    ],
    pmoDataFeeds: [
      'Jira: 28 stories completed, 4 in progress'
    ],
    riskFlags: [],
    velocity: 32,
    burndownHealth: 94,
    qualityScore: 91
  },

  {
    id: 'proj-cloud-migration',
    name: 'Cloud Infrastructure Migration',
    description: 'Migration of on-premises infrastructure to AWS with hybrid connectivity, disaster recovery, and cost optimization.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Digital Infrastructure',
    artName: 'Infrastructure ART',
    safeStage: 'implementing',
    status: 'green',
    priority: 'high',
    startDate: '2024-06-01',
    targetEndDate: '2025-12-31',
    currentPI: 5,
    totalPIs: 6,
    features: [],
    resources: [
      { id: 'res-cm-001', name: 'Steve Richards', role: 'Architect', allocation: 100, team: 'Infrastructure ART', costRate: 950 }
    ],
    totalFTE: 5.0,
    milestones: [
      { id: 'ms-cm-001', name: 'Non-Prod Migrated', targetDate: '2025-06-30', status: 'completed', deliverables: ['Dev/Test in AWS', 'CI/CD pipelines'], piNumber: 4 },
      { id: 'ms-cm-002', name: 'Production Migrated', targetDate: '2025-12-31', status: 'on-track', deliverables: ['All prod workloads', 'DR capability'], piNumber: 6 }
    ],
    dependencies: [],
    financials: {
      budget: 6500000,
      spent: 4200000,
      forecast: 6200000,
      currency: '$',
      laborCost: 2800000,
      vendorCost: 1500000,
      infrastructureCost: 1200000,
      contingency: 500000,
      roi: { projected: 15000000, confidence: 80, paybackMonths: 18 }
    },
    aiRecommendations: [
      'Reserved instance purchases could save $400K annually',
      'Consider Spot instances for batch workloads'
    ],
    vroInsights: [
      'Value achieved: 25% infrastructure cost reduction already realized',
      'Agility improvement: Deployment time reduced from weeks to hours'
    ],
    pmoDataFeeds: [
      'AWS Migration Hub: 75% of workloads migrated'
    ],
    riskFlags: [],
    velocity: 38,
    burndownHealth: 88,
    qualityScore: 89
  },

  // ============ RISK & COMPLIANCE (3 projects) ============
  {
    id: 'proj-regulatory-reporting',
    name: 'Regulatory Reporting Automation',
    description: 'Automated generation of regulatory returns for PRA, FCA, and EIOPA with data lineage and audit trails.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Regulatory Excellence',
    artName: 'Regulatory Tech ART',
    safeStage: 'implementing',
    status: 'amber',
    priority: 'critical',
    startDate: '2024-09-01',
    targetEndDate: '2025-09-30',
    currentPI: 4,
    totalPIs: 5,
    features: [
      {
        id: 'feat-solvency-ii',
        epicId: 'proj-regulatory-reporting',
        title: 'Solvency II QRTs',
        description: 'Automated Quantitative Reporting Templates for EIOPA',
        benefitHypothesis: 'Reduce reporting effort by 50% and improve accuracy',
        acceptanceCriteria: ['All mandatory QRTs', 'XBRL generation', 'Validation rules'],
        wsjfScore: 38,
        status: 'implementing',
        targetPI: 4,
        stories: [
          {
            id: 'story-reg-001',
            featureId: 'feat-solvency-ii',
            title: 'S.02 Balance Sheet automation',
            description: 'Automated generation of balance sheet QRT',
            acceptanceCriteria: ['Pull from GL', 'Apply taxonomy', 'Validation checks'],
            storyPoints: 13,
            status: 'in-progress',
            sprint: 12,
            assignedTeam: 'RegTech Dev',
            tasks: [
              { id: 'task-reg-001', storyId: 'story-reg-001', title: 'GL data extraction', description: 'Connect to SAP GL module', status: 'done', assignee: 'Nina Patel', estimatedHours: 16, actualHours: 20, priority: 'high' },
              { id: 'task-reg-002', storyId: 'story-reg-001', title: 'XBRL template', description: 'S.02 XBRL structure', status: 'in-progress', assignee: 'George Clark', estimatedHours: 24, actualHours: 15, priority: 'high' }
            ]
          }
        ],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-reg-001', name: 'Victoria Adams', role: 'PM', allocation: 100, team: 'Regulatory Tech ART', costRate: 850 },
      { id: 'res-reg-002', name: 'Nina Patel', role: 'Developer', allocation: 100, team: 'RegTech Dev', costRate: 700 },
      { id: 'res-reg-003', name: 'George Clark', role: 'Developer', allocation: 100, team: 'RegTech Dev', costRate: 650 }
    ],
    totalFTE: 4.0,
    milestones: [
      { id: 'ms-reg-001', name: 'QRT Automation', targetDate: '2025-06-30', status: 'at-risk', deliverables: ['20 QRTs automated', 'XBRL generation'], piNumber: 4 },
      { id: 'ms-reg-002', name: 'Full Reporting Suite', targetDate: '2025-09-30', status: 'on-track', deliverables: ['All regulatory returns', 'Audit dashboard'], piNumber: 5 }
    ],
    dependencies: [
      { id: 'dep-reg-001', sourceProjectId: 'proj-regulatory-reporting', targetProjectId: 'proj-data-foundation', type: 'data-dependency', health: 'yellow', description: 'Requires consolidated financial data from data lake', impactIfDelayed: 'Manual data extraction required', financialImpact: 800000 }
    ],
    financials: {
      budget: 4500000,
      spent: 3100000,
      forecast: 4800000,
      currency: '$',
      laborCost: 2400000,
      vendorCost: 800000,
      infrastructureCost: 400000,
      contingency: 400000,
      roi: { projected: 8000000, confidence: 75, paybackMonths: 16 }
    },
    aiRecommendations: [
      'QRT milestone at-risk - consider parallel development of remaining templates',
      'EIOPA deadline is fixed - escalate blockers immediately',
      'Data Foundation dependency causing 2-week delays'
    ],
    vroInsights: [
      'Compliance risk: Late filing penalties could exceed $5M',
      'Process improvement: Automation will free 12 FTE annually',
      'Pattern: Similar projects show highest risk in data mapping phase'
    ],
    pmoDataFeeds: [
      'Jira: 52 stories completed, 12 in progress, 18 in backlog'
    ],
    riskFlags: [
      'QRT automation milestone at-risk',
      'Data Foundation dependency on yellow',
      'EIOPA deadline is regulatory requirement'
    ],
    velocity: 35,
    burndownHealth: 72,
    qualityScore: 88
  },

  {
    id: 'proj-fraud-detection',
    name: 'AI-Powered Fraud Detection',
    description: 'Machine learning platform for real-time fraud detection across all transaction types with automated alerting.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Risk Management',
    artName: 'Security Intelligence ART',
    safeStage: 'analyzing',
    status: 'green',
    priority: 'high',
    startDate: '2025-07-01',
    targetEndDate: '2026-06-30',
    currentPI: 1,
    totalPIs: 4,
    features: [],
    resources: [
      { id: 'res-fraud-001', name: 'Dr. Rebecca Stone', role: 'Architect', allocation: 50, team: 'Security Intelligence ART', costRate: 1100 }
    ],
    totalFTE: 0.5,
    milestones: [
      { id: 'ms-fraud-001', name: 'ML Model Design', targetDate: '2025-09-30', status: 'on-track', deliverables: ['Algorithm selection', 'Training data requirements'], piNumber: 1 }
    ],
    dependencies: [
      { id: 'dep-fraud-001', sourceProjectId: 'proj-fraud-detection', targetProjectId: 'proj-data-foundation', type: 'data-dependency', health: 'green', description: 'Requires transaction data from data lake', impactIfDelayed: 'Limited training data availability', financialImpact: 500000 }
    ],
    financials: {
      budget: 3200000,
      spent: 120000,
      forecast: 3200000,
      currency: '$',
      laborCost: 80000,
      vendorCost: 0,
      infrastructureCost: 20000,
      contingency: 320000,
      roi: { projected: 12000000, confidence: 70, paybackMonths: 14 }
    },
    aiRecommendations: [
      'Early results show 40% reduction in false positives achievable',
      'Consider ensemble model approach for best accuracy'
    ],
    vroInsights: [
      'Value potential: $8M annual fraud loss reduction',
      'Benchmark: Industry leaders achieving 95% detection rate'
    ],
    pmoDataFeeds: [
      'Confluence: Research phase documentation'
    ],
    riskFlags: [],
    velocity: 0,
    burndownHealth: 100,
    qualityScore: 0
  },

  {
    id: 'proj-grc-platform',
    name: 'Integrated GRC Platform',
    description: 'Unified Governance, Risk, and Compliance platform consolidating policy management, risk registers, and control testing.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Regulatory Excellence',
    artName: 'GRC Technology ART',
    safeStage: 'funnel',
    status: 'green',
    priority: 'medium',
    startDate: '2026-01-01',
    targetEndDate: '2026-12-31',
    currentPI: 0,
    totalPIs: 4,
    features: [],
    resources: [
      { id: 'res-grc-001', name: 'Thomas Wright', role: 'BA', allocation: 25, team: 'GRC Technology ART', costRate: 600 }
    ],
    totalFTE: 0.25,
    milestones: [
      { id: 'ms-grc-001', name: 'RFP Complete', targetDate: '2025-12-31', status: 'on-track', deliverables: ['Vendor shortlist', 'Business case'], piNumber: 0 }
    ],
    dependencies: [],
    financials: {
      budget: 5000000,
      spent: 25000,
      forecast: 5000000,
      currency: '$',
      laborCost: 15000,
      vendorCost: 0,
      infrastructureCost: 0,
      contingency: 500000,
      roi: { projected: 10000000, confidence: 60, paybackMonths: 24 }
    },
    aiRecommendations: [
      'Strong build vs buy candidates - recommend thorough evaluation',
      'Integration with existing ServiceNow GRC module possible'
    ],
    vroInsights: [
      'Strategic alignment: Supports 2027 audit efficiency targets',
      'Process consolidation: Currently 8 systems for GRC activities'
    ],
    pmoDataFeeds: [
      'SharePoint: Initial requirements gathering'
    ],
    riskFlags: [],
    velocity: 0,
    burndownHealth: 100,
    qualityScore: 0
  },

  // ============ CORPORATE INVESTMENTS (2 projects) ============
  {
    id: 'proj-esg-reporting',
    name: 'ESG Analytics & Reporting',
    description: 'Comprehensive ESG scoring, carbon footprint tracking, and sustainability reporting for investment portfolios.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Sustainable Finance',
    artName: 'Sustainable Investment ART',
    safeStage: 'implementing',
    status: 'green',
    priority: 'high',
    startDate: '2025-02-01',
    targetEndDate: '2025-11-30',
    currentPI: 2,
    totalPIs: 4,
    features: [
      {
        id: 'feat-esg-scoring',
        epicId: 'proj-esg-reporting',
        title: 'ESG Scoring Engine',
        description: 'Proprietary ESG scoring methodology with third-party data integration',
        benefitHypothesis: 'Differentiated ESG insights driving $500M+ in sustainable AUM',
        acceptanceCriteria: ['Score 10,000+ securities', 'Monthly refresh', 'Audit trail'],
        wsjfScore: 30,
        status: 'implementing',
        targetPI: 2,
        stories: [
          {
            id: 'story-esg-001',
            featureId: 'feat-esg-scoring',
            title: 'MSCI ESG data integration',
            description: 'Ingest MSCI ESG ratings and scores',
            acceptanceCriteria: ['Daily data feed', 'Historical scores', 'Coverage tracking'],
            storyPoints: 8,
            status: 'done',
            sprint: 5,
            assignedTeam: 'ESG Tech Team',
            tasks: [
              { id: 'task-esg-001', storyId: 'story-esg-001', title: 'MSCI API connector', description: 'Build MSCI API integration', status: 'done', assignee: 'Anna Schmidt', estimatedHours: 16, actualHours: 14, priority: 'high' }
            ]
          }
        ],
        dependencies: []
      }
    ],
    resources: [
      { id: 'res-esg-001', name: 'Dr. Michael Foster', role: 'PO', allocation: 100, team: 'Sustainable Investment ART', costRate: 850 },
      { id: 'res-esg-002', name: 'Anna Schmidt', role: 'Developer', allocation: 100, team: 'ESG Tech Team', costRate: 700 }
    ],
    totalFTE: 3.0,
    milestones: [
      { id: 'ms-esg-001', name: 'Scoring Engine Live', targetDate: '2025-08-31', status: 'on-track', deliverables: ['ESG scores for all holdings', 'Client reports'], piNumber: 2 },
      { id: 'ms-esg-002', name: 'Carbon Analytics', targetDate: '2025-11-30', status: 'on-track', deliverables: ['Scope 1-3 emissions', 'Net zero pathway'], piNumber: 4 }
    ],
    dependencies: [],
    financials: {
      budget: 2200000,
      spent: 850000,
      forecast: 2100000,
      currency: '$',
      laborCost: 650000,
      vendorCost: 350000,
      infrastructureCost: 150000,
      contingency: 200000,
      roi: { projected: 15000000, confidence: 78, paybackMonths: 8 }
    },
    aiRecommendations: [
      'Client demand exceeding expectations - consider accelerating timeline',
      'TCFD reporting requirements coming - prepare disclosure templates'
    ],
    vroInsights: [
      'Market opportunity: ESG AUM growing 25% annually',
      'Competitive advantage: Proprietary scoring methodology differentiator',
      'Regulatory driver: SFDR requirements making this mandatory'
    ],
    pmoDataFeeds: [
      'Jira: 25 stories completed, 6 in progress'
    ],
    riskFlags: [],
    velocity: 28,
    burndownHealth: 90,
    qualityScore: 86
  },

  {
    id: 'proj-alt-investments',
    name: 'Alternative Investments Platform',
    description: 'Platform for managing private equity, real estate, and infrastructure investments with valuation and reporting.',
    bu: 'Corporate & Other',
    portfolioTheme: 'Investment Capability',
    artName: 'Private Markets ART',
    safeStage: 'backlog',
    status: 'green',
    priority: 'medium',
    startDate: '2025-11-01',
    targetEndDate: '2026-09-30',
    currentPI: 0,
    totalPIs: 4,
    features: [],
    resources: [
      { id: 'res-alt-001', name: 'James Morrison', role: 'PM', allocation: 25, team: 'Private Markets ART', costRate: 850 }
    ],
    totalFTE: 0.25,
    milestones: [
      { id: 'ms-alt-001', name: 'Vendor Selection', targetDate: '2025-12-31', status: 'on-track', deliverables: ['Platform selection', 'Implementation plan'], piNumber: 0 }
    ],
    dependencies: [],
    financials: {
      budget: 4500000,
      spent: 50000,
      forecast: 4500000,
      currency: '$',
      laborCost: 35000,
      vendorCost: 0,
      infrastructureCost: 0,
      contingency: 450000,
      roi: { projected: 18000000, confidence: 65, paybackMonths: 18 }
    },
    aiRecommendations: [
      'Consider cloud-native vendors for flexibility',
      'Early stakeholder engagement critical for requirements'
    ],
    vroInsights: [
      'Growth opportunity: Alt investments target 20% of AUM by 2027',
      'Operational risk: Current spreadsheet-based tracking is unsustainable'
    ],
    pmoDataFeeds: [
      'Confluence: Initial scoping'
    ],
    riskFlags: [],
    velocity: 0,
    burndownHealth: 100,
    qualityScore: 0
  }
];

// ============ HELPER FUNCTIONS ============

export function getProjectById(id: string): SAFeProject | undefined {
  return safeProjects.find(p => p.id === id);
}

export function getProjectsByBU(bu: SAFeProject['bu']): SAFeProject[] {
  return safeProjects.filter(p => p.bu === bu);
}

export function getProjectsByStage(stage: SAFeProject['safeStage']): SAFeProject[] {
  return safeProjects.filter(p => p.safeStage === stage);
}

export function getProjectDependencies(projectId: string): Dependency[] {
  const project = getProjectById(projectId);
  if (!project) return [];
  return project.dependencies;
}

export function getProjectsBlockedBy(projectId: string): SAFeProject[] {
  return safeProjects.filter(p => 
    p.dependencies.some(d => d.targetProjectId === projectId && d.type === 'blocked-by')
  );
}

export function getProjectsBlocking(projectId: string): SAFeProject[] {
  return safeProjects.filter(p => 
    p.dependencies.some(d => d.targetProjectId === projectId && d.type === 'blocks')
  );
}

export function getTotalPortfolioValue(): number {
  return safeProjects.reduce((sum, p) => sum + p.financials.roi.projected, 0);
}

export function getTotalBudget(): number {
  return safeProjects.reduce((sum, p) => sum + p.financials.budget, 0);
}

export function getTotalSpent(): number {
  return safeProjects.reduce((sum, p) => sum + p.financials.spent, 0);
}

export function getCriticalDependencies(): Dependency[] {
  return safeProjects.flatMap(p => p.dependencies).filter(d => d.health === 'red');
}

export function getAtRiskMilestones(): { project: SAFeProject; milestone: Milestone }[] {
  const atRisk: { project: SAFeProject; milestone: Milestone }[] = [];
  safeProjects.forEach(p => {
    p.milestones.forEach(m => {
      if (m.status === 'at-risk' || m.status === 'missed') {
        atRisk.push({ project: p, milestone: m });
      }
    });
  });
  return atRisk;
}

// Get all stories across all projects
export function getAllStories(): { project: SAFeProject; feature: Feature; story: Story }[] {
  const stories: { project: SAFeProject; feature: Feature; story: Story }[] = [];
  safeProjects.forEach(p => {
    p.features.forEach(f => {
      f.stories.forEach(s => {
        stories.push({ project: p, feature: f, story: s });
      });
    });
  });
  return stories;
}

// Get all tasks across all projects
export function getAllTasks(): { project: SAFeProject; feature: Feature; story: Story; task: Task }[] {
  const tasks: { project: SAFeProject; feature: Feature; story: Story; task: Task }[] = [];
  safeProjects.forEach(p => {
    p.features.forEach(f => {
      f.stories.forEach(s => {
        s.tasks.forEach(t => {
          tasks.push({ project: p, feature: f, story: s, task: t });
        });
      });
    });
  });
  return tasks;
}

// Portfolio summary metrics
export function getPortfolioSummary() {
  const projects = safeProjects;
  const totalBudget = getTotalBudget();
  const totalSpent = getTotalSpent();
  const totalROI = getTotalPortfolioValue();
  
  const byStatus = {
    green: projects.filter(p => p.status === 'green').length,
    amber: projects.filter(p => p.status === 'amber').length,
    red: projects.filter(p => p.status === 'red').length
  };
  
  const byStage = {
    funnel: projects.filter(p => p.safeStage === 'funnel').length,
    reviewing: projects.filter(p => p.safeStage === 'reviewing').length,
    analyzing: projects.filter(p => p.safeStage === 'analyzing').length,
    backlog: projects.filter(p => p.safeStage === 'backlog').length,
    implementing: projects.filter(p => p.safeStage === 'implementing').length,
    done: projects.filter(p => p.safeStage === 'done').length
  };
  
  const criticalDeps = getCriticalDependencies();
  const atRiskMilestones = getAtRiskMilestones();
  
  return {
    totalProjects: projects.length,
    totalBudget,
    totalSpent,
    totalROI,
    budgetUtilization: Math.round((totalSpent / totalBudget) * 100),
    byStatus,
    byStage,
    criticalDependencies: criticalDeps.length,
    atRiskMilestones: atRiskMilestones.length,
    averageVelocity: Math.round(projects.filter(p => p.velocity > 0).reduce((sum, p) => sum + p.velocity, 0) / projects.filter(p => p.velocity > 0).length),
    averageQuality: Math.round(projects.filter(p => p.qualityScore > 0).reduce((sum, p) => sum + p.qualityScore, 0) / projects.filter(p => p.qualityScore > 0).length)
  };
}
