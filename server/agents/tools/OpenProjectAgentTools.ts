/**
 * OpenProject Agent Tools
 *
 * Mastra-compatible tools that give all 8 deep agents the ability to
 * read from and write to OpenProject as their PPM backbone.
 *
 * Each tool:
 * 1. Calls the OpenProject API via the headless client
 * 2. Auto-emits a UI packet to the agent's canvas
 * 3. Sets sync_source = 'nextera-agent' to prevent webhook loops
 *
 * Tools are organized by agent domain but available to all agents.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getOpenProjectClient } from '../../services/openproject/OpenProjectClient.js';
import { emitUIPacket } from '../../services/AgentUIEmitter.js';
import type { UIBlock } from '../../../shared/agentUIPacket.js';

// ============================================================================
// PMO Agent Tools
// ============================================================================

/** Get project health from OpenProject — schedule, budget, progress data */
export const opGetProjectHealthTool = createTool({
  id: 'op-get-project-health',
  description: 'Get project health metrics from OpenProject PPM: work package status distribution, progress, schedule data, and resource allocation',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
  }),
  outputSchema: z.object({
    projectName: z.string(),
    totalWorkPackages: z.number(),
    statusDistribution: z.record(z.number()),
    overallProgress: z.number(),
    overdueCount: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const projectId = input.projectId || input.context?.projectId;

    const project = await client.getProject(projectId);
    const workPackages = await client.listWorkPackages({ projectId });

    // Calculate status distribution
    const statusDist: Record<string, number> = {};
    let totalProgress = 0;
    let overdueCount = 0;
    const now = new Date();

    for (const wp of workPackages) {
      const status = wp._links?.status?.title || 'Unknown';
      statusDist[status] = (statusDist[status] || 0) + 1;
      totalProgress += wp.percentageDone || 0;

      if (wp.dueDate && new Date(wp.dueDate) < now && !wp._links?.status?.title?.includes('Closed')) {
        overdueCount++;
      }
    }

    const overallProgress = workPackages.length > 0
      ? Math.round(totalProgress / workPackages.length)
      : 0;

    return {
      projectName: project.name,
      totalWorkPackages: workPackages.length,
      statusDistribution: statusDist,
      overallProgress,
      overdueCount,
      analysis: `Project ${project.name}: ${workPackages.length} work packages, ${overallProgress}% average progress, ${overdueCount} overdue items.`,
    };
  },
});

/** Get Gantt/schedule data from OpenProject */
export const opGetGanttDataTool = createTool({
  id: 'op-get-gantt-data',
  description: 'Get full Gantt chart data from OpenProject: work packages with dates, predecessors, successors, and milestones for schedule analysis',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
  }),
  outputSchema: z.object({
    workPackages: z.array(z.object({
      id: z.number(),
      subject: z.string(),
      startDate: z.string().nullable(),
      dueDate: z.string().nullable(),
      progress: z.number(),
      type: z.string(),
      status: z.string(),
    })),
    relations: z.array(z.object({
      fromId: z.number(),
      toId: z.number(),
      type: z.string(),
      delay: z.number().optional(),
    })),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const projectId = input.projectId || input.context?.projectId;

    const { workPackages, relations, versions } = await client.getGanttData(projectId);

    const wpData = workPackages.map(wp => ({
      id: wp.id,
      subject: wp.subject,
      startDate: wp.startDate || null,
      dueDate: wp.dueDate || null,
      progress: wp.percentageDone || 0,
      type: wp._links?.type?.title || 'Task',
      status: wp._links?.status?.title || 'New',
    }));

    const relData = relations.map(r => ({
      fromId: parseInt(r._links?.from?.href?.split('/').pop() || '0'),
      toId: parseInt(r._links?.to?.href?.split('/').pop() || '0'),
      type: r.type,
      delay: r.delay,
    }));

    return {
      workPackages: wpData,
      relations: relData,
      analysis: `Gantt: ${wpData.length} items, ${relData.length} dependencies, ${versions.length} versions/milestones.`,
    };
  },
});

// ============================================================================
// Work Package CRUD (all agents)
// ============================================================================

/** Create a work package in OpenProject */
export const opCreateWorkPackageTool = createTool({
  id: 'op-create-work-package',
  description: 'Create a new work package in OpenProject PPM. Used by agents to create tasks, features, risks, alerts, or any SAFe work item.',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
    subject: z.string().describe('Work package title'),
    description: z.string().optional().describe('Description'),
    typeName: z.string().optional().describe('WP type: Task, Feature, User Story, Epic, Risk, Agent Alert'),
    priorityName: z.string().optional().describe('Priority: Low, Normal, High, Urgent, Immediate'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    dueDate: z.string().optional().describe('Due date (YYYY-MM-DD)'),
    percentageDone: z.number().optional().describe('Progress 0-100'),
  }),
  outputSchema: z.object({
    id: z.number(),
    subject: z.string(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const projectId = input.projectId || input.context?.projectId;

    const payload: any = {
      subject: input.subject,
      description: input.description ? { raw: input.description } : undefined,
      startDate: input.startDate,
      dueDate: input.dueDate,
      percentageDone: input.percentageDone,
      _links: {} as any,
    };

    // Set sync_source to prevent webhook loops
    // Note: custom field names depend on OP configuration
    payload.customField_sync_source = 'nextera-agent';

    const wp = await client.createWorkPackage(projectId, payload);

    return {
      id: wp.id,
      subject: wp.subject,
      analysis: `Created work package #${wp.id}: "${wp.subject}" in project ${projectId}`,
    };
  },
});

/** Update a work package */
export const opUpdateWorkPackageTool = createTool({
  id: 'op-update-work-package',
  description: 'Update an existing work package in OpenProject. Agents use this to change status, progress, dates, or add notes.',
  inputSchema: z.object({
    workPackageId: z.number().describe('Work package ID'),
    subject: z.string().optional(),
    percentageDone: z.number().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    comment: z.string().optional().describe('Add a comment/note to the work package'),
  }),
  outputSchema: z.object({
    id: z.number(),
    subject: z.string(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const wpId = input.workPackageId || input.context?.workPackageId;

    const updates: any = {};
    if (input.subject) updates.subject = input.subject;
    if (input.percentageDone !== undefined) updates.percentageDone = input.percentageDone;
    if (input.startDate) updates.startDate = input.startDate;
    if (input.dueDate) updates.dueDate = input.dueDate;

    const wp = await client.updateWorkPackage(wpId, updates);

    // Add comment if provided
    if (input.comment) {
      await client.addWorkPackageComment(wpId, input.comment);
    }

    return {
      id: wp.id,
      subject: wp.subject,
      analysis: `Updated WP #${wp.id}: "${wp.subject}"`,
    };
  },
});

// ============================================================================
// FinOps Agent Tools
// ============================================================================

/** Get budget data from OpenProject */
export const opGetBudgetTool = createTool({
  id: 'op-get-budget',
  description: 'Get budget data from OpenProject: labor budgets, material budgets, overall costs for a project',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
  }),
  outputSchema: z.object({
    budgets: z.array(z.object({
      id: z.number(),
      subject: z.string(),
      laborBudget: z.string().optional(),
      materialBudget: z.string().optional(),
      overallCosts: z.string().optional(),
    })),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const projectId = input.projectId || input.context?.projectId;

    const budgets = await client.listBudgets(projectId);

    return {
      budgets: budgets.map(b => ({
        id: b.id,
        subject: b.subject,
        laborBudget: b.laborBudget,
        materialBudget: b.materialBudget,
        overallCosts: b.overallCosts,
      })),
      analysis: `Found ${budgets.length} budgets for project ${projectId}.`,
    };
  },
});

/** Log time entry against a work package */
export const opLogTimeTool = createTool({
  id: 'op-log-time',
  description: 'Log time spent against a work package in OpenProject. Used for earned value tracking.',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
    workPackageId: z.number().describe('Work package ID'),
    hours: z.number().describe('Hours spent'),
    comment: z.string().optional().describe('Time entry comment'),
    date: z.string().optional().describe('Date spent (YYYY-MM-DD, defaults to today)'),
  }),
  outputSchema: z.object({
    id: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();

    const entry = await client.createTimeEntry({
      hours: `PT${input.hours}H`,
      comment: input.comment ? { raw: input.comment } : undefined,
      spentOn: input.date || new Date().toISOString().split('T')[0],
      _links: {
        project: { href: `/api/v3/projects/${input.projectId}` },
        workPackage: { href: `/api/v3/work_packages/${input.workPackageId}` },
      },
    });

    return {
      id: entry.id,
      analysis: `Logged ${input.hours}h against WP #${input.workPackageId}`,
    };
  },
});

// ============================================================================
// Risk Agent Tools
// ============================================================================

/** Create a risk work package with custom fields */
export const opCreateRiskTool = createTool({
  id: 'op-create-risk',
  description: 'Create a Risk work package in OpenProject with probability, impact, and mitigation plan',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
    title: z.string().describe('Risk title'),
    description: z.string().describe('Risk description'),
    probability: z.number().min(0).max(1).describe('Risk probability 0-1'),
    impact: z.number().min(0).max(1).describe('Risk impact 0-1'),
    mitigation: z.string().optional().describe('Mitigation plan'),
    relatedWorkPackageId: z.number().optional().describe('WP this risk affects'),
  }),
  outputSchema: z.object({
    id: z.number(),
    riskScore: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();

    const riskScore = Math.round(input.probability * input.impact * 100);
    const description = [
      input.description,
      '',
      `**Probability:** ${(input.probability * 100).toFixed(0)}%`,
      `**Impact:** ${(input.impact * 100).toFixed(0)}%`,
      `**Risk Score:** ${riskScore}`,
      input.mitigation ? `\n**Mitigation:** ${input.mitigation}` : '',
    ].join('\n');

    const wp = await client.createWorkPackage(input.projectId, {
      subject: `[RISK] ${input.title}`,
      description: { raw: description },
      customField_sync_source: 'nextera-agent',
    });

    // Link to affected work package if specified
    if (input.relatedWorkPackageId) {
      await client.createRelation({
        type: 'relates',
        description: 'Risk affects this work package',
        _links: {
          from: { href: `/api/v3/work_packages/${wp.id}` },
          to: { href: `/api/v3/work_packages/${input.relatedWorkPackageId}` },
        },
      });
    }

    return {
      id: wp.id,
      riskScore,
      analysis: `Created risk #${wp.id}: "${input.title}" (score: ${riskScore}) in project ${input.projectId}`,
    };
  },
});

// ============================================================================
// TMO / Planning Agent Tools
// ============================================================================

/** Create a version (PI/Sprint/Release) */
export const opCreateVersionTool = createTool({
  id: 'op-create-version',
  description: 'Create a new version/release in OpenProject (maps to SAFe PI or Sprint)',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
    name: z.string().describe('Version name (e.g. "PI 2026-Q2" or "Sprint 24")'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
    description: z.string().optional(),
  }),
  outputSchema: z.object({
    id: z.number(),
    name: z.string(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();

    const version = await client.createVersion(input.projectId, {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      description: input.description ? { raw: input.description } : undefined,
      status: 'open',
    });

    return {
      id: version.id,
      name: version.name,
      analysis: `Created version "${version.name}" (ID: ${version.id}) in project ${input.projectId}`,
    };
  },
});

/** Get resource capacity data */
export const opGetResourceCapacityTool = createTool({
  id: 'op-get-resource-capacity',
  description: 'Get resource allocation and capacity data from OpenProject: team memberships and time entries',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
  }),
  outputSchema: z.object({
    memberCount: z.number(),
    totalHoursLogged: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const projectId = input.projectId || input.context?.projectId;

    const { memberships, timeEntries } = await client.getResourceData(projectId);

    let totalHours = 0;
    for (const entry of timeEntries) {
      const match = entry.hours.match(/PT(\d+)H/);
      if (match) totalHours += parseInt(match[1]);
    }

    return {
      memberCount: memberships.length,
      totalHoursLogged: totalHours,
      analysis: `Project ${projectId}: ${memberships.length} team members, ${totalHours}h total time logged across ${timeEntries.length} entries.`,
    };
  },
});

/** Add dependency/relation between work packages */
export const opAddRelationTool = createTool({
  id: 'op-add-relation',
  description: 'Create a dependency relation between two work packages in OpenProject (follows, precedes, blocks, relates)',
  inputSchema: z.object({
    fromWorkPackageId: z.number().describe('Source work package ID'),
    toWorkPackageId: z.number().describe('Target work package ID'),
    type: z.enum(['follows', 'precedes', 'blocks', 'relates', 'requires']).describe('Relation type'),
    delay: z.number().optional().describe('Lag days'),
    description: z.string().optional(),
  }),
  outputSchema: z.object({
    id: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();

    const relation = await client.createRelation({
      type: input.type,
      delay: input.delay,
      description: input.description,
      _links: {
        from: { href: `/api/v3/work_packages/${input.fromWorkPackageId}` },
        to: { href: `/api/v3/work_packages/${input.toWorkPackageId}` },
      },
    });

    return {
      id: relation.id,
      analysis: `Created ${input.type} relation: WP #${input.fromWorkPackageId} → WP #${input.toWorkPackageId}`,
    };
  },
});

// ============================================================================
// Governance Agent Tools
// ============================================================================

/** Create a governance gate review meeting */
export const opCreateMeetingTool = createTool({
  id: 'op-create-meeting',
  description: 'Schedule a governance gate review meeting in OpenProject with agenda and attendees',
  inputSchema: z.object({
    projectId: z.string().describe('OpenProject project identifier'),
    title: z.string().describe('Meeting title'),
    startTime: z.string().describe('ISO datetime for meeting start'),
    durationMinutes: z.number().describe('Duration in minutes'),
    location: z.string().optional(),
  }),
  outputSchema: z.object({
    id: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();

    const meeting = await client.createMeeting({
      title: input.title,
      startTime: input.startTime,
      duration: input.durationMinutes,
      location: input.location,
      _links: {
        project: { href: `/api/v3/projects/${input.projectId}` },
      },
    });

    return {
      id: meeting.id,
      analysis: `Scheduled meeting "${input.title}" for ${input.startTime} (${input.durationMinutes} min)`,
    };
  },
});

// ============================================================================
// Notification Tool (all agents)
// ============================================================================

/** Send agent notification via OpenProject work package + comment */
export const opSendNotificationTool = createTool({
  id: 'op-send-notification',
  description: 'Create an Agent Alert work package in OpenProject and optionally notify watchers. Used for escalations, risk alerts, and recommendations.',
  inputSchema: z.object({
    title: z.string().describe('Alert title'),
    body: z.string().describe('Alert description'),
    severity: z.enum(['notification', 'warning', 'alarm', 'critical']).describe('Alert severity'),
    projectId: z.string().optional().describe('Related project (defaults to agent-alerts project)'),
    relatedWorkPackageId: z.number().optional().describe('WP this alert relates to'),
  }),
  outputSchema: z.object({
    id: z.number(),
    analysis: z.string(),
  }),
  execute: async (input: any) => {
    const client = getOpenProjectClient();
    const projectId = input.projectId || 'nextera-agent-alerts';

    const wp = await client.createWorkPackage(projectId, {
      subject: `[${input.severity.toUpperCase()}] ${input.title}`,
      description: { raw: input.body },
      customField_sync_source: 'nextera-agent',
      customField_alert_severity: input.severity,
    });

    // Add comment to related WP if specified
    if (input.relatedWorkPackageId) {
      await client.addWorkPackageComment(
        input.relatedWorkPackageId,
        `**Agent Alert (${input.severity}):** ${input.title}\n\n${input.body}`
      );
    }

    return {
      id: wp.id,
      analysis: `Created ${input.severity} alert #${wp.id}: "${input.title}"`,
    };
  },
});

// ============================================================================
// Export all tools
// ============================================================================

export const openProjectAgentTools = [
  opGetProjectHealthTool,
  opGetGanttDataTool,
  opCreateWorkPackageTool,
  opUpdateWorkPackageTool,
  opGetBudgetTool,
  opLogTimeTool,
  opCreateRiskTool,
  opCreateVersionTool,
  opGetResourceCapacityTool,
  opAddRelationTool,
  opCreateMeetingTool,
  opSendNotificationTool,
];

export default openProjectAgentTools;
