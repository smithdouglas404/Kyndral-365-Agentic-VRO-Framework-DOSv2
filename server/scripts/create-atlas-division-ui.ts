/**
 * ATLAS DIVISION CREATION GUIDE
 *
 * The Palantir REST API v2 does NOT support creating Phonograph-backed object types.
 * All 26 existing types (AtlasProject, AtlasTransformation, etc.) were created through
 * the Palantir Builder UI or Ontology-as-Code CI/CD pipeline.
 *
 * This script provides the EXACT specification needed to create AtlasDivision
 * through the Palantir Builder interface.
 *
 * USAGE:
 * 1. Run this script to see the specification
 * 2. Open Palantir Builder
 * 3. Create the object type and action following these specs
 * 4. Run the verification to confirm it's working
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';

const OBJECT_TYPE_SPEC = {
  apiName: 'AtlasDivision',
  displayName: '[Atlas] Division',
  description: 'Business Unit / Division / Segment (NOT Value Stream - EPICs are Value Streams)',
  pluralDisplayName: '[Atlas] Divisions',
  status: 'EXPERIMENTAL',
  icon: {
    type: 'blueprint',
    color: '#4A90D9',
    name: 'office',
  },
  primaryKey: 'id',
  titleProperty: 'name',
  properties: [
    { apiName: 'id', displayName: 'ID', dataType: 'string', description: 'Unique Division ID', required: true },
    { apiName: 'name', displayName: 'Name', dataType: 'string', description: 'Division name', required: true },
    { apiName: 'head', displayName: 'Head', dataType: 'string', description: 'Division Head / Leader' },
    { apiName: 'description', displayName: 'Description', dataType: 'string', description: 'Division description' },
    { apiName: 'color', displayName: 'Color', dataType: 'string', description: 'Color code (hex)' },
    { apiName: 'profit2023', displayName: '2023 Profit', dataType: 'double', description: '2023 profit in millions' },
    { apiName: 'profit2024', displayName: '2024 Profit', dataType: 'double', description: '2024 profit in millions' },
    { apiName: 'changePercent', displayName: 'YoY Change %', dataType: 'double', description: 'Year-over-year change percentage' },
    { apiName: 'portfolioId', displayName: 'Portfolio ID', dataType: 'string', description: 'Parent Portfolio ID' },
    { apiName: 'source', displayName: 'Source', dataType: 'string', description: 'Data source system' },
    { apiName: 'syncedAt', displayName: 'Synced At', dataType: 'timestamp', description: 'Last sync timestamp' },
  ],
};

const ACTION_SPEC = {
  apiName: 'atlas-create-division',
  displayName: '[Atlas] Create Division',
  description: 'Create a new division / business unit',
  parameters: [
    { name: 'division_id', displayName: 'Division ID', dataType: 'string', required: true, description: 'Unique Division ID' },
    { name: 'name', displayName: 'Name', dataType: 'string', required: true, description: 'Division name' },
    { name: 'head', displayName: 'Head', dataType: 'string', required: false, description: 'Division head/leader' },
    { name: 'description', displayName: 'Description', dataType: 'string', required: false, description: 'Description' },
    { name: 'color', displayName: 'Color', dataType: 'string', required: false, description: 'Color code' },
    { name: 'profit_2023', displayName: '2023 Profit', dataType: 'double', required: false, description: '2023 profit' },
    { name: 'profit_2024', displayName: '2024 Profit', dataType: 'double', required: false, description: '2024 profit' },
    { name: 'change_percent', displayName: 'YoY Change', dataType: 'double', required: false, description: 'YoY change %' },
    { name: 'portfolio_id', displayName: 'Portfolio ID', dataType: 'string', required: false, description: 'Portfolio ID' },
  ],
  operation: {
    type: 'createObject',
    objectTypeApiName: 'AtlasDivision',
  },
};

async function main() {
  console.log('='.repeat(70));
  console.log('ATLAS DIVISION CREATION SPECIFICATION');
  console.log('='.repeat(70));
  console.log('\n*** IMPORTANT: Palantir REST API v2 cannot create object types ***');
  console.log('*** You must create AtlasDivision through the Palantir Builder UI ***\n');

  // Check current state
  const ps = getPalantirService();
  if (!ps) {
    console.log('ERROR: Palantir service not configured');
    process.exit(1);
  }

  console.log('Checking current Palantir state...\n');

  // Check if AtlasDivision exists
  try {
    await ps.getObjectType('AtlasDivision');
    console.log('*** AtlasDivision ALREADY EXISTS! ***');
    console.log('You can skip to verification.\n');
    return;
  } catch (e: any) {
    if (e.message.includes('404')) {
      console.log('AtlasDivision does NOT exist yet. Follow the steps below.\n');
    } else {
      console.log(`Error checking: ${e.message}\n`);
    }
  }

  // Print specification
  console.log('='.repeat(70));
  console.log('STEP 1: Create Object Type in Palantir Builder');
  console.log('='.repeat(70));
  console.log('\nGo to: https://ssg.usw-17.palantirfoundry.com');
  console.log('Navigate to: Ontology Manager > Create Object Type\n');
  console.log('Use these values:\n');
  console.log(`  API Name:        ${OBJECT_TYPE_SPEC.apiName}`);
  console.log(`  Display Name:    ${OBJECT_TYPE_SPEC.displayName}`);
  console.log(`  Description:     ${OBJECT_TYPE_SPEC.description}`);
  console.log(`  Plural Name:     ${OBJECT_TYPE_SPEC.pluralDisplayName}`);
  console.log(`  Primary Key:     ${OBJECT_TYPE_SPEC.primaryKey}`);
  console.log(`  Title Property:  ${OBJECT_TYPE_SPEC.titleProperty}`);
  console.log(`  Icon Type:       ${OBJECT_TYPE_SPEC.icon.type}`);
  console.log(`  Icon Name:       ${OBJECT_TYPE_SPEC.icon.name}`);
  console.log(`  Icon Color:      ${OBJECT_TYPE_SPEC.icon.color}`);
  console.log('\nProperties to add:\n');

  for (const prop of OBJECT_TYPE_SPEC.properties) {
    console.log(`  ${prop.apiName}:`);
    console.log(`    Display Name: ${prop.displayName}`);
    console.log(`    Data Type:    ${prop.dataType}`);
    console.log(`    Description:  ${prop.description}`);
    if (prop.required) console.log(`    Required:     YES`);
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('STEP 2: Create Action Type in Palantir Builder');
  console.log('='.repeat(70));
  console.log('\nNavigate to: Ontology Manager > Create Action Type\n');
  console.log('Use these values:\n');
  console.log(`  API Name:        ${ACTION_SPEC.apiName}`);
  console.log(`  Display Name:    ${ACTION_SPEC.displayName}`);
  console.log(`  Description:     ${ACTION_SPEC.description}`);
  console.log(`  Operation:       Create Object`);
  console.log(`  Object Type:     ${ACTION_SPEC.operation.objectTypeApiName}`);
  console.log('\nParameters to add:\n');

  for (const param of ACTION_SPEC.parameters) {
    console.log(`  ${param.name}:`);
    console.log(`    Display Name: ${param.displayName}`);
    console.log(`    Data Type:    ${param.dataType}`);
    console.log(`    Required:     ${param.required ? 'YES' : 'NO'}`);
    console.log(`    Description:  ${param.description}`);
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('STEP 3: Verify Creation');
  console.log('='.repeat(70));
  console.log('\nAfter creating in Palantir Builder, run:');
  console.log('  npx tsx server/scripts/verify-atlas-division.ts');
  console.log('');
  console.log('This will confirm AtlasDivision is accessible via API.');
  console.log('');
  console.log('='.repeat(70));
  console.log('STEP 4: Update Code');
  console.log('='.repeat(70));
  console.log('\nOnce verified, update server/constants/palantirOntology.ts:');
  console.log('  Set DIVISION: "AtlasDivision"');
  console.log('  Set UPSERT_DIVISION: "upsertDivision" (or whatever action you create)');
  console.log('  Set CREATE_DIVISION: "atlas-create-division"');
  console.log('');
  console.log('Then run: npm run build && npm run dev');
  console.log('='.repeat(70));
}

main().catch(console.error);
