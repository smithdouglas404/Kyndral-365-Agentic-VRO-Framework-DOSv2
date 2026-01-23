/**
 * Comprehensive GraphQL Query Hooks
 * Replaces REST API calls with GraphQL queries for all project attributes
 *
 * Includes:
 * - Projects with ALL attributes (financial, schedule, resources, dependencies)
 * - Resources, Dependencies, Milestones
 * - Agent interventions with reasoning
 * - Agent activity logs
 * - Real-time data from LangChain agents (not simulation)
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const GRAPHQL_ENDPOINT = '/api/graphql';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Project {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  status: string;
  health?: string;
  methodology?: string;

  // Financial
  budget?: string;
  budgetSpent?: string;
  budgetRemaining?: string;
  plannedValue?: number;
  earnedValue?: number;
  actualCost?: number;
  cpi?: string;
  spi?: string;
  tcpi?: number;
  eac?: number;
  etc?: number;
  vac?: number;

  // Schedule
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  forecastEndDate?: string;
  durationDays?: number;
  completionPercentage?: number;

  // Organizational
  portfolioId?: string;
  divisionId?: string;
  strategicThemeId?: string;
  programId?: string;
  owner?: string;
  sponsor?: string;

  // Metrics
  valueScore?: number;
  riskScore?: number;
  qualityScore?: number;
  stakeholderSatisfaction?: number;

  // Source
  source?: string;
  externalId?: string;
  lastSyncedAt?: string;

  // Relationships
  epics?: Epic[];
  features?: Feature[];
  risks?: Risk[];
  resources?: Resource[];
  milestones?: Milestone[];
  dependencies?: Dependency[];
  interventions?: Intervention[];
}

export interface Epic {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  wsjfScore?: number;
  businessValue?: number;
  timeCriticality?: number;
  riskReduction?: number;
  portfolioId?: string;
  projectId?: string;
  owner?: string;
  startDate?: string;
  endDate?: string;
  source?: string;
  features?: Feature[];
}

export interface Feature {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  status: string;
  storyPoints?: number;
  wsjfScore?: string;
  epicId?: string;
  source?: string;
  stories?: Story[];
}

export interface Story {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  status: string;
  storyPoints?: number;
  assignedTeam?: string;
  sprintId?: string;
  featureId?: string;
  source?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  status: string;
  type?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  durationDays?: number;
  effortHours?: number;
  actualHours?: number;
  remainingHours?: number;
  assignee?: string;
  skills?: string;
  completionPercentage?: number;
  storyId?: string;
  projectId?: string;
  milestoneId?: string;
  source?: string;
  externalId?: string;
  dependencies?: Dependency[];
  resourceAssignments?: ResourceAssignment[];
}

export interface Resource {
  id: string;
  uri?: string;
  name: string;
  type?: string;
  role?: string;
  availability?: number;
  cost?: number;
  skills?: string[];
  teamId?: string;
  source?: string;
  assignments?: ResourceAssignment[];
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  taskId: string;
  allocation?: number;
  startDate?: string;
  endDate?: string;
  hoursAllocated?: number;
  hoursActual?: number;
}

export interface Dependency {
  id: string;
  uri?: string;
  type: string;
  predecessorId: string;
  successorId: string;
  predecessorType?: string;
  successorType?: string;
  lag?: number;
  status?: string;
  source?: string;
}

export interface Milestone {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  type?: string;
  targetDate?: string;
  actualDate?: string;
  status?: string;
  projectId?: string;
  epicId?: string;
  completionPercentage?: number;
  source?: string;
}

export interface Risk {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  probability: string;
  impact: string;
  mitigation?: string;
  status?: string;
  projectId?: string;
  source?: string;
}

export interface Intervention {
  id: string;
  agentId: string;
  agentName?: string;
  projectId?: string;
  entityId?: string;
  entityType?: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  reasoning?: string;
  recommendation?: string;
  confidence?: number;
  status: string;
  requiresApproval?: boolean;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  toolsUsed?: string[];
  langsmithTraceId?: string;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName?: string;
  activityType: string;
  description?: string;
  targetEntityId?: string;
  targetEntityType?: string;
  result?: string;
  timestamp?: string;
  langsmithTraceUrl?: string;
}

export interface Team {
  id: string;
  uri?: string;
  name: string;
  type?: string;
  capacity?: number;
  velocity?: number;
  members?: Resource[];
  source?: string;
}

export interface Sprint {
  id: string;
  uri?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  teamId?: string;
  plannedCapacity?: number;
  committedPoints?: number;
  completedPoints?: number;
  velocity?: number;
  source?: string;
}

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const PROJECT_FULL_FRAGMENT = gql`
  fragment ProjectFull on Project {
    id
    uri
    name
    description
    status
    health
    methodology
    budget
    budgetSpent
    budgetRemaining
    plannedValue
    earnedValue
    actualCost
    cpi
    spi
    tcpi
    eac
    etc
    vac
    startDate
    endDate
    actualStartDate
    forecastEndDate
    durationDays
    completionPercentage
    portfolioId
    divisionId
    strategicThemeId
    programId
    owner
    sponsor
    valueScore
    riskScore
    qualityScore
    stakeholderSatisfaction
    source
    externalId
    lastSyncedAt
  }
`;

const EPIC_FRAGMENT = gql`
  fragment EpicFields on Epic {
    id
    uri
    name
    description
    status
    type
    wsjfScore
    businessValue
    timeCriticality
    riskReduction
    portfolioId
    projectId
    owner
    startDate
    endDate
    source
  }
`;

const FEATURE_FRAGMENT = gql`
  fragment FeatureFields on Feature {
    id
    uri
    name
    description
    status
    storyPoints
    wsjfScore
    epicId
    source
  }
`;

const STORY_FRAGMENT = gql`
  fragment StoryFields on Story {
    id
    uri
    name
    description
    status
    storyPoints
    assignedTeam
    sprintId
    featureId
    source
  }
`;

const TASK_FRAGMENT = gql`
  fragment TaskFields on Task {
    id
    uri
    name
    description
    status
    type
    priority
    startDate
    dueDate
    actualStartDate
    actualEndDate
    durationDays
    effortHours
    actualHours
    remainingHours
    assignee
    skills
    completionPercentage
    storyId
    projectId
    milestoneId
    source
    externalId
  }
`;

const RISK_FRAGMENT = gql`
  fragment RiskFields on Risk {
    id
    uri
    name
    description
    probability
    impact
    mitigation
    status
    projectId
    source
  }
`;

const RESOURCE_FRAGMENT = gql`
  fragment ResourceFields on Resource {
    id
    uri
    name
    type
    role
    availability
    cost
    skills
    teamId
    source
  }
`;

const DEPENDENCY_FRAGMENT = gql`
  fragment DependencyFields on Dependency {
    id
    uri
    type
    predecessorId
    successorId
    predecessorType
    successorType
    lag
    status
    source
  }
`;

const MILESTONE_FRAGMENT = gql`
  fragment MilestoneFields on Milestone {
    id
    uri
    name
    description
    type
    targetDate
    actualDate
    status
    projectId
    epicId
    completionPercentage
    source
  }
`;

const INTERVENTION_FRAGMENT = gql`
  fragment InterventionFields on Intervention {
    id
    agentId
    agentName
    projectId
    entityId
    entityType
    type
    severity
    title
    description
    reasoning
    recommendation
    confidence
    status
    requiresApproval
    createdAt
    updatedAt
    approvedBy
    toolsUsed
    langsmithTraceId
  }
`;

// ============================================================================
// HOOK: useProjects (Comprehensive)
// ============================================================================

export function useProjects(filters?: {
  status?: string;
  portfolioId?: string;
  limit?: number;
}): UseQueryResult<Project[], Error> {
  const query = gql`
    ${PROJECT_FULL_FRAGMENT}
    query GetProjects($status: String, $portfolioId: String, $limit: Int) {
      projects(status: $status, portfolioId: $portfolioId, limit: $limit) {
        ...ProjectFull
      }
    }
  `;

  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const data = await request<{ projects: Project[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.projects;
    },
  });
}

// ============================================================================
// HOOK: useProject (Single project with ALL relationships)
// ============================================================================

export function useProject(projectId: string): UseQueryResult<Project, Error> {
  const query = gql`
    ${PROJECT_FULL_FRAGMENT}
    ${EPIC_FRAGMENT}
    ${FEATURE_FRAGMENT}
    ${RISK_FRAGMENT}
    ${MILESTONE_FRAGMENT}
    ${DEPENDENCY_FRAGMENT}
    ${INTERVENTION_FRAGMENT}
    query GetProject($id: String!) {
      project(id: $id) {
        ...ProjectFull
        epics {
          ...EpicFields
          features {
            ...FeatureFields
          }
        }
        risks {
          ...RiskFields
        }
        milestones {
          ...MilestoneFields
        }
        dependencies {
          ...DependencyFields
        }
        interventions {
          ...InterventionFields
        }
      }
    }
  `;

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const data = await request<{ project: Project }>(GRAPHQL_ENDPOINT, query, { id: projectId });
      return data.project;
    },
    enabled: !!projectId,
  });
}

// ============================================================================
// HOOK: useResources (All resources with assignments)
// ============================================================================

export function useResources(filters?: {
  type?: string;
  teamId?: string;
  limit?: number;
}): UseQueryResult<Resource[], Error> {
  const query = gql`
    ${RESOURCE_FRAGMENT}
    query GetResources($type: String, $teamId: String, $limit: Int) {
      resources(type: $type, teamId: $teamId, limit: $limit) {
        ...ResourceFields
        assignments {
          id
          taskId
          allocation
          startDate
          endDate
          hoursAllocated
          hoursActual
        }
      }
    }
  `;

  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      const data = await request<{ resources: Resource[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.resources;
    },
  });
}

// ============================================================================
// HOOK: useDependencies (All dependencies)
// ============================================================================

export function useDependencies(filters?: {
  entityId?: string;
  entityType?: string;
  limit?: number;
}): UseQueryResult<Dependency[], Error> {
  const query = gql`
    ${DEPENDENCY_FRAGMENT}
    query GetDependencies($entityId: String, $entityType: String, $limit: Int) {
      dependencies(entityId: $entityId, entityType: $entityType, limit: $limit) {
        ...DependencyFields
      }
    }
  `;

  return useQuery({
    queryKey: ['dependencies', filters],
    queryFn: async () => {
      const data = await request<{ dependencies: Dependency[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.dependencies;
    },
  });
}

// ============================================================================
// HOOK: useInterventions (Agent interventions with reasoning)
// ============================================================================

export function useInterventions(filters?: {
  agentId?: string;
  projectId?: string;
  status?: string;
  severity?: string;
  limit?: number;
}): UseQueryResult<Intervention[], Error> {
  const query = gql`
    ${INTERVENTION_FRAGMENT}
    query GetInterventions(
      $agentId: String
      $projectId: String
      $status: String
      $severity: String
      $limit: Int
    ) {
      interventions(
        agentId: $agentId
        projectId: $projectId
        status: $status
        severity: $severity
        limit: $limit
      ) {
        ...InterventionFields
      }
    }
  `;

  return useQuery({
    queryKey: ['interventions', filters],
    queryFn: async () => {
      const data = await request<{ interventions: Intervention[] }>(
        GRAPHQL_ENDPOINT,
        query,
        filters
      );
      return data.interventions;
    },
  });
}

// ============================================================================
// HOOK: useAgentActivity (Agent activity logs)
// ============================================================================

export function useAgentActivity(filters?: {
  agentId?: string;
  activityType?: string;
  limit?: number;
}): UseQueryResult<AgentActivity[], Error> {
  const query = gql`
    query GetAgentActivity($agentId: String, $activityType: String, $limit: Int) {
      agentActivity(agentId: $agentId, activityType: $activityType, limit: $limit) {
        id
        agentId
        agentName
        activityType
        description
        targetEntityId
        targetEntityType
        result
        timestamp
        langsmithTraceUrl
      }
    }
  `;

  return useQuery({
    queryKey: ['agentActivity', filters],
    queryFn: async () => {
      const data = await request<{ agentActivity: AgentActivity[] }>(
        GRAPHQL_ENDPOINT,
        query,
        filters
      );
      return data.agentActivity;
    },
  });
}

// ============================================================================
// HOOK: useTasks (All tasks with dependencies and resources)
// ============================================================================

export function useTasks(filters?: {
  status?: string;
  assignee?: string;
  limit?: number;
}): UseQueryResult<Task[], Error> {
  const query = gql`
    ${TASK_FRAGMENT}
    ${DEPENDENCY_FRAGMENT}
    query GetTasks($status: String, $assignee: String, $limit: Int) {
      tasks(status: $status, assignee: $assignee, limit: $limit) {
        ...TaskFields
        dependencies {
          ...DependencyFields
        }
        resourceAssignments {
          id
          resourceId
          allocation
          hoursAllocated
          hoursActual
        }
      }
    }
  `;

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const data = await request<{ tasks: Task[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.tasks;
    },
  });
}

// ============================================================================
// HOOK: useMilestones
// ============================================================================

export function useMilestones(filters?: {
  projectId?: string;
  status?: string;
  limit?: number;
}): UseQueryResult<Milestone[], Error> {
  const query = gql`
    ${MILESTONE_FRAGMENT}
    query GetMilestones($projectId: String, $status: String, $limit: Int) {
      milestones(projectId: $projectId, status: $status, limit: $limit) {
        ...MilestoneFields
      }
    }
  `;

  return useQuery({
    queryKey: ['milestones', filters],
    queryFn: async () => {
      const data = await request<{ milestones: Milestone[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.milestones;
    },
  });
}

// ============================================================================
// HOOK: useTeams
// ============================================================================

export function useTeams(filters?: {
  type?: string;
  limit?: number;
}): UseQueryResult<Team[], Error> {
  const query = gql`
    query GetTeams($type: String, $limit: Int) {
      teams(type: $type, limit: $limit) {
        id
        uri
        name
        type
        capacity
        velocity
        source
        members {
          id
          name
          role
          skills
        }
      }
    }
  `;

  return useQuery({
    queryKey: ['teams', filters],
    queryFn: async () => {
      const data = await request<{ teams: Team[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.teams;
    },
  });
}

// ============================================================================
// HOOK: useSprints
// ============================================================================

export function useSprints(filters?: {
  teamId?: string;
  status?: string;
  limit?: number;
}): UseQueryResult<Sprint[], Error> {
  const query = gql`
    query GetSprints($teamId: String, $status: String, $limit: Int) {
      sprints(teamId: $teamId, status: $status, limit: $limit) {
        id
        uri
        name
        startDate
        endDate
        status
        teamId
        plannedCapacity
        committedPoints
        completedPoints
        velocity
        source
      }
    }
  `;

  return useQuery({
    queryKey: ['sprints', filters],
    queryFn: async () => {
      const data = await request<{ sprints: Sprint[] }>(GRAPHQL_ENDPOINT, query, filters);
      return data.sprints;
    },
  });
}
