import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";

const anthropic = new Anthropic();

// Build SAFe 6.0 hierarchy context from database
async function buildSAFe6Context(): Promise<string> {
  const [
    strategicThemes,
    valueStreams,
    epics,
    arts,
    divisions
  ] = await Promise.all([
    storage.getStrategicThemes(),
    storage.getValueStreams(),
    storage.getEpics(),
    storage.getArts(),
    storage.getDivisions()
  ]);

  const portfolioSummary = `
PORTFOLIO LEVEL (PPM):
Strategic Themes (${strategicThemes.length}):
${strategicThemes.map(t => `  - ${t.name}: ${t.budgetAllocation || 0}% budget | Status: ${t.status || 'active'}`).join('\n')}

Value Streams (${valueStreams.length}):
${valueStreams.map(vs => `  - ${vs.name}: Type: ${vs.type || 'operational'} | Owner: ${vs.owner || 'TBD'}`).join('\n')}

Portfolio Epics (${epics.length}):
${epics.map(e => `  - ${e.name}: $${((Number(e.estimatedCost) || 0) / 1000000).toFixed(1)}M | Status: ${e.status || 'active'}`).join('\n')}
`;

  const artSummary = `
ART LEVEL (Program):
Agile Release Trains (${arts.length}):
${arts.map(art => `  - ${art.name}: ${art.teamCount || 0} teams | Velocity: ${art.velocity || 0} pts`).join('\n')}
`;

  const divisionSummary = `
BUSINESS SEGMENTS (SEC Reportable):
${divisions.slice(0, 6).map(d => {
  const profit = d.profit2024 || 0;
  const formatted = profit >= 1000 ? `$${(profit/1000).toFixed(1)}B` : `$${profit}M`;
  return `  - ${d.name}: ${formatted} profit | ${(d.changePercent || 0) >= 0 ? '+' : ''}${d.changePercent || 0}% YoY`;
}).join('\n')}
`;

  return portfolioSummary + artSummary + divisionSummary;
}

// Build project context from database
async function buildProjectContext(): Promise<string> {
  const projects = await storage.getProjects();
  
  const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budgetTotal || '0') || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (parseFloat(p.budgetSpent || '0') || 0), 0);
  const greenCount = projects.filter(p => p.status === 'green' || p.status === 'active').length;
  const amberCount = projects.filter(p => p.status === 'amber' || p.status === 'at-risk').length;
  const redCount = projects.filter(p => p.status === 'red').length;
  const atRiskProjects = projects.filter(p => p.status === 'amber' || p.status === 'red' || p.status === 'at-risk');

  const projectDetails = projects.map(p => `
PROJECT: ${p.name} (ID: ${p.id})
- Division: ${p.divisionId || 'N/A'}
- Status: ${(p.status || 'unknown').toUpperCase()} | Priority: ${p.priority || 'medium'} | Stage: ${p.safeStage || 'funnel'}
- Budget: $${parseFloat(p.budgetTotal || '0').toFixed(1)}${p.budgetUnit || 'M'} | Spent: $${parseFloat(p.budgetSpent || '0').toFixed(1)}${p.budgetUnit || 'M'}
`).join('\n');

  return `
PORTFOLIO SUMMARY (${projects.length} Projects):
- Total Budget: $${(totalBudget / 1000000).toFixed(1)}M
- Total Spent: $${(totalSpent / 1000000).toFixed(1)}M (${totalBudget > 0 ? Math.round(totalSpent/totalBudget*100) : 0}% utilized)
- Status: ${greenCount} Green, ${amberCount} Amber, ${redCount} Red
- At-Risk Projects: ${atRiskProjects.length}

AT-RISK PROJECTS:
${atRiskProjects.map(p => `- ${p.name}: Status ${p.status}`).join('\n') || 'None'}

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
  const [projectContext, safeContext] = await Promise.all([
    buildProjectContext(),
    buildSAFe6Context()
  ]);
  
  // Build context hint based on current page
  let contextHint = '';
  if (pageContext) {
    if (pageContext.pageType === 'division' && pageContext.entityName) {
      contextHint = `\n\nCURRENT CONTEXT: The user is currently viewing the ${pageContext.entityName} business segment page.
- When the user says "this division", "these projects", or refers to budget/resources without specifying which, they mean ${pageContext.entityName} projects specifically.`;
    } else if (pageContext.pageType === 'project' && pageContext.entityId) {
      const projectName = pageContext.entityName || pageContext.entityId;
      contextHint = `\n\nCRITICAL - USER IS VIEWING A SPECIFIC PROJECT:
The user is currently viewing: ${projectName} (ID: ${pageContext.entityId}).

IMPORTANT: When the user says "the project", "this project", "the project's budget", or any reference to a single project without naming it, they are referring SPECIFICALLY to "${projectName}".`;
    } else if (pageContext.pageType === 'portfolio') {
      contextHint = `\n\nCURRENT CONTEXT: The user is viewing the portfolio overview. Provide portfolio-wide insights and cross-project analysis.`;
    } else if (pageContext.pageType === 'dashboard') {
      contextHint = `\n\nCURRENT CONTEXT: The user is on the main dashboard. If they ask about "the project" or "this project" without specifying which one, ask them to clarify which project they mean.`;
    }
  }
  
  const systemPrompt = `You are an AI-powered Project Management assistant for the VRO (Value Realization Office) at NextEra Energy. You have access to the complete portfolio of enterprise transformation projects following SAFe 6.0 methodology.

NextEra Energy is America's largest utility company with segments:
- FPL (Florida Power & Light): Regulated electric utility serving 12+ million Floridians
- NEER (NextEra Energy Resources): Clean energy development - solar, wind, battery storage
- Corporate & Other: Shared services and corporate functions

Your role is to:
1. Answer questions about projects, dependencies, status, and financials
2. Provide insights on portfolio health and risks
3. Identify cross-project dependencies and their impacts
4. Recommend actions based on project data
5. Focus on energy industry issues: grid reliability, renewable development, storm resilience, regulatory compliance

When answering:
- Be concise but thorough
- Use specific data from the projects and SAFe hierarchy
- Highlight risks and recommendations
- Format responses clearly with bullet points and headers
- Use status indicators: 🔴 for RED/critical, 🟡 for AMBER/at-risk, 🟢 for GREEN/healthy
- PAY CLOSE ATTENTION to the CURRENT CONTEXT section - it tells you which page the user is viewing

PROJECT PORTFOLIO CONTEXT (from database):
${projectContext}

SAFe 6.0 HIERARCHY CONTEXT (from database):
${safeContext}${contextHint}`;

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
