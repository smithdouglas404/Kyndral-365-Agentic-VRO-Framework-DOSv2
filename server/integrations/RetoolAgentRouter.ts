/**
 * RETOOL AGENT ROUTER
 *
 * Intelligent routing between Deep Agents (complex reasoning) and Retool Agents (simple tasks).
 *
 * Decision Logic:
 * - Deep Agents: Complex analysis, multi-step reasoning, domain expertise
 * - Retool Agents: Data entry, notifications, form processing, CRUD operations
 *
 * This preserves agent autonomy while offloading deterministic work.
 */

export enum TaskComplexity {
  SIMPLE = 'simple',           // Retool Agent
  MODERATE = 'moderate',       // Could go either way
  COMPLEX = 'complex',         // Deep Agent
  REQUIRES_EXPERTISE = 'requires_expertise', // Deep Agent
}

export enum TaskCategory {
  // Simple tasks (→ Retool Agents)
  DATA_ENTRY = 'data_entry',
  NOTIFICATION = 'notification',
  FORM_PROCESSING = 'form_processing',
  CRUD_OPERATION = 'crud_operation',
  SCHEDULING = 'scheduling',
  REPORTING = 'reporting',

  // Complex tasks (→ Deep Agents)
  ANALYSIS = 'analysis',
  PLANNING = 'planning',
  RISK_ASSESSMENT = 'risk_assessment',
  BUDGET_ANALYSIS = 'budget_analysis',
  STRATEGIC_DECISION = 'strategic_decision',
  CROSS_DOMAIN = 'cross_domain',
  COLLABORATION = 'collaboration',
}

export interface TaskRequest {
  description: string;
  category?: TaskCategory;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requiresExpertise?: boolean;
  requiresMultiStep?: boolean;
}

export interface RoutingDecision {
  routeTo: 'deep-agent' | 'retool-agent' | 'workflow';
  agentId?: string;
  workflowId?: string;
  complexity: TaskComplexity;
  reasoning: string;
  confidence: number; // 0-1
}

/**
 * Retool Agent Router
 * Intelligently routes tasks to the appropriate execution system
 */
export class RetoolAgentRouter {
  /**
   * Determine where a task should be routed
   */
  static route(task: TaskRequest): RoutingDecision {
    // Explicit category routing
    if (task.category) {
      const categoryDecision = this.routeByCategory(task.category);
      if (categoryDecision) {
        return categoryDecision;
      }
    }

    // Analyze task complexity
    const complexity = this.analyzeComplexity(task);

    // Route based on complexity
    if (complexity === TaskComplexity.SIMPLE) {
      return {
        routeTo: 'retool-agent',
        complexity,
        reasoning: 'Simple deterministic task suitable for Retool Agent',
        confidence: 0.9,
      };
    }

    if (complexity === TaskComplexity.MODERATE) {
      // Moderate tasks → Workflow if possible, else Retool Agent
      if (this.isWorkflowSuitable(task)) {
        return {
          routeTo: 'workflow',
          workflowId: this.suggestWorkflow(task),
          complexity,
          reasoning: 'Moderate task suitable for workflow automation',
          confidence: 0.7,
        };
      }

      return {
        routeTo: 'retool-agent',
        complexity,
        reasoning: 'Moderate task suitable for Retool Agent',
        confidence: 0.7,
      };
    }

    // Complex or requires expertise → Deep Agent
    const deepAgentId = this.selectDeepAgent(task);

    return {
      routeTo: 'deep-agent',
      agentId: deepAgentId,
      complexity,
      reasoning: 'Complex task requiring deep reasoning and domain expertise',
      confidence: 0.95,
    };
  }

  /**
   * Route by explicit category
   */
  private static routeByCategory(category: TaskCategory): RoutingDecision | null {
    const simpleCategories = [
      TaskCategory.DATA_ENTRY,
      TaskCategory.NOTIFICATION,
      TaskCategory.FORM_PROCESSING,
      TaskCategory.CRUD_OPERATION,
      TaskCategory.SCHEDULING,
    ];

    if (simpleCategories.includes(category)) {
      return {
        routeTo: 'retool-agent',
        complexity: TaskComplexity.SIMPLE,
        reasoning: `Category ${category} is deterministic and suitable for Retool Agent`,
        confidence: 0.95,
      };
    }

    const complexCategories = [
      TaskCategory.ANALYSIS,
      TaskCategory.PLANNING,
      TaskCategory.RISK_ASSESSMENT,
      TaskCategory.BUDGET_ANALYSIS,
      TaskCategory.STRATEGIC_DECISION,
      TaskCategory.CROSS_DOMAIN,
      TaskCategory.COLLABORATION,
    ];

    if (complexCategories.includes(category)) {
      return {
        routeTo: 'deep-agent',
        complexity: TaskComplexity.REQUIRES_EXPERTISE,
        reasoning: `Category ${category} requires domain expertise and reasoning`,
        confidence: 0.95,
      };
    }

    return null;
  }

  /**
   * Analyze task complexity using heuristics
   */
  private static analyzeComplexity(task: TaskRequest): TaskComplexity {
    // Explicit flags
    if (task.requiresExpertise) {
      return TaskComplexity.REQUIRES_EXPERTISE;
    }

    if (task.requiresMultiStep) {
      return TaskComplexity.COMPLEX;
    }

    // Keyword analysis
    const description = task.description.toLowerCase();

    // Simple task indicators
    const simpleKeywords = [
      'send', 'create', 'update', 'delete', 'notify',
      'schedule', 'record', 'log', 'save', 'fetch',
    ];

    if (simpleKeywords.some(keyword => description.includes(keyword)) &&
        !description.includes('analyze') &&
        !description.includes('assess') &&
        !description.includes('plan')) {
      return TaskComplexity.SIMPLE;
    }

    // Complex task indicators
    const complexKeywords = [
      'analyze', 'assess', 'evaluate', 'plan', 'optimize',
      'recommend', 'predict', 'forecast', 'risk', 'strategic',
      'complex', 'multi-step', 'collaborate', 'coordinate',
    ];

    if (complexKeywords.some(keyword => description.includes(keyword))) {
      return TaskComplexity.COMPLEX;
    }

    // Expertise indicators
    const expertiseKeywords = [
      'budget', 'financial', 'risk', 'schedule', 'timeline',
      'value', 'roi', 'compliance', 'governance',
    ];

    if (expertiseKeywords.some(keyword => description.includes(keyword))) {
      return TaskComplexity.REQUIRES_EXPERTISE;
    }

    // Default to moderate
    return TaskComplexity.MODERATE;
  }

  /**
   * Check if task is suitable for workflow automation
   */
  private static isWorkflowSuitable(task: TaskRequest): boolean {
    const description = task.description.toLowerCase();

    // Workflow indicators
    const workflowKeywords = [
      'batch', 'scheduled', 'recurring', 'etl', 'sync',
      'daily', 'weekly', 'monthly', 'automated',
    ];

    return workflowKeywords.some(keyword => description.includes(keyword));
  }

  /**
   * Suggest workflow ID based on task
   */
  private static suggestWorkflow(task: TaskRequest): string {
    const description = task.description.toLowerCase();

    if (description.includes('notification')) return 'notification-handler';
    if (description.includes('etl') || description.includes('sync')) return 'etl-data-sync';
    if (description.includes('report')) return 'report-generator';
    if (description.includes('backup')) return 'data-backup';

    return 'generic-automation';
  }

  /**
   * Select appropriate Deep Agent based on task
   */
  private static selectDeepAgent(task: TaskRequest): string {
    const description = task.description.toLowerCase();

    // FinOps Agent
    if (description.includes('budget') ||
        description.includes('cost') ||
        description.includes('financial') ||
        description.includes('spend')) {
      return 'deep-finops';
    }

    // Risk Agent
    if (description.includes('risk') ||
        description.includes('issue') ||
        description.includes('problem') ||
        description.includes('threat')) {
      return 'deep-risk';
    }

    // TMO Agent
    if (description.includes('schedule') ||
        description.includes('timeline') ||
        description.includes('delay') ||
        description.includes('deadline')) {
      return 'deep-tmo';
    }

    // VRO Agent
    if (description.includes('value') ||
        description.includes('roi') ||
        description.includes('benefit') ||
        description.includes('outcome')) {
      return 'deep-vro';
    }

    // PMO Agent
    if (description.includes('project') ||
        description.includes('portfolio') ||
        description.includes('delivery') ||
        description.includes('execution')) {
      return 'deep-pmo';
    }

    // OCM Agent
    if (description.includes('change') ||
        description.includes('adoption') ||
        description.includes('stakeholder') ||
        description.includes('communication')) {
      return 'deep-ocm';
    }

    // Default: Planning Agent for general coordination
    return 'deep-planning';
  }

  /**
   * Get routing recommendations for a batch of tasks
   */
  static routeBatch(tasks: TaskRequest[]): Map<string, RoutingDecision> {
    const decisions = new Map<string, RoutingDecision>();

    tasks.forEach((task, index) => {
      const taskId = `task_${index}_${Date.now()}`;
      decisions.set(taskId, this.route(task));
    });

    return decisions;
  }

  /**
   * Get statistics on routing decisions
   */
  static getRoutingStats(decisions: RoutingDecision[]): {
    deepAgents: number;
    retoolAgents: number;
    workflows: number;
    avgConfidence: number;
  } {
    const deepAgents = decisions.filter(d => d.routeTo === 'deep-agent').length;
    const retoolAgents = decisions.filter(d => d.routeTo === 'retool-agent').length;
    const workflows = decisions.filter(d => d.routeTo === 'workflow').length;
    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;

    return {
      deepAgents,
      retoolAgents,
      workflows,
      avgConfidence,
    };
  }
}

/**
 * Helper function for quick routing
 */
export function routeTask(description: string, category?: TaskCategory): RoutingDecision {
  return RetoolAgentRouter.route({ description, category });
}
