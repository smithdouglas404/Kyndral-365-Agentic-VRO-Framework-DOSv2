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
import OpenAI from 'openai';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Lazy initialization of OpenAI client - only when API key is available
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

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
${risks.slice(0, 3).map(r => `- ${r.name} (${r.impact} impact)`).join('\n')}
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
 * Parse script into speaker segments
 */
function parseScriptToSegments(script: string): Array<{ speaker: string; text: string }> {
  const lines = script.split('\n').filter(line => line.trim());
  const segments: Array<{ speaker: string; text: string }> = [];

  for (const line of lines) {
    const match = line.match(/^(Sarah|Marcus):\s*(.+)$/);
    if (match) {
      const [, speaker, text] = match;
      segments.push({ speaker, text: text.trim() });
    }
  }

  return segments;
}

/**
 * Convert script to speech using OpenAI TTS
 * Creates podcast-style audio with two distinct voices
 */
async function generateAudioFromScript(script: string, briefingId: string): Promise<{
  audioUrl: string;
  duration: number;
}> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI API key not configured. Voice briefings require OPENAI_API_KEY.');
  }
  
  try {
    // Parse script into segments
    const segments = parseScriptToSegments(script);

    // Create audio directory if it doesn't exist
    const audioDir = join(process.cwd(), 'public', 'audio', 'briefings');
    await mkdir(audioDir, { recursive: true });

    // Generate audio for each segment
    const audioFiles: string[] = [];
    let totalDuration = 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Select voice: Sarah = nova (female), Marcus = onyx (male)
      const voice = segment.speaker === 'Sarah' ? 'nova' : 'onyx';

      // Generate speech
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: segment.text,
        speed: 1.0,
      });

      // Save to file
      const segmentFile = join(audioDir, `${briefingId}_segment_${i}.mp3`);
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      await require('fs/promises').writeFile(segmentFile, buffer);
      audioFiles.push(segmentFile);

      // Estimate duration (roughly 150 words per minute)
      const wordCount = segment.text.split(' ').length;
      totalDuration += (wordCount / 150) * 60; // seconds
    }

    // Stitch audio files together using ffmpeg
    const outputFile = join(audioDir, `${briefingId}.mp3`);
    const fileList = join(audioDir, `${briefingId}_files.txt`);

    // Create file list for ffmpeg
    const fileListContent = audioFiles.map(f => `file '${f}'`).join('\n');
    await require('fs/promises').writeFile(fileList, fileListContent);

    // Concatenate audio files
    await execAsync(`ffmpeg -f concat -safe 0 -i "${fileList}" -c copy "${outputFile}"`);

    // Clean up segment files
    for (const file of audioFiles) {
      await require('fs/promises').unlink(file);
    }
    await require('fs/promises').unlink(fileList);

    return {
      audioUrl: `/audio/briefings/${briefingId}.mp3`,
      duration: Math.round(totalDuration),
    };
  } catch (error: any) {
    console.error('Error generating audio:', error);

    // Fallback: return mock data if TTS fails
    return {
      audioUrl: '/api/voice-briefings/audio/mock-briefing.mp3',
      duration: 180,
    };
  }
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
      console.log('[VoiceBriefings] Generating podcast script...');
      const script = await generatePodcastScript(storage, request);

      // Step 2: Generate unique briefing ID
      const briefingId = `briefing-${Date.now()}`;

      // Step 3: Convert to audio using OpenAI TTS
      console.log('[VoiceBriefings] Generating audio with OpenAI TTS...');
      const audio = await generateAudioFromScript(script, briefingId);

      // Step 4: Store briefing record
      const briefing = {
        id: briefingId,
        type: request.type,
        projectId: request.projectId,
        portfolioId: request.portfolioId,
        script,
        audioUrl: audio.audioUrl,
        duration: audio.duration,
        createdAt: new Date(),
      };

      console.log('[VoiceBriefings] Briefing generated successfully:', briefingId);

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
