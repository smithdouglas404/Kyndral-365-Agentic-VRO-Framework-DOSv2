/**
 * USER PERMISSIONS API
 *
 * Granular permission management beyond role-based access control
 * Admins can toggle specific permissions for each user
 */

import type { Express, Request, Response } from 'express';
import { db } from '../../db.js';
import { userPermissions, users, type InsertUserPermissions } from '../../../shared/models/auth.js';
import { eq } from 'drizzle-orm';
import { authenticate } from '../../auth/authMiddleware.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Helper to parse boolean string values
 */
function parseBoolean(value: string): boolean {
  return value === 'true';
}

/**
 * Helper to convert boolean to string for storage
 */
function booleanToString(value: boolean): string {
  return value ? 'true' : 'false';
}

/**
 * Convert database permissions to frontend format (strings -> booleans)
 */
function parsePermissions(perms: any) {
  return {
    ...perms,
    canAccessExecutiveDashboard: parseBoolean(perms.canAccessExecutiveDashboard),
    canAccessPMWorkspace: parseBoolean(perms.canAccessPMWorkspace),
    canAccessFinOpsWorkspace: parseBoolean(perms.canAccessFinOpsWorkspace),
    canAccessTMOWorkspace: parseBoolean(perms.canAccessTMOWorkspace),
    canAccessPlanningWorkspace: parseBoolean(perms.canAccessPlanningWorkspace),
    canAccessGovernanceWorkspace: parseBoolean(perms.canAccessGovernanceWorkspace),
    canAccessOCMWorkspace: parseBoolean(perms.canAccessOCMWorkspace),
    canAccessAdminWorkspace: parseBoolean(perms.canAccessAdminWorkspace),
    canEditProjects: parseBoolean(perms.canEditProjects),
    canDeleteProjects: parseBoolean(perms.canDeleteProjects),
    canApproveChanges: parseBoolean(perms.canApproveChanges),
    canManageUsers: parseBoolean(perms.canManageUsers),
    canManageIntegrations: parseBoolean(perms.canManageIntegrations),
    canTriggerAgents: parseBoolean(perms.canTriggerAgents),
    canConfigureAgents: parseBoolean(perms.canConfigureAgents),
    canViewAgentLogs: parseBoolean(perms.canViewAgentLogs),
    canExportData: parseBoolean(perms.canExportData),
    canViewFinancialReports: parseBoolean(perms.canViewFinancialReports),
    canViewExecutiveReports: parseBoolean(perms.canViewExecutiveReports),
  };
}

/**
 * Convert frontend permissions to database format (booleans -> strings)
 */
function stringifyPermissions(perms: any) {
  const result: any = {};
  for (const [key, value] of Object.entries(perms)) {
    if (typeof value === 'boolean') {
      result[key] = booleanToString(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Register permission management routes
 */
export function registerPermissionRoutes(app: Express): void {
  /**
   * GET /api/admin/permissions/:userId
   * Get permissions for a specific user
   */
  app.get('/api/admin/permissions/:userId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      // Only system admins can view permissions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { userId } = req.params;

      // Get or create permissions for user
      let [perms] = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));

      if (!perms) {
        // Create default permissions
        [perms] = await db
          .insert(userPermissions)
          .values({ userId })
          .returning();
      }

      res.json({ permissions: parsePermissions(perms) });
    } catch (error: any) {
      console.error('[Permissions] Error fetching permissions:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  });

  /**
   * GET /api/admin/permissions
   * Get all user permissions
   */
  app.get('/api/admin/permissions', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      // Only system admins can view all permissions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const allPermissions = await db
        .select({
          permissions: userPermissions,
          user: users,
        })
        .from(userPermissions)
        .innerJoin(users, eq(userPermissions.userId, users.id));

      const formatted = allPermissions.map(({ permissions, user }) => ({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        permissions: parsePermissions(permissions),
      }));

      res.json({ data: formatted });
    } catch (error: any) {
      console.error('[Permissions] Error fetching all permissions:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  });

  /**
   * PATCH /api/admin/permissions/:userId
   * Update permissions for a user
   */
  app.patch('/api/admin/permissions/:userId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      // Only system admins can update permissions
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { userId } = req.params;
      const updates = req.body;

      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get existing permissions or create if not exists
      let [existing] = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));

      const stringifiedUpdates = stringifyPermissions(updates);

      if (!existing) {
        // Create new permissions
        [existing] = await db
          .insert(userPermissions)
          .values({
            userId,
            ...stringifiedUpdates,
          })
          .returning();
      } else {
        // Update existing permissions
        [existing] = await db
          .update(userPermissions)
          .set({
            ...stringifiedUpdates,
            updatedAt: new Date(),
          })
          .where(eq(userPermissions.userId, userId))
          .returning();
      }

      console.log(`[Permissions] Updated permissions for user ${userId} by ${req.user?.email}`);

      res.json({ permissions: parsePermissions(existing) });
    } catch (error: any) {
      console.error('[Permissions] Error updating permissions:', error);
      res.status(500).json({ error: 'Failed to update permissions' });
    }
  });

  /**
   * GET /api/permissions/my
   * Get current user's permissions (non-admin endpoint)
   */
  app.get('/api/permissions/my', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get or create permissions for current user
      let [perms] = await db.select().from(userPermissions).where(eq(userPermissions.userId, req.user.id));

      if (!perms) {
        // Create default permissions
        [perms] = await db
          .insert(userPermissions)
          .values({ userId: req.user.id })
          .returning();
      }

      res.json({ permissions: parsePermissions(perms) });
    } catch (error: any) {
      console.error('[Permissions] Error fetching my permissions:', error);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  });

  console.log('[Permissions] Permission management routes registered');
}
