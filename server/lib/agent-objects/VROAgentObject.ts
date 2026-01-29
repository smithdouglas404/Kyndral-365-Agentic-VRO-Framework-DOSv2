/**
 * VRO AGENT OBJECT
 *
 * Value Realization Office agent as an object with 35+ callable attributes
 * Value tracking, benefits realization, outcome measurement
 */

import { BaseAgentObject, type AgentObjectConfig } from './BaseAgentObject.js';

export class VROAgentObject extends BaseAgentObject {
  constructor(entityId: string, config: Omit<AgentObjectConfig, 'agentType' | 'entityId'>) {
    super({
      ...config,
      agentType: 'vro',
      entityId
    });
  }

  // Convenience methods for frequently accessed attributes

  async getValueRealizationScore() {
    const result = await this.getAttribute('valueRealizationScore');
    return result.value;
  }

  async getBenefitsRealizationRate() {
    const result = await this.getAttribute('benefitsRealizationRate');
    return result.value;
  }

  async getOutcomeAchievementRate() {
    const result = await this.getAttribute('outcomeAchievementRate');
    return result.value;
  }

  async getStakeholderSatisfaction() {
    const result = await this.getAttribute('stakeholderSatisfaction');
    return result.value;
  }

  async getBusinessImpactScore() {
    const result = await this.getAttribute('businessImpactScore');
    return result.value;
  }

  async getTimeToValue() {
    const result = await this.getAttribute('timeToValue');
    return result.value;
  }

  async getAdoptionRate() {
    const result = await this.getAttribute('adoptionRate');
    return result.value;
  }

  /**
   * Get comprehensive value report
   */
  async getValueReport() {
    const attributes = await this.getAttributes([
      'valueRealizationScore',
      'benefitsRealizationRate',
      'outcomeAchievementRate',
      'stakeholderSatisfaction',
      'businessImpactScore',
      'timeToValue',
      'adoptionRate'
    ]);

    return {
      entityId: this.entityId,
      timestamp: new Date(),
      value: {
        overall: attributes.valueRealizationScore?.value || 0,
        benefits: attributes.benefitsRealizationRate?.value || 0,
        outcomes: attributes.outcomeAchievementRate?.value || 0,
        impact: attributes.businessImpactScore?.value || 0
      },
      delivery: {
        timeToValue: attributes.timeToValue?.value || 0,
        adoption: attributes.adoptionRate?.value || 0
      },
      stakeholders: {
        satisfaction: attributes.stakeholderSatisfaction?.value || 0
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
   * Check if value is at risk
   */
  async isValueAtRisk(): Promise<boolean> {
    const score = await this.getValueRealizationScore();
    return score < 60; // Below 60 is considered at risk
  }

  /**
   * Get value health status
   */
  async getValueHealthStatus(): Promise<'healthy' | 'warning' | 'critical'> {
    const score = await this.getValueRealizationScore();
    if (score >= 75) return 'healthy';
    if (score >= 60) return 'warning';
    return 'critical';
  }
}
