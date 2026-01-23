/**
 * AgentOrchestrator - Event-Driven Multi-Agent Coordination
 *
 * DESIGN PHILOSOPHY:
 * - Agents run INDEPENDENTLY by default (efficient, fast)
 * - Orchestrator only activates for COMPLEX issues (collaboration when needed)
 * - Event-driven, not always-on (no coordination overhead for routine work)
 *
 * WHEN TO COLLABORATE:
 * - Critical severity issues (>= high)
 * - Cross-domain issues (budget + schedule)
 * - Conflicting recommendations
 * - Value impact assessment needed
 */

import type { IStorage } from '../../storage.js';
import { ChatAnthropic } from "@langchain/anthropic";
import { LangChainTracer } from "langchain/callbacks";

export interface CollaborationEvent {
  triggeredBy: string; // Agent ID that triggered collaboration
  projectId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  findings: AgentFinding[];
  requiresCollaboration: boolean;
}

export interface AgentFinding {
  agentId: string;
  agentName: string;
  issue: string;
  severity: string;
  confidence: number;
  recommendation: string;
  data: any;
}

export interface CollaborationResult {
  synthesizedRecommendation: string;
  participatingAgents: string[];
  confidence: number;
  reasoning: string;
  interventionId?: string;
}

export class AgentOrchestrator {
  private storage: IStorage;
  private agents: Map<string, any>;
  private model: ChatAnthropic;
  private collaborationThreshold: { [key: string]: any };

  constructor(storage: IStorage, agents: Map<string, any>) {
    this.storage = storage;
    this.agents = agents;

    // Initialize coordinator LLM
    const callbacks = [];
    if (process.env.LANGCHAIN_API_KEY && process.env.LANGCHAIN_TRACING_V2?.toLowerCase() === 'true') {
      const tracer = new LangChainTracer({
        projectName: process.env.LANGCHAIN_PROJECT || "DFIN-Pipeline",
        client: undefined,
      });
      callbacks.push(tracer);
    }

    this.model = new ChatAnthropic({
      modelName: "claude-sonnet-4-5-20250929",
      temperature: 0.7,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      callbacks,
      metadata: {
        layer: "orchestration",
        component: "coordinator",
        system: "multi-agent-orchestration",
      },
    });

    // Define when collaboration is needed
    this.collaborationThreshold = {
      // Budget issues
      criticalCPI: 0.75, // CPI < 0.75 triggers collaboration
      highCPI: 0.85,     // CPI < 0.85 may trigger if other issues exist

      // Schedule issues
      criticalSPI: 0.75, // SPI < 0.75 triggers collaboration
      highSPI: 0.85,

      // Severity-based triggers
      alwaysCollaborate: ['critical'],
      collaborateIfMultiple: ['high'], // 2+ high severity = collaborate
    };
  }

  /**
   * Evaluate if collaboration is needed based on issue characteristics
   */
  async shouldCollaborate(event: CollaborationEvent): Promise<boolean> {
    // Always collaborate for critical issues
    if (event.severity === 'critical') {
      console.log(`[Orchestrator] Critical issue detected - triggering collaboration`);
      return true;
    }

    // Check if multiple agents have findings for same project
    const existingFindings = await this.getRecentFindingsForProject(event.projectId);

    if (existingFindings.length >= 2) {
      console.log(`[Orchestrator] Multiple agents (${existingFindings.length}) found issues - triggering collaboration`);
      return true;
    }

    // Check for cross-domain issues (budget + schedule)
    const hasBudgetIssue = event.triggeredBy === 'finops' || existingFindings.some(f => f.agentId === 'finops');
    const hasScheduleIssue = event.triggeredBy === 'tmo' || existingFindings.some(f => f.agentId === 'tmo');

    if (hasBudgetIssue && hasScheduleIssue) {
      console.log(`[Orchestrator] Cross-domain issue (budget + schedule) - triggering collaboration`);
      return true;
    }

    // Otherwise, let agent work independently
    console.log(`[Orchestrator] Single-domain ${event.severity} issue - agent can handle independently`);
    return false;
  }

  /**
   * Get recent findings from other agents for the same project
   */
  private async getRecentFindingsForProject(projectId: string): Promise<AgentFinding[]> {
    try {
      // Get recent interventions (last 24 hours) for this project
      const allInterventions = await this.storage.getInterventions();
      const interventions = allInterventions.filter((i: any) => i.projectId === projectId);
      const recentInterventions = interventions.filter((i: any) => {
        const createdAt = new Date(i.createdAt || Date.now());
        const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursAgo < 24;
      });

      // Convert to findings
      return recentInterventions.map(i => ({
        agentId: i.agentSource?.toLowerCase().replace(' agent', '') || 'unknown',
        agentName: i.agentSource || 'Unknown Agent',
        issue: i.title,
        severity: i.severity,
        confidence: parseFloat(i.confidence || '0.8'),
        recommendation: i.suggestedAction || '',
        data: i,
      }));
    } catch (error) {
      console.error('[Orchestrator] Error getting recent findings:', error);
      return [];
    }
  }

  /**
   * Orchestrate multi-agent collaboration
   */
  async orchestrate(event: CollaborationEvent): Promise<CollaborationResult> {
    console.log(`[Orchestrator] Starting collaboration for project ${event.projectId}`);
    console.log(`[Orchestrator] Triggered by: ${event.triggeredBy}`);
    console.log(`[Orchestrator] Issue: ${event.issue}`);

    // Determine which agents should participate
    const relevantAgents = await this.selectRelevantAgents(event);
    console.log(`[Orchestrator] Selected agents: ${relevantAgents.join(', ')}`);

    // Gather findings from participating agents
    const findings: AgentFinding[] = [...event.findings];

    // Query other relevant agents for their perspective
    for (const agentId of relevantAgents) {
      if (agentId === event.triggeredBy) continue; // Skip triggering agent

      const agentFinding = await this.consultAgent(agentId, event);
      if (agentFinding) {
        findings.push(agentFinding);
      }
    }

    // Synthesize recommendations using coordinator LLM
    const synthesis = await this.synthesizeRecommendations(event, findings);

    console.log(`[Orchestrator] Collaboration complete. Confidence: ${synthesis.confidence}`);

    return synthesis;
  }

  /**
   * Select which agents should participate based on the issue
   */
  private async selectRelevantAgents(event: CollaborationEvent): Promise<string[]> {
    const agents: string[] = [event.triggeredBy];

    // For budget issues, include TMO and VRO
    if (event.triggeredBy === 'finops') {
      agents.push('tmo');  // Check if schedule can be adjusted
      agents.push('vro');  // Assess ROI impact
    }

    // For schedule issues, include FinOps and VRO
    if (event.triggeredBy === 'tmo') {
      agents.push('finops'); // Check budget flexibility
      agents.push('vro');    // Assess value impact of delay
    }

    // For risk issues, include Governance
    if (event.triggeredBy === 'risk') {
      agents.push('governance'); // May need escalation/approval
    }

    // For value issues, include all execution agents
    if (event.triggeredBy === 'vro') {
      agents.push('finops', 'tmo', 'planning');
    }

    // Always include Planning for resource/dependency analysis
    if (!agents.includes('planning')) {
      agents.push('planning');
    }

    return [...new Set(agents)]; // Remove duplicates
  }

  /**
   * Consult a specific agent for their perspective on the issue
   */
  private async consultAgent(agentId: string, event: CollaborationEvent): Promise<AgentFinding | null> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        console.warn(`[Orchestrator] Agent ${agentId} not found`);
        return null;
      }

      console.log(`[Orchestrator] Consulting ${agentId} agent...`);

      // Ask agent to analyze the specific project/issue
      const prompt = `Another agent (${event.triggeredBy}) found a ${event.severity} issue:

Issue: ${event.issue}
Project ID: ${event.projectId}

From your domain expertise, analyze this project and provide:
1. Your assessment of the situation
2. How this impacts your domain
3. Your recommended action (if any)

Only respond if this is relevant to your domain. Keep it brief.`;

      const result = await agent.execute(prompt, { projectId: event.projectId });

      return {
        agentId,
        agentName: agent.getConfig().agentName,
        issue: event.issue,
        severity: event.severity,
        confidence: 0.8,
        recommendation: result.output || 'No specific recommendation',
        data: result,
      };
    } catch (error) {
      console.error(`[Orchestrator] Error consulting ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Synthesize recommendations from multiple agents using coordinator LLM
   */
  private async synthesizeRecommendations(
    event: CollaborationEvent,
    findings: AgentFinding[]
  ): Promise<CollaborationResult> {
    const findingsSummary = findings.map(f =>
      `- ${f.agentName}: ${f.recommendation} (confidence: ${f.confidence})`
    ).join('\n');

    const synthesisPrompt = `You are a coordinator synthesizing insights from multiple AI agents analyzing a project issue.

Original Issue: ${event.issue}
Severity: ${event.severity}
Project ID: ${event.projectId}

Agent Findings:
${findingsSummary}

Your task:
1. Identify common themes across agent recommendations
2. Detect any conflicting recommendations
3. Synthesize a unified, actionable recommendation
4. Assess overall confidence (0-1)
5. Provide reasoning for your synthesis

Respond in JSON format:
{
  "synthesizedRecommendation": "...",
  "confidence": 0.85,
  "reasoning": "...",
  "conflicts": []
}`;

    try {
      const response = await this.model.invoke(synthesisPrompt);
      const content = response.content.toString();

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const synthesis = JSON.parse(jsonMatch[0]);

        return {
          synthesizedRecommendation: synthesis.synthesizedRecommendation,
          participatingAgents: findings.map(f => f.agentId),
          confidence: synthesis.confidence,
          reasoning: synthesis.reasoning,
        };
      }
    } catch (error) {
      console.error('[Orchestrator] Synthesis error:', error);
    }

    // Fallback: Simple concatenation
    return {
      synthesizedRecommendation: findings.map(f => f.recommendation).join('; '),
      participatingAgents: findings.map(f => f.agentId),
      confidence: 0.7,
      reasoning: 'Fallback synthesis - see individual agent recommendations',
    };
  }

  /**
   * Create a multi-agent intervention in the database
   */
  async createCollaborativeIntervention(
    event: CollaborationEvent,
    synthesis: CollaborationResult
  ): Promise<string> {
    const intervention = await this.storage.createIntervention({
      type: 'multi_agent_collaboration',
      severity: event.severity,
      title: `Multi-Agent Analysis: ${event.issue}`,
      description: synthesis.synthesizedRecommendation,
      projectId: event.projectId,
      projectName: null,
      confidence: synthesis.confidence.toString(),
      suggestedAction: synthesis.synthesizedRecommendation,
      impact: `Collaborative recommendation from: ${synthesis.participatingAgents.join(', ')}`,
      status: 'pending',
      agentSource: `Orchestrator (${synthesis.participatingAgents.length} agents)`,
      isAutonomous: 'false',
      selfApproved: 'false',
      triggerSource: 'multi_agent_collaboration',
      approvedBy: null,
    });

    console.log(`[Orchestrator] Created collaborative intervention: ${intervention.id}`);
    return intervention.id;
  }

  /**
   * Share information between agents (lightweight, async)
   */
  async shareInformation(fromAgent: string, toAgent: string, message: string, context: any) {
    console.log(`[Orchestrator] ${fromAgent} → ${toAgent}: ${message}`);

    // Store in shared context (for agent memory)
    await this.storage.createAgentActivityLog({
      eventType: 'agent_communication',
      primaryAgentId: fromAgent,
      primaryAgentName: fromAgent,
      summary: `Message to ${toAgent}: ${message}`,
      details: JSON.stringify(context),
    });

    // Could also use Redis pub/sub for real-time, but DB is fine for async
  }
}

/**
 * Factory function to create orchestrator
 */
export function createOrchestrator(storage: IStorage, agents: Map<string, any>): AgentOrchestrator {
  return new AgentOrchestrator(storage, agents);
}
