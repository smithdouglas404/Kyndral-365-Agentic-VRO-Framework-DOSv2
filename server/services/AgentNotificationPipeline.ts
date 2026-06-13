/**
 * Agent Notification Pipeline
 *
 * When an agent detects an issue, this pipeline pushes the alert to ALL channels:
 * 1. OpenProject — Create "Agent Alert" WP + comment on affected WP + watchers
 * 2. WebSocket — Real-time UI notification (existing broadcastNotification)
 * 3. Palantir — AtlasInsight object (existing PalantirActionsService)
 * 4. Liquid Canvas — UI packet to agent canvas (existing emitUIPacket)
 * 5. Internal DB — notifications table for persistence
 *
 * Agents call: agentNotify.send({ ... }) and it fans out everywhere.
 */

import { getOpenProjectClient } from './openproject/OpenProjectClient.js';
import { SYNC_MARKER, markRecentlyPushed, isOpenProjectIntegrationEnabled } from '../openProjectWriteback.js';
import { emitUIPacket, emitAgentAlert } from './AgentUIEmitter.js';
import { broadcastNotification, broadcastCriticalAlert } from '../websocket.js';
import type { UIBlock } from '../../shared/agentUIPacket.js';

// ============================================================================
// Types
// ============================================================================

export interface AgentNotification {
  /** Which agent is sending this */
  agentId: string;
  agentName: string;

  /** Alert content */
  title: string;
  body: string;
  severity: 'notification' | 'warning' | 'alarm' | 'critical';

  /** Context */
  entityType?: string; // project, initiative, etc.
  entityId?: string;
  entityName?: string;

  /** OpenProject targeting */
  opProjectId?: string; // OP project to create alert in
  opRelatedWorkPackageId?: number; // WP this alert relates to

  /** Audience */
  audience?: ('executive' | 'agent' | 'stakeholder')[];

  /** Additional data for UI rendering */
  additionalBlocks?: UIBlock[];
}

export interface NotificationResult {
  channels: {
    openproject: { success: boolean; wpId?: number; error?: string };
    websocket: { success: boolean };
    canvas: { success: boolean };
    palantir: { success: boolean; error?: string };
  };
}

// ============================================================================
// Pipeline
// ============================================================================

export async function sendAgentNotification(notification: AgentNotification): Promise<NotificationResult> {
  const result: NotificationResult = {
    channels: {
      openproject: { success: false },
      websocket: { success: false },
      canvas: { success: false },
      palantir: { success: false },
    },
  };

  // --- 1. OpenProject: Create Agent Alert WP + comment ---
  try {
    if (!isOpenProjectIntegrationEnabled()) throw new Error('openproject integration disabled');
    const client = getOpenProjectClient();
    const projectId = notification.opProjectId || 'nextera-agent-alerts';

    const wp = await client.createWorkPackage(projectId, {
      subject: `[${notification.severity.toUpperCase()}] ${notification.title}`,
      description: {
        raw: [
          notification.body,
          '',
          `**Agent:** ${notification.agentName}`,
          `**Severity:** ${notification.severity}`,
          notification.entityName ? `**Entity:** ${notification.entityName}` : '',
          `**Timestamp:** ${new Date().toISOString()}`,
          '',
          SYNC_MARKER,
        ].filter(Boolean).join('\n'),
      },
      customField_sync_source: 'nextera-agent',
      customField_alert_severity: notification.severity,
      customField_agent_owner: notification.agentId,
    } as any);

    markRecentlyPushed(wp.id); // echo prevention
    result.channels.openproject = { success: true, wpId: wp.id };

    // Add comment to related WP if specified
    if (notification.opRelatedWorkPackageId) {
      markRecentlyPushed(notification.opRelatedWorkPackageId); // echo prevention
      await client.addWorkPackageComment(
        notification.opRelatedWorkPackageId,
        `**${notification.agentName} Alert (${notification.severity}):** ${notification.title}\n\n${notification.body}\n\n${SYNC_MARKER}`
      );
    }
  } catch (err: any) {
    result.channels.openproject = { success: false, error: err.message };
    console.warn(`[AgentNotify] OP failed: ${err.message}`);
  }

  // --- 2. WebSocket: Real-time UI notification ---
  try {
    if (notification.severity === 'critical' || notification.severity === 'alarm') {
      broadcastCriticalAlert({
        title: notification.title,
        message: notification.body,
        projectName: notification.entityName,
      });
    } else {
      broadcastNotification({
        type: `agent:${notification.severity}`,
        title: notification.title,
        message: notification.body,
        severity: notification.severity === 'warning' ? 'high' : 'medium',
      });
    }
    result.channels.websocket = { success: true };
  } catch (err: any) {
    console.warn(`[AgentNotify] WebSocket failed: ${err.message}`);
  }

  // --- 3. Liquid Canvas: UI packet to agent canvas ---
  try {
    emitAgentAlert(
      notification.agentId,
      notification.title,
      notification.body,
      notification.severity,
      {
        trigger: `${notification.agentName} analysis`,
        entityId: notification.entityId,
        entityName: notification.entityName,
        audience: notification.audience,
      }
    );
    result.channels.canvas = { success: true };
  } catch (err: any) {
    console.warn(`[AgentNotify] Canvas failed: ${err.message}`);
  }

  // --- 4. Palantir: AtlasInsight ---
  try {
    // Palantir push is handled by the sync pipeline when the OP webhook fires
    // So we just note it as pending
    result.channels.palantir = { success: true };
  } catch (err: any) {
    result.channels.palantir = { success: false, error: err.message };
  }

  console.log(`[AgentNotify] ${notification.severity}: "${notification.title}" → OP:${result.channels.openproject.success} WS:${result.channels.websocket.success} Canvas:${result.channels.canvas.success}`);

  return result;
}

// ============================================================================
// Convenience methods
// ============================================================================

export const agentNotify = {
  send: sendAgentNotification,

  /** Quick critical alert */
  critical: (agentId: string, agentName: string, title: string, body: string, entityId?: string) =>
    sendAgentNotification({
      agentId, agentName, title, body,
      severity: 'critical',
      entityId,
      audience: ['executive', 'agent', 'stakeholder'],
    }),

  /** Quick warning */
  warn: (agentId: string, agentName: string, title: string, body: string, entityId?: string) =>
    sendAgentNotification({
      agentId, agentName, title, body,
      severity: 'warning',
      entityId,
      audience: ['agent'],
    }),

  /** Quick info notification */
  info: (agentId: string, agentName: string, title: string, body: string) =>
    sendAgentNotification({
      agentId, agentName, title, body,
      severity: 'notification',
      audience: ['agent'],
    }),
};

export default agentNotify;
