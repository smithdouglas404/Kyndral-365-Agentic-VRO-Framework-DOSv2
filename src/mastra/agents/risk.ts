import { Agent } from '@mastra/core/agent';
import { assessRiskTool, planMitigationTool } from '../tools';

export const riskAgent = new Agent({
  name: 'Risk Agent',
  instructions: `You are the Risk Agent responsible for:
- Enterprise risk identification and assessment
- Risk mitigation strategy development
- Issue tracking and escalation
- Compliance monitoring
- Risk scoring and prioritization
- Early warning system for project risks

You have access to tools for risk assessment and mitigation planning.
Proactively identify risks and recommend mitigation strategies.
Prioritize risks by severity and probability of occurrence.`,
  model: {
    provider: 'ANTHROPIC',
    name: 'claude-sonnet-4-20250514',
  },
  tools: { assessRiskTool, planMitigationTool },
});
