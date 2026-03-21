/**
 * PALANTIR ONTOLOGY AS CODE SPECIFICATION
 * Object Type: AtlasTask
 *
 * SAFe Task - a specific unit of work required to complete a Story.
 * Tasks are the lowest level of the SAFe hierarchy.
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

// ============================================================================
// TYPE DEFINITION
// ============================================================================

export const AtlasTaskObjectType = {
  apiName: 'AtlasTask',
  displayName: '[Atlas] Task',
  description: 'SAFe Task - a specific unit of work to complete a Story',

  dataSource: {
    type: 'phonograph' as const,
  },

  primaryKey: ['taskId'],

  properties: {
    taskId: {
      dataType: 'string',
      description: 'Unique Task ID',
      required: true,
    },
    name: {
      dataType: 'string',
      description: 'Task name/title',
      required: true,
    },
    description: {
      dataType: 'string',
      description: 'Task description',
    },
    status: {
      dataType: 'string',
      description: 'Status (To Do, In Progress, In Review, Done)',
    },
    priority: {
      dataType: 'string',
      description: 'Priority (Critical, High, Medium, Low)',
    },
    storyId: {
      dataType: 'string',
      description: 'Parent Story ID',
    },
    featureId: {
      dataType: 'string',
      description: 'Parent Feature ID',
    },
    projectId: {
      dataType: 'string',
      description: 'Parent Project ID',
      required: true,
    },
    estimatedHours: {
      dataType: 'double',
      description: 'Estimated hours to complete',
    },
    actualHours: {
      dataType: 'double',
      description: 'Actual hours spent',
    },
    remainingHours: {
      dataType: 'double',
      description: 'Remaining hours',
    },
    taskType: {
      dataType: 'string',
      description: 'Task type (Development, Testing, Documentation, etc.)',
    },
    assignee: {
      dataType: 'string',
      description: 'Assigned team member',
    },
    teamId: {
      dataType: 'string',
      description: 'Assigned team ID',
    },
    sprint: {
      dataType: 'string',
      description: 'Sprint/Iteration name',
    },
    blockedBy: {
      dataType: 'string',
      description: 'Blocking task/issue ID',
    },
    startDate: {
      dataType: 'date',
      description: 'Start date',
    },
    completedDate: {
      dataType: 'date',
      description: 'Completion date',
    },
    source: {
      dataType: 'string',
      description: 'Data source system',
    },
    externalId: {
      dataType: 'string',
      description: 'External system ID',
    },
    syncedAt: {
      dataType: 'timestamp',
      description: 'Last sync timestamp',
    },
  },

  icon: {
    type: 'blueprint' as const,
    color: '#2ECC71',
    name: 'tick-circle',
  },

  status: 'ACTIVE',
};

// ============================================================================
// ACTION TYPES
// ============================================================================

export const CreateTaskAction = {
  apiName: 'atlas-create-task',
  displayName: 'Create Task',
  description: 'Create or update a Task',

  parameters: [
    { name: 'task_id', dataType: 'string', required: true, description: 'Task ID' },
    { name: 'name', dataType: 'string', required: true, description: 'Task name' },
    { name: 'description', dataType: 'string', required: false, description: 'Description' },
    { name: 'status', dataType: 'string', required: false, description: 'Status' },
    { name: 'priority', dataType: 'string', required: false, description: 'Priority' },
    { name: 'story_id', dataType: 'string', required: false, description: 'Parent Story ID' },
    { name: 'feature_id', dataType: 'string', required: false, description: 'Parent Feature ID' },
    { name: 'project_id', dataType: 'string', required: true, description: 'Parent Project ID' },
    { name: 'estimated_hours', dataType: 'double', required: false, description: 'Estimated hours' },
    { name: 'task_type', dataType: 'string', required: false, description: 'Task type' },
    { name: 'assignee', dataType: 'string', required: false, description: 'Assignee' },
    { name: 'team_id', dataType: 'string', required: false, description: 'Team ID' },
    { name: 'sprint', dataType: 'string', required: false, description: 'Sprint name' },
  ],

  operations: [
    { type: 'createObject', objectTypeApiName: 'AtlasTask' },
  ],
};

// ============================================================================
// LINK TYPES
// ============================================================================

export const TaskLinks = {
  taskToStory: {
    apiName: 'taskStory',
    displayName: 'Parent Story',
    fromObjectType: 'AtlasTask',
    toObjectType: 'AtlasStory',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'storyId',
  },

  taskToFeature: {
    apiName: 'taskFeature',
    displayName: 'Parent Feature',
    fromObjectType: 'AtlasTask',
    toObjectType: 'AtlasFeature',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'featureId',
  },

  taskToProject: {
    apiName: 'taskProject',
    displayName: 'Parent Project',
    fromObjectType: 'AtlasTask',
    toObjectType: 'AtlasProject',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'projectId',
  },
};

// ============================================================================
// YAML FORMAT
// ============================================================================

export const AtlasTaskYAML = `
objectTypes:
  AtlasTask:
    apiName: AtlasTask
    displayName: "[Atlas] Task"
    description: "SAFe Task - a unit of work"
    primaryKey:
      - taskId
    dataSource:
      type: phonograph
    properties:
      taskId:
        dataType: string
        required: true
      name:
        dataType: string
        required: true
      description:
        dataType: string
      status:
        dataType: string
      priority:
        dataType: string
      storyId:
        dataType: string
      featureId:
        dataType: string
      projectId:
        dataType: string
        required: true
      estimatedHours:
        dataType: double
      actualHours:
        dataType: double
      remainingHours:
        dataType: double
      taskType:
        dataType: string
      assignee:
        dataType: string
      teamId:
        dataType: string
      sprint:
        dataType: string
      blockedBy:
        dataType: string
      startDate:
        dataType: date
      completedDate:
        dataType: date
      source:
        dataType: string
      externalId:
        dataType: string
      syncedAt:
        dataType: timestamp
    icon:
      type: blueprint
      color: "#2ECC71"
      name: tick-circle

actionTypes:
  atlas-create-task:
    apiName: atlas-create-task
    displayName: "Create Task"
    parameters:
      - name: task_id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: project_id
        dataType: string
        required: true
      - name: story_id
        dataType: string
      - name: feature_id
        dataType: string
      - name: description
        dataType: string
      - name: status
        dataType: string
      - name: priority
        dataType: string
      - name: estimated_hours
        dataType: double
      - name: task_type
        dataType: string
      - name: assignee
        dataType: string
      - name: sprint
        dataType: string
    operations:
      - type: createObject
        objectTypeApiName: AtlasTask
`;
