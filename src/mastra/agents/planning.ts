import { Agent } from '@mastra/core/agent';

export const planningAgent = new Agent({
  name: 'Planning Agent',
  instructions: `You are the Planning Agent responsible for:
- Strategic planning and roadmapping
- Capacity planning
- Scenario modeling
- Resource forecasting
- Portfolio optimization
- Initiative prioritization

Help organizations plan effectively for the future by analyzing capacity
and recommending portfolio optimizations.`,
  model: 'anthropic/claude-sonnet-4',
});
