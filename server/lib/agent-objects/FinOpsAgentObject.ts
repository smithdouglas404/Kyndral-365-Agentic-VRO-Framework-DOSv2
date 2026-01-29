/**
 * FINOPS AGENT OBJECT
 *
 * FinOps agent as an object with 35+ callable attributes
 * Budget management, cost optimization, financial forecasting
 */

import { BaseAgentObject, type AgentObjectConfig } from './BaseAgentObject.js';

export class FinOpsAgentObject extends BaseAgentObject {
  constructor(entityId: string, config: Omit<AgentObjectConfig, 'agentType' | 'entityId'>) {
    super({
      ...config,
      agentType: 'finops',
      entityId
    });
  }

  // Convenience methods for frequently accessed attributes

  async getBudgetVariance() {
    const result = await this.getAttribute('budgetVariance');
    return result.value;
  }

  async getCostPerFeature() {
    const result = await this.getAttribute('costPerFeature');
    return result.value;
  }

  async getBurnRate() {
    const result = await this.getAttribute('burnRate');
    return result.value;
  }

  async getForecastAccuracy() {
    const result = await this.getAttribute('forecastAccuracy');
    return result.value;
  }

  async getCostOptimizationOpportunities() {
    const result = await this.getAttribute('costOptimizationOpportunities');
    return result.value;
  }

  async getResourceUtilization() {
    const result = await this.getAttribute('resourceUtilization');
    return result.value;
  }

  async getROI() {
    const result = await this.getAttribute('roi');
    return result.value;
  }

  /**
   * Get comprehensive financial report
   */
  async getFinancialReport() {
    const attributes = await this.getAttributes([
      'budgetVariance',
      'costPerFeature',
      'burnRate',
      'forecastAccuracy',
      'costOptimizationOpportunities',
      'resourceUtilization',
      'roi'
    ]);

    return {
      entityId: this.entityId,
      timestamp: new Date(),
      budget: {
        variance: attributes.budgetVariance?.value || 0,
        burnRate: attributes.burnRate?.value || 0,
        roi: attributes.roi?.value || 0
      },
      costs: {
        perFeature: attributes.costPerFeature?.value || 0,
        utilization: attributes.resourceUtilization?.value || 0
      },
      forecast: {
        accuracy: attributes.forecastAccuracy?.value || 0,
        optimizations: attributes.costOptimizationOpportunities?.value || []
      },
      narratives: Object.entries(attributes).reduce((acc, [key, value]) => {
        if (value.narrative) {
          acc[key] = value.narrative;
        }
        return acc;
      }, {} as Record<string, string>)
    };
  }

  /**
   * Check if project is over budget
   */
  async isOverBudget(): Promise<boolean> {
    const variance = await this.getBudgetVariance();
    return variance > 0;
  }

  /**
   * Get budget health status
   */
  async getBudgetHealthStatus(): Promise<'healthy' | 'warning' | 'critical'> {
    const variance = await this.getBudgetVariance();
    if (variance < 0.05) return 'healthy';
    if (variance < 0.15) return 'warning';
    return 'critical';
  }
}
