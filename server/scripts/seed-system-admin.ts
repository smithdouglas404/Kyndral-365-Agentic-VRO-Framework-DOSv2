/**
 * SEED SYSTEM ADMIN ACCOUNT
 * Creates the initial system admin user (dsmith@smithfamilyusa.com)
 */

import { db } from '../db';
import { users, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/auth';

const SYSTEM_ADMIN_EMAIL = 'dsmith@smithfamilyusa.com';
const SYSTEM_ADMIN_PASSWORD = '9fue39AQ!404';

async function seedSystemAdmin() {
  try {
    console.log('\n🔧 Seeding System Admin Account...\n');

    // Check if system tenant exists
    let [systemTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, 'system'))
      .limit(1);

    // Create system tenant if it doesn't exist
    if (!systemTenant) {
      console.log('Creating system tenant...');
      [systemTenant] = await db
        .insert(tenants)
        .values({
          name: 'Nexus PPM System',
          slug: 'system',
          status: 'active',
          subscriptionTier: 'enterprise',
        })
        .returning();
      console.log('✓ System tenant created');
    } else {
      console.log('✓ System tenant already exists');
    }

    // Check if system admin user exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, SYSTEM_ADMIN_EMAIL))
      .limit(1);

    if (existingAdmin) {
      console.log('\n✓ System admin user already exists');
      console.log(`Email: ${SYSTEM_ADMIN_EMAIL}`);
      console.log('Password: (unchanged)');

      // Update to ensure they're a system admin
      await db
        .update(users)
        .set({
          isSystemAdmin: true,
          emailVerified: true,
          role: 'system_admin',
        })
        .where(eq(users.id, existingAdmin.id));

      console.log('✓ System admin privileges confirmed');
    } else {
      // Create system admin user
      console.log('Creating system admin user...');
      const passwordHash = await hashPassword(SYSTEM_ADMIN_PASSWORD);

      const [newAdmin] = await db
        .insert(users)
        .values({
          tenantId: systemTenant.id,
          email: SYSTEM_ADMIN_EMAIL,
          passwordHash,
          firstName: 'Dave',
          lastName: 'Smith',
          role: 'system_admin',
          isSystemAdmin: true,
          emailVerified: true,
        })
        .returning();

      console.log('\n✅ SYSTEM ADMIN CREATED:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${SYSTEM_ADMIN_EMAIL}`);
      console.log(`Password: ${SYSTEM_ADMIN_PASSWORD}`);
      console.log(`User ID: ${newAdmin.id}`);
      console.log(`Tenant ID: ${systemTenant.id}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🚀 You can now log in at /login\n');
    }

    console.log('\n✅ System admin seeding complete!\n');
  } catch (error) {
    console.error('❌ Error seeding system admin:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedSystemAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedSystemAdmin };
