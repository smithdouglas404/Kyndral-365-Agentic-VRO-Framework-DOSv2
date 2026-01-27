/**
 * AGENT SIGNAL BUS
 * 
 * Bidirectional signal system for agent communication:
 * 1. PUSH - Direct message to specific agent(s)
 * 2. BROADCAST - Signal to ALL agents (subscribers and non-subscribers)
 * 3. SUBSCRIBE - Register interest in specific signal patterns
 * 
 * Signals are the "essence" that Mem0 and Letta use to decide what to retain.
 */

import { EventEmitter } from 'events';
import { agentObjectModel, type AgentType, type AgentAttribute } from './AgentObjectModel.js';
import { getMem0Service } from './Mem0Service.js';

// ============================================================================
// SIGNAL TYPES
// ============================================================================

export interface AgentSignal {
  id: string;
  type: 'push' | 'broadcast' | 'event';
  source: AgentType | 'system' | 'user' | 'db' | 'rules' | 'langflow';
  target?: AgentType | AgentType[];  // For push signals
  pattern: string;                    // e.g., 'finops:budget_alert', 'project_*:health_updated'
  payload: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresAck: boolean;               // Does target need to acknowledge?
}

export interface SignalSubscription {
  subscriberId: string;
  agentType: AgentType;
  pattern: string;                    // Glob pattern to match (e.g., 'finops:*', 'project_*:budget')
  callback: (signal: AgentSignal) => Promise<void>;
}

// ============================================================================
// AGENT SIGNAL BUS
// ============================================================================

export class AgentSignalBus extends EventEmitter {
  private subscriptions: Map<string, SignalSubscription> = new Map();
  private signalHistory: AgentSignal[] = [];
  private maxHistory = 1000;

  constructor() {
    super();
    this.setMaxListeners(100); // Support many agent listeners
  }

  /**
   * PUSH - Send signal directly to specific agent(s)
   */
  async push(
    source: AgentSignal['source'],
    target: AgentType | AgentType[],
    pattern: string,
    payload: any,
    options: { priority?: AgentSignal['priority']; requiresAck?: boolean } = {}
  ): Promise<string> {
    const signal: AgentSignal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'push',
      source,
      target,
      pattern,
      payload,
      timestamp: new Date(),
      priority: options.priority || 'normal',
      requiresAck: options.requiresAck || false,
    };

    // Store in history
    this.addToHistory(signal);

    // Emit to specific targets
    const targets = Array.isArray(target) ? target : [target];
    for (const t of targets) {
      this.emit(`push:${t}`, signal);
    }

    // Also store in Mem0 if it matches a retainable pattern
    await this.storeInMem0IfRetainable(signal);

    console.log(`[SignalBus] PUSH ${source} → ${targets.join(',')} | ${pattern}`);
    return signal.id;
  }

  /**
   * BROADCAST - Send signal to ALL agents (subscribers and non-subscribers)
   * This is the "brain" signal - everyone hears it, they decide relevance
   */
  async broadcast(
    source: AgentSignal['source'],
    pattern: string,
    payload: any,
    options: { priority?: AgentSignal['priority'] } = {}
  ): Promise<string> {
    const signal: AgentSignal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'broadcast',
      source,
      pattern,
      payload,
      timestamp: new Date(),
      priority: options.priority || 'normal',
      requiresAck: false,
    };

    // Store in history
    this.addToHistory(signal);

    // Emit to ALL listeners
    this.emit('broadcast', signal);
    this.emit(`signal:${pattern}`, signal);

    // Also emit to pattern-based listeners
    for (const [id, sub] of this.subscriptions) {
      if (this.matchPattern(pattern, sub.pattern)) {
        try {
          await sub.callback(signal);
        } catch (error) {
          console.error(`[SignalBus] Subscription ${id} error:`, error);
        }
      }
    }

    // Store in Mem0
    await this.storeInMem0IfRetainable(signal);

    console.log(`[SignalBus] BROADCAST ${source} | ${pattern} | ${options.priority || 'normal'}`);
    return signal.id;
  }

  /**
   * SUBSCRIBE - Register interest in signal patterns
   */
  subscribe(
    agentType: AgentType,
    pattern: string,
    callback: (signal: AgentSignal) => Promise<void>
  ): string {
    const id = `sub-${agentType}-${pattern}-${Date.now()}`;
    this.subscriptions.set(id, {
      subscriberId: id,
      agentType,
      pattern,
      callback,
    });

    // Also listen to push signals for this agent
    this.on(`push:${agentType}`, async (signal: AgentSignal) => {
      try {
        await callback(signal);
      } catch (error) {
        console.error(`[SignalBus] Push handler error for ${agentType}:`, error);
      }
    });

    console.log(`[SignalBus] SUBSCRIBE ${agentType} → ${pattern}`);
    return id;
  }

  /**
   * UNSUBSCRIBE - Remove subscription
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Auto-subscribe agents based on their AgentObjectModel patterns
   */
  async autoSubscribeFromModel(agentType: AgentType, callback: (signal: AgentSignal) => Promise<void>): Promise<string[]> {
    const patterns = agentObjectModel.getMem0Patterns(agentType);
    const subscriptionIds: string[] = [];

    for (const pattern of patterns) {
      const id = this.subscribe(agentType, pattern, callback);
      subscriptionIds.push(id);
    }

    console.log(`[SignalBus] Auto-subscribed ${agentType} to ${patterns.length} patterns`);
    return subscriptionIds;
  }

  /**
   * Signal when an attribute changes (uses AgentObjectModel to determine if broadcast needed)
   */
  async signalAttributeChange(
    agentType: AgentType,
    attributeName: string,
    oldValue: any,
    newValue: any,
    context?: { projectId?: string; entityId?: string }
  ): Promise<string | null> {
    const agentDef = agentObjectModel.getAgentDefinition(agentType);
    const attribute = agentDef.attributes.find(a => a.name === attributeName);

    if (!attribute) {
      console.warn(`[SignalBus] Unknown attribute ${attributeName} for ${agentType}`);
      return null;
    }

    // Only broadcast if attribute is marked as triggerSignal
    if (!attribute.triggerSignal) {
      return null;
    }

    const pattern = context?.projectId 
      ? `project_${context.projectId}:${attributeName}` 
      : `${agentType}:${attributeName}`;

    return this.broadcast(agentType, pattern, {
      attribute: attributeName,
      oldValue,
      newValue,
      context,
      category: attribute.category,
    }, {
      priority: this.inferPriority(attribute, oldValue, newValue),
    });
  }

  /**
   * Get signals for an agent (both addressed and matching patterns)
   */
  getRecentSignalsForAgent(agentType: AgentType, limit = 50): AgentSignal[] {
    const patterns = agentObjectModel.getMem0Patterns(agentType);
    
    return this.signalHistory
      .filter(s => {
        // Direct push to this agent
        if (s.target) {
          const targets = Array.isArray(s.target) ? s.target : [s.target];
          if (targets.includes(agentType)) return true;
        }
        // Matches subscribed pattern
        return patterns.some(p => this.matchPattern(s.pattern, p));
      })
      .slice(-limit);
  }

  /**
   * Get all connections for Neo4j visualization
   */
  getConnectionsForNeo4j(): { from: string; to: string; type: string; attributes: string[] }[] {
    const connections = agentObjectModel.getAllConnectionsForNeo4j();
    return connections.map(c => ({
      from: c.fromAgent,
      to: c.toAgent,
      type: c.connectionType,
      attributes: c.attributes,
    }));
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private addToHistory(signal: AgentSignal): void {
    this.signalHistory.push(signal);
    if (this.signalHistory.length > this.maxHistory) {
      this.signalHistory.shift();
    }
  }

  private matchPattern(signalPattern: string, subscriptionPattern: string): boolean {
    // Simple glob matching: * matches anything
    const regex = new RegExp('^' + subscriptionPattern.replace(/\*/g, '.*') + '$');
    return regex.test(signalPattern);
  }

  private inferPriority(
    attribute: AgentAttribute,
    oldValue: any,
    newValue: any
  ): AgentSignal['priority'] {
    // Critical notifications
    if (attribute.category === 'notification') {
      return 'high';
    }

    // Dashboard changes that are significant
    if (attribute.category === 'dashboard' && attribute.dataType === 'number') {
      const change = Math.abs((newValue - oldValue) / (oldValue || 1));
      if (change > 0.2) return 'high';      // >20% change
      if (change > 0.1) return 'normal';    // >10% change
    }

    return 'normal';
  }

  private async storeInMem0IfRetainable(signal: AgentSignal): Promise<void> {
    try {
      const mem0 = getMem0Service();
      if (!mem0) return;

      // Store broadcasts and high-priority signals
      if (signal.type === 'broadcast' || signal.priority === 'high' || signal.priority === 'critical') {
        const sourceAgent = typeof signal.source === 'string' ? signal.source : 'system';
        
        // Extract entity and attribute from pattern (e.g., 'finops:budget_alert' -> entity='finops', attribute='budget_alert')
        const [entity, attribute] = signal.pattern.includes(':') 
          ? signal.pattern.split(':') 
          : ['signal', signal.pattern];
          
        await mem0.writeFact({
          entity,
          attribute,
          value: signal.payload,
          sourceAgent,
          confidence: signal.priority === 'critical' ? 1.0 : signal.priority === 'high' ? 0.8 : 0.5,
        });
      }
    } catch (error) {
      console.warn(`[SignalBus] Mem0 storage skipped:`, error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let signalBus: AgentSignalBus | null = null;

export function getAgentSignalBus(): AgentSignalBus {
  if (!signalBus) {
    signalBus = new AgentSignalBus();
  }
  return signalBus;
}
