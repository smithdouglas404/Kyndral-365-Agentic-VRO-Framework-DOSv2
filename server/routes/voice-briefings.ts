/**
 * VOICE BRIEFINGS API
 * NotebookLM-style podcast generation for project summaries
 *
 * Creates conversational audio briefings with two AI hosts discussing:
 * - Project status, risks, and opportunities
 * - Agent recommendations and reasoning
 * - Key metrics and trends
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface VoiceBriefingRequest {
  projectId?: string;
  portfolioId?: string;
  type: 'project' | 'portfolio' | 'weekly_summary';
  includeRisks?: boolean;
  includeRecommendations?: boolean;
}

/**
 * Generate conversational podcast script using Claude
 */
async function generatePodcastScript(
  storage: IStorage,
  request: VoiceBriefingRequest
): Promise<string> {
  let contextData = '';

  if (request.type === 'project' && request.projectId) {
    const project = await storage.getProject(request.projectId);
    const tasks = await storage.getTasks(request.projectId);
    const risks = await storage.getRisks(request.projectId);
    const interventions = await storage.getInterventions(request.projectId);

    contextData = `
PROJECT: ${project?.name}
Status: ${project?.status}
Budget: $${project?.budget} | Spent: $${project?.actualCost || 0}
Timeline: ${project?.startDate} to ${project?.endDate}
Progress: ${project?.progress || 0}%

KEY METRICS:
- ${tasks.length} tasks (${tasks.filter(t => t.status === 'done').length} completed)
- ${risks.length} active risks
- ${interventions.filter(i => i.status === 'pending').length} pending agent recommendations

RECENT INTERVENTIONS:
${interventions.slice(0, 3).map(i => `- ${i.type}: ${i.title} (${i.agentSource})`).join('\n')}

ACTIVE RISKS:
${risks.slice(0, 3).map(r => `- ${r.title} (${r.severity} severity)`).join('\n')}
`;
  }

  const prompt = `You are creating a conversational podcast script for a project management briefing.

Create a natural, engaging dialogue between two AI hosts:
- **Sarah** (PMO Analyst): Data-driven, analytical, focuses on metrics and details
- **Marcus** (Executive Coach): Strategic thinker, focuses on big picture and impact

The conversation should be 2-3 minutes when spoken (approximately 300-450 words).

PROJECT DATA:
${contextData}

STYLE GUIDELINES:
- Natural conversational flow with interruptions, reactions, and back-and-forth
- Use "um", "you know", "I mean" sparingly for naturalness
- Sarah should cite specific numbers and data points
- Marcus should connect to business outcomes and strategic value
- Include moments of insight, agreement, concern, or excitement
- End with actionable takeaways

FORMAT:
Sarah: [opening line]
Marcus: [response]
Sarah: [continues]
...

Generate the podcast script now:`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Failed to generate podcast script');
}

/**
 * Convert script to speech using ElevenLabs or OpenAI TTS
 * For now, this is a placeholder that would integrate with TTS service
 */
async function generateAudioFromScript(script: string): Promise<{
  audioUrl: string;
  duration: number;
}> {
  // In production, this would:
  // 1. Parse script to identify speakers
  // 2. Call ElevenLabs API with different voice IDs for Sarah and Marcus
  // 3. Stitch audio segments together
  // 4. Upload to storage (S3, CDN, etc.)
  // 5. Return playback URL

  // For now, return mock data
  return {
    audioUrl: '/api/voice-briefings/audio/mock-briefing.mp3',
    duration: 180, // 3 minutes
  };
}

export function registerVoiceBriefingRoutes(app: Express, storage: IStorage) {
  /**
   * Generate voice briefing script
   */
  app.post('/api/voice-briefings/generate-script', async (req: Request, res: Response) => {
    try {
      const request: VoiceBriefingRequest = req.body;

      if (!request.type) {
        return res.status(400).json({ error: 'Briefing type is required' });
      }

      if (request.type === 'project' && !request.projectId) {
        return res.status(400).json({ error: 'Project ID is required for project briefings' });
      }

      const script = await generatePodcastScript(storage, request);

      res.json({
        success: true,
        script,
        estimatedDuration: Math.ceil(script.split(' ').length / 150), // ~150 words per minute
      });
    } catch (error: any) {
      console.error('Error generating briefing script:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate briefing script',
        message: error.message,
      });
    }
  });

  /**
   * Generate complete voice briefing (script + audio)
   */
  app.post('/api/voice-briefings/generate', async (req: Request, res: Response) => {
    try {
      const request: VoiceBriefingRequest = req.body;

      if (!request.type) {
        return res.status(400).json({ error: 'Briefing type is required' });
      }

      if (request.type === 'project' && !request.projectId) {
        return res.status(400).json({ error: 'Project ID is required for project briefings' });
      }

      // Step 1: Generate script
      const script = await generatePodcastScript(storage, request);

      // Step 2: Convert to audio (placeholder for now)
      const audio = await generateAudioFromScript(script);

      // Step 3: Store briefing record
      const briefing = {
        id: `briefing-${Date.now()}`,
        type: request.type,
        projectId: request.projectId,
        portfolioId: request.portfolioId,
        script,
        audioUrl: audio.audioUrl,
        duration: audio.duration,
        createdAt: new Date(),
      };

      res.json({
        success: true,
        briefing,
      });
    } catch (error: any) {
      console.error('Error generating voice briefing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate voice briefing',
        message: error.message,
      });
    }
  });

  /**
   * Get available briefings for a project/portfolio
   */
  app.get('/api/voice-briefings', async (req: Request, res: Response) => {
    try {
      const { projectId, portfolioId } = req.query;

      // In production, this would query a briefings table
      // For now, return empty array
      res.json({
        success: true,
        briefings: [],
      });
    } catch (error: any) {
      console.error('Error fetching briefings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch briefings',
        message: error.message,
      });
    }
  });

  console.log('[VoiceBriefings] Voice briefing routes registered');
}
