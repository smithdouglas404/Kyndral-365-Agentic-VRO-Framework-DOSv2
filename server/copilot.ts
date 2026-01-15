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
      
      const systemPrompt = `You are an AI agent co-pilot for a NextEra Energy Transformation Office dashboard. Your role is to analyze data and provide insights as if you are the ${context.agentId.toUpperCase()} Agent.

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

  app.post('/api/copilot/page-summary', async (req, res) => {
    try {
      const context = req.body;
      
      const systemPrompt = `You are an AI agent wizard for a NextEra Energy Transformation Office application. Your role is to provide a comprehensive page-level summary that helps users understand what they're looking at.

Your personality traits:
- Professional and authoritative
- Proactive in identifying issues across the entire page
- Always offer actionable recommendations
- Be the user's guide through complex data
- Use "I" when referring to yourself

Response format (JSON):
{
  "greeting": "A warm greeting that acknowledges what page/section the user is viewing and summarizes the overall health",
  "situation": "1-2 sentence overview of the current state of this page/entity",
  "concerns": ["Array of specific issues detected across all sections of the page"],
  "recommendations": ["Array of prioritized actionable next steps"],
  "questions": ["Array of 2-3 questions to help the user explore further"]
}`;

      const metricsStr = context.metrics 
        ? Object.entries(context.metrics).map(([k, v]) => `- ${k}: ${v}`).join('\n')
        : 'No specific metrics provided';

      const userPrompt = `Provide a page-level summary for this view:

Page: ${context.pageName}
Type: ${context.pageType}
Entity ID: ${context.entityId || 'N/A'}
Active Alerts: ${context.alertCount || 0}
Risks: ${context.riskCount || 0}
Projects: ${context.projectCount || 0}

Metrics:
${metricsStr}

Analyze the overall state of this page. Identify any concerns (alerts, risks, at-risk items, budget issues) and provide recommendations. Be specific and actionable.`;

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
            res.json({ fallback: true });
          }
        } catch {
          res.json({ fallback: true });
        }
      }
    } catch (error) {
      console.error('Page summary error:', error);
      res.json({ fallback: true });
    }
  });

  app.post('/api/copilot/chat', async (req, res) => {
    try {
      const { question, context } = req.body;
      
      const systemPrompt = `You are an AI co-pilot assistant for a NextEra Energy Transformation Office application. You are helpful, knowledgeable, and provide actionable advice.

Context:
- Page: ${context?.pageName || 'Unknown'}
- Type: ${context?.pageType || 'Unknown'}

Metrics available:
${context?.metrics ? Object.entries(context.metrics).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'No specific metrics'}

Respond conversationally but professionally. Be specific and actionable. Keep responses concise (2-4 paragraphs max).`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: question }
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type === 'text') {
        res.json({ response: content.text });
      } else {
        res.json({ response: 'I apologize, I could not generate a response at this time.' });
      }
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        response: 'I apologize, but I encountered an error processing your request. Please try again.' 
      });
    }
  });
}
