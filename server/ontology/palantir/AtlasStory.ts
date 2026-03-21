/**
 * PALANTIR ONTOLOGY AS CODE SPECIFICATION
 * Object Type: AtlasStory
 *
 * SAFe User Story - a short description of a small piece of desired functionality.
 * Stories belong to Features and are broken down into Tasks.
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

// ============================================================================
// TYPE DEFINITION
// ============================================================================

export const AtlasStoryObjectType = {
  apiName: 'AtlasStory',
  displayName: '[Atlas] Story',
  description: 'SAFe User Story - a small piece of desired functionality',

  dataSource: {
    type: 'phonograph' as const,
  },

  primaryKey: ['storyId'],

  properties: {
    storyId: {
      dataType: 'string',
      description: 'Unique Story ID',
      required: true,
    },
    name: {
      dataType: 'string',
      description: 'Story name/title',
      required: true,
    },
    description: {
      dataType: 'string',
      description: 'Story description (user story format)',
    },
    status: {
      dataType: 'string',
      description: 'Status (Backlog, In Progress, In Review, Done)',
    },
    priority: {
      dataType: 'string',
      description: 'Priority (Critical, High, Medium, Low)',
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
    storyPoints: {
      dataType: 'integer',
      description: 'Story point estimate',
    },
    sprint: {
      dataType: 'string',
      description: 'Sprint/Iteration name',
    },
    assignee: {
      dataType: 'string',
      description: 'Assigned team member',
    },
    teamId: {
      dataType: 'string',
      description: 'Assigned team ID',
    },
    acceptanceCriteria: {
      dataType: 'string',
      description: 'Acceptance criteria (JSON array)',
    },
    blockedBy: {
      dataType: 'string',
      description: 'Blocking story/issue ID',
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
    color: '#3498DB',
    name: 'document',
  },

  status: 'ACTIVE',
};

// ============================================================================
// ACTION TYPES
// ============================================================================

export const CreateStoryAction = {
  apiName: 'atlas-create-story',
  displayName: 'Create Story',
  description: 'Create or update a User Story',

  parameters: [
    { name: 'story_id', dataType: 'string', required: true, description: 'Story ID' },
    { name: 'name', dataType: 'string', required: true, description: 'Story name' },
    { name: 'description', dataType: 'string', required: false, description: 'Description' },
    { name: 'status', dataType: 'string', required: false, description: 'Status' },
    { name: 'priority', dataType: 'string', required: false, description: 'Priority' },
    { name: 'feature_id', dataType: 'string', required: false, description: 'Parent Feature ID' },
    { name: 'project_id', dataType: 'string', required: true, description: 'Parent Project ID' },
    { name: 'story_points', dataType: 'integer', required: false, description: 'Story points' },
    { name: 'sprint', dataType: 'string', required: false, description: 'Sprint name' },
    { name: 'assignee', dataType: 'string', required: false, description: 'Assignee' },
    { name: 'team_id', dataType: 'string', required: false, description: 'Team ID' },
  ],

  operations: [
    { type: 'createObject', objectTypeApiName: 'AtlasStory' },
  ],
};

// ============================================================================
// LINK TYPES
// ============================================================================

export const StoryLinks = {
  storyToFeature: {
    apiName: 'storyFeature',
    displayName: 'Parent Feature',
    fromObjectType: 'AtlasStory',
    toObjectType: 'AtlasFeature',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'featureId',
  },

  storyToProject: {
    apiName: 'storyProject',
    displayName: 'Parent Project',
    fromObjectType: 'AtlasStory',
    toObjectType: 'AtlasProject',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'projectId',
  },

  storyToTasks: {
    apiName: 'storyTasks',
    displayName: 'Story Tasks',
    fromObjectType: 'AtlasStory',
    toObjectType: 'AtlasTask',
    cardinality: 'ONE_TO_MANY',
    foreignKey: 'storyId',
  },
};

// ============================================================================
// YAML FORMAT
// ============================================================================

export const AtlasStoryYAML = `
objectTypes:
  AtlasStory:
    apiName: AtlasStory
    displayName: "[Atlas] Story"
    description: "SAFe User Story"
    primaryKey:
      - storyId
    dataSource:
      type: phonograph
    properties:
      storyId:
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
      featureId:
        dataType: string
      projectId:
        dataType: string
        required: true
      storyPoints:
        dataType: integer
      sprint:
        dataType: string
      assignee:
        dataType: string
      teamId:
        dataType: string
      acceptanceCriteria:
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
      color: "#3498DB"
      name: document

actionTypes:
  atlas-create-story:
    apiName: atlas-create-story
    displayName: "Create Story"
    parameters:
      - name: story_id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: project_id
        dataType: string
        required: true
      - name: feature_id
        dataType: string
      - name: description
        dataType: string
      - name: status
        dataType: string
      - name: priority
        dataType: string
      - name: story_points
        dataType: integer
      - name: sprint
        dataType: string
      - name: assignee
        dataType: string
    operations:
      - type: createObject
        objectTypeApiName: AtlasStory
`;
