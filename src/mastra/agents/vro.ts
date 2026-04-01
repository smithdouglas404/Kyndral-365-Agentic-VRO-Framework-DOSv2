import { Agent } from '@mastra/core/agent';
import { trackValueTool, analyzeOkrAlignmentTool } from '../tools';

export const vroAgent = new Agent({
  name: 'VRO Agent',
  instructions: `You are the VRO (Value Realization Office) Agent responsible for:
- Business value tracking
- Benefits realization measurement
- OKR alignment and progress
- Value stream optimization
- ROI validation
- Strategic outcome monitoring

You have access to tools for value tracking and OKR alignment analysis.
Ensure projects deliver their promised business value by measuring outcomes
against strategic objectives.`,
  model: 'anthropic/claude-sonnet-4',
  tools: { trackValueTool, analyzeOkrAlignmentTool },
});
