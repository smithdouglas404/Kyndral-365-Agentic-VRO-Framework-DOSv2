/**
 * SECURITY AUDIT LOGGING
 *
 * Logs all security-related events for compliance and incident response
 * Supports GDPR, SOC 2, and HIPAA audit requirements
 */

import type { IStorage } from '../storage.js';

export type AuditEventType =
  | 'ROLE_CHANGE'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'PERMISSION_DENIED'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REVOKED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'ADMIN_ACTION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'SECURITY_VIOLATION';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId: string | null;
  userEmail: string | null;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class AuditLogger {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Log a security event
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Console log for immediate visibility
    console.log(
      `[AUDIT] ${fullEntry.eventType} - User: ${fullEntry.userEmail || fullEntry.userId || 'anonymous'} - Action: ${fullEntry.action} - Success: ${fullEntry.success}`
    );

    // In production, this should:
    // 1. Write to a dedicated audit log table
    // 2. Send to external log aggregation service (e.g., Splunk, DataDog)
    // 3. Trigger alerts for critical events
    // 4. Ensure logs are immutable and tamper-proof

    // For now, we'll use the agent activity log as a fallback
    try {
      await this.storage.createAgentActivityLog({
        eventType: 'audit_log',
        primaryAgentId: fullEntry.userId || 'system',
        primaryAgentName: fullEntry.userEmail || 'System',
        secondaryAgentId: fullEntry.targetUserId || null,
        secondaryAgentName: fullEntry.targetUserEmail || null,
        summary: `[${fullEntry.eventType}] ${fullEntry.action}`,
        details: JSON.stringify({
          ...fullEntry,
          _auditLog: true,
        }),
      });
    } catch (error) {
      console.error('[AUDIT] Failed to write audit log:', error);
      // CRITICAL: Never fail the request if audit logging fails
      // But log the error prominently
    }
  }

  /**
   * Log role change
   */
  async logRoleChange(params: {
    adminUserId: string;
    adminEmail: string;
    targetUserId: string;
    targetEmail: string;
    oldRole: string;
    newRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'ROLE_CHANGE',
      userId: params.adminUserId,
      userEmail: params.adminEmail,
      targetUserId: params.targetUserId,
      targetUserEmail: params.targetEmail,
      action: `Changed role from ${params.oldRole} to ${params.newRole}`,
      resource: 'user_role',
      resourceId: params.targetUserId,
      oldValue: params.oldRole,
      newValue: params.newRole,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: true,
    });
  }

  /**
   * Log login attempt
   */
  async logLoginAttempt(params: {
    email: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }): Promise<void> {
    await this.log({
      eventType: params.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      userId: null,
      userEmail: params.email,
      action: params.success ? 'User logged in' : 'Failed login attempt',
      resource: 'authentication',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }

  /**
   * Log permission denial
   */
  async logPermissionDenied(params: {
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    reason: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'PERMISSION_DENIED',
      userId: params.userId,
      userEmail: params.userEmail,
      action: `Attempted ${params.action} on ${params.resource}`,
      resource: params.resource,
      ipAddress: params.ipAddress,
      success: false,
      errorMessage: params.reason,
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(params: {
    adminUserId: string;
    adminEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'ADMIN_ACTION',
      userId: params.adminUserId,
      userEmail: params.adminEmail,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      success: true,
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(params: {
    userId: string | null;
    userEmail: string | null;
    activity: string;
    reason: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    console.error(`[SECURITY ALERT] Suspicious activity detected: ${params.activity} - Reason: ${params.reason}`);

    await this.log({
      eventType: 'SUSPICIOUS_ACTIVITY',
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.activity,
      ipAddress: params.ipAddress,
      success: false,
      errorMessage: params.reason,
      metadata: params.metadata,
    });

    // In production, this should trigger:
    // 1. Real-time alert to security team
    // 2. Automatic user account review
    // 3. Potential temporary account suspension
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

export function initializeAuditLogger(storage: IStorage): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger(storage);
    console.log('[AuditLog] Audit logger initialized');
  }
  return auditLogger;
}

export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    throw new Error('Audit logger not initialized. Call initializeAuditLogger first.');
  }
  return auditLogger;
}
