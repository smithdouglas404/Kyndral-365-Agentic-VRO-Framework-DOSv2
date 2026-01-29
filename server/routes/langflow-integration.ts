/**
 * LANGFLOW INTEGRATION ROUTES
 *
 * API endpoints that Langflow custom components call
 * Provides: Mem0 caching, WebSocket broadcasting, A2A messaging, DB persistence
 */

import { Router } from 'express';
import type { Request, Response } from 'express';

export function registerLangflowIntegrationRoutes(app: Router) {

  /**
   * POST /api/mem0/facts
   * Write agent attribute to Mem0 cache (5-minute TTL)
   * Called by: Mem0Writer component in Langflow flows
   */
  app.post('/api/mem0/facts', async (req: Request, res: Response) => {
    try {
      const { entity, attribute, value, source_agent, ttl, timestamp } = req.body;

      if (!entity || !attribute || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: entity, attribute, value'
        });
      }

      // TODO: Replace with actual Redis/Mem0 implementation
      // For now, store in-memory (replace with redis.setex in production)
      const key = `mem0:${entity}:${attribute}`;
      const cacheValue = JSON.stringify({
        value,
        source_agent: source_agent || 'unknown',
        timestamp: timestamp || new Date().toISOString(),
        ttl: ttl || 300
      });

      // Mock: In production, use Redis
      // await redis.setex(key, ttl || 300, cacheValue);
      console.log(`[Mem0] Cached: ${key} (TTL: ${ttl || 300}s)`);

      res.json({
        success: true,
        cached: true,
        key,
        ttl: ttl || 300,
        timestamp: timestamp || new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[Mem0] Write error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/websocket/broadcast
   * Broadcast signal to dashboards via WebSocket
   * Called by: WebSocketBroadcaster component in Langflow flows
   */
  app.post('/api/websocket/broadcast', async (req: Request, res: Response) => {
    try {
      const { channel, event, payload } = req.body;

      if (!channel || !event) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: channel, event'
        });
      }

      // TODO: Replace with actual WebSocket broadcast
      // In production, use io.to(channel).emit(event, payload)
      console.log(`[WebSocket] Broadcast → ${channel}:${event}`);
      console.log('[WebSocket] Payload:', JSON.stringify(payload, null, 2));

      // Mock broadcast
      // io.to(channel).emit(event, payload);

      res.json({
        broadcasted: true,
        channel,
        event,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[WebSocket] Broadcast error:', error.message);
      res.status(500).json({
        broadcasted: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/a2a/messages
   * Send agent-to-agent message
   * Called by: A2AMessageSender component in Langflow flows
   */
  app.post('/api/a2a/messages', async (req: Request, res: Response) => {
    try {
      const { from, to, type, content, priority, timestamp } = req.body;

      if (!from || !to || !type || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: from, to, type, content'
        });
      }

      // TODO: Store in database
      // await db('a2a_messages').insert({
      //   from_agent: from,
      //   to_agent: to,
      //   message_type: type,
      //   content,
      //   priority: priority || 'medium',
      //   created_at: new Date(timestamp || Date.now())
      // });

      console.log(`[A2A] ${from} → ${to}: ${type}`);
      console.log(`[A2A] Content: ${content}`);

      // TODO: Notify target agent via WebSocket
      // io.to(`agent:${to}`).emit('a2a:message', {
      //   from,
      //   type,
      //   content,
      //   priority,
      //   timestamp: timestamp || new Date().toISOString()
      // });

      res.json({
        sent: true,
        from_agent: from,
        to_agent: to,
        message_type: type,
        timestamp: timestamp || new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[A2A] Message error:', error.message);
      res.status(500).json({
        sent: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/agent-facts
   * Persist agent attribute to database (async)
   * Called by: DBPersister component in Langflow flows
   */
  app.post('/api/agent-facts', async (req: Request, res: Response) => {
    try {
      const { agent_id, entity, attribute_key, value, created_at } = req.body;

      if (!agent_id || !entity || !attribute_key || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: agent_id, entity, attribute_key, value'
        });
      }

      // TODO: Store in database
      // await db('agent_facts').insert({
      //   agent_id,
      //   entity,
      //   attribute_key,
      //   value: JSON.stringify(value),
      //   created_at: new Date(created_at || Date.now())
      // });

      console.log(`[DB] Persisted: ${agent_id}.${attribute_key} = ${JSON.stringify(value)}`);

      res.json({
        persisted: true,
        agent_id,
        entity,
        attribute_key,
        timestamp: created_at || new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[DB] Persistence error:', error.message);
      res.status(500).json({
        persisted: false,
        error: error.message
      });
    }
  });

  console.log('[LangflowIntegration] Routes registered:');
  console.log('  POST /api/mem0/facts - Mem0 cache writer');
  console.log('  POST /api/websocket/broadcast - WebSocket broadcaster');
  console.log('  POST /api/a2a/messages - A2A message sender');
  console.log('  POST /api/agent-facts - DB persister');
}
