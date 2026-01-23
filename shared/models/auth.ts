import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// Extended for full authentication support while maintaining Replit Auth compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Authentication fields
  passwordHash: varchar("password_hash", { length: 255 }), // bcrypt hash
  role: varchar("role", { length: 50 }).default("team_member"), // system_admin, pmo_lead, project_manager, team_member, executive, guest
  phoneNumber: varchar("phone_number", { length: 20 }),
  timezone: varchar("timezone", { length: 100 }),
  // MFA fields
  mfaEnabled: varchar("mfa_enabled", { length: 10 }).default("false"),
  mfaSecret: varchar("mfa_secret", { length: 255 }), // TOTP secret
  mfaBackupCodes: varchar("mfa_backup_codes", { length: 1000 }), // JSON array
  // Account status
  accountStatus: varchar("account_status", { length: 20 }).default("active"), // active, disabled, locked
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: varchar("failed_login_attempts", { length: 10 }).default("0"),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// JWT session storage (separate from express sessions)
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 50 }),
});

export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;

// API keys for integration access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(), // bcrypt hash of API key
  permissions: varchar("permissions", { length: 2000 }), // JSON array of permissions
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
