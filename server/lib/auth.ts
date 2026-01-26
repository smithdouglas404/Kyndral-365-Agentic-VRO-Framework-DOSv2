/**
 * AUTH UTILITIES
 * JWT token generation/verification and password hashing
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Access token expiry
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const BCRYPT_ROUNDS = 10;

// ============================================================================
// PASSWORD HASHING
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKEN GENERATION
// ============================================================================

export interface TokenPayload {
  userId: string;
  tenantId: string | null;
  email: string;
  role: string;
  isSystemAdmin: boolean;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'nexus-ppm',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'nexus-ppm',
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify JWT token and add user to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);

    // Add user to request
    req.user = payload;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Authentication failed' });
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // System admins can access everything
    if (req.user.isSystemAdmin) {
      return next();
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        actual: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to require system admin
 */
export function requireSystemAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.user.isSystemAdmin) {
    return res.status(403).json({ error: 'System admin access required' });
  }

  next();
}

/**
 * Middleware to add tenant context (must run after requireAuth)
 */
export function tenantScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // System admins can optionally impersonate a tenant
  if (req.user.isSystemAdmin) {
    const impersonateTenantId = req.headers['x-tenant-id'] as string;
    if (impersonateTenantId) {
      req.tenantId = impersonateTenantId;
      return next();
    }
  }

  // Regular users must have a tenant
  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'No tenant associated with user' });
  }

  req.tenantId = req.user.tenantId;
  next();
}

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

/**
 * Generate a random invitation token
 */
export function generateInvitationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Demo mode special handling
 */
export function isDemoMode(req: Request): boolean {
  return req.session?.demoMode === true || req.query.demo !== undefined;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      tenantId?: string;
    }
  }
}
