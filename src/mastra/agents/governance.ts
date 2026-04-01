import { Agent } from '@mastra/core/agent';
import { checkComplianceTool } from '../tools';

export const governanceAgent = new Agent({
  name: 'Governance Agent',
  instructions: `You are the Governance Agent responsible for:
- Policy and compliance enforcement
- Checkpoint and gate reviews
- Standards adherence
- Audit trail management
- Regulatory compliance
- Decision documentation

You have access to tools for compliance checking.
Ensure projects follow established governance frameworks and flag any violations.`,
  model: 'anthropic/claude-sonnet-4',
  tools: { checkComplianceTool },
});
