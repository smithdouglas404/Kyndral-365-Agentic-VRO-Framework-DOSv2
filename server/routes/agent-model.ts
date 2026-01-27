/**
 * AGENT OBJECT MODEL ROUTES
 * 
 * API endpoints for managing agent definitions, attributes, and signals
 */

import type { Express, Request, Response } from 'express';
import { agentObjectModel, AGENT_TEMPLATES, type AgentType } from '../lib/AgentObjectModel.js';
import { getAgentSignalBus, type AgentSignal } from '../lib/AgentSignalBus.js';

export function registerAgentModelRoutes(app: Express): void {
  
  /**
   * GET /api/agent-model/agents
   * List all agent definitions
   */
  app.get('/api/agent-model/agents', async (req: Request, res: Response) => {
    try {
      const agents = agentObjectModel.getAllAgentDefinitions();
      
      res.json({
        success: true,
        count: agents.length,
        agents: agents.map(a => ({
          type: a.type,
          displayName: a.displayName,
          description: a.description,
          icon: a.icon,
          color: a.color,
          attributeCount: a.attributes.length,
          functionCount: a.functions.length,
          connectionCount: a.connections.length,
        })),
      });
    } catch (error: any) {
      console.error('[AgentModel] List agents failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/agent-model/agents/:type
   * Get full agent definition including attributes, functions, connections
   */
  app.get('/api/agent-model/agents/:type', async (req: Request, res: Response) => {
    try {
      const agentType = req.params.type as AgentType;
      
      if (!AGENT_TEMPLATES[agentType]) {
        return res.status(404).json({ success: false, error: `Unknown agent type: ${agentType}` });
      }

      const agent = agentObjectModel.getAgentDefinition(agentType);
      const dependencies = agentObjectModel.getDependencyAttributes(agentType);
      const signalAttributes = agentObjectModel.getSignalTriggeringAttributes(agentType);

      res.json({
        success: true,
        agent,
        dependencies,
        signalAttributes: signalAttributes.map(a => ({
          name: a.name,
          displayName: a.displayName,
          category: a.category,
        })),
      });
    } catch (error: any) {
      console.error('[AgentModel] Get agent failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/agent-model/connections
   * Get all agent connections for Neo4j visualization
   */
  app.get('/api/agent-model/connections', async (req: Request, res: Response) => {
    try {
      const signalBus = getAgentSignalBus();
      const connections = signalBus.getConnectionsForNeo4j();

      res.json({
        success: true,
        count: connections.length,
        connections,
      });
    } catch (error: any) {
      console.error('[AgentModel] Get connections failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/agent-model/signal/push
   * Push a signal to specific agent(s)
   */
  app.post('/api/agent-model/signal/push', async (req: Request, res: Response) => {
    try {
      const { source, target, pattern, payload, priority } = req.body;

      if (!target || !pattern) {
        return res.status(400).json({ success: false, error: 'target and pattern are required' });
      }

      const signalBus = getAgentSignalBus();
      const signalId = await signalBus.push(
        source || 'user',
        target,
        pattern,
        payload || {},
        { priority }
      );

      res.json({
        success: true,
        signalId,
        message: `Signal pushed to ${Array.isArray(target) ? target.join(', ') : target}`,
      });
    } catch (error: any) {
      console.error('[AgentModel] Push signal failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/agent-model/signal/broadcast
   * Broadcast a signal to all agents
   */
  app.post('/api/agent-model/signal/broadcast', async (req: Request, res: Response) => {
    try {
      const { source, pattern, payload, priority } = req.body;

      if (!pattern) {
        return res.status(400).json({ success: false, error: 'pattern is required' });
      }

      const signalBus = getAgentSignalBus();
      const signalId = await signalBus.broadcast(
        source || 'user',
        pattern,
        payload || {},
        { priority }
      );

      res.json({
        success: true,
        signalId,
        message: `Signal broadcasted: ${pattern}`,
      });
    } catch (error: any) {
      console.error('[AgentModel] Broadcast signal failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/agent-model/signal/attribute-change
   * Signal when an agent attribute changes (auto-broadcasts if triggerSignal=true)
   */
  app.post('/api/agent-model/signal/attribute-change', async (req: Request, res: Response) => {
    try {
      const { agentType, attributeName, oldValue, newValue, projectId, entityId } = req.body;

      if (!agentType || !attributeName) {
        return res.status(400).json({ success: false, error: 'agentType and attributeName are required' });
      }

      const signalBus = getAgentSignalBus();
      const signalId = await signalBus.signalAttributeChange(
        agentType,
        attributeName,
        oldValue,
        newValue,
        { projectId, entityId }
      );

      res.json({
        success: true,
        signalId,
        broadcasted: signalId !== null,
        message: signalId ? `Attribute change broadcasted` : `Attribute change not configured for signaling`,
      });
    } catch (error: any) {
      console.error('[AgentModel] Attribute change failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/agent-model/signals/:agentType
   * Get recent signals relevant to an agent
   */
  app.get('/api/agent-model/signals/:agentType', async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType as AgentType;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!AGENT_TEMPLATES[agentType]) {
        return res.status(404).json({ success: false, error: `Unknown agent type: ${agentType}` });
      }

      const signalBus = getAgentSignalBus();
      const signals = signalBus.getRecentSignalsForAgent(agentType, limit);

      res.json({
        success: true,
        count: signals.length,
        signals: signals.map(s => ({
          id: s.id,
          type: s.type,
          source: s.source,
          pattern: s.pattern,
          priority: s.priority,
          timestamp: s.timestamp,
        })),
      });
    } catch (error: any) {
      console.error('[AgentModel] Get signals failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/agent-model/mem0-patterns/:agentType
   * Get Mem0 subscription patterns for an agent
   */
  app.get('/api/agent-model/mem0-patterns/:agentType', async (req: Request, res: Response) => {
    try {
      const agentType = req.params.agentType as AgentType;

      if (!AGENT_TEMPLATES[agentType]) {
        return res.status(404).json({ success: false, error: `Unknown agent type: ${agentType}` });
      }

      const patterns = agentObjectModel.getMem0Patterns(agentType);
      const archiveTopics = agentObjectModel.getLettaArchiveTopics(agentType);

      res.json({
        success: true,
        agentType,
        mem0Patterns: patterns,
        lettaArchiveTopics: archiveTopics,
      });
    } catch (error: any) {
      console.error('[AgentModel] Get patterns failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log('[AgentModel] Agent object model routes registered');
}
