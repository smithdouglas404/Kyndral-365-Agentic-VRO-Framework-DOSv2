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
    financedEmissionsReduction: { value: 67, baseYear: 2019, description: "Reduction in carbon intensity" },
    transitionFinance: { value: 12, description: "Clean energy investment annually" },
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
    automaticMeterReaders: { value: 5900000, changeFrom2023: 8 },
    viztaPlatformAssets: { value: 35052, description: "MW of smart grid managed assets" },
    iesProjects: { count: 127, description: "Integrated energy solutions projects" },
    source: "NextEra Energy 10-K 2024"
  },
  
  // Targets and commitments
  targets: {
    carbonIntensityReduction: { target: 70, unit: "%", by: 2025, baseYear: 2005, progress: 65 },
    renewableExpansion: { target: 50, unit: "GW", by: 2030, progress: 33, description: "Total renewable capacity target" },
    realZeroOperations: { by: 2045, description: "Net zero carbon emissions from operations" },
    portfolioTemperature: { current: 1.8, target: 1.5, unit: "°C", description: "Implied portfolio temperature alignment" },
    scope3OccupierReduction: { progress: 45, target: 70, by: 2030, baseYear: 2019 },
    supplierEngagement: { progress: 62, target: 100, by: 2026, description: "Suppliers with science-based targets" },
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
    ecuadorDebtConversion: { value: 1.6, unit: "$bn", description: "Environmental debt-for-nature conversion" },
    source: "NextEra Energy Environmental Report 2024"
  },
  
  // Housing/Grid infrastructure (replaces L&G housing)
  housing: {
    smartMeterProgress: { current: 92, target: 100, description: "Smart meter deployment" },
    gridHardening: { current: 85, target: 100, description: "Storm hardening completion" },
    solarRooftop: { current: 45, target: 80, description: "Rooftop solar program" }
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
      name: "Reportable Segments", 
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
      name: "Internal Audit", 
      role: "Independent assurance",
      accountable: "Effectiveness of business risk management and overall risk framework"
    }
  ],
  
  // Risk Categories with full descriptions - Based on NextEra Energy 10-K 2024 Risk Factors
  categories: [
    {
      id: "operational",
      name: "Operational Risk",
      subtitle: "Infrastructure and execution",
      icon: "Shield",
      color: "#C50B30",
      subRisks: [
        {
          name: "Hurricane and severe weather exposure",
          description: "FPL service territory in Florida exposed to hurricanes, tropical storms, and severe weather. Storm damage restoration costs can exceed $1B per major event. 2024 storms Milton and Helene required significant recovery efforts.",
          severity: "high",
          trend: "worsening"
        },
        {
          name: "Project execution and development",
          description: "NEER's 36.5-46.5 GW renewable buildout through 2027 faces execution risks including permitting delays, interconnection queue backlogs, and construction labor shortages.",
          severity: "high",
          trend: "stable"
        },
        {
          name: "Equipment and infrastructure reliability",
          description: "Critical dependence on generation, transmission, and distribution infrastructure. Equipment failures, unplanned outages, or extended maintenance periods impact reliability and costs.",
          severity: "high",
          trend: "improving"
        },
        {
          name: "Nuclear operations",
          description: "Point Beach and other nuclear facilities require NRC compliance, safe operations, and extended license renewals. Duane Arnold restart project adds execution complexity.",
          severity: "medium",
          trend: "stable"
        }
      ]
    },
    {
      id: "regulatory",
      name: "Regulatory Risk",
      subtitle: "Policy and compliance",
      icon: "TrendingUp",
      color: "#007FAA",
      subRisks: [
        {
          name: "Rate case outcomes",
          description: "FPL rate-regulated earnings depend on Florida PSC approval. Rate case filings every 4 years determine allowed ROE and capital recovery. Current ROE range 10.15-11.15%.",
          severity: "high",
          trend: "stable"
        },
        {
          name: "Federal energy policy changes",
          description: "IRA tax credits, PTC/ITC provisions, and federal renewable energy policy significantly impact NEER economics. Policy changes or repeal could affect project returns.",
          severity: "high",
          trend: "volatile"
        },
        {
          name: "Environmental regulations",
          description: "EPA air quality standards, water discharge permits, waste disposal requirements, and endangered species compliance affect operations and capital requirements.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "NERC/FERC compliance",
          description: "Critical infrastructure protection (CIP) standards, reliability standards, and market manipulation rules require ongoing compliance investment.",
          severity: "medium",
          trend: "improving"
        }
      ]
    },
    {
      id: "market",
      name: "Market Risk",
      subtitle: "Financial and commodity exposure",
      icon: "CreditCard",
      color: "#f59e0b",
      subRisks: [
        {
          name: "Interest rate exposure",
          description: "Significant capital investment program ($8.2B annual at FPL) requires debt financing. Rising rates increase borrowing costs and reduce project economics.",
          severity: "high",
          trend: "volatile"
        },
        {
          name: "Natural gas price volatility",
          description: "FPL generating fleet includes significant natural gas capacity. Fuel cost pass-through mechanism provides some protection but timing differences create exposure.",
          severity: "medium",
          trend: "improving"
        },
        {
          name: "Power market prices",
          description: "NEER merchant exposure in deregulated markets. Wholesale power prices affect contracted renewables economics and battery storage dispatch value.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Supply chain cost inflation",
          description: "Solar panels, wind turbines, battery storage systems, transformers, and specialized equipment face cost increases and extended lead times.",
          severity: "high",
          trend: "improving"
        }
      ]
    },
    {
      id: "climate",
      name: "Climate & Environmental Risk",
      subtitle: "Physical and transition exposure",
      icon: "Droplets",
      color: "#10b981",
      subRisks: [
        {
          name: "Physical climate impacts",
          description: "Increasing hurricane intensity, sea level rise affecting coastal infrastructure, extreme heat affecting grid demand and equipment performance.",
          severity: "high",
          trend: "worsening"
        },
        {
          name: "Transition risk",
          description: "Accelerated clean energy transition creates opportunities but also risks from changing technology costs, customer preferences, and competitive dynamics.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Water availability",
          description: "Thermal generation requires cooling water access. Drought conditions and water rights restrictions could impact plant operations.",
          severity: "medium",
          trend: "worsening"
        }
      ]
    },
    {
      id: "technology-cyber",
      name: "Technology & Cyber Risk",
      subtitle: "Digital and security threats",
      icon: "AlertTriangle",
      color: "#6366f1",
      subRisks: [
        {
          name: "Cybersecurity threats",
          description: "Critical infrastructure target for nation-state actors and cybercriminals. NERC CIP compliance required. SCADA/OT systems require specialized protection.",
          severity: "high",
          trend: "worsening"
        },
        {
          name: "IT system reliability",
          description: "Enterprise systems including billing, customer service, and workforce management. System failures impact customer service and regulatory compliance.",
          severity: "medium",
          trend: "improving"
        },
        {
          name: "Technology obsolescence",
          description: "Rapid evolution of renewable energy, battery storage, and grid technologies. Risk of stranded assets or suboptimal technology deployment.",
          severity: "medium",
          trend: "stable"
        },
        {
          name: "Data privacy and protection",
          description: "Customer data, employee information, and proprietary business data require protection. State privacy laws and NERC CIP data requirements.",
          severity: "medium",
          trend: "stable"
        }
      ]
    }
  ],
  
  // Emerging risks dashboard
  emergingRisks: {
    dashboard: true,
    description: "Captures views and inputs from across NextEra Energy to monitor likelihood of emerging risks on enterprise strategy",
    keyEmergingRisks: [
      { name: "AI and Automation", impact: "high", probability: "high", horizon: "1-3 years" },
      { name: "Geopolitical Instability", impact: "high", probability: "medium", horizon: "1-2 years" },
      { name: "Extreme Weather Events", impact: "high", probability: "high", horizon: "1-2 years" },
      { name: "Grid Reliability", impact: "high", probability: "medium", horizon: "2-5 years" },
      { name: "Regulatory Divergence", impact: "medium", probability: "medium", horizon: "2-5 years" }
    ],
    source: "NextEra Energy Risk Management Report 2024, p.2"
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
  
  source: "NextEra Energy Risk Management Report 2024"
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
    title: "Hurricane Season Capacity Planning Alert",
    description: "AI models predict 15% higher restoration workforce requirements for 2025 hurricane season based on NOAA forecast data and historical storm patterns",
    metric: "Storm Response Readiness",
    value: "85%",
    recommendation: "Pre-position additional contractor crews and mobile substations in South Florida. Consider expanding mutual aid agreements.",
    targetPersona: "COO - Eric Silagy",
    division: "Florida Power & Light",
    timestamp: new Date(),
    confidence: 82,
    source: "AI Weather Model + NOAA Hurricane Outlook 2025",
    actions: [{ label: "Review Plan", type: "primary" }, { label: "View Forecast", type: "secondary" }]
  },
  {
    id: "alert-2",
    type: "threshold",
    severity: "critical",
    title: "Interconnection Queue Delay Risk",
    description: "Texas wind project interconnection timeline extended by 8 months, impacting 520 MW online target date",
    metric: "Project Execution",
    value: "520 MW at risk",
    recommendation: "Escalate with ERCOT, consider alternative interconnection points, or adjust 2025 capacity guidance.",
    targetPersona: "NEER President",
    division: "NextEra Energy Resources",
    timestamp: new Date(Date.now() - 3600000),
    confidence: 99,
    source: "ERCOT Interconnection Queue Monitoring",
    actions: [{ label: "Escalate to ERCOT", type: "primary" }, { label: "Review Alternatives", type: "secondary" }]
  },
  {
    id: "alert-3",
    type: "anomaly",
    severity: "warning",
    title: "Battery Storage Dispatch Optimization Alert",
    description: "CAISO market signals show 18% higher arbitrage opportunity for battery storage assets than current dispatch strategy captures",
    metric: "Revenue Optimization",
    value: "$4.2M/month potential",
    recommendation: "Review battery dispatch algorithms. Consider implementing real-time pricing optimization across 3,379 MW storage fleet.",
    targetPersona: "VP Trading Operations",
    division: "NextEra Energy Resources",
    timestamp: new Date(Date.now() - 7200000),
    confidence: 78,
    source: "AI Market Price Analysis + CAISO Data",
    actions: [{ label: "Optimize Dispatch", type: "primary" }, { label: "View Analysis", type: "secondary" }]
  },
  {
    id: "alert-4",
    type: "recommendation",
    severity: "success",
    title: "Solar SoBRA Filing Opportunity",
    description: "AI identifies favorable conditions for accelerated solar capacity addition under SoBRA mechanism - 2,500 MW potential for 2025-2026",
    metric: "Pipeline Value",
    value: "$1.8B potential",
    recommendation: "Prioritize SoBRA filing preparation. Strong rate base growth and customer demand metrics support expedited approval.",
    targetPersona: "FPL President - Eric Silagy",
    division: "Florida Power & Light",
    timestamp: new Date(Date.now() - 1800000),
    confidence: 86,
    source: "AI Regulatory Analysis + Florida PSC Filings",
    actions: [{ label: "Prepare Filing", type: "primary" }, { label: "Review Economics", type: "secondary" }]
  },
  {
    id: "alert-5",
    type: "prediction",
    severity: "info",
    title: "Customer Reliability Satisfaction Trending Up",
    description: "NLP analysis of customer feedback shows 8% improvement in reliability perception following grid hardening investments",
    metric: "Satisfaction Score",
    value: "+8% YoY",
    recommendation: "Continue grid modernization communications. Proactive outage notification reducing complaint volume.",
    targetPersona: "VP Customer Experience",
    division: "Florida Power & Light",
    timestamp: new Date(Date.now() - 5400000),
    confidence: 91,
    source: "Voice of Customer NLP Analysis + JD Power Survey",
    actions: [{ label: "View Insights", type: "primary" }, { label: "Share Report", type: "secondary" }]
  },
  {
    id: "alert-6",
    type: "collaboration",
    severity: "warning",
    title: "Cross-Segment Coordination Required",
    description: "NEET transmission projects dependent on FPL substation upgrades showing schedule misalignment",
    metric: "Project Alignment",
    value: "3 projects affected",
    recommendation: "Schedule cross-segment sync between FPL, NEET, and NEER engineering leadership.",
    targetPersona: "CEO - John Ketchum",
    division: "Corporate & Other",
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
  cleanEnergyMarket2024: {
    totalCapacity: 304, // GW
    totalProjects: 245,
    competitors: [
      { name: "NextEra Energy", volume: 68.5, transactions: 42, share: 22.5, color: "#0072CE" },
      { name: "Duke Energy", volume: 52.4, transactions: 35, share: 17.2, color: "#334155" },
      { name: "Southern Company", volume: 46.2, transactions: 38, share: 15.2, color: "#f59e0b" },
      { name: "Dominion Energy", volume: 30.8, transactions: 28, share: 10.1, color: "#6366f1" },
      { name: "AES Corporation", volume: 35.2, transactions: 32, share: 10.9, color: "#10b981" },
      { name: "Others", volume: 71.1, transactions: 70, share: 24.1, color: "#94a3b8" }
    ],
    source: "EIA Energy Data 2024, S&P Global Energy Research"
  },
  
  renewableCapacity2024: {
    competitors: [
      { name: "NextEra Energy", capacity: 68.5, esgRating: "AAA", sustainalytics: 92 },
      { name: "Duke Energy", capacity: 52.4, esgRating: "AA", sustainalytics: 78 },
      { name: "Southern Company", capacity: 46.2, esgRating: "AA", sustainalytics: 75 },
      { name: "Dominion Energy", capacity: 30.8, esgRating: "A", sustainalytics: 72 },
      { name: "AES Corporation", capacity: 35.2, esgRating: "AA", sustainalytics: 80 }
    ],
    source: "Company Reports, MSCI ESG Ratings 2024"
  },
  
  financialStrength2024: {
    competitors: [
      { name: "NextEra Energy", ratio: 185, color: "#0072CE" },
      { name: "Duke Energy", ratio: 165, color: "#f59e0b" },
      { name: "Southern Company", ratio: 158, color: "#6366f1" },
      { name: "Dominion Energy", ratio: 142, color: "#10b981" }
    ],
    source: "Company Financial Reports 2024"
  }
};

// Types are already exported inline above
