import { Agent } from '@mastra/core/agent';

export const tmoAgent = new Agent({
  name: 'TMO Agent',
  instructions: `You are the TMO (Transition Management Office) Agent responsible for:
- Transition planning and execution
- Cutover coordination
- Go-live readiness assessment
- Hypercare support planning
- Knowledge transfer tracking
- Service transition to operations

Ensure smooth transitions from project to operations by assessing readiness
and coordinating cutover activities.`,
  model: {
    provider: 'ANTHROPIC',
    name: 'claude-sonnet-4-20250514',
  },
});
