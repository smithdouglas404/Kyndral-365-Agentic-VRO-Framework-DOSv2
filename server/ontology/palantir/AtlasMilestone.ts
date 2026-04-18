/**
 * PALANTIR ONTOLOGY AS CODE SPECIFICATION
 * Object Type: AtlasMilestone
 *
 * A schedule milestone for a SAFe project: a dated checkpoint with a
 * status, used for on-time delivery and slip analysis.
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

export const AtlasMilestoneObjectType = {
  apiName: 'AtlasMilestone',
  displayName: '[Atlas] Milestone',
  description: 'A schedule milestone (checkpoint with a due date) for a project',

  dataSource: { type: 'phonograph' as const },

  primaryKey: ['milestoneId'],

  properties: {
    milestoneId: { dataType: 'string', description: 'Unique milestone ID', required: true },
    projectId: { dataType: 'string', description: 'Parent project ID', required: true },
    name: { dataType: 'string', description: 'Milestone name', required: true },
    description: { dataType: 'string', description: 'Description / scope' },
    status: { dataType: 'string', description: 'completed | in_progress | planned | at_risk | missed' },
    dueDate: { dataType: 'date', description: 'Planned due date' },
    completedDate: { dataType: 'date', description: 'Actual completion date' },
    expectedDate: { dataType: 'date', description: 'Forecast completion date if not completed' },
    owner: { dataType: 'string', description: 'Milestone owner' },
    gate: { dataType: 'string', description: 'Linked governance gate (planning/execution/closure)' },
    type: { dataType: 'string', description: 'Type: phase, release, gate, demo, audit' },
    source: { dataType: 'string', description: 'Source system (jira, openproject, monday, ingest)' },
    externalId: { dataType: 'string', description: 'External system ID' },
    syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
  },

  icon: { type: 'blueprint' as const, color: '#E67E22', name: 'flag' },

  status: 'ACTIVE',
};

export const CreateMilestoneAction = {
  apiName: 'atlas-create-milestone',
  displayName: 'Create Milestone',
  description: 'Create or update a project milestone',

  parameters: [
    { name: 'milestone_id', dataType: 'string', required: true },
    { name: 'project_id', dataType: 'string', required: true },
    { name: 'name', dataType: 'string', required: true },
    { name: 'description', dataType: 'string', required: false },
    { name: 'status', dataType: 'string', required: false },
    { name: 'due_date', dataType: 'date', required: false },
    { name: 'completed_date', dataType: 'date', required: false },
    { name: 'expected_date', dataType: 'date', required: false },
    { name: 'owner', dataType: 'string', required: false },
    { name: 'gate', dataType: 'string', required: false },
    { name: 'type', dataType: 'string', required: false },
    { name: 'source', dataType: 'string', required: false },
    { name: 'external_id', dataType: 'string', required: false },
  ],

  operations: [{ type: 'createObject', objectTypeApiName: 'AtlasMilestone' }],
};

export const MilestoneLinks = {
  milestoneToProject: {
    apiName: 'milestoneProject',
    displayName: 'Project',
    description: 'The project this milestone belongs to',
    fromObjectType: 'AtlasMilestone',
    toObjectType: 'AtlasProject',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'projectId',
  },
};

export const AtlasMilestoneYAML = `
objectTypes:
  AtlasMilestone:
    apiName: AtlasMilestone
    displayName: "[Atlas] Milestone"
    description: "A schedule milestone for a project"
    primaryKey:
      - milestoneId
    dataSource:
      type: phonograph
    properties:
      milestoneId:
        dataType: string
        required: true
      projectId:
        dataType: string
        required: true
      name:
        dataType: string
        required: true
      description:
        dataType: string
      status:
        dataType: string
      dueDate:
        dataType: date
      completedDate:
        dataType: date
      expectedDate:
        dataType: date
      owner:
        dataType: string
      gate:
        dataType: string
      type:
        dataType: string
      source:
        dataType: string
      externalId:
        dataType: string
      syncedAt:
        dataType: timestamp
    icon:
      type: blueprint
      color: "#E67E22"
      name: flag

actionTypes:
  atlas-create-milestone:
    apiName: atlas-create-milestone
    displayName: "Create Milestone"
    parameters:
      - name: milestone_id
        dataType: string
        required: true
      - name: project_id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: description
        dataType: string
      - name: status
        dataType: string
      - name: due_date
        dataType: date
      - name: completed_date
        dataType: date
      - name: expected_date
        dataType: date
      - name: owner
        dataType: string
      - name: gate
        dataType: string
      - name: type
        dataType: string
      - name: source
        dataType: string
      - name: external_id
        dataType: string
    operations:
      - type: createObject
        objectTypeApiName: AtlasMilestone
`;
