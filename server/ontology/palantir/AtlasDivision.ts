/**
 * PALANTIR ONTOLOGY AS CODE SPECIFICATION
 * Object Type: AtlasDivision
 *
 * This file defines the AtlasDivision object type for Palantir Foundry.
 * To deploy this to Palantir, add this definition to your Ontology as Code repository
 * and deploy through the Palantir CI/CD pipeline.
 *
 * Domain Model:
 * - AtlasDivision: Business Unit / Division / Segment (organizational structure)
 * - AtlasTransformation: TMO / PMO / VRO offices (NOT divisions)
 * - AtlasProject (with Epic): Value Streams are EPICs within Projects
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

// ============================================================================
// TYPE DEFINITION (for Palantir Ontology as Code)
// ============================================================================

export const AtlasDivisionObjectType = {
  apiName: 'AtlasDivision',
  displayName: '[Atlas] Division',
  description: 'Business Unit / Division / Segment (NOT Value Stream - EPICs are Value Streams)',

  // Phonograph-backed (no external dataset required)
  dataSource: {
    type: 'phonograph' as const,
  },

  primaryKey: ['id'],

  properties: {
    id: {
      dataType: 'string',
      description: 'Unique Division ID',
      required: true,
    },
    name: {
      dataType: 'string',
      description: 'Division name',
      required: true,
    },
    head: {
      dataType: 'string',
      description: 'Division Head / Leader',
    },
    description: {
      dataType: 'string',
      description: 'Division description',
    },
    color: {
      dataType: 'string',
      description: 'Color code for UI display (hex)',
    },
    profit2023: {
      dataType: 'double',
      description: '2023 profit in USD',
    },
    profit2024: {
      dataType: 'double',
      description: '2024 profit in USD',
    },
    changePercent: {
      dataType: 'double',
      description: 'Year-over-year change percentage',
    },
    portfolioId: {
      dataType: 'string',
      description: 'Parent Portfolio ID',
    },
    source: {
      dataType: 'string',
      description: 'Data source system',
    },
    syncedAt: {
      dataType: 'timestamp',
      description: 'Last sync timestamp',
    },
  },

  // Icon configuration
  icon: {
    type: 'blueprint' as const,
    color: '#4A90D9',
    name: 'office',
  },

  // Visibility
  status: 'ACTIVE',
};

// ============================================================================
// ACTION TYPES (for Palantir Ontology as Code)
// ============================================================================

export const UpsertDivisionAction = {
  apiName: 'upsertDivision',
  displayName: 'Upsert Division',
  description: 'Create or update a division record',

  parameters: [
    { name: 'primaryKey', dataType: 'string', required: true, description: 'Primary key for upsert' },
    { name: 'id', dataType: 'string', required: true, description: 'Division ID' },
    { name: 'name', dataType: 'string', required: true, description: 'Division name' },
    { name: 'head', dataType: 'string', required: false, description: 'Division head/leader' },
    { name: 'description', dataType: 'string', required: false, description: 'Description' },
    { name: 'color', dataType: 'string', required: false, description: 'Color code' },
    { name: 'profit2023', dataType: 'double', required: false, description: '2023 profit' },
    { name: 'profit2024', dataType: 'double', required: false, description: '2024 profit' },
    { name: 'changePercent', dataType: 'double', required: false, description: 'YoY change %' },
    { name: 'portfolioId', dataType: 'string', required: false, description: 'Portfolio ID' },
    { name: 'source', dataType: 'string', required: false, description: 'Data source' },
  ],

  operations: [
    { type: 'createObject', objectTypeApiName: 'AtlasDivision' },
  ],
};

export const CreateDivisionAction = {
  apiName: 'atlas-create-division',
  displayName: 'Create Division',
  description: 'Create a new division',

  parameters: [
    { name: 'division_id', dataType: 'string', required: true, description: 'Division ID' },
    { name: 'name', dataType: 'string', required: true, description: 'Division name' },
    { name: 'head', dataType: 'string', required: false, description: 'Division head' },
    { name: 'description', dataType: 'string', required: false, description: 'Description' },
  ],

  operations: [
    { type: 'createObject', objectTypeApiName: 'AtlasDivision' },
  ],
};

// ============================================================================
// LINK TYPES (relationships)
// ============================================================================

export const DivisionLinks = {
  // Division contains Projects
  divisionToProjects: {
    apiName: 'divisionProjects',
    displayName: 'Division Projects',
    description: 'Projects belonging to this division',
    fromObjectType: 'AtlasDivision',
    toObjectType: 'AtlasProject',
    cardinality: 'ONE_TO_MANY',
    foreignKey: 'divisionId',
  },

  // Division has KPIs
  divisionToKPIs: {
    apiName: 'divisionKPIs',
    displayName: 'Division KPIs',
    description: 'KPIs tracked for this division',
    fromObjectType: 'AtlasDivision',
    toObjectType: 'AtlasKpi',
    cardinality: 'ONE_TO_MANY',
    foreignKey: 'divisionId',
  },

  // Division has OKRs
  divisionToOKRs: {
    apiName: 'divisionOKRs',
    displayName: 'Division OKRs',
    description: 'OKRs for this division',
    fromObjectType: 'AtlasDivision',
    toObjectType: 'AtlasObjective',
    cardinality: 'ONE_TO_MANY',
    foreignKey: 'divisionId',
  },
};

// ============================================================================
// YAML FORMAT (Alternative OaC format)
// ============================================================================

export const AtlasDivisionYAML = `
# AtlasDivision Object Type Definition
# Copy this to your Palantir Ontology as Code repository

objectTypes:
  AtlasDivision:
    apiName: AtlasDivision
    displayName: "[Atlas] Division"
    description: "Business Unit / Division / Segment"
    primaryKey:
      - id
    dataSource:
      type: phonograph
    properties:
      id:
        dataType: string
        required: true
        description: "Unique Division ID"
      name:
        dataType: string
        required: true
        description: "Division name"
      head:
        dataType: string
        description: "Division Head / Leader"
      description:
        dataType: string
        description: "Division description"
      color:
        dataType: string
        description: "Color code (hex)"
      profit2023:
        dataType: double
        description: "2023 profit"
      profit2024:
        dataType: double
        description: "2024 profit"
      changePercent:
        dataType: double
        description: "YoY change %"
      portfolioId:
        dataType: string
        description: "Parent Portfolio ID"
      source:
        dataType: string
        description: "Data source"
      syncedAt:
        dataType: timestamp
        description: "Last sync"
    icon:
      type: blueprint
      color: "#4A90D9"
      name: office

actionTypes:
  upsertDivision:
    apiName: upsertDivision
    displayName: "Upsert Division"
    description: "Create or update a division"
    parameters:
      - name: primaryKey
        dataType: string
        required: true
      - name: id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: head
        dataType: string
      - name: description
        dataType: string
    operations:
      - type: createObject
        objectTypeApiName: AtlasDivision

  atlas-create-division:
    apiName: atlas-create-division
    displayName: "Create Division"
    description: "Create a new division"
    parameters:
      - name: division_id
        dataType: string
        required: true
      - name: name
        dataType: string
        required: true
      - name: head
        dataType: string
      - name: description
        dataType: string
    operations:
      - type: createObject
        objectTypeApiName: AtlasDivision
`;

// ============================================================================
// DEPLOYMENT INSTRUCTIONS
// ============================================================================

export const DeploymentInstructions = `
# AtlasDivision Deployment Instructions

## Prerequisites
1. Access to your Palantir Foundry Ontology as Code repository
2. CI/CD pipeline configured for ontology deployments

## Steps to Deploy

### Option 1: TypeScript OaC
1. Copy AtlasDivisionObjectType, UpsertDivisionAction, and CreateDivisionAction
   from this file to your OaC repository
2. Import and register in your ontology configuration
3. Run the OaC build: \`npm run build\`
4. Deploy via CI/CD: \`npm run deploy\`

### Option 2: YAML OaC
1. Copy the YAML content from AtlasDivisionYAML to your ontology definitions
2. Run validation: \`palantir-ontology validate\`
3. Deploy via CI/CD

### Option 3: Palantir Builder UI
1. Navigate to your Foundry workspace
2. Open Ontology Manager
3. Create new Object Type with the properties listed above
4. Create the action types

## After Deployment
1. Verify AtlasDivision exists: GET /api/v2/ontologies/{rid}/objectTypes/AtlasDivision
2. Verify actions exist: GET /api/v2/ontologies/{rid}/actionTypes
3. Update constants in server/constants/palantirOntology.ts:
   - Change DIVISION: 'AtlasDivision'
   - Change UPSERT_DIVISION: 'upsertDivision'
   - Change CREATE_DIVISION: 'atlas-create-division'
4. Run sync: POST /api/palantir/sync/full

## Verification Script
Run: npx tsx server/scripts/verify-atlas-division.ts
`;
