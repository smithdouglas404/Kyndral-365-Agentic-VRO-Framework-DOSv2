/**
 * Test different formats for profit2023 Decimal field
 */

const token = process.env.PALANTIR_TOKEN!;
const host = `https://${process.env.PALANTIR_HOSTNAME || 'ssg.usw-17.palantirfoundry.com'}`;
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function testWithFormat(label: string, profit2023Value: any) {
  const params = {
    id: 'test-div-' + Date.now() + Math.random().toString(36).slice(2, 5),
    name: 'Test Division',
    head: 'Test Head',
    description: 'Test',
    color: '#4A90D9',
    changePercent: 10,
    portfolioId: 'default',
    profit2023: profit2023Value,
    profit2024: 150,
    source: 'nexus-ppm',
    syncedAt: new Date().toISOString(),
  };

  const response = await fetch(
    `${host}/api/v2/ontologies/${ontologyRid}/actions/create-atlas-division/apply`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parameters: params }),
    }
  );

  const text = await response.text();
  console.log(`${label}: Status ${response.status}`);
  if (response.status === 400) {
    const json = JSON.parse(text);
    console.log('  Error:', json.errorName || 'none');
  } else if (response.status === 200) {
    const json = JSON.parse(text);
    console.log('  Validation:', json.validation?.result || 'unknown');
    if (json.validation?.result === 'VALID') {
      console.log('  *** SUCCESS! ***');
    }
  }
}

async function main() {
  console.log('Testing different formats for profit2023 (Decimal type):\n');

  // Try different formats
  await testWithFormat('Integer (100)', 100);
  await testWithFormat('String ("100")', '100');
  await testWithFormat('String ("100.00")', '100.00');
  await testWithFormat('Float (100.50)', 100.50);
  await testWithFormat('Null', null);
  await testWithFormat('Zero (0)', 0);
}

main().catch(console.error);
