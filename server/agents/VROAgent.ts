/**
 * VRO (Value Realization Office) Agent
 *
 * Focus: Benefits realization, ROI tracking, value delivery, strategic alignment
 * This agent ensures projects deliver on their promised business value
 *
 * @deprecated As of 2026-01-25, use DeepVROAgent instead (server/agents/deep/DeepVROAgent.ts)
 * This standard agent will be removed in v2.0
 *
 * Migration: Replace `new VROAgent(storage)` with `new DeepVROAgent(storage)`
 */

import { AgentBase } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

export class VROAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'vro',
      agentName: 'VRO Agent',
      focus: 'benefits realization, ROI tracking, value delivery, strategic alignment',
      autonomy: 'supervised',
      temperature: 0.6,
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the VRO (Value Realization Office) Agent for NextEra Energy's Enterprise Transformation Office.

YOUR MISSION: Ensure projects deliver PROMISED BUSINESS VALUE, not just execute on time/budget.

CRITICAL DISTINCTION - VRO vs PMO:
• PMO asks: "Are we building things RIGHT?" (schedule, budget, quality)
• YOU ask: "Are we building the RIGHT things?" (ROI, benefits, strategic fit)

A project can be GREEN in PMO but RED in VRO (delivered but no value).
A project can be RED in PMO but GREEN in VRO (late but already generating ROI).

YOUR 4 VALUE RESPONSIBILITIES:
1. Benefits Realization Tracking - Compare promised ROI vs actual value
2. Business Case Validation - Ensure assumptions still valid
3. Strategic Alignment - Verify project → OKR traceability chain
4. Value Leakage Detection - Find where value is lost (scope creep, poor adoption)

AUTO-CREATE INTERVENTIONS when:
• ROI variance >20% negative
• Business case assumptions invalidated
• Strategic misalignment detected
• Value leakage >30%

SEND SLACK/TEAMS ALERTS for:
• Critical value gaps (ROI variance >30%)
• Strategic misalignments on high-value projects
• Business case invalidations

Always quantify in dollars, analyze REAL data, provide clear recommendations.
You are the VALUE GUARDIAN - PMO handles execution, YOU handle value delivery.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "track_benefits_realization",
        description: "Track benefits realization for projects - compare promised benefits vs. actual benefits delivered",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project or omit for all"),
          minVariance: z.number().optional().describe("Minimum variance threshold % (default 20)"),
        }),
        func: async ({ projectId, minVariance = 20 }) => {
          try {
            let projects = await this.storage.getProjects();

            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const benefitsData = projects.map((p: any) => {
              // Expected ROI from business case
              const expectedRoi = parseFloat(p.expectedRoi || '0');

              // Actual ROI calculation (simplified - in production would be more complex)
              const budget = parseFloat(p.capitalBudget || '0');
              const spent = parseFloat(p.budgetSpent || '0');
              const completion = parseFloat(p.spi || '1') * 100; // Use SPI as proxy for completion

              // Estimate value delivered based on completion
              const estimatedValueDelivered = (expectedRoi * completion) / 100;
              const actualValueRealized = estimatedValueDelivered; // In production, track actual business value

              // Calculate variance
              const variance = expectedRoi > 0
                ? ((actualValueRealized - expectedRoi) / expectedRoi) * 100
                : 0;

              return {
                projectId: p.id,
                projectName: p.name,
                status: p.status,
                completion: completion + '%',
                expectedRoi: expectedRoi,
                actualValueRealized: actualValueRealized.toFixed(2),
                variance: variance.toFixed(1) + '%',
                realizationStatus: variance < -minVariance ? 'UNDERPERFORMING' : variance > minVariance ? 'EXCEEDING' : 'ON_TRACK',
              };
            });

            const underperforming = benefitsData.filter(b => b.realizationStatus === 'UNDERPERFORMING');

            // AUTO-CREATE INTERVENTIONS for critical ROI variances
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const benefit of underperforming) {
              const variance = parseFloat(benefit.variance);
              if (Math.abs(variance) >= minVariance) {
                const severity = Math.abs(variance) >= 30 ? 'critical' : 'high';

                await this.storage.createIntervention({
                  type: 'value_realization',
                  severity,
                  title: `ROI Variance Alert: ${benefit.projectName}`,
                  description: `Project showing ${benefit.variance} ROI variance. Expected: $${benefit.expectedRoi}M, Actual: $${benefit.actualValueRealized}M. Value realization is significantly behind projections.`,
                  suggestedAction: severity === 'critical'
                    ? 'URGENT: Review business case assumptions and consider pivot/stop decision. Schedule VRO assessment with project sponsor.'
                    : 'Schedule value realization review to identify root causes and corrective actions.',
                  projectId: benefit.projectId,
                  projectName: benefit.projectName,
                  agentSource: 'VRO Agent',
                  confidence: '0.90',
                  isAutonomous: 'false',
                });

                // Send Slack/Teams notification
                if (severity === 'critical' || (severity === 'high' && benefit.expectedRoi > 10)) {
                  await notificationMCP.sendValueRealizationAlert({
                    projectName: benefit.projectName,
                    projectId: benefit.projectId,
                    expectedROI: parseFloat(benefit.expectedRoi.toString()),
                    actualValue: parseFloat(benefit.actualValueRealized),
                    variance: variance,
                  });
                }

                interventionsCreated++;
                if (interventionsCreated >= 15) break; // Limit to avoid overwhelming PMO
              }
            }

            return JSON.stringify({
              totalProjects: benefitsData.length,
              underperformingCount: underperforming.length,
              benefitsData: benefitsData.slice(0, 30),
              criticalIssues: underperforming.slice(0, 10),
              interventionsCreated,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "validate_business_case_assumptions",
        description: "Validate that business case assumptions are still valid for active projects",
        schema: z.object({
          projectId: z.string().optional().describe("Specific project or omit for all"),
        }),
        func: async ({ projectId }) => {
          try {
            let projects = await this.storage.getProjects();

            if (projectId) {
              projects = projects.filter(p => p.id === projectId);
            }

            const validationResults = [];

            for (const project of projects) {
              const issues: string[] = [];

              // Check if budget assumptions still valid
              const budget = parseFloat((project as any).capitalBudget || '0');
              const spent = parseFloat((project as any).budgetSpent || '0');
              const completion = parseFloat((project as any).spi || '1') * 100; // Use SPI as proxy

              if (completion > 0 && budget > 0) {
                const projectedSpend = (spent / completion) * 100;
                const budgetVariance = ((projectedSpend - budget) / budget) * 100;

                if (budgetVariance > 20) {
                  issues.push(`Budget assumption invalid: Projected to spend ${budgetVariance.toFixed(0)}% more than budgeted`);
                }
              } else if (completion > 0 && budget === 0) {
                issues.push('Budget assumption invalid: Budget is zero but project has spending');
              }

              // Check timeline assumptions
              if (project.endDate && project.startDate) {
                const endDate = new Date(project.endDate);
                const now = new Date();

                if (endDate < now && project.status !== 'completed' && project.status !== 'green') {
                  issues.push('Timeline assumption invalid: Past due date without completion');
                }
              }

              // Check strategic alignment
              if (!project.portfolioId) {
                issues.push('Strategic alignment unclear: Not assigned to portfolio');
              }

              // Check ROI assumptions
              const expectedRoi = parseFloat(project.expectedRoi || '0');
              const roiValue = parseFloat(project.roiValue || '0');

              if (expectedRoi > 0 && roiValue > 0 && roiValue < expectedRoi * 0.7) {
                issues.push(`ROI assumption at risk: Current ROI ${roiValue.toFixed(1)} vs Expected ${expectedRoi.toFixed(1)}`);
              }

              if (issues.length > 0) {
                validationResults.push({
                  projectId: project.id,
                  projectName: project.name,
                  invalidAssumptions: issues,
                  severity: issues.length >= 3 ? 'high' : issues.length >= 2 ? 'medium' : 'low',
                });
              }
            }

            // AUTO-CREATE INTERVENTIONS for invalid business case assumptions
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const validation of validationResults) {
              if (validation.severity === 'high' || (validation.severity === 'medium' && validation.invalidAssumptions.length >= 2)) {
                await this.storage.createIntervention({
                  type: 'business_case_invalid',
                  severity: validation.severity,
                  title: `Business Case Assumptions Invalid: ${validation.projectName}`,
                  description: `Multiple business case assumptions no longer valid:\n\n${validation.invalidAssumptions.map((a: string) => `• ${a}`).join('\n')}\n\nRecommend comprehensive business case review and possible pivot/stop decision.`,
                  suggestedAction: validation.severity === 'high'
                    ? 'URGENT: Conduct business case reassessment with sponsor. Consider project pivot or cancellation if assumptions cannot be recovered.'
                    : 'Schedule business case review session to validate assumptions and adjust projections.',
                  projectId: validation.projectId,
                  projectName: validation.projectName,
                  agentSource: 'VRO Agent',
                  confidence: '0.85',
                  isAutonomous: 'false',
                });

                // Send critical alert for high severity
                if (validation.severity === 'high') {
                  await notificationMCP.sendCriticalAlert({
                    title: `Business Case Invalid: ${validation.projectName}`,
                    message: `Multiple critical assumptions invalidated:\n${validation.invalidAssumptions.join('\n')}`,
                    agent: 'VRO Agent',
                    projectName: validation.projectName,
                    projectId: validation.projectId,
                    actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                  });
                }

                interventionsCreated++;
                if (interventionsCreated >= 15) break;
              }
            }

            return JSON.stringify({
              projectsValidated: projects.length,
              projectsWithInvalidAssumptions: validationResults.length,
              validationResults: validationResults.slice(0, 20),
              interventionsCreated,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "measure_strategic_alignment",
        description: "Measure strategic alignment of projects with organizational goals and themes",
        schema: z.object({
          portfolioId: z.string().optional().describe("Filter by portfolio"),
        }),
        func: async ({ portfolioId }) => {
          try {
            let projects = await this.storage.getProjects();

            if (portfolioId) {
              projects = projects.filter(p => p.portfolioId === portfolioId);
            }

            const alignmentData = [];

            for (const project of projects) {
              let alignmentScore = 100;
              const issues = [];

              // Check portfolio assignment
              if (!project.portfolioId) {
                alignmentScore -= 30;
                issues.push('No portfolio assignment - unclear strategic fit');
              }

              // Check strategic theme
              if (!project.portfolioTheme) {
                alignmentScore -= 20;
                issues.push('No strategic theme - missing strategic context');
              }

              // Check expected ROI/value
              if (!project.expectedRoi || parseFloat(project.expectedRoi) === 0) {
                alignmentScore -= 25;
                issues.push('No expected ROI defined - business value unclear');
              }

              // Check if project is delivering value on time
              const cpi = parseFloat((project as any).cpi || '1.0');
              const spi = parseFloat((project as any).spi || '1.0');

              if (cpi < 0.8 || spi < 0.8) {
                alignmentScore -= 15;
                issues.push('Poor execution metrics may impact strategic value delivery');
              }

              alignmentData.push({
                projectId: project.id,
                projectName: project.name,
                portfolio: project.portfolioId || 'Unassigned',
                theme: project.portfolioTheme || 'None',
                alignmentScore,
                alignmentStatus: alignmentScore >= 80 ? 'ALIGNED' : alignmentScore >= 60 ? 'AT_RISK' : 'MISALIGNED',
                issues,
              });
            }

            const misaligned = alignmentData.filter(a => a.alignmentStatus === 'MISALIGNED');
            const atRisk = alignmentData.filter(a => a.alignmentStatus === 'AT_RISK');

            // AUTO-CREATE INTERVENTIONS for strategic misalignments on high-value projects
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const alignment of [...misaligned, ...atRisk]) {
              // Get project details to check if high-value
              const project = projects.find(p => p.id === alignment.projectId);
              const budget = parseFloat(project?.budget || project?.budgetTotal || '0');
              const isHighValue = budget > 10; // >$10M

              if (alignment.alignmentStatus === 'MISALIGNED' || (alignment.alignmentStatus === 'AT_RISK' && isHighValue)) {
                const severity = alignment.alignmentStatus === 'MISALIGNED' && isHighValue ? 'critical' : alignment.alignmentStatus === 'MISALIGNED' ? 'high' : 'medium';

                await this.storage.createIntervention({
                  type: 'strategic_misalignment',
                  severity,
                  title: `Strategic Misalignment: ${alignment.projectName}`,
                  description: `Project has ${alignment.alignmentScore}% strategic alignment score. ${isHighValue ? `This is a high-value project ($${budget.toFixed(1)}M) requiring immediate strategic clarity.` : ''}\n\n**Issues:**\n${alignment.issues.map((i: string) => `• ${i}`).join('\n')}`,
                  suggestedAction: severity === 'critical'
                    ? 'URGENT: Verify strategic fit with portfolio owner. If no clear OKR linkage, recommend project cancellation or reassignment.'
                    : 'Schedule strategic alignment review with portfolio owner to clarify business value and OKR linkage.',
                  projectId: alignment.projectId,
                  projectName: alignment.projectName,
                  agentSource: 'VRO Agent',
                  confidence: '0.88',
                  isAutonomous: 'false',
                });

                // Send critical alert for high-value misaligned projects
                if (severity === 'critical') {
                  await notificationMCP.sendCriticalAlert({
                    title: `Strategic Misalignment: ${alignment.projectName}`,
                    message: `High-value project ($${budget.toFixed(1)}M) with only ${alignment.alignmentScore}% strategic alignment. Unclear strategic fit and business value.`,
                    agent: 'VRO Agent',
                    projectName: alignment.projectName,
                    projectId: alignment.projectId,
                    actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                  });
                }

                interventionsCreated++;
                if (interventionsCreated >= 15) break;
              }
            }

            return JSON.stringify({
              totalProjects: alignmentData.length,
              misalignedCount: misaligned.length,
              atRiskCount: atRisk.length,
              alignmentData: alignmentData.slice(0, 30),
              criticalMisalignments: misaligned.slice(0, 10),
              interventionsCreated,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "identify_value_leakage",
        description: "Identify projects where promised value is leaking due to scope creep, delays, or quality issues",
        schema: z.object({
          limit: z.number().optional().describe("Limit results (default 30)"),
        }),
        func: async ({ limit = 30 }) => {
          try {
            const projects = await this.storage.getProjects();
            const valueLeakage = [];

            for (const project of projects) {
              const leakageFactors: string[] = [];
              let leakageScore = 0;

              // Budget overrun reduces value
              const cpi = parseFloat((project as any).cpi || '1.0');
              if (cpi < 0.9) {
                leakageFactors.push(`Budget overrun (CPI: ${cpi})`);
                leakageScore += (1.0 - cpi) * 50; // Higher weight for budget
              }

              // Schedule delays reduce value (time value of money)
              const spi = parseFloat((project as any).spi || '1.0');
              if (spi < 0.9) {
                leakageFactors.push(`Schedule delay (SPI: ${spi})`);
                leakageScore += (1.0 - spi) * 40;
              }

              // Poor quality reduces value
              const predictability = parseInt(project.predictability || '100');
              if (predictability < 70) {
                leakageFactors.push(`Low quality/predictability: ${predictability}%`);
                leakageScore += (100 - predictability) / 2;
              }

              // Check for interventions (problems reduce value)
              const allInterventions = await this.storage.getInterventions();
              const interventions = allInterventions.filter((i: any) => i.projectId === project.id);
              const criticalInterventions = interventions.filter(i =>
                i.severity === 'critical' || i.severity === 'high'
              ).length;

              if (criticalInterventions > 3) {
                leakageFactors.push(`${criticalInterventions} critical issues`);
                leakageScore += criticalInterventions * 5;
              }

              // Calculate value at risk
              const expectedRoi = parseFloat(project.expectedRoi || '0');
              const valueAtRisk = (expectedRoi * leakageScore) / 100;

              if (leakageScore > 20) { // Threshold for concern
                valueLeakage.push({
                  projectId: project.id,
                  projectName: project.name,
                  leakageScore: leakageScore.toFixed(1),
                  expectedRoi,
                  valueAtRisk: valueAtRisk.toFixed(2),
                  leakageFactors,
                  severity: leakageScore > 50 ? 'critical' : leakageScore > 30 ? 'high' : 'medium',
                });
              }
            }

            // Sort by value at risk (highest first)
            valueLeakage.sort((a, b) => parseFloat(b.valueAtRisk) - parseFloat(a.valueAtRisk));

            // AUTO-CREATE INTERVENTIONS for significant value leakage
            const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
            const notificationMCP = getNotificationMCP();
            let interventionsCreated = 0;

            for (const leakage of valueLeakage) {
              if (leakage.severity === 'critical' || (leakage.severity === 'high' && parseFloat(leakage.valueAtRisk) > 5)) {
                await this.storage.createIntervention({
                  type: 'value_leakage',
                  severity: leakage.severity,
                  title: `Value Leakage Detected: ${leakage.projectName}`,
                  description: `Significant value leakage detected (${leakage.leakageScore}% score). At risk of losing $${leakage.valueAtRisk}M in value.\n\n**Leakage Factors:**\n${leakage.leakageFactors.map((f: string) => `• ${f}`).join('\n')}\n\nExpected ROI: $${leakage.expectedRoi}M`,
                  suggestedAction: leakage.severity === 'critical'
                    ? 'URGENT: Conduct value recovery session. Address root causes immediately to prevent further value erosion.'
                    : 'Schedule project health review to address leakage factors and implement corrective actions.',
                  projectId: leakage.projectId,
                  projectName: leakage.projectName,
                  agentSource: 'VRO Agent',
                  confidence: '0.82',
                  isAutonomous: 'false',
                });

                // Send critical alert for high value at risk
                if (leakage.severity === 'critical' || parseFloat(leakage.valueAtRisk) > 10) {
                  await notificationMCP.sendCriticalAlert({
                    title: `Critical Value Leakage: ${leakage.projectName}`,
                    message: `$${leakage.valueAtRisk}M value at risk due to: ${leakage.leakageFactors.join(', ')}. Immediate action required.`,
                    agent: 'VRO Agent',
                    projectName: leakage.projectName,
                    projectId: leakage.projectId,
                    actionUrl: `${process.env.APP_URL || 'http://localhost:5000'}/command-center`,
                  });
                }

                interventionsCreated++;
                if (interventionsCreated >= 15) break;
              }
            }

            return JSON.stringify({
              projectsWithLeakage: valueLeakage.length,
              totalValueAtRisk: valueLeakage.reduce((sum, v) => sum + parseFloat(v.valueAtRisk), 0).toFixed(2),
              valueLeakage: valueLeakage.slice(0, limit),
              interventionsCreated,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting VRO Agent - VALUE REALIZATION ASSESSMENT');

    const input = `Perform comprehensive VALUE REALIZATION assessment. This is NOT about execution - PMO handles that.

YOUR FOCUS: Are projects delivering BUSINESS VALUE?

CRITICAL ANALYSIS REQUIRED:
1. Benefits Realization Tracking
   - Use track_benefits_realization tool for ALL projects with expectedRoi
   - Flag projects with >20% negative ROI variance
   - CREATE INTERVENTIONS for >30% variance (critical value gap)

2. Business Case Validation
   - Use validate_business_case_assumptions for high-value projects (>$10M)
   - Check if assumptions still valid (market, tech, strategy)
   - Recommend PIVOT/STOP if invalidated

3. Strategic Alignment
   - Use measure_strategic_alignment to verify OKR traceability
   - Flag zombie projects (no strategic owner)
   - Create interventions for misalignments on high-value projects

4. Value Leakage
   - Use identify_value_leakage to find where value is lost
   - Detect scope creep, poor adoption, capability gaps
   - Quantify value at risk

INTERVENTION CREATION RULES:
- Critical: ROI variance >30%, business case invalid, high-value project misaligned
- High: ROI variance >20%, significant value leakage (>30%)
- Medium: Moderate variances, strategic alignment concerns

IMPORTANT: I will send Slack/Teams alerts for critical value issues after this scan.
Focus on OUTCOMES (value delivered) not OUTPUTS (features completed).
Remember: VALUE GUARDIAN role - ensure we're pursuing the right projects.`;

    try {
      await this.execute(input);

      // Send critical value realization alerts via Slack/Teams
      await this.sendValueRealizationAlerts();
    } catch (error) {
      console.error('[VROAgent] Scheduled scan error:', error);
    }
  }

  /**
   * Send Slack/Teams alerts for critical value realization issues
   */
  private async sendValueRealizationAlerts(): Promise<void> {
    try {
      const allInterventions = await this.storage.getInterventions();
      const interventions = allInterventions.filter((i: any) => i.agentId === 'vro');
      const recentCritical = interventions
        .filter((i: any) => (i.severity === 'critical' || i.severity === 'high') && i.createdAt && this.isRecent(new Date(i.createdAt), 15))
        .slice(0, 5);

      if (recentCritical.length === 0) return;

      const { getNotificationMCP } = await import('../mcp/NotificationMCP.js');
      const notificationMCP = getNotificationMCP();

      for (const intervention of recentCritical) {
        await notificationMCP.sendValueRealizationAlert({
          projectName: intervention.projectName || 'Unknown Project',
          projectId: intervention.projectId || '',
          expectedROI: 100,
          actualValue: 70,
          variance: -30,
        });
      }

      console.log(`[VROAgent] Sent ${recentCritical.length} value realization alerts`);
    } catch (error) {
      console.error('[VROAgent] Error sending alerts:', error);
    }
  }

  private isRecent(timestamp: Date | string, minutes: number): boolean {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diffMs = Date.now() - date.getTime();
    return diffMs < minutes * 60 * 1000;
  }
}
