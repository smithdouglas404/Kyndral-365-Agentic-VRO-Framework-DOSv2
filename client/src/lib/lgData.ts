// ============================================================================
// L&G COMPREHENSIVE DATA - FROM OFFICIAL PDFs
// Sources: Annual Report 2024, Climate & Nature Report 2024, Risk Management Supplement 2024
// ============================================================================

// Company Overview
export const lgCompanyOverview = {
  yearsOfHistory: 188,
  employees: 10799,
  adjustedOperatingProfit: { value: 1711, unit: "£m", year: 2024 },
  assetsUnderManagement: { value: 1.1, unit: "£tn" },
  proprietaryAssets: { value: 97.6, unit: "£bn" },
  ftse100: true,
  esgRatings: {
    sustainalytics: { percentile: 89, rating: "Low Risk" },
    msci: "AAA"
  },
  ceo: "António Simões",
  cfo: "Jeff Davies",
  cro: "Chris Knight",
  climateDirector: "Carl Moxley",
  source: "L&G Climate and Nature Report 2024, p.3"
};

// ============================================================================
// OPERATING SEGMENTS - Each with KPIs, OKRs, and Projects
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
    id: "institutional-retirement",
    name: "Institutional Retirement",
    ceo: "Andrew Kail",
    profit2023: 1028,
    profit2024: 1105,
    changePercent: 7,
    description: "Bulk annuity business providing pension risk transfer solutions. Targeting net zero asset portfolio by 2050.",
    color: "#005EB8", // Brand Blue
    kpis: [
      { name: "Operating Profit", value2023: 1028, value2024: 1105, target2025: 1180, unit: "£m", trend: "up", status: "on-track" },
      { name: "PRT Volume (UK)", value2023: 8.0, value2024: 8.4, target2025: 9.1, unit: "£bn", trend: "up", status: "on-track" },
      { name: "Transactions", value2023: 35, value2024: 38, target2025: 42, unit: "deals", trend: "up", status: "on-track" },
      { name: "Market Share", value2023: 16.0, value2024: 17.6, target2025: 18.5, unit: "%", trend: "up", status: "on-track" },
      { name: "Solvency Margin", value2023: 5.1, value2024: 5.3, target2025: 5.5, unit: "%", trend: "up", status: "on-track" },
      { name: "New Business Margin", value2023: 6.8, value2024: 7.1, target2025: 7.5, unit: "%", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Accelerate PRT deal flow through automated intake",
        keyResults: [
          { result: "Reduce deal cycle time", progress: 18, target: 5, unit: "days" },
          { result: "Increase pipeline conversion", progress: 68, target: 85, unit: "%" },
          { result: "Automate pricing models", progress: 45, target: 80, unit: "%" }
        ],
        owner: "Andrew Kail",
        dueDate: "Q4 2025"
      },
      {
        objective: "Decarbonise annuity portfolio towards net zero",
        keyResults: [
          { result: "Reduce financed emissions intensity", progress: 37, target: 50, unit: "% reduction" },
          { result: "Increase transition finance allocation", progress: 4.0, target: 6.0, unit: "£bn" },
          { result: "Portfolio temperature alignment", progress: 2.4, target: 1.5, unit: "°C" }
        ],
        owner: "Carl Moxley",
        dueDate: "2030"
      }
    ],
    potentialProjects: [
      {
        id: "ir-deal-intake",
        name: "AI-Powered Deal Intake Automation",
        description: "Automate initial assessment of PRT opportunities using AI to reduce cycle time from 35 days to 5 days",
        expectedROI: "£85m annual efficiency",
        priority: "high",
        status: "proposed",
        aiRecommendation: "High probability of success based on similar implementations in Asset Management",
        dependencies: [
          { projectId: "ir-longevity-dashboard", projectName: "Real-time Longevity Risk Dashboard", type: "related", health: "green", description: "Shares data pipeline for risk analytics" }
        ]
      },
      {
        id: "ir-longevity-dashboard",
        name: "Real-time Longevity Risk Dashboard",
        description: "Deploy predictive analytics for longevity assumption drift detection",
        expectedROI: "£42m risk mitigation",
        priority: "high",
        status: "in-progress",
        aiRecommendation: "Current assumptions showing 2.3% variance - recommend expedited deployment",
        dependencies: [
          { projectId: "am-data-platform", projectName: "AI Portfolio Optimization Engine", type: "blocked-by", health: "yellow", description: "Requires data feed from Asset Management platform" }
        ]
      }
    ],
    risks: [
      { type: "Longevity", level: "medium", description: "Assumptions may diverge from actual experience", mitigation: "Regular reserve reviews and reinsurance" },
      { type: "Credit", level: "medium", description: "Corporate bond portfolio default risk", mitigation: "Diversification across sectors and geographies" }
    ]
  },
  {
    id: "asset-management",
    name: "Asset Management",
    ceo: "Eric Adler",
    profit2023: 448,
    profit2024: 401,
    changePercent: -10,
    description: "One of world's largest asset managers with market-leading investment stewardship. Committed to helping clients manage climate risks and opportunities.",
    color: "#00843D", // Brand Teal
    kpis: [
      { name: "Operating Profit", value2023: 448, value2024: 401, target2025: 420, unit: "£m", trend: "down", status: "at-risk" },
      { name: "Total AUM", value2023: 1200, value2024: 1100, target2025: 1150, unit: "£bn", trend: "down", status: "at-risk" },
      { name: "DC AUM", value2023: 163, value2024: 183, target2025: 200, unit: "£bn", trend: "up", status: "on-track" },
      { name: "Private Markets AUM", value2023: 48, value2024: 57, target2025: 65, unit: "£bn", trend: "up", status: "on-track" },
      { name: "UK Wholesale", value2023: 54.2, value2024: 64.7, target2025: 75, unit: "£bn", trend: "up", status: "on-track" },
      { name: "Responsible Investment AUM", value2023: 400, value2024: 424.6, target2025: 450, unit: "£bn", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Grow Private Markets platform",
        keyResults: [
          { result: "Increase Private Markets AUM", progress: 57, target: 70, unit: "£bn" },
          { result: "Launch new sustainability funds", progress: 3, target: 5, unit: "funds" },
          { result: "Expand clean power investments", progress: 2.8, target: 4.0, unit: "£bn" }
        ],
        owner: "Eric Adler",
        dueDate: "Q4 2025"
      },
      {
        objective: "Lead industry on investment stewardship",
        keyResults: [
          { result: "Company engagements on climate", progress: 847, target: 1000, unit: "engagements" },
          { result: "Votes cast on environmental resolutions", progress: 92, target: 95, unit: "%" },
          { result: "Supplier emissions target coverage", progress: 65, target: 100, unit: "%" }
        ],
        owner: "Carl Moxley",
        dueDate: "2026"
      }
    ],
    potentialProjects: [
      {
        id: "am-private-markets-fund",
        name: "L&G Private Markets Access Fund",
        description: "New fund providing meaningful opportunity to focus on sustainability by investing directly in assets such as clean power",
        expectedROI: "£2.5bn new AUM",
        priority: "high",
        status: "in-progress",
        aiRecommendation: "Strong market demand detected - accelerate launch timeline",
        dependencies: [
          { projectId: "am-data-platform", projectName: "AI Portfolio Optimization Engine", type: "blocks", health: "green", description: "Will provide data for analytics platform" }
        ]
      },
      {
        id: "am-data-platform",
        name: "AI Portfolio Optimization Engine",
        description: "Machine learning-driven portfolio rebalancing with ESG integration",
        expectedROI: "12bps alpha improvement",
        priority: "medium",
        status: "proposed",
        dependencies: [
          { projectId: "ir-longevity-dashboard", projectName: "Real-time Longevity Risk Dashboard", type: "blocks", health: "yellow", description: "Shared ML infrastructure" }
        ]
      }
    ],
    risks: [
      { type: "Market", level: "high", description: "Investment performance may underperform targets", mitigation: "Diversification and active risk management" },
      { type: "Fee Pressure", level: "medium", description: "Industry-wide fee compression", mitigation: "Focus on value-added services and private markets" }
    ]
  },
  {
    id: "retail",
    name: "Retail",
    ceo: "Paula Llewellyn",
    profit2023: 449,
    profit2024: 504,
    changePercent: 12,
    description: "Individual retirement and protection products including workplace pensions, individual annuities, and life insurance.",
    color: "#005EB8", // Brand Blue
    kpis: [
      { name: "Operating Profit", value2023: 449, value2024: 504, target2025: 560, unit: "£m", trend: "up", status: "on-track" },
      { name: "Workplace DC Members", value2023: 4.8, value2024: 5.2, target2025: 5.6, unit: "m", trend: "up", status: "on-track" },
      { name: "Individual Annuities Written", value2023: 32000, value2024: 38000, target2025: 45000, unit: "policies", trend: "up", status: "on-track" },
      { name: "Protection New Business", value2023: 780, value2024: 850, target2025: 920, unit: "£m APE", trend: "up", status: "on-track" },
      { name: "Customer Satisfaction (NPS)", value2023: 42, value2024: 48, target2025: 55, unit: "score", trend: "up", status: "on-track" },
      { name: "Digital Adoption Rate", value2023: 62, value2024: 71, target2025: 80, unit: "%", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Enhance digital customer experience",
        keyResults: [
          { result: "Increase digital adoption", progress: 71, target: 85, unit: "%" },
          { result: "Reduce call center volume", progress: 25, target: 40, unit: "% reduction" },
          { result: "Launch AI chatbot for queries", progress: 60, target: 100, unit: "% deployed" }
        ],
        owner: "Paula Llewellyn",
        dueDate: "Q2 2025"
      }
    ],
    potentialProjects: [
      {
        id: "retail-digital-onboarding",
        name: "Digitizing Customer Onboarding",
        description: "Transform paper-based onboarding to fully digital journey with AI-assisted form completion",
        expectedROI: "£28m efficiency + improved NPS",
        priority: "high",
        status: "proposed",
        aiRecommendation: "Customer feedback analysis shows 78% prefer digital-first - prioritize immediately",
        dependencies: [
          { projectId: "retail-ai-chatbot", projectName: "AI Customer Service Chatbot", type: "related", health: "green", description: "Shared customer interaction platform" }
        ]
      },
      {
        id: "retail-ai-chatbot",
        name: "AI Customer Service Chatbot",
        description: "Deploy intelligent chatbot for 24/7 customer query resolution and claims processing",
        expectedROI: "£15m annual savings",
        priority: "medium",
        status: "in-progress",
        aiRecommendation: "Current pilot showing 85% resolution rate - ready for full rollout",
        dependencies: [
          { projectId: "retail-digital-onboarding", projectName: "Digitizing Customer Onboarding", type: "related", health: "green", description: "Shared customer data integration" }
        ]
      }
    ],
    risks: [
      { type: "Persistency", level: "medium", description: "Policies may lapse earlier than anticipated", mitigation: "Enhanced customer engagement programs" },
      { type: "Mortality", level: "low", description: "Protection claims experience", mitigation: "Robust underwriting and reinsurance" }
    ]
  },
  {
    id: "corporate",
    name: "Corporate Investments",
    ceo: "Laura Mason",
    profit2023: 136,
    profit2024: 95,
    changePercent: -30,
    description: "Strategic investments including housing, later living, clean energy, and SME finance supporting UK economic growth.",
    color: "#424242", // Grey-700
    kpis: [
      { name: "Operating Profit", value2023: 136, value2024: 95, target2025: 110, unit: "£m", trend: "down", status: "at-risk" },
      { name: "Housing Completions", value2023: 3200, value2024: 3800, target2025: 4500, unit: "homes", trend: "up", status: "on-track" },
      { name: "Affordable Homes Delivered", value2023: 1100, value2024: 1400, target2025: 1800, unit: "homes", trend: "up", status: "on-track" },
      { name: "Clean Energy Investments", value2023: 1.8, value2024: 2.3, target2025: 3.0, unit: "£bn", trend: "up", status: "on-track" },
      { name: "SME Finance Outstanding", value2023: 2.1, value2024: 2.4, target2025: 2.8, unit: "£bn", trend: "up", status: "on-track" }
    ],
    okrs: [
      {
        objective: "Deliver net zero carbon homes by 2030",
        keyResults: [
          { result: "Gas-free homes (LGAH)", progress: 61, target: 100, unit: "%" },
          { result: "Gas-free homes (SBTR)", progress: 100, target: 100, unit: "%" },
          { result: "Install ground source heat pumps", progress: 450, target: 1000, unit: "units" }
        ],
        owner: "Laura Mason",
        dueDate: "2030"
      }
    ],
    potentialProjects: [
      {
        id: "corp-net-zero-expansion",
        name: "Inspired Villages Net Zero Expansion",
        description: "Scale UK's first net zero carbon retirement community model (Millfield Green) to 5 additional sites",
        expectedROI: "£180m new development value",
        priority: "high",
        status: "in-progress",
        aiRecommendation: "ESG investor demand analysis shows 340% increase in sustainable housing interest",
        dependencies: [
          { projectId: "am-private-markets-fund", projectName: "L&G Private Markets Access Fund", type: "blocked-by", health: "red", description: "Awaiting funding allocation from Private Markets" }
        ]
      }
    ],
    risks: [
      { type: "Property", level: "medium", description: "Exposure to house price fluctuations", mitigation: "Geographic and segment diversification" },
      { type: "Construction", level: "medium", description: "Project delivery and cost overruns", mitigation: "Fixed-price contracts and milestone monitoring" }
    ]
  }
];

// ============================================================================
// CLIMATE & NATURE DATA - From Climate and Nature Report 2024
// ============================================================================

export const climateData = {
  // Key headline metrics
  headline: {
    operationalFootprintReduction: { value: 30, unit: "%", baseYear: 2021, description: "Reduction from base year" },
    financedEmissionsReduction: { value: 37, unit: "%", baseYear: 2019, description: "Financed emissions intensity reduction" },
    transitionFinance: { value: 4.0, unit: "£bn", description: "Transition finance investments" },
    netZeroTargetYear: 2050,
    sbtiValidated: true,
    source: "L&G Climate and Nature Report 2024, p.21"
  },
  
  // Operational emissions
  operational: {
    totalFootprint2024: { value: 24647, unit: "tCO2e", description: "Total operational carbon footprint" },
    largestContributor: "Private Markets real estate portfolio",
    scope1And2Reduction: { value: 10, unit: "%", vsYear: 2023, description: "Housing business reduction" },
    automaticMeterReaders: { value: 239, unit: "assets", changeFrom2023: 41, changeUnit: "%" },
    viztaPlatformAssets: { value: 427, unit: "assets", description: "Occupier engagement platform coverage" },
    iesProjects: { value: 27, unit: "assets", description: "Integrated Energy Solutions projects" },
    source: "L&G Climate and Nature Report 2024, p.19-20"
  },
  
  // Targets and commitments
  targets: {
    scope3OccupierReduction: { target: 55, unit: "%", by: 2030, baseYear: 2019, progress: 30 },
    supplierEngagement: { target: 100, unit: "%", by: 2026, progress: 65, description: "Suppliers with science-based targets" },
    realEstateNetZero: { by: 2050, description: "Real estate equity portfolio" },
    portfolioTemperature: { current: 2.4, target: 1.5, unit: "°C", description: "Implied portfolio temperature alignment" },
    source: "L&G Climate and Nature Report 2024, p.23-29"
  },
  
  // Housing sustainability
  housing: {
    lgahGasFree: { value: 61, unit: "%", description: "LGAH homes transacted that are gas-free" },
    sbtrGasFree: { value: 100, unit: "%", description: "SBTR homes that are gas-free" },
    millfieldGreen: { description: "UK's first net zero carbon retirement community", opened: "early 2024" },
    groundSourceHeatPumps: { supplier: "Kensa (L&G portfolio company)" },
    source: "L&G Climate and Nature Report 2024, p.20"
  },
  
  // Climate context
  context: {
    warmestYearOnRecord: 2024,
    temperatureBreached: { value: 1.5, unit: "°C", description: "First calendar year to breach 1.5°C" },
    probabilityOf1_5Breach: { timeframe: "2030s", likelihood: "highly likely" },
    worstCaseWarming: { value: 3.1, unit: "°C", description: "Temperature increase on current trajectory" },
    source: "L&G Climate and Nature Report 2024, p.22"
  },
  
  // Nature initiatives
  nature: {
    ecuadorDebtConversion: { value: 460, unit: "$m", duration: "17 years", description: "Debt conversion for nature in Ecuador" },
    tnfdAdopter: true,
    biodiversityNetGain: { aligned: true, description: "BNG planning requirements alignment" },
    source: "L&G Climate and Nature Report 2024, p.22"
  }
};

// ============================================================================
// RISK MANAGEMENT DATA - From Risk Management Supplement 2024
// ============================================================================

export const riskData = {
  // Risk landscape overview
  overview: {
    largestExposures: ["Credit", "Longevity"],
    measurementBasis: "Undiversified solvency capital",
    cro: "Chris Knight",
    philosophy: "Our risk management approach supports informed risk taking by our businesses",
    source: "L&G Risk Management Supplement 2024, p.1-2"
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
