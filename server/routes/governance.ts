/**
 * GOVERNANCE & RISK FRAMEWORK API
 * Serves risk categories, governance framework, and compliance data
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';

// Risk framework data - centralized source of truth
// Source: NextEra Energy Form 10-K 2024, Risk Management Report 2024
const riskFramework = {
  overview: {
    largestExposures: ["Operational", "Regulatory", "Market"],
    measurementBasis: "Enterprise risk capital",
    cro: "Rebecca Kujawa",
    philosophy: "Our risk management approach supports strategic growth while protecting stakeholder value",
    source: "NextEra Energy 10-K 2024, Risk Factors"
  },

  threeLines: [
    {
      line: 1,
      name: "Reportable Segments",
      role: "Operational risk ownership within business units",
      accountable: "Managing day-to-day risks per enterprise risk policies (FPL, NEER, Corporate)"
    },
    {
      line: 2,
      name: "Risk Management & Compliance",
      role: "Independent oversight of enterprise risks",
      accountable: "Regulatory compliance, NERC CIP, environmental and safety oversight"
    },
    {
      line: 3,
      name: "Internal Audit",
      role: "Independent assurance and validation",
      accountable: "Effectiveness of risk management framework and regulatory compliance"
    }
  ],

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

export function registerGovernanceRoutes(app: Express, storage: IStorage): void {
  /**
   * GET /api/governance/risk-framework
   * Get enterprise risk governance framework and risk categories
   */
  app.get('/api/governance/risk-framework', async (req, res) => {
    try {
      res.json({
        success: true,
        riskData: riskFramework,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Governance] Risk framework error:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch risk framework',
      });
    }
  });

  console.log('[Governance] Governance routes registered');
}
