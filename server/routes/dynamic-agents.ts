import { Router, type Request, type Response } from 'express';
import {
  registerAgent,
  updateAgent,
  removeAgent,
  listDynamicAgents,
  getDynamicAgentConfig,
  getAvailableToolSets,
  getToolSetDetails,
  getDynamicAgentCards,
  type DynamicAgentConfig,
} from '../mastra/DynamicAgentLoader.js';
import { dynamicAgents } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { IStorage } from '../storage.js';

export function createDynamicAgentRoutes(storage: IStorage): Router {
  const router = Router();

  router.get('/agents', (_req: Request, res: Response) => {
    try {
      const agents = listDynamicAgents();
      res.json({
        success: true,
        count: agents.length,
        agents: agents.map(({ key, config }) => ({
          key,
          id: config.agentId,
          name: config.name,
          enabled: config.enabled,
          model: config.model,
          skillCount: config.skills?.length || 0,
          toolMappings: config.toolMappings,
          tags: config.tags,
          palantirObjectTypes: config.palantirObjectTypes,
          memoryNamespace: config.memoryNamespace,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/agents/:key', (req: Request, res: Response) => {
    try {
      const config = getDynamicAgentConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }
      res.json({ success: true, agent: config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/agents', async (req: Request, res: Response) => {
    try {
      const body = req.body as DynamicAgentConfig;

      if (!body.agentKey || !body.agentId || !body.name || !body.instructions) {
        return res.status(400).json({
          success: false,
          error: 'Required fields: agentKey, agentId, name, instructions',
        });
      }

      if (!body.skills) body.skills = [];
      if (!body.toolMappings) body.toolMappings = [];
      if (!body.tags) body.tags = [];

      const result = await registerAgent(body);
      if (result.success) {
        res.status(201).json({ success: true, message: `Agent ${body.name} registered and live` });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.put('/agents/:key', async (req: Request, res: Response) => {
    try {
      const config = getDynamicAgentConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }

      const result = await updateAgent(req.params.key, req.body);
      if (result.success) {
        res.json({ success: true, message: `Agent ${req.params.key} updated and reloaded` });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.delete('/agents/:key', async (req: Request, res: Response) => {
    try {
      const result = await removeAgent(req.params.key);
      if (result.success) {
        res.json({ success: true, message: `Agent ${req.params.key} removed` });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/tool-registry', (_req: Request, res: Response) => {
    try {
      const toolSets = getAvailableToolSets();
      const details = getToolSetDetails();
      res.json({
        success: true,
        availableToolSets: toolSets,
        toolDetails: details,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/agent-cards', (_req: Request, res: Response) => {
    try {
      const cards = getDynamicAgentCards();
      res.json({ success: true, count: cards.length, cards });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/agents-db', async (_req: Request, res: Response) => {
    try {
      const rows = await storage.db.select().from(dynamicAgents).execute();
      res.json({
        success: true,
        count: rows.length,
        agents: rows.map(r => ({
          id: r.id,
          agentKey: r.agentKey,
          agentId: r.agentId,
          name: r.name,
          enabled: r.enabled,
          model: r.model,
          skills: JSON.parse(r.skills || '[]').length,
          toolMappings: JSON.parse(r.toolMappings || '[]'),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
