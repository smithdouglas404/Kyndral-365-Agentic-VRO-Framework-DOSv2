/**
 * AgentUIEmitter — server-side helper for agents to push UI packets to the dashboard
 *
 * Agents call emitUIPacket() after producing results. The emitter:
 * 1. Creates an AgentUIPacket with the agent's chosen visualization blocks
 * 2. Broadcasts it via WebSocket to all connected clients
 * 3. Optionally persists the packet for reconnecting clients
 *
 * Example (inside a tool's execute function):
 *   const emitter = getAgentUIEmitter();
 *   emitter.emitUIPacket('pmo-agent', 'PMO Agent', 'Project Atlas Health', [
 *     { type: 'kpi-row', kpis: [...] },
 *     { type: 'bar-chart', ... },
 *     { type: 'recommendation', ... },
 *   ], { entityId: 'PRJ-101', entityName: 'Project Atlas' });
 */

import type { WebSocket } from 'ws';
import {
  createAgentUIPacket,
  type UIBlock,
  type AgentUIPacket,
} from '../../shared/agentUIPacket.js';

// ============================================================================
// WebSocket broadcast registry
// ============================================================================

let wsClients: Set<WebSocket> = new Set();

export function registerWSClient(ws: WebSocket) {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
}

function broadcast(message: object) {
  const payload = JSON.stringify(message);
  wsClients.forEach(ws => {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(payload);
    }
  });
}

// ============================================================================
// Recent packets buffer (for clients that reconnect)
// ============================================================================

const recentPackets: AgentUIPacket[] = [];
const MAX_RECENT = 100;

export function getRecentPackets(): AgentUIPacket[] {
  return [...recentPackets];
}

function storePacket(packet: AgentUIPacket) {
  recentPackets.unshift(packet);
  if (recentPackets.length > MAX_RECENT) {
    recentPackets.pop();
  }
}

// ============================================================================
// Agent UI Emitter
// ============================================================================

interface AgentIdentity {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

const AGENT_REGISTRY: Record<string, AgentIdentity> = {
  'pmo-agent': { id: 'pmo-agent', name: 'PMO Agent', color: 'violet', icon: 'brain' },
  'finops-agent': { id: 'finops-agent', name: 'FinOps Agent', color: 'emerald', icon: 'dollar-sign' },
  'risk-agent': { id: 'risk-agent', name: 'Risk Agent', color: 'rose', icon: 'shield' },
  'ocm-agent': { id: 'ocm-agent', name: 'OCM Agent', color: 'cyan', icon: 'users' },
  'tmo-agent': { id: 'tmo-agent', name: 'TMO Agent', color: 'blue', icon: 'arrow-right-left' },
  'vro-agent': { id: 'vro-agent', name: 'VRO Agent', color: 'amber', icon: 'target' },
  'governance-agent': { id: 'governance-agent', name: 'Governance Agent', color: 'indigo', icon: 'scale' },
  'planning-agent': { id: 'planning-agent', name: 'Planning Agent', color: 'teal', icon: 'map' },
};

export function emitUIPacket(
  agentId: string,
  title: string,
  blocks: UIBlock[],
  options?: {
    entityType?: string;
    entityId?: string;
    entityName?: string;
    reasoning?: string;
    priority?: number;
    section?: string;
    size?: 'small' | 'medium' | 'large' | 'full';
    refreshable?: boolean;
    expiresAt?: string;
    sourceData?: Record<string, any>;
  }
): AgentUIPacket {
  const agent = AGENT_REGISTRY[agentId] || { id: agentId, name: agentId };

  const packet = createAgentUIPacket(agent, title, blocks, {
    entityType: options?.entityType,
    entityId: options?.entityId,
    entityName: options?.entityName,
    reasoning: options?.reasoning,
    refreshable: options?.refreshable,
    expiresAt: options?.expiresAt,
    layout: {
      size: options?.size || 'medium',
      priority: options?.priority,
      section: options?.section,
    },
  });

  // Attach source data for collaborative reshaping
  if (options?.sourceData) {
    packet.sourceData = options.sourceData;
  }

  storePacket(packet);
  broadcast({ type: 'agent:ui_packet', data: packet });

  return packet;
}

/**
 * Emit an A2A trace packet showing communication between two agents.
 * This shows up on both agents' canvases and the executive canvas if escalated.
 */
export function emitA2ATrace(
  fromAgentId: string,
  toAgentId: string,
  messages: {
    from: string;
    to: string;
    content: string;
    messageType: 'question' | 'response' | 'delegation' | 'escalation' | 'fact-share';
  }[],
  options?: {
    outcome?: string;
    isLive?: boolean;
    entityId?: string;
    entityName?: string;
    priority?: number;
  }
): AgentUIPacket {
  const fromAgent = AGENT_REGISTRY[fromAgentId] || { id: fromAgentId, name: fromAgentId };
  const toAgent = AGENT_REGISTRY[toAgentId] || { id: toAgentId, name: toAgentId };

  const traceBlock = {
    type: 'a2a-trace' as const,
    title: `${fromAgent.name} ↔ ${toAgent.name}`,
    messages: messages.map(m => ({
      fromAgentId: m.from === 'from' ? fromAgentId : toAgentId,
      fromAgentName: m.from === 'from' ? fromAgent.name : toAgent.name,
      toAgentId: m.to === 'to' ? toAgentId : fromAgentId,
      toAgentName: m.to === 'to' ? toAgent.name : fromAgent.name,
      content: m.content,
      timestamp: new Date().toISOString(),
      messageType: m.messageType,
    })),
    outcome: options?.outcome,
    isLive: options?.isLive,
  };

  return emitUIPacket(fromAgentId, `Agent Communication: ${fromAgent.name} → ${toAgent.name}`, [traceBlock], {
    entityId: options?.entityId,
    entityName: options?.entityName,
    priority: options?.priority ?? (messages.some(m => m.messageType === 'escalation') ? 8 : 5),
    section: 'a2a-communication',
  });
}

/**
 * Emit an alert/alarm packet. High-severity alerts auto-surface to executive canvas.
 */
export function emitAgentAlert(
  agentId: string,
  title: string,
  body: string,
  alertLevel: 'notification' | 'warning' | 'alarm' | 'critical',
  options?: {
    trigger?: string;
    entityId?: string;
    entityName?: string;
    audience?: ('executive' | 'agent' | 'stakeholder')[];
  }
): AgentUIPacket {
  const priority = alertLevel === 'critical' ? 10 : alertLevel === 'alarm' ? 8 : alertLevel === 'warning' ? 6 : 3;

  return emitUIPacket(agentId, title, [{
    type: 'alert',
    title,
    body,
    alertLevel,
    trigger: options?.trigger,
    audience: options?.audience || (priority >= 8 ? ['executive', 'agent'] : ['agent']),
  }], {
    entityId: options?.entityId,
    entityName: options?.entityName,
    priority,
    section: 'alerts',
  });
}

// ============================================================================
// Singleton access
// ============================================================================

export const agentUIEmitter = {
  emit: emitUIPacket,
  trace: emitA2ATrace,
  alert: emitAgentAlert,
  getRecent: getRecentPackets,
  registerClient: registerWSClient,
};

export default agentUIEmitter;
