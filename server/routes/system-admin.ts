/**
 * SYSTEM ADMIN ROUTES
 * Tenant provisioning, demo request management (Kyndryl staff only)
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, tenants, demoRequests, tenantInvitations, auditLogs, companies } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import {
  requireAuth,
  requireSystemAdmin,
  generateInvitationToken,
} from '../lib/auth';

const router = Router();

console.log('[SystemAdmin] System admin routes loading...');

// All routes require system admin
router.use(requireAuth);
router.use(requireSystemAdmin);

// ============================================================================
// GET /api/system-admin/tenants
// List all tenants
// ============================================================================
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const allTenants = await db
      .select({
        tenant: tenants,
        userCount: sql<number>`(
          SELECT COUNT(*) FROM ${users}
          WHERE ${users.tenantId} = ${tenants.id}
        )`.as('user_count'),
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    res.json(allTenants);
  } catch (error: any) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tenants' });
  }
});

// ============================================================================
// POST /api/system-admin/tenants
// Provision new tenant
// ============================================================================
router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const {
      name,
      adminEmail,
      adminFirstName,
      adminLastName,
      subscriptionTier = 'professional',
    } = req.body;

    if (!name || !adminEmail) {
      return res.status(400).json({ error: 'Tenant name and admin email required' });
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existingTenant) {
      return res.status(400).json({ error: 'A tenant with this name already exists' });
    }

    // Create tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name,
        slug,
        status: 'active',
        subscriptionTier,
        provisionedBy: req.user!.userId,
      })
      .returning();

    // Create invitation for tenant admin
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

    const [invitation] = await db
      .insert(tenantInvitations)
      .values({
        tenantId: newTenant.id,
        email: adminEmail.toLowerCase(),
        role: 'tenant_admin',
        invitedBy: req.user!.userId,
        token: invitationToken,
        expiresAt,
      })
      .returning();

    // Log invitation to console (would be email in production)
    const invitationUrl = `${req.protocol}://${req.get('host')}/invite/${invitationToken}`;

    console.log('\n🚀 TENANT PROVISIONED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tenant: ${name}`);
    console.log(`Slug: ${slug}`);
    console.log(`Subscription: ${subscriptionTier}`);
    console.log(`\nAdmin Invitation Email:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: You've been invited to ${name} on Nexus PPM`);
    console.log(`\nHi ${adminFirstName || ''},`);
    console.log(`\nYou've been invited to join ${name} as a Tenant Administrator.`);
    console.log(`\nClick this link to accept your invitation and set your password:`);
    console.log(invitationUrl);
    console.log(`\nThis invitation expires in 7 days.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json({
      success: true,
      tenant: newTenant,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitationToken,
        invitationUrl,
        expiresAt: invitation.expiresAt,
      },
      message: `Tenant "${name}" provisioned successfully. Invitation sent to ${adminEmail}.`,
    });
  } catch (error: any) {
    console.error('Provision tenant error:', error);
    res.status(500).json({ error: error.message || 'Failed to provision tenant' });
  }
});

// ============================================================================
// GET /api/system-admin/tenants/:id
// Get tenant details with users
// ============================================================================
router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get users
    const tenantUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        emailVerified: users.emailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, id))
      .orderBy(desc(users.createdAt));

    // Get pending invitations
    const pendingInvitations = await db
      .select()
      .from(tenantInvitations)
      .where(eq(tenantInvitations.tenantId, id))
      .orderBy(desc(tenantInvitations.createdAt));

    res.json({
      tenant,
      users: tenantUsers,
      invitations: pendingInvitations,
    });
  } catch (error: any) {
    console.error('Get tenant details error:', error);
    res.status(500).json({ error: error.message || 'Failed to get tenant details' });
  }
});

// ============================================================================
// PATCH /api/system-admin/tenants/:id
// Update tenant (status, subscription, etc.)
// ============================================================================
router.patch('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, subscriptionTier } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (subscriptionTier) updates.subscriptionTier = subscriptionTier;
    updates.updatedAt = new Date();

    const [updatedTenant] = await db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, id))
      .returning();

    if (!updatedTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      success: true,
      tenant: updatedTenant,
      message: 'Tenant updated successfully',
    });
  } catch (error: any) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: error.message || 'Failed to update tenant' });
  }
});

// ============================================================================
// DELETE /api/system-admin/tenants/:id
// Delete a tenant and all associated data
// ============================================================================
router.delete('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get tenant first
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Prevent deletion of system tenant
    if (tenant.slug === 'system') {
      return res.status(403).json({ error: 'Cannot delete the system tenant' });
    }

    // Delete in order of foreign key dependencies
    // 1. Delete audit logs for this tenant
    const deletedAuditLogs = await db
      .delete(auditLogs)
      .where(eq(auditLogs.tenantId, id))
      .returning();

    // 2. Delete companies for this tenant
    const deletedCompanies = await db
      .delete(companies)
      .where(eq(companies.tenantId, id))
      .returning();

    // 3. Delete all invitations for this tenant
    const deletedInvitations = await db
      .delete(tenantInvitations)
      .where(eq(tenantInvitations.tenantId, id))
      .returning();

    // 4. Delete all users for this tenant
    const deletedUsers = await db
      .delete(users)
      .where(eq(users.tenantId, id))
      .returning();

    // 5. Delete the tenant
    const [deletedTenant] = await db
      .delete(tenants)
      .where(eq(tenants.id, id))
      .returning();

    if (!deletedTenant) {
      return res.status(404).json({ error: 'Tenant not found or already deleted' });
    }

    console.log('\n🗑️ TENANT DELETED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tenant: ${deletedTenant.name} (${deletedTenant.slug})`);
    console.log(`Users deleted: ${deletedUsers.length}`);
    console.log(`Invitations deleted: ${deletedInvitations.length}`);
    console.log(`Companies deleted: ${deletedCompanies.length}`);
    console.log(`Audit logs deleted: ${deletedAuditLogs.length}`);
    console.log(`Deleted by: ${req.user!.email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json({
      success: true,
      message: `Tenant "${deletedTenant.name}" and all associated data deleted`,
      deleted: {
        tenant: deletedTenant,
        usersCount: deletedUsers.length,
        invitationsCount: deletedInvitations.length,
        companiesCount: deletedCompanies.length,
        auditLogsCount: deletedAuditLogs.length,
      },
    });
  } catch (error: any) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete tenant' });
  }
});

// ============================================================================
// GET /api/system-admin/demo-requests
// List all demo requests
// ============================================================================
router.get('/demo-requests', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = db
      .select()
      .from(demoRequests)
      .orderBy(desc(demoRequests.createdAt));

    if (status) {
      query = query.where(eq(demoRequests.status, status as string));
    }

    const requests = await query;

    res.json(requests);
  } catch (error: any) {
    console.error('Get demo requests error:', error);
    res.status(500).json({ error: error.message || 'Failed to get demo requests' });
  }
});

// ============================================================================
// POST /api/system-admin/demo-requests/:id/convert
// Convert demo request to tenant
// ============================================================================
router.post('/demo-requests/:id/convert', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantName, subscriptionTier = 'professional' } = req.body;

    // Get demo request
    const [demoRequest] = await db
      .select()
      .from(demoRequests)
      .where(eq(demoRequests.id, id))
      .limit(1);

    if (!demoRequest) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    // Create slug
    const slug = (tenantName || demoRequest.companyName || 'tenant')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: tenantName || demoRequest.companyName || 'New Tenant',
        slug,
        status: 'active',
        subscriptionTier,
        provisionedBy: req.user!.userId,
      })
      .returning();

    // Create invitation
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db
      .insert(tenantInvitations)
      .values({
        tenantId: newTenant.id,
        email: demoRequest.email,
        role: 'tenant_admin',
        invitedBy: req.user!.userId,
        token: invitationToken,
        expiresAt,
      });

    // Update demo request status
    await db
      .update(demoRequests)
      .set({ status: 'converted' })
      .where(eq(demoRequests.id, id));

    // Log invitation
    const invitationUrl = `${req.protocol}://${req.get('host')}/invite/${invitationToken}`;

    console.log('\n✅ DEMO REQUEST CONVERTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Demo Request: ${demoRequest.email}`);
    console.log(`New Tenant: ${newTenant.name}`);
    console.log(`Invitation URL: ${invitationUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json({
      success: true,
      tenant: newTenant,
      invitationUrl,
      message: `Demo request converted to tenant "${newTenant.name}"`,
    });
  } catch (error: any) {
    console.error('Convert demo request error:', error);
    res.status(500).json({ error: error.message || 'Failed to convert demo request' });
  }
});

// ============================================================================
// PATCH /api/system-admin/demo-requests/:id
// Update demo request status/notes
// ============================================================================
router.patch('/demo-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(demoRequests)
      .set(updates)
      .where(eq(demoRequests.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.json({
      success: true,
      demoRequest: updated,
    });
  } catch (error: any) {
    console.error('Update demo request error:', error);
    res.status(500).json({ error: error.message || 'Failed to update demo request' });
  }
});

// ============================================================================
// GET /api/system-admin/analytics
// System-wide analytics dashboard
// ============================================================================
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // Count tenants by status
    const tenantStats = await db
      .select({
        status: tenants.status,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(tenants)
      .groupBy(tenants.status);

    // Count demo requests by status
    const demoStats = await db
      .select({
        status: demoRequests.status,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(demoRequests)
      .groupBy(demoRequests.status);

    // Total users
    const [userCount] = await db
      .select({
        total: sql<number>`COUNT(*)`.as('total'),
      })
      .from(users);

    // Recent activity
    const recentTenants = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    const recentDemoRequests = await db
      .select()
      .from(demoRequests)
      .orderBy(desc(demoRequests.createdAt))
      .limit(10);

    res.json({
      tenants: {
        byStatus: tenantStats,
        recent: recentTenants,
      },
      demoRequests: {
        byStatus: demoStats,
        recent: recentDemoRequests,
      },
      users: {
        total: userCount.total,
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get analytics' });
  }
});

console.log('[SystemAdmin] ✅ System admin routes registered:');
console.log('  - GET    /api/system-admin/tenants');
console.log('  - POST   /api/system-admin/tenants');
console.log('  - GET    /api/system-admin/tenants/:id');
console.log('  - PATCH  /api/system-admin/tenants/:id');
console.log('  - DELETE /api/system-admin/tenants/:id');
console.log('  - GET    /api/system-admin/demo-requests');
console.log('  - POST   /api/system-admin/demo-requests/:id/convert');
console.log('  - PATCH  /api/system-admin/demo-requests/:id');
console.log('  - GET    /api/system-admin/analytics');

export default router;
