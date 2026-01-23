/**
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 *
 * Protects routes with authentication and permission checks
 */

import type { Request, Response, NextFunction } from 'express';
import { AuthSystem, PermissionResource, PermissionAction, type User } from './authSystem.js';
import { storage } from '../storage.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      apiKey?: { userId: string; permissions: string[] };
    }
  }
}

const authSystem = new AuthSystem(storage);

/**
 * Authenticate request (JWT or API key)
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authSystem.verifyToken(token);

      if (user) {
        req.user = user;
        return next();
      }
    }

    // Check for API key
    if (authHeader?.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      const apiKeyData = await authSystem.verifyApiKey(apiKey);

      if (apiKeyData) {
        req.apiKey = apiKeyData;
        // Also load user for consistency
        const user = await storage.getUser(apiKeyData.userId);
        if (user) {
          req.user = user;
        }
        return next();
      }
    }

    // No valid authentication
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  } catch (error: any) {
    console.error('[AuthMiddleware] Authentication error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
    });
  }
}

/**
 * Require specific permission
 */
export function requirePermission(resource: PermissionResource, action: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get resource ID from params if available
    const resourceId = req.params.id || req.params.projectId || req.params.portfolioId;

    // Check permission
    const permissionCheck = await authSystem.checkPermission(
      req.user.id,
      resource,
      action,
      resourceId
    );

    if (!permissionCheck.allowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: permissionCheck.reason || 'You do not have permission to perform this action',
      });
    }

    next();
  };
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Optional authentication (user info if available, but not required)
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authSystem.verifyToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

/**
 * Export auth system instance for use in routes
 */
export { authSystem };
