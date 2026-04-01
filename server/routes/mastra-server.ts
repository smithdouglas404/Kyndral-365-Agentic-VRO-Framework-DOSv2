/**
 * MASTRA SERVER ROUTES
 *
 * Exposes Mastra agents via HTTP REST API.
 * This enables viewing and interacting with agents.
 */

import { Router } from 'express';
import { getMastra, isMastraInitialized, listAgentTypes, getAgentConfigs } from '../mastra/index.js';

const router = Router();

// Middleware to check Mastra is initialized
const checkMastra = (req: any, res: any, next: any) => {
  if (!isMastraInitialized()) {
    return res.status(503).json({ error: 'Mastra not initialized' });
  }
  next();
};

/**
 * GET /api/mastra/agents
 * List all agents
 */
router.get('/agents', checkMastra, async (req, res) => {
  try {
    const configs = getAgentConfigs();
    const agents = Object.entries(configs).map(([key, config]) => ({
      id: config.id,
      name: config.name,
      type: key,
      model: config.model,
      hasTools: Object.keys(config.tools || {}).length > 0,
      toolCount: Object.keys(config.tools || {}).length,
    }));

    res.json({
      success: true,
      agents,
      count: agents.length,
    });
  } catch (error: any) {
    console.error('[MastraServer] Error listing agents:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mastra/agents/:agentId
 * Get a specific agent's details
 */
router.get('/agents/:agentId', checkMastra, async (req, res) => {
  try {
    const configs = getAgentConfigs();
    const agentType = req.params.agentId.replace('-agent', '');
    const config = configs[agentType as keyof typeof configs];

    if (!config) {
      return res.status(404).json({ error: `Agent not found: ${req.params.agentId}` });
    }

    res.json({
      success: true,
      agent: {
        id: config.id,
        name: config.name,
        type: agentType,
        instructions: config.instructions,
        model: config.model,
        tools: Object.keys(config.tools || {}),
      },
    });
  } catch (error: any) {
    console.error('[MastraServer] Error getting agent:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mastra/agents/:agentId/generate
 * Generate a response from an agent
 */
router.post('/agents/:agentId/generate', checkMastra, async (req, res) => {
  try {
    const mastra = getMastra();
    const agentId = req.params.agentId;
    const { messages } = req.body;

    const agent = mastra.getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: `Agent not found: ${agentId}` });
    }

    const result = await agent.generate(messages);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[MastraServer] Error generating:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mastra/status
 * Get Mastra status and configuration
 */
router.get('/status', (req, res) => {
  const initialized = isMastraInitialized();
  const agentTypes = initialized ? listAgentTypes() : [];

  res.json({
    success: true,
    status: {
      initialized,
      agentCount: agentTypes.length,
      agentTypes,
      apiKeyConfigured: !!process.env.MASTRA_API_KEY,
    },
  });
});

export default router;
