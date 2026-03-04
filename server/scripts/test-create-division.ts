/**
 * Test creating AtlasDivision object type in Palantir
 */
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

async function test() {
  const palantir = getPalantirService();
  if (!palantir) {
    console.log('Palantir not configured');
    process.exit(1);
  }

  // Test list object types first
  const types = await palantir.listObjectTypes();
  console.log('Existing types:', types.map(t => t.apiName).join(', '));

  // Check if AtlasDivision already exists
  if (types.some(t => t.apiName === 'AtlasDivision')) {
    console.log('AtlasDivision already exists!');
    process.exit(0);
  }

  // Try to create AtlasDivision
  console.log('\nAttempting to create AtlasDivision...');
  try {
    const result = await palantir.createObjectType({
      apiName: 'AtlasDivision',
      displayName: '[Atlas] Division',
      description: 'Business Unit / Division / Segment',
      primaryKey: ['id'],
      properties: {
        id: { dataType: 'string', description: 'Division ID', required: true },
        name: { dataType: 'string', description: 'Division name', required: true },
        head: { dataType: 'string', description: 'Division Head / Leader' },
        description: { dataType: 'string', description: 'Description' },
        color: { dataType: 'string', description: 'Color code' },
        profit2023: { dataType: 'double', description: '2023 profit' },
        profit2024: { dataType: 'double', description: '2024 profit' },
        changePercent: { dataType: 'double', description: 'YoY change percent' },
        portfolioId: { dataType: 'string', description: 'Portfolio ID' },
        source: { dataType: 'string', description: 'Data source' },
        syncedAt: { dataType: 'timestamp', description: 'Last sync timestamp' },
      }
    });
    console.log('Created successfully:', result);
  } catch (error: any) {
    console.error('Failed to create AtlasDivision:', error.message);

    // Try alternative approach - direct API call with different format
    console.log('\nTrying alternative API format...');
  }

  process.exit(0);
}

test().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
