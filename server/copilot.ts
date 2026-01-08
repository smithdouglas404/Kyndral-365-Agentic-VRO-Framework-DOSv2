import Anthropic from '@anthropic-ai/sdk';
import type { Express } from 'express';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DrilldownContext {
  entityType: string;
  entityName: string;
  bu: string;
  metrics: Record<string, string | number>;
  agentId: string;
  relatedAgents: string[];
  eventsCount: number;
  actionsCount: number;
}

export function registerCoPilotRoutes(app: Express) {
  app.post('/api/copilot/analyze', async (req, res) => {
    try {
      const context: DrilldownContext = req.body;
      
      const systemPrompt = `You are an AI agent co-pilot for a Legal & General Transformation Office dashboard. Your role is to analyze data and provide insights as if you are the ${context.agentId.toUpperCase()} Agent.

Your personality traits:
- Professional but approachable
- Proactive in identifying issues
- Always offer actionable recommendations
- Ask clarifying questions when helpful
- Use "I" when referring to yourself as the agent
- Be concise but thorough

Response format (JSON):
{
  "greeting": "A warm, contextual greeting acknowledging what the user is looking at",
  "situation": "Brief 1-2 sentence summary of the current state",
  "concerns": ["Array of specific issues detected, if any"],
  "recommendations": ["Array of actionable next steps"],
  "questions": ["Array of 2-3 questions to help the user explore further"]
}`;

      const userPrompt = `Analyze this drilldown data and provide insights:

Entity: ${context.entityName}
Type: ${context.entityType}
Business Unit: ${context.bu}
Monitoring Agents: ${context.relatedAgents.join(', ')}
Active Events: ${context.eventsCount}
Pending Actions: ${context.actionsCount}

Metrics:
${Object.entries(context.metrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Analyze these metrics for any issues (low confidence, at-risk items, budget overruns, missed targets) and provide your assessment as the ${context.agentId.toUpperCase()} Agent.`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type === 'text') {
        try {
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const insights = JSON.parse(jsonMatch[0]);
            res.json(insights);
          } else {
            res.json({
              greeting: "I'm analyzing the data for you.",
              situation: content.text.slice(0, 200),
              concerns: [],
              recommendations: ["Continue monitoring metrics"],
              questions: ["Would you like me to drill deeper?"]
            });
          }
        } catch {
          res.json({
            greeting: "I'm here to help you understand this data.",
            situation: content.text.slice(0, 200),
            concerns: [],
            recommendations: ["Review the metrics carefully"],
            questions: ["What aspect would you like to explore?"]
          });
        }
      }
    } catch (error) {
      console.error('CoPilot error:', error);
      res.status(500).json({ 
        error: 'Failed to generate insights',
        fallback: true 
      });
    }
  });
}
