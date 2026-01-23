/**
 * AGENT ORCHESTRATION BOOTSTRAP
 *
 * Initializes all agents and connects them to the unified orchestration engine
 */

import type { IStorage } from '../storage.js';
import { ProductionOrchestrationEngine } from './orchestration/ProductionOrchestrationEngine.js';
import { TMOAgent } from './TMOAgent.js';
import { FinOpsAgent } from './FinOpsAgent.js';
import { RiskAgent } from './RiskAgent.js';
import { VROAgent } from './VROAgent.js';
import { OKRInferenceAgent } from './OKRInferenceAgent.js';
import { GovernanceAgent, PlanningAgent, OCMAgent, IntegratedMgmtAgent } from './AllAgents.js';

export class AgentOrchestrationBootstrap {
  private storage: IStorage;
  private orchestrationEngine: ProductionOrchestrationEngine;
  private agents: Map<string, any> = new Map();

  constructor(storage: IStorage) {
    this.storage = storage;
    this.orchestrationEngine = new ProductionOrchestrationEngine(storage);
  }

  /**
   * Initialize all agents and connect to orchestration engine
   */
  async initialize(): Promise<void> {
    console.log('[Bootstrap] Initializing all agents...');

    // Initialize all 9 agents
    const tmoAgent = new TMOAgent(this.storage);
    const finopsAgent = new FinOpsAgent(this.storage);
    const riskAgent = new RiskAgent(this.storage);
    const vroAgent = new VROAgent(this.storage);
    const okrAgent = new OKRInferenceAgent(this.storage);
    const governanceAgent = new GovernanceAgent(this.storage);
    const planningAgent = new PlanningAgent(this.storage);
    const ocmAgent = new OCMAgent(this.storage);
    const integratedAgent = new IntegratedMgmtAgent(this.storage);

    // Store agents
    this.agents.set('tmo', tmoAgent);
    this.agents.set('finops', finopsAgent);
    this.agents.set('risk', riskAgent);
    this.agents.set('vro', vroAgent);
    this.agents.set('okr', okrAgent);
    this.agents.set('governance', governanceAgent);
    this.agents.set('planning', planningAgent);
    this.agents.set('ocm', ocmAgent);
    this.agents.set('integrated', integratedAgent);

    // Register all agents with orchestration engine
    this.agents.forEach((agent, agentId) => {
      this.orchestrationEngine.registerAgent(agentId, agent);
    });

    // Start orchestration engine
    this.orchestrationEngine.start();

    console.log('[Bootstrap] ✅ All agents initialized and connected to orchestration engine');
    console.log('[Bootstrap] Status:', this.orchestrationEngine.getStatus());
  }

  /**
   * Run all agents in coordinated scan
   */
  async runCoordinatedScan(): Promise<void> {
    console.log('[Bootstrap] Starting coordinated multi-agent scan...');

    const projects = await this.storage.getProjects();
    console.log(`[Bootstrap] Scanning ${projects.length} projects with 9 agents`);

    // Agents scan in parallel but share context
    const scanPromises = [];

    for (const [agentId, agent] of this.agents.entries()) {
      const promise = this.runAgentScan(agentId, agent, projects);
      scanPromises.push(promise);
    }

    await Promise.all(scanPromises);

    console.log('[Bootstrap] ✅ Coordinated scan complete');
  }

  /**
   * Run scan for a specific agent
   */
  private async runAgentScan(agentId: string, agent: any, projects: any[]): Promise<void> {
    try {
      console.log(`[Bootstrap] ${agentId} starting scan...`);

      for (const project of projects) {
        const prompt = `Analyze project ${project.name} (ID: ${project.id}). Check for issues in your domain.`;

        const result = await this.orchestrationEngine.executeAgentSafely(
          agentId,
          agent,
          prompt,
          { projectId: project.id }
        );

        // Share context with other agents
        await this.orchestrationEngine.shareContextSafely(agentId, {
          agentId,
          projectId: project.id,
          insights: {
            issues: result.issues || [],
            healthScore: result.healthScore || 0.7,
            recommendations: result.recommendations || [],
          },
          recommendations: result.recommendations || [],
          confidence: 0.85,
          timestamp: new Date(),
          dependencies: this.getDependentAgents(agentId),
        });

        // Trigger workflows if needed
        if (result.events) {
          for (const event of result.events) {
            await this.orchestrationEngine.triggerWorkflowSafely(agentId, event.type, {
              projectId: project.id,
              ...event.data,
            });
          }
        }
      }

      console.log(`[Bootstrap] ${agentId} scan complete`);
    } catch (error) {
      console.error(`[Bootstrap] Error in ${agentId} scan:`, error);
    }
  }

  /**
   * Get dependent agents that should receive context updates
   */
  private getDependentAgents(agentId: string): string[] {
    const dependencies: Record<string, string[]> = {
      'finops': ['tmo', 'vro', 'planning'],
      'tmo': ['finops', 'vro', 'planning'],
      'vro': ['finops', 'tmo', 'okr', 'planning'],
      'risk': ['governance', 'planning', 'vro'],
      'okr': ['vro', 'planning'],
      'governance': ['risk', 'planning'],
      'planning': ['finops', 'tmo', 'vro'],
      'ocm': ['vro', 'governance'],
      'integrated': ['finops', 'tmo', 'vro', 'planning'],
    };

    return dependencies[agentId] || [];
  }

  /**
   * Get unified insights for all projects
   */
  async getUnifiedInsights(): Promise<any[]> {
    const projects = await this.storage.getProjects();
    const insights = [];

    for (const project of projects) {
      try {
        const projectInsights = await this.orchestrationEngine.getUnifiedInsights(project.id);
        insights.push(projectInsights);
      } catch (error) {
        console.error(`Error getting insights for project ${project.id}:`, error);
      }
    }

    return insights;
  }

  /**
   * Get orchestration engine
   */
  getOrchestrationEngine(): ProductionOrchestrationEngine {
    return this.orchestrationEngine;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): any {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Map<string, any> {
    return this.agents;
  }

  /**
   * Get orchestration status
   */
  getStatus() {
    return {
      totalAgents: this.agents.size,
      agents: Array.from(this.agents.keys()),
      orchestration: this.orchestrationEngine.getStatus(),
    };
  }
}
