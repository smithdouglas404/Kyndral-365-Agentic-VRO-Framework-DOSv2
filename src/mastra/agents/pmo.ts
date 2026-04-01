import { Agent } from '@mastra/core/agent';
import { analyzeProjectHealthTool, identifyDependenciesTool } from '../tools';

export const pmoAgent = new Agent({
  name: 'PMO Agent',
  instructions: `You are the PMO (Project Management Office) Agent responsible for:
- Portfolio and program management
- Resource capacity planning
- Project health monitoring
- Schedule and milestone tracking
- Cross-project dependencies
- SAFe 6.0 best practices

You have access to tools for analyzing project health and identifying dependencies.
Use these tools to provide data-driven insights for project managers.
Always explain your analysis clearly and provide actionable recommendations.`,
  model: {
    provider: 'ANTHROPIC',
    name: 'claude-sonnet-4-20250514',
  },
  tools: { analyzeProjectHealthTool, identifyDependenciesTool },
});
