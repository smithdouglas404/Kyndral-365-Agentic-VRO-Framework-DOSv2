/**
 * PMO AGENT OBJECT
 *
 * PMO agent as an object with 35+ callable attributes
 * Portfolio management, project health, delivery metrics, governance
 */

import { BaseAgentObject, type AgentObjectConfig } from './BaseAgentObject.js';

export class PMOAgentObject extends BaseAgentObject {
  constructor(entityId: string, config: Omit<AgentObjectConfig, 'agentType' | 'entityId'>) {
    super({
      ...config,
      agentType: 'pmo',
      entityId
    });
  }

  // Convenience methods for frequently accessed attributes

  async getProjectHealthScore() {
    const result = await this.getAttribute('projectHealthScore');
    return result.value;
  }

  async getOnTimeDeliveryRate() {
    const result = await this.getAttribute('onTimeDeliveryRate');
    return result.value;
  }

  async getTeamVelocityTrend() {
    const result = await this.getAttribute('teamVelocityTrend');
    return result.value;
  }

  async getQualityMetrics() {
    const result = await this.getAttribute('qualityMetrics');
    return result.value;
  }

  async getDeliveryPredictability() {
    const result = await this.getAttribute('deliveryPredictability');
    return result.value;
  }

  async getTeamMoraleScore() {
    const result = await this.getAttribute('teamMoraleScore');
    return result.value;
  }

  async getScopeCreep() {
    const result = await this.getAttribute('scopeCreep');
    return result.value;
  }

  /**
   * Get comprehensive project health report
   */
  async getHealthReport() {
    const attributes = await this.getAttributes([
      'projectHealthScore',
      'onTimeDeliveryRate',
      'teamVelocityTrend',
      'qualityMetrics',
      'deliveryPredictability',
      'teamMoraleScore',
      'scopeCreep'
    ]);

    return {
      entityId: this.entityId,
      timestamp: new Date(),
      health: {
        overall: attributes.projectHealthScore?.value || 0,
        delivery: attributes.onTimeDeliveryRate?.value || 0,
        quality: attributes.qualityMetrics?.value || 0,
        morale: attributes.teamMoraleScore?.value || 0
      },
      trends: {
        velocity: attributes.teamVelocityTrend?.value || 0,
        predictability: attributes.deliveryPredictability?.value || 0,
        scope: attributes.scopeCreep?.value || 0
      },
      narratives: Object.entries(attributes).reduce((acc, [key, value]) => {
        if (value.narrative) {
          acc[key] = value.narrative;
        }
        return acc;
      }, {} as Record<string, string>)
    };
  }
}
