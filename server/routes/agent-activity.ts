/**
 * AGENT ACTIVITY API
 * Real-time agent activity logs, A2A messages, and collaboration events
 *
 * 🔄 MIGRATED TO DATABASE-DRIVEN (2026-03-02) - Agents loaded from AgentRegistryService
 */

import type { Express } from 'express';
import { db } from '../db.js';
import { desc, eq, and, gte, sql } from 'drizzle-orm';
import { agentActivityLog, agentCollaborationRules } from '@shared/schema';
import { getAgentRegistry } from '../services/AgentRegistryService.js';

export function registerAgentActivityRoutes(app: Express): void {
  /**
   * GET /api/agent-activity/agents
   * Get list of all agents with metadata from database
   * 🔄 DATABASE-DRIVEN - Uses AgentRegistryService
   */
  app.get('/api/agent-activity/agents', async (req, res) => {
    try {
      // Load agents from database via registry
      const registry = getAgentRegistry();
      const metadata = await registry.getAllAgentMetadata();

      // Map to expected format
      const agents = metadata.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: 'deep',
        color: agent.color,
        icon: getAgentEmoji(agent.icon),
        description: agent.description || `${agent.name} agent`,
      }));

      // Get activity status for each agent (last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const recentActivity = await db
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

  // Helper: Convert Lucide icon names to emojis for backward compatibility
  function getAgentEmoji(iconName?: string): string {
    const iconMap: Record<string, string> = {
      'DollarSign': '💰',
      'Repeat': '🔄',
      'AlertTriangle': '⚠️',
      'TrendingUp': '📈',
      'Briefcase': '📋',
      'Users': '👥',
      'Scale': '⚖️',
      'Map': '🎯',
      'Layers': '🔗',
      'Target': '📈',
      'Bell': '🔔',
      'Bot': '🤖',
      'Building': '🏢',
      'Shield': '🛡️',
    };
    return iconMap[iconName || ''] || '🤖';
  }

  /**
   * GET /api/agent-activity/recent
   * Get recent agent activity (last 100 events)
   */
  app.get('/api/agent-activity/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const agentId = req.query.agentId as string;

      let query = db
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

      const messages = await db
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
      const messages = await db
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
      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(agentActivityLog)
        .where(gte(agentActivityLog.createdAt, since));

      // A2A message count
      const [a2aCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(agentActivityLog)
        .where(
          and(
            eq(agentActivityLog.eventType, 'agent_to_agent'),
            gte(agentActivityLog.createdAt, since)
          )
        );

      // Active agents count
      const activeAgents = await db
        .select({ agentId: agentActivityLog.primaryAgentId })
        .from(agentActivityLog)
        .where(gte(agentActivityLog.createdAt, since))
        .groupBy(agentActivityLog.primaryAgentId);

      // Active collaboration rules
      const [rulesCount] = await db
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
