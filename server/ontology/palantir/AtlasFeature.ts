/**
 * PALANTIR ONTOLOGY AS CODE SPECIFICATION
 * Object Type: AtlasFeature
 *
 * SAFe Feature - a service or capability that fulfills a stakeholder need.
 * Features are containers for Stories and are linked to Projects/Epics.
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

// ============================================================================
// TYPE DEFINITION (for Palantir Ontology as Code)
// ============================================================================

export const AtlasFeatureObjectType = {
  apiName: 'AtlasFeature',
  displayName: '[Atlas] Feature',
  description: 'SAFe Feature - a service or capability that fulfills a stakeholder need',

  dataSource: {
    type: 'phonograph' as const,
  },

  primaryKey: ['featureId'],

  properties: {
    featureId: {
      dataType: 'string',
      description: 'Unique Feature ID',
      required: true,
    },
    name: {
      dataType: 'string',
      description: 'Feature name',
      required: true,
    },
    description: {
      dataType: 'string',
      description: 'Feature description',
    },
    status: {
      dataType: 'string',
      description: 'Feature status (Backlog, In Progress, Done, etc.)',
    },
    priority: {
      dataType: 'string',
      description: 'Priority (Critical, High, Medium, Low)',
    },
    projectId: {
      dataType: 'string',
      description: 'Parent Project/Epic ID',
      required: true,
    },
    storyPoints: {
      dataType: 'integer',
      description: 'Total story points',
    },
    completedPoints: {
      dataType: 'integer',
      description: 'Completed story points',
    },
    targetPi: {
      dataType: 'string',
      description: 'Target Program Increment',
    },
    wsjfScore: {
      dataType: 'double',
      description: 'WSJF (Weighted Shortest Job First) score',
    },
    acceptanceCriteria: {
      dataType: 'string',
      description: 'Acceptance criteria (JSON array)',
    },
    benefitHypothesis: {
      dataType: 'string',
      description: 'Benefit hypothesis',
    },
    owner: {
      dataType: 'string',
      description: 'Feature owner',
    },
    startDate: {
      dataType: 'date',
      description: 'Start date',
    },
    targetDate: {
      dataType: 'date',
      description: 'Target completion date',
    },
    source: {
      dataType: 'string',
      description: 'Data source system',
    },
    externalId: {
      dataType: 'string',
      description: 'External system ID (Jira, Azure DevOps, etc.)',
    },
    syncedAt: {
      dataType: 'timestamp',
      description: 'Last sync timestamp',
    },
  },

  icon: {
    type: 'blueprint' as const,
    color: '#9B59B6',
    name: 'cube',
  },

  status: 'ACTIVE',
};

// ============================================================================
// ACTION TYPES
// ============================================================================

export const CreateFeatureAction = {
  apiName: 'atlas-create-feature',
  displayName: 'Create Feature',
  description: 'Create or update a SAFe Feature',

  parameters: [
    { name: 'feature_id', dataType: 'string', required: true, description: 'Feature ID' },
    { name: 'name', dataType: 'string', required: true, description: 'Feature name' },
    { name: 'description', dataType: 'string', required: false, description: 'Description' },
    { name: 'status', dataType: 'string', required: false, description: 'Status' },
    { name: 'priority', dataType: 'string', required: false, description: 'Priority' },
    { name: 'project_id', dataType: 'string', required: true, description: 'Parent Project ID' },
    { name: 'story_points', dataType: 'integer', required: false, description: 'Story points' },
    { name: 'completed_points', dataType: 'integer', required: false, description: 'Completed points' },
    { name: 'target_pi', dataType: 'string', required: false, description: 'Target PI' },
    { name: 'wsjf_score', dataType: 'double', required: false, description: 'WSJF score' },
    { name: 'owner', dataType: 'string', required: false, description: 'Owner' },
  ],

  operations: [
    { type: 'createObject', objectTypeApiName: 'AtlasFeature' },
  ],
};

// ============================================================================
// LINK TYPES
// ============================================================================

export const FeatureLinks = {
  featureToProject: {
    apiName: 'featureProject',
    displayName: 'Parent Project',
    description: 'The project/epic this feature belongs to',
    fromObjectType: 'AtlasFeature',
    toObjectType: 'AtlasProject',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'projectId',
  },

  featureToStories: {
    apiName: 'featureStories',
    displayName: 'Feature Stories',
    description: 'Stories that implement this feature',
    fromObjectType: 'AtlasFeature',
    toObjectType: 'AtlasStory',
    cardinality: 'ONE_TO_MANY',
    foreignKey: 'featureId',
  },
};

// ============================================================================
// YAML FORMAT
// ============================================================================

export const AtlasFeatureYAML = `
objectTypes:
  AtlasFeature:
    apiName: AtlasFeature
    displayName: "[Atlas] Feature"
    description: "SAFe Feature - a service or capability"
    primaryKey:
      - featureId
    dataSource:
      type: phonograph
    properties:
      featureId:
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
      projectId:
        dataType: string
        required: true
      storyPoints:
        dataType: integer
      completedPoints:
        dataType: integer
      targetPi:
        dataType: string
      wsjfScore:
        dataType: double
      owner:
        dataType: string
      startDate:
        dataType: date
      targetDate:
        dataType: date
      source:
        dataType: string
      externalId:
        dataType: string
      syncedAt:
        dataType: timestamp
    icon:
      type: blueprint
      color: "#9B59B6"
      name: cube

actionTypes:
  atlas-create-feature:
    apiName: atlas-create-feature
    displayName: "Create Feature"
    parameters:
      - name: feature_id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: project_id
        dataType: string
        required: true
      - name: description
        dataType: string
      - name: status
        dataType: string
      - name: priority
        dataType: string
      - name: story_points
        dataType: integer
      - name: completed_points
        dataType: integer
    operations:
      - type: createObject
        objectTypeApiName: AtlasFeature
`;
