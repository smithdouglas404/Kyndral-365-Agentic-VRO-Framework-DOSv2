/**
 * Test sync parameters for each object type
 */

const token = process.env.PALANTIR_TOKEN!;
const host = `https://${process.env.PALANTIR_HOSTNAME || 'ssg.usw-17.palantirfoundry.com'}`;
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

async function testAction(label: string, actionName: string, params: Record<string, any>) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${label}`);
  console.log(`Action: ${actionName}`);
  console.log(`${'='.repeat(60)}`);

  const response = await fetch(
    `${host}/api/v2/ontologies/${ontologyRid}/actions/${actionName}/apply`,
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
  console.log(`Status: ${response.status}`);

  if (response.status === 200) {
    const json = JSON.parse(text);
    if (json.validation?.result === 'VALID') {
      console.log('✓ VALID - Parameters accepted!');
      return true;
    } else {
      console.log('✗ INVALID - Check parameters:');
      for (const [key, val] of Object.entries(json.validation?.parameters || {})) {
        const v = val as any;
        if (v.result === 'INVALID') {
          console.log(`  - ${key}: ${v.result}`);
        }
      }
    }
  } else {
    const json = JSON.parse(text);
    console.log(`✗ ERROR: ${json.errorName}`);
    if (json.parameters) {
      console.log('  Details:', JSON.stringify(json.parameters));
    }
  }
  return false;
}

async function main() {
  let passed = 0;
  let total = 0;

  // Test Agent (uses atlas-create-project)
  total++;
  if (await testAction('Agent', 'atlas-create-project', {
    project_id: `agent-test-${Date.now()}`,
    name: '[Agent] Test Agent',
    status: 'active',
    description: 'Test agent',
    created_at: new Date().toISOString(),
  })) passed++;

  // Test Agent Attribute (uses atlas-create-insight)
  total++;
  if (await testAction('Agent Attribute', 'atlas-create-insight', {
    insight_id: `attr-test-${Date.now()}`,
    title: '[Attribute] Test Attribute',
    description: 'Current: 50, Target: 100 %',
    insight_type: 'agent_attribute',
    created_at: new Date().toISOString(),
  })) passed++;

  // Test Feature (uses atlas-create-insight)
  total++;
  if (await testAction('Feature', 'atlas-create-insight', {
    insight_id: `feature-test-${Date.now()}`,
    title: '[Feature] Test Feature',
    description: 'Test feature description',
    insight_type: 'feature',
    status: 'backlog',
    created_at: new Date().toISOString(),
  })) passed++;

  // Test Story (uses atlas-create-project)
  total++;
  if (await testAction('Story', 'atlas-create-project', {
    project_id: `story-test-${Date.now()}`,
    name: '[Story] Test Story',
    status: 'backlog',
    description: 'Test story description',
    created_at: new Date().toISOString(),
  })) passed++;

  // Test KPI (uses atlas-create-kpi)
  total++;
  if (await testAction('KPI', 'atlas-create-kpi', {
    kpi_id: `kpi-test-${Date.now()}`,
    name: 'Test KPI',
    description: 'Division: test, Unit: %, Trend: stable',
    current_value: 50,
    target_value: 100,
    unit: '%',
    status: 'On Track',
    created_at: new Date().toISOString(),
  })) passed++;

  // Test OKR (uses atlas-create-objective)
  total++;
  if (await testAction('OKR', 'atlas-create-objective', {
    objective_id: `okr-test-${Date.now()}`,
    name: 'Test Objective',
    status: 'active',
    description: 'Owner: TBD, Progress: 50%',
    created_at: new Date().toISOString(),
  })) passed++;

  // Test Risk (uses atlas-create-risk)
  total++;
  if (await testAction('Risk', 'atlas-create-risk', {
    risk_id: `risk-test-${Date.now()}`,
    description: 'Test Risk: Test description',
    impact: 'medium',
    probability: 'possible',
    status: 'open',
    risk_score: 0,
    created_at: new Date().toISOString(),
  })) passed++;

  // Test Division (uses create-atlas-division) - This will fail due to decimal type
  total++;
  if (await testAction('Division', 'create-atlas-division', {
    id: `div-test-${Date.now()}`,
    name: 'Test Division',
    head: 'Test Head',
    description: 'Test description',
    color: '#4A90D9',
    changePercent: 10.0,
    portfolioId: 'default',
    profit2023: 100.0, // This will fail - Decimal type not supported
    profit2024: 150.0,
    source: 'nexus-ppm',
    syncedAt: new Date().toISOString(),
  })) passed++;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY: ${passed}/${total} passed`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
