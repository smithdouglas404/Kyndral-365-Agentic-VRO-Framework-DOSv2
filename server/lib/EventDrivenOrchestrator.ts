/**
 * EVENT-DRIVEN ORCHESTRATOR
 * 
 * Replaces timer-based orchestration with change-driven analysis:
 * 1. CACHING - Skip unchanged projects (hash-based change detection)
 * 2. EVENT-DRIVEN - Only analyze when data changes
 * 3. MEM0/LETTA ALWAYS ON - Memory systems run continuously (no API cost)
 * 4. AGENT NOTES - Agents share compact summaries
 */

import crypto from 'crypto';
import type { IStorage } from '../storage.js';
import { getMem0Service } from './Mem0Service.js';

// Project data hash for change detection
interface ProjectHash {
  projectId: string;
  hash: string;
  timestamp: number;
  analyzedBy: Set<string>; // Which agents have analyzed this version
}

// Change event that triggers analysis
export interface ChangeEvent {
  type: 'project_update' | 'budget_change' | 'schedule_change' | 'risk_change' | 'milestone' | 'resource_change' | 'memory_change';
  projectId: string;
  field?: string;
  previousValue?: any;
  newValue?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: string; // What triggered the change (e.g., 'mem0', 'letta', 'api')
  memoryType?: 'mem0' | 'letta'; // For memory_change events
}

// Agent summary note
interface AgentNote {
  agentId: string;
  projectId: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction?: string;
  timestamp: Date;
}

export class EventDrivenOrchestrator {
  private storage: IStorage;
  private projectHashes: Map<string, ProjectHash> = new Map();
  private pendingEvents: Map<string, ChangeEvent[]> = new Map();
  private agentNotes: Map<string, AgentNote> = new Map(); // key: agentId:projectId
  private agents: Map<string, any> = new Map();
  private isListening: boolean = false;
  private eventCheckInterval: NodeJS.Timeout | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
    console.log('[EventDrivenOrchestrator] Initialized - waiting for change events');
  }

  /**
   * Register an agent for event-driven analysis
   */
  registerAgent(agentId: string, agent: any): void {
    this.agents.set(agentId, agent);
    console.log(`[EventDrivenOrchestrator] Registered agent: ${agentId}`);
  }

  /**
   * Start listening for events (lightweight - no API calls)
   * Mem0 and Letta continue running in background for memory
   */
  startListening(checkIntervalMs: number = 5000): void {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('[EventDrivenOrchestrator] Started event listening');
    console.log('[EventDrivenOrchestrator] Mem0/Letta memory systems active (no API cost)');
    
    // Lightweight event check - just looks for pending events
    this.eventCheckInterval = setInterval(() => {
      this.processQueuedEvents();
    }, checkIntervalMs);
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.eventCheckInterval) {
      clearInterval(this.eventCheckInterval);
      this.eventCheckInterval = null;
    }
    this.isListening = false;
    console.log('[EventDrivenOrchestrator] Stopped event listening');
  }

  /**
   * Register a change event (called when project data changes)
   */
  registerChange(event: ChangeEvent): void {
    const events = this.pendingEvents.get(event.projectId) || [];
    events.push(event);
    this.pendingEvents.set(event.projectId, events);
    
    console.log(`[EventDrivenOrchestrator] Change registered: ${event.type} on ${event.projectId} (${event.severity})`);
    
    // Store in Mem0 for historical tracking (no API cost - just memory)
    this.storeEventInMemory(event);
  }

  /**
   * Register a memory change from Mem0 or Letta
   * This triggers: Caching check (#1) → OpenRouter analysis
   */
  registerMemoryChange(
    projectId: string,
    memoryType: 'mem0' | 'letta',
    factKey: string,
    factValue: string,
    category?: string
  ): void {
    // Determine severity based on content
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const lowerValue = factValue.toLowerCase();
    if (lowerValue.includes('critical') || lowerValue.includes('urgent') || lowerValue.includes('blocker')) {
      severity = 'critical';
    } else if (lowerValue.includes('high') || lowerValue.includes('risk') || lowerValue.includes('overrun')) {
      severity = 'high';
    } else if (lowerValue.includes('medium') || lowerValue.includes('delay') || lowerValue.includes('issue')) {
      severity = 'medium';
    }

    const event: ChangeEvent = {
      type: 'memory_change',
      projectId,
      field: factKey,
      newValue: factValue,
      severity,
      timestamp: new Date(),
      source: memoryType,
      memoryType,
    };

    // Register as a change event - this goes through caching first
    this.registerChange(event);
    
    console.log(`[EventDrivenOrchestrator] Memory change from ${memoryType}: ${factKey} → triggers caching check then OpenRouter`);
  }

  /**
   * Check if project has changed (hash-based)
   */
  async hasProjectChanged(projectId: string, currentData: any): Promise<boolean> {
    const newHash = this.hashProjectData(currentData);
    const existing = this.projectHashes.get(projectId);
    
    if (!existing) {
      // First time seeing this project
      this.projectHashes.set(projectId, {
        projectId,
        hash: newHash,
        timestamp: Date.now(),
        analyzedBy: new Set(),
      });
      return true;
    }
    
    if (existing.hash !== newHash) {
      // Data changed - update hash and clear analyzed flags
      this.projectHashes.set(projectId, {
        projectId,
        hash: newHash,
        timestamp: Date.now(),
        analyzedBy: new Set(),
      });
      return true;
    }
    
    return false;
  }

  /**
   * Check if a specific agent needs to analyze a project
   */
  needsAnalysis(projectId: string, agentId: string): boolean {
    const hashInfo = this.projectHashes.get(projectId);
    if (!hashInfo) return true; // Never analyzed
    
    return !hashInfo.analyzedBy.has(agentId);
  }

  /**
   * Mark project as analyzed by an agent
   */
  markAnalyzed(projectId: string, agentId: string): void {
    const hashInfo = this.projectHashes.get(projectId);
    if (hashInfo) {
      hashInfo.analyzedBy.add(agentId);
    }
  }

  /**
   * Store an agent's analysis note for other agents to read
   */
  storeAgentNote(note: AgentNote): void {
    const key = `${note.agentId}:${note.projectId}`;
    this.agentNotes.set(key, note);
    
    // Also store in Mem0 for persistence
    const mem0 = getMem0Service();
    mem0.storeFact({
      key: `agent_note:${key}`,
      value: JSON.stringify(note),
      category: 'agent_collaboration',
      source: note.agentId,
      confidence: 1.0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    
    console.log(`[EventDrivenOrchestrator] ${note.agentId} note stored for ${note.projectId}`);
  }

  /**
   * Get notes from other agents about a project
   */
  getAgentNotes(projectId: string, excludeAgent?: string): AgentNote[] {
    const notes: AgentNote[] = [];
    for (const [key, note] of this.agentNotes.entries()) {
      if (key.endsWith(`:${projectId}`) && note.agentId !== excludeAgent) {
        notes.push(note);
      }
    }
    return notes;
  }

  /**
   * Get projects that need analysis (have pending events or never analyzed)
   */
  async getProjectsNeedingAnalysis(): Promise<string[]> {
    const projectsWithEvents = Array.from(this.pendingEvents.keys());
    return projectsWithEvents;
  }

  /**
   * Process queued events - triggers analysis only for changed projects
   */
  private async processQueuedEvents(): Promise<void> {
    if (this.pendingEvents.size === 0) return;
    
    console.log(`[EventDrivenOrchestrator] Processing ${this.pendingEvents.size} projects with changes`);
    
    for (const [projectId, events] of this.pendingEvents.entries()) {
      // Determine which agents need to analyze based on event types
      const agentsToTrigger = this.determineAgentsForEvents(events);
      
      for (const agentId of agentsToTrigger) {
        const agent = this.agents.get(agentId);
        if (!agent) continue;
        
        // Skip if agent already analyzed current version
        if (!this.needsAnalysis(projectId, agentId)) {
          console.log(`[EventDrivenOrchestrator] ${agentId} already analyzed ${projectId} - skipping`);
          continue;
        }
        
        // Get notes from other agents
        const otherNotes = this.getAgentNotes(projectId, agentId);
        
        console.log(`[EventDrivenOrchestrator] Triggering ${agentId} for ${projectId}`);
        
        // Run agent analysis (async - don't wait)
        this.runAgentAnalysis(agent, agentId, projectId, events, otherNotes);
      }
      
      // Clear processed events
      this.pendingEvents.delete(projectId);
    }
  }

  /**
   * Determine which agents should analyze based on event types
   */
  private determineAgentsForEvents(events: ChangeEvent[]): string[] {
    const agents = new Set<string>();
    
    for (const event of events) {
      switch (event.type) {
        case 'budget_change':
          agents.add('deepfinops');
          if (event.severity === 'high' || event.severity === 'critical') {
            agents.add('deeprisk');
          }
          break;
        case 'schedule_change':
          agents.add('deeptmo');
          agents.add('deeppmo');
          if (event.severity === 'high' || event.severity === 'critical') {
            agents.add('deeprisk');
          }
          break;
        case 'risk_change':
          agents.add('deeprisk');
          agents.add('deepgovernance');
          break;
        case 'milestone':
          agents.add('deeppmo');
          agents.add('deepvro');
          break;
        case 'resource_change':
          agents.add('deepocm');
          agents.add('deeppmo');
          break;
        case 'memory_change':
          // Mem0/Letta stored new facts - trigger relevant agents via OpenRouter
          // Memory changes always go through caching check first, then OpenRouter
          if (event.field?.includes('risk') || event.field?.includes('threat')) {
            agents.add('deeprisk');
          } else if (event.field?.includes('budget') || event.field?.includes('cost') || event.field?.includes('spend')) {
            agents.add('deepfinops');
          } else if (event.field?.includes('schedule') || event.field?.includes('timeline')) {
            agents.add('deeptmo');
          } else if (event.field?.includes('value') || event.field?.includes('benefit')) {
            agents.add('deepvro');
          } else {
            // General memory update - trigger integrated management for coordination
            agents.add('deepintegratedmgmt');
          }
          break;
        case 'project_update':
        default:
          // General update - trigger appropriate agents based on severity
          if (event.severity === 'critical') {
            agents.add('deeprisk');
            agents.add('deepgovernance');
          }
          agents.add('deepintegratedmgmt');
          break;
      }
    }
    
    return Array.from(agents);
  }

  /**
   * Run agent analysis with context from other agents' notes
   */
  private async runAgentAnalysis(
    agent: any,
    agentId: string,
    projectId: string,
    events: ChangeEvent[],
    otherNotes: AgentNote[]
  ): Promise<void> {
    try {
      // Prepare context with other agents' insights
      const context = {
        projectId,
        changeEvents: events,
        otherAgentInsights: otherNotes.map(n => ({
          agent: n.agentId,
          summary: n.summary,
          riskLevel: n.riskLevel,
          action: n.recommendedAction,
        })),
      };
      
      const result = await agent.run(
        `Analyze project ${projectId} due to changes: ${events.map(e => e.type).join(', ')}`,
        context
      );
      
      // Mark as analyzed
      this.markAnalyzed(projectId, agentId);
      
      // Store note for other agents
      if (result && !result.cached) {
        this.storeAgentNote({
          agentId,
          projectId,
          summary: this.extractSummary(result),
          riskLevel: this.extractRiskLevel(result),
          recommendedAction: result.recommendation || undefined,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      console.error(`[EventDrivenOrchestrator] ${agentId} analysis failed:`, error.message);
    }
  }

  /**
   * Store event in Mem0 for historical tracking
   */
  private storeEventInMemory(event: ChangeEvent): void {
    try {
      const mem0 = getMem0Service();
      mem0.storeFact({
        key: `event:${event.projectId}:${event.type}:${Date.now()}`,
        value: JSON.stringify(event),
        category: 'project_events',
        source: event.source,
        confidence: 1.0,
      });
    } catch (error) {
      // Silent fail - memory storage is optional
    }
  }

  /**
   * Create hash of project data for change detection
   */
  private hashProjectData(data: any): string {
    const relevantData = {
      budget: data.budget,
      actualSpend: data.actualSpend,
      progress: data.progress,
      status: data.status,
      riskScore: data.riskScore,
      milestones: data.milestones,
      resources: data.resources?.length,
      updatedAt: data.updatedAt,
    };
    
    return crypto
      .createHash('md5')
      .update(JSON.stringify(relevantData))
      .digest('hex');
  }

  /**
   * Extract a summary from agent result
   */
  private extractSummary(result: any): string {
    if (result.summary) return result.summary;
    if (result.finalReflection) return result.finalReflection.slice(0, 200);
    if (result.analysis) return result.analysis.slice(0, 200);
    return 'Analysis completed';
  }

  /**
   * Extract risk level from result
   */
  private extractRiskLevel(result: any): 'low' | 'medium' | 'high' | 'critical' {
    if (result.riskLevel) return result.riskLevel;
    if (result.severity) return result.severity;
    return 'low';
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    isListening: boolean;
    pendingEvents: number;
    projectsTracked: number;
    agentNotes: number;
    registeredAgents: number;
  } {
    return {
      isListening: this.isListening,
      pendingEvents: Array.from(this.pendingEvents.values()).reduce((sum, arr) => sum + arr.length, 0),
      projectsTracked: this.projectHashes.size,
      agentNotes: this.agentNotes.size,
      registeredAgents: this.agents.size,
    };
  }
}

// Singleton
let orchestratorInstance: EventDrivenOrchestrator | null = null;

export function getEventDrivenOrchestrator(storage?: IStorage): EventDrivenOrchestrator | null {
  if (!orchestratorInstance && storage) {
    orchestratorInstance = new EventDrivenOrchestrator(storage);
  }
  return orchestratorInstance;
}
