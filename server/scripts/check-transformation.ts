/**
 * Check AtlasTransformation object type structure
 */

import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const ps = getPalantirService();
  if (!ps) {
    console.log('No Palantir service configured');
    process.exit(1);
  }

  console.log('=== AtlasTransformation Object Type ===\n');

  try {
    const t = await ps.getObjectType('AtlasTransformation');
    console.log(JSON.stringify(t, null, 2));
  } catch (e: any) {
    console.error('Error:', e.message);
  }

  console.log('\n=== atlas-create-transformation Action ===\n');

  try {
    const actions = await ps.listActions();
    const createTrans = actions.find((a: any) => a.apiName === 'atlas-create-transformation');
    if (createTrans) {
      console.log(JSON.stringify(createTrans, null, 2));
    } else {
      console.log('Not found');
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
