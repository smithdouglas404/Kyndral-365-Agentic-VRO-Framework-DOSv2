/**
 * AGENT REGISTRY SERVICE
 *
 * Single source of truth for agent definitions.
 * Loads agents from database and provides them to all consumers.
 * Eliminates hardcoded agent references throughout the codebase.
 */

import { db } from "../db.js";
import { agents } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

// Agent definition from database
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: "domain" | "orchestration" | "utility";
  enabled: boolean;
  capabilities: string[];
  defaultPriority: number;
  ownerUserId?: string | null;
  ownerTeam?: string | null;
  palantirObjectTypes: string[];
  palantirFunctions?: string[];
  mcpConnections: string[];
  icon?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Agent metadata for UI display
export interface AgentMetadata {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  enabled: boolean;
  capabilities: string[];
  palantirObjectTypes: string[];
}

// Agent class mapping for dynamic instantiation
export interface AgentClassMapping {
  agentId: string;
  className: string;
  modulePath: string;
}

// Singleton instance
let instance: AgentRegistryService | null = null;

export class AgentRegistryService {
  private agents: Map<string, AgentDefinition> = new Map();
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  // Single generic fallback for agents without database-specified icon/color
  // All icons and colors should be stored in the database via Admin UI
  private static FALLBACK_ICON = "Bot";
  private static FALLBACK_COLOR = "#6366f1";

  // Known agent class mappings (for agents with custom implementations)
  // Note: Most new agents should use GenericDeepAgent instead
  private static AGENT_CLASS_MAPPINGS: AgentClassMapping[] = [
    { agentId: "finops", className: "DeepFinOpsAgent", modulePath: "./deep/DeepFinOpsAgent.js" },
    { agentId: "tmo", className: "DeepTMOAgent", modulePath: "./deep/DeepTMOAgent.js" },
    { agentId: "risk", className: "DeepRiskAgent", modulePath: "./deep/DeepRiskAgent.js" },
    { agentId: "vro", className: "DeepVROAgent", modulePath: "./deep/DeepVROAgent.js" },
    { agentId: "pmo", className: "DeepPMOAgent", modulePath: "./deep/DeepPMOAgent.js" },
    { agentId: "ocm", className: "DeepOCMAgent", modulePath: "./deep/DeepOCMAgent.js" },
    { agentId: "governance", className: "DeepGovernanceAgent", modulePath: "./deep/DeepGovernanceAgent.js" },
    { agentId: "planning", className: "DeepPlanningAgent", modulePath: "./deep/DeepPlanningAgent.js" },
    { agentId: "integrated", className: "DeepIntegratedMgmtAgent", modulePath: "./deep/DeepIntegratedMgmtAgent.js" },
    { agentId: "okr", className: "DeepOKRInferenceAgent", modulePath: "./deep/DeepOKRInferenceAgent.js" },
    { agentId: "notification", className: "DeepNotificationAgent", modulePath: "./deep/DeepNotificationAgent.js" },
  ];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AgentRegistryService {
    if (!instance) {
      instance = new AgentRegistryService();
    }
    return instance;
  }

  /**
   * Initialize by loading agents from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadAgentsFromDatabase();
    await this.initPromise;
    this.initialized = true;
  }

  /**
   * Load all agents from database
   */
  private async loadAgentsFromDatabase(): Promise<void> {
    try {
      const dbAgents = await db.select().from(agents);

      this.agents.clear();
      for (const agent of dbAgents) {
        // Parse JSON fields that might be stored as strings or null
        const parseJsonArray = (value: any): string[] => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        };

        this.agents.set(agent.id, {
          id: agent.id,
          name: agent.name,
          description: agent.description || "",
          category: agent.category as "domain" | "orchestration" | "utility",
          enabled: agent.enabled ?? true,
          capabilities: parseJsonArray(agent.capabilities),
          defaultPriority: agent.defaultPriority ?? 5,
          ownerUserId: agent.ownerUserId,
          ownerTeam: agent.ownerTeam,
          palantirObjectTypes: parseJsonArray(agent.palantirObjectTypes),
          palantirFunctions: parseJsonArray((agent as any).palantirFunctions),
          mcpConnections: parseJsonArray(agent.mcpConnections),
          icon: agent.icon,
          color: agent.color,
          createdAt: agent.createdAt || new Date(),
          updatedAt: agent.updatedAt || new Date(),
        });
      }

      console.log(`[AgentRegistry] Loaded ${this.agents.size} agents from database`);
    } catch (error) {
      console.error("[AgentRegistry] Failed to load agents:", error);
      // Initialize with empty map - will try again on next request
      this.agents.clear();
    }
  }

  /**
   * Reload agents from database
   */
  async reload(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    await this.initialize();
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<AgentDefinition[]> {
    await this.initialize();
    return Array.from(this.agents.values());
  }

  /**
   * Get enabled agents only
   */
  async getEnabledAgents(): Promise<AgentDefinition[]> {
    await this.initialize();
    return Array.from(this.agents.values()).filter((a) => a.enabled);
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AgentDefinition | undefined> {
    await this.initialize();
    return this.agents.get(agentId);
  }

  /**
   * Get all agent IDs
   */
  async getAgentIds(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.agents.keys());
  }

  /**
   * Get enabled agent IDs
   */
  async getEnabledAgentIds(): Promise<string[]> {
    const enabledAgents = await this.getEnabledAgents();
    return enabledAgents.map((a) => a.id);
  }

  /**
   * Check if agent exists
   */
  async agentExists(agentId: string): Promise<boolean> {
    await this.initialize();
    return this.agents.has(agentId);
  }

  /**
   * Get agent metadata for UI
   * Icons and colors come from database - generic fallback if not specified
   */
  async getAgentMetadata(agentId: string): Promise<AgentMetadata | undefined> {
    const agent = await this.getAgent(agentId);
    if (!agent) return undefined;

    return {
      id: agent.id,
      name: agent.name,
      shortName: this.getShortName(agent.name),
      description: agent.description,
      icon: agent.icon || AgentRegistryService.FALLBACK_ICON,
      color: agent.color || AgentRegistryService.FALLBACK_COLOR,
      category: agent.category,
      enabled: agent.enabled,
      capabilities: agent.capabilities,
      palantirObjectTypes: agent.palantirObjectTypes,
    };
  }

  /**
   * Get all agent metadata for UI
   * Icons and colors come from database - generic fallback if not specified
   */
  async getAllAgentMetadata(): Promise<AgentMetadata[]> {
    const allAgents = await this.getAllAgents();
    return allAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      shortName: this.getShortName(agent.name),
      description: agent.description,
      icon: agent.icon || AgentRegistryService.FALLBACK_ICON,
      color: agent.color || AgentRegistryService.FALLBACK_COLOR,
      category: agent.category,
      enabled: agent.enabled,
      capabilities: agent.capabilities,
      palantirObjectTypes: agent.palantirObjectTypes,
    }));
  }

  /**
   * Get class mapping for an agent
   */
  getAgentClassMapping(agentId: string): AgentClassMapping | undefined {
    return AgentRegistryService.AGENT_CLASS_MAPPINGS.find((m) => m.agentId === agentId);
  }

  /**
   * Get all class mappings
   */
  getAllAgentClassMappings(): AgentClassMapping[] {
    return AgentRegistryService.AGENT_CLASS_MAPPINGS;
  }

  /**
   * Get agents by Palantir object type
   */
  async getAgentsByObjectType(objectType: string): Promise<AgentDefinition[]> {
    const allAgents = await this.getEnabledAgents();
    return allAgents.filter((a) => a.palantirObjectTypes.includes(objectType));
  }

  /**
   * Get Palantir functions for an agent
   */
  async getAgentPalantirFunctions(agentId: string): Promise<string[]> {
    const agent = await this.getAgent(agentId);
    return agent?.palantirFunctions || [];
  }

  /**
   * Create short name from agent name
   */
  private getShortName(name: string): string {
    // Extract uppercase letters or first 3 characters
    const upperCase = name.replace(/[^A-Z]/g, "");
    if (upperCase.length >= 2) return upperCase.substring(0, 3);
    return name.substring(0, 3).toUpperCase();
  }

  /**
   * Prepare agent data for Palantir sync
   */
  async prepareForPalantirSync(): Promise<any[]> {
    const allAgents = await this.getAllAgents();
    return allAgents.map((agent) => ({
      agentId: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      enabled: agent.enabled,
      capabilities: agent.capabilities,
      palantirObjectTypes: agent.palantirObjectTypes,
      palantirFunctions: agent.palantirFunctions || [],
      priority: agent.defaultPriority,
      metadata: {
        icon: agent.icon,
        color: agent.color,
        ownerTeam: agent.ownerTeam,
      },
    }));
  }
}

// Export singleton getter
export function getAgentRegistry(): AgentRegistryService {
  return AgentRegistryService.getInstance();
}

// Export for convenience
export const agentRegistry = AgentRegistryService.getInstance();
