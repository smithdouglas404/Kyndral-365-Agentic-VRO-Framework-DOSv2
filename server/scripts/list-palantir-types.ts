/**
 * List all object types and actions in Palantir
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const ps = getPalantirService();
  if (!ps) {
    console.log('No Palantir service configured');
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('PALANTIR ONTOLOGY CONTENTS');
  console.log('='.repeat(70));

  // List object types
  const types = await ps.listObjectTypes();
  console.log('\n=== OBJECT TYPES (' + types.length + ') ===\n');
  for (const t of types) {
    console.log('  ' + t.apiName);
  }

  // List actions
  const actions = await ps.listActions();
  console.log('\n=== ACTIONS (' + actions.length + ') ===\n');
  for (const a of actions) {
    console.log('  ' + a.apiName);
  }

  // Check for AtlasDivision specifically
  console.log('\n=== CHECKING FOR ATLASDIVISION ===\n');
  try {
    const div = await ps.getObjectType('AtlasDivision');
    console.log('AtlasDivision EXISTS:', JSON.stringify(div, null, 2));
  } catch (e: any) {
    console.log('AtlasDivision NOT FOUND:', e.message);
  }

  // Check for atlas-create-division action
  console.log('\n=== CHECKING FOR DIVISION ACTIONS ===\n');
  const divisionActions = actions.filter((a: any) =>
    a.apiName.toLowerCase().includes('division') ||
    a.apiName.toLowerCase().includes('upsertdivision')
  );
  if (divisionActions.length > 0) {
    console.log('Division-related actions found:');
    for (const a of divisionActions) {
      console.log('  ' + a.apiName);
    }
  } else {
    console.log('No division-related actions found');
  }

  console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
