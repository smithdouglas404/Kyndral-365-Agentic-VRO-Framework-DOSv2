/**
 * MULTI-TENANT AUTHENTICATION ROUTES
 * Login, demo access, invitation acceptance for SaaS platform
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, tenants, demoRequests, tenantInvitations } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateInvitationToken,
  requireAuth,
} from '../lib/auth';

const router = Router();

console.log('[TenantAuth] Multi-tenant authentication routes loading...');

// ============================================================================
// POST /api/tenant-auth/login
// Standard login (email + password)
// ============================================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Account not activated. Please check your invitation email.' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get tenant info
    let tenant = null;
    if (user.tenantId) {
      [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      isSystemAdmin: user.isSystemAdmin,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        subscriptionTier: tenant.subscriptionTier,
      } : null,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// ============================================================================
// POST /api/auth/demo-login
// Demo login (email + nexusppm password)
// ============================================================================
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if password is the demo password
    if (password !== 'nexusppm') {
      return res.status(401).json({ error: 'Invalid demo credentials. Use password: nexusppm' });
    }

    // Check if user already has a demo request
    const [existingRequest] = await db
      .select()
      .from(demoRequests)
      .where(eq(demoRequests.email, email.toLowerCase()))
      .limit(1);

    let demoRequest = existingRequest;

    if (!existingRequest) {
      // Create new demo request with 'requested' status (requires admin approval)
      const [newRequest] = await db
        .insert(demoRequests)
        .values({
          email: email.toLowerCase(),
          status: 'requested',
        })
        .returning();
      demoRequest = newRequest;
    }

    // Generate token with demo request ID (used to check status later)
    const demoToken = generateAccessToken({
      userId: demoRequest.id,
      tenantId: null,
      email: email.toLowerCase(),
      role: 'demo_user',
      isSystemAdmin: false,
    });

    // Check if demo is approved
    const isApproved = demoRequest.status === 'demo_active';

    res.json({
      success: true,
      demoMode: true,
      demoRequestId: demoRequest.id,
      demoStatus: demoRequest.status,
      isApproved,
      user: {
        email: email.toLowerCase(),
        role: 'viewer',
        isDemo: true,
      },
      accessToken: demoToken,
      message: isApproved 
        ? 'Demo access granted. Explore with ACME sample data.'
        : 'Demo request received! An admin will review and approve your access shortly.',
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: error.message || 'Demo login failed' });
  }
});

// ============================================================================
// POST /api/auth/demo-request
// Demo request form submission (lead capture + immediate access)
// ============================================================================
router.post('/demo-request', async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, companyName, phone, demoIndustry } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check if user already has a demo request
    const [existingRequest] = await db
      .select()
      .from(demoRequests)
      .where(eq(demoRequests.email, email.toLowerCase()))
      .limit(1);

    let demoRequest = existingRequest;

    if (!existingRequest) {
      // Create demo request with 'requested' status (requires admin approval)
      const [newRequest] = await db
        .insert(demoRequests)
        .values({
          email: email.toLowerCase(),
          firstName,
          lastName,
          companyName,
          phone,
          demoIndustry,
          status: 'requested',
        })
        .returning();
      demoRequest = newRequest;

      // Log to console (will be email in production)
      console.log('\n🎯 NEW DEMO REQUEST (PENDING APPROVAL):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${email}`);
      console.log(`Name: ${firstName} ${lastName}`);
      console.log(`Company: ${companyName}`);
      console.log(`Phone: ${phone}`);
      console.log(`Industry: ${demoIndustry}`);
      console.log(`Status: PENDING ADMIN APPROVAL`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Generate demo access token (used to check status later)
    const demoToken = generateAccessToken({
      userId: demoRequest.id,
      tenantId: null,
      email: email.toLowerCase(),
      role: 'demo_user',
      isSystemAdmin: false,
    });

    // Check if demo is approved
    const isApproved = demoRequest.status === 'demo_active';

    res.json({
      success: true,
      demoMode: true,
      demoRequestId: demoRequest.id,
      demoStatus: demoRequest.status,
      demoIndustry: demoRequest.demoIndustry,
      isApproved,
      accessToken: demoToken,
      user: {
        email: email.toLowerCase(),
        firstName: demoRequest.firstName,
        lastName: demoRequest.lastName,
        isDemo: true,
      },
      message: isApproved 
        ? 'Demo access granted! Redirecting to dashboard...'
        : 'Demo request submitted! An admin will review and approve your access shortly.',
    });
  } catch (error: any) {
    console.error('Demo request error:', error);
    res.status(500).json({ error: error.message || 'Demo request failed' });
  }
});

// ============================================================================
// GET /api/auth/demo-status
// Check current user's demo request status and industry
// ============================================================================
router.get('/demo-status', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if this is a demo user (role = demo_user means their userId is actually a demoRequest.id)
    if (req.user.role !== 'demo_user') {
      return res.json({
        isDemoUser: false,
        message: 'Not a demo user',
      });
    }

    // Get demo request by ID (userId contains demoRequest.id for demo users)
    const [demoRequest] = await db
      .select()
      .from(demoRequests)
      .where(eq(demoRequests.id, req.user.userId))
      .limit(1);

    if (!demoRequest) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    const isApproved = demoRequest.status === 'demo_active';

    res.json({
      isDemoUser: true,
      demoRequestId: demoRequest.id,
      status: demoRequest.status,
      isApproved,
      demoIndustry: demoRequest.demoIndustry,
      email: demoRequest.email,
      firstName: demoRequest.firstName,
      lastName: demoRequest.lastName,
      companyName: demoRequest.companyName,
      createdAt: demoRequest.createdAt,
      message: isApproved 
        ? 'Demo access approved. You can view demo data.'
        : 'Demo request pending. Waiting for admin approval.',
    });
  } catch (error: any) {
    console.error('Demo status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get demo status' });
  }
});

// ============================================================================
// GET /api/auth/me
// Get current user info
// ============================================================================
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get full user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get tenant info
    let tenant = null;
    if (user.tenantId) {
      [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
        emailVerified: user.emailVerified,
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        subscriptionTier: tenant.subscriptionTier,
      } : null,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

// ============================================================================
// GET /api/auth/invitation/:token
// View invitation details
// ============================================================================
router.get('/invitation/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const [invitation] = await db
      .select({
        invitation: tenantInvitations,
        tenant: tenants,
      })
      .from(tenantInvitations)
      .leftJoin(tenants, eq(tenantInvitations.tenantId, tenants.id))
      .where(eq(tenantInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already used or expired' });
    }

    if (new Date() > invitation.invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    res.json({
      email: invitation.invitation.email,
      role: invitation.invitation.role,
      tenant: {
        id: invitation.tenant.id,
        name: invitation.tenant.name,
      },
    });
  } catch (error: any) {
    console.error('Get invitation error:', error);
    res.status(500).json({ error: error.message || 'Failed to get invitation' });
  }
});

// ============================================================================
// POST /api/auth/invitation/:token/accept
// Accept invitation and create account
// ============================================================================
router.post('/invitation/:token/accept', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, firstName, lastName } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Get invitation
    const [invitation] = await db
      .select()
      .from(tenantInvitations)
      .where(eq(tenantInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already used' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user account
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        tenantId: invitation.tenantId,
        email: invitation.email,
        passwordHash,
        firstName,
        lastName,
        role: invitation.role,
        emailVerified: true,
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(tenantInvitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(eq(tenantInvitations.id, invitation.id));

    // Log to console
    console.log('\n✅ INVITATION ACCEPTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${newUser.email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`Tenant ID: ${newUser.tenantId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Generate tokens
    const tokenPayload = {
      userId: newUser.id,
      tenantId: newUser.tenantId,
      email: newUser.email,
      role: newUser.role,
      isSystemAdmin: false,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept invitation' });
  }
});

// ============================================================================
// POST /api/auth/logout
// Logout (invalidate token)
// ============================================================================
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    // In a more complex system, you'd invalidate the refresh token here
    // For now, just return success (client will discard the token)
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

console.log('[TenantAuth] ✅ Multi-tenant authentication routes registered:');
console.log('  - POST /api/tenant-auth/login');
console.log('  - POST /api/tenant-auth/demo-login');
console.log('  - POST /api/tenant-auth/demo-request');
console.log('  - GET  /api/tenant-auth/demo-status');
console.log('  - GET  /api/tenant-auth/me');
console.log('  - GET  /api/tenant-auth/invitation/:token');
console.log('  - POST /api/tenant-auth/invitation/:token/accept');
console.log('  - POST /api/tenant-auth/logout');

export default router;
