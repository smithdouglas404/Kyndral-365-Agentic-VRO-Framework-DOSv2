import { AgentBase, AgentConfig } from './base/AgentBase.js';
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { IStorage } from '../storage.js';

/**
 * FinOps Agent - Financial Operations and Budget Management
 * Autonomy: FULL (can self-approve interventions)
 * Focus: Budget tracking, CPI monitoring, cost optimization
 */
export class FinOpsAgent extends AgentBase {
  constructor(storage: IStorage) {
    super({
      agentId: 'finops',
      agentName: 'FinOps Agent',
      focus: 'budget, cost, CPI, spending, financial',
      autonomy: 'full',
      temperature: 0.5, // Lower temperature for financial analysis
    }, storage);
  }

  protected getSystemPrompt(): string {
    return `You are the FinOps Agent for NextEra Energy's Enterprise Transformation Office.

Your responsibilities:
- Monitor Cost Performance Index (CPI) across all projects
- Detect budget variances and spending anomalies
- Recommend cost optimization opportunities
- Enforce financial governance policies
- Escalate critical budget risks

You have FULL AUTONOMY for:
- Cost reallocation recommendations (within 10% threshold)
- Budget alerts and notifications
- Resource utilization optimizations

You must ESCALATE to human for:
- Budget increases >10%
- Contingency fund releases
- Cross-portfolio fund transfers

When detecting issues, output interventions in this format:
<INTERVENTION type="budget" severity="high">
Description of issue and recommended action
</INTERVENTION>

IMPORTANT: Only create interventions based on REAL DATA from the ontology queries.
Never fabricate or simulate data. Query the ontology first, then analyze actual results.

Always query the ontology using your tools before making decisions.`;
  }

  protected defineTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: "query_project_budgets",
        description: "Query all projects with budget and CPI data from the ontology. Returns real project data only.",
        schema: z.object({
          minCPI: z.number().optional().describe("Filter projects with CPI below this value (e.g., 0.9 for over budget)"),
          maxCPI: z.number().optional().describe("Filter projects with CPI above this value"),
          limit: z.number().default(50).describe("Maximum number of projects to return"),
        }),
        func: async ({ minCPI, maxCPI, limit }) => {
          try {
            // Query real project data from PostgreSQL
            const projects = await this.storage.getProjects();

            // Filter by CPI if specified
            let filtered = projects;

            if (minCPI !== undefined) {
              filtered = filtered.filter(p => {
                const cpi = parseFloat(p.cpiValue || '1.0');
                return cpi >= minCPI;
              });
            }

            if (maxCPI !== undefined) {
              filtered = filtered.filter(p => {
                const cpi = parseFloat(p.cpiValue || '1.0');
                return cpi <= maxCPI;
              });
            }

            // Limit results
            const results = filtered.slice(0, limit).map(p => ({
              id: p.id,
              name: p.name,
              status: p.status,
              budget: p.budgetTotal,
              spent: p.budgetSpent,
              cpi: p.cpiValue,
              spi: p.spiValue,
            }));

            return JSON.stringify({
              totalProjects: projects.length,
              filteredProjects: filtered.length,
              returned: results.length,
              projects: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "calculate_budget_forecast",
        description: "Forecast budget at completion based on current CPI for a specific project",
        schema: z.object({
          projectId: z.string().describe("Project ID to analyze"),
        }),
        func: async ({ projectId }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return JSON.stringify({ error: "Project not found" });
            }

            const budget = parseFloat(project.budgetTotal || '0');
            const spent = parseFloat(project.budgetSpent || '0');
            const cpi = parseFloat(project.cpiValue || '1.0');

            // Calculate Estimate at Completion (EAC)
            const remainingWork = budget - spent;
            const forecastRemaining = remainingWork / cpi;
            const budgetAtCompletion = spent + forecastRemaining;
            const variance = budgetAtCompletion - budget;
            const variancePercent = (variance / budget) * 100;

            return JSON.stringify({
              projectId,
              projectName: project.name,
              currentBudget: budget,
              spent,
              cpi,
              forecastBudget: budgetAtCompletion.toFixed(2),
              variance: variance.toFixed(2),
              variancePercent: variancePercent.toFixed(1) + '%',
              status: cpi < 0.9 ? 'CRITICAL' : cpi < 1.0 ? 'WARNING' : 'ON_TRACK',
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "check_financial_policies",
        description: "Check if a budget action violates financial governance policies",
        schema: z.object({
          actionType: z.enum(['increase', 'transfer', 'reallocate']).describe("Type of financial action"),
          amount: z.number().describe("Amount in dollars"),
          projectId: z.string().describe("Project ID affected"),
        }),
        func: async ({ actionType, amount, projectId }) => {
          try {
            const project = await this.storage.getProject(projectId);
            if (!project) {
              return JSON.stringify({ error: "Project not found" });
            }

            const budget = parseFloat(project.budgetTotal || '0');
            const percentChange = (amount / budget) * 100;

            // Policy thresholds
            const policies = {
              maxIncreasePercent: 10,
              requiresApproval: amount > 100000,
              needsCFOSignoff: amount > 500000,
              allowedWithinThreshold: percentChange <= 10,
            };

            const violations: string[] = [];

            if (actionType === 'increase' && percentChange > policies.maxIncreasePercent) {
              violations.push(`Budget increase of ${percentChange.toFixed(1)}% exceeds 10% threshold`);
            }

            if (amount > 500000) {
              violations.push('Amount requires CFO sign-off');
            } else if (amount > 100000) {
              violations.push('Amount requires PMO Director approval');
            }

            return JSON.stringify({
              projectId,
              projectName: project.name,
              actionType,
              amount,
              percentChange: percentChange.toFixed(1) + '%',
              policies,
              violations,
              allowed: violations.length === 0,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),

      new DynamicStructuredTool({
        name: "get_portfolio_spending",
        description: "Get aggregate spending data across all portfolios",
        schema: z.object({
          portfolioId: z.string().optional().describe("Specific portfolio ID, or omit for all"),
        }),
        func: async ({ portfolioId }) => {
          try {
            const portfolios = await this.storage.getPortfolios();
            let targetPortfolios = portfolios;

            if (portfolioId) {
              const portfolio = await this.storage.getPortfolio(portfolioId);
              if (!portfolio) {
                return JSON.stringify({ error: "Portfolio not found" });
              }
              targetPortfolios = [portfolio];
            }

            const results = [];

            for (const portfolio of targetPortfolios) {
              const projects = await this.storage.getProjectsByPortfolio(portfolio.id);

              let totalBudget = 0;
              let totalSpent = 0;
              let projectCount = projects.length;

              for (const project of projects) {
                totalBudget += parseFloat(project.budgetTotal || '0');
                totalSpent += parseFloat(project.budgetSpent || '0');
              }

              const avgCPI = totalBudget > 0 ? totalSpent / totalBudget : 1.0;

              results.push({
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                projectCount,
                totalBudget,
                totalSpent,
                remaining: totalBudget - totalSpent,
                avgCPI: avgCPI.toFixed(2),
                utilizationPercent: ((totalSpent / totalBudget) * 100).toFixed(1) + '%',
              });
            }

            return JSON.stringify({
              portfolioCount: results.length,
              portfolios: results,
            });
          } catch (error: any) {
            return JSON.stringify({ error: error.message });
          }
        },
      }),
    ];
  }

  /**
   * Scheduled scan for budget issues
   * This runs periodically to detect financial problems
   */
  async runScheduledScan(): Promise<void> {
    await this.logActivity('scheduled_scan', 'Starting FinOps scheduled budget scan');

    const input = `Scan all projects for budget variances. Check for:
1. Projects with CPI < 0.9 (over budget)
2. Projects with >15% budget variance
3. Projects that will exceed budget based on current burn rate

For each issue found, create an intervention with recommended actions.
Use the query_project_budgets tool first to get real data, then analyze.
Only create interventions if you find actual problems in the data.`;

    try {
      await this.execute(input);
    } catch (error) {
      console.error('[FinOpsAgent] Scheduled scan error:', error);
    }
  }
}
