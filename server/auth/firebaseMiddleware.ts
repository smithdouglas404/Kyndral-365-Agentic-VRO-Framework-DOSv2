/**
 * FIREBASE AUTHENTICATION MIDDLEWARE
 *
 * Replaces the custom JWT auth middleware with Firebase authentication
 * Verifies Firebase ID tokens and loads user from database
 */

import type { Request, Response, NextFunction } from 'express';
import { getFirebaseAuthService } from './firebaseAdmin.js';
import type { User } from './authSystem.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      firebaseUid?: string;
    }
  }
}

/**
 * Authenticate request using Firebase ID token
 */
export async function authenticateFirebase(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for Firebase ID token in Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Firebase ID token required in Authorization header',
      });
    }

    const idToken = authHeader.substring(7);

    // Verify Firebase ID token
    const firebaseService = getFirebaseAuthService();

    if (!firebaseService.isAvailable()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Firebase authentication is not configured',
      });
    }

    const decodedToken = await firebaseService.verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired Firebase ID token',
      });
    }

    // Get or create user in local database
    const user = await firebaseService.getOrCreateUser(decodedToken);

    if (!user || user.accountStatus !== 'active') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'User account is inactive or does not exist',
      });
    }

    // Attach user and Firebase UID to request
    req.user = user;
    req.firebaseUid = decodedToken.uid;

    next();
  } catch (error: any) {
    console.error('[FirebaseMiddleware] Authentication error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role || 'team_member';

    // System admins have access to everything
    if (userRole === 'system_admin') {
      return next();
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
}

/**
 * Optional authentication - attaches user if token is present but doesn't fail if missing
 */
export async function authenticateOptional(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const idToken = authHeader.substring(7);
    const firebaseService = getFirebaseAuthService();

    if (!firebaseService.isAvailable()) {
      return next(); // Firebase not configured, continue without user
    }

    const decodedToken = await firebaseService.verifyIdToken(idToken);

    if (decodedToken) {
      const user = await firebaseService.getOrCreateUser(decodedToken);
      if (user && user.accountStatus === 'active') {
        req.user = user;
        req.firebaseUid = decodedToken.uid;
      }
    }

    next();
  } catch (error: any) {
    console.error('[FirebaseMiddleware] Optional authentication error:', error);
    next(); // Continue without user on error
  }
}

/**
 * Role-based access control matrix
 * Maps roles to allowed pages/resources
 */
export const ROLE_WORKSPACE_MAP = {
  pm: {
    allowedPages: ['/cop', '/project/:id', '/issues', '/change-requests', '/collaboration'],
    homePage: '/cop',
  },
  vro: {
    allowedPages: ['/dashboard', '/cop', '/vro-framework', '/value-proposition', '/analytics'],
    homePage: '/dashboard',
  },
  tmo: {
    allowedPages: ['/dashboard-tmo', '/cop', '/resources', '/programs', '/analytics'],
    homePage: '/dashboard-tmo',
  },
  finops: {
    allowedPages: ['/dashboard-finops', '/cop', '/financial', '/financial-advanced', '/reports'],
    homePage: '/dashboard-finops',
  },
  risk: {
    allowedPages: ['/risk', '/risks', '/cop', '/analytics'],
    homePage: '/risk',
  },
  governance: {
    allowedPages: ['/dashboard-governance', '/cop', '/admin/workflows', '/admin/custom-fields'],
    homePage: '/dashboard-governance',
  },
  ocm: {
    allowedPages: ['/dashboard-ocm', '/cop', '/collaboration', '/stakeholder-management'],
    homePage: '/dashboard-ocm',
  },
  executive: {
    allowedPages: ['*'], // Full access
    homePage: '/cop',
  },
  system_admin: {
    allowedPages: ['*'], // Full access
    homePage: '/admin',
  },
};

/**
 * Check if user can access a specific page
 */
export function canAccessPage(role: string, page: string): boolean {
  const workspace = ROLE_WORKSPACE_MAP[role as keyof typeof ROLE_WORKSPACE_MAP];

  if (!workspace) {
    return false; // Unknown role
  }

  if (workspace.allowedPages.includes('*')) {
    return true; // Full access
  }

  return workspace.allowedPages.includes(page);
}

/**
 * Get home page for role
 */
export function getHomePageForRole(role: string): string {
  const workspace = ROLE_WORKSPACE_MAP[role as keyof typeof ROLE_WORKSPACE_MAP];
  return workspace?.homePage || '/dashboard';
}
