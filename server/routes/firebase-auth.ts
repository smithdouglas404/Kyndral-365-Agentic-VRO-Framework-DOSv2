/**
 * FIREBASE AUTHENTICATION ROUTES
 *
 * Handles user registration, login verification, and role management with Firebase
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateFirebase, getHomePageForRole } from '../auth/firebaseMiddleware.js';
import { getFirebaseAuthService, type FirebaseUserRole } from '../auth/firebaseAdmin.js';
import type { IStorage } from '../storage.js';
import { authRateLimiter, adminRateLimiter } from '../auth/securityMiddleware.js';
import { initializeAuditLogger, getAuditLogger } from '../lib/auditLog.js';

const RegisterSchema = z.object({
  role: z.enum(['pm', 'vro', 'tmo', 'finops', 'risk', 'governance', 'ocm', 'executive', 'system_admin']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

const SetRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['pm', 'vro', 'tmo', 'finops', 'risk', 'governance', 'ocm', 'executive', 'system_admin']),
});

/**
 * Register Firebase authentication routes
 */
export function registerFirebaseAuthRoutes(app: Express, storage: IStorage): void {
  // Initialize audit logger
  initializeAuditLogger(storage);

  /**
   * POST /api/auth/firebase/verify
   * Verify Firebase ID token and return user data
   */
  app.post('/api/auth/firebase/verify', authRateLimiter, authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found',
        });
      }

      const homePage = getHomePageForRole(req.user.role);

      res.json({
        user: req.user,
        homePage,
        message: 'Authentication successful',
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] Verify error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify token',
      });
    }
  });

  /**
   * POST /api/auth/firebase/register
   * Complete user registration after Firebase account creation
   */
  app.post('/api/auth/firebase/register', authRateLimiter, authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.firebaseUid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Firebase authentication required',
        });
      }

      const validated = RegisterSchema.parse(req.body);

      // Update user role in local database
      const updatedUser = await storage.updateUser(req.user.id, {
        role: validated.role,
        firstName: validated.firstName,
        lastName: validated.lastName,
      });

      // Set custom claims in Firebase
      const firebaseService = getFirebaseAuthService();
      await firebaseService.setUserRole(req.firebaseUid, validated.role as FirebaseUserRole);

      const homePage = getHomePageForRole(validated.role);

      console.log(`[FirebaseAuth] User registered: ${req.user.email} (${validated.role})`);

      res.status(201).json({
        user: updatedUser,
        homePage,
        message: 'Registration complete',
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] Registration error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to complete registration',
      });
    }
  });

  /**
   * POST /api/auth/firebase/logout
   * Logout current user (client-side Firebase signOut + cleanup)
   */
  app.post('/api/auth/firebase/logout', authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      console.log(`[FirebaseAuth] User logged out: ${req.user.email}`);

      res.json({
        message: 'Logout successful',
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] Logout error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to logout',
      });
    }
  });

  /**
   * GET /api/auth/firebase/me
   * Get current authenticated user
   */
  app.get('/api/auth/firebase/me', authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const homePage = getHomePageForRole(req.user.role);

      res.json({
        user: req.user,
        homePage,
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] Get current user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user information',
      });
    }
  });

  /**
   * PATCH /api/auth/firebase/me
   * Update current user profile
   */
  app.patch('/api/auth/firebase/me', authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const { firstName, lastName, phoneNumber, timezone } = req.body;

      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        phoneNumber,
        timezone,
      });

      console.log(`[FirebaseAuth] User profile updated: ${req.user.email}`);

      res.json({
        user: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] Profile update error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update profile',
      });
    }
  });

  /**
   * POST /api/auth/firebase/set-role
   * Set user role (admin only)
   */
  app.post('/api/auth/firebase/set-role', adminRateLimiter, authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      // Only system admins can set roles
      if (req.user.role !== 'system_admin') {
        const auditLogger = getAuditLogger();
        await auditLogger.logPermissionDenied({
          userId: req.user.id,
          userEmail: req.user.email,
          action: 'SET_ROLE',
          resource: 'user_role',
          reason: 'User is not a system administrator',
          ipAddress: req.ip,
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only system administrators can set user roles',
        });
      }

      const validated = SetRoleSchema.parse(req.body);

      // Update user role in database
      const targetUser = await storage.getUser(validated.userId);

      if (!targetUser) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // SECURITY: Prevent admin from modifying their own role
      if (targetUser.id === req.user.id) {
        const auditLogger = getAuditLogger();
        await auditLogger.logSuspiciousActivity({
          userId: req.user.id,
          userEmail: req.user.email,
          activity: 'SELF_ROLE_MODIFICATION_ATTEMPT',
          reason: 'Admin attempted to modify their own role',
          ipAddress: req.ip,
          metadata: {
            targetRole: validated.role,
            currentRole: req.user.role,
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'You cannot modify your own role. Please contact another administrator.',
          code: 'SELF_MODIFICATION_DENIED',
        });
      }

      // SECURITY: Protect admin accounts from being demoted by other admins
      // (In a real system, you'd have a super_admin role for this)
      if (targetUser.role === 'system_admin' && validated.role !== 'system_admin') {
        const auditLogger = getAuditLogger();
        await auditLogger.logSuspiciousActivity({
          userId: req.user.id,
          userEmail: req.user.email,
          activity: 'ADMIN_DEMOTION_ATTEMPT',
          reason: 'Admin attempted to demote another admin',
          ipAddress: req.ip,
          metadata: {
            targetUserId: targetUser.id,
            targetEmail: targetUser.email,
            oldRole: targetUser.role,
            newRole: validated.role,
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot modify another system administrator\'s role. This requires additional authorization.',
          code: 'ADMIN_PROTECTION',
        });
      }

      const oldRole = targetUser.role;

      const updatedUser = await storage.updateUser(validated.userId, {
        role: validated.role,
      });

      // Update Firebase custom claims if Firebase UID exists
      if (targetUser.firebaseUid) {
        const firebaseService = getFirebaseAuthService();
        await firebaseService.setUserRole(targetUser.firebaseUid, validated.role as FirebaseUserRole);
      }

      // AUDIT: Log the role change
      const auditLogger = getAuditLogger();
      await auditLogger.logRoleChange({
        adminUserId: req.user.id,
        adminEmail: req.user.email,
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        oldRole,
        newRole: validated.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      console.log(`[SECURITY AUDIT] Role updated: ${targetUser.email} (${oldRole} → ${validated.role}) by ${req.user.email}`);

      res.json({
        user: updatedUser,
        message: 'User role updated successfully',
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] Set role error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to set user role',
      });
    }
  });

  /**
   * GET /api/auth/firebase/users
   * List all users (admin only)
   */
  app.get('/api/auth/firebase/users', adminRateLimiter, authenticateFirebase, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      // Only system admins can list users
      if (req.user.role !== 'system_admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only system administrators can list users',
        });
      }

      // For now, return empty array since getUsers isn't implemented
      // In production, this would query all users from the database
      res.json({
        users: [],
        message: 'User listing requires database query implementation',
      });
    } catch (error: any) {
      console.error('[FirebaseAuth] List users error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list users',
      });
    }
  });

  console.log('[FirebaseAuth] Firebase authentication routes registered');
}
