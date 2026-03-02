/**
 * DEEP OCM AGENT
 *
 * Enhanced Organizational Change Management agent with Deep Agent capabilities
 * - Plans change impact assessment approaches
 * - Reflects on stakeholder engagement strategies
 * - Multi-step reasoning for complex change scenarios
 */

import { AgentTool } from "../../lib/AgentTool.js";
import { z } from "zod";
import { DeepAgentBase, DeepAgentConfig } from "./DeepAgentBase.js";
import type { IStorage } from "../../storage.js";
import { OCM_DEFAULT_RULES, OCM_DEFAULT_ATTRIBUTES } from "../attributes/OCMAgentAttributes.js";
import type { RuleDefinition } from "../attributes/OCMAgentAttributes.js";

export class DeepOCMAgent extends DeepAgentBase {
  private rules: RuleDefinition[] = OCM_DEFAULT_RULES;

  constructor(storage: IStorage) {
    const config: DeepAgentConfig = {
      agentName: "DeepOCM",
      agentType: "organizational_change_management",
      description: "Enhanced OCM agent with planning and reflection for change management",
      capabilities: [
        "Change impact assessment",
        "Stakeholder mapping and analysis",
        "Adoption metrics tracking",
        "Intervention recommendations",
        "Resistance forecasting",
        "Multi-step change planning",
      ],
      enablePlanning: true,
      enableReflection: true,
      maxPlanSteps: 8,
      reflectionThreshold: 2,
    };

    super(config, storage);
  }

  /**
   * Get system prompt for Deep OCM Agent
   */
  protected getSystemPrompt(): string {
    return `You are an advanced Organizational Change Management Agent (DeepOCM) with deep planning and reflection capabilities.

CAPABILITIES:
${this.config.capabilities.map(c => `- ${c}`).join('\n')}

APPROACH:
1. PLAN: Before assessing change impact, create a multi-step plan
2. EXECUTE: Carry out each step systematically
3. REFLECT: Evaluate outcomes and learn from results

Use your tools to assess change impact, map stakeholders, track adoption metrics, and recommend interventions.
When you identify resistance or adoption issues, recommend collaboration with PMO (project coordination) or Planning (strategic alignment) agents.`;
  }

  protected defineTools(): AgentTool[] {
    return [
      new AgentTool({
        name: "assess_change_impact",
        description: "Analyzes how changes affect teams, processes, and systems across the organization",
        schema: z.object({
          changeId: z.string().describe("Change request or initiative ID"),
          impactAreas: z.array(z.enum(['teams', 'processes', 'systems', 'culture'])).optional()
            .describe("Specific areas to analyze (default all)"),
        }),
        func: async ({ changeId, impactAreas = ['teams', 'processes', 'systems', 'culture'] }) => {
          // Mock change data - in production, would query change management system
          const change = {
            id: changeId,
            name: 'New Project Management System',
            type: 'technology',
            scope: 'enterprise',
          };

          const impacts = {
            teams: impactAreas.includes('teams') ? {
              impactLevel: 'high',
              affectedTeams: ['Project Management', 'Engineering', 'Finance', 'Operations'],
              totalPeople: 450,
              rolesAffected: ['Project Managers', 'Team Leads', 'Developers', 'Finance Analysts'],
              trainingRequired: true,
              estimatedEffort: '40 hours per person',
            } : undefined,

            processes: impactAreas.includes('processes') ? {
              impactLevel: 'high',
              affectedProcesses: [
                'Project planning and tracking',
                'Resource allocation',
                'Budget management',
                'Status reporting',
                'Risk management',
              ],
              processChanges: 12,
              documentationUpdates: 25,
              procedureRevisions: 8,
            } : undefined,

            systems: impactAreas.includes('systems') ? {
              impactLevel: 'medium',
              affectedSystems: ['Legacy PM Tool', 'Jira', 'Excel Templates', 'SharePoint'],
              integrations: ['Slack', 'Microsoft Teams', 'Email', 'Calendar'],
              dataMigration: true,
              systemRetirement: ['Legacy PM Tool'],
              downtime: '4 hours',
            } : undefined,

            culture: impactAreas.includes('culture') ? {
              impactLevel: 'high',
              culturalShifts: [
                'Shift from siloed to collaborative planning',
                'Increased transparency and visibility',
                'Data-driven decision making',
                'Real-time communication',
              ],
              behaviorChanges: [
                'Daily status updates instead of weekly',
                'Self-service reporting',
                'Proactive risk identification',
              ],
              resistanceRisk: 'moderate-high',
            } : undefined,
          };

          // Calculate overall impact score
          const impactScores = {
            teams: 'high',
            processes: 'high',
            systems: 'medium',
            culture: 'high',
          };

          const highImpacts = Object.values(impactScores).filter(s => s === 'high').length;
          const overallImpact = highImpacts >= 3 ? 'high' : highImpacts >= 2 ? 'medium' : 'low';

          // Broadcast change impact as facts
          await this.broadcastFact(
            `change_${changeId}`,
            'change_impact_level',
            overallImpact,
            0.82
          );

          // High impact changes need comprehensive management
          if (overallImpact === 'high') {
            console.log(`[DeepOCM] HIGH IMPACT: Change ${change.name} has high organizational impact`);

            await this.learn(`change_${changeId}_high_impact`, {
              changeName: change.name,
              overallImpact,
              highImpactCount: highImpacts,
              detectedAt: new Date(),
            });

            // TODO: Create 'change-impact' rule in Rulebricks
            // await this.checkRule('change-impact', {
            //   changeId,
            //   changeType: change.type || 'organizational',
            //   impact: overallImpact,
            //   stakeholders: ['leadership', 'managers', 'employees'],
            //   severity: 'high',
            // });

            await this.archiveContext(
              `Change ${change.name} identified with high organizational impact (${highImpacts} high-impact areas) requiring comprehensive change management`,
              {
                changeId,
                overallImpact,
                severity: 'high',
              }
            );
          }

          return {
            changeId: change.id,
            changeName: change.name,
            overallImpact,
            impacts,
            recommendedActions: [
              'Develop comprehensive training program',
              'Create change champions network',
              'Establish executive sponsorship',
              'Plan phased rollout approach',
              'Set up support helpdesk',
            ],
          };
        },
      }),

      new AgentTool({
        name: "map_stakeholders",
        description: "Identifies stakeholders, their influence levels, and potential resistance points",
        schema: z.object({
          changeId: z.string().describe("Change request or initiative ID"),
          includeInfluenceMap: z.boolean().optional().describe("Include influence mapping (default true)"),
        }),
        func: async ({ changeId, includeInfluenceMap = true }) => {
          // Mock stakeholder data - in production, would query stakeholder database
          const stakeholders = [
            {
              id: 'sh1',
              name: 'CEO',
              role: 'Executive Sponsor',
              influence: 'very_high',
              impact: 'low',
              stance: 'supporter',
              engagementLevel: 'high',
            },
            {
              id: 'sh2',
              name: 'VP Engineering',
              role: 'Key Stakeholder',
              influence: 'high',
              impact: 'high',
              stance: 'supporter',
              engagementLevel: 'high',
            },
            {
              id: 'sh3',
              name: 'Project Managers (Group)',
              role: 'Primary Users',
              influence: 'medium',
              impact: 'very_high',
              stance: 'neutral',
              engagementLevel: 'medium',
            },
            {
              id: 'sh4',
              name: 'Finance Director',
              role: 'Key Stakeholder',
              influence: 'high',
              impact: 'medium',
              stance: 'resistor',
              engagementLevel: 'low',
            },
            {
              id: 'sh5',
              name: 'IT Operations',
              role: 'Implementers',
              influence: 'medium',
              impact: 'high',
              stance: 'neutral',
              engagementLevel: 'medium',
            },
            {
              id: 'sh6',
              name: 'Team Leads (Group)',
              role: 'End Users',
              influence: 'low',
              impact: 'very_high',
              stance: 'resistor',
              engagementLevel: 'low',
            },
          ];

          const supporters = stakeholders.filter(s => s.stance === 'supporter').length;
          const neutral = stakeholders.filter(s => s.stance === 'neutral').length;
          const resistors = stakeholders.filter(s => s.stance === 'resistor').length;

          const highInfluenceResistors = stakeholders.filter(s =>
            (s.influence === 'high' || s.influence === 'very_high') && s.stance === 'resistor'
          );

          const influenceMap = includeInfluenceMap ? {
            highInfluence_highImpact: stakeholders.filter(s =>
              (s.influence === 'high' || s.influence === 'very_high') &&
              (s.impact === 'high' || s.impact === 'very_high')
            ).map(s => s.name),
            highInfluence_lowImpact: stakeholders.filter(s =>
              (s.influence === 'high' || s.influence === 'very_high') &&
              (s.impact === 'low' || s.impact === 'medium')
            ).map(s => s.name),
            lowInfluence_highImpact: stakeholders.filter(s =>
              (s.influence === 'low' || s.influence === 'medium') &&
              (s.impact === 'high' || s.impact === 'very_high')
            ).map(s => s.name),
            lowInfluence_lowImpact: stakeholders.filter(s =>
              (s.influence === 'low' || s.influence === 'medium') &&
              (s.impact === 'low' || s.impact === 'medium')
            ).map(s => s.name),
          } : undefined;

          const supportLevelPct = (supporters / stakeholders.length) * 100;
          
          // Broadcast stakeholder analysis facts
          await this.broadcastFact(
            `change_${changeId}`,
            'stakeholder_support_level',
            parseFloat(supportLevelPct.toFixed(1)),
            0.85
          );

          await this.broadcastFact(
            `change_${changeId}`,
            'high_influence_resistors',
            highInfluenceResistors.length,
            0.90
          );

          if (highInfluenceResistors.length > 0) {
            console.log(`[DeepOCM] ⚠️  ${highInfluenceResistors.length} high-influence resistors detected for change ${changeId}`);
          }

          return {
            changeId,
            totalStakeholders: stakeholders.length,
            distribution: { supporters, neutral, resistors },
            supportLevel: supportLevelPct.toFixed(1),
            resistancePoints: highInfluenceResistors.map(s => ({
              name: s.name,
              role: s.role,
              influence: s.influence,
              currentEngagement: s.engagementLevel,
            })),
            criticalStakeholders: stakeholders.filter(s =>
              (s.influence === 'high' || s.influence === 'very_high') ||
              (s.impact === 'high' || s.impact === 'very_high')
            ).map(s => ({
              name: s.name,
              role: s.role,
              stance: s.stance,
              priority: 'high',
            })),
            influenceMap,
            recommendations: [
              'Engage Finance Director (high influence resistor) with 1-on-1 sessions',
              'Build coalition with VP Engineering (supporter)',
              'Address Team Leads concerns through focus groups',
              'Maintain CEO sponsorship visibility',
            ],
          };
        },
      }),

      new AgentTool({
        name: "measure_adoption",
        description: "Tracks user adoption metrics, training completion, and active usage patterns",
        schema: z.object({
          changeId: z.string().describe("Change request or initiative ID"),
          timeframe: z.enum(['week', 'month', 'quarter']).optional().describe("Measurement timeframe (default month)"),
        }),
        func: async ({ changeId, timeframe = 'month' }) => {
          // Mock adoption data - in production, would query adoption tracking system
          const adoptionMetrics = {
            targetUsers: 450,
            activeUsers: 315,
            adoptionRate: 70,
            trainingCompleted: 380,
            trainingCompletionRate: 84.4,
            dailyActiveUsers: 280,
            weeklyActiveUsers: 320,
            featureUsage: {
              projectTracking: 95,
              resourceAllocation: 75,
              statusReporting: 88,
              riskManagement: 62,
              budgetManagement: 58,
            },
            usagePatterns: {
              powerUsers: 85,
              regularUsers: 180,
              occasionalUsers: 50,
              nonUsers: 135,
            },
            supportTickets: {
              total: 142,
              resolved: 128,
              averageResolutionTime: 4.2,
            },
          };

          const adoptionTrend = timeframe === 'week' ? '+3.2%' :
            timeframe === 'month' ? '+12.5%' : '+28.3%';

          const adoptionStatus = adoptionMetrics.adoptionRate >= 80 ? 'excellent' :
            adoptionMetrics.adoptionRate >= 70 ? 'good' :
              adoptionMetrics.adoptionRate >= 60 ? 'moderate' : 'low';

          // Broadcast adoption metrics as facts
          await this.broadcastFact(
            `change_${changeId}`,
            'adoption_rate',
            adoptionMetrics.adoptionRate,
            0.90
          );

          await this.broadcastFact(
            `change_${changeId}`,
            'adoption_status',
            adoptionStatus,
            0.90
          );

          await this.broadcastFact(
            `change_${changeId}`,
            'training_completion_rate',
            adoptionMetrics.trainingCompletionRate,
            0.95
          );

          if (adoptionStatus === 'low' || adoptionStatus === 'moderate') {
            console.log(`[DeepOCM] ⚠️  Adoption ${adoptionStatus} for change ${changeId} (${adoptionMetrics.adoptionRate}%)`);
          }

          return {
            changeId,
            timeframe,
            adoptionRate: adoptionMetrics.adoptionRate,
            adoptionStatus,
            adoptionTrend,
            metrics: adoptionMetrics,
            concerns: [
              adoptionMetrics.featureUsage.budgetManagement < 70 ? 'Low adoption of budget management features' : null,
              adoptionMetrics.featureUsage.riskManagement < 70 ? 'Risk management feature adoption needs attention' : null,
              adoptionMetrics.usagePatterns.nonUsers > 100 ? `${adoptionMetrics.usagePatterns.nonUsers} users have not adopted the system` : null,
            ].filter(Boolean),
            recommendations: [
              'Target non-users with personalized outreach',
              'Promote underutilized features through champions',
              'Create feature-specific training modules',
              'Recognize and reward power users',
            ],
          };
        },
      }),

      new AgentTool({
        name: "recommend_interventions",
        description: "Suggests targeted communications, training, and support actions based on current state",
        schema: z.object({
          changeId: z.string().describe("Change request or initiative ID"),
          urgency: z.enum(['low', 'medium', 'high', 'critical']).optional().describe("Urgency level (default medium)"),
        }),
        func: async ({ changeId, urgency = 'medium' }) => {
          // Analyze current state and generate interventions
          // Mock assessment data
          const currentState = {
            adoptionRate: 70,
            resistanceLevel: 'moderate',
            stakeholderReadiness: 65,
            trainingCompletion: 84,
            supportLevel: 72,
          };

          const interventions = [];

          // Communication interventions
          if (currentState.resistanceLevel === 'high' || currentState.resistanceLevel === 'moderate') {
            interventions.push({
              type: 'communication',
              priority: urgency === 'critical' || urgency === 'high' ? 'high' : 'medium',
              action: 'Town Hall Meeting',
              description: 'Host executive-led town hall to address concerns and share success stories',
              timeline: '1 week',
              targetAudience: 'All impacted users',
            });

            interventions.push({
              type: 'communication',
              priority: 'high',
              action: 'Change Champions Newsletter',
              description: 'Weekly newsletter highlighting benefits, tips, and early wins',
              timeline: 'Ongoing',
              targetAudience: 'All users',
            });
          }

          // Training interventions
          if (currentState.trainingCompletion < 90) {
            interventions.push({
              type: 'training',
              priority: 'high',
              action: 'Mandatory Training Push',
              description: 'Follow up with non-completers, offer flexible session times',
              timeline: '2 weeks',
              targetAudience: `${100 - currentState.trainingCompletion}% who haven't completed training`,
            });

            interventions.push({
              type: 'training',
              priority: 'medium',
              action: 'Role-Specific Workshops',
              description: 'Hands-on workshops tailored to specific job roles',
              timeline: '3 weeks',
              targetAudience: 'Project Managers, Team Leads',
            });
          }

          // Support interventions
          if (currentState.supportLevel < 80) {
            interventions.push({
              type: 'support',
              priority: 'high',
              action: 'Embedded Support Team',
              description: 'Place support staff in high-resistance departments',
              timeline: '4 weeks',
              targetAudience: 'Finance, Operations teams',
            });

            interventions.push({
              type: 'support',
              priority: 'medium',
              action: 'Office Hours',
              description: 'Daily drop-in sessions for questions and troubleshooting',
              timeline: '6 weeks',
              targetAudience: 'All users',
            });
          }

          // Engagement interventions
          if (currentState.adoptionRate < 75) {
            interventions.push({
              type: 'engagement',
              priority: 'high',
              action: 'Early Adopter Recognition',
              description: 'Recognize and reward power users and champions',
              timeline: '1 week',
              targetAudience: 'Power users',
            });

            interventions.push({
              type: 'engagement',
              priority: 'medium',
              action: 'Peer Mentoring Program',
              description: 'Pair resistant users with successful adopters',
              timeline: '4 weeks',
              targetAudience: 'Non-users and occasional users',
            });
          }

          // Executive interventions
          if (urgency === 'critical' || currentState.stakeholderReadiness < 60) {
            interventions.push({
              type: 'executive',
              priority: 'critical',
              action: 'Executive Sponsorship Activation',
              description: 'CEO/VP visible engagement, recorded video messages, site visits',
              timeline: 'Immediate',
              targetAudience: 'All stakeholders',
            });
          }

          // Broadcast intervention metrics
          await this.broadcastFact(
            `change_${changeId}`,
            'intervention_count',
            interventions.length,
            0.90
          );

          await this.broadcastFact(
            `change_${changeId}`,
            'intervention_urgency',
            urgency,
            0.95
          );

          return {
            changeId,
            urgency,
            currentState,
            totalInterventions: interventions.length,
            interventionsByType: {
              communication: interventions.filter(i => i.type === 'communication').length,
              training: interventions.filter(i => i.type === 'training').length,
              support: interventions.filter(i => i.type === 'support').length,
              engagement: interventions.filter(i => i.type === 'engagement').length,
              executive: interventions.filter(i => i.type === 'executive').length,
            },
            interventions,
            estimatedImpact: {
              adoptionIncrease: '+15-20%',
              resistanceReduction: 'High → Moderate',
              timeline: '6-8 weeks',
            },
          };
        },
      }),

      new AgentTool({
        name: "forecast_resistance",
        description: "Predicts change resistance hotspots based on historical patterns and current indicators",
        schema: z.object({
          changeId: z.string().describe("Change request or initiative ID"),
          includeHistorical: z.boolean().optional().describe("Include historical pattern analysis (default true)"),
        }),
        func: async ({ changeId, includeHistorical = true }) => {
          // Mock resistance forecasting data
          const resistanceIndicators = {
            stakeholderEngagement: {
              level: 'medium',
              score: 65,
              trend: 'declining',
            },
            communicationEffectiveness: {
              level: 'medium',
              score: 68,
              trend: 'stable',
            },
            pastChangeFatigue: {
              level: 'high',
              score: 75,
              trend: 'increasing',
            },
            leadershipAlignment: {
              level: 'high',
              score: 85,
              trend: 'stable',
            },
            resourceAvailability: {
              level: 'medium',
              score: 70,
              trend: 'stable',
            },
          };

          const hotspots = [
            {
              area: 'Finance Department',
              resistanceLevel: 'high',
              probability: 85,
              reasons: [
                'History of resistance to technology changes',
                'Low engagement in planning phase',
                'Concerns about data migration',
                'Key influencer is resistant',
              ],
              mitigationActions: [
                'Schedule 1-on-1 with Finance Director',
                'Provide early access and training',
                'Address data concerns with technical demo',
              ],
            },
            {
              area: 'Team Leads (Mid-Management)',
              resistanceLevel: 'moderate-high',
              probability: 70,
              reasons: [
                'Increased workload concerns',
                'Limited involvement in design',
                'Unclear role changes',
                'Past change fatigue',
              ],
              mitigationActions: [
                'Clarify roles and responsibilities',
                'Reduce concurrent change initiatives',
                'Provide adequate training time',
              ],
            },
            {
              area: 'Remote Teams',
              resistanceLevel: 'moderate',
              probability: 60,
              reasons: [
                'Limited access to on-site support',
                'Communication gaps',
                'Different time zones',
              ],
              mitigationActions: [
                'Provide 24/7 virtual support',
                'Create dedicated Slack channel',
                'Schedule multiple time zone training',
              ],
            },
          ];

          const historicalPatterns = includeHistorical ? {
            similarChanges: [
              {
                name: 'CRM Migration 2024',
                resistanceLevel: 'high',
                outcome: 'successful',
                lessonLearned: 'Early engagement with resistors reduced timeline by 4 weeks',
              },
              {
                name: 'Process Automation 2025',
                resistanceLevel: 'moderate',
                outcome: 'partially successful',
                lessonLearned: 'Insufficient training led to low adoption in some teams',
              },
            ],
            organizationalTendencies: [
              'Technical changes face more resistance than process changes',
              'Finance and Legal departments typically resistant',
              'Middle management often feels excluded from change planning',
            ],
          } : undefined;

          const overallResistanceForecast = {
            level: 'moderate-high',
            probability: 72,
            peakResistanceTime: 'Weeks 2-4 post-launch',
            expectedDuration: '8-10 weeks',
          };

          // Broadcast resistance forecast
          await this.broadcastFact(
            `change_${changeId}`,
            'resistance_level',
            overallResistanceForecast.level,
            overallResistanceForecast.probability / 100
          );

          await this.broadcastFact(
            `change_${changeId}`,
            'resistance_hotspot_count',
            hotspots.length,
            0.85
          );

          // Broadcast high-probability hotspots
          const highRiskHotspots = hotspots.filter(h => h.probability > 70);
          await this.broadcastFact(
            `change_${changeId}`,
            'high_risk_resistance_areas',
            highRiskHotspots.map(h => h.area).join(', '),
            0.80
          );

          return {
            changeId,
            overallForecast: overallResistanceForecast,
            indicators: resistanceIndicators,
            hotspots,
            historicalPatterns,
            recommendations: [
              'Proactively engage Finance Department before launch',
              'Address mid-management concerns with clear role definitions',
              'Enhance remote team support infrastructure',
              'Monitor resistance indicators weekly',
              'Prepare rapid response interventions',
            ],
          };
        },
      }),
    ];
  }
}
