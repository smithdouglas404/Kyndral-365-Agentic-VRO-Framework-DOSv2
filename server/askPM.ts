import Anthropic from "@anthropic-ai/sdk";
import { analyzeImpact, parseWhatIfQuery, generateImpactSummary } from "./impactAnalysis";
import {
  strategicThemes,
  valueStreams,
  portfolioEpics,
  portfolioOKRs,
  portfolioKPIs,
  arts,
  programIncrements,
  teams,
  teamMembers,
  iterations,
  features,
  stories,
  tasks,
  dependencies,
  financialSnapshots,
  riskRegister,
  okrAlignments
} from "../client/src/lib/safe6Data";

const anthropic = new Anthropic();

// Build SAFe 6.0 hierarchy context for AI
function buildSAFe6Context(): string {
  const portfolioSummary = `
PORTFOLIO LEVEL (PPM):
Strategic Themes (${strategicThemes.length}):
${strategicThemes.map(t => `  - ${t.name}: ${t.budgetAllocation}% budget | Status: ${t.status}`).join('\n')}

Value Streams (${valueStreams.length}):
${valueStreams.map(vs => `  - ${vs.name}: ${vs.linkedARTs.length} ARTs | Budget: £${vs.annualBudget}M`).join('\n')}

Portfolio Epics (${portfolioEpics.length}):
${portfolioEpics.map(e => `  - ${e.name}: £${e.estimatedCost}M | Status: ${e.status} | WSJF: ${e.wsjfScore}`).join('\n')}

Portfolio OKRs (${portfolioOKRs.length}):
${portfolioOKRs.map(o => {
  const achieved = o.keyResults.filter(kr => kr.status === 'achieved').length;
  return `  - ${o.objective} (${achieved}/${o.keyResults.length} KRs achieved): Status: ${o.status}`;
}).join('\n')}

Portfolio KPIs (${portfolioKPIs.length}):
${portfolioKPIs.map(k => `  - ${k.name}: ${k.currentValue}/${k.targetValue} ${k.unit} | Trend: ${k.trend}`).join('\n')}
`;

  const artSummary = `
ART LEVEL (Program):
Agile Release Trains (${arts.length}):
${arts.map(art => `  - ${art.name}: ${art.teams.length} teams | Value Stream: ${valueStreams.find(vs => vs.linkedARTs.includes(art.id))?.name || 'N/A'}`).join('\n')}

Program Increments (${programIncrements.length}):
${programIncrements.map(pi => {
  const achieved = pi.piObjectives.filter(o => o.status === 'achieved').length;
  return `  - ${pi.name}: ${pi.status} | ${achieved}/${pi.piObjectives.length} objectives achieved`;
}).join('\n')}

Features (${features.length}):
${features.map(f => `  - ${f.title}: ${f.status} | Epic: ${portfolioEpics.find(e => e.linkedFeatures.includes(f.id))?.name || 'N/A'}`).join('\n')}
`;

  const teamSummary = `
TEAM LEVEL:
Teams (${teams.length}):
${teams.map(t => `  - ${t.name}: ${t.capacity} pts/sprint | ${t.members.length} members`).join('\n')}

Team Members (${teamMembers.length}):
${teamMembers.map(m => `  - ${m.name}: ${m.role} | £${m.dailyCostRate}/day | ${m.skills.join(', ')}`).join('\n')}

Stories (${stories.length}):
${stories.map(s => `  - ${s.title}: ${s.storyPoints} pts | ${s.status} | Feature: ${features.find(f => f.id === s.featureId)?.title || 'N/A'}`).join('\n')}

Tasks (${tasks.length}):
${tasks.map(t => {
  const assignee = teamMembers.find(m => m.id === t.assigneeId);
  return `  - ${t.title}: ${t.estimatedHours}h | ${t.status} | Assignee: ${assignee?.name || 'Unassigned'}`;
}).join('\n')}
`;

  const crossCuttingSummary = `
CROSS-CUTTING CONCERNS:
Dependencies (${dependencies.length}):
${dependencies.map(d => {
  return `  - ${d.sourceName} → ${d.targetName}: ${d.health} (${d.type})`;
}).join('\n')}

Financial Snapshots (${financialSnapshots.length}):
${financialSnapshots.map(f => {
  return `  - ${f.entityName}: Budget £${f.totalBudget}M | Actual £${f.actualSpend}M | EV: £${f.earnedValue}M | SPI: ${f.schedulePerformanceIndex.toFixed(2)} | CPI: ${f.costPerformanceIndex.toFixed(2)}`;
}).join('\n')}

Risk Register (${riskRegister.length}):
${riskRegister.map(r => `  - ${r.title}: ${r.category} | Status: ${r.status} | Impact: ${r.impact}`).join('\n')}
`;

  return portfolioSummary + artSummary + teamSummary + crossCuttingSummary;
}

// Server-side project data for context building
// This is a simplified version of the client data to avoid cross-import issues
const projectSummaries = [
  { id: 'proj-prt-platform', name: 'PRT Platform Modernization', bu: 'Institutional Retirement', status: 'amber', priority: 'critical', stage: 'implementing', budget: 8.5, spent: 4.2, roi: 45, roiConf: 78, ftes: 5.3, velocity: 42, deps: ['proj-data-foundation', 'proj-api-gateway'], riskFlags: ['Data Lake dependency health degraded', 'Key architect has competing priorities'], aiRecs: ['Consider parallel-path development', 'Data Lake dependency on amber'] },
  { id: 'proj-member-portal', name: 'Pensioner Digital Portal', bu: 'Institutional Retirement', status: 'green', priority: 'high', stage: 'implementing', budget: 3.2, spent: 1.4, roi: 8.5, roiConf: 85, ftes: 3.5, velocity: 38, deps: ['proj-prt-platform'], riskFlags: [], aiRecs: ['Portal adoption trending above forecast', 'Prioritize address change feature'] },
  { id: 'proj-bulk-annuity-automation', name: 'Bulk Annuity Processing Automation', bu: 'Institutional Retirement', status: 'green', priority: 'high', stage: 'analyzing', budget: 2.8, spent: 0.28, roi: 12, roiConf: 72, ftes: 1.5, velocity: 0, deps: ['proj-prt-platform'], riskFlags: [], aiRecs: ['Early engagement with schemes recommended', 'Consider RPA for legacy integration'] },
  { id: 'proj-trading-platform', name: 'Next-Gen Trading Platform', bu: 'Asset Management', status: 'amber', priority: 'critical', stage: 'implementing', budget: 15, spent: 9.5, roi: 35, roiConf: 68, ftes: 4.0, velocity: 48, deps: ['proj-data-foundation', 'proj-risk-engine'], riskFlags: ['Market data dependency RED', 'Fixed Income milestone at-risk'], aiRecs: ['CRITICAL: Market data dependency blocking', 'Consider phased derivatives rollout'] },
  { id: 'proj-client-reporting', name: 'Institutional Client Reporting Platform', bu: 'Asset Management', status: 'green', priority: 'high', stage: 'implementing', budget: 2.5, spent: 1.6, roi: 6, roiConf: 82, ftes: 2.0, velocity: 35, deps: [], riskFlags: [], aiRecs: ['ESG metrics highest priority', 'Template adoption accelerating'] },
  { id: 'proj-risk-engine', name: 'Real-Time Risk Analytics Engine', bu: 'Asset Management', status: 'amber', priority: 'critical', stage: 'implementing', budget: 8, spent: 6.2, roi: 15, roiConf: 75, ftes: 6.0, velocity: 44, deps: ['proj-trading-platform'], riskFlags: ['Stress testing milestone at-risk', 'Shared resource conflict'], aiRecs: ['Consider MVP approach for stress testing', 'Synergy with Trading Platform'] },
  { id: 'proj-digital-onboarding', name: 'Digital Customer Onboarding', bu: 'Retail', status: 'green', priority: 'high', stage: 'implementing', budget: 2.2, spent: 1.1, roi: 5.5, roiConf: 88, ftes: 4.0, velocity: 40, deps: [], riskFlags: [], aiRecs: ['Conversion rates exceeding target', 'Mobile completion rate 20% higher'] },
  { id: 'proj-mobile-app-refresh', name: 'Retail Mobile App Modernization', bu: 'Retail', status: 'green', priority: 'medium', stage: 'backlog', budget: 3.5, spent: 0.075, roi: 8, roiConf: 70, ftes: 0.5, velocity: 0, deps: ['proj-digital-onboarding'], riskFlags: [], aiRecs: ['Consider React Native', 'Strong demand for investment tracking'] },
  { id: 'proj-advisor-portal', name: 'Financial Advisor Portal', bu: 'Retail', status: 'green', priority: 'medium', stage: 'reviewing', budget: 2.8, spent: 0.045, roi: 6.5, roiConf: 65, ftes: 1.0, velocity: 0, deps: [], riskFlags: [], aiRecs: ['Survey top 50 advisors', 'Consider API-first approach'] },
  { id: 'proj-data-foundation', name: 'Enterprise Data Foundation', bu: 'Group Functions', status: 'amber', priority: 'critical', stage: 'implementing', budget: 12, spent: 8.5, roi: 40, roiConf: 72, ftes: 8.0, velocity: 52, deps: [], riskFlags: ['Full data lake milestone at-risk', 'Budget overrun £1.2M', 'Key architect shared'], aiRecs: ['CRITICAL: Blocking 4 other initiatives', 'Consider phased MDM rollout', 'Data quality issues causing rework'] },
  { id: 'proj-api-gateway', name: 'Enterprise API Gateway', bu: 'Group Functions', status: 'green', priority: 'high', stage: 'implementing', budget: 1.8, spent: 0.95, roi: 4.5, roiConf: 85, ftes: 3.0, velocity: 32, deps: [], riskFlags: [], aiRecs: ['Early adoption exceeding expectations', 'Consider GraphQL gateway'] },
  { id: 'proj-cloud-migration', name: 'Cloud Infrastructure Migration', bu: 'Group Functions', status: 'green', priority: 'high', stage: 'implementing', budget: 6.5, spent: 4.2, roi: 15, roiConf: 80, ftes: 5.0, velocity: 38, deps: [], riskFlags: [], aiRecs: ['Reserved instances could save £400K', 'Consider Spot for batch workloads'] },
  { id: 'proj-regulatory-reporting', name: 'Regulatory Reporting Automation', bu: 'Risk & Compliance', status: 'amber', priority: 'critical', stage: 'implementing', budget: 4.5, spent: 3.1, roi: 8, roiConf: 75, ftes: 4.0, velocity: 35, deps: ['proj-data-foundation'], riskFlags: ['QRT automation milestone at-risk', 'Data Foundation dependency yellow', 'EIOPA deadline regulatory'], aiRecs: ['Consider parallel development', 'Escalate blockers immediately'] },
  { id: 'proj-fraud-detection', name: 'AI-Powered Fraud Detection', bu: 'Risk & Compliance', status: 'green', priority: 'high', stage: 'analyzing', budget: 3.2, spent: 0.12, roi: 12, roiConf: 70, ftes: 0.5, velocity: 0, deps: ['proj-data-foundation'], riskFlags: [], aiRecs: ['40% reduction in false positives achievable', 'Consider ensemble model approach'] },
  { id: 'proj-grc-platform', name: 'Integrated GRC Platform', bu: 'Risk & Compliance', status: 'green', priority: 'medium', stage: 'funnel', budget: 5, spent: 0.025, roi: 10, roiConf: 60, ftes: 0.25, velocity: 0, deps: [], riskFlags: [], aiRecs: ['Strong build vs buy candidates', 'Integration with ServiceNow possible'] },
  { id: 'proj-esg-reporting', name: 'ESG Analytics & Reporting', bu: 'Corporate Investments', status: 'green', priority: 'high', stage: 'implementing', budget: 2.2, spent: 0.85, roi: 15, roiConf: 78, ftes: 3.0, velocity: 28, deps: [], riskFlags: [], aiRecs: ['Client demand exceeding expectations', 'TCFD requirements coming'] },
  { id: 'proj-alt-investments', name: 'Alternative Investments Platform', bu: 'Corporate Investments', status: 'green', priority: 'medium', stage: 'backlog', budget: 4.5, spent: 0.05, roi: 18, roiConf: 65, ftes: 0.25, velocity: 0, deps: [], riskFlags: [], aiRecs: ['Consider cloud-native vendors', 'Early stakeholder engagement critical'] }
];

function buildProjectContext(): string {
  const totalBudget = projectSummaries.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projectSummaries.reduce((sum, p) => sum + p.spent, 0);
  const totalROI = projectSummaries.reduce((sum, p) => sum + p.roi, 0);
  const greenCount = projectSummaries.filter(p => p.status === 'green').length;
  const amberCount = projectSummaries.filter(p => p.status === 'amber').length;
  const redCount = projectSummaries.filter(p => p.status === 'red').length;
  const criticalDeps = projectSummaries.flatMap(p => p.deps.map(d => ({ source: p.id, target: d }))).filter(d => 
    projectSummaries.find(p => p.id === d.target)?.riskFlags.length || 0 > 0
  );
  const atRiskProjects = projectSummaries.filter(p => p.riskFlags.length > 0);

  const projectDetails = projectSummaries.map(p => `
PROJECT: ${p.name} (ID: ${p.id})
- Business Unit: ${p.bu}
- Status: ${p.status.toUpperCase()} | Priority: ${p.priority} | Stage: ${p.stage}
- Budget: £${p.budget}M | Spent: £${p.spent}M (${Math.round(p.spent/p.budget*100)}%)
- Projected ROI: £${p.roi}M (${p.roiConf}% confidence)
- Team: ${p.ftes} FTE | Velocity: ${p.velocity} pts/sprint
- Dependencies: ${p.deps.length > 0 ? p.deps.join(', ') : 'None'}
- Risk Flags: ${p.riskFlags.length > 0 ? p.riskFlags.join('; ') : 'None'}
- AI Recommendations: ${p.aiRecs.join('; ')}
`).join('\n');

  return `
PORTFOLIO SUMMARY (${projectSummaries.length} Projects):
- Total Budget: £${totalBudget.toFixed(1)}M
- Total Spent: £${totalSpent.toFixed(1)}M (${Math.round(totalSpent/totalBudget*100)}% utilized)
- Total Projected ROI: £${totalROI.toFixed(1)}M
- Status: ${greenCount} Green, ${amberCount} Amber, ${redCount} Red
- At-Risk Projects: ${atRiskProjects.length}
- Cross-Project Dependencies: ${criticalDeps.length}

AT-RISK PROJECTS:
${atRiskProjects.map(p => `- ${p.name}: ${p.riskFlags.join('; ')}`).join('\n')}

ALL PROJECTS:
${projectDetails}
`;
}

export interface PageContext {
  pageType?: 'dashboard' | 'division' | 'project' | 'portfolio' | 'other';
  entityId?: string;
  entityName?: string;
  businessUnit?: string;
  entityType?: string; // 'Operating Segment' or 'Group Function' for division pages
}

export async function askPM(question: string, pageContext?: PageContext): Promise<string> {
  const projectContext = buildProjectContext();
  const safeContext = buildSAFe6Context();
  
  // Check for "what if" scenario queries
  const whatIfMatch = parseWhatIfQuery(question);
  let impactAnalysisResult = '';
  
  if (whatIfMatch) {
    try {
      const result = analyzeImpact(whatIfMatch);
      impactAnalysisResult = `\n\nIMPACT ANALYSIS RESULTS:
${generateImpactSummary(result)}`;
    } catch (error) {
      console.error('Impact analysis error:', error);
    }
  }
  
  // Build context hint based on current page
  let contextHint = '';
  let currentProjectContext = '';
  if (pageContext) {
    if (pageContext.pageType === 'division' && pageContext.entityName) {
      const entityType = pageContext.entityType || 'Operating Segment';
      contextHint = `\n\nCURRENT CONTEXT: The user is currently viewing the ${pageContext.entityName} ${entityType} page.
- When the user says "this division", "this segment", "these projects", or refers to budget/resources without specifying which, they mean ${pageContext.entityName} projects specifically.
- Still answer cross-portfolio questions when explicitly asked.`;
    } else if (pageContext.pageType === 'project' && pageContext.entityId) {
      const project = projectSummaries.find(p => p.id === pageContext.entityId);
      const projectName = project?.name || pageContext.entityName || pageContext.entityId;
      const projectId = pageContext.entityId;
      
      if (project) {
        currentProjectContext = `
CURRENT PROJECT IN VIEW:
- Name: ${project.name}
- ID: ${project.id}
- Business Unit: ${project.bu}
- Status: ${project.status.toUpperCase()}
- Priority: ${project.priority}
- Stage: ${project.stage}
- Current Budget: £${project.budget}M
- Spent: £${project.spent}M (${Math.round(project.spent/project.budget*100)}%)
- Projected ROI: £${project.roi}M (${project.roiConf}% confidence)
- FTEs: ${project.ftes}
- Dependencies: ${project.deps.length > 0 ? project.deps.join(', ') : 'None'}
- Risk Flags: ${project.riskFlags.length > 0 ? project.riskFlags.join('; ') : 'None'}`;
      } else {
        // Project not in hardcoded list - use context info
        currentProjectContext = `
CURRENT PROJECT IN VIEW:
- Name: ${projectName}
- ID: ${projectId}
- Business Unit: ${pageContext.businessUnit || 'Not specified'}
(Note: Detailed project metrics not available in quick-access cache. The user is still viewing this specific project.)`;
      }

      contextHint = `\n\nCRITICAL - USER IS VIEWING A SPECIFIC PROJECT:
The user is currently viewing: ${projectName} (ID: ${projectId}).

IMPORTANT: When the user says "the project", "this project", "the project's budget", "increase the budget", "change the budget", or any reference to a single project without naming it, they are referring SPECIFICALLY to "${projectName}".

${currentProjectContext}

Apply all budget changes, timeline adjustments, or analysis requests to THIS project (${projectName}) unless the user explicitly names a different project or asks about the portfolio.`;
    } else if (pageContext.pageType === 'portfolio') {
      contextHint = `\n\nCURRENT CONTEXT: The user is viewing the portfolio overview. Provide portfolio-wide insights and cross-project analysis.`;
    } else if (pageContext.pageType === 'dashboard') {
      contextHint = `\n\nCURRENT CONTEXT: The user is on the main dashboard. If they ask about "the project" or "this project" without specifying which one, ask them to clarify which project they mean, or navigate to that project first.`;
    }
  }
  
  const systemPrompt = `You are an AI-powered Project Management assistant for the VRO (Value Realization Office) at Legal & General. You have access to the complete portfolio of enterprise transformation projects following SAFe 6.0 methodology.

Your role is to:
1. Answer questions about projects, dependencies, status, and financials
2. Provide insights on portfolio health and risks
3. Identify cross-project dependencies and their impacts
4. Recommend actions based on project data and AI insights
5. Help users understand the VRO value proposition vs traditional PMO
6. **IMPORTANT: Handle "what if" scenario analysis** - When asked about delays or changes, provide traceable impact analysis including:
   - Direct schedule impact on the affected item
   - Cascade effects on dependent work items
   - Cost implications (additional labor costs, vendor impacts)
   - Resource conflicts that may arise
   - Risk escalations
   - Mitigation options with costs and recovery potential

When answering:
- Be concise but thorough
- Use specific data from the projects and SAFe hierarchy
- Highlight risks and recommendations
- IMPORTANT: Always format project references as clickable links using this exact format: [Project Name](proj-id)
  Example: [PRT Platform Modernization](proj-prt-platform) or [Enterprise Data Foundation](proj-data-foundation)
- Use status indicators: 🔴 for RED/critical, 🟡 for AMBER/at-risk, 🟢 for GREEN/healthy
- Format responses clearly with bullet points and headers
- If asked about dependencies, list all affected projects with clickable links
- If asked about at-risk items, prioritize by financial impact and include status colors
- When listing projects, always include: clickable name, status color, key risk, and financial impact
- For "what if" scenarios, provide detailed traceable analysis with specific numbers
- PAY CLOSE ATTENTION to the CURRENT CONTEXT section below - it tells you which page the user is viewing and should be used to interpret ambiguous references like "the project" or "this division"

PROJECT PORTFOLIO CONTEXT:
${projectContext}

SAFe 6.0 HIERARCHY CONTEXT:
${safeContext}${contextHint}${impactAnalysisResult}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: question
        }
      ],
      system: systemPrompt
    });

    const textContent = message.content.find(block => block.type === 'text');
    return textContent ? textContent.text : 'I could not generate a response. Please try again.';
  } catch (error: any) {
    console.error('Anthropic API error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}
