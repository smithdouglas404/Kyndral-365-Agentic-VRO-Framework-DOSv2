/**
 * SIGNAL BROADCASTER
 *
 * Bidirectional signal broadcasting system.
 * Wraps Mem0 + A2A to automatically broadcast signals when:
 * - Database writes happen (new data)
 * - Rules engine triggers (conditions met)
 * - Langflow executes (workflow completes)
 * - Agent discovers something (AI reasoning)
 *
 * Like a brain: Neurons fire signals when they activate.
 */

import { getMem0Service } from './Mem0Service.js';
import type { A2AMessageBus } from '../agents/ContinuousOrchestrator.js';
import { getAgentSchema, discoverAgentRelationships } from './AgentObjectSchema.js';
import EventEmitter from 'events';

export interface Signal {
  sourceType: 'database' | 'rules_engine' | 'langflow' | 'agent' | 'api';
  sourceId: string; // Agent ID, rule ID, flow ID, etc.
  attributeName: string;
  attributeValue: any;
  entity: string; // project_123, company, portfolio_5, etc.
  timestamp: Date;
  confidence: number;
  metadata?: Record<string, any>;
}

export class SignalBroadcaster extends EventEmitter {
  private static instance: SignalBroadcaster;
  private mem0Service = getMem0Service();
  private a2aBus: A2AMessageBus | null = null;
  private subscribedAgents: Map<string, Set<string>> = new Map(); // attribute → Set<agentIds>

  private constructor() {
    super();
    this.setMaxListeners(50); // Support many agents
    this.initializeSubscriptions();
  }

  public static getInstance(): SignalBroadcaster {
    if (!SignalBroadcaster.instance) {
      SignalBroadcaster.instance = new SignalBroadcaster();
    }
    return SignalBroadcaster.instance;
  }

  /**
   * Set A2A bus for agent-to-agent notifications
   */
  setA2ABus(bus: A2AMessageBus): void {
    this.a2aBus = bus;
    console.log('[SignalBroadcaster] A2A bus connected');
  }

  /**
   * Initialize subscriptions based on agent schemas
   * Automatically subscribe agents to attributes they consume
   */
  private initializeSubscriptions(): void {
    const relationships = discoverAgentRelationships();

    for (const rel of relationships) {
      // Subscribe consumer to producer's attribute
      if (!this.subscribedAgents.has(rel.via)) {
        this.subscribedAgents.set(rel.via, new Set());
      }
      this.subscribedAgents.get(rel.via)!.add(rel.to);
    }

    console.log(`[SignalBroadcaster] Initialized ${this.subscribedAgents.size} attribute subscriptions`);
  }

  /**
   * Broadcast signal bidirectionally
   * 1. Write to Mem0 (historical record)
   * 2. Send A2A messages to interested agents
   * 3. Emit event for real-time listeners
   * 4. IMPORTANT: Everyone gets the signal, even if not subscribed
   */
  async broadcast(signal: Signal): Promise<void> {
    try {
      console.log(`[SignalBroadcaster] Broadcasting: ${signal.sourceId} → ${signal.attributeName} = ${JSON.stringify(signal.attributeValue)}`);

      // 1. Write to Mem0 (shared fact ledger)
      await this.mem0Service.writeFact({
        entity: signal.entity,
        attribute: signal.attributeName,
        value: signal.attributeValue,
        sourceAgent: signal.sourceId,
        confidence: signal.confidence
      });

      // 2. Emit event for real-time listeners
      this.emit('signal', signal);
      this.emit(`signal:${signal.attributeName}`, signal);
      this.emit(`signal:${signal.entity}`, signal);

      // 3. Send A2A messages to subscribed agents
      const subscribers = this.subscribedAgents.get(signal.attributeName);
      if (subscribers && subscribers.size > 0 && this.a2aBus) {
        for (const subscriberAgent of subscribers) {
          // Don't send to self
          if (subscriberAgent === signal.sourceId) continue;

          await this.a2aBus.send({
            from: signal.sourceId,
            to: subscriberAgent,
            type: 'communication',
            content: `${signal.attributeName} updated: ${JSON.stringify(signal.attributeValue)}`,
            severity: 'low'
          });
        }

        console.log(`[SignalBroadcaster] Notified ${subscribers.size} agents via A2A`);
      }

      // 4. BROADCAST TO ALL (even non-subscribers can observe)
      // This is the key difference - signals are available to everyone
      // Agents can choose to listen or ignore
      this.emit('broadcast:all', signal);

    } catch (error: any) {
      console.error('[SignalBroadcaster] Broadcast error:', error.message);
      throw error;
    }
  }

  /**
   * Broadcast from database write
   */
  async broadcastFromDatabase(
    tableName: string,
    attributeName: string,
    value: any,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.broadcast({
      sourceType: 'database',
      sourceId: tableName,
      attributeName,
      attributeValue: value,
      entity: entityId,
      timestamp: new Date(),
      confidence: 1.0, // Database writes are definitive
      metadata
    });
  }

  /**
   * Broadcast from rules engine
   */
  async broadcastFromRulesEngine(
    ruleId: string,
    agentId: string,
    attributeName: string,
    value: any,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.broadcast({
      sourceType: 'rules_engine',
      sourceId: agentId,
      attributeName,
      attributeValue: value,
      entity: entityId,
      timestamp: new Date(),
      confidence: 0.95, // Rules are high confidence
      metadata: { ...metadata, ruleId }
    });
  }

  /**
   * Broadcast from Langflow execution
   */
  async broadcastFromLangflow(
    flowId: string,
    agentId: string,
    attributeName: string,
    value: any,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.broadcast({
      sourceType: 'langflow',
      sourceId: agentId,
      attributeName,
      attributeValue: value,
      entity: entityId,
      timestamp: new Date(),
      confidence: 0.90, // Langflow executions are high confidence
      metadata: { ...metadata, flowId }
    });
  }

  /**
   * Broadcast from agent AI reasoning
   */
  async broadcastFromAgent(
    agentId: string,
    attributeName: string,
    value: any,
    entityId: string,
    confidence: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.broadcast({
      sourceType: 'agent',
      sourceId: agentId,
      attributeName,
      attributeValue: value,
      entity: entityId,
      timestamp: new Date(),
      confidence, // AI reasoning has variable confidence
      metadata
    });
  }

  /**
   * Broadcast from API call
   */
  async broadcastFromAPI(
    apiEndpoint: string,
    attributeName: string,
    value: any,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.broadcast({
      sourceType: 'api',
      sourceId: apiEndpoint,
      attributeName,
      attributeValue: value,
      entity: entityId,
      timestamp: new Date(),
      confidence: 0.85, // API calls are fairly reliable
      metadata
    });
  }

  /**
   * Subscribe to signals (for agents that want to listen)
   */
  subscribeToAttribute(agentId: string, attributeName: string, callback: (signal: Signal) => void): void {
    this.on(`signal:${attributeName}`, callback);

    // Add to subscribed agents
    if (!this.subscribedAgents.has(attributeName)) {
      this.subscribedAgents.set(attributeName, new Set());
    }
    this.subscribedAgents.get(attributeName)!.add(agentId);

    console.log(`[SignalBroadcaster] ${agentId} subscribed to ${attributeName}`);
  }

  /**
   * Subscribe to ALL signals (for monitoring/debugging)
   */
  subscribeToAll(callback: (signal: Signal) => void): void {
    this.on('broadcast:all', callback);
  }

  /**
   * Get subscription stats
   */
  getSubscriptionStats(): {
    totalAttributes: number;
    totalSubscribers: number;
    attributeBreakdown: Record<string, number>;
  } {
    const attributeBreakdown: Record<string, number> = {};
    let totalSubscribers = 0;

    for (const [attr, subscribers] of this.subscribedAgents) {
      attributeBreakdown[attr] = subscribers.size;
      totalSubscribers += subscribers.size;
    }

    return {
      totalAttributes: this.subscribedAgents.size,
      totalSubscribers,
      attributeBreakdown
    };
  }
}

// Singleton instance
export function getSignalBroadcaster(): SignalBroadcaster {
  return SignalBroadcaster.getInstance();
}
