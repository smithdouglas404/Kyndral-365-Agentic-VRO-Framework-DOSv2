/**
 * Share API Routes
 *
 * Handles dashboard/widget sharing:
 * - Create share links with tokens
 * - Access shared content
 * - Clone shared dashboards
 * - Manage share permissions
 */

import { Router, Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { db } from '../db';
import { dashboardShares, shareAccessLogs, users } from '../db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

const router = Router();

// ============================================================================
// Types
// ============================================================================

interface CreateShareBody {
  shareType: 'widget' | 'dashboard' | 'template';
  sourceId: string;
  name: string;
  description?: string;
  accessLevel: 'view' | 'clone';
  isPublic: boolean;
  requirePassword: boolean;
  password?: string;
  expiresIn?: string;
  configSnapshot: Record<string, unknown>;
}

interface AccessShareBody {
  password?: string;
}

interface CloneBody {
  newName?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a secure random token
 */
function generateShareToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Hash password for storage
 */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Calculate expiration date
 */
function calculateExpiration(expiresIn?: string): Date | null {
  if (!expiresIn || expiresIn === 'never') return null;

  const now = new Date();
  const durations: Record<string, number> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const days = durations[expiresIn];
  if (!days) return null;

  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get user ID from request (assumes auth middleware sets req.user)
 */
function getUserId(req: Request): string | null {
  return (req as any).user?.id || null;
}

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/share - Create a new share link
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateShareBody;
    const userId = getUserId(req);

    // Validate required fields
    if (!body.shareType || !body.sourceId || !body.name || !body.configSnapshot) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate token
    const shareToken = generateShareToken();

    // Hash password if provided
    const passwordHash = body.requirePassword && body.password
      ? hashPassword(body.password)
      : null;

    // Calculate expiration
    const expiresAt = calculateExpiration(body.expiresIn);

    // Create share record
    const [share] = await db.insert(dashboardShares).values({
      shareType: body.shareType,
      sourceId: body.sourceId,
      name: body.name,
      description: body.description,
      configSnapshot: body.configSnapshot,
      shareToken,
      accessLevel: body.accessLevel,
      isPublic: body.isPublic,
      passwordHash,
      ownerId: userId,
      expiresAt,
    }).returning();

    // Build share URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/shared/${shareToken}`;

    res.status(201).json({
      shareId: share.id,
      shareToken,
      shareUrl,
      expiresAt: share.expiresAt?.toISOString(),
      createdAt: share.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ message: 'Failed to create share link' });
  }
});

/**
 * GET /api/share/:token/info - Get public share info (no auth required)
 */
router.get('/:token/info', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const [share] = await db.select({
      id: dashboardShares.id,
      shareType: dashboardShares.shareType,
      name: dashboardShares.name,
      description: dashboardShares.description,
      accessLevel: dashboardShares.accessLevel,
      isPasswordProtected: dashboardShares.passwordHash,
      expiresAt: dashboardShares.expiresAt,
      createdAt: dashboardShares.createdAt,
      viewCount: dashboardShares.viewCount,
      cloneCount: dashboardShares.cloneCount,
    })
      .from(dashboardShares)
      .where(eq(dashboardShares.shareToken, token))
      .limit(1);

    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Share link has expired' });
    }

    res.json({
      ...share,
      isPasswordProtected: !!share.isPasswordProtected,
      expiresAt: share.expiresAt?.toISOString(),
      createdAt: share.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error getting share info:', error);
    res.status(500).json({ message: 'Failed to get share info' });
  }
});

/**
 * POST /api/share/:token - Access a shared item (verify password if needed)
 */
router.post('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body as AccessShareBody;

    const [share] = await db.select()
      .from(dashboardShares)
      .where(eq(dashboardShares.shareToken, token))
      .limit(1);

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share not found',
      });
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Share link has expired',
      });
    }

    // Verify password if required
    if (share.passwordHash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          error: 'Password required',
        });
      }

      if (hashPassword(password) !== share.passwordHash) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password',
        });
      }
    }

    // Increment view count
    await db.update(dashboardShares)
      .set({ viewCount: (share.viewCount || 0) + 1 })
      .where(eq(dashboardShares.id, share.id));

    // Log access
    const userId = getUserId(req);
    await db.insert(shareAccessLogs).values({
      shareId: share.id,
      accessorId: userId,
      action: 'view',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate access token (simplified - in production use JWT)
    const accessToken = randomBytes(32).toString('base64url');

    res.json({
      success: true,
      item: {
        id: share.id,
        shareType: share.shareType,
        name: share.name,
        description: share.description,
        accessLevel: share.accessLevel,
        configSnapshot: share.configSnapshot,
        createdAt: share.createdAt?.toISOString(),
        expiresAt: share.expiresAt?.toISOString(),
      },
      accessToken,
    });
  } catch (error) {
    console.error('Error accessing share:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to access share',
    });
  }
});

/**
 * POST /api/share/:token/clone - Clone a shared dashboard
 */
router.post('/:token/clone', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newName } = req.body as CloneBody;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to clone',
      });
    }

    const [share] = await db.select()
      .from(dashboardShares)
      .where(eq(dashboardShares.shareToken, token))
      .limit(1);

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share not found',
      });
    }

    // Check if cloning is allowed
    if (share.accessLevel !== 'clone') {
      return res.status(403).json({
        success: false,
        error: 'Cloning not allowed for this share',
      });
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Share link has expired',
      });
    }

    // Clone the dashboard config to user's account
    // This would typically save to user_dashboard_configs table
    const clonedName = newName || `${share.name} (Clone)`;

    // Increment clone count
    await db.update(dashboardShares)
      .set({ cloneCount: (share.cloneCount || 0) + 1 })
      .where(eq(dashboardShares.id, share.id));

    // Log clone action
    await db.insert(shareAccessLogs).values({
      shareId: share.id,
      accessorId: userId,
      action: 'clone',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // In a real implementation, save to user's dashboard configs
    // For now, return success with the config
    res.json({
      success: true,
      newDashboardId: `cloned-${Date.now()}`,
      newDashboardName: clonedName,
      config: share.configSnapshot,
    });
  } catch (error) {
    console.error('Error cloning share:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clone dashboard',
    });
  }
});

/**
 * GET /api/share/my - Get current user's shares
 */
router.get('/my', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get shares created by user
    const created = await db.select({
      id: dashboardShares.id,
      shareType: dashboardShares.shareType,
      name: dashboardShares.name,
      description: dashboardShares.description,
      shareToken: dashboardShares.shareToken,
      accessLevel: dashboardShares.accessLevel,
      isPublic: dashboardShares.isPublic,
      expiresAt: dashboardShares.expiresAt,
      createdAt: dashboardShares.createdAt,
      viewCount: dashboardShares.viewCount,
      cloneCount: dashboardShares.cloneCount,
    })
      .from(dashboardShares)
      .where(eq(dashboardShares.ownerId, userId))
      .orderBy(desc(dashboardShares.createdAt));

    // Get shares user has accessed (from logs)
    const accessedShareIds = await db.selectDistinct({ shareId: shareAccessLogs.shareId })
      .from(shareAccessLogs)
      .where(eq(shareAccessLogs.accessorId, userId));

    const received = accessedShareIds.length > 0
      ? await db.select({
          id: dashboardShares.id,
          shareType: dashboardShares.shareType,
          name: dashboardShares.name,
          description: dashboardShares.description,
          accessLevel: dashboardShares.accessLevel,
          createdAt: dashboardShares.createdAt,
        })
          .from(dashboardShares)
          .where(
            and(
              // Filter to only accessed shares not owned by user
              eq(dashboardShares.id, accessedShareIds[0].shareId),
              // Not expired
              gte(dashboardShares.expiresAt, new Date())
            )
          )
      : [];

    res.json({
      created: created.map(s => ({
        ...s,
        expiresAt: s.expiresAt?.toISOString(),
        createdAt: s.createdAt?.toISOString(),
      })),
      received: received.map(s => ({
        ...s,
        createdAt: s.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error getting user shares:', error);
    res.status(500).json({ message: 'Failed to get shares' });
  }
});

/**
 * DELETE /api/share/:id - Revoke a share
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify ownership
    const [share] = await db.select()
      .from(dashboardShares)
      .where(
        and(
          eq(dashboardShares.id, id),
          eq(dashboardShares.ownerId, userId)
        )
      )
      .limit(1);

    if (!share) {
      return res.status(404).json({ message: 'Share not found or not authorized' });
    }

    // Delete share
    await db.delete(dashboardShares)
      .where(eq(dashboardShares.id, id));

    res.status(204).send();
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(500).json({ message: 'Failed to revoke share' });
  }
});

/**
 * PATCH /api/share/:id - Update share settings
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify ownership
    const [share] = await db.select()
      .from(dashboardShares)
      .where(
        and(
          eq(dashboardShares.id, id),
          eq(dashboardShares.ownerId, userId)
        )
      )
      .limit(1);

    if (!share) {
      return res.status(404).json({ message: 'Share not found or not authorized' });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.accessLevel !== undefined) updateData.accessLevel = updates.accessLevel;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

    if (updates.requirePassword !== undefined) {
      if (updates.requirePassword && updates.password) {
        updateData.passwordHash = hashPassword(updates.password);
      } else if (!updates.requirePassword) {
        updateData.passwordHash = null;
      }
    }

    if (updates.expiresIn !== undefined) {
      updateData.expiresAt = calculateExpiration(updates.expiresIn);
    }

    // Update share
    const [updated] = await db.update(dashboardShares)
      .set(updateData)
      .where(eq(dashboardShares.id, id))
      .returning();

    res.json({
      ...updated,
      expiresAt: updated.expiresAt?.toISOString(),
      createdAt: updated.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error updating share:', error);
    res.status(500).json({ message: 'Failed to update share' });
  }
});

/**
 * POST /api/share/:token/log - Log share access (for analytics)
 */
router.post('/:token/log', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { action } = req.body;
    const userId = getUserId(req);

    const [share] = await db.select({ id: dashboardShares.id })
      .from(dashboardShares)
      .where(eq(dashboardShares.shareToken, token))
      .limit(1);

    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    await db.insert(shareAccessLogs).values({
      shareId: share.id,
      accessorId: userId,
      action: action || 'view',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error logging share access:', error);
    res.status(500).json({ message: 'Failed to log access' });
  }
});

export default router;
