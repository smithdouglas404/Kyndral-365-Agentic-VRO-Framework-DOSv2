/**
 * PALANTIR MEMORY BRIDGE
 *
 * Bridges agent memory systems (Mem0, Letta, A2A) with Palantir Foundry.
 *
 * Architecture:
 * - Letta: Stays in PostgreSQL (agent-private, high-frequency updates)
 * - Mem0: Hybrid - PostgreSQL for fast queries + Palantir sync for ontology
 * - A2A: In-memory bus + Palantir sync for critical decisions/approvals
 *
 * This bridge ensures agent discoveries become part of the Palantir ontology,
 * enabling visibility in dashboards and cross-system integration.
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';
import { PALANTIR_ACTIONS, PALANTIR_OBJECT_TYPES } from '../constants/palantirOntology.js';
import { EventEmitter } from 'events';

// Types for agent facts and decisions
export interface AgentFact {
  id: string;
  entity: string;
  attribute: string;
  value: string;
  confidence?: number;
  sourceAgentId: string;
  sourceAgentName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentDecision {
  id: string;
  type: 'approval' | 'rejection' | 'escalation' | 'action' | 'alert';
  agentId: string;
  agentName?: string;
  subject: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relatedEntityId?: string;
  relatedEntityType?: string;
  requiresHumanReview: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface A2AMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: 'request' | 'response' | 'alert' | 'action' | 'detection' | 'scan';
  content: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval?: boolean;
  timestamp: Date;
}

// Sync status tracking
interface SyncStatus {
  lastSyncTime: Date | null;
  pendingCount: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ id: string; error: string; timestamp: Date }>;
}

/**
 * PalantirMemoryBridge - Syncs agent memory to Palantir ontology
 */
class PalantirMemoryBridgeClass extends EventEmitter {
  private palantir: ReturnType<typeof getPalantirService> | null = null;
  private syncQueue: Array<{ type: 'fact' | 'decision' | 'message'; data: any }> = [];
  private isProcessing = false;
  private syncStatus: SyncStatus = {
    lastSyncTime: null,
    pendingCount: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
  };

  // Batch settings
  private batchSize = 10;
  private batchIntervalMs = 5000; // 5 seconds
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializePalantir();
  }

  private initializePalantir(): void {
    try {
      this.palantir = getPalantirService();
      if (this.palantir) {
        console.log('[PalantirMemoryBridge] Connected to Palantir');
        this.startBatchProcessor();
      } else {
        console.warn('[PalantirMemoryBridge] Palantir service not available - sync disabled');
      }
    } catch (error) {
      console.error('[PalantirMemoryBridge] Failed to initialize Palantir:', error);
    }
  }

  private startBatchProcessor(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.batchIntervalMs);
  }

  /**
   * Sync an agent fact to Palantir as an Insight object
   */
  async syncFact(fact: AgentFact): Promise<boolean> {
    if (!this.palantir) {
      console.warn('[PalantirMemoryBridge] Cannot sync fact - Palantir not available');
      return false;
    }

    // Add to queue for batch processing
    this.syncQueue.push({ type: 'fact', data: fact });
    this.syncStatus.pendingCount++;

    // Process immediately if queue is large enough
    if (this.syncQueue.length >= this.batchSize) {
      await this.processBatch();
    }

    return true;
  }

  /**
   * Sync an agent decision to Palantir as an Insight object
   */
  async syncDecision(decision: AgentDecision): Promise<boolean> {
    if (!this.palantir) {
      console.warn('[PalantirMemoryBridge] Cannot sync decision - Palantir not available');
      return false;
    }

    // Decisions sync immediately (not batched) due to importance
    try {
      await this.writeToPalantir('decision', decision);
      this.syncStatus.successCount++;
      this.emit('decision-synced', decision);
      return true;
    } catch (error: any) {
      this.syncStatus.errorCount++;
      this.syncStatus.errors.push({
        id: decision.id,
        error: error.message,
        timestamp: new Date(),
      });
      console.error(`[PalantirMemoryBridge] Failed to sync decision ${decision.id}:`, error.message);
      return false;
    }
  }

  /**
   * Sync a critical A2A message to Palantir
   * Only syncs messages that require approval or are high/critical severity
   */
  async syncA2AMessage(message: A2AMessage): Promise<boolean> {
    if (!this.palantir) return false;

    // Only sync important messages
    const shouldSync = message.requiresApproval ||
                       message.severity === 'high' ||
                       message.severity === 'critical' ||
                       message.type === 'alert' ||
                       message.type === 'action';

    if (!shouldSync) {
      return false; // Skip non-critical messages
    }

    this.syncQueue.push({ type: 'message', data: message });
    this.syncStatus.pendingCount++;

    // Critical messages process immediately
    if (message.severity === 'critical' || message.requiresApproval) {
      await this.processBatch();
    }

    return true;
  }

  /**
   * Process the sync queue in batches
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.syncQueue.splice(0, this.batchSize);

    for (const item of batch) {
      try {
        await this.writeToPalantir(item.type, item.data);
        this.syncStatus.successCount++;
        this.syncStatus.pendingCount--;
        this.emit(`${item.type}-synced`, item.data);
      } catch (error: any) {
        this.syncStatus.errorCount++;
        this.syncStatus.pendingCount--;
        this.syncStatus.errors.push({
          id: item.data.id,
          error: error.message,
          timestamp: new Date(),
        });
        // Keep only last 100 errors
        if (this.syncStatus.errors.length > 100) {
          this.syncStatus.errors = this.syncStatus.errors.slice(-100);
        }
      }
    }

    this.syncStatus.lastSyncTime = new Date();
    this.isProcessing = false;
  }

  /**
   * Write a single item to Palantir
   */
  private async writeToPalantir(type: 'fact' | 'decision' | 'message', data: any): Promise<void> {
    if (!this.palantir) throw new Error('Palantir not available');

    let insightData: Record<string, any>;

    switch (type) {
      case 'fact':
        insightData = this.mapFactToInsight(data as AgentFact);
        break;
      case 'decision':
        insightData = this.mapDecisionToInsight(data as AgentDecision);
        break;
      case 'message':
        insightData = this.mapMessageToInsight(data as A2AMessage);
        break;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }

    await this.palantir.applyAction(PALANTIR_ACTIONS.CREATE_INSIGHT, insightData);
    console.log(`[PalantirMemoryBridge] ✓ Synced ${type}: ${data.id}`);
  }

  /**
   * Map an AgentFact to Palantir Insight format
   * Required fields: insight_id, title
   */
  private mapFactToInsight(fact: AgentFact): Record<string, any> {
    return {
      insight_id: `fact-${fact.id}`,
      title: `[Fact] ${fact.entity}: ${fact.attribute}`,
      description: `${fact.value}\n\nEntity: ${fact.entity}\nAttribute: ${fact.attribute}\nSource: ${fact.sourceAgentName || fact.sourceAgentId}`,
      insight_type: 'Pattern', // Must be: Pattern, Anomaly, Risk, Recommendation, Correlation
      source_agent_id: fact.sourceAgentId,
      severity: this.mapConfidenceToSeverity(fact.confidence),
      confidence_score: fact.confidence || 1.0,
      status: 'New',
      related_project_id: fact.metadata?.projectId,
      related_objective_id: fact.metadata?.objectiveId,
      created_at: fact.timestamp.toISOString(),
    };
  }

  /**
   * Map an AgentDecision to Palantir Insight format
   * Required fields: insight_id, title
   */
  private mapDecisionToInsight(decision: AgentDecision): Record<string, any> {
    return {
      insight_id: `decision-${decision.id}`,
      title: `[${decision.type.toUpperCase()}] ${decision.subject}`,
      description: `${decision.description}\n\nAgent: ${decision.agentName || decision.agentId}\nType: ${decision.type}\nRequires Review: ${decision.requiresHumanReview}`,
      insight_type: decision.type === 'alert' ? 'Risk' : 'Recommendation',
      source_agent_id: decision.agentId,
      severity: this.mapSeverityToInsightSeverity(decision.severity),
      status: this.mapDecisionStatus(decision.status),
      related_project_id: decision.relatedEntityType === 'project' ? decision.relatedEntityId : undefined,
      related_objective_id: decision.relatedEntityType === 'okr' ? decision.relatedEntityId : undefined,
      created_at: decision.timestamp.toISOString(),
    };
  }

  /**
   * Map an A2A Message to Palantir Insight format
   * Required fields: insight_id, title
   */
  private mapMessageToInsight(message: A2AMessage): Record<string, any> {
    return {
      insight_id: `a2a-${message.id}`,
      title: `[A2A] ${message.fromAgentId} → ${message.toAgentId}: ${message.type}`,
      description: `${message.content}\n\nFrom: ${message.fromAgentId}\nTo: ${message.toAgentId}\nType: ${message.type}`,
      insight_type: message.type === 'alert' ? 'Risk' : 'Correlation',
      source_agent_id: message.fromAgentId,
      severity: this.mapSeverityToInsightSeverity(message.severity || 'low'),
      status: 'New',
      created_at: message.timestamp.toISOString(),
    };
  }

  /**
   * Map severity to Palantir Insight severity (Critical, High, Medium, Low, Informational)
   */
  private mapSeverityToInsightSeverity(severity: string): string {
    const map: Record<string, string> = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
    };
    return map[severity?.toLowerCase()] || 'Informational';
  }

  /**
   * Map decision status to Palantir Insight status
   */
  private mapDecisionStatus(status: string): string {
    const map: Record<string, string> = {
      'pending': 'New',
      'approved': 'Resolved',
      'rejected': 'Dismissed',
      'completed': 'Resolved',
    };
    return map[status?.toLowerCase()] || 'New';
  }

  /**
   * Map confidence score to severity level
   * Must match Palantir values: Critical, High, Medium, Low, Informational
   */
  private mapConfidenceToSeverity(confidence?: number): string {
    if (!confidence) return 'Low';
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus & { queueLength: number; isProcessing: boolean } {
    return {
      ...this.syncStatus,
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Force process all pending items
   */
  async flush(): Promise<void> {
    while (this.syncQueue.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Shutdown the bridge
   */
  shutdown(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.flush().catch(console.error);
  }
}

// Singleton instance
let _bridge: PalantirMemoryBridgeClass | null = null;

export function getPalantirMemoryBridge(): PalantirMemoryBridgeClass {
  if (!_bridge) {
    _bridge = new PalantirMemoryBridgeClass();
  }
  return _bridge;
}

export const PalantirMemoryBridge = {
  getInstance: getPalantirMemoryBridge,
};

export default PalantirMemoryBridgeClass;
