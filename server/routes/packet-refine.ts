/**
 * Packet Refinement Endpoint
 *
 * Handles the two-way collaborative interaction between users and agents.
 * When a user says "show me this as a table" or "break it down by quarter",
 * this endpoint sends the request + original data to the LLM via OpenRouter,
 * and returns a revised AgentUIPacket with the new visualization.
 *
 * The LLM sees:
 * 1. The original data the agent used
 * 2. The current visualization blocks
 * 3. The user's request
 * 4. The conversation history
 *
 * And produces:
 * - Revised UIBlocks with different visualization choices
 * - An explanation of what changed and why
 * - Optionally, new insights discovered through the re-visualization
 */

import { Router, Request, Response } from 'express';
import { openRouterClient } from '../lib/OpenRouterClient.js';
import { createAgentUIPacket, type UIBlock, type AgentUIPacket } from '../../shared/agentUIPacket.js';

const router = Router();

// ============================================================================
// System prompt that teaches the LLM how to produce UIBlocks
// ============================================================================

const REFINEMENT_SYSTEM_PROMPT = `You are an AI visualization agent that reshapes data presentations based on user requests.

You receive:
- sourceData: the raw data behind the current visualization
- currentBlocks: the current UIBlock visualization (JSON)
- userPrompt: what the user wants changed

You must respond with valid JSON containing:
{
  "explanation": "Brief explanation of what you changed and why",
  "blocks": [ ...UIBlock array... ],
  "newInsight": "Optional: any new insight you noticed while reshaping the data"
}

Available UIBlock types:
- kpi: { type: "kpi", label, value, unit?, delta?, deltaLabel?, trend?, severity? }
- kpi-row: { type: "kpi-row", kpis: [kpi blocks] }
- bar-chart: { type: "bar-chart", title?, data: [{...}], categories: [...], index: "key", colors?, stacked?, layout? }
- area-chart: { type: "area-chart", title?, data: [{...}], categories: [...], index: "key", colors?, stacked? }
- donut-chart: { type: "donut-chart", title?, data: [{name, value}], colors?, label? }
- table: { type: "table", title?, columns: [{key, label, format?, align?, badgeColorMap?}], rows: [{...}], sortable? }
  - format options: text, number, currency, percentage, date, badge
- insight: { type: "insight", title, body, severity: "info"|"warning"|"critical"|"success", source?, confidence? }
- recommendation: { type: "recommendation", title, body, impact, effort, actionLabel? }
- progress: { type: "progress", title?, items: [{label, value (0-100), target?, color?, status?}] }
- markdown: { type: "markdown", content: "markdown text" }
- status-list: { type: "status-list", title?, items: [{label, status: "ok"|"warning"|"critical"|"pending"|"blocked", detail?}] }

Rules:
1. ALWAYS preserve the underlying data — reshape the visualization, don't invent data
2. If the user asks for "narrative" or "summary", use the markdown block type
3. If the user asks for a specific chart type, use it
4. Include insights when you notice something interesting while reshaping
5. Keep the response focused — don't add excessive blocks
6. Respond ONLY with the JSON object, no markdown fences or extra text`;

// ============================================================================
// POST /api/copilot/refine-packet
// ============================================================================

router.post('/refine-packet', async (req: Request, res: Response) => {
  try {
    const {
      packetId,
      agentId,
      userPrompt,
      sourceData,
      currentBlocks,
      conversationHistory,
    } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ error: 'userPrompt is required' });
    }

    // Build the user message with context
    const userMessage = [
      `The user is looking at a visualization from the ${agentId || 'unknown'} agent.`,
      '',
      sourceData ? `SOURCE DATA:\n${JSON.stringify(sourceData, null, 2)}` : '',
      '',
      `CURRENT VISUALIZATION:\n${JSON.stringify(currentBlocks, null, 2)}`,
      '',
      `USER REQUEST: ${userPrompt}`,
    ].filter(Boolean).join('\n');

    // Include conversation history for context
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }

    messages.push({ role: 'user', content: userMessage });

    // Call OpenRouter
    const response = await openRouterClient.chat(messages, {
      temperature: 0.4, // Lower temperature for more consistent JSON
      maxTokens: 4096,
    });

    // Parse the LLM's JSON response
    let parsed: { explanation?: string; blocks?: UIBlock[]; newInsight?: string };
    try {
      // Handle potential markdown fences
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[PacketRefine] Failed to parse LLM response:', response.substring(0, 500));
      return res.json({
        response: response, // Return as text if JSON parse fails
        revisedPacket: null,
      });
    }

    if (parsed.blocks && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
      // Build the revised packet
      const agentRegistry: Record<string, { name: string; color: string }> = {
        'pmo-agent': { name: 'PMO Agent', color: 'violet' },
        'finops-agent': { name: 'FinOps Agent', color: 'emerald' },
        'risk-agent': { name: 'Risk Agent', color: 'rose' },
        'ocm-agent': { name: 'OCM Agent', color: 'cyan' },
        'tmo-agent': { name: 'TMO Agent', color: 'blue' },
        'vro-agent': { name: 'VRO Agent', color: 'amber' },
        'governance-agent': { name: 'Governance Agent', color: 'indigo' },
        'planning-agent': { name: 'Planning Agent', color: 'teal' },
      };

      const agent = agentRegistry[agentId] || { name: agentId || 'Agent', color: 'violet' };

      // If the LLM discovered a new insight, add it as a block
      if (parsed.newInsight) {
        parsed.blocks.push({
          type: 'insight',
          title: 'New Insight from Re-analysis',
          body: parsed.newInsight,
          severity: 'info',
          source: 'Collaborative re-visualization',
        });
      }

      const revisedPacket = createAgentUIPacket(
        { id: agentId, name: agent.name, color: agent.color },
        `Revised: ${userPrompt.substring(0, 60)}`,
        parsed.blocks,
        { sourceData }
      );

      return res.json({
        explanation: parsed.explanation || 'Visualization updated.',
        revisedPacket,
      });
    }

    // No blocks returned — just a text response
    return res.json({
      response: parsed.explanation || response,
      revisedPacket: null,
    });

  } catch (err: any) {
    console.error('[PacketRefine] Error:', err.message);
    return res.status(500).json({
      error: 'Failed to refine packet',
      message: err.message,
    });
  }
});

export default router;
