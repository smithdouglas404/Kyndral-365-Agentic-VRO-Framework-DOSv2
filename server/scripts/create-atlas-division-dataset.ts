/**
 * CREATE ATLAS DIVISION WITH DATASET BACKING
 *
 * Creates a dataset-backed AtlasDivision object type in Palantir.
 * Step 1: Create or find a dataset
 * Step 2: Create object type backed by that dataset
 */

const token = process.env.PALANTIR_TOKEN;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID;

async function request(method: string, path: string, body?: any): Promise<any> {
  const url = host + path;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function findOrCreateFolder(): Promise<string | null> {
  console.log('Step 1: Finding a folder to create dataset in...\n');

  // Try to list projects/folders
  const endpoints = [
    '/api/v2/filesystem/projects',
    '/api/v1/compass/folders',
    '/compass/api/folders',
  ];

  for (const ep of endpoints) {
    try {
      console.log('GET ' + ep);
      const response = await fetch(host + ep, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('  Status: ' + response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('  Data: ' + JSON.stringify(data).slice(0, 200));
        if (data.data && data.data[0]?.rid) {
          return data.data[0].rid;
        }
        if (data.values && data.values[0]?.rid) {
          return data.values[0].rid;
        }
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }

  return null;
}

async function getDatasetSchema(datasetRid: string): Promise<Record<string, string> | null> {
  console.log('\nGetting schema for dataset: ' + datasetRid);

  try {
    const response = await fetch(host + '/api/v1/datasets/' + datasetRid + '/schema', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!response.ok) {
      console.log('  Schema fetch failed: ' + response.status);
      return null;
    }

    const data = await response.json();
    const fields = data.fieldSchemaList || [];

    const typeMap: Record<string, string> = {
      'string': 'string',
      'double': 'double',
      'int': 'integer',
      'integer': 'integer',
      'boolean': 'boolean',
      'timestamp': 'timestamp',
      'date': 'date',
    };

    const schema: Record<string, string> = {};
    for (const f of fields) {
      const fType = (f.type || 'string').toLowerCase();
      schema[f.name] = typeMap[fType] || 'string';
    }

    console.log('  Schema: ' + JSON.stringify(schema));
    return schema;
  } catch (e: any) {
    console.log('  Error: ' + e.message);
    return null;
  }
}

async function createDataset(parentFolderRid: string, name: string): Promise<string | null> {
  console.log('\nStep 2: Creating dataset "' + name + '"...');

  const payload = {
    name: name,
    parentFolderRid: parentFolderRid,
  };

  try {
    const response = await fetch(host + '/api/v2/datasets', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('  Status: ' + response.status);
    const text = await response.text();
    console.log('  Response: ' + text.slice(0, 300));

    if (response.ok) {
      const data = JSON.parse(text);
      return data.rid;
    }
  } catch (e: any) {
    console.log('  Error: ' + e.message);
  }

  return null;
}

async function createObjectTypeWithDataset(datasetRid: string): Promise<boolean> {
  console.log('\nStep 3: Creating AtlasDivision object type with dataset backing...');

  // Define the schema
  const properties: Record<string, { type: string }> = {
    id: { type: 'string' },
    name: { type: 'string' },
    head: { type: 'string' },
    description: { type: 'string' },
    color: { type: 'string' },
    profit2023: { type: 'double' },
    profit2024: { type: 'double' },
    changePercent: { type: 'double' },
    portfolioId: { type: 'string' },
    source: { type: 'string' },
    syncedAt: { type: 'string' },
  };

  // Column mapping (same names)
  const columnMapping: Record<string, string> = {};
  for (const col of Object.keys(properties)) {
    columnMapping[col] = col;
  }

  const payload = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    primaryKey: 'id',
    properties: properties,
    dataSource: {
      type: 'dataset',
      datasetRid: datasetRid,
      columnMapping: columnMapping,
    },
  };

  console.log('POST /api/v2/ontologies/' + ontologyRid + '/objectTypes');
  console.log('Payload: ' + JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(host + '/api/v2/ontologies/' + ontologyRid + '/objectTypes', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Status: ' + response.status);
    const text = await response.text();
    console.log('Response: ' + text);

    return response.ok;
  } catch (e: any) {
    console.log('Error: ' + e.message);
    return false;
  }
}

async function tryPhonographApproach(): Promise<boolean> {
  console.log('\n=== Trying Phonograph approach (no dataset) ===\n');

  // Try creating with phonograph data source
  const payload = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    primaryKey: ['id'],
    status: 'EXPERIMENTAL',
    properties: {
      id: { displayName: 'ID', dataType: { type: 'string' } },
      name: { displayName: 'Name', dataType: { type: 'string' } },
      head: { displayName: 'Head', dataType: { type: 'string' } },
      description: { displayName: 'Description', dataType: { type: 'string' } },
    },
    titleProperty: 'name',
    icon: {
      type: 'blueprint',
      color: '#4A90D9',
      name: 'office',
    },
  };

  // Try multiple endpoints
  const endpoints = [
    '/api/v2/ontologies/' + ontologyRid + '/objectTypes',
    '/ontology-metadata/api/ontologies/' + ontologyRid + '/objectTypes',
    '/phonograph2/api/ontologies/' + ontologyRid + '/objectTypes',
    '/foundry-metadata/api/ontology/objectTypes',
  ];

  for (const ep of endpoints) {
    console.log('POST ' + host + ep);
    try {
      const response = await fetch(host + ep, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('  Status: ' + response.status);
      const text = await response.text();
      if (text && !text.includes('<!DOCTYPE')) {
        console.log('  Response: ' + text.slice(0, 300));
      }

      if (response.ok) {
        console.log('\n*** SUCCESS ***');
        return true;
      }
    } catch (e: any) {
      console.log('  Error: ' + e.message);
    }
  }

  return false;
}

async function main() {
  console.log('='.repeat(70));
  console.log('CREATE ATLAS DIVISION OBJECT TYPE');
  console.log('='.repeat(70));
  console.log('');

  // First try phonograph approach
  if (await tryPhonographApproach()) {
    console.log('\nAtlasDivision created successfully via Phonograph!');
    return;
  }

  // Try dataset-backed approach
  console.log('\n=== Trying dataset-backed approach ===\n');

  const folderRid = await findOrCreateFolder();

  if (folderRid) {
    console.log('\nFound folder: ' + folderRid);

    const datasetRid = await createDataset(folderRid, 'atlas_divisions');

    if (datasetRid) {
      console.log('\nCreated dataset: ' + datasetRid);

      const success = await createObjectTypeWithDataset(datasetRid);

      if (success) {
        console.log('\n*** SUCCESS! AtlasDivision created! ***');
        return;
      }
    }
  }

  console.log('\n=== MANUAL STEPS REQUIRED ===');
  console.log('\nThe API cannot create Phonograph-backed object types.');
  console.log('Please create AtlasDivision in Palantir Builder UI:');
  console.log('');
  console.log('1. Go to Palantir Foundry > Ontology Manager');
  console.log('2. Create new Object Type:');
  console.log('   - API Name: AtlasDivision');
  console.log('   - Display Name: [Atlas] Division');
  console.log('   - Primary Key: id');
  console.log('   - Properties: id, name, head, description, color, profit2023, profit2024');
  console.log('3. Create action type:');
  console.log('   - API Name: atlas-create-division');
  console.log('   - Creates: AtlasDivision');
}

main().catch(console.error);

export {};
