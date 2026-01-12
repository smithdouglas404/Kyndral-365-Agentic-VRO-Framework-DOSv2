import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TemplateConfig {
  id: string;
  name: string;
  bu: string;
  division: string;
  description: string;
  expectedROI: string;
  roiValue: number;
  priority: 'critical' | 'high' | 'medium';
  status: 'green' | 'amber' | 'red';
  budget: { spent: number; total: number };
  timeline: { elapsed: number; total: number; startDate: string; endDate: string };
  artName: string;
  portfolioTheme: string;
  strategicObjectives: string[];
  featureConfigs: FeatureConfig[];
  teamMembers: TeamMember[];
  riskConfigs: RiskConfig[];
  dependencyConfigs: DependencyConfig[];
  stakeholderConfigs: StakeholderConfig[];
}

interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  status: 'done' | 'in-progress' | 'planned';
  storyPoints: number;
  completedPoints: number;
  priority: 'critical' | 'high' | 'medium';
  storyConfigs: StoryConfig[];
}

interface StoryConfig {
  id: string;
  name: string;
  description: string;
  storyPoints: number;
  status: 'done' | 'in-progress' | 'planned' | 'pending';
  taskConfigs: TaskConfig[];
}

interface TaskConfig {
  id: string;
  name: string;
  status: 'done' | 'in-progress' | 'pending' | 'planned';
  effortHours: number;
  assignee: string;
  skills: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  allocation: number;
  team: string;
  skills: string[];
  costRate: number;
}

interface RiskConfig {
  id: string;
  name: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'monitoring' | 'mitigated';
  mitigation: string;
  owner: string;
}

interface DependencyConfig {
  id: string;
  name: string;
  type: 'internal' | 'external';
  status: 'resolved' | 'active' | 'blocked';
  description: string;
}

interface StakeholderConfig {
  id: string;
  name: string;
  role: string;
  department: string;
  influence: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
}

function generateWSJF(priority: string): { businessValue: number; timeCriticality: number; riskReduction: number; jobSize: number; score: number } {
  const base = priority === 'critical' ? 21 : priority === 'high' ? 13 : 8;
  const bv = base;
  const tc = Math.round(base * 0.8);
  const rr = Math.round(base * 0.5);
  const js = Math.round(base * 0.6);
  return { businessValue: bv, timeCriticality: tc, riskReduction: rr, jobSize: js, score: Math.round(((bv + tc + rr) / js) * 100) / 100 };
}

function generateTemplate(config: TemplateConfig): object {
  const features = config.featureConfigs.map(fc => ({
    id: fc.id,
    name: fc.name,
    description: fc.description,
    status: fc.status,
    storyPoints: fc.storyPoints,
    completedPoints: fc.completedPoints,
    priority: fc.priority,
    wsjf: generateWSJF(fc.priority),
    acceptanceCriteria: [
      `Given ${fc.name.toLowerCase()} is configured, When triggered, Then expected outcome is achieved within SLA`,
      `Given valid inputs are provided, When processing completes, Then results are validated and persisted`,
      `Given edge cases occur, When handled, Then graceful error handling is applied with audit trail`
    ],
    stories: fc.storyConfigs.map(sc => ({
      id: sc.id,
      name: sc.name,
      description: sc.description,
      storyPoints: sc.storyPoints,
      status: sc.status,
      acceptanceCriteria: [
        `Given ${sc.name.toLowerCase().split(' ').slice(0, 3).join(' ')}, When action completed, Then result is verified`,
        `Given valid configuration, When executed, Then expected behavior occurs`,
        `Given error condition, When detected, Then appropriate handling applied`
      ],
      tasks: sc.taskConfigs.map(tc => ({
        id: tc.id,
        name: tc.name,
        status: tc.status,
        effortHours: tc.effortHours,
        assignee: tc.assignee,
        skills: tc.skills
      }))
    }))
  }));

  const velocityBase = 35 + Math.floor(Math.random() * 15);
  const currentPI = Math.ceil(config.timeline.elapsed / 2.5);
  const totalPIs = Math.ceil(config.timeline.total / 2.5);

  return {
    id: config.id,
    name: config.name,
    bu: config.bu,
    division: config.division,
    description: config.description,
    expectedROI: config.expectedROI,
    roiValue: config.roiValue,
    priority: config.priority,
    status: config.status,
    budget: { ...config.budget, unit: '£m', contingency: Math.round(config.budget.total * 0.1 * 10) / 10, forecastAtCompletion: Math.round((config.budget.spent + (config.budget.total - config.budget.spent) * 0.95) * 10) / 10 },
    timeline: { ...config.timeline, unit: 'months' },
    artName: config.artName,
    portfolioTheme: config.portfolioTheme,
    strategicObjectives: config.strategicObjectives,
    safe: {
      velocity: velocityBase,
      predictability: 75 + Math.floor(Math.random() * 15),
      flowEfficiency: 65 + Math.floor(Math.random() * 15),
      currentPI: `PI 24.${currentPI}`,
      totalPIs: totalPIs,
      piCadence: '10 weeks',
      epicId: `EPIC-${config.bu.substring(0, 3).toUpperCase()}-${config.id.split('-').pop()}`,
      epicName: config.name,
      epicProgress: Math.round((config.timeline.elapsed / config.timeline.total) * 100),
      epicWsjf: generateWSJF(config.priority),
      solutionTrain: `${config.division} Technology`,
      valueStream: config.portfolioTheme
    },
    features,
    resources: config.teamMembers.map(tm => ({
      id: tm.id,
      name: tm.name,
      role: tm.role,
      allocation: tm.allocation,
      team: tm.team,
      skills: tm.skills,
      costRate: tm.costRate
    })),
    milestones: [
      { id: `ms-${config.id}-1`, name: 'Phase 1 Complete', date: config.timeline.startDate, status: 'completed', deliverables: ['Initial setup', 'Core infrastructure'] },
      { id: `ms-${config.id}-2`, name: 'MVP Launch', date: new Date(new Date(config.timeline.startDate).getTime() + (config.timeline.total * 0.5 * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], status: config.status === 'green' ? 'in-progress' : 'planned', deliverables: ['Core features', 'User testing'] },
      { id: `ms-${config.id}-3`, name: 'Full Launch', date: config.timeline.endDate, status: 'planned', deliverables: ['All features complete', 'Training delivered'] }
    ],
    risks: config.riskConfigs.map(rc => ({
      id: rc.id,
      name: rc.name,
      probability: rc.probability,
      impact: rc.impact,
      status: rc.status,
      mitigation: rc.mitigation,
      owner: rc.owner
    })),
    dependencies: config.dependencyConfigs.map(dc => ({
      id: dc.id,
      name: dc.name,
      type: dc.type,
      status: dc.status,
      description: dc.description
    })),
    stakeholders: config.stakeholderConfigs.map(sc => ({
      id: sc.id,
      name: sc.name,
      role: sc.role,
      department: sc.department,
      influence: sc.influence,
      interest: sc.interest
    })),
    iterations: [
      { id: `iter-${config.id}-1`, name: `PI 24.${currentPI} - Iteration 1`, startDate: '2024-10-14', endDate: '2024-10-25', capacity: 100, committed: 95, completed: 92, velocity: 92 },
      { id: `iter-${config.id}-2`, name: `PI 24.${currentPI} - Iteration 2`, startDate: '2024-10-28', endDate: '2024-11-08', capacity: 100, committed: 98, completed: 95, velocity: 95 },
      { id: `iter-${config.id}-3`, name: `PI 24.${currentPI} - Iteration 3`, startDate: '2024-11-11', endDate: '2024-11-22', capacity: 100, committed: 100, completed: 0, velocity: null }
    ],
    financials: {
      capitalex: Math.round(config.budget.total * 0.75 * 10) / 10,
      opex: Math.round(config.budget.total * 0.25 * 10) / 10,
      contingency: Math.round(config.budget.total * 0.1 * 10) / 10,
      npv: Math.round(config.roiValue * 0.8 * 10) / 10,
      irr: 35 + Math.floor(Math.random() * 20),
      paybackMonths: Math.round(config.timeline.total * 1.2),
      costBreakdown: {
        development: Math.round(config.budget.total * 0.5 * 10) / 10,
        infrastructure: Math.round(config.budget.total * 0.2 * 10) / 10,
        licensing: Math.round(config.budget.total * 0.15 * 10) / 10,
        contingency: Math.round(config.budget.total * 0.1 * 10) / 10
      }
    },
    qualityMetrics: {
      defectDensity: Math.round((0.4 + Math.random() * 0.4) * 10) / 10,
      testCoverage: 80 + Math.floor(Math.random() * 12),
      technicalDebtDays: 6 + Math.floor(Math.random() * 8),
      codeReviewCoverage: 100,
      documentationScore: 78 + Math.floor(Math.random() * 12)
    },
    currentPI: currentPI,
    totalPIs: totalPIs,
    velocity: velocityBase,
    burndownHealth: 75 + Math.floor(Math.random() * 15),
    qualityScore: 80 + Math.floor(Math.random() * 12)
  };
}

const remainingTemplates: TemplateConfig[] = [
  {
    id: 'pmo-lgim-001',
    name: 'ESG Analytics Dashboard',
    bu: 'LGIM',
    division: 'Investment Management',
    description: 'Enterprise ESG scoring and analytics platform integrating MSCI, Sustainalytics, and proprietary climate data. Provides portfolio-level ESG risk assessment, regulatory reporting (SFDR, TCFD), and client-facing sustainability insights.',
    expectedROI: '£18m AUM growth through ESG mandates',
    roiValue: 18,
    priority: 'critical',
    status: 'green',
    budget: { spent: 1.8, total: 3.2 },
    timeline: { elapsed: 8, total: 14, startDate: '2024-02-01', endDate: '2025-04-01' },
    artName: 'Sustainable Investment ART',
    portfolioTheme: 'ESG Leadership',
    strategicObjectives: ['SO-2: Climate Transition', 'SO-1: Market Leadership', 'SO-5: Regulatory Excellence'],
    featureConfigs: [
      {
        id: 'feat-esg-001',
        name: 'ESG Data Integration Hub',
        description: 'Unified ingestion pipeline for MSCI, Sustainalytics, CDP, and internal climate models with daily refresh.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-esg-001', name: 'MSCI ESG Ratings Integration', description: 'As a Portfolio Manager, I need MSCI ESG ratings integrated so that I can assess holdings.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-esg-001', name: 'Build MSCI API connector', status: 'done', effortHours: 24, assignee: 'David Chen', skills: ['APIs', 'Python'] },
            { id: 'task-esg-002', name: 'Create data normalization layer', status: 'done', effortHours: 16, assignee: 'David Chen', skills: ['ETL', 'SQL'] },
            { id: 'task-esg-003', name: 'Implement daily refresh scheduler', status: 'done', effortHours: 12, assignee: 'Emma Wilson', skills: ['Airflow', 'Scheduling'] }
          ]},
          { id: 'story-esg-002', name: 'Sustainalytics Risk Scores', description: 'As a Risk Analyst, I need Sustainalytics risk scores so that I can identify ESG controversies.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-esg-004', name: 'Integrate Sustainalytics feed', status: 'done', effortHours: 20, assignee: 'Emma Wilson', skills: ['APIs', 'Data Engineering'] },
            { id: 'task-esg-005', name: 'Map to internal security master', status: 'done', effortHours: 12, assignee: 'David Chen', skills: ['Data Mapping'] }
          ]},
          { id: 'story-esg-003', name: 'Climate Data Pipeline', description: 'As a Climate Analyst, I need proprietary climate metrics so that I can assess transition risk.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-esg-006', name: 'Build climate model ingestion', status: 'done', effortHours: 32, assignee: 'Climate Team', skills: ['Climate Science', 'Python'] },
            { id: 'task-esg-007', name: 'Create scenario analysis engine', status: 'done', effortHours: 24, assignee: 'Climate Team', skills: ['Modeling', 'Analytics'] }
          ]}
        ]
      },
      {
        id: 'feat-esg-002',
        name: 'Portfolio ESG Scoring',
        description: 'Real-time portfolio-level ESG scores with drill-down to security-level metrics and peer benchmarking.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-esg-004', name: 'Portfolio Score Calculator', description: 'As a PM, I need weighted portfolio ESG scores so that I can report to clients.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-esg-008', name: 'Build weighted scoring engine', status: 'done', effortHours: 24, assignee: 'David Chen', skills: ['Python', 'Finance'] },
            { id: 'task-esg-009', name: 'Create benchmark comparison', status: 'done', effortHours: 16, assignee: 'Emma Wilson', skills: ['Analytics'] }
          ]},
          { id: 'story-esg-005', name: 'ESG Dashboard UI', description: 'As a User, I need interactive ESG dashboards so that I can explore data visually.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-esg-010', name: 'Design dashboard wireframes', status: 'done', effortHours: 16, assignee: 'UX Team', skills: ['UX Design'] },
            { id: 'task-esg-011', name: 'Build React dashboard components', status: 'in-progress', effortHours: 32, assignee: 'Frontend Team', skills: ['React', 'D3.js'] },
            { id: 'task-esg-012', name: 'Implement drill-down navigation', status: 'pending', effortHours: 16, assignee: 'Frontend Team', skills: ['React'] }
          ]}
        ]
      },
      {
        id: 'feat-esg-003',
        name: 'Regulatory Reporting Module',
        description: 'Automated SFDR, TCFD, and EU Taxonomy reporting with audit trails and regulatory submission workflows.',
        status: 'planned',
        storyPoints: 34,
        completedPoints: 0,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-esg-006', name: 'SFDR Report Generation', description: 'As Compliance, I need automated SFDR reports so that I meet regulatory deadlines.', storyPoints: 21, status: 'planned', taskConfigs: [
            { id: 'task-esg-013', name: 'Build SFDR template engine', status: 'planned', effortHours: 32, assignee: 'Regulatory Team', skills: ['Compliance', 'Reporting'] },
            { id: 'task-esg-014', name: 'Create data extraction pipelines', status: 'planned', effortHours: 24, assignee: 'David Chen', skills: ['ETL'] },
            { id: 'task-esg-015', name: 'Implement approval workflow', status: 'planned', effortHours: 16, assignee: 'Emma Wilson', skills: ['Workflow'] }
          ]},
          { id: 'story-esg-007', name: 'TCFD Climate Disclosures', description: 'As a Reporting Analyst, I need TCFD templates so that I can produce climate disclosures.', storyPoints: 13, status: 'planned', taskConfigs: [
            { id: 'task-esg-016', name: 'Build TCFD data model', status: 'planned', effortHours: 20, assignee: 'Climate Team', skills: ['Climate', 'Data Modeling'] },
            { id: 'task-esg-017', name: 'Create disclosure templates', status: 'planned', effortHours: 16, assignee: 'Regulatory Team', skills: ['Reporting'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-esg-001', name: 'David Chen', role: 'Lead Data Engineer', allocation: 100, team: 'Data', skills: ['Python', 'ETL', 'APIs'], costRate: 800 },
      { id: 'res-esg-002', name: 'Emma Wilson', role: 'ESG Analyst', allocation: 80, team: 'ESG', skills: ['ESG Analysis', 'Reporting'], costRate: 750 }
    ],
    riskConfigs: [
      { id: 'risk-esg-001', name: 'Data vendor API changes', probability: 'medium', impact: 'high', status: 'monitoring', mitigation: 'Version-locked API contracts; automated regression testing', owner: 'David Chen' },
      { id: 'risk-esg-002', name: 'SFDR regulatory changes', probability: 'high', impact: 'high', status: 'active', mitigation: 'Regulatory monitoring; modular template architecture', owner: 'Compliance Team' }
    ],
    dependencyConfigs: [
      { id: 'dep-esg-001', name: 'MSCI Data License', type: 'external', status: 'resolved', description: 'Enterprise license for ESG ratings' },
      { id: 'dep-esg-002', name: 'Security Master', type: 'internal', status: 'resolved', description: 'Integration with central security reference data' }
    ],
    stakeholderConfigs: [
      { id: 'sh-esg-001', name: 'Michelle Scrimgeour', role: 'CEO LGIM', department: 'Executive', influence: 'high', interest: 'high' },
      { id: 'sh-esg-002', name: 'Sustainable Investment Team', role: 'Key Users', department: 'Investment', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgc-003',
    name: 'Operational Resilience Framework',
    bu: 'LGC',
    division: 'Group Operations',
    description: 'Enterprise operational resilience platform meeting PRA/FCA requirements. Includes impact tolerance mapping, scenario testing, third-party dependency management, and crisis management workflows.',
    expectedROI: '£8m regulatory fine avoidance + £15m operational efficiency',
    roiValue: 23,
    priority: 'critical',
    status: 'amber',
    budget: { spent: 2.1, total: 3.5 },
    timeline: { elapsed: 9, total: 12, startDate: '2024-01-01', endDate: '2025-01-01' },
    artName: 'Enterprise Resilience ART',
    portfolioTheme: 'Operational Excellence',
    strategicObjectives: ['SO-5: Regulatory Excellence', 'SO-3: Operational Excellence', 'SO-4: Client Trust'],
    featureConfigs: [
      {
        id: 'feat-opr-001',
        name: 'Important Business Services Mapping',
        description: 'Complete mapping of 47 important business services with dependencies, tolerances, and recovery objectives.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-opr-001', name: 'IBS Dependency Mapping', description: 'As Resilience Lead, I need service dependency maps so that I understand failure cascades.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-opr-001', name: 'Interview service owners', status: 'done', effortHours: 40, assignee: 'Sophie Brown', skills: ['Business Analysis'] },
            { id: 'task-opr-002', name: 'Build dependency graph model', status: 'done', effortHours: 24, assignee: 'Tech Lead', skills: ['Graph DB', 'Neo4j'] },
            { id: 'task-opr-003', name: 'Create visualization dashboard', status: 'done', effortHours: 20, assignee: 'Frontend Team', skills: ['D3.js', 'React'] }
          ]},
          { id: 'story-opr-002', name: 'Impact Tolerance Definition', description: 'As a Regulator, I need documented impact tolerances so that I can assess compliance.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-opr-004', name: 'Define tolerance thresholds', status: 'done', effortHours: 32, assignee: 'Sophie Brown', skills: ['Risk Management'] },
            { id: 'task-opr-005', name: 'Document tolerance rationale', status: 'done', effortHours: 16, assignee: 'Compliance', skills: ['Documentation'] }
          ]},
          { id: 'story-opr-003', name: 'Recovery Time Objectives', description: 'As IT Ops, I need RTO/RPO targets so that I can design recovery procedures.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-opr-006', name: 'Calculate business impact', status: 'done', effortHours: 24, assignee: 'Sophie Brown', skills: ['BIA'] },
            { id: 'task-opr-007', name: 'Define RTO/RPO targets', status: 'done', effortHours: 16, assignee: 'IT Ops', skills: ['DR Planning'] }
          ]}
        ]
      },
      {
        id: 'feat-opr-002',
        name: 'Scenario Testing Engine',
        description: 'Automated scenario testing platform for severe but plausible disruption scenarios with evidence capture.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 13,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-opr-004', name: 'Scenario Library', description: 'As a Tester, I need predefined scenarios so that I can run consistent tests.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-opr-008', name: 'Define 20 core scenarios', status: 'done', effortHours: 40, assignee: 'Sophie Brown', skills: ['Risk Scenarios'] },
            { id: 'task-opr-009', name: 'Build scenario configuration UI', status: 'done', effortHours: 24, assignee: 'Frontend Team', skills: ['React'] }
          ]},
          { id: 'story-opr-005', name: 'Test Execution Framework', description: 'As a Coordinator, I need automated test orchestration so that tests run efficiently.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-opr-010', name: 'Build test orchestration engine', status: 'in-progress', effortHours: 32, assignee: 'Backend Team', skills: ['Node.js', 'Orchestration'] },
            { id: 'task-opr-011', name: 'Create evidence capture system', status: 'pending', effortHours: 24, assignee: 'Backend Team', skills: ['Document Management'] },
            { id: 'task-opr-012', name: 'Implement regulatory reporting', status: 'pending', effortHours: 20, assignee: 'Sophie Brown', skills: ['Compliance'] }
          ]}
        ]
      },
      {
        id: 'feat-opr-003',
        name: 'Third Party Risk Management',
        description: 'Centralized third-party dependency tracking with concentration risk analysis and exit planning.',
        status: 'planned',
        storyPoints: 21,
        completedPoints: 0,
        priority: 'high',
        storyConfigs: [
          { id: 'story-opr-006', name: 'Vendor Dependency Register', description: 'As Procurement, I need a vendor register so that I can track critical suppliers.', storyPoints: 13, status: 'planned', taskConfigs: [
            { id: 'task-opr-013', name: 'Build vendor database', status: 'planned', effortHours: 20, assignee: 'Backend Team', skills: ['Database'] },
            { id: 'task-opr-014', name: 'Create risk scoring model', status: 'planned', effortHours: 16, assignee: 'Sophie Brown', skills: ['Risk Assessment'] }
          ]},
          { id: 'story-opr-007', name: 'Concentration Risk Dashboard', description: 'As Risk Officer, I need concentration analysis so that I can identify single points of failure.', storyPoints: 8, status: 'planned', taskConfigs: [
            { id: 'task-opr-015', name: 'Build concentration analytics', status: 'planned', effortHours: 16, assignee: 'Analytics Team', skills: ['Analytics'] },
            { id: 'task-opr-016', name: 'Create alerting rules', status: 'planned', effortHours: 8, assignee: 'Backend Team', skills: ['Rules Engine'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-opr-001', name: 'Sophie Brown', role: 'Resilience Lead', allocation: 100, team: 'Operations', skills: ['Op Resilience', 'Regulation'], costRate: 850 },
      { id: 'res-opr-002', name: 'IT Ops Team', role: 'Infrastructure', allocation: 50, team: 'IT', skills: ['DR', 'Infrastructure'], costRate: 700 }
    ],
    riskConfigs: [
      { id: 'risk-opr-001', name: 'Regulatory deadline pressure', probability: 'high', impact: 'critical', status: 'active', mitigation: 'Weekly regulator engagement; phased delivery', owner: 'Sophie Brown' },
      { id: 'risk-opr-002', name: 'Third-party data gaps', probability: 'medium', impact: 'high', status: 'active', mitigation: 'Vendor outreach program; data gap remediation plan', owner: 'Procurement' }
    ],
    dependencyConfigs: [
      { id: 'dep-opr-001', name: 'CMDB Integration', type: 'internal', status: 'active', description: 'Configuration management database for asset data' },
      { id: 'dep-opr-002', name: 'Vendor Management System', type: 'internal', status: 'resolved', description: 'Third-party contract data' }
    ],
    stakeholderConfigs: [
      { id: 'sh-opr-001', name: 'Group COO', role: 'Sponsor', department: 'Operations', influence: 'high', interest: 'high' },
      { id: 'sh-opr-002', name: 'PRA Supervisor', role: 'Regulator', department: 'External', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgr-001',
    name: 'Longevity Model Enhancement',
    bu: 'LGR',
    division: 'Retail Retirement',
    description: 'Next-generation longevity modeling incorporating socioeconomic factors, lifestyle data, and AI-driven mortality predictions. Critical for PRT pricing accuracy and annuity reserving.',
    expectedROI: '£45m improved pricing accuracy',
    roiValue: 45,
    priority: 'critical',
    status: 'green',
    budget: { spent: 1.5, total: 2.8 },
    timeline: { elapsed: 7, total: 12, startDate: '2024-03-01', endDate: '2025-03-01' },
    artName: 'Actuarial Analytics ART',
    portfolioTheme: 'Pricing Excellence',
    strategicObjectives: ['SO-1: Market Leadership', 'SO-3: Operational Excellence'],
    featureConfigs: [
      {
        id: 'feat-lon-001',
        name: 'Socioeconomic Mortality Factors',
        description: 'Integration of postcode-level deprivation indices, occupation codes, and lifestyle factors into mortality models.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-lon-001', name: 'Deprivation Index Integration', description: 'As an Actuary, I need IMD data so that I can adjust mortality by socioeconomic factors.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-lon-001', name: 'Source ONS IMD data', status: 'done', effortHours: 16, assignee: 'Data Team', skills: ['Data Sourcing'] },
            { id: 'task-lon-002', name: 'Build postcode lookup service', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['APIs'] },
            { id: 'task-lon-003', name: 'Integrate with pricing engine', status: 'done', effortHours: 24, assignee: 'Actuarial Dev', skills: ['Actuarial', 'Integration'] }
          ]},
          { id: 'story-lon-002', name: 'Occupation-Based Adjustments', description: 'As an Underwriter, I need occupation adjustments so that I can price workplace hazards.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-lon-004', name: 'Map SOC codes to mortality', status: 'done', effortHours: 24, assignee: 'Actuarial Team', skills: ['Actuarial Science'] },
            { id: 'task-lon-005', name: 'Build occupation scoring model', status: 'done', effortHours: 20, assignee: 'Actuarial Dev', skills: ['Modeling'] }
          ]},
          { id: 'story-lon-003', name: 'Lifestyle Factor Model', description: 'As a Pricing Actuary, I need lifestyle adjustments so that I can refine individual pricing.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-lon-006', name: 'Define lifestyle factor taxonomy', status: 'done', effortHours: 16, assignee: 'Actuarial Team', skills: ['Research'] },
            { id: 'task-lon-007', name: 'Train lifestyle adjustment model', status: 'done', effortHours: 32, assignee: 'ML Team', skills: ['Machine Learning'] }
          ]}
        ]
      },
      {
        id: 'feat-lon-002',
        name: 'AI Mortality Prediction',
        description: 'Machine learning models for individual mortality prediction using gradient boosting and neural networks.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-lon-004', name: 'XGBoost Mortality Model', description: 'As a Data Scientist, I need XGBoost models so that I can capture non-linear effects.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-lon-008', name: 'Feature engineering pipeline', status: 'done', effortHours: 24, assignee: 'ML Team', skills: ['Feature Engineering'] },
            { id: 'task-lon-009', name: 'Train and validate XGBoost', status: 'done', effortHours: 32, assignee: 'ML Team', skills: ['XGBoost', 'Python'] },
            { id: 'task-lon-010', name: 'Model explainability (SHAP)', status: 'done', effortHours: 16, assignee: 'ML Team', skills: ['Interpretability'] }
          ]},
          { id: 'story-lon-005', name: 'Neural Network Ensemble', description: 'As an Actuary, I need NN models so that I can capture complex interactions.', storyPoints: 13, status: 'in-progress', taskConfigs: [
            { id: 'task-lon-011', name: 'Design NN architecture', status: 'done', effortHours: 20, assignee: 'ML Lead', skills: ['Deep Learning'] },
            { id: 'task-lon-012', name: 'Train on historical data', status: 'in-progress', effortHours: 40, assignee: 'ML Team', skills: ['TensorFlow'] },
            { id: 'task-lon-013', name: 'Ensemble with XGBoost', status: 'pending', effortHours: 16, assignee: 'ML Team', skills: ['Ensemble Methods'] }
          ]}
        ]
      },
      {
        id: 'feat-lon-003',
        name: 'Model Validation & Governance',
        description: 'Comprehensive model validation framework with backtesting, stress testing, and regulatory documentation.',
        status: 'planned',
        storyPoints: 21,
        completedPoints: 0,
        priority: 'high',
        storyConfigs: [
          { id: 'story-lon-006', name: 'Backtesting Framework', description: 'As Model Risk, I need backtesting so that I can validate model accuracy.', storyPoints: 13, status: 'planned', taskConfigs: [
            { id: 'task-lon-014', name: 'Build backtesting engine', status: 'planned', effortHours: 24, assignee: 'Model Risk', skills: ['Validation'] },
            { id: 'task-lon-015', name: 'Create performance metrics', status: 'planned', effortHours: 12, assignee: 'Actuarial Dev', skills: ['Metrics'] }
          ]},
          { id: 'story-lon-007', name: 'Stress Testing Suite', description: 'As a Regulator, I need stress tests so that I can assess model resilience.', storyPoints: 8, status: 'planned', taskConfigs: [
            { id: 'task-lon-016', name: 'Define stress scenarios', status: 'planned', effortHours: 16, assignee: 'Actuarial Team', skills: ['Stress Testing'] },
            { id: 'task-lon-017', name: 'Implement automated testing', status: 'planned', effortHours: 20, assignee: 'Actuarial Dev', skills: ['Automation'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-lon-001', name: 'Chief Actuary', role: 'Sponsor', allocation: 20, team: 'Actuarial', skills: ['Actuarial Science'], costRate: 1200 },
      { id: 'res-lon-002', name: 'ML Team', role: 'Data Scientists', allocation: 100, team: 'Analytics', skills: ['ML', 'Python'], costRate: 850 }
    ],
    riskConfigs: [
      { id: 'risk-lon-001', name: 'Model overfit to historical data', probability: 'medium', impact: 'high', status: 'monitoring', mitigation: 'Cross-validation; holdout testing; regular recalibration', owner: 'ML Lead' },
      { id: 'risk-lon-002', name: 'Regulatory model approval delays', probability: 'medium', impact: 'high', status: 'active', mitigation: 'Early PRA engagement; comprehensive documentation', owner: 'Chief Actuary' }
    ],
    dependencyConfigs: [
      { id: 'dep-lon-001', name: 'Historical mortality data', type: 'internal', status: 'resolved', description: '20 years of experience data' },
      { id: 'dep-lon-002', name: 'ONS Population Data', type: 'external', status: 'resolved', description: 'National population statistics' }
    ],
    stakeholderConfigs: [
      { id: 'sh-lon-001', name: 'Chief Actuary', role: 'Sponsor', department: 'Actuarial', influence: 'high', interest: 'high' },
      { id: 'sh-lon-002', name: 'PRT Pricing Team', role: 'Key Users', department: 'Pricing', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgr-002',
    name: 'PRT Intake System Upgrade',
    bu: 'LGR',
    division: 'Institutional Retirement',
    description: 'Modernization of Pension Risk Transfer intake system handling £10bn+ annual volume. Includes scheme data ingestion, automated benefit calculations, and pricing workflow optimization.',
    expectedROI: '£35m operational efficiency + faster deal execution',
    roiValue: 35,
    priority: 'critical',
    status: 'green',
    budget: { spent: 2.2, total: 4.0 },
    timeline: { elapsed: 8, total: 14, startDate: '2024-02-01', endDate: '2025-04-01' },
    artName: 'PRT Operations ART',
    portfolioTheme: 'Operational Excellence',
    strategicObjectives: ['SO-1: Market Leadership', 'SO-3: Operational Excellence'],
    featureConfigs: [
      {
        id: 'feat-prt-001',
        name: 'Scheme Data Ingestion',
        description: 'Automated ingestion of pension scheme data in multiple formats with validation and cleansing.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-prt-001', name: 'Multi-Format Parser', description: 'As a Data Analyst, I need format-agnostic ingestion so that I can process any scheme data.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-prt-001', name: 'Build Excel parser', status: 'done', effortHours: 20, assignee: 'Data Team', skills: ['Python', 'Pandas'] },
            { id: 'task-prt-002', name: 'Build CSV/XML parsers', status: 'done', effortHours: 16, assignee: 'Data Team', skills: ['ETL'] },
            { id: 'task-prt-003', name: 'Create schema mapping engine', status: 'done', effortHours: 24, assignee: 'Data Lead', skills: ['Data Engineering'] }
          ]},
          { id: 'story-prt-002', name: 'Data Validation Rules', description: 'As Data Quality, I need validation rules so that I catch errors at ingestion.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-prt-004', name: 'Define 200+ validation rules', status: 'done', effortHours: 32, assignee: 'Business Analysts', skills: ['Business Rules'] },
            { id: 'task-prt-005', name: 'Build validation engine', status: 'done', effortHours: 24, assignee: 'Backend Team', skills: ['Rules Engine'] }
          ]},
          { id: 'story-prt-003', name: 'Data Cleansing Workflows', description: 'As an Operator, I need cleansing tools so that I can fix data issues efficiently.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-prt-006', name: 'Build data cleansing UI', status: 'done', effortHours: 32, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-prt-007', name: 'Create exception queues', status: 'done', effortHours: 16, assignee: 'Backend Team', skills: ['Workflow'] }
          ]}
        ]
      },
      {
        id: 'feat-prt-002',
        name: 'Automated Benefit Calculations',
        description: 'Rules-based benefit calculation engine handling 50+ scheme rule variations with audit trails.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-prt-004', name: 'Benefit Calculation Engine', description: 'As a Calculator, I need automated calculations so that I reduce manual effort.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-prt-008', name: 'Build calculation framework', status: 'done', effortHours: 40, assignee: 'Actuarial Dev', skills: ['Actuarial', 'Java'] },
            { id: 'task-prt-009', name: 'Implement 50 scheme rules', status: 'done', effortHours: 60, assignee: 'Rules Team', skills: ['Business Rules'] }
          ]},
          { id: 'story-prt-005', name: 'Calculation Audit Trail', description: 'As Compliance, I need full audit trails so that I can demonstrate calculation accuracy.', storyPoints: 13, status: 'in-progress', taskConfigs: [
            { id: 'task-prt-010', name: 'Design audit data model', status: 'done', effortHours: 16, assignee: 'Data Lead', skills: ['Data Modeling'] },
            { id: 'task-prt-011', name: 'Implement audit logging', status: 'in-progress', effortHours: 24, assignee: 'Backend Team', skills: ['Logging'] },
            { id: 'task-prt-012', name: 'Build audit query interface', status: 'pending', effortHours: 16, assignee: 'Frontend Team', skills: ['React'] }
          ]}
        ]
      },
      {
        id: 'feat-prt-003',
        name: 'Pricing Workflow Optimization',
        description: 'Streamlined pricing workflow with automated handoffs, SLA tracking, and deal pipeline visibility.',
        status: 'planned',
        storyPoints: 21,
        completedPoints: 0,
        priority: 'high',
        storyConfigs: [
          { id: 'story-prt-006', name: 'Workflow Automation', description: 'As a Pricer, I need automated workflows so that deals progress without manual intervention.', storyPoints: 13, status: 'planned', taskConfigs: [
            { id: 'task-prt-013', name: 'Design workflow states', status: 'planned', effortHours: 16, assignee: 'Business Analysts', skills: ['Process Design'] },
            { id: 'task-prt-014', name: 'Implement workflow engine', status: 'planned', effortHours: 32, assignee: 'Backend Team', skills: ['Workflow'] }
          ]},
          { id: 'story-prt-007', name: 'Pipeline Dashboard', description: 'As Deal Lead, I need pipeline visibility so that I can manage deal flow.', storyPoints: 8, status: 'planned', taskConfigs: [
            { id: 'task-prt-015', name: 'Build pipeline dashboard', status: 'planned', effortHours: 24, assignee: 'Frontend Team', skills: ['React', 'D3'] },
            { id: 'task-prt-016', name: 'Create SLA alerting', status: 'planned', effortHours: 12, assignee: 'Backend Team', skills: ['Alerting'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-prt-001', name: 'PRT Operations Lead', role: 'Product Owner', allocation: 80, team: 'Operations', skills: ['PRT', 'Operations'], costRate: 900 },
      { id: 'res-prt-002', name: 'Data Team', role: 'Data Engineering', allocation: 100, team: 'Data', skills: ['ETL', 'Python'], costRate: 750 }
    ],
    riskConfigs: [
      { id: 'risk-prt-001', name: 'Legacy system integration', probability: 'high', impact: 'medium', status: 'active', mitigation: 'API adapter layer; parallel running', owner: 'Tech Lead' },
      { id: 'risk-prt-002', name: 'Deal volume spikes', probability: 'medium', impact: 'medium', status: 'monitoring', mitigation: 'Cloud scaling; capacity testing', owner: 'Infrastructure' }
    ],
    dependencyConfigs: [
      { id: 'dep-prt-001', name: 'Legacy PRT System', type: 'internal', status: 'active', description: 'Data migration from legacy' },
      { id: 'dep-prt-002', name: 'Pricing Engine', type: 'internal', status: 'resolved', description: 'Integration with actuarial pricing' }
    ],
    stakeholderConfigs: [
      { id: 'sh-prt-001', name: 'PRT MD', role: 'Sponsor', department: 'PRT', influence: 'high', interest: 'high' },
      { id: 'sh-prt-002', name: 'Operations Team', role: 'Key Users', department: 'Operations', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgim-002',
    name: 'Investment Research AI',
    bu: 'LGIM',
    division: 'Investment Management',
    description: 'AI-powered investment research platform using LLMs for earnings call analysis, research synthesis, and sentiment extraction. Enables faster, deeper research coverage.',
    expectedROI: '£22m alpha generation potential',
    roiValue: 22,
    priority: 'high',
    status: 'green',
    budget: { spent: 0.8, total: 1.5 },
    timeline: { elapsed: 4, total: 8, startDate: '2024-06-01', endDate: '2025-02-01' },
    artName: 'Investment Technology ART',
    portfolioTheme: 'AI Enablement',
    strategicObjectives: ['SO-1: Market Leadership', 'SO-6: Digital Transformation'],
    featureConfigs: [
      {
        id: 'feat-ira-001',
        name: 'Earnings Call Analysis',
        description: 'Automated transcription, summarization, and sentiment analysis of quarterly earnings calls.',
        status: 'done',
        storyPoints: 34,
        completedPoints: 34,
        priority: 'high',
        storyConfigs: [
          { id: 'story-ira-001', name: 'Earnings Transcription', description: 'As an Analyst, I need automated transcripts so that I can search call content.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-ira-001', name: 'Integrate Whisper ASR', status: 'done', effortHours: 20, assignee: 'ML Team', skills: ['Speech Recognition'] },
            { id: 'task-ira-002', name: 'Build transcript processing', status: 'done', effortHours: 16, assignee: 'ML Team', skills: ['NLP'] }
          ]},
          { id: 'story-ira-002', name: 'Call Summarization', description: 'As a PM, I need call summaries so that I can quickly understand key points.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-ira-003', name: 'Fine-tune summarization LLM', status: 'done', effortHours: 32, assignee: 'ML Team', skills: ['LLM', 'Fine-tuning'] },
            { id: 'task-ira-004', name: 'Build summary generation API', status: 'done', effortHours: 12, assignee: 'Backend Team', skills: ['APIs'] }
          ]},
          { id: 'story-ira-003', name: 'Management Sentiment', description: 'As a Trader, I need sentiment scores so that I can gauge management tone.', storyPoints: 8, status: 'done', taskConfigs: [
            { id: 'task-ira-005', name: 'Build sentiment classifier', status: 'done', effortHours: 24, assignee: 'ML Team', skills: ['NLP', 'Sentiment'] },
            { id: 'task-ira-006', name: 'Create sentiment dashboard', status: 'done', effortHours: 16, assignee: 'Frontend Team', skills: ['React'] }
          ]}
        ]
      },
      {
        id: 'feat-ira-002',
        name: 'Research Synthesis Engine',
        description: 'LLM-powered synthesis of broker research, news, and filings into consolidated investment views.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 13,
        priority: 'high',
        storyConfigs: [
          { id: 'story-ira-004', name: 'Document Ingestion', description: 'As a Researcher, I need automated doc ingestion so that I have current data.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-ira-007', name: 'Build PDF/doc parser', status: 'done', effortHours: 20, assignee: 'Data Team', skills: ['Document Processing'] },
            { id: 'task-ira-008', name: 'Create vector embeddings', status: 'done', effortHours: 16, assignee: 'ML Team', skills: ['Embeddings'] }
          ]},
          { id: 'story-ira-005', name: 'Research Q&A', description: 'As an Analyst, I need Q&A interface so that I can query research.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-ira-009', name: 'Build RAG pipeline', status: 'done', effortHours: 24, assignee: 'ML Team', skills: ['RAG', 'LangChain'] },
            { id: 'task-ira-010', name: 'Create chat interface', status: 'in-progress', effortHours: 20, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-ira-011', name: 'Implement citations', status: 'pending', effortHours: 16, assignee: 'ML Team', skills: ['RAG'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-ira-001', name: 'ML Lead', role: 'Technical Lead', allocation: 100, team: 'AI', skills: ['ML', 'NLP', 'LLM'], costRate: 900 },
      { id: 'res-ira-002', name: 'Investment Research', role: 'Domain Expert', allocation: 40, team: 'Research', skills: ['Investment Analysis'], costRate: 1000 }
    ],
    riskConfigs: [
      { id: 'risk-ira-001', name: 'LLM accuracy for financial domain', probability: 'medium', impact: 'high', status: 'active', mitigation: 'Domain fine-tuning; human validation; confidence thresholds', owner: 'ML Lead' },
      { id: 'risk-ira-002', name: 'Data licensing restrictions', probability: 'low', impact: 'medium', status: 'monitoring', mitigation: 'Legal review of all data sources; enterprise licenses', owner: 'Legal' }
    ],
    dependencyConfigs: [
      { id: 'dep-ira-001', name: 'Azure OpenAI', type: 'external', status: 'resolved', description: 'Enterprise LLM access' },
      { id: 'dep-ira-002', name: 'Bloomberg Terminal', type: 'external', status: 'resolved', description: 'Market data feed' }
    ],
    stakeholderConfigs: [
      { id: 'sh-ira-001', name: 'CIO LGIM', role: 'Sponsor', department: 'Investment', influence: 'high', interest: 'high' },
      { id: 'sh-ira-002', name: 'Research Analysts', role: 'Key Users', department: 'Research', influence: 'medium', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgc-004',
    name: 'Net Zero Housing Tracker',
    bu: 'LGC',
    division: 'Housing',
    description: 'Portfolio-wide carbon tracking and net-zero pathway platform for 3,500+ housing units. Monitors energy consumption, retrofit planning, and EPC ratings improvement.',
    expectedROI: '£12m operational savings + regulatory compliance',
    roiValue: 12,
    priority: 'high',
    status: 'green',
    budget: { spent: 0.6, total: 1.2 },
    timeline: { elapsed: 5, total: 9, startDate: '2024-05-01', endDate: '2025-02-01' },
    artName: 'Sustainable Housing ART',
    portfolioTheme: 'ESG Leadership',
    strategicObjectives: ['SO-2: Climate Transition', 'SO-3: Operational Excellence'],
    featureConfigs: [
      {
        id: 'feat-nzh-001',
        name: 'Energy Consumption Tracking',
        description: 'Real-time energy monitoring across housing portfolio with smart meter integration.',
        status: 'done',
        storyPoints: 34,
        completedPoints: 34,
        priority: 'high',
        storyConfigs: [
          { id: 'story-nzh-001', name: 'Smart Meter Integration', description: 'As a Property Manager, I need meter data so that I can monitor consumption.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-nzh-001', name: 'Build meter API integration', status: 'done', effortHours: 24, assignee: 'IoT Team', skills: ['IoT', 'APIs'] },
            { id: 'task-nzh-002', name: 'Create data ingestion pipeline', status: 'done', effortHours: 16, assignee: 'Data Team', skills: ['ETL'] }
          ]},
          { id: 'story-nzh-002', name: 'Consumption Dashboard', description: 'As an Asset Manager, I need consumption dashboards so that I can identify issues.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-nzh-003', name: 'Build consumption charts', status: 'done', effortHours: 20, assignee: 'Frontend Team', skills: ['React', 'Charts'] },
            { id: 'task-nzh-004', name: 'Create alerting for anomalies', status: 'done', effortHours: 12, assignee: 'Backend Team', skills: ['Alerting'] }
          ]}
        ]
      },
      {
        id: 'feat-nzh-002',
        name: 'Carbon Pathway Planning',
        description: 'Net-zero pathway modeling with retrofit scenario analysis and investment planning.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 13,
        priority: 'high',
        storyConfigs: [
          { id: 'story-nzh-003', name: 'Carbon Baseline Calculator', description: 'As a Sustainability Lead, I need baseline calculations so that I can set targets.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-nzh-005', name: 'Build emission calculator', status: 'done', effortHours: 20, assignee: 'Sustainability Team', skills: ['Carbon Accounting'] },
            { id: 'task-nzh-006', name: 'Integrate with asset database', status: 'done', effortHours: 12, assignee: 'Backend Team', skills: ['Integration'] }
          ]},
          { id: 'story-nzh-004', name: 'Retrofit Scenario Modeling', description: 'As a Planner, I need retrofit scenarios so that I can prioritize investments.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-nzh-007', name: 'Build scenario engine', status: 'in-progress', effortHours: 32, assignee: 'Analytics Team', skills: ['Modeling'] },
            { id: 'task-nzh-008', name: 'Create cost-benefit analysis', status: 'pending', effortHours: 20, assignee: 'Finance Team', skills: ['Financial Modeling'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-nzh-001', name: 'Sustainability Lead', role: 'Product Owner', allocation: 80, team: 'Sustainability', skills: ['Carbon Accounting', 'ESG'], costRate: 800 },
      { id: 'res-nzh-002', name: 'IoT Team', role: 'Technical', allocation: 60, team: 'Technology', skills: ['IoT', 'Data'], costRate: 700 }
    ],
    riskConfigs: [
      { id: 'risk-nzh-001', name: 'Smart meter coverage gaps', probability: 'medium', impact: 'medium', status: 'active', mitigation: 'Manual data collection fallback; phased meter rollout', owner: 'IoT Team' },
      { id: 'risk-nzh-002', name: 'Retrofit cost estimates accuracy', probability: 'medium', impact: 'high', status: 'monitoring', mitigation: 'Contractor validation; regular estimate updates', owner: 'Finance' }
    ],
    dependencyConfigs: [
      { id: 'dep-nzh-001', name: 'Smart Meter Network', type: 'external', status: 'active', description: 'Smart meter connectivity' },
      { id: 'dep-nzh-002', name: 'Asset Management System', type: 'internal', status: 'resolved', description: 'Property data integration' }
    ],
    stakeholderConfigs: [
      { id: 'sh-nzh-001', name: 'Housing MD', role: 'Sponsor', department: 'Housing', influence: 'high', interest: 'high' },
      { id: 'sh-nzh-002', name: 'Sustainability Committee', role: 'Governance', department: 'Group', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgr-003',
    name: 'Pension Scheme Data Hub',
    bu: 'LGR',
    division: 'Institutional Retirement',
    description: 'Centralized data hub for pension scheme information with golden source governance, data quality monitoring, and self-service analytics.',
    expectedROI: '£15m data quality improvement + operational efficiency',
    roiValue: 15,
    priority: 'high',
    status: 'green',
    budget: { spent: 1.0, total: 2.0 },
    timeline: { elapsed: 6, total: 10, startDate: '2024-04-01', endDate: '2025-02-01' },
    artName: 'Data Platform ART',
    portfolioTheme: 'Data Excellence',
    strategicObjectives: ['SO-3: Operational Excellence', 'SO-6: Digital Transformation'],
    featureConfigs: [
      {
        id: 'feat-psd-001',
        name: 'Golden Source Data Layer',
        description: 'Authoritative data layer for scheme, member, and benefit data with lineage tracking.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-psd-001', name: 'Schema Design', description: 'As a Data Architect, I need a canonical schema so that data is consistent.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-psd-001', name: 'Design data model', status: 'done', effortHours: 40, assignee: 'Data Architect', skills: ['Data Modeling'] },
            { id: 'task-psd-002', name: 'Document schema', status: 'done', effortHours: 16, assignee: 'Data Architect', skills: ['Documentation'] }
          ]},
          { id: 'story-psd-002', name: 'Data Lineage', description: 'As Compliance, I need lineage so that I can trace data origins.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-psd-003', name: 'Implement lineage tracking', status: 'done', effortHours: 24, assignee: 'Data Team', skills: ['Data Lineage'] },
            { id: 'task-psd-004', name: 'Build lineage visualization', status: 'done', effortHours: 16, assignee: 'Frontend Team', skills: ['D3.js'] }
          ]},
          { id: 'story-psd-003', name: 'Data Migration', description: 'As Operations, I need data migrated so that I can use the new platform.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-psd-005', name: 'Build migration scripts', status: 'done', effortHours: 32, assignee: 'Data Team', skills: ['ETL', 'SQL'] },
            { id: 'task-psd-006', name: 'Validate migrated data', status: 'done', effortHours: 24, assignee: 'QA Team', skills: ['Data Testing'] }
          ]}
        ]
      },
      {
        id: 'feat-psd-002',
        name: 'Data Quality Framework',
        description: 'Automated data quality monitoring with dimension scoring, anomaly detection, and remediation workflows.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-psd-004', name: 'Quality Rules Engine', description: 'As a Data Steward, I need quality rules so that I can enforce standards.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-psd-007', name: 'Define 150+ quality rules', status: 'done', effortHours: 32, assignee: 'Data Governance', skills: ['Data Quality'] },
            { id: 'task-psd-008', name: 'Build rules execution engine', status: 'done', effortHours: 24, assignee: 'Backend Team', skills: ['Rules Engine'] }
          ]},
          { id: 'story-psd-005', name: 'Quality Dashboard', description: 'As a Manager, I need quality dashboards so that I can monitor health.', storyPoints: 13, status: 'in-progress', taskConfigs: [
            { id: 'task-psd-009', name: 'Build quality scorecards', status: 'in-progress', effortHours: 20, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-psd-010', name: 'Create trend analysis', status: 'pending', effortHours: 12, assignee: 'Analytics Team', skills: ['Analytics'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-psd-001', name: 'Data Architect', role: 'Technical Lead', allocation: 100, team: 'Data', skills: ['Data Modeling', 'Architecture'], costRate: 850 },
      { id: 'res-psd-002', name: 'Data Governance', role: 'Data Steward', allocation: 80, team: 'Governance', skills: ['Data Quality', 'Governance'], costRate: 700 }
    ],
    riskConfigs: [
      { id: 'risk-psd-001', name: 'Data migration complexity', probability: 'high', impact: 'medium', status: 'mitigated', mitigation: 'Phased migration; extensive testing; rollback capability', owner: 'Data Team' },
      { id: 'risk-psd-002', name: 'User adoption resistance', probability: 'medium', impact: 'medium', status: 'monitoring', mitigation: 'Change management program; training; super-user network', owner: 'Change Lead' }
    ],
    dependencyConfigs: [
      { id: 'dep-psd-001', name: 'Legacy Systems', type: 'internal', status: 'active', description: 'Data extraction from legacy' },
      { id: 'dep-psd-002', name: 'Cloud Infrastructure', type: 'internal', status: 'resolved', description: 'Snowflake data warehouse' }
    ],
    stakeholderConfigs: [
      { id: 'sh-psd-001', name: 'Chief Data Officer', role: 'Sponsor', department: 'Data', influence: 'high', interest: 'high' },
      { id: 'sh-psd-002', name: 'Operations Teams', role: 'Key Users', department: 'Operations', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgr-004',
    name: 'Protection Product Digitization',
    bu: 'LGR',
    division: 'Retail',
    description: 'End-to-end digitization of protection product portfolio (life, critical illness, income protection) with automated underwriting and straight-through processing.',
    expectedROI: '£25m new business growth + cost reduction',
    roiValue: 25,
    priority: 'high',
    status: 'green',
    budget: { spent: 1.4, total: 2.5 },
    timeline: { elapsed: 7, total: 12, startDate: '2024-03-01', endDate: '2025-03-01' },
    artName: 'Protection Products ART',
    portfolioTheme: 'Digital Excellence',
    strategicObjectives: ['SO-6: Digital Transformation', 'SO-1: Market Leadership'],
    featureConfigs: [
      {
        id: 'feat-ppd-001',
        name: 'Digital Application Journey',
        description: 'Mobile-first application journey for all protection products with progressive disclosure.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-ppd-001', name: 'Product Selector', description: 'As a Customer, I need product guidance so that I choose the right cover.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-ppd-001', name: 'Build needs analysis wizard', status: 'done', effortHours: 24, assignee: 'UX Team', skills: ['UX Design'] },
            { id: 'task-ppd-002', name: 'Implement recommendation engine', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['Rules Engine'] }
          ]},
          { id: 'story-ppd-002', name: 'Quote Engine', description: 'As a Customer, I need instant quotes so that I can see pricing.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-ppd-003', name: 'Build pricing API', status: 'done', effortHours: 32, assignee: 'Actuarial Dev', skills: ['Actuarial', 'APIs'] },
            { id: 'task-ppd-004', name: 'Create quote comparison UI', status: 'done', effortHours: 20, assignee: 'Frontend Team', skills: ['React'] }
          ]},
          { id: 'story-ppd-003', name: 'Application Form', description: 'As a Customer, I need a simple form so that I can apply quickly.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-ppd-005', name: 'Design progressive form flow', status: 'done', effortHours: 16, assignee: 'UX Team', skills: ['UX'] },
            { id: 'task-ppd-006', name: 'Build form with validation', status: 'done', effortHours: 32, assignee: 'Frontend Team', skills: ['React', 'Forms'] }
          ]}
        ]
      },
      {
        id: 'feat-ppd-002',
        name: 'Automated Underwriting',
        description: 'Rules-based automated underwriting with AI triage for complex cases.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-ppd-004', name: 'Rules-Based Decisions', description: 'As an Underwriter, I need auto-decisions so that I focus on complex cases.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-ppd-007', name: 'Implement underwriting rules', status: 'done', effortHours: 40, assignee: 'Underwriting Team', skills: ['Underwriting'] },
            { id: 'task-ppd-008', name: 'Build decision API', status: 'done', effortHours: 24, assignee: 'Backend Team', skills: ['APIs'] }
          ]},
          { id: 'story-ppd-005', name: 'AI Triage', description: 'As Ops Manager, I need AI triage so that cases route efficiently.', storyPoints: 13, status: 'in-progress', taskConfigs: [
            { id: 'task-ppd-009', name: 'Train triage ML model', status: 'in-progress', effortHours: 32, assignee: 'ML Team', skills: ['ML', 'Classification'] },
            { id: 'task-ppd-010', name: 'Integrate with workflow', status: 'pending', effortHours: 16, assignee: 'Backend Team', skills: ['Integration'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-ppd-001', name: 'Protection Product Owner', role: 'Product Owner', allocation: 100, team: 'Product', skills: ['Protection', 'Product Mgmt'], costRate: 800 },
      { id: 'res-ppd-002', name: 'UX Lead', role: 'Design Lead', allocation: 80, team: 'Design', skills: ['UX', 'Mobile'], costRate: 750 }
    ],
    riskConfigs: [
      { id: 'risk-ppd-001', name: 'Underwriting model accuracy', probability: 'medium', impact: 'high', status: 'active', mitigation: 'Extensive backtesting; human override capability', owner: 'Chief Underwriter' },
      { id: 'risk-ppd-002', name: 'Legacy integration complexity', probability: 'high', impact: 'medium', status: 'monitoring', mitigation: 'API layer; phased integration', owner: 'Tech Lead' }
    ],
    dependencyConfigs: [
      { id: 'dep-ppd-001', name: 'Policy Admin System', type: 'internal', status: 'active', description: 'Policy issuance integration' },
      { id: 'dep-ppd-002', name: 'Payment Gateway', type: 'external', status: 'resolved', description: 'Direct debit setup' }
    ],
    stakeholderConfigs: [
      { id: 'sh-ppd-001', name: 'Protection MD', role: 'Sponsor', department: 'Protection', influence: 'high', interest: 'high' },
      { id: 'sh-ppd-002', name: 'Underwriting Team', role: 'Key Users', department: 'Underwriting', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgc-005',
    name: 'Risk Appetite Dashboard Upgrade',
    bu: 'LGC',
    division: 'Group Risk',
    description: 'Enterprise risk appetite monitoring and reporting platform with real-time risk indicators, threshold alerts, and board-level reporting.',
    expectedROI: '£10m risk management efficiency',
    roiValue: 10,
    priority: 'high',
    status: 'green',
    budget: { spent: 0.7, total: 1.4 },
    timeline: { elapsed: 5, total: 8, startDate: '2024-05-01', endDate: '2025-01-01' },
    artName: 'Risk Technology ART',
    portfolioTheme: 'Risk Excellence',
    strategicObjectives: ['SO-5: Regulatory Excellence', 'SO-3: Operational Excellence'],
    featureConfigs: [
      {
        id: 'feat-rad-001',
        name: 'Risk Indicator Framework',
        description: 'Comprehensive framework of 150+ key risk indicators with automated data feeds.',
        status: 'done',
        storyPoints: 34,
        completedPoints: 34,
        priority: 'high',
        storyConfigs: [
          { id: 'story-rad-001', name: 'KRI Definition', description: 'As a Risk Manager, I need defined KRIs so that I can monitor risk appetite.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-rad-001', name: 'Define 150 KRIs', status: 'done', effortHours: 40, assignee: 'Risk Team', skills: ['Risk Management'] },
            { id: 'task-rad-002', name: 'Map data sources', status: 'done', effortHours: 24, assignee: 'Data Team', skills: ['Data Integration'] }
          ]},
          { id: 'story-rad-002', name: 'Automated Data Feeds', description: 'As Operations, I need automated feeds so that KRIs are current.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-rad-003', name: 'Build data pipelines', status: 'done', effortHours: 32, assignee: 'Data Team', skills: ['ETL'] },
            { id: 'task-rad-004', name: 'Implement refresh scheduling', status: 'done', effortHours: 12, assignee: 'Backend Team', skills: ['Scheduling'] }
          ]}
        ]
      },
      {
        id: 'feat-rad-002',
        name: 'Executive Risk Dashboard',
        description: 'Board-level risk dashboard with drill-down capability and trend analysis.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 13,
        priority: 'high',
        storyConfigs: [
          { id: 'story-rad-003', name: 'Executive Summary View', description: 'As the Board, I need a summary view so that I understand risk position.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-rad-005', name: 'Design executive dashboard', status: 'done', effortHours: 16, assignee: 'UX Team', skills: ['UX'] },
            { id: 'task-rad-006', name: 'Build summary components', status: 'done', effortHours: 20, assignee: 'Frontend Team', skills: ['React'] }
          ]},
          { id: 'story-rad-004', name: 'Drill-Down Analysis', description: 'As a CRO, I need drill-down so that I can investigate issues.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-rad-007', name: 'Build drill-down navigation', status: 'in-progress', effortHours: 24, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-rad-008', name: 'Create trend analysis', status: 'pending', effortHours: 16, assignee: 'Analytics Team', skills: ['Analytics'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-rad-001', name: 'CRO Office', role: 'Sponsor', allocation: 20, team: 'Risk', skills: ['Risk Management'], costRate: 1100 },
      { id: 'res-rad-002', name: 'Risk Analytics', role: 'Analysts', allocation: 100, team: 'Risk', skills: ['Risk Analytics', 'Reporting'], costRate: 750 }
    ],
    riskConfigs: [
      { id: 'risk-rad-001', name: 'Data quality issues', probability: 'medium', impact: 'high', status: 'active', mitigation: 'Data validation rules; source system quality programs', owner: 'Data Team' },
      { id: 'risk-rad-002', name: 'KRI threshold calibration', probability: 'medium', impact: 'medium', status: 'monitoring', mitigation: 'Regular threshold review; backtesting', owner: 'Risk Team' }
    ],
    dependencyConfigs: [
      { id: 'dep-rad-001', name: 'Source Risk Systems', type: 'internal', status: 'active', description: 'Data feeds from risk systems' },
      { id: 'dep-rad-002', name: 'Data Warehouse', type: 'internal', status: 'resolved', description: 'Central data repository' }
    ],
    stakeholderConfigs: [
      { id: 'sh-rad-001', name: 'Group CRO', role: 'Sponsor', department: 'Risk', influence: 'high', interest: 'high' },
      { id: 'sh-rad-002', name: 'Board Risk Committee', role: 'Governance', department: 'Board', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgc-006',
    name: 'Private Markets Platform Build',
    bu: 'LGC',
    division: 'Capital',
    description: 'Unified platform for private markets investments including deal origination, portfolio management, and investor reporting across real estate, infrastructure, and private credit.',
    expectedROI: '£30m AUM growth enablement',
    roiValue: 30,
    priority: 'high',
    status: 'amber',
    budget: { spent: 2.0, total: 3.8 },
    timeline: { elapsed: 8, total: 14, startDate: '2024-02-01', endDate: '2025-04-01' },
    artName: 'Private Markets ART',
    portfolioTheme: 'Market Leadership',
    strategicObjectives: ['SO-1: Market Leadership', 'SO-3: Operational Excellence'],
    featureConfigs: [
      {
        id: 'feat-pmp-001',
        name: 'Deal Origination Pipeline',
        description: 'End-to-end deal pipeline management from sourcing through due diligence to execution.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-pmp-001', name: 'Deal Pipeline CRM', description: 'As a Deal Lead, I need pipeline tracking so that I can manage opportunities.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-pmp-001', name: 'Design pipeline workflow', status: 'done', effortHours: 24, assignee: 'Business Analysts', skills: ['Process Design'] },
            { id: 'task-pmp-002', name: 'Build pipeline UI', status: 'done', effortHours: 32, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-pmp-003', name: 'Implement stage gates', status: 'done', effortHours: 16, assignee: 'Backend Team', skills: ['Workflow'] }
          ]},
          { id: 'story-pmp-002', name: 'Due Diligence Workflow', description: 'As an Analyst, I need DD workflows so that I can track requirements.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-pmp-004', name: 'Define DD checklists', status: 'done', effortHours: 20, assignee: 'Investment Team', skills: ['Due Diligence'] },
            { id: 'task-pmp-005', name: 'Build DD tracking system', status: 'done', effortHours: 28, assignee: 'Backend Team', skills: ['Workflow'] }
          ]},
          { id: 'story-pmp-003', name: 'Deal Documentation', description: 'As Legal, I need document management so that I can track deal docs.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-pmp-006', name: 'Build document repository', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['Document Mgmt'] },
            { id: 'task-pmp-007', name: 'Implement version control', status: 'done', effortHours: 12, assignee: 'Backend Team', skills: ['Version Control'] }
          ]}
        ]
      },
      {
        id: 'feat-pmp-002',
        name: 'Portfolio Management',
        description: 'Comprehensive portfolio analytics with asset-level tracking, valuations, and performance attribution.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 13,
        priority: 'high',
        storyConfigs: [
          { id: 'story-pmp-004', name: 'Asset Register', description: 'As a PM, I need an asset register so that I have a complete view.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-pmp-008', name: 'Design asset data model', status: 'done', effortHours: 20, assignee: 'Data Architect', skills: ['Data Modeling'] },
            { id: 'task-pmp-009', name: 'Build asset management UI', status: 'done', effortHours: 24, assignee: 'Frontend Team', skills: ['React'] }
          ]},
          { id: 'story-pmp-005', name: 'Valuation Engine', description: 'As Finance, I need valuations so that I can report NAV.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-pmp-010', name: 'Build valuation models', status: 'in-progress', effortHours: 40, assignee: 'Valuation Team', skills: ['Valuation', 'Finance'] },
            { id: 'task-pmp-011', name: 'Integrate external valuers', status: 'pending', effortHours: 20, assignee: 'Backend Team', skills: ['Integration'] }
          ]}
        ]
      },
      {
        id: 'feat-pmp-003',
        name: 'Investor Reporting',
        description: 'Automated investor reporting with customizable templates and investor portal.',
        status: 'planned',
        storyPoints: 21,
        completedPoints: 0,
        priority: 'high',
        storyConfigs: [
          { id: 'story-pmp-006', name: 'Report Templates', description: 'As IR, I need report templates so that I can produce investor packs.', storyPoints: 13, status: 'planned', taskConfigs: [
            { id: 'task-pmp-012', name: 'Design report templates', status: 'planned', effortHours: 24, assignee: 'IR Team', skills: ['Reporting'] },
            { id: 'task-pmp-013', name: 'Build report generation', status: 'planned', effortHours: 32, assignee: 'Backend Team', skills: ['Reporting'] }
          ]},
          { id: 'story-pmp-007', name: 'Investor Portal', description: 'As an Investor, I need a portal so that I can access my information.', storyPoints: 8, status: 'planned', taskConfigs: [
            { id: 'task-pmp-014', name: 'Build investor portal UI', status: 'planned', effortHours: 28, assignee: 'Frontend Team', skills: ['React', 'Portal'] },
            { id: 'task-pmp-015', name: 'Implement secure access', status: 'planned', effortHours: 16, assignee: 'Security Team', skills: ['Security'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-pmp-001', name: 'Private Markets COO', role: 'Sponsor', allocation: 30, team: 'Operations', skills: ['Operations', 'Private Markets'], costRate: 1000 },
      { id: 'res-pmp-002', name: 'Investment Ops', role: 'Operations', allocation: 100, team: 'Operations', skills: ['Investment Ops'], costRate: 750 }
    ],
    riskConfigs: [
      { id: 'risk-pmp-001', name: 'Data migration from spreadsheets', probability: 'high', impact: 'medium', status: 'active', mitigation: 'Phased migration; data validation; parallel running', owner: 'Data Team' },
      { id: 'risk-pmp-002', name: 'Asset class complexity', probability: 'medium', impact: 'high', status: 'active', mitigation: 'Asset class specific modules; flexible data model', owner: 'Tech Lead' }
    ],
    dependencyConfigs: [
      { id: 'dep-pmp-001', name: 'Fund Admin System', type: 'external', status: 'active', description: 'Integration with fund administrator' },
      { id: 'dep-pmp-002', name: 'Treasury System', type: 'internal', status: 'resolved', description: 'Cash flow integration' }
    ],
    stakeholderConfigs: [
      { id: 'sh-pmp-001', name: 'Private Markets MD', role: 'Sponsor', department: 'Capital', influence: 'high', interest: 'high' },
      { id: 'sh-pmp-002', name: 'Investor Relations', role: 'Key Users', department: 'IR', influence: 'medium', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgc-007',
    name: 'Build to Rent Operating Platform',
    bu: 'LGC',
    division: 'Housing',
    description: 'Integrated operating platform for Build-to-Rent portfolio including lettings, maintenance, tenant experience, and financial management.',
    expectedROI: '£8m operational efficiency + tenant retention',
    roiValue: 8,
    priority: 'medium',
    status: 'green',
    budget: { spent: 0.9, total: 1.8 },
    timeline: { elapsed: 6, total: 10, startDate: '2024-04-01', endDate: '2025-02-01' },
    artName: 'Living Spaces ART',
    portfolioTheme: 'Operational Excellence',
    strategicObjectives: ['SO-3: Operational Excellence', 'SO-4: Client Trust'],
    featureConfigs: [
      {
        id: 'feat-btr-001',
        name: 'Lettings Management',
        description: 'End-to-end lettings workflow from marketing to tenancy agreement.',
        status: 'done',
        storyPoints: 34,
        completedPoints: 34,
        priority: 'high',
        storyConfigs: [
          { id: 'story-btr-001', name: 'Property Listings', description: 'As Marketing, I need listings management so that I can attract tenants.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-btr-001', name: 'Build listings portal', status: 'done', effortHours: 24, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-btr-002', name: 'Integrate with Rightmove/Zoopla', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['APIs'] }
          ]},
          { id: 'story-btr-002', name: 'Application Processing', description: 'As Lettings, I need application processing so that I can vet tenants.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-btr-003', name: 'Build application workflow', status: 'done', effortHours: 28, assignee: 'Backend Team', skills: ['Workflow'] },
            { id: 'task-btr-004', name: 'Integrate referencing', status: 'done', effortHours: 16, assignee: 'Backend Team', skills: ['Integration'] }
          ]}
        ]
      },
      {
        id: 'feat-btr-002',
        name: 'Maintenance Management',
        description: 'Work order management with contractor scheduling and SLA tracking.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-btr-003', name: 'Work Order System', description: 'As a Tenant, I need to report issues so that they get fixed.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-btr-005', name: 'Build work order UI', status: 'done', effortHours: 24, assignee: 'Frontend Team', skills: ['React', 'Mobile'] },
            { id: 'task-btr-006', name: 'Implement contractor dispatch', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['Scheduling'] }
          ]},
          { id: 'story-btr-004', name: 'SLA Monitoring', description: 'As Ops Manager, I need SLA tracking so that I ensure service quality.', storyPoints: 13, status: 'in-progress', taskConfigs: [
            { id: 'task-btr-007', name: 'Build SLA dashboard', status: 'in-progress', effortHours: 16, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-btr-008', name: 'Create alerting system', status: 'pending', effortHours: 12, assignee: 'Backend Team', skills: ['Alerting'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-btr-001', name: 'BTR Operations Lead', role: 'Product Owner', allocation: 100, team: 'Operations', skills: ['Property Ops'], costRate: 750 },
      { id: 'res-btr-002', name: 'Property Tech Team', role: 'Development', allocation: 100, team: 'Technology', skills: ['PropTech'], costRate: 700 }
    ],
    riskConfigs: [
      { id: 'risk-btr-001', name: 'Contractor integration', probability: 'medium', impact: 'medium', status: 'active', mitigation: 'Standard API; contractor onboarding program', owner: 'Tech Lead' },
      { id: 'risk-btr-002', name: 'Tenant adoption', probability: 'low', impact: 'medium', status: 'monitoring', mitigation: 'User-friendly design; tenant onboarding', owner: 'UX Team' }
    ],
    dependencyConfigs: [
      { id: 'dep-btr-001', name: 'Property Management System', type: 'internal', status: 'resolved', description: 'Core property data' },
      { id: 'dep-btr-002', name: 'Payment Provider', type: 'external', status: 'resolved', description: 'Rent collection' }
    ],
    stakeholderConfigs: [
      { id: 'sh-btr-001', name: 'BTR MD', role: 'Sponsor', department: 'Housing', influence: 'high', interest: 'high' },
      { id: 'sh-btr-002', name: 'Site Teams', role: 'Key Users', department: 'Operations', influence: 'medium', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgc-008',
    name: 'Infrastructure Asset Management System',
    bu: 'LGC',
    division: 'Capital',
    description: 'Asset management platform for £5bn+ infrastructure portfolio covering energy, transport, and social infrastructure with lifecycle management.',
    expectedROI: '£18m portfolio performance improvement',
    roiValue: 18,
    priority: 'high',
    status: 'green',
    budget: { spent: 1.2, total: 2.2 },
    timeline: { elapsed: 7, total: 12, startDate: '2024-03-01', endDate: '2025-03-01' },
    artName: 'Infrastructure ART',
    portfolioTheme: 'Asset Excellence',
    strategicObjectives: ['SO-1: Market Leadership', 'SO-3: Operational Excellence'],
    featureConfigs: [
      {
        id: 'feat-iam-001',
        name: 'Asset Lifecycle Management',
        description: 'Comprehensive asset lifecycle tracking from acquisition through operation to disposal.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-iam-001', name: 'Asset Registry', description: 'As an Asset Manager, I need a complete registry so that I can manage the portfolio.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-iam-001', name: 'Design asset data model', status: 'done', effortHours: 32, assignee: 'Data Architect', skills: ['Data Modeling'] },
            { id: 'task-iam-002', name: 'Build asset management UI', status: 'done', effortHours: 28, assignee: 'Frontend Team', skills: ['React'] }
          ]},
          { id: 'story-iam-002', name: 'Performance Tracking', description: 'As an Investor, I need performance tracking so that I can assess returns.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-iam-003', name: 'Build performance dashboard', status: 'done', effortHours: 24, assignee: 'Frontend Team', skills: ['React', 'Charts'] },
            { id: 'task-iam-004', name: 'Implement IRR/MOIC calcs', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['Finance'] }
          ]},
          { id: 'story-iam-003', name: 'Valuation Integration', description: 'As Finance, I need valuation data so that I can report accurately.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-iam-005', name: 'Integrate external valuers', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['Integration'] },
            { id: 'task-iam-006', name: 'Build valuation workflow', status: 'done', effortHours: 16, assignee: 'Backend Team', skills: ['Workflow'] }
          ]}
        ]
      },
      {
        id: 'feat-iam-002',
        name: 'Operational Data Integration',
        description: 'Real-time operational data feeds from infrastructure assets for monitoring and optimization.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 13,
        priority: 'high',
        storyConfigs: [
          { id: 'story-iam-004', name: 'Energy Asset Data', description: 'As an Operator, I need energy production data so that I can optimize output.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-iam-007', name: 'Build SCADA integration', status: 'done', effortHours: 32, assignee: 'IoT Team', skills: ['SCADA', 'IoT'] },
            { id: 'task-iam-008', name: 'Create operational dashboard', status: 'done', effortHours: 20, assignee: 'Frontend Team', skills: ['React'] }
          ]},
          { id: 'story-iam-005', name: 'Transport Asset Data', description: 'As an Analyst, I need traffic data so that I can forecast revenues.', storyPoints: 21, status: 'in-progress', taskConfigs: [
            { id: 'task-iam-009', name: 'Integrate traffic systems', status: 'in-progress', effortHours: 28, assignee: 'Backend Team', skills: ['Integration'] },
            { id: 'task-iam-010', name: 'Build revenue forecasting', status: 'pending', effortHours: 24, assignee: 'Analytics Team', skills: ['Forecasting'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-iam-001', name: 'Infrastructure Asset Lead', role: 'Product Owner', allocation: 80, team: 'Infrastructure', skills: ['Infrastructure', 'Asset Mgmt'], costRate: 900 },
      { id: 'res-iam-002', name: 'IoT Team', role: 'Technical', allocation: 60, team: 'Technology', skills: ['IoT', 'SCADA'], costRate: 800 }
    ],
    riskConfigs: [
      { id: 'risk-iam-001', name: 'Legacy system data quality', probability: 'high', impact: 'medium', status: 'active', mitigation: 'Data cleansing; validation rules; source system improvements', owner: 'Data Team' },
      { id: 'risk-iam-002', name: 'Asset diversity complexity', probability: 'medium', impact: 'medium', status: 'monitoring', mitigation: 'Flexible data model; asset-class specific modules', owner: 'Tech Lead' }
    ],
    dependencyConfigs: [
      { id: 'dep-iam-001', name: 'Asset Operators', type: 'external', status: 'active', description: 'Operational data feeds' },
      { id: 'dep-iam-002', name: 'Fund Accounting', type: 'internal', status: 'resolved', description: 'Financial data integration' }
    ],
    stakeholderConfigs: [
      { id: 'sh-iam-001', name: 'Infrastructure MD', role: 'Sponsor', department: 'Capital', influence: 'high', interest: 'high' },
      { id: 'sh-iam-002', name: 'Asset Management Team', role: 'Key Users', department: 'Infrastructure', influence: 'high', interest: 'high' }
    ]
  },
  {
    id: 'pmo-lgr-005',
    name: 'Savings Investments Platform',
    bu: 'LGR',
    division: 'Retail',
    description: 'Digital platform for savings and investment products including ISAs, bonds, and drawdown with self-service capabilities.',
    expectedROI: '£20m new business + servicing efficiency',
    roiValue: 20,
    priority: 'high',
    status: 'green',
    budget: { spent: 1.3, total: 2.4 },
    timeline: { elapsed: 7, total: 11, startDate: '2024-03-01', endDate: '2025-02-01' },
    artName: 'Savings Platform ART',
    portfolioTheme: 'Digital Excellence',
    strategicObjectives: ['SO-6: Digital Transformation', 'SO-1: Market Leadership', 'SO-4: Client Trust'],
    featureConfigs: [
      {
        id: 'feat-sip-001',
        name: 'Digital Application Journey',
        description: 'Streamlined digital journey for ISA, bond, and investment product applications.',
        status: 'done',
        storyPoints: 55,
        completedPoints: 55,
        priority: 'critical',
        storyConfigs: [
          { id: 'story-sip-001', name: 'Product Selection', description: 'As a Customer, I need product guidance so that I choose appropriately.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-sip-001', name: 'Build product selector', status: 'done', effortHours: 24, assignee: 'UX Team', skills: ['UX Design'] },
            { id: 'task-sip-002', name: 'Implement suitability checks', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['Compliance'] }
          ]},
          { id: 'story-sip-002', name: 'Application Form', description: 'As a Customer, I need an easy form so that I can apply quickly.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-sip-003', name: 'Build progressive form', status: 'done', effortHours: 32, assignee: 'Frontend Team', skills: ['React', 'Forms'] },
            { id: 'task-sip-004', name: 'Implement ID verification', status: 'done', effortHours: 20, assignee: 'Backend Team', skills: ['KYC'] }
          ]},
          { id: 'story-sip-003', name: 'Payment Integration', description: 'As Operations, I need payment processing so that funds are collected.', storyPoints: 13, status: 'done', taskConfigs: [
            { id: 'task-sip-005', name: 'Integrate payment gateway', status: 'done', effortHours: 24, assignee: 'Backend Team', skills: ['Payments'] },
            { id: 'task-sip-006', name: 'Build reconciliation', status: 'done', effortHours: 16, assignee: 'Backend Team', skills: ['Finance'] }
          ]}
        ]
      },
      {
        id: 'feat-sip-002',
        name: 'Customer Self-Service Portal',
        description: 'Self-service portal for account management, valuations, and transactions.',
        status: 'in-progress',
        storyPoints: 34,
        completedPoints: 21,
        priority: 'high',
        storyConfigs: [
          { id: 'story-sip-004', name: 'Account Dashboard', description: 'As a Customer, I need a dashboard so that I can see my holdings.', storyPoints: 21, status: 'done', taskConfigs: [
            { id: 'task-sip-007', name: 'Build customer dashboard', status: 'done', effortHours: 28, assignee: 'Frontend Team', skills: ['React'] },
            { id: 'task-sip-008', name: 'Implement valuations', status: 'done', effortHours: 16, assignee: 'Backend Team', skills: ['Finance'] }
          ]},
          { id: 'story-sip-005', name: 'Transaction Capabilities', description: 'As a Customer, I need to make transactions so that I can manage my money.', storyPoints: 13, status: 'in-progress', taskConfigs: [
            { id: 'task-sip-009', name: 'Build top-up/withdrawal', status: 'in-progress', effortHours: 24, assignee: 'Backend Team', skills: ['Payments'] },
            { id: 'task-sip-010', name: 'Implement fund switches', status: 'pending', effortHours: 20, assignee: 'Backend Team', skills: ['Trading'] }
          ]}
        ]
      }
    ],
    teamMembers: [
      { id: 'res-sip-001', name: 'Savings Product Owner', role: 'Product Owner', allocation: 100, team: 'Product', skills: ['Savings', 'Product Mgmt'], costRate: 800 },
      { id: 'res-sip-002', name: 'Digital Team', role: 'Development', allocation: 100, team: 'Technology', skills: ['Digital', 'React'], costRate: 750 }
    ],
    riskConfigs: [
      { id: 'risk-sip-001', name: 'Regulatory approval delays', probability: 'medium', impact: 'high', status: 'monitoring', mitigation: 'Early regulator engagement; compliance reviews', owner: 'Compliance' },
      { id: 'risk-sip-002', name: 'Legacy platform integration', probability: 'high', impact: 'medium', status: 'active', mitigation: 'API layer; phased migration', owner: 'Tech Lead' }
    ],
    dependencyConfigs: [
      { id: 'dep-sip-001', name: 'Policy Admin System', type: 'internal', status: 'active', description: 'Product administration' },
      { id: 'dep-sip-002', name: 'Fund Platform', type: 'external', status: 'resolved', description: 'Fund pricing and dealing' }
    ],
    stakeholderConfigs: [
      { id: 'sh-sip-001', name: 'Savings MD', role: 'Sponsor', department: 'Retail', influence: 'high', interest: 'high' },
      { id: 'sh-sip-002', name: 'Customer Service', role: 'Key Users', department: 'Operations', influence: 'medium', interest: 'high' }
    ]
  }
];

async function generateAllTemplates() {
  const outputDir = path.join(__dirname, '..', 'attached_assets', 'project_templates');
  
  for (const config of remainingTemplates) {
    const template = generateTemplate(config);
    const filename = config.name.replace(/\s+/g, '_') + '.json';
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(template, null, 2));
    console.log(`Generated: ${filename}`);
  }
  
  console.log(`\nGenerated ${remainingTemplates.length} templates`);
}

generateAllTemplates();
