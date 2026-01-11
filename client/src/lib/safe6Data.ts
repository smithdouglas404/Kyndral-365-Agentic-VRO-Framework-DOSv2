// ============================================================
// COMPLETE SAFe 6.0 SAMPLE DATA
// Full portfolio with all hierarchy levels populated
// ============================================================

import type {
  SAFe6Portfolio,
  StrategicTheme,
  ValueStream,
  PortfolioEpic,
  PortfolioOKR,
  PortfolioKPI,
  AgileReleaseTrain,
  ProgramIncrement,
  Feature,
  Team,
  TeamMember,
  Iteration,
  Story,
  Task,
  Dependency,
  FinancialSnapshot,
  RiskRegisterEntry,
  OKRAlignment,
  ARTKPI
} from './safe6Model';

// ===================== STRATEGIC THEMES =====================

export const strategicThemes: StrategicTheme[] = [
  {
    id: 'theme-digital-transform',
    name: 'Digital Transformation',
    description: 'Modernize legacy systems and enable digital-first customer experiences across all business units',
    timeHorizon: '3-year',
    budgetAllocation: 35,
    status: 'active',
    linkedOKRs: ['okr-portfolio-digital']
  },
  {
    id: 'theme-operational-excellence',
    name: 'Operational Excellence',
    description: 'Streamline operations, reduce manual processes, and improve efficiency through automation',
    timeHorizon: '3-year',
    budgetAllocation: 25,
    status: 'active',
    linkedOKRs: ['okr-portfolio-ops']
  },
  {
    id: 'theme-regulatory-compliance',
    name: 'Regulatory & Risk Excellence',
    description: 'Ensure full compliance with evolving regulations while managing enterprise risk proactively',
    timeHorizon: '1-year',
    budgetAllocation: 20,
    status: 'active',
    linkedOKRs: ['okr-portfolio-compliance']
  },
  {
    id: 'theme-customer-growth',
    name: 'Customer Growth & Retention',
    description: 'Expand customer base and deepen relationships through innovative products and services',
    timeHorizon: '3-year',
    budgetAllocation: 20,
    status: 'active',
    linkedOKRs: ['okr-portfolio-growth']
  }
];

// ===================== VALUE STREAMS =====================

export const valueStreams: ValueStream[] = [
  {
    id: 'vs-retirement-solutions',
    name: 'Retirement Solutions',
    description: 'End-to-end pension and retirement product delivery from sales to servicing',
    type: 'operational',
    owner: 'Michelle Thompson',
    linkedARTs: ['art-retirement'],
    annualBudget: 25000000,
    kpis: ['kpi-ret-nps', 'kpi-ret-processing-time']
  },
  {
    id: 'vs-investment-management',
    name: 'Investment Management',
    description: 'Portfolio management, trading, and client reporting for institutional and retail investors',
    type: 'operational',
    owner: 'Robert Chen',
    linkedARTs: ['art-investments'],
    annualBudget: 35000000,
    kpis: ['kpi-inv-aum', 'kpi-inv-performance']
  },
  {
    id: 'vs-digital-platforms',
    name: 'Digital Platforms',
    description: 'Shared digital infrastructure, APIs, and customer-facing applications',
    type: 'development',
    owner: 'Sarah Williams',
    linkedARTs: ['art-digital'],
    annualBudget: 20000000,
    kpis: ['kpi-dig-uptime', 'kpi-dig-adoption']
  },
  {
    id: 'vs-risk-compliance',
    name: 'Risk & Compliance',
    description: 'Enterprise risk management, regulatory reporting, and compliance monitoring',
    type: 'operational',
    owner: 'James Mitchell',
    linkedARTs: ['art-risk'],
    annualBudget: 15000000,
    kpis: ['kpi-risk-incidents', 'kpi-risk-reporting']
  }
];

// ===================== PORTFOLIO OKRs =====================

export const portfolioOKRs: PortfolioOKR[] = [
  {
    id: 'okr-portfolio-digital',
    level: 'portfolio',
    objective: 'Become the most digitally advanced retirement provider in the UK',
    owner: 'CTO - David Harrison',
    quarter: '2025-Q4',
    status: 'on-track',
    keyResults: [
      { id: 'kr-dig-1', description: 'Achieve 80% digital adoption rate for customer transactions', targetValue: 80, currentValue: 62, unit: '%', confidence: 75, status: 'on-track' },
      { id: 'kr-dig-2', description: 'Reduce average transaction processing time by 60%', targetValue: 60, currentValue: 45, unit: '%', confidence: 80, status: 'on-track' },
      { id: 'kr-dig-3', description: 'Launch 5 new digital-first products', targetValue: 5, currentValue: 3, unit: 'products', confidence: 85, status: 'on-track' }
    ],
    linkedEpics: ['epic-prt-platform', 'epic-digital-portal'],
    linkedKPIs: ['kpi-dig-adoption', 'kpi-dig-uptime']
  },
  {
    id: 'okr-portfolio-ops',
    level: 'portfolio',
    objective: 'Reduce operational costs by 25% through automation',
    owner: 'COO - Jennifer Adams',
    quarter: '2025-Q4',
    status: 'at-risk',
    keyResults: [
      { id: 'kr-ops-1', description: 'Automate 70% of manual back-office processes', targetValue: 70, currentValue: 48, unit: '%', confidence: 60, status: 'at-risk' },
      { id: 'kr-ops-2', description: 'Reduce FTE requirements by 15% through automation', targetValue: 15, currentValue: 8, unit: '%', confidence: 55, status: 'at-risk' },
      { id: 'kr-ops-3', description: 'Achieve £5M annual cost savings', targetValue: 5000000, currentValue: 2800000, unit: '£', confidence: 65, status: 'at-risk' }
    ],
    linkedEpics: ['epic-bulk-automation', 'epic-reporting-automation'],
    linkedKPIs: ['kpi-ret-processing-time']
  }
];

// ===================== PORTFOLIO KPIs =====================

export const portfolioKPIs: PortfolioKPI[] = [
  {
    id: 'kpi-dig-adoption',
    name: 'Digital Adoption Rate',
    description: 'Percentage of customer transactions completed digitally',
    category: 'customer',
    targetValue: 80,
    currentValue: 62,
    previousValue: 55,
    unit: '%',
    trend: 'up',
    frequency: 'monthly',
    linkedValueStreams: ['vs-digital-platforms'],
    observations: [
      { id: 'obs-1', kpiId: 'kpi-dig-adoption', timestamp: '2025-01-01', value: 55 },
      { id: 'obs-2', kpiId: 'kpi-dig-adoption', timestamp: '2025-02-01', value: 58 },
      { id: 'obs-3', kpiId: 'kpi-dig-adoption', timestamp: '2025-03-01', value: 62 }
    ]
  },
  {
    id: 'kpi-ret-processing-time',
    name: 'Pension Processing Time',
    description: 'Average days to process a pension transfer request',
    category: 'operational',
    targetValue: 5,
    currentValue: 12,
    previousValue: 15,
    unit: 'days',
    trend: 'down',
    frequency: 'weekly',
    linkedValueStreams: ['vs-retirement-solutions'],
    observations: []
  },
  {
    id: 'kpi-inv-aum',
    name: 'Assets Under Management',
    description: 'Total assets under management across all funds',
    category: 'financial',
    targetValue: 1500000000000,
    currentValue: 1350000000000,
    previousValue: 1280000000000,
    unit: '£',
    trend: 'up',
    frequency: 'daily',
    linkedValueStreams: ['vs-investment-management'],
    observations: []
  }
];

// ===================== PORTFOLIO EPICS =====================

export const portfolioEpics: PortfolioEpic[] = [
  {
    id: 'epic-prt-platform',
    name: 'PRT Platform Modernization',
    description: 'Complete modernization of the Pension Risk Transfer platform to support £10bn+ annual volume',
    epicHypothesis: 'By modernizing the PRT platform with API-first architecture and real-time pricing, we will reduce quote turnaround from 5 days to 4 hours and improve win rate by 15%',
    businessOutcome: 'Increase annual PRT volume by £2B and improve profit margins by 3%',
    leadingIndicators: ['Quote turnaround time', 'Win rate percentage', 'Customer satisfaction score'],
    mvp: 'Basic pricing API with single-life calculations and manual workflow integration',
    status: 'implementing',
    owner: 'Sarah Mitchell - RTE',
    strategicThemeId: 'theme-digital-transform',
    valueStreamId: 'vs-retirement-solutions',
    wsjfScore: 28,
    estimatedCost: 8500000,
    actualCost: 4200000,
    targetStartDate: '2025-01-15',
    targetEndDate: '2026-06-30',
    actualStartDate: '2025-01-20',
    linkedCapabilities: [],
    linkedFeatures: ['feat-prt-pricing', 'feat-prt-underwriting', 'feat-prt-integration'],
    linkedOKRs: ['okr-portfolio-digital']
  },
  {
    id: 'epic-trading-platform',
    name: 'Next-Gen Trading Platform',
    description: 'New multi-asset trading platform with real-time risk analytics and automated execution',
    epicHypothesis: 'A modern trading platform will reduce trading costs by 20% and enable new asset class expansion',
    businessOutcome: 'Reduce annual trading costs by £15M and enable £5B new AUM in alternatives',
    leadingIndicators: ['Trade execution time', 'Trading cost per transaction', 'System uptime'],
    mvp: 'Core equities trading with basic risk monitoring',
    status: 'implementing',
    owner: 'Robert Chen - PM',
    strategicThemeId: 'theme-digital-transform',
    valueStreamId: 'vs-investment-management',
    wsjfScore: 25,
    estimatedCost: 15000000,
    actualCost: 9500000,
    targetStartDate: '2024-09-01',
    targetEndDate: '2026-03-31',
    actualStartDate: '2024-09-15',
    linkedCapabilities: [],
    linkedFeatures: ['feat-trading-core', 'feat-trading-risk', 'feat-trading-fi'],
    linkedOKRs: ['okr-portfolio-digital']
  },
  {
    id: 'epic-data-foundation',
    name: 'Enterprise Data Foundation',
    description: 'Unified data platform providing single source of truth for all enterprise data',
    epicHypothesis: 'A unified data foundation will enable real-time analytics and reduce data reconciliation effort by 80%',
    businessOutcome: 'Enable data-driven decision making and reduce data management costs by £3M annually',
    leadingIndicators: ['Data quality score', 'Query response time', 'Data source coverage'],
    mvp: 'Core data lake with customer and transaction data domains',
    status: 'implementing',
    owner: 'James Wilson - Architect',
    strategicThemeId: 'theme-operational-excellence',
    valueStreamId: 'vs-digital-platforms',
    wsjfScore: 30,
    estimatedCost: 12000000,
    actualCost: 8500000,
    targetStartDate: '2024-06-01',
    targetEndDate: '2025-12-31',
    actualStartDate: '2024-06-15',
    linkedCapabilities: [],
    linkedFeatures: ['feat-data-lake', 'feat-data-quality', 'feat-data-api'],
    linkedOKRs: ['okr-portfolio-ops']
  }
];

// ===================== AGILE RELEASE TRAINS =====================

export const arts: AgileReleaseTrain[] = [
  {
    id: 'art-retirement',
    name: 'Retirement Solutions ART',
    description: 'Agile Release Train for all retirement and pension products',
    valueStreamId: 'vs-retirement-solutions',
    releaseTrainEngineer: 'Sarah Mitchell',
    productManager: 'Emily Davis',
    systemArchitect: 'James Chen',
    teams: ['team-actuarial', 'team-platform', 'team-underwriting'],
    piCadenceWeeks: 10,
    sprintCadenceWeeks: 2,
    currentPI: 'pi-ret-2025-q1',
    programBacklog: ['feat-prt-pricing', 'feat-prt-underwriting', 'feat-prt-integration'],
    kpis: [
      { id: 'kpi-art-ret-velocity', artId: 'art-retirement', name: 'Team Velocity', category: 'flow', targetValue: 150, currentValue: 142, unit: 'points/PI', trend: 'up' },
      { id: 'kpi-art-ret-predict', artId: 'art-retirement', name: 'PI Predictability', category: 'predictability', targetValue: 85, currentValue: 78, unit: '%', trend: 'stable' }
    ]
  },
  {
    id: 'art-investments',
    name: 'Investment Management ART',
    description: 'Agile Release Train for trading and investment management capabilities',
    valueStreamId: 'vs-investment-management',
    releaseTrainEngineer: 'Robert Chen',
    productManager: 'Amanda Foster',
    systemArchitect: 'Michael Brown',
    teams: ['team-trading', 'team-risk-engine', 'team-reporting'],
    piCadenceWeeks: 10,
    sprintCadenceWeeks: 2,
    currentPI: 'pi-inv-2025-q1',
    programBacklog: ['feat-trading-core', 'feat-trading-risk', 'feat-trading-fi'],
    kpis: [
      { id: 'kpi-art-inv-velocity', artId: 'art-investments', name: 'Team Velocity', category: 'flow', targetValue: 180, currentValue: 165, unit: 'points/PI', trend: 'up' },
      { id: 'kpi-art-inv-quality', artId: 'art-investments', name: 'Defect Escape Rate', category: 'quality', targetValue: 2, currentValue: 3.5, unit: '%', trend: 'down' }
    ]
  },
  {
    id: 'art-digital',
    name: 'Digital Platforms ART',
    description: 'Shared platform services, APIs, and digital infrastructure',
    valueStreamId: 'vs-digital-platforms',
    releaseTrainEngineer: 'Lisa Anderson',
    productManager: 'Tom Harris',
    systemArchitect: 'David Wilson',
    teams: ['team-api', 'team-cloud', 'team-data'],
    piCadenceWeeks: 10,
    sprintCadenceWeeks: 2,
    currentPI: 'pi-dig-2025-q1',
    programBacklog: ['feat-data-lake', 'feat-api-gateway', 'feat-cloud-migration'],
    kpis: []
  }
];

// ===================== PROGRAM INCREMENTS =====================

export const programIncrements: ProgramIncrement[] = [
  {
    id: 'pi-ret-2025-q1',
    artId: 'art-retirement',
    name: 'PI 2025-Q1 (Retirement)',
    number: 1,
    startDate: '2025-01-06',
    endDate: '2025-03-14',
    ipSprintStart: '2025-03-03',
    ipSprintEnd: '2025-03-14',
    status: 'executing',
    piObjectives: [
      { id: 'pio-ret-1', piId: 'pi-ret-2025-q1', description: 'Complete bulk pricing API for 50K+ lives', businessValue: 9, isCommitted: true, status: 'pending' },
      { id: 'pio-ret-2', piId: 'pi-ret-2025-q1', description: 'Integrate mortality tables from CMI', businessValue: 8, isCommitted: true, status: 'achieved' },
      { id: 'pio-ret-3', piId: 'pi-ret-2025-q1', teamId: 'team-actuarial', description: 'Build longevity scenario engine', businessValue: 7, isCommitted: false, status: 'pending' }
    ],
    iterations: [],
    features: ['feat-prt-pricing'],
    predictability: 78,
    velocity: 142
  },
  {
    id: 'pi-inv-2025-q1',
    artId: 'art-investments',
    name: 'PI 2025-Q1 (Investments)',
    number: 1,
    startDate: '2025-01-06',
    endDate: '2025-03-14',
    ipSprintStart: '2025-03-03',
    ipSprintEnd: '2025-03-14',
    status: 'executing',
    piObjectives: [
      { id: 'pio-inv-1', piId: 'pi-inv-2025-q1', description: 'Launch equities trading module', businessValue: 10, isCommitted: true, status: 'pending' },
      { id: 'pio-inv-2', piId: 'pi-inv-2025-q1', description: 'Real-time risk dashboard MVP', businessValue: 8, isCommitted: true, status: 'pending' }
    ],
    iterations: [],
    features: ['feat-trading-core', 'feat-trading-risk'],
    predictability: 72,
    velocity: 165
  }
];

// ===================== TEAMS =====================

export const teams: Team[] = [
  {
    id: 'team-actuarial',
    artId: 'art-retirement',
    name: 'Actuarial Engineering',
    type: 'stream-aligned',
    scrumMaster: 'Mark Thompson',
    productOwner: 'Rachel Green',
    members: [],
    capacity: 48,
    currentIteration: 'iter-act-2025-q1-3',
    velocity: 45
  },
  {
    id: 'team-platform',
    artId: 'art-retirement',
    name: 'Platform API Team',
    type: 'platform',
    scrumMaster: 'Chris Johnson',
    productOwner: 'Emily Davis',
    members: [],
    capacity: 56,
    currentIteration: 'iter-plat-2025-q1-3',
    velocity: 52
  },
  {
    id: 'team-trading',
    artId: 'art-investments',
    name: 'Core Trading Team',
    type: 'stream-aligned',
    scrumMaster: 'Patricia Lee',
    productOwner: 'Amanda Foster',
    members: [],
    capacity: 64,
    currentIteration: 'iter-trad-2025-q1-3',
    velocity: 58
  },
  {
    id: 'team-data',
    artId: 'art-digital',
    name: 'Data Platform Team',
    type: 'platform',
    scrumMaster: 'Andrew Miller',
    productOwner: 'Tom Harris',
    members: [],
    capacity: 52,
    currentIteration: 'iter-data-2025-q1-3',
    velocity: 48
  }
];

// ===================== TEAM MEMBERS =====================

export const teamMembers: TeamMember[] = [
  // Actuarial Engineering Team
  { id: 'tm-001', teamId: 'team-actuarial', name: 'James Chen', role: 'Architect', allocation: 80, dailyCostRate: 950, skills: ['Actuarial Models', 'Python', 'SQL'], availability: 90 },
  { id: 'tm-002', teamId: 'team-actuarial', name: 'Sarah Williams', role: 'Developer', allocation: 100, dailyCostRate: 700, skills: ['Python', 'Data Science', 'SQL'], availability: 85 },
  { id: 'tm-003', teamId: 'team-actuarial', name: 'Michael Brown', role: 'QA', allocation: 50, dailyCostRate: 550, skills: ['Testing', 'Automation', 'Python'], availability: 100 },
  
  // Platform API Team
  { id: 'tm-004', teamId: 'team-platform', name: 'Emily Davis', role: 'PO', allocation: 100, dailyCostRate: 750, skills: ['Product Management', 'APIs'], availability: 95 },
  { id: 'tm-005', teamId: 'team-platform', name: 'David Wilson', role: 'Developer', allocation: 100, dailyCostRate: 650, skills: ['Node.js', 'AWS', 'APIs'], availability: 100 },
  { id: 'tm-006', teamId: 'team-platform', name: 'Lisa Anderson', role: 'Developer', allocation: 100, dailyCostRate: 600, skills: ['TypeScript', 'React', 'AWS'], availability: 90 },
  { id: 'tm-007', teamId: 'team-platform', name: 'Tom Harris', role: 'Developer', allocation: 100, dailyCostRate: 580, skills: ['Java', 'Spring', 'Microservices'], availability: 100 },
  
  // Trading Team
  { id: 'tm-008', teamId: 'team-trading', name: 'Robert Chen', role: 'PM', allocation: 100, dailyCostRate: 850, skills: ['Trading Systems', 'FIX Protocol'], availability: 85 },
  { id: 'tm-009', teamId: 'team-trading', name: 'Amanda Foster', role: 'Developer', allocation: 100, dailyCostRate: 750, skills: ['C++', 'Low Latency', 'Trading'], availability: 100 },
  { id: 'tm-010', teamId: 'team-trading', name: 'Kevin Zhang', role: 'Developer', allocation: 100, dailyCostRate: 720, skills: ['Python', 'Risk Models', 'FIX'], availability: 95 },
  
  // Data Platform Team
  { id: 'tm-011', teamId: 'team-data', name: 'Jennifer Adams', role: 'Architect', allocation: 100, dailyCostRate: 900, skills: ['Data Architecture', 'Snowflake', 'DBT'], availability: 80 },
  { id: 'tm-012', teamId: 'team-data', name: 'Christopher Lee', role: 'Developer', allocation: 100, dailyCostRate: 680, skills: ['Python', 'Spark', 'Airflow'], availability: 100 },
  { id: 'tm-013', teamId: 'team-data', name: 'Michelle Wong', role: 'Developer', allocation: 100, dailyCostRate: 620, skills: ['SQL', 'DBT', 'Looker'], availability: 90 }
];

// ===================== ITERATIONS (Sprints) =====================

export const iterations: Iteration[] = [
  // Actuarial Team Sprints
  {
    id: 'iter-act-2025-q1-1',
    piId: 'pi-ret-2025-q1',
    teamId: 'team-actuarial',
    name: 'Sprint 2025-Q1-1',
    number: 1,
    startDate: '2025-01-06',
    endDate: '2025-01-17',
    status: 'completed',
    plannedCapacity: 48,
    committedPoints: 45,
    completedPoints: 42,
    stories: ['story-prt-001'],
    goals: ['Complete CMI mortality table integration'],
    retrospectiveNotes: 'Good velocity, need more testing time'
  },
  {
    id: 'iter-act-2025-q1-2',
    piId: 'pi-ret-2025-q1',
    teamId: 'team-actuarial',
    name: 'Sprint 2025-Q1-2',
    number: 2,
    startDate: '2025-01-20',
    endDate: '2025-01-31',
    status: 'completed',
    plannedCapacity: 48,
    committedPoints: 50,
    completedPoints: 48,
    stories: ['story-prt-002'],
    goals: ['Bulk pricing API endpoint'],
    retrospectiveNotes: 'Strong delivery, dependency on data team resolved'
  },
  {
    id: 'iter-act-2025-q1-3',
    piId: 'pi-ret-2025-q1',
    teamId: 'team-actuarial',
    name: 'Sprint 2025-Q1-3',
    number: 3,
    startDate: '2025-02-03',
    endDate: '2025-02-14',
    status: 'active',
    plannedCapacity: 48,
    committedPoints: 52,
    completedPoints: 28,
    stories: ['story-prt-003'],
    goals: ['Longevity scenario modeling'],
    retrospectiveNotes: undefined
  },
  // Platform Team Sprints
  {
    id: 'iter-plat-2025-q1-3',
    piId: 'pi-ret-2025-q1',
    teamId: 'team-platform',
    name: 'Sprint 2025-Q1-3',
    number: 3,
    startDate: '2025-02-03',
    endDate: '2025-02-14',
    status: 'active',
    plannedCapacity: 56,
    committedPoints: 55,
    completedPoints: 32,
    stories: ['story-api-001', 'story-api-002'],
    goals: ['API gateway integration', 'Auth service migration'],
    retrospectiveNotes: undefined
  }
];

// ===================== FEATURES =====================

export const features: Feature[] = [
  {
    id: 'feat-prt-pricing',
    artId: 'art-retirement',
    epicId: 'epic-prt-platform',
    title: 'Real-Time Pricing Engine',
    description: 'Sub-second pricing calculations for bulk annuity quotes using actuarial models',
    benefitHypothesis: 'Reduce quote turnaround from 5 days to 4 hours, improving win rate by 15%',
    acceptanceCriteria: ['Price 10,000 lives in <30 seconds', 'Support longevity hedging scenarios', 'Audit trail for all calculations'],
    wsjfScore: 28,
    status: 'implementing',
    targetPI: 'pi-ret-2025-q1',
    owner: 'Emily Davis',
    stories: ['story-prt-001', 'story-prt-002', 'story-prt-003'],
    dependencies: [
      {
        id: 'dep-feat-1',
        sourceFeatureId: 'feat-prt-pricing',
        targetFeatureId: 'feat-data-lake',
        type: 'data-dependency',
        health: 'yellow',
        description: 'Requires unified customer data from Data Lake',
        impactIfDelayed: 'Cannot consolidate member data for pricing',
        financialImpact: 2500000,
        scheduleImpactDays: 45
      }
    ],
    estimatedStoryPoints: 89,
    actualStoryPoints: 64,
    estimatedCost: 850000,
    actualCost: 520000,
    plannedStart: '2025-01-06',
    plannedEnd: '2025-03-14',
    actualStart: '2025-01-08',
    linkedOKRs: ['okr-portfolio-digital']
  },
  {
    id: 'feat-data-lake',
    artId: 'art-digital',
    epicId: 'epic-data-foundation',
    title: 'Enterprise Data Lake',
    description: 'Centralized data lake for all enterprise data with real-time ingestion',
    benefitHypothesis: 'Single source of truth will reduce data reconciliation effort by 80%',
    acceptanceCriteria: ['Ingest from 15 source systems', 'Sub-minute data freshness', 'Data quality >99%'],
    wsjfScore: 30,
    status: 'implementing',
    targetPI: 'pi-dig-2025-q1',
    owner: 'Jennifer Adams',
    stories: ['story-data-001', 'story-data-002'],
    dependencies: [],
    estimatedStoryPoints: 120,
    actualStoryPoints: 85,
    estimatedCost: 1200000,
    actualCost: 920000,
    plannedStart: '2024-09-01',
    plannedEnd: '2025-02-28',
    actualStart: '2024-09-15',
    linkedOKRs: ['okr-portfolio-ops']
  },
  {
    id: 'feat-trading-core',
    artId: 'art-investments',
    epicId: 'epic-trading-platform',
    title: 'Core Trading Engine',
    description: 'Low-latency order execution engine for equities and fixed income',
    benefitHypothesis: 'Sub-millisecond execution will reduce slippage costs by 40%',
    acceptanceCriteria: ['<1ms order execution', 'Support 10K orders/second', 'FIX 4.4 compliant'],
    wsjfScore: 25,
    status: 'implementing',
    targetPI: 'pi-inv-2025-q1',
    owner: 'Amanda Foster',
    stories: ['story-trade-001', 'story-trade-002'],
    dependencies: [
      {
        id: 'dep-feat-2',
        sourceFeatureId: 'feat-trading-core',
        targetFeatureId: 'feat-data-lake',
        type: 'data-dependency',
        health: 'red',
        description: 'Requires market data from Data Lake',
        impactIfDelayed: 'No real-time market data for trading decisions',
        financialImpact: 5000000,
        scheduleImpactDays: 60
      }
    ],
    estimatedStoryPoints: 150,
    actualStoryPoints: 95,
    estimatedCost: 2000000,
    actualCost: 1350000,
    plannedStart: '2024-11-01',
    plannedEnd: '2025-03-31',
    actualStart: '2024-11-15',
    linkedOKRs: ['okr-portfolio-digital']
  }
];

// ===================== STORIES =====================

export const stories: Story[] = [
  {
    id: 'story-prt-001',
    featureId: 'feat-prt-pricing',
    iterationId: 'iter-act-2025-q1-1',
    teamId: 'team-actuarial',
    title: 'Mortality table integration',
    description: 'Integrate CMI mortality projections with pricing model',
    userStory: 'As an actuary, I want to use the latest CMI mortality tables so that pricing reflects current longevity expectations',
    acceptanceCriteria: ['Load 2024 CMI tables', 'Apply improvement factors', 'Validate against legacy system'],
    storyPoints: 8,
    status: 'done',
    priority: 'high',
    owner: 'James Chen',
    tasks: ['task-001', 'task-002', 'task-003'],
    dependencies: [],
    plannedStart: '2025-01-06',
    plannedEnd: '2025-01-15',
    actualStart: '2025-01-06',
    actualEnd: '2025-01-14',
    blockers: []
  },
  {
    id: 'story-prt-002',
    featureId: 'feat-prt-pricing',
    iterationId: 'iter-act-2025-q1-2',
    teamId: 'team-platform',
    title: 'Bulk pricing API endpoint',
    description: 'REST API to accept member data CSV and return pricing',
    userStory: 'As an external consultant, I want to upload member data and receive bulk pricing so that I can quickly quote schemes',
    acceptanceCriteria: ['Handle 50,000 row CSV', 'Return JSON with member-level prices', 'Async processing for large files'],
    storyPoints: 13,
    status: 'in-progress',
    priority: 'critical',
    owner: 'Lisa Anderson',
    tasks: ['task-004', 'task-005', 'task-006', 'task-007'],
    dependencies: [{ id: 'dep-story-1', sourceStoryId: 'story-prt-002', targetStoryId: 'story-prt-001', type: 'blocked-by', description: 'Needs mortality tables' }],
    plannedStart: '2025-01-20',
    plannedEnd: '2025-02-07',
    actualStart: '2025-01-22',
    blockers: ['Waiting for data lake schema finalization']
  },
  {
    id: 'story-prt-003',
    featureId: 'feat-prt-pricing',
    iterationId: 'iter-act-2025-q1-3',
    teamId: 'team-actuarial',
    title: 'Longevity scenario modeling',
    description: 'Run multiple mortality improvement scenarios for risk analysis',
    userStory: 'As a risk manager, I want to see pricing under different longevity scenarios so that I can assess downside risk',
    acceptanceCriteria: ['Support 5 standard scenarios', 'Calculate confidence intervals', 'Export to Excel for trustees'],
    storyPoints: 8,
    status: 'in-progress',
    priority: 'high',
    owner: 'Sarah Williams',
    tasks: ['task-008', 'task-009'],
    dependencies: [],
    plannedStart: '2025-02-03',
    plannedEnd: '2025-02-12',
    actualStart: '2025-02-05',
    blockers: []
  }
];

// ===================== TASKS =====================

export const tasks: Task[] = [
  // Story PRT-001 Tasks
  {
    id: 'task-001',
    storyId: 'story-prt-001',
    title: 'Parse CMI XML format',
    description: 'Extract mortality rates from CMI data files',
    type: 'development',
    status: 'done',
    assigneeId: 'tm-001',
    estimatedHours: 8,
    actualHours: 6,
    remainingHours: 0,
    priority: 'high',
    plannedStart: '2025-01-06',
    plannedEnd: '2025-01-07',
    actualStart: '2025-01-06',
    actualEnd: '2025-01-07',
    blockedBy: [],
    dailyRate: 950
  },
  {
    id: 'task-002',
    storyId: 'story-prt-001',
    title: 'Build rate interpolation',
    description: 'Interpolate rates for non-standard ages',
    type: 'development',
    status: 'done',
    assigneeId: 'tm-002',
    estimatedHours: 12,
    actualHours: 14,
    remainingHours: 0,
    priority: 'high',
    plannedStart: '2025-01-08',
    plannedEnd: '2025-01-10',
    actualStart: '2025-01-08',
    actualEnd: '2025-01-13',
    blockedBy: ['task-001'],
    dailyRate: 700
  },
  {
    id: 'task-003',
    storyId: 'story-prt-001',
    title: 'Validation test suite',
    description: 'Compare outputs against Excel model',
    type: 'testing',
    status: 'done',
    assigneeId: 'tm-003',
    estimatedHours: 6,
    actualHours: 8,
    remainingHours: 0,
    priority: 'medium',
    plannedStart: '2025-01-10',
    plannedEnd: '2025-01-13',
    actualStart: '2025-01-13',
    actualEnd: '2025-01-14',
    blockedBy: ['task-002'],
    dailyRate: 550
  },
  // Story PRT-002 Tasks
  {
    id: 'task-004',
    storyId: 'story-prt-002',
    title: 'Design API schema',
    description: 'OpenAPI spec for pricing endpoint',
    type: 'design',
    status: 'done',
    assigneeId: 'tm-004',
    estimatedHours: 4,
    actualHours: 4,
    remainingHours: 0,
    priority: 'high',
    plannedStart: '2025-01-20',
    plannedEnd: '2025-01-20',
    actualStart: '2025-01-20',
    actualEnd: '2025-01-20',
    blockedBy: [],
    dailyRate: 750
  },
  {
    id: 'task-005',
    storyId: 'story-prt-002',
    title: 'Implement file upload',
    description: 'S3 integration for CSV storage',
    type: 'development',
    status: 'done',
    assigneeId: 'tm-005',
    estimatedHours: 8,
    actualHours: 10,
    remainingHours: 0,
    priority: 'high',
    plannedStart: '2025-01-21',
    plannedEnd: '2025-01-23',
    actualStart: '2025-01-22',
    actualEnd: '2025-01-27',
    blockedBy: ['task-004'],
    dailyRate: 650
  },
  {
    id: 'task-006',
    storyId: 'story-prt-002',
    title: 'Build async queue',
    description: 'SQS-based job queue for large files',
    type: 'development',
    status: 'in-progress',
    assigneeId: 'tm-006',
    estimatedHours: 16,
    actualHours: 12,
    remainingHours: 6,
    priority: 'high',
    plannedStart: '2025-01-24',
    plannedEnd: '2025-01-31',
    actualStart: '2025-01-28',
    blockedBy: ['task-005'],
    dailyRate: 600
  },
  {
    id: 'task-007',
    storyId: 'story-prt-002',
    title: 'Response aggregation',
    description: 'Compile member results into response',
    type: 'development',
    status: 'todo',
    assigneeId: 'tm-007',
    estimatedHours: 8,
    actualHours: 0,
    remainingHours: 8,
    priority: 'medium',
    plannedStart: '2025-02-03',
    plannedEnd: '2025-02-05',
    blockedBy: ['task-006'],
    dailyRate: 580
  },
  // Story PRT-003 Tasks
  {
    id: 'task-008',
    storyId: 'story-prt-003',
    title: 'Define scenario parameters',
    description: 'CMI scenarios S1-S5 configuration',
    type: 'development',
    status: 'done',
    assigneeId: 'tm-001',
    estimatedHours: 4,
    actualHours: 3,
    remainingHours: 0,
    priority: 'medium',
    plannedStart: '2025-02-03',
    plannedEnd: '2025-02-04',
    actualStart: '2025-02-03',
    actualEnd: '2025-02-03',
    blockedBy: [],
    dailyRate: 950
  },
  {
    id: 'task-009',
    storyId: 'story-prt-003',
    title: 'Monte Carlo simulation',
    description: 'Stochastic mortality model',
    type: 'development',
    status: 'in-progress',
    assigneeId: 'tm-002',
    estimatedHours: 20,
    actualHours: 8,
    remainingHours: 14,
    priority: 'high',
    plannedStart: '2025-02-05',
    plannedEnd: '2025-02-12',
    actualStart: '2025-02-05',
    blockedBy: ['task-008'],
    blockedReason: 'Waiting for performance optimization guidance',
    dailyRate: 700
  }
];

// ===================== DEPENDENCIES =====================

export const dependencies: Dependency[] = [
  {
    id: 'dep-001',
    level: 'feature',
    sourceId: 'feat-prt-pricing',
    sourceName: 'Real-Time Pricing Engine',
    sourceType: 'feature',
    targetId: 'feat-data-lake',
    targetName: 'Enterprise Data Lake',
    targetType: 'feature',
    type: 'data-dependency',
    health: 'yellow',
    description: 'Pricing engine requires unified customer data from Data Lake for member lookups',
    impactIfDelayed: 'Cannot consolidate member data for accurate pricing, will need manual data preparation',
    financialImpact: 2500000,
    scheduleImpactDays: 45,
    owner: 'James Chen',
    mitigationPlan: 'Build temporary data bridge from legacy system, parallel development path',
    createdDate: '2024-12-01',
    lastUpdated: '2025-01-15'
  },
  {
    id: 'dep-002',
    level: 'feature',
    sourceId: 'feat-trading-core',
    sourceName: 'Core Trading Engine',
    sourceType: 'feature',
    targetId: 'feat-data-lake',
    targetName: 'Enterprise Data Lake',
    targetType: 'feature',
    type: 'data-dependency',
    health: 'red',
    description: 'Trading engine needs real-time market data feed from Data Lake',
    impactIfDelayed: 'Cannot provide real-time pricing for trade execution, must use delayed data',
    financialImpact: 5000000,
    scheduleImpactDays: 60,
    owner: 'Robert Chen',
    mitigationPlan: 'Negotiate direct Bloomberg feed as interim solution',
    createdDate: '2024-11-15',
    lastUpdated: '2025-01-20'
  },
  {
    id: 'dep-003',
    level: 'task',
    sourceId: 'task-002',
    sourceName: 'Build rate interpolation',
    sourceType: 'task',
    targetId: 'task-001',
    targetName: 'Parse CMI XML format',
    targetType: 'task',
    type: 'blocks',
    health: 'green',
    description: 'Interpolation needs parsed mortality tables as input',
    impactIfDelayed: 'Delays mortality model completion',
    financialImpact: 15000,
    scheduleImpactDays: 2,
    owner: 'Sarah Williams',
    createdDate: '2025-01-05',
    lastUpdated: '2025-01-06'
  }
];

// ===================== FINANCIAL SNAPSHOTS =====================

export const financialSnapshots: FinancialSnapshot[] = [
  {
    id: 'fin-epic-prt-jan',
    entityType: 'epic',
    entityId: 'epic-prt-platform',
    entityName: 'PRT Platform Modernization',
    snapshotDate: '2025-01-31',
    period: 'monthly',
    totalBudget: 8500000,
    allocatedBudget: 8500000,
    contingency: 700000,
    actualSpend: 4200000,
    laborCost: 3800000,
    vendorCost: 300000,
    infrastructureCost: 100000,
    otherCosts: 0,
    forecastAtCompletion: 8900000,
    estimateToComplete: 4700000,
    varianceAtCompletion: -400000,
    plannedValue: 4500000,
    earnedValue: 4100000,
    actualCost: 4200000,
    scheduleVariance: -400000,
    costVariance: -100000,
    schedulePerformanceIndex: 0.91,
    costPerformanceIndex: 0.98,
    projectedROI: 45000000,
    roiConfidence: 78,
    paybackMonths: 18,
    currency: '£'
  },
  {
    id: 'fin-portfolio-jan',
    entityType: 'portfolio',
    entityId: 'portfolio-lg',
    entityName: 'L&G Enterprise Portfolio',
    snapshotDate: '2025-01-31',
    period: 'monthly',
    totalBudget: 95000000,
    allocatedBudget: 85000000,
    contingency: 8000000,
    actualSpend: 42000000,
    laborCost: 35000000,
    vendorCost: 4500000,
    infrastructureCost: 2500000,
    otherCosts: 0,
    forecastAtCompletion: 92000000,
    estimateToComplete: 50000000,
    varianceAtCompletion: 3000000,
    plannedValue: 45000000,
    earnedValue: 41000000,
    actualCost: 42000000,
    scheduleVariance: -4000000,
    costVariance: -1000000,
    schedulePerformanceIndex: 0.91,
    costPerformanceIndex: 0.98,
    projectedROI: 250000000,
    roiConfidence: 72,
    paybackMonths: 24,
    currency: '£'
  }
];

// ===================== RISK REGISTER =====================

export const riskRegister: RiskRegisterEntry[] = [
  {
    id: 'risk-001',
    level: 'feature',
    entityId: 'feat-prt-pricing',
    entityName: 'Real-Time Pricing Engine',
    title: 'Data Lake Dependency Delay',
    description: 'Enterprise Data Lake milestone at risk, could delay pricing engine data access',
    category: 'schedule',
    probability: 'high',
    impact: 'high',
    riskScore: 9,
    status: 'mitigating',
    owner: 'James Chen',
    mitigationPlan: 'Build temporary data bridge from legacy CRM system for member data',
    contingencyPlan: 'Proceed with manual data preparation process at £50K additional cost',
    triggerConditions: ['Data Lake misses Feb 28 milestone', 'API latency exceeds 500ms'],
    financialExposure: 2500000,
    scheduleExposureDays: 45,
    identifiedDate: '2024-12-15',
    targetResolutionDate: '2025-02-15',
    linkedDependencies: ['dep-001']
  },
  {
    id: 'risk-002',
    level: 'feature',
    entityId: 'feat-trading-core',
    entityName: 'Core Trading Engine',
    title: 'Market Data Feed Unavailable',
    description: 'Real-time market data from Data Lake may not be available for trading launch',
    category: 'technical',
    probability: 'high',
    impact: 'high',
    riskScore: 9,
    status: 'analyzing',
    owner: 'Robert Chen',
    mitigationPlan: 'Negotiate direct Bloomberg terminal integration as backup',
    contingencyPlan: 'Launch with delayed data (T+15min) for initial phase',
    triggerConditions: ['Data Lake real-time feed not available by Feb 15'],
    financialExposure: 5000000,
    scheduleExposureDays: 60,
    identifiedDate: '2024-11-20',
    targetResolutionDate: '2025-02-01',
    linkedDependencies: ['dep-002']
  },
  {
    id: 'risk-003',
    level: 'art',
    entityId: 'art-retirement',
    entityName: 'Retirement Solutions ART',
    title: 'Key Architect Overallocation',
    description: 'James Chen allocated to both Data Foundation and Pricing Engine at 80%+ each',
    category: 'resource',
    probability: 'medium',
    impact: 'medium',
    riskScore: 6,
    status: 'identified',
    owner: 'Sarah Mitchell',
    mitigationPlan: 'Hire additional senior architect or redistribute work to team leads',
    contingencyPlan: 'Prioritize Pricing Engine work, accept Data Foundation delay',
    triggerConditions: ['Sprint velocity drops below 40', 'Quality issues in deliverables'],
    financialExposure: 350000,
    scheduleExposureDays: 14,
    identifiedDate: '2025-01-10',
    targetResolutionDate: '2025-02-28',
    linkedDependencies: []
  }
];

// ===================== OKR ALIGNMENTS =====================

export const okrAlignments: OKRAlignment[] = [
  {
    id: 'align-001',
    okrId: 'okr-portfolio-digital',
    okrLevel: 'portfolio',
    linkedEntityType: 'epic',
    linkedEntityId: 'epic-prt-platform',
    linkedEntityName: 'PRT Platform Modernization',
    contributionWeight: 35,
    lastUpdated: '2025-01-15'
  },
  {
    id: 'align-002',
    okrId: 'okr-portfolio-digital',
    okrLevel: 'portfolio',
    linkedEntityType: 'epic',
    linkedEntityId: 'epic-trading-platform',
    linkedEntityName: 'Next-Gen Trading Platform',
    contributionWeight: 30,
    lastUpdated: '2025-01-15'
  },
  {
    id: 'align-003',
    okrId: 'okr-portfolio-ops',
    okrLevel: 'portfolio',
    linkedEntityType: 'epic',
    linkedEntityId: 'epic-data-foundation',
    linkedEntityName: 'Enterprise Data Foundation',
    contributionWeight: 40,
    lastUpdated: '2025-01-15'
  },
  {
    id: 'align-004',
    okrId: 'okr-portfolio-digital',
    okrLevel: 'portfolio',
    linkedEntityType: 'feature',
    linkedEntityId: 'feat-prt-pricing',
    linkedEntityName: 'Real-Time Pricing Engine',
    contributionWeight: 15,
    lastUpdated: '2025-01-20'
  }
];

// ===================== COMPLETE PORTFOLIO EXPORT =====================

export const safe6Portfolio: SAFe6Portfolio = {
  strategicThemes,
  valueStreams,
  portfolioEpics,
  portfolioOKRs,
  portfolioKPIs,
  solutionTrains: [],
  capabilities: [],
  arts,
  programIncrements,
  features,
  artKPIs: arts.flatMap(art => art.kpis),
  teams,
  iterations,
  stories,
  tasks,
  teamMembers,
  dependencies,
  financialSnapshots,
  riskRegister,
  okrAlignments,
  kpiMetricStreams: []
};

// ===================== HELPER FUNCTIONS =====================

export function getProjectHierarchy(epicId: string) {
  const epic = portfolioEpics.find(e => e.id === epicId);
  if (!epic) return null;
  
  const epicFeatures = features.filter(f => f.epicId === epicId);
  const epicStories = stories.filter(s => epicFeatures.some(f => f.id === s.featureId));
  const epicTasks = tasks.filter(t => epicStories.some(s => s.id === t.storyId));
  const epicDeps = dependencies.filter(d => 
    d.sourceId === epicId || 
    epicFeatures.some(f => f.id === d.sourceId) ||
    epicStories.some(s => s.id === d.sourceId) ||
    epicTasks.some(t => t.id === d.sourceId)
  );
  
  return {
    epic,
    features: epicFeatures,
    stories: epicStories,
    tasks: epicTasks,
    dependencies: epicDeps,
    financials: financialSnapshots.filter(f => f.entityId === epicId),
    risks: riskRegister.filter(r => r.entityId === epicId || epicFeatures.some(f => f.id === r.entityId))
  };
}

export function getTeamMemberById(id: string): TeamMember | undefined {
  return teamMembers.find(tm => tm.id === id);
}

export function calculateTaskSlippage(taskId: string): { days: number; costImpact: number } {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.actualEnd) return { days: 0, costImpact: 0 };
  
  const planned = new Date(task.plannedEnd);
  const actual = new Date(task.actualEnd);
  const days = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
  const costImpact = days > 0 ? days * task.dailyRate : 0;
  
  return { days, costImpact };
}

export function getDownstreamImpact(entityId: string): Dependency[] {
  return dependencies.filter(d => d.targetId === entityId);
}

export function getUpstreamDependencies(entityId: string): Dependency[] {
  return dependencies.filter(d => d.sourceId === entityId);
}
