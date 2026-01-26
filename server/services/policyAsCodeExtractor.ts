import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db.js";
import { ontologyClasses, ontologyIndustryProfiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getIndustryByGICS, getIndustryByNAICS, getIndustryExtractionPrompt, type IndustryProfile } from './industryProfileLoader.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export interface ExtractionResult {
  financialMetrics: FinancialMetric[];
  strategicObjectives: StrategicObjective[];
  organizationalUnits: OrganizationalUnit[];
  riskFactors: RiskFactor[];
  governanceRules: GovernanceRule[];
  industrySpecificKPIs: IndustryKPI[];
}

export interface FinancialMetric {
  metricName: string;
  metricCode: string;
  category: 'financial' | 'operational' | 'strategic' | 'customer' | 'environmental';
  subcategory?: string;
  description: string;
  unitOfMeasure: string;
  dataType: 'currency' | 'percentage' | 'integer' | 'decimal';
  organizationalUnit?: string;
  currentValue?: number;
  priorYearValue?: number;
  targetValue?: number;
  targetRangeMin?: number;
  targetRangeMax?: number;
  targetSource?: string;
  reportingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  calculationFormula?: string;
  isGAAP: boolean;
  sourcePage?: number;
  sourceText: string;
  confidence: number;
}

export interface StrategicObjective {
  objectiveName: string;
  objectiveDescription: string;
  category: 'growth' | 'efficiency' | 'innovation' | 'sustainability' | 'compliance';
  startDate?: string;
  targetDate?: string;
  keyResults: Array<{
    keyResultName: string;
    description: string;
    targetValue: number;
    unitOfMeasure: string;
    dueDate?: string;
  }>;
  organizationalUnit?: string;
  sourcePage?: number;
  sourceText: string;
  confidence: number;
}

export interface OrganizationalUnit {
  unitName: string;
  unitCode: string;
  unitType: 'segment' | 'division' | 'business_unit' | 'geography' | 'department';
  description: string;
  primaryActivities: string[];
  geographicScope?: {
    regions?: string[];
    countries?: string[];
    states?: string[];
  };
  revenueContributionPct?: number;
  operatingIncomeContributionPct?: number;
  metrics?: Array<{
    name: string;
    value: number;
    unit: string;
  }>;
  sourceText: string;
  confidence: number;
}

export interface RiskFactor {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'operational' | 'market' | 'regulatory' | 'environmental' | 'cyber' | 'financial';
  mitigation?: string;
  owner?: string;
  sourceText: string;
  confidence: number;
}

export interface GovernanceRule {
  ruleCategory: 'financial' | 'governance' | 'project' | 'compliance' | 'operational';
  ruleSubcategory?: string;
  ruleName: string;
  ruleDescription: string;
  ruleLogic: {
    type: 'approval_requirement' | 'threshold' | 'validation' | 'mandatory_process';
    condition: string;
    action: string;
    parameters: Record<string, any>;
  };
  enforcementLevel: 'blocking' | 'warning' | 'advisory';
  sourceSection: string;
  sourcePage?: number;
  sourceText: string;
  confidence: number;
}

export interface IndustryKPI {
  kpiName: string;
  value: number;
  unit: string;
  segment?: string;
  industrySpecific: boolean;
  sourceText: string;
  confidence: number;
}

/**
 * Fetch and parse PDF/HTML document from URL
 */
async function fetchAndParseDocument(url: string): Promise<string> {
  // For MVP, we'll use Claude's vision for PDFs or simple text extraction for HTML
  // In production, you'd use proper PDF parsing libraries

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('text/html')) {
      const html = await response.text();
      // Strip HTML tags (basic implementation)
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    } else if (contentType?.includes('pdf')) {
      // For PDFs, we'd need to convert to images and use Claude's vision
      // Or use a PDF parsing library like pdf-parse
      console.warn('PDF parsing not fully implemented - using placeholder');
      return `[PDF Content from ${url}]`;
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    throw new Error(`Failed to fetch document from ${url}`);
  }
}

/**
 * Find specific sections in the document
 */
function findSection(content: string, sectionKeywords: string[]): string {
  const lowerContent = content.toLowerCase();

  // Split by common section markers
  const sections = content.split(/\n\s*(ITEM \d+\.|Part [IVX]+|[A-Z][A-Z\s]{10,})\n/i);

  let bestMatch = '';
  let bestScore = 0;

  for (const section of sections) {
    const sectionLower = section.toLowerCase();
    let score = 0;

    for (const keyword of sectionKeywords) {
      if (sectionLower.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = section;
    }
  }

  // Return best match or first 50k chars
  return bestMatch || content.substring(0, 50000);
}

/**
 * Extract organizational structure using SAFe ontology
 */
async function extractOrganizationalStructure(
  documentContent: string,
  industryCode?: string
): Promise<OrganizationalUnit[]> {
  const section = findSection(documentContent, [
    'business segments',
    'segment information',
    'operating segments',
    'reportable segments',
    'business overview'
  ]);

  const prompt = `You are analyzing an annual report to extract organizational structure that maps to the SAFe ontology.

${industryCode ? `Industry Context: ${industryCode}` : ''}

DOCUMENT SECTION:
${section.substring(0, 15000)}

TASK:
Extract all organizational segments, business units, or divisions. For each unit, provide:

1. Unit name (official name)
2. Unit code (abbreviation, e.g., "Regional Utility", "Renewables Division")
3. Unit type: segment|division|business_unit|geography|department
4. Description of primary activities
5. Geographic scope (regions, countries, states)
6. Revenue contribution % (if mentioned)
7. Operating income contribution % (if mentioned)
8. Key metrics mentioned for this unit

CRITICAL REQUIREMENTS:
- Only extract clearly defined operational entities
- Include confidence score (0.0 to 1.0) for each extraction
- Cite the specific text where you found each piece

OUTPUT FORMAT (JSON only, no markdown):
{
  "organizational_units": [
    {
      "unit_name": "exact name from document",
      "unit_code": "abbreviation",
      "unit_type": "segment",
      "description": "brief description",
      "primary_activities": ["activity 1", "activity 2"],
      "geographic_scope": {
        "regions": ["North America"],
        "countries": ["USA"],
        "states": ["Florida"]
      },
      "revenue_contribution_pct": 45.5,
      "operating_income_contribution_pct": 38.2,
      "metrics": [
        {"name": "Customer Accounts", "value": 5.9, "unit": "M"}
      ],
      "source_text": "exact quote",
      "confidence": 0.95
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });

  return parseAIResponse(response, 'organizational_units');
}

/**
 * Extract financial and operational metrics
 */
async function extractMetrics(
  documentContent: string,
  industryCode?: string
): Promise<FinancialMetric[]> {
  const section = findSection(documentContent, [
    'management discussion',
    'management\'s discussion and analysis',
    'key performance indicators',
    'financial highlights',
    'operating statistics',
    'selected financial data'
  ]);

  // Load industry profile for context
  let industryContext = '';
  if (industryCode) {
    const industry = getIndustryByGICS(industryCode) || getIndustryByNAICS(industryCode);
    if (industry) {
      industryContext = `
INDUSTRY CONTEXT (${industry.name}):
Expected metrics for this industry include:
${industry.standardMetrics.slice(0, 8).map((m, i) => `${i + 1}. ${m.name} (${m.unit}) - ${m.description}`).join('\n')}

Prioritize finding these industry-standard metrics in the document.
`;
    }
  }

  const prompt = `You are analyzing an annual report to extract key performance metrics mapped to the SAFe KPI ontology class.

${industryContext}

DOCUMENT SECTION:
${section.substring(0, 15000)}

TASK:
Extract all key metrics. For each metric:

1. Metric name (official terminology)
2. Metric code (short code, e.g., "ADJ_EPS", "OPERATING_MARGIN_Regional Utility")
3. Category: financial|operational|strategic|customer|environmental
4. Subcategory (e.g., profitability, efficiency, growth)
5. Description/definition
6. Unit of measure (USD, percentage, MW, customers, etc.)
7. Data type: currency|percentage|integer|decimal
8. Current value
9. Prior year value (if available)
10. Target or guidance (if mentioned)
11. Reporting frequency: daily|weekly|monthly|quarterly|annually
12. Organizational unit (company-wide or specific segment)
13. Calculation formula (if provided)
14. Is GAAP vs Non-GAAP

FOCUS ON:
- Metrics in tables or highlighted sections
- Metrics with historical trends
- Forward guidance metrics
- Segment-specific metrics

OUTPUT FORMAT (JSON only):
{
  "metrics": [
    {
      "metric_name": "Adjusted Earnings Per Share",
      "metric_code": "ADJ_EPS",
      "category": "financial",
      "subcategory": "profitability",
      "description": "EPS excluding one-time charges",
      "unit_of_measure": "USD",
      "data_type": "currency",
      "organizational_unit": "company-wide",
      "current_value": 3.45,
      "prior_year_value": 3.12,
      "target_value": 3.75,
      "target_range_min": 3.60,
      "target_range_max": 3.90,
      "target_source": "2025 Guidance",
      "reporting_frequency": "quarterly",
      "calculation_formula": "Net income adjusted for X, Y, Z divided by shares",
      "is_gaap": false,
      "source_page": 45,
      "source_text": "exact quote",
      "confidence": 0.92
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });

  return parseAIResponse(response, 'metrics');
}

/**
 * Extract strategic objectives and map to SAFe Strategic Themes + OKRs
 */
async function extractStrategicObjectives(
  documentContent: string
): Promise<StrategicObjective[]> {
  const section = findSection(documentContent, [
    'strategy',
    'strategic priorities',
    'outlook',
    'future plans',
    'capital deployment',
    'growth initiatives',
    'letter to shareholders',
    'executive summary'
  ]);

  const prompt = `You are analyzing an annual report to extract strategic objectives that map to SAFe Strategic Themes and OKRs.

DOCUMENT SECTION:
${section.substring(0, 15000)}

TASK:
Extract strategic objectives with measurable key results. For each:

1. Objective name and description
2. Category: growth|efficiency|innovation|sustainability|compliance
3. Timeline (start date, target date)
4. Specific measurable key results with targets
5. Related organizational units

LOOK FOR:
- Multi-year strategic plans
- Specific targets ("Add 5 GW capacity by 2026")
- Investment commitments
- Market expansion goals
- Operational improvement targets

OUTPUT FORMAT (JSON only):
{
  "strategic_objectives": [
    {
      "objective_name": "Expand renewable energy portfolio",
      "objective_description": "Significantly increase renewable generation capacity",
      "category": "growth",
      "start_date": "2024-01-01",
      "target_date": "2026-12-31",
      "organizational_unit": "Energy Resources",
      "key_results": [
        {
          "key_result_name": "Add solar capacity",
          "description": "Deploy new solar generation",
          "target_value": 6.5,
          "unit_of_measure": "GW",
          "due_date": "2026-12-31"
        }
      ],
      "source_page": 12,
      "source_text": "exact quote",
      "confidence": 0.91
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });

  return parseAIResponse(response, 'strategic_objectives');
}

/**
 * Extract governance rules
 */
async function extractGovernanceRules(
  documentContent: string
): Promise<GovernanceRule[]> {
  const section = findSection(documentContent, [
    'corporate governance',
    'risk factors',
    'risk management',
    'internal controls',
    'compliance',
    'capital allocation'
  ]);

  const prompt = `Extract business rules and governance policies that should be enforced in the system.

DOCUMENT SECTION:
${section.substring(0, 15000)}

LOOK FOR:
- Capital expenditure approval thresholds
- Board approval requirements
- Risk limits and triggers
- Compliance requirements
- Project classification rules
- Financial covenants

OUTPUT FORMAT (JSON only):
{
  "rules": [
    {
      "rule_category": "governance",
      "rule_subcategory": "capital_allocation",
      "rule_name": "Major Capital Project Approval",
      "rule_description": "Board approval required for projects >$500M",
      "rule_logic": {
        "type": "approval_requirement",
        "condition": "epic.estimated_cost > 500000000",
        "action": "require_board_approval",
        "parameters": {
          "approval_body": "Board of Directors",
          "advance_notice_days": 30
        }
      },
      "enforcement_level": "blocking",
      "source_section": "Corporate Governance",
      "source_page": 87,
      "source_text": "exact quote",
      "confidence": 0.88
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });

  return parseAIResponse(response, 'rules');
}

/**
 * Extract risk factors
 */
async function extractRiskFactors(
  documentContent: string
): Promise<RiskFactor[]> {
  const section = findSection(documentContent, [
    'risk factors',
    'risk management',
    'principal risks'
  ]);

  const prompt = `Extract material risk factors from the document.

DOCUMENT SECTION:
${section.substring(0, 15000)}

OUTPUT FORMAT (JSON only):
{
  "risks": [
    {
      "name": "Hurricane and Severe Weather Exposure",
      "description": "Full description of risk",
      "severity": "high",
      "category": "operational",
      "mitigation": "Mitigation strategy if mentioned",
      "source_text": "exact quote",
      "confidence": 0.96
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });

  return parseAIResponse(response, 'risks');
}

/**
 * Parse AI response and validate
 */
function parseAIResponse(response: Anthropic.Message, expectedKey: string): any[] {
  try {
    const content = response.content[0];
    if (content.type === 'text') {
      const cleaned = content.text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed[expectedKey] || !Array.isArray(parsed[expectedKey])) {
        console.error(`Invalid response structure: missing ${expectedKey} array`);
        return [];
      }

      return parsed[expectedKey];
    }
  } catch (error) {
    console.error('Parse error:', error);
  }
  return [];
}

/**
 * Main extraction orchestrator
 */
export async function extractPolicyAsCode(
  documentUrl: string,
  companyId: string,
  industryCode?: string
): Promise<ExtractionResult> {
  console.log(`Starting Policy-as-Code extraction for company ${companyId}`);

  // Fetch and parse document
  const documentContent = await fetchAndParseDocument(documentUrl);

  // Extract all data types in parallel
  const [
    organizationalUnits,
    financialMetrics,
    strategicObjectives,
    governanceRules,
    riskFactors
  ] = await Promise.all([
    extractOrganizationalStructure(documentContent, industryCode),
    extractMetrics(documentContent, industryCode),
    extractStrategicObjectives(documentContent),
    extractGovernanceRules(documentContent),
    extractRiskFactors(documentContent)
  ]);

  console.log(`Extraction complete:`, {
    organizationalUnits: organizationalUnits.length,
    financialMetrics: financialMetrics.length,
    strategicObjectives: strategicObjectives.length,
    governanceRules: governanceRules.length,
    riskFactors: riskFactors.length
  });

  return {
    organizationalUnits,
    financialMetrics,
    strategicObjectives,
    governanceRules,
    riskFactors,
    industrySpecificKPIs: [] // To be enhanced based on industry
  };
}
