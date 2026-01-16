import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export type Role = 'admin' | 'editor' | 'viewer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: Role;
    permissions?: string[];
  };
}

export async function getUserRole(userId: string): Promise<{ role: Role; permissions: string[] }> {
  try {
    const userRole = await storage.getUserRole(userId);
    if (!userRole) {
      return { role: 'viewer', permissions: [] };
    }
    
    let permissions: string[] = [];
    if (userRole.permissions) {
      try {
        permissions = JSON.parse(userRole.permissions);
      } catch (e) {
        console.error(`[RoleMiddleware] Failed to parse permissions for user ${userId}:`, e);
        permissions = [];
      }
    }
    
    return { role: userRole.role as Role, permissions };
  } catch (error) {
    console.error(`[RoleMiddleware] Error getting role for user ${userId}:`, error);
    return { role: 'viewer', permissions: [] };
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.claims?.sub || (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role } = await getUserRole(userId);

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: allowedRoles,
        current: role
      });
    }

    (req as AuthenticatedRequest).user = { 
      ...(req as AuthenticatedRequest).user,
      id: userId,
      role 
    };
    
    next();
  };
}

export function requireAdmin() {
  return requireRole('admin');
}

export function requireEditor() {
  return requireRole('admin', 'editor');
}

export function optionalAuth() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.claims?.sub || (req as any).session?.userId;
    
    if (userId) {
      const { role, permissions } = await getUserRole(userId);
      (req as AuthenticatedRequest).user = { id: userId, role, permissions };
    }
    
    next();
  };
}

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  SYNC_DATA: 'sync_data',
  EXPORT_DATA: 'export_data',
  VIEW_REPORTS: 'view_reports',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
} as const;

export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.claims?.sub || (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { role, permissions } = await getUserRole(userId);

    if (role === 'admin' || permissions.includes(permission)) {
      (req as AuthenticatedRequest).user = { id: userId, role, permissions };
      next();
    } else {
      return res.status(403).json({ 
        error: "Permission denied",
        required: permission
      });
    }
  };
}
