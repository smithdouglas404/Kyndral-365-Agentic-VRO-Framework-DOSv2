import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function main() {
  const ps = getPalantirService();
  if (!ps) {
    console.log('No Palantir service');
    process.exit(1);
  }

  // Check object type
  const objType = await ps.getObjectType('AtlasDivision');
  console.log('Primary Key:', objType.primaryKey);
  console.log('Properties:', Object.keys(objType.properties));

  // List objects
  const objs = await ps.listObjects('AtlasDivision', { pageSize: 10 });
  console.log('Objects found:', objs.data?.length || 0);
  if (objs.data?.length > 0) {
    console.log('First object:', JSON.stringify(objs.data[0], null, 2));
  }
}
main().catch(console.error);

export {};
