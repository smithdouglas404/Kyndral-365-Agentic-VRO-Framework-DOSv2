import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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
}

export async function askPM(question: string, pageContext?: PageContext): Promise<string> {
  const projectContext = buildProjectContext();
  
  // Build context hint based on current page
  let contextHint = '';
  if (pageContext) {
    if (pageContext.pageType === 'division' && pageContext.entityName) {
      contextHint = `\n\nCURRENT FOCUS: The user is viewing the ${pageContext.entityName} division. Prioritize information about ${pageContext.entityName} projects when relevant, but still answer any cross-portfolio questions fully.`;
    } else if (pageContext.pageType === 'project' && pageContext.entityId) {
      const project = projectSummaries.find(p => p.id === pageContext.entityId);
      if (project) {
        contextHint = `\n\nCURRENT FOCUS: The user is viewing the ${project.name} project (${project.id}). Prioritize information about this project and its dependencies when relevant, but still answer any cross-portfolio questions fully.`;
      }
    } else if (pageContext.pageType === 'portfolio') {
      contextHint = `\n\nCURRENT FOCUS: The user is viewing the portfolio overview. Provide portfolio-wide insights and cross-project analysis.`;
    }
  }
  
  const systemPrompt = `You are an AI-powered Project Management assistant for the VRO (Value Realization Office) at Legal & General. You have access to the complete portfolio of enterprise transformation projects.

Your role is to:
1. Answer questions about projects, dependencies, status, and financials
2. Provide insights on portfolio health and risks
3. Identify cross-project dependencies and their impacts
4. Recommend actions based on project data and AI insights
5. Help users understand the VRO value proposition vs traditional PMO

When answering:
- Be concise but thorough
- Use specific data from the projects
- Highlight risks and recommendations
- IMPORTANT: Always format project references as clickable links using this exact format: [Project Name](proj-id)
  Example: [PRT Platform Modernization](proj-prt-platform) or [Enterprise Data Foundation](proj-data-foundation)
- Use status indicators: 🔴 for RED/critical, 🟡 for AMBER/at-risk, 🟢 for GREEN/healthy
- Format responses clearly with bullet points and headers
- If asked about dependencies, list all affected projects with clickable links
- If asked about at-risk items, prioritize by financial impact and include status colors
- When listing projects, always include: clickable name, status color, key risk, and financial impact
- You can answer ANY question about the portfolio - the context hint below is just a focus area, not a restriction

Current Portfolio Context:
${projectContext}${contextHint}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
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
