/**
 * LLM CALCULATOR API
 *
 * Expose LLM calculation capabilities to:
 * - Agents (calculate attributes with narrative)
 * - Rules engine (evaluate rules with LLM-calculated variables)
 * - Langflow (call from visual workflows)
 * - Frontend (display calculations with explanations)
 */

import express from 'express';
import { getLLMCalculator } from '../lib/LLMCalculator.js';
import { getRulePromptGenerator } from '../lib/RulePromptGenerator.js';

const router = express.Router();
const llmCalculator = getLLMCalculator();
const rulePromptGen = getRulePromptGenerator();

/**
 * POST /api/llm-calculator/calculate
 * Calculate any attribute using LLM
 */
router.post('/calculate', async (req, res) => {
  try {
    const { attributeName, attributeDescription, inputData, context, previousValue } = req.body;

    if (!attributeName || !inputData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: attributeName, inputData'
      });
    }

    const result = await llmCalculator.calculate({
      attributeName,
      attributeDescription: attributeDescription || `Calculate ${attributeName}`,
      inputData,
      context,
      previousValue
    });

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Calculate error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/wip-score
 * Calculate WIP (Work In Progress) score
 */
router.post('/wip-score', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.activeTasks || !projectData.teamCapacity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: activeTasks, teamCapacity'
      });
    }

    const result = await llmCalculator.calculateWIP(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] WIP calculation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/budget-variance
 * Calculate budget variance with narrative
 */
router.post('/budget-variance', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.budget || !projectData.actualCost) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: budget, actualCost'
      });
    }

    const result = await llmCalculator.calculateBudgetVariance(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Budget variance error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/schedule-delay
 * Calculate schedule delay with root cause
 */
router.post('/schedule-delay', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.plannedEndDate || !projectData.progress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: plannedEndDate, progress'
      });
    }

    const result = await llmCalculator.calculateScheduleDelay(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Schedule delay error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/project-health
 * Calculate holistic project health score
 */
router.post('/project-health', async (req, res) => {
  try {
    const projectData = req.body;

    const result = await llmCalculator.calculateProjectHealth(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Project health error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/resource-utilization
 * Calculate resource utilization
 */
router.post('/resource-utilization', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.allocatedHours || !projectData.teamSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: allocatedHours, teamSize'
      });
    }

    const result = await llmCalculator.calculateResourceUtilization(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Resource utilization error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/dependency-health
 * Calculate dependency health score
 */
router.post('/dependency-health', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.totalDependencies) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: totalDependencies'
      });
    }

    const result = await llmCalculator.calculateDependencyHealth(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Dependency health error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/value-realization
 * Calculate value realization (for VRO)
 */
router.post('/value-realization', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.expectedValue || !projectData.realizedValue) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: expectedValue, realizedValue'
      });
    }

    const result = await llmCalculator.calculateValueRealization(projectData);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Value realization error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/batch
 * Calculate multiple attributes in one call
 */
router.post('/batch', async (req, res) => {
  try {
    const { calculations } = req.body;

    if (!Array.isArray(calculations) || calculations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: calculations (array)'
      });
    }

    const results = await llmCalculator.calculateBatch(calculations);

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Batch calculation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/llm-calculator/evaluate-rule
 * Evaluate rule with LLM-calculated variables
 */
router.post('/evaluate-rule', async (req, res) => {
  try {
    const { ruleId, ruleName, agentId, entity, inputData, variables, condition } = req.body;

    if (!ruleId || !agentId || !entity || !inputData || !variables || !condition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ruleId, agentId, entity, inputData, variables, condition'
      });
    }

    const result = await rulePromptGen.evaluateRule(
      {
        ruleId,
        ruleName: ruleName || ruleId,
        agentId,
        entity,
        inputData,
        variables
      },
      condition
    );

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[LLMCalculator] Rule evaluation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
