/**
 * PALANTIR ONTOLOGY AS CODE SPECIFICATION
 * Object Type: AtlasResource
 *
 * A person (or named role) allocated to one or more SAFe projects.
 * Allocations are summed across projects to detect over/under-utilisation.
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

export const AtlasResourceObjectType = {
  apiName: 'AtlasResource',
  displayName: '[Atlas] Resource',
  description: 'A person or named role allocated to one or more projects',

  dataSource: { type: 'phonograph' as const },

  primaryKey: ['resourceId'],

  properties: {
    resourceId: { dataType: 'string', description: 'Unique resource ID', required: true },
    name: { dataType: 'string', description: 'Resource / person name', required: true },
    role: { dataType: 'string', description: 'Role (Lead, Engineer, PM, etc.)' },
    projectId: { dataType: 'string', description: 'Project this allocation belongs to', required: true },
    allocation: { dataType: 'integer', description: 'Allocation percentage (0-200)' },
    skills: { dataType: 'string', description: 'JSON array of skills' },
    email: { dataType: 'string', description: 'Email address' },
    department: { dataType: 'string', description: 'Department / business unit' },
    costRate: { dataType: 'double', description: 'Hourly / daily cost rate' },
    startDate: { dataType: 'date', description: 'Allocation start date' },
    endDate: { dataType: 'date', description: 'Allocation end date' },
    source: { dataType: 'string', description: 'Source system (jira, openproject, monday, ingest)' },
    externalId: { dataType: 'string', description: 'External system ID' },
    syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
  },

  icon: { type: 'blueprint' as const, color: '#16A085', name: 'person' },

  status: 'ACTIVE',
};

export const CreateResourceAction = {
  apiName: 'atlas-create-resource',
  displayName: 'Create Resource',
  description: 'Create or update a resource allocation',

  parameters: [
    { name: 'resource_id', dataType: 'string', required: true },
    { name: 'name', dataType: 'string', required: true },
    { name: 'project_id', dataType: 'string', required: true },
    { name: 'role', dataType: 'string', required: false },
    { name: 'allocation', dataType: 'integer', required: false },
    { name: 'email', dataType: 'string', required: false },
    { name: 'department', dataType: 'string', required: false },
    { name: 'cost_rate', dataType: 'double', required: false },
    { name: 'start_date', dataType: 'date', required: false },
    { name: 'end_date', dataType: 'date', required: false },
    { name: 'source', dataType: 'string', required: false },
    { name: 'external_id', dataType: 'string', required: false },
  ],

  operations: [{ type: 'createObject', objectTypeApiName: 'AtlasResource' }],
};

export const ResourceLinks = {
  resourceToProject: {
    apiName: 'resourceProject',
    displayName: 'Allocated To',
    description: 'The project this resource is allocated to',
    fromObjectType: 'AtlasResource',
    toObjectType: 'AtlasProject',
    cardinality: 'MANY_TO_ONE',
    foreignKey: 'projectId',
  },
};

export const AtlasResourceYAML = `
objectTypes:
  AtlasResource:
    apiName: AtlasResource
    displayName: "[Atlas] Resource"
    description: "A person or role allocated to one or more projects"
    primaryKey:
      - resourceId
    dataSource:
      type: phonograph
    properties:
      resourceId:
        dataType: string
        required: true
      name:
        dataType: string
        required: true
      role:
        dataType: string
      projectId:
        dataType: string
        required: true
      allocation:
        dataType: integer
      skills:
        dataType: string
      email:
        dataType: string
      department:
        dataType: string
      costRate:
        dataType: double
      startDate:
        dataType: date
      endDate:
        dataType: date
      source:
        dataType: string
      externalId:
        dataType: string
      syncedAt:
        dataType: timestamp
    icon:
      type: blueprint
      color: "#16A085"
      name: person

actionTypes:
  atlas-create-resource:
    apiName: atlas-create-resource
    displayName: "Create Resource"
    parameters:
      - name: resource_id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: project_id
        dataType: string
        required: true
      - name: role
        dataType: string
      - name: allocation
        dataType: integer
      - name: email
        dataType: string
      - name: department
        dataType: string
      - name: cost_rate
        dataType: double
      - name: start_date
        dataType: date
      - name: end_date
        dataType: date
      - name: source
        dataType: string
      - name: external_id
        dataType: string
    operations:
      - type: createObject
        objectTypeApiName: AtlasResource
`;
