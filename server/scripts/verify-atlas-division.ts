/**
 * VERIFY ATLAS DIVISION
 *
 * Checks if AtlasDivision object type and related actions exist in Palantir Foundry.
 * Run this after deploying the OaC specification to verify deployment success.
 *
 * Usage: npx tsx server/scripts/verify-atlas-division.ts
 */

const token = process.env.PALANTIR_TOKEN;
const host = process.env.PALANTIR_HOSTNAME || 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

interface VerificationResult {
  item: string;
  status: 'exists' | 'missing' | 'error';
  details?: string;
}

async function checkEndpoint(url: string, description: string): Promise<VerificationResult> {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      return { item: description, status: 'exists', details: 'Found' };
    } else if (response.status === 404) {
      return { item: description, status: 'missing', details: 'Not found (404)' };
    } else {
      const text = await response.text();
      return { item: description, status: 'error', details: `HTTP ${response.status}: ${text.slice(0, 100)}` };
    }
  } catch (error: any) {
    return { item: description, status: 'error', details: error.message };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('ATLAS DIVISION VERIFICATION');
  console.log('Checking if AtlasDivision exists in Palantir Foundry');
  console.log('='.repeat(70));
  console.log('');

  if (!token) {
    console.error('ERROR: PALANTIR_TOKEN environment variable is not set');
    process.exit(1);
  }

  if (!ontologyRid) {
    console.error('ERROR: PALANTIR_ONTOLOGY_RID environment variable is not set');
    process.exit(1);
  }

  console.log(`Host: ${host}`);
  console.log(`Ontology: ${ontologyRid}`);
  console.log('');

  const baseUrl = host.replace(/\/$/, '');
  const results: VerificationResult[] = [];

  // Check AtlasDivision object type
  console.log('Checking object types...');
  results.push(
    await checkEndpoint(
      `${baseUrl}/api/v2/ontologies/${ontologyRid}/objectTypes/AtlasDivision`,
      'AtlasDivision Object Type'
    )
  );

  // Check related actions
  console.log('Checking action types...');
  const actionsToCheck = [
    'upsertDivision',
    'atlas-create-division',
  ];

  for (const action of actionsToCheck) {
    results.push(
      await checkEndpoint(
        `${baseUrl}/api/v2/ontologies/${ontologyRid}/actionTypes/${action}`,
        `Action: ${action}`
      )
    );
  }

  // Also check existing Atlas actions for reference
  console.log('Checking existing Atlas actions for reference...');
  const existingActions = [
    'atlas-create-project',
    'atlas-create-transformation',
    'atlas-create-risk',
  ];

  for (const action of existingActions) {
    results.push(
      await checkEndpoint(
        `${baseUrl}/api/v2/ontologies/${ontologyRid}/actionTypes/${action}`,
        `Reference: ${action}`
      )
    );
  }

  // Print results
  console.log('');
  console.log('='.repeat(70));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(70));
  console.log('');

  let allExist = true;
  let divisionExists = false;
  let upsertActionExists = false;

  for (const result of results) {
    const statusIcon =
      result.status === 'exists' ? '✓' : result.status === 'missing' ? '✗' : '!';
    const statusColor =
      result.status === 'exists' ? '\x1b[32m' : result.status === 'missing' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${statusColor}[${statusIcon}]${reset} ${result.item}`);
    if (result.details && result.status !== 'exists') {
      console.log(`    ${result.details}`);
    }

    if (result.item === 'AtlasDivision Object Type') {
      divisionExists = result.status === 'exists';
      if (result.status !== 'exists') allExist = false;
    }
    if (result.item === 'Action: upsertDivision') {
      upsertActionExists = result.status === 'exists';
      if (result.status !== 'exists') allExist = false;
    }
  }

  console.log('');
  console.log('='.repeat(70));

  if (divisionExists && upsertActionExists) {
    console.log('SUCCESS! AtlasDivision is deployed and ready to use.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update server/constants/palantirOntology.ts:');
    console.log("   - PALANTIR_OBJECT_TYPES.DIVISION = 'AtlasDivision'");
    console.log("   - PALANTIR_ACTIONS.UPSERT_DIVISION = 'upsertDivision'");
    console.log("   - PALANTIR_ACTIONS.CREATE_DIVISION = 'atlas-create-division'");
    console.log('');
    console.log('2. Run the sync: POST /api/palantir/sync/full');
  } else if (divisionExists && !upsertActionExists) {
    console.log('PARTIAL: AtlasDivision object type exists but actions are missing.');
    console.log('');
    console.log('Deploy the upsertDivision action from:');
    console.log('  server/ontology/palantir/AtlasDivision.ts');
  } else {
    console.log('NOT DEPLOYED: AtlasDivision needs to be created in Palantir.');
    console.log('');
    console.log('To deploy, follow instructions in:');
    console.log('  server/ontology/palantir/AtlasDivision.ts');
    console.log('');
    console.log('Options:');
    console.log('  1. Use Ontology as Code (recommended by your architect)');
    console.log('  2. Create manually in Palantir Builder UI');
    console.log('');
    console.log('The REST API v2 does NOT support creating object types (POST returns 404).');
  }

  console.log('='.repeat(70));
}

main().catch(console.error);
