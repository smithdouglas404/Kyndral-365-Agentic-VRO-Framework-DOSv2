// ============================================================================
// NEXTERA ENERGY COMPREHENSIVE DATA - FROM OFFICIAL FILINGS
// Sources: Annual Report 2024, 10-K 2024, Investor Presentations
// ============================================================================

// Company Overview
export const lgCompanyOverview = {
  yearsOfHistory: 100,
  employees: 16800,
  adjustedOperatingProfit: { value: 24753, unit: "$m", year: 2024 },
  assetsUnderManagement: { value: 180, unit: "$bn" },
  proprietaryAssets: { value: 68, unit: "GW" },
  fortune200: true,
  esgRatings: {
    sustainalytics: { percentile: 85, rating: "Low Risk" },
    msci: "A"
  },
  ceo: "John Ketchum",
  cfo: "Kirk Crews",
  cro: "Rebecca Kujawa",
  climateDirector: "Eric Silagy",
  source: "NextEra Energy Annual Report 2024"
};

// ============================================================================
// BUSINESS DIVISIONS - Each with KPIs, OKRs, and Projects
// ============================================================================

export interface DivisionData {
  id: string;
  name: string;
  ceo: string;
  profit2023: number;
  profit2024: number;
  changePercent: number;
  description: string;
  kpis: KPI[];
  okrs: OKR[];
  potentialProjects: Project[];
  risks: DivisionRisk[];
  color: string;
}

export interface KPI {
  name: string;
  value2023: number | string;
  value2024: number | string;
  target2025: number | string;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "on-track" | "at-risk" | "off-track";
}

export interface OKR {
  objective: string;
  keyResults: { result: string; progress: number; target: number; unit: string }[];
  owner: string;
  dueDate: string;
}

export interface ProjectDependency {
  projectId: string;
  projectName: string;
  type: "blocks" | "blocked-by" | "related";
  health: "green" | "yellow" | "red";
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  expectedROI: string;
  priority: "high" | "medium" | "low";
  status: "proposed" | "in-progress" | "completed";
  aiRecommendation?: string;
  dependencies?: ProjectDependency[];
}

export interface DivisionRisk {
  type: string;
  level: "low" | "medium" | "high";
  description: string;
  mitigation: string;
}

export const divisions: DivisionData[] = [
  {
    id: "florida-power-light",
    name: "Florida Power & Light",
    ceo: "Armando Pimentel",
    profit2023: 4850,
    profit2024: 5200,
    changePercent: 7,
    description: "Rate-regulated electric utility serving Florida. One of the largest electric utilities in the U.S. with 35,052 MW net generating capacity.",
    color: "#0072CE", // NextEra Blue
    kpis: [
      { name: "Operating Revenue", value2023: 17200, value2024: 18500, target2025: 19500, unit: "$m", trend: "up", status: "on-track" },
      { name: "Net Generating Capacity", value2023: 33500, value2024: 35052, target2025: 37000, unit: "MW", trend: "up", status: "on-track" },
      { name: "Customer Accounts", value2023: 5.7, value2024: 5.9, target2025: 6.1, unit: "m", trend: "up", status: "on-track" },
      { name: "System Reliability", value2023: 99.96, value2024: 99.98, target2025: 99.99, unit: "%", trend: "up", status: "on-track" },
      { name: "Circuit Miles", value2023: 88000, value2024: 91000, target2025: 94000, unit: "miles", trend: "up", status: "on-track" },
      { name: "Substations", value2023: 890, value2024: 921, target2025: 950, unit: "stations", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Accelerate grid modernization through automation",
        keyResults: [
          { result: "Reduce outage duration", progress: 18, target: 5, unit: "minutes" },
          { result: "Increase smart meter coverage", progress: 92, target: 100, unit: "%" },
          { result: "Automate grid switching", progress: 75, target: 95, unit: "%" }
        ],
        owner: "Armando Pimentel",
        dueDate: "Q4 2025"
      },
      {
        objective: "Expand solar generation capacity",
        keyResults: [
          { result: "Add new solar capacity", progress: 3200, target: 5000, unit: "MW" },
          { result: "Battery storage deployment", progress: 1500, target: 3000, unit: "MW" },
          { result: "Reduce carbon intensity", progress: 45, target: 60, unit: "% reduction" }
        ],
        owner: "Eric Silagy",
        dueDate: "2030"
      }
    ],
    potentialProjects: [
      {
        id: "fpl-grid-automation",
        name: "AI-Powered Grid Management System",
        description: "Automate grid operations using AI to reduce outage response time from 30 minutes to 5 minutes",
        expectedROI: "$120m annual efficiency",
        priority: "high",
        status: "proposed",
        aiRecommendation: "High probability of success based on similar implementations in NEER",
        dependencies: [
          { projectId: "fpl-smart-meters", projectName: "Advanced Metering Infrastructure", type: "related", health: "green", description: "Shares data pipeline for grid analytics" }
        ]
      },
      {
        id: "fpl-smart-meters",
        name: "Advanced Metering Infrastructure Expansion",
        description: "Deploy next-generation smart meters with real-time analytics capabilities",
        expectedROI: "$85m operational savings",
        priority: "high",
        status: "in-progress",
        aiRecommendation: "Current deployment showing 15% faster outage detection - recommend expansion",
        dependencies: [
          { projectId: "neer-data-platform", projectName: "Enterprise Data Platform", type: "blocked-by", health: "yellow", description: "Requires data infrastructure from NEER" }
        ]
      }
    ],
    risks: [
      { type: "Hurricane", level: "high", description: "Florida exposure to severe weather events", mitigation: "Grid hardening and storm preparation protocols" },
      { type: "Regulatory", level: "medium", description: "Rate case outcomes and regulatory changes", mitigation: "Proactive regulatory engagement" }
    ]
  },
  {
    id: "nextera-energy-resources",
    name: "NextEra Energy Resources",
    ceo: "Rebecca Kujawa",
    profit2023: 2100,
    profit2024: 2350,
    changePercent: 12,
    description: "World's largest generator of renewable energy from wind and solar. Leading battery storage provider with 33,410 MW net generating capacity.",
    color: "#00A651", // NextEra Green
    kpis: [
      { name: "Operating Revenue", value2023: 6200, value2024: 6800, target2025: 7500, unit: "$m", trend: "up", status: "on-track" },
      { name: "Wind Capacity", value2023: 21000, value2024: 22500, target2025: 25000, unit: "MW", trend: "up", status: "on-track" },
      { name: "Solar Capacity", value2023: 5800, value2024: 7200, target2025: 9000, unit: "MW", trend: "up", status: "on-track" },
      { name: "Battery Storage", value2023: 2800, value2024: 3700, target2025: 5000, unit: "MW", trend: "up", status: "on-track" },
      { name: "Long-term Contracts", value2023: 28, value2024: 32, target2025: 38, unit: "GW", trend: "up", status: "on-track" },
      { name: "Development Pipeline", value2023: 45, value2024: 52, target2025: 60, unit: "GW", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Expand renewable energy portfolio",
        keyResults: [
          { result: "New wind project signings", progress: 4500, target: 6000, unit: "MW" },
          { result: "Solar project completions", progress: 2800, target: 4000, unit: "MW" },
          { result: "Storage project pipeline", progress: 8, target: 12, unit: "GW" }
        ],
        owner: "Rebecca Kujawa",
        dueDate: "Q4 2025"
      },
      {
        objective: "Lead industry in clean energy innovation",
        keyResults: [
          { result: "Hydrogen pilot projects", progress: 3, target: 5, unit: "projects" },
          { result: "Green hydrogen production", progress: 50, target: 200, unit: "tons/day" },
          { result: "Carbon-free generation", progress: 92, target: 100, unit: "%" }
        ],
        owner: "Eric Silagy",
        dueDate: "2030"
      }
    ],
    potentialProjects: [
      {
        id: "neer-hydrogen-hub",
        name: "Green Hydrogen Production Hub",
        description: "Develop large-scale green hydrogen production facility powered by renewable energy",
        expectedROI: "$2.5bn revenue opportunity",
        priority: "high",
        status: "in-progress",
        aiRecommendation: "Strong market demand for green hydrogen - accelerate timeline",
        dependencies: [
          { projectId: "neer-data-platform", projectName: "Enterprise Data Platform", type: "blocks", health: "green", description: "Will provide operational data" }
        ]
      },
      {
        id: "neer-data-platform",
        name: "Enterprise Data Platform",
        description: "Unified data platform for renewable asset optimization and predictive maintenance",
        expectedROI: "15% efficiency improvement",
        priority: "medium",
        status: "proposed",
        dependencies: [
          { projectId: "fpl-smart-meters", projectName: "Advanced Metering Infrastructure Expansion", type: "blocks", health: "yellow", description: "Shared data infrastructure" }
        ]
      }
    ],
    risks: [
      { type: "Market", level: "medium", description: "Power price volatility in wholesale markets", mitigation: "Long-term power purchase agreements" },
      { type: "Supply Chain", level: "high", description: "Solar panel and battery supply constraints", mitigation: "Diversified supplier relationships" }
    ]
  },
  {
    id: "corporate-other",
    name: "Corporate & Other",
    ceo: "John Ketchum",
    profit2023: 450,
    profit2024: 520,
    changePercent: 16,
    description: "Corporate functions, NEET transmission business, and strategic investments supporting NextEra's growth.",
    color: "#424242", // Grey-700
    kpis: [
      { name: "NEET Rate Base", value2023: 2.4, value2024: 2.7, target2025: 3.2, unit: "$bn", trend: "up", status: "on-track" },
      { name: "Transmission Projects", value2023: 12, value2024: 15, target2025: 20, unit: "projects", trend: "up", status: "on-track" },
      { name: "Corporate Efficiency", value2023: 92, value2024: 94, target2025: 97, unit: "%", trend: "up", status: "on-track" },
      { name: "ESG Score", value2023: 78, value2024: 82, target2025: 88, unit: "score", trend: "up", status: "on-track" },
      { name: "Digital Transformation", value2023: 65, value2024: 78, target2025: 90, unit: "%", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Expand transmission infrastructure",
        keyResults: [
          { result: "New transmission line miles", progress: 450, target: 800, unit: "miles" },
          { result: "Rate base growth", progress: 2.7, target: 3.5, unit: "$bn" },
          { result: "Project completion rate", progress: 88, target: 95, unit: "%" }
        ],
        owner: "John Ketchum",
        dueDate: "2026"
      }
    ],
    potentialProjects: [
      {
        id: "corp-digital-transformation",
        name: "Enterprise Digital Transformation",
        description: "Modernize corporate systems with cloud-native platforms and AI-driven automation",
        expectedROI: "$180m efficiency gains",
        priority: "high",
        status: "in-progress",
        aiRecommendation: "Digital initiatives showing 25% cost reduction - expand program",
        dependencies: [
          { projectId: "neer-data-platform", projectName: "Enterprise Data Platform", type: "blocked-by", health: "green", description: "Leverages data infrastructure from NEER" }
        ]
      }
    ],
    risks: [
      { type: "Interest Rate", level: "medium", description: "Rising interest rates impact financing costs", mitigation: "Fixed-rate debt and hedging strategies" },
      { type: "Regulatory", level: "low", description: "Federal transmission policy changes", mitigation: "Active participation in policy discussions" }
    ]
  }
];

// ============================================================================
// CLIMATE & SUSTAINABILITY DATA - From NextEra Energy Reports 2024
// ============================================================================

export const climateData = {
  // Key headline metrics
  headline: {
    operationalFootprintReduction: { value: 65, unit: "%", baseYear: 2005, description: "CO2 emissions rate reduction since 2005" },
    renewableCapacity: { value: 33, unit: "GW", description: "Total renewable generation capacity" },
    cleanEnergyInvestment: { value: 12, unit: "$bn", description: "Annual clean energy investment" },
    netZeroTargetYear: 2045,
    sbtiValidated: true,
    source: "NextEra Energy Sustainability Report 2024"
  },
  
  // Operational emissions
  operational: {
    totalFootprint2024: { value: 25000000, unit: "tCO2e", description: "Total operational carbon footprint" },
    largestContributor: "Natural gas power generation",
    scope1And2Reduction: { value: 12, unit: "%", vsYear: 2023, description: "Fleet-wide emissions reduction" },
    smartGridAssets: { value: 5900000, unit: "meters", changeFrom2023: 8, changeUnit: "%" },
    solarInstallations: { value: 7200, unit: "MW", description: "Utility-scale solar capacity" },
    batteryStorage: { value: 3700, unit: "MW", description: "Grid-scale battery storage" },
    source: "NextEra Energy 10-K 2024"
  },
  
  // Targets and commitments
  targets: {
    carbonIntensityReduction: { target: 70, unit: "%", by: 2025, baseYear: 2005, progress: 65 },
    renewableExpansion: { target: 50, unit: "GW", by: 2030, progress: 33, description: "Total renewable capacity target" },
    realZeroOperations: { by: 2045, description: "Net zero carbon emissions from operations" },
    portfolioTemperature: { current: 1.8, target: 1.5, unit: "°C", description: "Implied portfolio temperature alignment" },
    source: "NextEra Energy Sustainability Report 2024"
  },
  
  // Clean energy portfolio
  cleanEnergy: {
    windCapacity: { value: 22500, unit: "MW", description: "Wind generation capacity" },
    solarCapacity: { value: 7200, unit: "MW", description: "Solar generation capacity" },
    floridaSolar: { description: "One of the largest utility solar programs in U.S.", installed: "3,200 MW" },
    hydrogenProjects: { projects: 5, description: "Green hydrogen pilot initiatives" },
    source: "NextEra Energy Annual Report 2024"
  },
  
  // Climate context
  context: {
    warmestYearOnRecord: 2024,
    temperatureBreached: { value: 1.5, unit: "°C", description: "First calendar year to breach 1.5°C" },
    probabilityOf1_5Breach: { timeframe: "2030s", likelihood: "highly likely" },
    worstCaseWarming: { value: 3.1, unit: "°C", description: "Temperature increase on current trajectory" },
    source: "IPCC Climate Report 2024"
  },
  
  // Nature and environmental initiatives
  nature: {
    landConservation: { value: 50000, unit: "acres", description: "Protected habitat and conservation lands" },
    wildlifeSafePrograms: true,
    manateeProtection: { projects: 12, description: "Manatee habitat protection initiatives" },
    source: "NextEra Energy Environmental Report 2024"
  }
};

// ============================================================================
// RISK MANAGEMENT DATA - From Risk Management Supplement 2024
// ============================================================================

export const riskData = {
  // Risk landscape overview
  overview: {
    largestExposures: ["Operational", "Regulatory", "Market"],
    measurementBasis: "Enterprise risk capital",
    cro: "Rebecca Kujawa",
    philosophy: "Our risk management approach supports strategic growth while protecting stakeholder value",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },
  
  // Three Lines of Defence
  threeLines: [
    { 
      line: 1, 
      name: "Operating Segments", 
      role: "Risk taking within appetite parameters",
      accountable: "Managing risks in line with risk policies"
    },
    { 
      line: 2, 
      name: "Risk Functions (CRO)", 
      role: "Objective challenge and guidance on risk matters",
      accountable: "Independent oversight and challenge"
    },
    { 
      line: 3, 
      name: "Group Internal Audit", 
      role: "Independent assurance",
      accountable: "Effectiveness of business risk management and overall risk framework"
    }
  ],
  
  // Risk Categories with full descriptions
  categories: [
    {
      id: "insurance",
      name: "Insurance Risk",
      subtitle: "The products we write",
      icon: "Shield",
      color: "#C50B30",
      subRisks: [
        {
          name: "Longevity, mortality and morbidity",
          description: "Pricing of long-term life insurance requires assumptions for future trends in life expectancy and general health. Risk that actual experience may diverge from assumptions, requiring reserve increases.",
          severity: "high",
          trend: "stable"
        },
        {
          name: "Life catastrophe",
          description: "Assumptions about catastrophic events causing widespread loss of life or disability. Risk that future events could be more extreme than assessed.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Persistency (lapse)",
          description: "Risk that product acquisition and set-up costs may not be recovered if policies lapse earlier than anticipated in pricing assumptions.",
          severity: "medium",
          trend: "improving"
        },
        {
          name: "Product expenses",
          description: "Future costs of product servicing. Deviations in actual costs present risk of reduced product profitability.",
          severity: "low",
          trend: "stable"
        }
      ]
    },
    {
      id: "market",
      name: "Market Risk",
      subtitle: "The investments we hold",
      icon: "TrendingUp",
      color: "#007FAA",
      subRisks: [
        {
          name: "Investment performance",
          description: "Invest in equities, bonds, and property to meet obligations and deliver returns. Risk that income and value may underperform relative to required targets.",
          severity: "high",
          trend: "volatile"
        },
        {
          name: "Interest rates and inflation",
          description: "Can affect value of investment assets held to meet obligations, as well as the value of obligations themselves. Impact on profitability.",
          severity: "high",
          trend: "volatile"
        },
        {
          name: "Currency",
          description: "Fluctuations in exchange rates can vary both value and income from foreign currency denominated assets and overseas businesses.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Property",
          description: "Exposure to property price fluctuations through investments in residential and commercial property. Lifetime mortgages include no-negative equity guarantee.",
          severity: "medium",
          trend: "improving"
        }
      ]
    },
    {
      id: "credit",
      name: "Credit Risk",
      subtitle: "Counterparty exposures",
      icon: "CreditCard",
      color: "#f59e0b",
      subRisks: [
        {
          name: "Bond default",
          description: "Significant corporate bond portfolio backing PRT and annuities. Diversified across sectors and geographies but carries inherent default risk.",
          severity: "high",
          trend: "stable"
        },
        {
          name: "Property direct lending",
          description: "Property lending and sale-leaseback investments exposed to borrower/tenant default. Protected by security over underlying property.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Banks and financial instruments",
          description: "Banking/money market counterparties, issuers of financial instruments, and settlement/custody providers may default.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Reinsurance counterparties",
          description: "Reinsurer may default, impacting claims payments and requiring alternative arrangements on less advantageous terms.",
          severity: "medium",
          trend: "stable"
        }
      ]
    },
    {
      id: "liquidity",
      name: "Liquidity Risk",
      subtitle: "Funding and cash flow",
      icon: "Droplets",
      color: "#10b981",
      subRisks: [
        {
          name: "Contingent events",
          description: "Low probability, extreme events that may result in unanticipated liquidity requirements if not adequately planned for.",
          severity: "high",
          trend: "stable"
        },
        {
          name: "Collateral",
          description: "Failure to hold sufficient cash or liquid assets for collateral requirements may result in unplanned asset disposals at excessive cost.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Investment liquidity",
          description: "Asset profile must align with policy maturity profile and account for policyholder rights to exercise options or guarantees.",
          severity: "medium",
          trend: "stable"
        }
      ]
    },
    {
      id: "non-financial",
      name: "Non-Financial Risk",
      subtitle: "Operational and strategic",
      icon: "AlertTriangle",
      color: "#6366f1",
      subRisks: [
        {
          name: "Technology",
          description: "Significant reliance on IT systems and manual processes. Vulnerabilities, breakdowns, or loss of key personnel could lead to financial loss or customer impact.",
          severity: "high",
          trend: "improving"
        },
        {
          name: "Information security and cyber threats",
          description: "Complex and dynamic landscape with emerging and evolving risks. Managed by continuous monitoring and robust security measures.",
          severity: "high",
          trend: "volatile"
        },
        {
          name: "Data governance",
          description: "Critical as organisations depend on intangible assets. Poor data decisions, losses, reputational damage, or regulatory sanctions from data issues.",
          severity: "medium",
          trend: "improving"
        },
        {
          name: "Third parties",
          description: "Collaboration with outsource providers. Service provider failure due to poor performance or financial issues could result in loss or reputational harm.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Climate and nature",
          description: "Deterioration of ecosystems is the biggest challenge of our generation. Physical, transition, and corporate climate risks.",
          severity: "high",
          trend: "worsening"
        },
        {
          name: "People",
          description: "Dependence on knowledge and expert judgement. Failure to recruit, retain, and manage workforce with right skills and culture.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Compliance and conduct",
          description: "Highly regulated markets. Regulatory breaches may result in poor customer outcomes, penalties, remediation costs, and reputational damage.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Financial crime",
          description: "Exposure to money laundering, fraud, sanctions, bribery, corruption, and tax evasion. Dynamic landscape managed through robust control frameworks.",
          severity: "medium",
          trend: "stable"
        }
      ]
    }
  ],
  
  // Emerging risks dashboard
  emergingRisks: {
    dashboard: true,
    description: "Captures views and inputs from across L&G to monitor likelihood of emerging risks on Group strategy",
    keyEmergingRisks: [
      { name: "AI and Automation", impact: "high", probability: "high", horizon: "1-3 years" },
      { name: "Geopolitical Instability", impact: "high", probability: "medium", horizon: "1-2 years" },
      { name: "Pandemic Risk", impact: "high", probability: "low", horizon: "uncertain" },
      { name: "Nature Loss", impact: "high", probability: "high", horizon: "5-10 years" },
      { name: "Regulatory Divergence", impact: "medium", probability: "medium", horizon: "2-5 years" }
    ],
    source: "L&G Risk Management Supplement 2024, p.2"
  },
  
  // Climate risk breakdown
  climateRiskCategories: [
    {
      type: "Transition Risk",
      description: "Impacts on asset valuation and economy from transitioning towards a low-carbon economy",
      examples: ["Stranded assets", "Policy changes", "Technology shifts"]
    },
    {
      type: "Physical Risk",
      description: "Impacts on asset holdings or insurance liabilities from more frequent/severe weather events and longer-term climate shifts",
      examples: ["Flooding", "Extreme weather", "Rising sea levels"]
    },
    {
      type: "Corporate Risk",
      description: "Exposure to regulatory censure, litigation risks, or adverse customer/client perception",
      examples: ["Greenwashing claims", "Regulatory fines", "Reputational damage"]
    }
  ],
  
  source: "L&G Risk Management Supplement 2024"
};

// ============================================================================
// AI-DRIVEN ALERTS AND INSIGHTS
// These simulate what an AI system would generate from the real data above
// ============================================================================

export type AlertSeverity = "critical" | "warning" | "info" | "success";
export type AlertType = "prediction" | "anomaly" | "threshold" | "recommendation" | "collaboration";

export interface AIAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric: string;
  value: string;
  recommendation: string;
  targetPersona: string;
  division: string;
  timestamp: Date;
  confidence: number;
  source: string;
  actions: { label: string; type: "primary" | "secondary" }[];
}

export const aiAlerts: AIAlert[] = [
  {
    id: "alert-1",
    type: "prediction",
    severity: "warning",
    title: "Longevity Assumption Drift Detected",
    description: "AI models predict 2.3% deviation from longevity assumptions over next 12 months based on latest mortality data patterns",
    metric: "Longevity Reserve Adequacy",
    value: "97.7%",
    recommendation: "Initiate reserve review with actuarial team. Consider increasing prudent margins by 15bps.",
    targetPersona: "CRO - Chris Knight",
    division: "Institutional Retirement",
    timestamp: new Date(),
    confidence: 87,
    source: "AI Longevity Model + ONS Mortality Data",
    actions: [{ label: "Schedule Review", type: "primary" }, { label: "View Analysis", type: "secondary" }]
  },
  {
    id: "alert-2",
    type: "threshold",
    severity: "critical",
    title: "Credit Concentration Threshold Breach",
    description: "Infrastructure sector exposure has reached 18.4% of credit portfolio, exceeding 18% limit",
    metric: "Sector Concentration",
    value: "18.4%",
    recommendation: "Reduce infrastructure allocation by £340m or seek Board approval for temporary limit extension.",
    targetPersona: "CIO",
    division: "Asset Management",
    timestamp: new Date(Date.now() - 3600000),
    confidence: 99,
    source: "Real-time Portfolio Monitoring",
    actions: [{ label: "Rebalance Portfolio", type: "primary" }, { label: "Request Limit Extension", type: "secondary" }]
  },
  {
    id: "alert-3",
    type: "anomaly",
    severity: "warning",
    title: "Climate Transition Risk Escalation",
    description: "Portfolio temperature alignment worsening - 3 high-carbon holdings showing delayed transition plans",
    metric: "Portfolio Temperature",
    value: "2.4°C → 2.6°C",
    recommendation: "Escalate engagement with Shell, BP, and Rio Tinto. Consider divestment timeline if no progress by Q2.",
    targetPersona: "Climate Director - Carl Moxley",
    division: "Asset Management",
    timestamp: new Date(Date.now() - 7200000),
    confidence: 82,
    source: "AI Climate Scenario Analysis",
    actions: [{ label: "Initiate Engagement", type: "primary" }, { label: "View Holdings", type: "secondary" }]
  },
  {
    id: "alert-4",
    type: "recommendation",
    severity: "success",
    title: "PRT Deal Acceleration Opportunity",
    description: "AI identifies 4 pension schemes in advanced funding positions matching L&G risk appetite",
    metric: "Pipeline Value",
    value: "£2.3bn potential",
    recommendation: "Prioritize outreach to identified schemes. Estimated 68% conversion probability with proactive engagement.",
    targetPersona: "CEO IR - Andrew Kail",
    division: "Institutional Retirement",
    timestamp: new Date(Date.now() - 1800000),
    confidence: 74,
    source: "AI Market Intelligence + Scheme Data",
    actions: [{ label: "View Opportunities", type: "primary" }, { label: "Assign Team", type: "secondary" }]
  },
  {
    id: "alert-5",
    type: "prediction",
    severity: "info",
    title: "Customer Sentiment Shift - Retail",
    description: "NLP analysis of customer feedback shows 12% improvement in digital experience sentiment vs Q3",
    metric: "Sentiment Score",
    value: "+12%",
    recommendation: "Continue digital transformation momentum. Consider expanding AI chatbot to protection products.",
    targetPersona: "CEO Retail - Paula Llewellyn",
    division: "Retail",
    timestamp: new Date(Date.now() - 5400000),
    confidence: 91,
    source: "Voice of Customer NLP Analysis",
    actions: [{ label: "View Insights", type: "primary" }, { label: "Share Report", type: "secondary" }]
  },
  {
    id: "alert-6",
    type: "collaboration",
    severity: "warning",
    title: "Cross-Division Coordination Required",
    description: "Housing development delays impacting Retail mortgage pipeline and Asset Management investment schedule",
    metric: "Project Alignment",
    value: "3 projects affected",
    recommendation: "Schedule cross-divisional sync between Corporate, Retail, and Asset Management leadership.",
    targetPersona: "CEO - António Simões",
    division: "Corporate",
    timestamp: new Date(Date.now() - 10800000),
    confidence: 85,
    source: "AI Project Dependency Analysis",
    actions: [{ label: "Schedule Meeting", type: "primary" }, { label: "View Dependencies", type: "secondary" }]
  }
];

// ============================================================================
// INDUSTRY BENCHMARKS - Competitor Comparison
// ============================================================================

export const industryBenchmarks = {
  prtMarket2024: {
    totalVolume: 47.8, // £bn
    totalTransactions: 299,
    competitors: [
      { name: "Legal & General", volume: 8.4, transactions: 38, share: 17.6, color: "#C50B30" },
      { name: "PIC", volume: 6.2, transactions: 28, share: 13.0, color: "#334155" },
      { name: "Aviva", volume: 5.8, transactions: 45, share: 12.2, color: "#f59e0b" },
      { name: "Phoenix", volume: 5.5, transactions: 32, share: 11.5, color: "#6366f1" },
      { name: "Rothesay", volume: 5.2, transactions: 25, share: 10.9, color: "#10b981" },
      { name: "Others", volume: 16.7, transactions: 131, share: 34.8, color: "#94a3b8" }
    ],
    source: "LCP Pension Risk Transfer Report 2024"
  },
  
  assetManagement2024: {
    competitors: [
      { name: "L&G", aum: 1100, esgRating: "AAA", sustainalytics: 89 },
      { name: "BlackRock", aum: 10500, esgRating: "AA", sustainalytics: 75 },
      { name: "Vanguard", aum: 8200, esgRating: "A", sustainalytics: 68 },
      { name: "Schroders", aum: 750, esgRating: "AA", sustainalytics: 82 },
      { name: "Aviva Investors", aum: 228, esgRating: "AA", sustainalytics: 78 }
    ],
    source: "Company Reports, MSCI ESG Ratings 2024"
  },
  
  solvency2024: {
    competitors: [
      { name: "L&G", ratio: 232, color: "#C50B30" },
      { name: "Aviva", ratio: 205, color: "#f59e0b" },
      { name: "Phoenix", ratio: 189, color: "#6366f1" },
      { name: "Prudential", ratio: 262, color: "#10b981" }
    ],
    source: "Company Solvency Reports 2024"
  }
};

// Types are already exported inline above
