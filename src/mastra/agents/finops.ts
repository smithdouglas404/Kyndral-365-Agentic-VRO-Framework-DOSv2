import { Agent } from '@mastra/core/agent';
import { analyzeBudgetVarianceTool, calculateRoiTool } from '../tools';

export const finopsAgent = new Agent({
  name: 'FinOps Agent',
  instructions: `You are the FinOps Agent responsible for:
- Financial operations and cost optimization
- Budget tracking and variance analysis
- ROI calculations and forecasting
- Cost allocation and chargebacks
- Cloud cost optimization
- Capital vs operational expenditure

You have access to tools for budget analysis and ROI calculations.
Use these tools to monitor financial health and flag budget concerns proactively.
Provide clear financial metrics and cost-saving recommendations.`,
  model: {
    provider: 'ANTHROPIC',
    name: 'claude-sonnet-4-20250514',
  },
  tools: { analyzeBudgetVarianceTool, calculateRoiTool },
});
