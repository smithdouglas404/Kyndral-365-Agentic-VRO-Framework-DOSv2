/**
 * REAL-TIME COLLABORATION API (TIER 3)
 * Presence tracking, live cursors, collaborative editing, and comments
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { broadcastNotification } from '../websocket.js';

export function registerCollaborationRoutes(app: Express, storage: IStorage) {

  // Create collaboration tables
  async function ensureCollaborationTables() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS presence (
        user_id TEXT NOT NULL,
        page_url TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        cursor_position JSONB,
        last_active TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, page_url)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        content TEXT NOT NULL,
        parent_id TEXT,
        resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  ensureCollaborationTables();

  // POST /api/collaboration/presence - Update user presence
  app.post('/api/collaboration/presence', async (req: Request, res: Response) => {
    try {
      const { userId, userName, pageUrl, entityType, entityId, cursorPosition } = req.body;

      await db.execute(sql`
        INSERT INTO presence (user_id, page_url, entity_type, entity_id, cursor_position, last_active)
        VALUES (${userId}, ${pageUrl}, ${entityType || null}, ${entityId || null},
                ${cursorPosition ? JSON.stringify(cursorPosition) : null}, NOW())
        ON CONFLICT (user_id, page_url)
        DO UPDATE SET
          entity_type = EXCLUDED.entity_type,
          entity_id = EXCLUDED.entity_id,
          cursor_position = EXCLUDED.cursor_position,
          last_active = NOW()
      `);

      // Broadcast presence update via WebSocket
      broadcastNotification({
        type: 'presence_update',
        userId,
        userName,
        pageUrl,
        entityType,
        entityId,
        cursorPosition,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating presence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update presence',
        message: error.message,
      });
    }
  });

  // GET /api/collaboration/presence/:pageUrl - Get active users on page
  app.get('/api/collaboration/presence/:pageUrl', async (req: Request, res: Response) => {
    try {
      const { pageUrl } = req.params;

      // Clean up stale presence (inactive > 2 minutes)
      await db.execute(sql`
        DELETE FROM presence
        WHERE last_active < NOW() - INTERVAL '2 minutes'
      `);

      const result = await db.execute(sql`
        SELECT * FROM presence
        WHERE page_url = ${pageUrl}
        ORDER BY last_active DESC
      `);

      res.json({
        success: true,
        users: result.rows,
      });
    } catch (error: any) {
      console.error('Error fetching presence:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch presence',
        message: error.message,
      });
    }
  });

  // POST /api/collaboration/comments - Add comment
  app.post('/api/collaboration/comments', async (req: Request, res: Response) => {
    try {
      const { entityType, entityId, userId, userName, content, parentId } = req.body;

      const result = await db.execute(sql`
        INSERT INTO comments (entity_type, entity_id, user_id, user_name, content, parent_id)
        VALUES (${entityType}, ${entityId}, ${userId}, ${userName}, ${content}, ${parentId || null})
        RETURNING *
      `);

      const comment = result.rows[0];

      // Broadcast comment via WebSocket
      broadcastNotification({
        type: 'new_comment',
        comment,
      });

      res.status(201).json({
        success: true,
        comment,
      });
    } catch (error: any) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create comment',
        message: error.message,
      });
    }
  });

  // GET /api/collaboration/comments/:entityType/:entityId - Get comments
  app.get('/api/collaboration/comments/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;

      const result = await db.execute(sql`
        SELECT * FROM comments
        WHERE entity_type = ${entityType} AND entity_id = ${entityId}
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        comments: result.rows,
      });
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch comments',
        message: error.message,
      });
    }
  });

  // PUT /api/collaboration/comments/:id/resolve - Resolve comment
  app.put('/api/collaboration/comments/:id/resolve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await db.execute(sql`
        UPDATE comments
        SET resolved = true, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      res.json({
        success: true,
        comment: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error resolving comment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve comment',
        message: error.message,
      });
    }
  });

  console.log('✅ Real-time collaboration routes registered (TIER 3)');
}
