/**
 * AUTHENTICATION ROUTES
 *
 * Handles user registration, login, logout, password reset, MFA, and API key management
 */

import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { authSystem, authenticate } from '../auth/authMiddleware.js';
import type { IStorage } from '../storage.js';

// Request validation schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['system_admin', 'pmo_lead', 'project_manager', 'team_member', 'executive', 'guest']).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  mfaCode: z.string().optional(),
});

const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

const PasswordResetConfirmSchema = z.object({
  resetToken: z.string(),
  newPassword: z.string().min(12),
});

const MFAEnableSchema = z.object({
  password: z.string(),
});

const MFAVerifySchema = z.object({
  code: z.string().length(6),
});

const APIKeyCreateSchema = z.object({
  name: z.string().min(1).max(200),
  permissions: z.array(z.string()).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(12),
});

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  timezone: z.string().optional(),
});

/**
 * Register authentication routes
 */
export function registerAuthRoutes(app: Express, storage: IStorage): void {
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validated = RegisterSchema.parse(req.body);

      const result = await authSystem.register({
        email: validated.email,
        password: validated.password,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role,
      });

      console.log(`[Auth] User registered: ${result.user.email}`);

      res.status(201).json({
        user: result.user,
        token: result.token,
        message: 'Registration successful',
      });
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);

      if (error.message?.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register user',
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validated = LoginSchema.parse(req.body);

      const result = await authSystem.login({
        email: validated.email,
        password: validated.password,
        mfaCode: validated.mfaCode,
      });

      console.log(`[Auth] User logged in: ${result.user.email}`);

      res.json({
        user: result.user,
        token: result.token,
        message: 'Login successful',
      });
    } catch (error: any) {
      console.error('[Auth] Login error:', error);

      if (error.message?.includes('Invalid credentials')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      if (error.message?.includes('MFA required')) {
        return res.status(403).json({
          error: 'MFA Required',
          message: 'Multi-factor authentication code required',
          mfaRequired: true,
        });
      }

      if (error.message?.includes('Invalid MFA')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid MFA code',
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to login',
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout current user (invalidate session)
   */
  app.post('/api/auth/logout', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove "Bearer "

      if (token) {
        await authSystem.logout(token);
        console.log(`[Auth] User logged out: ${req.user.email}`);
      }

      res.json({
        message: 'Logout successful',
      });
    } catch (error: any) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to logout',
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh JWT token
   */
  app.post('/api/auth/refresh', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const newToken = await authSystem.refreshToken(req.user.id);

      res.json({
        token: newToken,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      console.error('[Auth] Token refresh error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to refresh token',
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      res.json({
        user: req.user,
      });
    } catch (error: any) {
      console.error('[Auth] Get current user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user information',
      });
    }
  });

  /**
   * PATCH /api/auth/me
   * Update current user profile
   */
  app.patch('/api/auth/me', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = UpdateProfileSchema.parse(req.body);

      const updatedUser = await storage.updateUser(req.user.id, validated);

      console.log(`[Auth] User profile updated: ${req.user.email}`);

      res.json({
        user: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('[Auth] Profile update error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update profile',
      });
    }
  });

  /**
   * POST /api/auth/password/change
   * Change password (requires current password)
   */
  app.post('/api/auth/password/change', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = PasswordChangeSchema.parse(req.body);

      await authSystem.changePassword(
        req.user.id,
        validated.currentPassword,
        validated.newPassword
      );

      console.log(`[Auth] Password changed: ${req.user.email}`);

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      console.error('[Auth] Password change error:', error);

      if (error.message?.includes('Invalid current password')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Current password is incorrect',
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to change password',
      });
    }
  });

  /**
   * POST /api/auth/password-reset/request
   * Request password reset (send email with reset token)
   */
  app.post('/api/auth/password-reset/request', async (req: Request, res: Response) => {
    try {
      const validated = PasswordResetRequestSchema.parse(req.body);

      await authSystem.requestPasswordReset(validated.email);

      console.log(`[Auth] Password reset requested: ${validated.email}`);

      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    } catch (error: any) {
      console.error('[Auth] Password reset request error:', error);

      // Don't reveal if email exists
      res.json({
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    }
  });

  /**
   * POST /api/auth/password-reset/confirm
   * Confirm password reset with token
   */
  app.post('/api/auth/password-reset/confirm', async (req: Request, res: Response) => {
    try {
      const validated = PasswordResetConfirmSchema.parse(req.body);

      await authSystem.confirmPasswordReset(validated.resetToken, validated.newPassword);

      console.log('[Auth] Password reset confirmed');

      res.json({
        message: 'Password has been reset successfully',
      });
    } catch (error: any) {
      console.error('[Auth] Password reset confirm error:', error);

      if (error.message?.includes('Invalid or expired')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid or expired reset token',
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset password',
      });
    }
  });

  /**
   * POST /api/auth/mfa/enable
   * Enable MFA for current user (returns QR code)
   */
  app.post('/api/auth/mfa/enable', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = MFAEnableSchema.parse(req.body);

      const mfaSetup = await authSystem.enableMFA(req.user.id, validated.password);

      console.log(`[Auth] MFA enabled: ${req.user.email}`);

      res.json({
        secret: mfaSetup.secret,
        qrCode: mfaSetup.qrCode,
        backupCodes: mfaSetup.backupCodes,
        message: 'MFA has been enabled. Save your backup codes in a secure location.',
      });
    } catch (error: any) {
      console.error('[Auth] MFA enable error:', error);

      if (error.message?.includes('Invalid password')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid password',
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to enable MFA',
      });
    }
  });

  /**
   * POST /api/auth/mfa/disable
   * Disable MFA for current user
   */
  app.post('/api/auth/mfa/disable', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      await authSystem.disableMFA(req.user.id);

      console.log(`[Auth] MFA disabled: ${req.user.email}`);

      res.json({
        message: 'MFA has been disabled',
      });
    } catch (error: any) {
      console.error('[Auth] MFA disable error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to disable MFA',
      });
    }
  });

  /**
   * POST /api/auth/mfa/verify
   * Verify MFA code (for testing)
   */
  app.post('/api/auth/mfa/verify', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = MFAVerifySchema.parse(req.body);

      const isValid = await authSystem.verifyMFACode(req.user.id, validated.code);

      if (isValid) {
        res.json({
          valid: true,
          message: 'MFA code is valid',
        });
      } else {
        res.status(401).json({
          valid: false,
          message: 'Invalid MFA code',
        });
      }
    } catch (error: any) {
      console.error('[Auth] MFA verify error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify MFA code',
      });
    }
  });

  /**
   * POST /api/auth/api-keys
   * Generate new API key
   */
  app.post('/api/auth/api-keys', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const validated = APIKeyCreateSchema.parse(req.body);

      const apiKey = await authSystem.generateAPIKey(
        req.user.id,
        validated.name,
        validated.permissions,
        validated.expiresInDays
      );

      console.log(`[Auth] API key created: ${validated.name} for ${req.user.email}`);

      res.status(201).json({
        apiKey: apiKey.key,
        name: apiKey.name,
        expiresAt: apiKey.expiresAt,
        message: 'API key created successfully. Save this key securely - it will not be shown again.',
      });
    } catch (error: any) {
      console.error('[Auth] API key creation error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create API key',
      });
    }
  });

  /**
   * GET /api/auth/api-keys
   * List user's API keys (without revealing keys)
   */
  app.get('/api/auth/api-keys', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      const apiKeys = await authSystem.listAPIKeys(req.user.id);

      res.json({
        apiKeys: apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          createdAt: key.createdAt,
          expiresAt: key.expiresAt,
          lastUsedAt: key.lastUsedAt,
        })),
      });
    } catch (error: any) {
      console.error('[Auth] List API keys error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list API keys',
      });
    }
  });

  /**
   * DELETE /api/auth/api-keys/:keyId
   * Revoke API key
   */
  app.delete('/api/auth/api-keys/:keyId', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated',
        });
      }

      await authSystem.revokeAPIKey(req.params.keyId, req.user.id);

      console.log(`[Auth] API key revoked: ${req.params.keyId} by ${req.user.email}`);

      res.json({
        message: 'API key revoked successfully',
      });
    } catch (error: any) {
      console.error('[Auth] API key revocation error:', error);

      if (error.message?.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'API key not found',
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to revoke API key',
      });
    }
  });

  console.log('[Auth] Authentication routes registered');
}
