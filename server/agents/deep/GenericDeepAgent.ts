/**
 * GENERIC DEEP AGENT
 *
 * A fully configurable agent that works for ANY agent type without custom code.
 * All configuration comes from the database:
 * - Agent name, description, capabilities
 * - Palantir object types to monitor
 * - Palantir functions to execute
 * - Priority and scan frequency
 *
 * This eliminates the need for custom agent classes for most use cases.
 * Only create a custom class if you need specialized logic that can't be
 * expressed through configuration.
 */

import { DeepAgentBase, type DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import type { AgentDefinition } from "../../services/AgentRegistryService.js";

/**
 * Extended config that includes database fields
 */
interface GenericAgentConfig extends DeepAgentConfig {
  palantirObjectTypes: string[];
  palantirFunctions: string[];
  priority: number;
}

/**
 * Generic Deep Agent - works for any agent type from database
 */
export class GenericDeepAgent extends DeepAgentBase {
  private palantirObjectTypes: string[];
  private palantirFunctions: string[];
  private priority: number;

  constructor(storage: IStorage, agentDef: AgentDefinition) {
    // Build config from database definition
    const config: GenericAgentConfig = {
      agentName: agentDef.name,
      agentType: agentDef.id,
      description: agentDef.description,
      capabilities: agentDef.capabilities,
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 5,
      reflectionThreshold: 3,
      useSmartRouting: true,
      palantirObjectTypes: agentDef.palantirObjectTypes || [],
      palantirFunctions: agentDef.palantirFunctions || [],
      priority: agentDef.defaultPriority || 5,
    };

    super(config, storage);

    this.palantirObjectTypes = config.palantirObjectTypes;
    this.palantirFunctions = config.palantirFunctions;
    this.priority = config.priority;

    console.log(`[GenericDeepAgent] Initialized ${agentDef.id} with ${this.palantirObjectTypes.length} object types, ${this.palantirFunctions.length} functions`);
  }

  /**
   * Get agent configuration
   */
  getConfig(): GenericAgentConfig {
    return {
      ...this.config,
      palantirObjectTypes: this.palantirObjectTypes,
      palantirFunctions: this.palantirFunctions,
      priority: this.priority,
    };
  }

  /**
   * Run scheduled scan - monitors all configured Palantir object types
   */
  async runScheduledScan(): Promise<void> {
    console.log(`[${this.config.agentName}] Starting scheduled scan...`);

    try {
      // Scan each configured object type
      for (const objectType of this.palantirObjectTypes) {
        await this.scanObjectType(objectType);
      }

      // Execute any configured functions
      for (const functionName of this.palantirFunctions) {
        await this.executeFunction(functionName);
      }

      console.log(`[${this.config.agentName}] Scan complete`);
    } catch (error) {
      console.error(`[${this.config.agentName}] Scan error:`, error);
    }
  }

  /**
   * Scan a Palantir object type for issues
   */
  private async scanObjectType(objectType: string): Promise<void> {
    try {
      // Import OntologyDataProvider
      const { OntologyDataProvider } = await import("../../services/OntologyDataProvider.js");

      // Query objects of this type
      const result = await OntologyDataProvider.query(objectType, {
        pageSize: 100,
      });

      if (!result.data || result.data.length === 0) {
        return;
      }

      console.log(`[${this.config.agentName}] Found ${result.data.length} ${objectType} objects`);

      // Analyze objects based on agent capabilities
      for (const obj of result.data) {
        await this.analyzeObject(objectType, obj);
      }
    } catch (error) {
      console.error(`[${this.config.agentName}] Error scanning ${objectType}:`, error);
    }
  }

  /**
   * Analyze an individual object
   */
  private async analyzeObject(objectType: string, obj: any): Promise<void> {
    // Use AI to analyze based on capabilities
    const capabilities = this.config.capabilities.join(", ");

    const prompt = `
As the ${this.config.agentName}, analyze this ${objectType} object.

Your capabilities: ${capabilities}

Object data:
${JSON.stringify(obj, null, 2)}

Based on your capabilities, identify any issues, risks, or opportunities.
If you find something noteworthy, describe it briefly.
If everything looks fine, respond with "OK".
`;

    try {
      const analysis = await this.router.chat([
        { role: "system", content: `You are ${this.config.agentName}. ${this.config.description}` },
        { role: "user", content: prompt },
      ], {
        temperature: 0.3,
        maxTokens: 500,
      });

      const response = analysis.content;

      // If not OK, log the finding
      if (response && !response.trim().toUpperCase().startsWith("OK")) {
        console.log(`[${this.config.agentName}] Finding in ${objectType}:`, response.substring(0, 200));

        // Could create intervention/alert here if critical
      }
    } catch (error) {
      // AI analysis failed, skip
    }
  }

  /**
   * Execute a configured Palantir function
   */
  private async executeFunction(functionName: string): Promise<void> {
    try {
      const { getPalantirService } = await import("../../mcp/MCPServiceFactory.js");
      const palantir = getPalantirService();

      if (!palantir?.executeFunction) {
        return;
      }

      console.log(`[${this.config.agentName}] Executing function: ${functionName}`);

      // Execute the function
      const result = await palantir.executeFunction(functionName, {
        agentId: this.config.agentType,
        timestamp: new Date().toISOString(),
      });

      console.log(`[${this.config.agentName}] Function ${functionName} result:`, result?.success);
    } catch (error) {
      console.error(`[${this.config.agentName}] Function ${functionName} error:`, error);
    }
  }

  /**
   * Execute with prompt - main entry point for direct commands
   */
  async execute(prompt: string): Promise<string> {
    console.log(`[${this.config.agentName}] Executing: ${prompt.substring(0, 100)}...`);

    try {
      // Build context from capabilities
      const systemPrompt = `
You are ${this.config.agentName}.

Description: ${this.config.description}

Your capabilities:
${this.config.capabilities.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Palantir object types you monitor: ${this.palantirObjectTypes.join(", ") || "None configured"}

Respond helpfully based on your capabilities and domain expertise.
`;

      const result = await this.router.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ], {
        temperature: 0.7,
        maxTokens: 1000,
      });

      return result.content || "No response generated";
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Execution error:`, error);
      return `Error: ${error.message}`;
    }
  }
}

/**
 * Factory function to create a GenericDeepAgent from database definition
 */
export function createGenericAgent(storage: IStorage, agentDef: AgentDefinition): GenericDeepAgent {
  return new GenericDeepAgent(storage, agentDef);
}
