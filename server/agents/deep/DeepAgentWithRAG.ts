/**
 * DEEP AGENT WITH RAG
 *
 * Enhanced Deep Agent with:
 * 1. RAG: Learns from historical decisions
 * 2. Predictive: Forecasts future states (not just reactive)
 * 3. Narrative: Generates detailed explanations like executive insights
 *
 * This extends DeepAgentBase with RAG capabilities for learning and prediction.
 */

import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import { AgentRAGService } from "../../lib/AgentRAGService.js";
import type { IStorage } from "../../storage.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

interface PredictiveForecast {
  alertType: string;
  confidence: number;
  reasoning: string;
  predictions: Array<{
    week: number;
    metric: string;
    predictedValue: number | string;
    confidence: number;
  }>;
  criticalMilestone?: {
    week: number;
    event: string;
  };
}

/**
 * Deep Agent with RAG and Predictive capabilities
 */
export abstract class DeepAgentWithRAG extends DeepAgentBase {
  protected ragService: AgentRAGService;

  constructor(config: DeepAgentConfig, storage: IStorage) {
    super(config, storage);
    this.ragService = new AgentRAGService(storage);
  }

  /**
   * Generate PREDICTIVE narrative with learned context
   * This is the main method agents call to create detailed, predictive recommendations
   */
  async generatePredictiveNarrative(projectId: string): Promise<{
    narrative: string;
    forecast: PredictiveForecast;
    decisionId: string;
  }> {
    console.log(`[${this.config.agentName}] Generating predictive narrative for ${projectId}`);

    // 1. Get current project state
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // 2. Create project signature for pattern matching
    const signature = this.createProjectSignature(project);

    // 3. Find similar historical decisions
    const similarDecisions = await this.ragService.findSimilarDecisions(
      signature,
      this.config.agentName,
      10
    );

    // 4. Find matching patterns
    const patterns = await this.ragService.findPatternMatches(signature, 5);

    // 5. Search relevant knowledge
    const knowledge = await this.ragService.searchKnowledge(
      `${project.type || 'project'} ${this.config.agentType} management`,
      undefined,
      3
    );

    // 6. Generate PREDICTIVE forecast
    const forecast = await this.generateForecast(project, similarDecisions, patterns);

    // 7. Generate detailed narrative
    const narrative = await this.constructNarrative(
      project,
      forecast,
      similarDecisions,
      patterns,
      knowledge
    );

    // 8. Store this decision for future learning
    const decisionId = await this.ragService.storeDecision({
      agentName: this.config.agentName,
      decisionType: forecast.alertType,
      projectId: project.id,
      contextSnapshot: signature,
      recommendation: narrative,
      reasoning: forecast.reasoning,
      confidenceScore: forecast.confidence,
      predictedOutcome: forecast.predictions,
    });

    console.log(`[${this.config.agentName}] Narrative generated, stored as decision ${decisionId}`);

    return { narrative, forecast, decisionId };
  }

  /**
   * Create project signature for pattern matching
   * Subclasses can override to add domain-specific metrics
   */
  protected createProjectSignature(project: any): any {
    const budget = parseFloat(project.budget || '0');
    const actualCost = parseFloat(project.actualCost || '0');
    const progress = project.progress || 0;

    return {
      projectType: project.type || 'unknown',
      projectId: project.id,
      projectName: project.name,
      completionPercentage: progress,
      budgetStatus: budget > 0 ? (actualCost / budget) : 0,
      variance: budget > 0 ? ((actualCost - budget) / budget) * 100 : 0,
      cpi: this.calculateCPI(project),
      spi: this.calculateSPI(project),
      phase: this.determineProjectPhase(progress),
      complexity: project.complexity || 'medium',
      teamSize: project.teamSize || 0,
      status: project.status || 'unknown',
    };
  }

  /**
   * Generate multi-week PREDICTIVE forecast
   * This makes agents PREDICTIVE, not reactive
   */
  protected async generateForecast(
    project: any,
    similarDecisions: any[],
    patterns: any[]
  ): Promise<PredictiveForecast> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a predictive forecasting engine for ${this.config.agentName}.

Your role: Generate FORWARD-LOOKING forecasts, not current state descriptions.

CRITICAL: You must predict what WILL HAPPEN in the future, not what IS HAPPENING now.

Based on:
- Current project metrics
- ${similarDecisions.length} similar historical decisions with outcomes
- ${patterns.length} pattern matches from portfolio history

Generate a JSON forecast with week-by-week predictions.`],
      ["human", `Project: {projectName}
Current State: {currentState}

Similar Historical Decisions (with outcomes):
{similarDecisions}

Pattern Matches from Portfolio History:
{patterns}

Generate a predictive forecast for the next 8-12 weeks showing:
1. What will happen each week (not what is happening now)
2. Confidence scores
3. Critical milestones ahead
4. Financial/schedule impact forecasts

Respond with JSON only:
{
  "alertType": "budget_overrun_trajectory" | "schedule_delay_forecast" | "risk_escalation_prediction",
  "confidence": 0.85,
  "reasoning": "Why this forecast is likely based on historical patterns",
  "predictions": [
    {"week": 2, "metric": "CPI", "predictedValue": 0.80, "confidence": 0.82},
    {"week": 4, "metric": "CPI", "predictedValue": 0.79, "confidence": 0.78},
    {"week": 8, "metric": "overrunAmount", "predictedValue": 420000, "confidence": 0.75}
  ],
  "criticalMilestone": {"week": 6, "event": "Budget overrun becomes visible to executives"}
}`],
    ]);

    const chain = prompt.pipe(this.model);
    const response = await chain.invoke({
      projectName: project.name,
      currentState: JSON.stringify(this.createProjectSignature(project), null, 2),
      similarDecisions: JSON.stringify(similarDecisions.slice(0, 5).map(d => ({
        recommendation: d.recommendation,
        outcome: d.outcome,
        similarity: d.similarity,
      })), null, 2),
      patterns: JSON.stringify(patterns.map(p => ({
        patternName: p.patternName,
        typicalOutcome: p.typicalOutcome,
        successRate: p.successRate,
      })), null, 2),
    });

    const forecastText = response.content.toString();
    try {
      const jsonMatch = forecastText.match(/```json\s*([\s\S]*?)\s*```/) || forecastText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : forecastText;
      const parsed = JSON.parse(jsonText);
      return {
        alertType: parsed.alertType || 'unknown',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'Unable to generate reasoning',
        predictions: parsed.predictions || [],
        criticalMilestone: parsed.criticalMilestone,
      };
    } catch (error) {
      console.error(`[${this.config.agentName}] Failed to parse forecast:`, error);
      return {
        alertType: 'analysis_required',
        confidence: 0.5,
        reasoning: 'Unable to generate detailed forecast',
        predictions: [],
      };
    }
  }

  /**
   * Construct detailed narrative (like executive insights)
   * This generates the rich, detailed text that users see
   */
  protected async constructNarrative(
    project: any,
    forecast: PredictiveForecast,
    similarDecisions: any[],
    patterns: any[],
    knowledge: any[]
  ): Promise<string> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are ${this.config.agentName}, an expert narrative generator.

Generate a DETAILED, PREDICTIVE narrative following this structure:

1. OPENING: Quantified current situation with trend analysis
   Example: "Based on current burn rate of $150K/week (accelerated from $120K/week
   over past 3 weeks) with CPI at 0.82 at 42% completion..."

2. PREDICTIVE FORECAST: Week-by-week predictions with confidence
   Example:
   "Week 2: CPI drops to 0.80 (82% confidence)
    Week 4: Overrun reaches $285K (78% confidence)
    Week 6: Budget overrun visible to executives"

3. LEARNED FROM HISTORY: Specific similar projects by name
   Example: "Enterprise Data Platform (2025): Same CPI pattern at 40%, finished 19% over"

4. RECOMMENDED ACTIONS: Proven interventions with success rates
   Example: "[URGENT] Defer Phase 2 scope (saves $280K, based on 3 successful interventions)"

5. KNOWLEDGE REFERENCES: SOPs, PMBOK sections
   Example: "SOP-FIN-042: Budget Recovery Procedures (Section 3.2)"

CRITICAL REQUIREMENTS:
- Start with QUANTIFIED current state (numbers, trends)
- Reference SPECIFIC projects by name
- Provide WEEK-BY-WEEK forecast
- Include SUCCESS RATES from history
- Include FINANCIAL IMPACTS ($XXX,XXX)
- Be PREDICTIVE (future-looking, not current state)`],
      ["human", `Project: {projectName}

Forecast:
{forecast}

Similar Historical Decisions:
{similarDecisions}

Pattern Matches:
{patterns}

Knowledge Base:
{knowledge}

Generate the detailed predictive narrative following the structure above.`],
    ]);

    const chain = prompt.pipe(this.model);
    const response = await chain.invoke({
      projectName: project.name,
      forecast: JSON.stringify(forecast, null, 2),
      similarDecisions: JSON.stringify(similarDecisions.slice(0, 5).map(d => ({
        recommendation: d.recommendation,
        reasoning: d.reasoning,
        outcome: d.outcome,
        similarity: d.similarity,
      })), null, 2),
      patterns: JSON.stringify(patterns.map(p => ({
        patternName: p.patternName,
        typicalOutcome: p.typicalOutcome,
        successInterventions: p.successInterventions,
        successRate: p.successRate,
      })), null, 2),
      knowledge: JSON.stringify(knowledge.map(k => ({
        title: k.title,
        content: k.content.substring(0, 300),
        source: k.source,
      })), null, 2),
    });

    return response.content.toString();
  }

  /**
   * Calculate Cost Performance Index
   */
  protected calculateCPI(project: any): number {
    const ev = parseFloat(project.earnedValue || project.earned_value || '0');
    const ac = parseFloat(project.actualCost || project.actual_cost || '0');
    return ac > 0 ? ev / ac : 1.0;
  }

  /**
   * Calculate Schedule Performance Index
   */
  protected calculateSPI(project: any): number {
    const ev = parseFloat(project.earnedValue || project.earned_value || '0');
    const pv = parseFloat(project.plannedValue || project.planned_value || '0');
    return pv > 0 ? ev / pv : 1.0;
  }

  /**
   * Determine project phase based on progress
   */
  protected determineProjectPhase(progress: number): string {
    if (progress < 25) return 'initiation';
    if (progress < 50) return 'planning';
    if (progress < 75) return 'execution';
    return 'closing';
  }

  /**
   * Record actual outcome for learning loop
   */
  async recordActualOutcome(decisionId: string, outcome: any, accuracyScore?: number): Promise<void> {
    await this.ragService.recordOutcome(decisionId, outcome, accuracyScore);
    console.log(`[${this.config.agentName}] Recorded outcome for decision ${decisionId}`);
  }

  /**
   * Get agent's learning statistics
   */
  async getLearningStats(): Promise<{
    totalDecisions: number;
    measuredOutcomes: number;
    averageAccuracy: number;
  }> {
    return await this.ragService.getAgentAccuracy(this.config.agentName);
  }
}
