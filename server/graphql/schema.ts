import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
} from 'graphql';
import type { OBDAService } from '../obda/index.js';

/**
 * Comprehensive GraphQL Schema for Ontology-Based Data Access
 * Provides unified query interface across all project management methodologies
 *
 * Includes ALL project attributes:
 * - Projects, Epics, Features, Stories, Tasks
 * - Resources, Dependencies, Milestones
 * - Risks, Issues, Interventions
 * - Teams, Sprints, Program Increments
 * - Financial metrics, KPIs, OKRs
 */

// ============================================================================
// RESOURCE & ALLOCATION TYPES
// ============================================================================

// Resource Type (People, Equipment, Budget)
const ResourceType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Resource',
  description: 'A resource (person, equipment, or budget allocation)',
  fields: () => ({
    id: { type: GraphQLString, description: 'Resource ID' },
    uri: { type: GraphQLString, description: 'Ontology URI' },
    name: { type: GraphQLString, description: 'Resource name' },
    type: { type: GraphQLString, description: 'Resource type (person, equipment, budget)' },
    role: { type: GraphQLString, description: 'Role or skill' },
    availability: { type: GraphQLFloat, description: 'Availability percentage (0-1)' },
    cost: { type: GraphQLFloat, description: 'Cost per hour/unit' },
    skills: { type: new GraphQLList(GraphQLString), description: 'Skills or capabilities' },
    teamId: { type: GraphQLString, description: 'Team ID' },
    source: { type: GraphQLString, description: 'Data source' },
    assignments: {
      type: new GraphQLList(ResourceAssignmentType),
      description: 'Task assignments for this resource',
      resolve: async (resource, args, context) => {
        // Query resource assignments
        const result = await context.storage.getResourceAssignments?.() || [];
        return result.filter((a: any) => a.resourceId === resource.id);
      },
    },
  }),
});

// Resource Assignment Type
const ResourceAssignmentType = new GraphQLObjectType({
  name: 'ResourceAssignment',
  description: 'Assignment of a resource to a task',
  fields: {
    id: { type: GraphQLString },
    resourceId: { type: GraphQLString, description: 'Resource ID' },
    taskId: { type: GraphQLString, description: 'Task ID' },
    allocation: { type: GraphQLFloat, description: 'Allocation percentage (0-1)' },
    startDate: { type: GraphQLString, description: 'Assignment start date' },
    endDate: { type: GraphQLString, description: 'Assignment end date' },
    hoursAllocated: { type: GraphQLFloat, description: 'Hours allocated' },
    hoursActual: { type: GraphQLFloat, description: 'Actual hours worked' },
  },
});

// ============================================================================
// DEPENDENCY TYPES
// ============================================================================

// Dependency Type
const DependencyType = new GraphQLObjectType({
  name: 'Dependency',
  description: 'A dependency between two entities (tasks, features, epics)',
  fields: {
    id: { type: GraphQLString, description: 'Dependency ID' },
    uri: { type: GraphQLString, description: 'Ontology URI' },
    type: { type: GraphQLString, description: 'Dependency type (FS, SS, FF, SF)' },
    predecessorId: { type: GraphQLString, description: 'Predecessor entity ID' },
    successorId: { type: GraphQLString, description: 'Successor entity ID' },
    predecessorType: { type: GraphQLString, description: 'Predecessor entity type' },
    successorType: { type: GraphQLString, description: 'Successor entity type' },
    lag: { type: GraphQLInt, description: 'Lag time in days' },
    status: { type: GraphQLString, description: 'Dependency status' },
    source: { type: GraphQLString, description: 'Data source' },
  },
});

// ============================================================================
// MILESTONE TYPES
// ============================================================================

// Milestone Type
const MilestoneType = new GraphQLObjectType({
  name: 'Milestone',
  description: 'A project milestone or key event',
  fields: {
    id: { type: GraphQLString, description: 'Milestone ID' },
    uri: { type: GraphQLString, description: 'Ontology URI' },
    name: { type: GraphQLString, description: 'Milestone name' },
    description: { type: GraphQLString, description: 'Milestone description' },
    type: { type: GraphQLString, description: 'Milestone type (PI, release, review)' },
    targetDate: { type: GraphQLString, description: 'Target completion date' },
    actualDate: { type: GraphQLString, description: 'Actual completion date' },
    status: { type: GraphQLString, description: 'Milestone status' },
    projectId: { type: GraphQLString, description: 'Parent project ID' },
    epicId: { type: GraphQLString, description: 'Parent epic ID' },
    completionPercentage: { type: GraphQLFloat, description: 'Completion percentage' },
    source: { type: GraphQLString, description: 'Data source' },
  },
});

// ============================================================================
// INTERVENTION & AGENT TYPES
// ============================================================================

// Intervention Type (from LangChain Agents)
const InterventionType = new GraphQLObjectType({
  name: 'Intervention',
  description: 'An agent-created intervention or recommendation',
  fields: {
    id: { type: GraphQLString, description: 'Intervention ID' },
    agentId: { type: GraphQLString, description: 'Agent that created intervention' },
    agentName: { type: GraphQLString, description: 'Agent name' },
    projectId: { type: GraphQLString, description: 'Target project ID' },
    entityId: { type: GraphQLString, description: 'Target entity ID (epic, feature, task)' },
    entityType: { type: GraphQLString, description: 'Target entity type' },
    type: { type: GraphQLString, description: 'Intervention type (budget, schedule, risk, quality)' },
    severity: { type: GraphQLString, description: 'Severity (low, medium, high, critical)' },
    title: { type: GraphQLString, description: 'Intervention title' },
    description: { type: GraphQLString, description: 'Detailed description' },
    reasoning: { type: GraphQLString, description: 'Agent reasoning/chain-of-thought' },
    recommendation: { type: GraphQLString, description: 'Recommended action' },
    confidence: { type: GraphQLFloat, description: 'Agent confidence score (0-1)' },
    status: { type: GraphQLString, description: 'Status (pending, approved, rejected, completed)' },
    requiresApproval: { type: GraphQLBoolean, description: 'Whether intervention requires approval' },
    createdAt: { type: GraphQLString, description: 'Creation timestamp' },
    updatedAt: { type: GraphQLString, description: 'Last update timestamp' },
    approvedBy: { type: GraphQLString, description: 'Approver user ID' },
    toolsUsed: { type: new GraphQLList(GraphQLString), description: 'LangChain tools used' },
    langsmithTraceId: { type: GraphQLString, description: 'LangSmith trace ID for debugging' },
  },
});

// Agent Activity Type
const AgentActivityType = new GraphQLObjectType({
  name: 'AgentActivity',
  description: 'Log of agent activity and decision-making',
  fields: {
    id: { type: GraphQLString },
    agentId: { type: GraphQLString, description: 'Agent ID' },
    agentName: { type: GraphQLString, description: 'Agent name' },
    activityType: { type: GraphQLString, description: 'Activity type (scan, analyze, intervention)' },
    description: { type: GraphQLString, description: 'Activity description' },
    targetEntityId: { type: GraphQLString, description: 'Target entity ID' },
    targetEntityType: { type: GraphQLString, description: 'Target entity type' },
    result: { type: GraphQLString, description: 'Activity result' },
    timestamp: { type: GraphQLString, description: 'Activity timestamp' },
    langsmithTraceUrl: { type: GraphQLString, description: 'LangSmith trace URL' },
  },
});

// ============================================================================
// TEAM & SPRINT TYPES
// ============================================================================

// Team Type
const TeamType = new GraphQLObjectType({
  name: 'Team',
  description: 'An Agile team or resource pool',
  fields: () => ({
    id: { type: GraphQLString },
    uri: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString, description: 'Team type (agile, kanban, waterfall)' },
    capacity: { type: GraphQLFloat, description: 'Team capacity (story points or hours)' },
    velocity: { type: GraphQLFloat, description: 'Historical velocity' },
    members: {
      type: new GraphQLList(ResourceType),
      description: 'Team members',
      resolve: async (team, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'resources',
          limit: 50,
        });
        return result.data.filter((r: any) => r.teamId === team.id);
      },
    },
    source: { type: GraphQLString },
  }),
});

// Sprint Type
const SprintType = new GraphQLObjectType({
  name: 'Sprint',
  description: 'An iteration or sprint',
  fields: {
    id: { type: GraphQLString },
    uri: { type: GraphQLString },
    name: { type: GraphQLString },
    startDate: { type: GraphQLString },
    endDate: { type: GraphQLString },
    status: { type: GraphQLString },
    teamId: { type: GraphQLString },
    plannedCapacity: { type: GraphQLFloat },
    committedPoints: { type: GraphQLInt },
    completedPoints: { type: GraphQLInt },
    velocity: { type: GraphQLFloat },
    source: { type: GraphQLString },
  },
});

// ============================================================================
// PROJECT & HIERARCHY TYPES
// ============================================================================

// Epic Type (separate from Project for SAFe)
const EpicType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Epic',
  description: 'A SAFe Epic or large initiative',
  fields: () => ({
    id: { type: GraphQLString },
    uri: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    type: { type: GraphQLString, description: 'Epic type (business, enabler)' },
    wsjfScore: { type: GraphQLFloat, description: 'WSJF prioritization score' },
    businessValue: { type: GraphQLFloat },
    timeCriticality: { type: GraphQLFloat },
    riskReduction: { type: GraphQLFloat },
    portfolioId: { type: GraphQLString },
    projectId: { type: GraphQLString },
    owner: { type: GraphQLString },
    startDate: { type: GraphQLString },
    endDate: { type: GraphQLString },
    source: { type: GraphQLString },
    features: {
      type: new GraphQLList(FeatureType),
      description: 'Features within this epic',
      resolve: async (epic, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'features',
          limit: 50,
        });
        return result.data.filter((f: any) => f.epicId === epic.id);
      },
    },
  }),
});

// Project Type (Extended with comprehensive attributes)
const ProjectType = new GraphQLObjectType({
  name: 'Project',
  description: 'A project entity from any methodology (SAFe, PMBOK, PRINCE2)',
  fields: () => ({
    // Basic Information
    id: { type: GraphQLString, description: 'Project ID' },
    uri: { type: GraphQLString, description: 'Ontology URI' },
    name: { type: GraphQLString, description: 'Project name' },
    description: { type: GraphQLString, description: 'Project description' },
    status: { type: GraphQLString, description: 'Current status' },
    health: { type: GraphQLString, description: 'Project health (green, yellow, red)' },
    methodology: { type: GraphQLString, description: 'Methodology (SAFe, PMBOK, PRINCE2, Agile)' },

    // Financial Attributes
    budget: { type: GraphQLString, description: 'Total budget' },
    budgetSpent: { type: GraphQLString, description: 'Amount spent' },
    budgetRemaining: { type: GraphQLString, description: 'Budget remaining' },
    plannedValue: { type: GraphQLFloat, description: 'Planned Value (PV) for EVM' },
    earnedValue: { type: GraphQLFloat, description: 'Earned Value (EV) for EVM' },
    actualCost: { type: GraphQLFloat, description: 'Actual Cost (AC) for EVM' },
    cpi: { type: GraphQLString, description: 'Cost Performance Index' },
    spi: { type: GraphQLString, description: 'Schedule Performance Index' },
    tcpi: { type: GraphQLFloat, description: 'To-Complete Performance Index' },
    eac: { type: GraphQLFloat, description: 'Estimate at Completion' },
    etc: { type: GraphQLFloat, description: 'Estimate to Complete' },
    vac: { type: GraphQLFloat, description: 'Variance at Completion' },

    // Schedule Attributes
    startDate: { type: GraphQLString, description: 'Start date' },
    endDate: { type: GraphQLString, description: 'Target end date' },
    actualStartDate: { type: GraphQLString, description: 'Actual start date' },
    forecastEndDate: { type: GraphQLString, description: 'Forecasted end date' },
    durationDays: { type: GraphQLInt, description: 'Total duration in days' },
    completionPercentage: { type: GraphQLFloat, description: 'Completion percentage' },

    // Organizational Attributes
    portfolioId: { type: GraphQLString, description: 'Portfolio ID' },
    divisionId: { type: GraphQLString, description: 'Division ID' },
    strategicThemeId: { type: GraphQLString, description: 'Strategic theme ID' },
    programId: { type: GraphQLString, description: 'Program ID' },
    owner: { type: GraphQLString, description: 'Project owner' },
    sponsor: { type: GraphQLString, description: 'Project sponsor' },

    // Metrics & KPIs
    valueScore: { type: GraphQLFloat, description: 'Value realization score' },
    riskScore: { type: GraphQLFloat, description: 'Overall risk score' },
    qualityScore: { type: GraphQLFloat, description: 'Quality score' },
    stakeholderSatisfaction: { type: GraphQLFloat, description: 'Stakeholder satisfaction (0-1)' },

    // Data Source
    source: { type: GraphQLString, description: 'Data source system' },
    externalId: { type: GraphQLString, description: 'External system ID' },
    lastSyncedAt: { type: GraphQLString, description: 'Last sync timestamp' },

    // Related Entities
    epics: {
      type: new GraphQLList(EpicType),
      description: 'Epics within this project',
      resolve: async (project, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'epics',
          limit: 50,
        });
        return result.data.filter((e: any) => e.projectId === project.id);
      },
    },
    features: {
      type: new GraphQLList(FeatureType),
      description: 'Features within this project',
      resolve: async (project, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'features',
          limit: 50,
        });
        return result.data.filter((f: any) => f.epicId === project.id);
      },
    },
    risks: {
      type: new GraphQLList(RiskType),
      description: 'Risks associated with this project',
      resolve: async (project, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'risks',
          limit: 50,
        });
        return result.data.filter((r: any) => r.projectId === project.id);
      },
    },
    resources: {
      type: new GraphQLList(ResourceType),
      description: 'Resources allocated to project',
      resolve: async (project, args, context) => {
        // This would query resource allocations
        return [];
      },
    },
    milestones: {
      type: new GraphQLList(MilestoneType),
      description: 'Project milestones',
      resolve: async (project, args, context) => {
        const result = await context.storage.getMilestones?.() || [];
        return result.filter((m: any) => m.projectId === project.id);
      },
    },
    dependencies: {
      type: new GraphQLList(DependencyType),
      description: 'Project dependencies',
      resolve: async (project, args, context) => {
        const result = await context.storage.getDependencies?.() || [];
        return result.filter((d: any) =>
          d.predecessorId === project.id || d.successorId === project.id
        );
      },
    },
    interventions: {
      type: new GraphQLList(InterventionType),
      description: 'Agent interventions for this project',
      resolve: async (project, args, context) => {
        const result = await context.storage.getInterventions({ projectId: project.id });
        return result;
      },
    },
  }),
});

// Feature Type
const FeatureType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Feature',
  description: 'A feature or capability',
  fields: () => ({
    id: { type: GraphQLString },
    uri: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    storyPoints: { type: GraphQLInt },
    wsjfScore: { type: GraphQLString },
    epicId: { type: GraphQLString },
    source: { type: GraphQLString },
    stories: {
      type: new GraphQLList(StoryType),
      resolve: async (feature, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'stories',
          limit: 100,
        });
        return result.data.filter((s: any) => s.featureId === feature.id);
      },
    },
  }),
});

// Story Type
const StoryType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Story',
  description: 'A user story',
  fields: () => ({
    id: { type: GraphQLString },
    uri: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    storyPoints: { type: GraphQLInt },
    assignedTeam: { type: GraphQLString },
    sprintId: { type: GraphQLString },
    featureId: { type: GraphQLString },
    source: { type: GraphQLString },
    tasks: {
      type: new GraphQLList(TaskType),
      resolve: async (story, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'tasks',
          limit: 100,
        });
        return result.data.filter((t: any) => t.storyId === story.id);
      },
    },
  }),
});

// Task Type (Extended with dependencies and resources)
const TaskType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Task',
  description: 'A task or activity',
  fields: () => ({
    // Basic Information
    id: { type: GraphQLString, description: 'Task ID' },
    uri: { type: GraphQLString, description: 'Ontology URI' },
    name: { type: GraphQLString, description: 'Task name' },
    description: { type: GraphQLString, description: 'Task description' },
    status: { type: GraphQLString, description: 'Task status' },
    type: { type: GraphQLString, description: 'Task type (development, testing, design)' },
    priority: { type: GraphQLString, description: 'Priority (low, medium, high, critical)' },

    // Schedule Attributes
    startDate: { type: GraphQLString, description: 'Planned start date' },
    dueDate: { type: GraphQLString, description: 'Due date' },
    actualStartDate: { type: GraphQLString, description: 'Actual start date' },
    actualEndDate: { type: GraphQLString, description: 'Actual completion date' },
    durationDays: { type: GraphQLFloat, description: 'Duration in days' },

    // Effort & Resources
    effortHours: { type: GraphQLFloat, description: 'Estimated effort in hours' },
    actualHours: { type: GraphQLFloat, description: 'Actual hours worked' },
    remainingHours: { type: GraphQLFloat, description: 'Remaining hours' },
    assignee: { type: GraphQLString, description: 'Assigned person' },
    skills: { type: GraphQLString, description: 'Required skills' },

    // Progress
    completionPercentage: { type: GraphQLFloat, description: 'Completion percentage' },

    // Relationships
    storyId: { type: GraphQLString, description: 'Parent story ID' },
    projectId: { type: GraphQLString, description: 'Parent project ID' },
    milestoneId: { type: GraphQLString, description: 'Associated milestone ID' },

    // Data Source
    source: { type: GraphQLString, description: 'Data source system' },
    externalId: { type: GraphQLString, description: 'External system ID' },

    // Related Entities
    dependencies: {
      type: new GraphQLList(DependencyType),
      description: 'Task dependencies',
      resolve: async (task, args, context) => {
        const result = await context.storage.getDependencies?.() || [];
        return result.filter((d: any) =>
          d.predecessorId === task.id || d.successorId === task.id
        );
      },
    },
    resourceAssignments: {
      type: new GraphQLList(ResourceAssignmentType),
      description: 'Resource assignments for this task',
      resolve: async (task, args, context) => {
        const result = await context.storage.getResourceAssignments?.() || [];
        return result.filter((a: any) => a.taskId === task.id);
      },
    },
  }),
});

// Risk Type
const RiskType = new GraphQLObjectType({
  name: 'Risk',
  description: 'A project risk',
  fields: {
    id: { type: GraphQLString },
    uri: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    probability: { type: GraphQLString },
    impact: { type: GraphQLString },
    mitigation: { type: GraphQLString },
    status: { type: GraphQLString },
    projectId: { type: GraphQLString },
    source: { type: GraphQLString },
  },
});

// Portfolio Type
const PortfolioType = new GraphQLObjectType({
  name: 'Portfolio',
  description: 'A portfolio of projects',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    projects: {
      type: new GraphQLList(ProjectType),
      resolve: async (portfolio, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'projects',
          portfolioId: portfolio.id,
          limit: 100,
        });
        return result.data;
      },
    },
  }),
});

// Query Metadata Type
const QueryMetadataType = new GraphQLObjectType({
  name: 'QueryMetadata',
  description: 'Metadata about query execution',
  fields: {
    sources: { type: new GraphQLList(GraphQLString), description: 'Data sources queried' },
    executionTime: { type: GraphQLInt, description: 'Execution time in milliseconds' },
    cached: { type: GraphQLString, description: 'Whether results were cached' },
    resultCount: { type: GraphQLInt, description: 'Number of results returned' },
  },
});

// Root Query Type
const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query type',
  fields: {
    // Get single project by ID
    project: {
      type: ProjectType,
      description: 'Get a project by ID',
      args: {
        id: { type: new GraphQLNonNull(GraphQLString), description: 'Project ID' },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'projects',
          limit: 1,
        });
        return result.data.find((p: any) => p.id === args.id);
      },
    },

    // Get all projects with optional filters
    projects: {
      type: new GraphQLList(ProjectType),
      description: 'Get all projects with optional filters',
      args: {
        status: { type: GraphQLString, description: 'Filter by status' },
        portfolioId: { type: GraphQLString, description: 'Filter by portfolio' },
        limit: { type: GraphQLInt, description: 'Maximum number of results', defaultValue: 50 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'projects',
          status: args.status,
          portfolioId: args.portfolioId,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all portfolios
    portfolios: {
      type: new GraphQLList(PortfolioType),
      description: 'Get all portfolios',
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'portfolios',
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all features
    features: {
      type: new GraphQLList(FeatureType),
      description: 'Get all features',
      args: {
        status: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'features',
          status: args.status,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all stories
    stories: {
      type: new GraphQLList(StoryType),
      description: 'Get all user stories',
      args: {
        status: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'stories',
          status: args.status,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all tasks
    tasks: {
      type: new GraphQLList(TaskType),
      description: 'Get all tasks',
      args: {
        status: { type: GraphQLString },
        assignee: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'tasks',
          status: args.status,
          limit: args.limit,
        });

        let data = result.data;

        // Filter by assignee if provided
        if (args.assignee) {
          data = data.filter((t: any) => t.assignee === args.assignee);
        }

        return data;
      },
    },

    // Get all risks
    risks: {
      type: new GraphQLList(RiskType),
      description: 'Get all risks',
      args: {
        status: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'risks',
          status: args.status,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all epics
    epics: {
      type: new GraphQLList(EpicType),
      description: 'Get all epics',
      args: {
        status: { type: GraphQLString },
        portfolioId: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 50 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'epics',
          status: args.status,
          portfolioId: args.portfolioId,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all resources
    resources: {
      type: new GraphQLList(ResourceType),
      description: 'Get all resources',
      args: {
        type: { type: GraphQLString, description: 'Filter by type (person, equipment, budget)' },
        teamId: { type: GraphQLString, description: 'Filter by team' },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'resources',
          type: args.type,
          teamId: args.teamId,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all dependencies
    dependencies: {
      type: new GraphQLList(DependencyType),
      description: 'Get all dependencies',
      args: {
        entityId: { type: GraphQLString, description: 'Filter by entity ID' },
        entityType: { type: GraphQLString, description: 'Filter by entity type' },
        limit: { type: GraphQLInt, defaultValue: 200 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.storage.getDependencies?.() || [];
        let data = result;

        if (args.entityId) {
          data = data.filter((d: any) =>
            d.predecessorId === args.entityId || d.successorId === args.entityId
          );
        }

        if (args.entityType) {
          data = data.filter((d: any) =>
            d.predecessorType === args.entityType || d.successorType === args.entityType
          );
        }

        return data.slice(0, args.limit);
      },
    },

    // Get all milestones
    milestones: {
      type: new GraphQLList(MilestoneType),
      description: 'Get all milestones',
      args: {
        projectId: { type: GraphQLString },
        status: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.storage.getMilestones?.() || [];
        let data = result;

        if (args.projectId) {
          data = data.filter((m: any) => m.projectId === args.projectId);
        }

        if (args.status) {
          data = data.filter((m: any) => m.status === args.status);
        }

        return data.slice(0, args.limit);
      },
    },

    // Get all interventions (from agents)
    interventions: {
      type: new GraphQLList(InterventionType),
      description: 'Get all agent interventions',
      args: {
        agentId: { type: GraphQLString, description: 'Filter by agent' },
        projectId: { type: GraphQLString, description: 'Filter by project' },
        status: { type: GraphQLString, description: 'Filter by status' },
        severity: { type: GraphQLString, description: 'Filter by severity' },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const filters: any = {};
        if (args.agentId) filters.agentId = args.agentId;
        if (args.projectId) filters.projectId = args.projectId;
        if (args.status) filters.status = args.status;
        if (args.severity) filters.severity = args.severity;

        const result = await context.storage.getInterventions(filters);
        return result.slice(0, args.limit);
      },
    },

    // Get single intervention
    intervention: {
      type: InterventionType,
      description: 'Get a specific intervention',
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent, args, context) => {
        const result = await context.storage.getInterventions({ id: args.id });
        return result[0];
      },
    },

    // Get agent activity log
    agentActivity: {
      type: new GraphQLList(AgentActivityType),
      description: 'Get agent activity logs',
      args: {
        agentId: { type: GraphQLString, description: 'Filter by agent' },
        activityType: { type: GraphQLString, description: 'Filter by activity type' },
        limit: { type: GraphQLInt, defaultValue: 100 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.storage.getAgentActivityLog?.() || [];
        let data = result;

        if (args.agentId) {
          data = data.filter((a: any) => a.agentId === args.agentId);
        }

        if (args.activityType) {
          data = data.filter((a: any) => a.activityType === args.activityType);
        }

        return data.slice(0, args.limit);
      },
    },

    // Get all teams
    teams: {
      type: new GraphQLList(TeamType),
      description: 'Get all teams',
      args: {
        type: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 50 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'teams',
          type: args.type,
          limit: args.limit,
        });
        return result.data;
      },
    },

    // Get all sprints
    sprints: {
      type: new GraphQLList(SprintType),
      description: 'Get all sprints',
      args: {
        teamId: { type: GraphQLString },
        status: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 50 },
      },
      resolve: async (parent, args, context) => {
        const result = await context.obdaService.executeQuery({
          entityType: 'sprints',
          teamId: args.teamId,
          status: args.status,
          limit: args.limit,
        });
        return result.data;
      },
    },
  },
});

/**
 * Create GraphQL schema
 */
export function createGraphQLSchema(obdaService: OBDAService): GraphQLSchema {
  return new GraphQLSchema({
    query: RootQueryType,
    // Store OBDA service in context for resolvers
    // This will be passed via context in the GraphQL handler
  });
}

/**
 * Create GraphQL context with OBDA service and storage
 */
export function createGraphQLContext(obdaService: OBDAService, storage: any) {
  return {
    obdaService,
    storage,
  };
}
