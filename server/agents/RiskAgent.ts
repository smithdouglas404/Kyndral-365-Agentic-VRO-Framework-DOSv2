import { AgentBase, AgentConfig } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

/**
 * Risk Agent - Risk Identification and Mitigation
 * Autonomy: SUPERVISED (requires human approval for interventions)
 * Focus: Risk identification, assessment, mitigation planning
 */
export class RiskAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'risk',
      agentName: 'Risk Agent',
      focus: 'risks, mitigation, contingency, uncertainty',
      autonomy: 'supervised',
      temperature: 0.7,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the Risk Agent for NextEra Energy's Enterprise Transformation Office.

Your responsibilities:
- Identify new project risks
- Assess risk probability and impact
- Recommend mitigation strategies
- Track risk trends over time
- Escalate high-probability/high-impact risks

You have SUPERVISED AUTONOMY:
- All interventions require human approval before execution
- You can recommend actions but cannot execute them autonomously

When detecting risks, output interventions in this format:
<INTERVENTION type="risk" severity="high">
Description of risk and recommended mitigation strategy
</INTERVENTION>

Risk Assessment Framework:
- Probability: Low (0-30%), Medium (31-60%), High (61-100%)
- Impact: Low (minimal), Medium (moderate disruption), High (severe consequences)
- Priority = Probability × Impact

IMPORTANT: Only create interventions based on REAL DATA from the ontology queries.
Never fabricate or simulate data. Query actual project risks first, then analyze.

Always use your tools to query real data before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "query_project_risks",
        description: "Query all project risks from the database",
        schema: z.object({
          projectId: z.string().optional().describe("Filter by specific project ID"),
          status: z.string().optional().describe("Filter by risk status (open, mitigated, closed)"),
          minProbability: z.string().optional().describe("Filter by minimum probability (low, medium, high)"),
          limit: z.number().default(50),
        }),
        func: async ({ projectId, status, minProbability, limit }) => {
          try {
            let risks: any[] = [];

            // Get risks - either for specific project or all projects
            if (projectId) {
              risks = await this.storage.getRisks(projectId);
            } else {
              const projects = await this.storage.getProjects();
              for (const project of projects) {
                const projectRisks = await this.storage.getRisks(project.id);
                risks.push(...projectRisks);
              }
            }

            // Filter by status
            if (status) {
              risks = risks.filter(r => r.status === status);
            }

            // Filter by probability
            if (minProbability) {
              const probOrder = { 'low': 1, 'medium': 2, 'high': 3 };
              const minProb = probOrder[minProbability.toLowerCase() as keyof typeof probOrder] || 1;

              risks = risks.filter(r => {
                const riskProb = probOrder[(r.probability || 'low').toLowerCase() as keyof typeof probOrder] || 1;
                return riskProb >= minProb;
              });
            }

            // AUTO-CREATE INTERVENTIONS for new high/critical risks
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const risk of risks) {
              const isHighProbability = risk.probability === 'high';
              const isHighImpact = risk.impact === 'high' || risk.impact === 'critical';
              const isOpen = risk.status === 'open';
              const lacksMitigation = !risk.mitigation || risk.mitigation.trim() === '';

              // Rule 1: High/Critical risk without mitigation
              if (isOpen && (isHighProbability || isHighImpact) && lacksMitigation && interventionsCreated < 15) {
                const severity = isHighProbability && isHighImpact ? 'critical' : 'high';

                await this.storage.createIntervention({
                  type: 'risk_unmitigated',
                  severity,
                  title: `Unmitigated Risk: ${risk.name}`,
                  description: `${severity === 'critical' ? 'CRITICAL' : 'High'} risk detected without mitigation plan. Risk: "${risk.description}". Probability: ${risk.probability}, Impact: ${risk.impact}. Project: ${risk.projectName}`,
                  suggestedAction: severity === 'critical'
                    ? 'URGENT: Develop mitigation plan immediately. This critical risk could severely impact project success. Assign risk owner and create contingency plan within 24 hours.'
                    : 'Develop and document mitigation strategy. Assign risk owner and establish monitoring cadence. Create contingency plan for high-impact scenarios.',
                  projectId: risk.projectId || '',
                  projectName: risk.projectName || 'Unknown',
                  agentSource: 'Risk Agent',
                  confidence: '0.92',
                  isAutonomous: 'false',
                });

                // Send critical alert for critical risks
                if (severity === 'critical') {
                  await notificationMCP.sendCriticalAlert({
                    title: `Critical Risk Detected: ${risk.name}`,
                    message: `Critical unmitigated risk identified: "${risk.description}". Probability: ${risk.probability}, Impact: ${risk.impact}. Project: ${risk.projectName}. Immediate mitigation plan required.`,
                    agent: 'Risk Agent',
                    projectName: risk.projectName || 'Unknown',
                    projectId: risk.projectId || '',
                    actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                  });
                }

                interventionsCreated++;
              }
              // Rule 2: Old open risks (>30 days without action)
              else if (isOpen && risk.createdAt && interventionsCreated < 15) {
                const daysOpen = Math.floor((Date.now() - new Date(risk.createdAt).getTime()) / (1000 * 60 * 60 * 24));

                if (daysOpen > 30 && (isHighProbability || isHighImpact)) {
                  await this.storage.createIntervention({
                    type: 'risk_stale',
                    severity: 'high',
                    title: `Stale Risk: ${risk.name}`,
                    description: `Risk has been open for ${daysOpen} days without resolution. Risk: "${risk.description}". Probability: ${risk.probability}, Impact: ${risk.impact}. Project: ${risk.projectName}`,
                    suggestedAction: 'Review risk status and update mitigation progress. If risk is no longer relevant, close it. If active, accelerate mitigation activities or escalate.',
                    projectId: risk.projectId || '',
                    projectName: risk.projectName || 'Unknown',
                    agentSource: 'Risk Agent',
                    confidence: '0.80',
                    isAutonomous: 'false',
                  });

                  interventionsCreated++;
                }
              }
            }

            const results = risks.slice(0, limit).map(r => ({
              id: r.id,
              projectId: r.projectId,
              projectName: r.projectName,
              name: r.name,
              description: r.description,
              probability: r.probability,
              impact: r.impact,
              status: r.status,
              mitigation: r.mitigation,
              contingencyPlan: r.contingencyPlan,
            }));

            return JSON.stringify({
              totalRisks: risks.length,
              returned: results.length,
              interventionsCreated,
              risks: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "calculate_risk_score",
        description: "Calculate quantitative risk score (probability × impact) for a risk",
        schema: z.object({
          riskId: z.string().describe("Risk ID to analyze"),
        }),
        func: async ({ riskId }) => {
          try {
            // Get all risks and find the specific one
            const projects = await this.storage.getProjects();
            let risk: any = null;

            for (const project of projects) {
              const projectRisks = await this.storage.getRisks(project.id);
              risk = projectRisks.find(r => r.id === riskId);
              if (risk) break;
            }

            if (!risk) {
              return JSON.stringify({ error: "Risk not found" });
            }

            // Convert qualitative to quantitative
            const probValues = { 'low': 0.2, 'medium': 0.5, 'high': 0.8 };
            const impactValues = { 'low': 1, 'medium': 5, 'high': 10 };

            const prob = probValues[(risk.probability || 'low').toLowerCase() as keyof typeof probValues] || 0.5;
            const impact = impactValues[(risk.impact || 'medium').toLowerCase() as keyof typeof impactValues] || 5;

            const riskScore = prob * impact;

            let priority = 'LOW';
            if (riskScore > 5) priority = 'HIGH';
            else if (riskScore > 2) priority = 'MEDIUM';

            return JSON.stringify({
              riskId,
              riskName: risk.name,
              probability: risk.probability,
              impact: risk.impact,
              quantitativeScore: riskScore.toFixed(2),
              priority,
              needsAttention: priority === 'HIGH',
              hasMitigation: !!risk.mitigation,
              hasContingency: !!risk.contingencyPlan,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "identify_unmitigated_risks",
        description: "Identify high-priority risks that lack mitigation plans",
        schema: z.object({
          projectId: z.string().optional().describe("Filter by project, or omit for all projects"),
        }),
        func: async ({ projectId }) => {
          try {
            let risks: any[] = [];

            // Get risks - either for specific project or all projects
            if (projectId) {
              risks = await this.storage.getRisks(projectId);
            } else {
              const projects = await this.storage.getProjects();
              for (const project of projects) {
                const projectRisks = await this.storage.getRisks(project.id);
                risks.push(...projectRisks);
              }
            }

            // Find risks that are high impact/probability but lack mitigation
            const unmitigatedRisks = risks.filter(r => {
              const isHighRisk = (r.probability === 'high' || r.impact === 'high');
              const lacksMitigation = !r.mitigation || r.mitigation.trim() === '';
              return isHighRisk && lacksMitigation && r.status === 'open';
            });

            // AUTO-CREATE INTERVENTIONS for unmitigated high-priority risks
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const risk of unmitigatedRisks) {
              if (interventionsCreated >= 15) break;

              const daysOpen = Math.floor((Date.now() - new Date(risk.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
              const isCritical = risk.probability === 'high' && risk.impact === 'high';
              const severity = isCritical ? 'critical' : 'high';

              await this.storage.createIntervention({
                type: 'risk_unmitigated',
                severity,
                title: `Unmitigated ${isCritical ? 'Critical' : 'High'} Risk: ${risk.name}`,
                description: `${isCritical ? 'CRITICAL' : 'High-priority'} risk has been open for ${daysOpen} days without mitigation plan. Risk: "${risk.description}". Probability: ${risk.probability}, Impact: ${risk.impact}. Project: ${risk.projectName}`,
                suggestedAction: severity === 'critical'
                  ? 'URGENT: Assign risk owner immediately. Develop comprehensive mitigation strategy within 24 hours. Consider project hold if risk cannot be adequately mitigated.'
                  : 'Assign risk owner and develop mitigation plan within 72 hours. Document mitigation actions and contingency plans.',
                projectId: risk.projectId || '',
                projectName: risk.projectName || 'Unknown',
                agentSource: 'Risk Agent',
                confidence: '0.95',
                isAutonomous: 'false',
              });

              // Send critical alert for critical unmitigated risks
              if (severity === 'critical') {
                await notificationMCP.sendCriticalAlert({
                  title: `Critical Unmitigated Risk: ${risk.name}`,
                  message: `Critical risk without mitigation (open ${daysOpen} days): "${risk.description}". Project: ${risk.projectName}. Probability: ${risk.probability}, Impact: ${risk.impact}. Immediate action required.`,
                  agent: 'Risk Agent',
                  projectName: risk.projectName || 'Unknown',
                  projectId: risk.projectId || '',
                  actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                });
              }

              interventionsCreated++;
            }

            const results = unmitigatedRisks.map(r => ({
              id: r.id,
              projectId: r.projectId,
              projectName: r.projectName,
              name: r.name,
              probability: r.probability,
              impact: r.impact,
              status: r.status,
              daysOpen: Math.floor((Date.now() - new Date(r.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
            }));

            return JSON.stringify({
              totalUnmitigatedRisks: results.length,
              interventionsCreated,
              risks: results.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "analyze_risk_trends",
        description: "Analyze risk trends across projects to identify systemic issues",
        schema: z.object({
          portfolioId: z.string().optional().describe("Filter by portfolio, or omit for all"),
        }),
        func: async ({ portfolioId }) => {
          try {
            let projects = await this.storage.getProjects();

            if (portfolioId) {
              projects = projects.filter(p => p.portfolioId === portfolioId);
            }

            const trendData = [];

            for (const project of projects) {
              const risks = await this.storage.getRisks(project.id);

              const openRisks = risks.filter(r => r.status === 'open').length;
              const highRisks = risks.filter(r => r.probability === 'high' || r.impact === 'high').length;
              const mitigatedRisks = risks.filter(r => r.status === 'mitigated').length;

              if (risks.length > 0) {
                trendData.push({
                  projectId: project.id,
                  projectName: project.name,
                  totalRisks: risks.length,
                  openRisks,
                  highRisks,
                  mitigatedRisks,
                  mitigationRate: ((mitigatedRisks / risks.length) * 100).toFixed(1) + '%',
                  riskLevel: highRisks > 3 ? 'HIGH' : highRisks > 0 ? 'MEDIUM' : 'LOW',
                });
              }
            }

            // Sort by risk level (HIGH first)
            trendData.sort((a, b) => {
              const order = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
              return order[b.riskLevel as keyof typeof order] - order[a.riskLevel as keyof typeof order];
            });

            return JSON.stringify({
              projectCount: trendData.length,
              trends: trendData.slice(0, 20),
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  /**
   * Scheduled scan for risk issues
   */
  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting Risk Agent scheduled risk scan');

    const input = `Scan all projects for risk management issues. Check for:
1. High-probability/high-impact risks without mitigation plans
2. Risks that have been open for >30 days without action
3. Projects with increasing risk trends

For each issue found, create an intervention with recommended mitigation strategies.
Use the query_project_risks tool first to get real data, then analyze.
Only create interventions if you find actual risk management problems in the data.

Remember: You have SUPERVISED autonomy, so all your interventions will require human approval.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[RiskAgent] Scheduled scan error:', error);
    }
  }
}
