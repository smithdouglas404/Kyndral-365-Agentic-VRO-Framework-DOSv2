/**
 * AGENT ACTIVITY API
 * Real-time agent activity logs, A2A messages, and collaboration events
 */

import type { Express } from 'express';
import type { IStorage } from '../storage.js';
import { desc, eq, and, gte, sql } from 'drizzle-orm';
import { agentActivityLog, agentCollaborationRules } from '@shared/schema';

export function registerAgentActivityRoutes(app: Express, storage: IStorage): void {
  /**
   * GET /api/agent-activity/agents
   * Get list of all agents with metadata (no hardcoding in frontend)
   */
  app.get('/api/agent-activity/agents', async (req, res) => {
    try {
      // Define agent metadata (single source of truth)
      const agents = [
        { id: 'finops', name: 'FinOps', type: 'deep', color: '#10b981', icon: '💰', description: 'Financial operations and budget monitoring' },
        { id: 'tmo', name: 'TMO', type: 'deep', color: '#3b82f6', icon: '📊', description: 'Transformation management' },
        { id: 'risk', name: 'Risk', type: 'deep', color: '#ef4444', icon: '⚠️', description: 'Risk detection and mitigation' },
        { id: 'vro', name: 'VRO', type: 'deep', color: '#8b5cf6', icon: '🔄', description: 'Value realization' },
        { id: 'pmo', name: 'PMO', type: 'deep', color: '#f59e0b', icon: '📋', description: 'Project management office' },
        { id: 'ocm', name: 'OCM', type: 'deep', color: '#06b6d4', icon: '👥', description: 'Organizational change management' },
        { id: 'governance', name: 'Governance', type: 'deep', color: '#6366f1', icon: '⚖️', description: 'Governance and compliance' },
        { id: 'planning', name: 'Planning', type: 'deep', color: '#ec4899', icon: '🎯', description: 'Strategic planning' },
        { id: 'integrated', name: 'Integrated', type: 'deep', color: '#14b8a6', icon: '🔗', description: 'Integrated management' },
        { id: 'okr', name: 'OKR', type: 'deep', color: '#f97316', icon: '📈', description: 'OKR inference and tracking' },
      ];

      // Get activity status for each agent (last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const recentActivity = await storage.db
        .select({ agentId: agentActivityLog.primaryAgentId })
        .from(agentActivityLog)
        .where(gte(agentActivityLog.createdAt, fiveMinutesAgo));

      const activeAgentIds = new Set(recentActivity.map(a => a.agentId));

      // Add status to each agent
      const agentsWithStatus = agents.map(agent => ({
        ...agent,
        status: activeAgentIds.has(agent.id) ? 'active' : 'idle',
      }));

      res.json({
        agents: agentsWithStatus,
        count: agents.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[AgentActivity] Error fetching agents:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/agent-activity/recent
   * Get recent agent activity (last 100 events)
   */
  app.get('/api/agent-activity/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const agentId = req.query.agentId as string;

      let query = storage.db
        .select()
        .from(agentActivityLog)
        .orderBy(desc(agentActivityLog.createdAt))
        .limit(limit);

      if (agentId) {
        query = query.where(
          eq(agentActivityLog.primaryAgentId, agentId)
        ) as any;
      }

      const activities = await query;

      res.json({
        activities,
        count: activities.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[AgentActivity] Error fetching recent activity:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/agent-activity/a2a-messages
   * Get Agent-to-Agent message history
   */
  app.get('/api/agent-activity/a2a-messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const hours = parseInt(req.query.hours as string) || 24;

      const since = new Date();
      since.setHours(since.getHours() - hours);

      const messages = await storage.db
        .select()
        .from(agentActivityLog)
        .where(
          and(
            eq(agentActivityLog.eventType, 'agent_to_agent'),
            gte(agentActivityLog.createdAt, since)
          )
        )
        .orderBy(desc(agentActivityLog.createdAt))
        .limit(limit);

      res.json({
        messages,
        count: messages.length,
        timeRange: `Last ${hours} hours`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[AgentActivity] Error fetching A2A messages:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/agent-activity/connections
   * Get active agent connections based on recent A2A messages
   */
  app.get('/api/agent-activity/connections', async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 1;

      const since = new Date();
      since.setHours(since.getHours() - hours);

      // Get recent A2A messages
      const messages = await storage.db
        .select({
          source: agentActivityLog.primaryAgentId,
          target: agentActivityLog.secondaryAgentId,
          count: sql<number>`count(*)`,
          lastActivity: sql<Date>`max(${agentActivityLog.createdAt})`,
        })
        .from(agentActivityLog)
        .where(
          and(
            eq(agentActivityLog.eventType, 'agent_to_agent'),
            gte(agentActivityLog.createdAt, since)
          )
        )
        .groupBy(agentActivityLog.primaryAgentId, agentActivityLog.secondaryAgentId);

      // Format as connections
      const connections = messages.map((msg) => ({
        source: msg.source,
        target: msg.target,
        type: 'collaboration',
        active: true,
        messageCount: msg.count,
        lastActivity: msg.lastActivity,
      }));

      res.json({
        connections,
        count: connections.length,
        timeRange: `Last ${hours} hours`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[AgentActivity] Error fetching connections:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/agent-activity/stats
   * Get activity statistics
   */
  app.get('/api/agent-activity/stats', async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;

      const since = new Date();
      since.setHours(since.getHours() - hours);

      // Total activity count
      const [totalCount] = await storage.db
        .select({ count: sql<number>`count(*)` })
        .from(agentActivityLog)
        .where(gte(agentActivityLog.createdAt, since));

      // A2A message count
      const [a2aCount] = await storage.db
        .select({ count: sql<number>`count(*)` })
        .from(agentActivityLog)
        .where(
          and(
            eq(agentActivityLog.eventType, 'agent_to_agent'),
            gte(agentActivityLog.createdAt, since)
          )
        );

      // Active agents count
      const activeAgents = await storage.db
        .select({ agentId: agentActivityLog.primaryAgentId })
        .from(agentActivityLog)
        .where(gte(agentActivityLog.createdAt, since))
        .groupBy(agentActivityLog.primaryAgentId);

      // Active collaboration rules
      const [rulesCount] = await storage.db
        .select({ count: sql<number>`count(*)` })
        .from(agentCollaborationRules)
        .where(eq(agentCollaborationRules.enabled, true));

      res.json({
        totalActivity: totalCount.count,
        a2aMessages: a2aCount.count,
        activeAgents: activeAgents.length,
        collaborationRules: rulesCount.count,
        timeRange: `Last ${hours} hours`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[AgentActivity] Error fetching stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  console.log('[AgentActivity] Agent activity routes registered');
}
