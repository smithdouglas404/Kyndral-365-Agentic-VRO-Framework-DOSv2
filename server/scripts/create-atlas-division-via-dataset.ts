/**
 * CREATE ATLAS DIVISION VIA DATASET API
 *
 * Uses the Palantir Datasets API to:
 * 1. Create a dataset to back the AtlasDivision object type
 * 2. Upload initial schema/data
 * 3. Create the object type backed by this dataset
 */

const token = process.env.PALANTIR_TOKEN!;
const host = 'https://ssg.usw-17.palantirfoundry.com';
const ontologyRid = process.env.PALANTIR_ONTOLOGY_RID!;

interface DatasetResponse {
  rid: string;
  name: string;
  parentFolderRid?: string;
}

async function request(method: string, path: string, body?: any): Promise<any> {
  const url = host + path;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  console.log(`${method} ${path} -> ${response.status}`);

  if (!response.ok) {
    console.log(`  Error: ${text.slice(0, 300)}`);
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function findParentFolder(): Promise<string | null> {
  console.log('\n=== Finding parent folder ===\n');

  // Try to find any accessible folder/project
  const searchPaths = [
    '/api/v1/filesystem/folders',
    '/api/v2/filesystem/folders',
    '/compass/api/folders',
    '/api/v1/projects',
  ];

  for (const path of searchPaths) {
    try {
      const data = await request('GET', path);
      if (data?.data?.[0]?.rid) {
        console.log(`Found folder: ${data.data[0].rid}`);
        return data.data[0].rid;
      }
      if (data?.values?.[0]?.rid) {
        console.log(`Found folder: ${data.values[0].rid}`);
        return data.values[0].rid;
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  // Try to get user's home folder
  try {
    const user = await request('GET', '/multipass/api/me');
    console.log(`User: ${user.username}`);

    // Try user-specific paths
    const userPaths = [
      `/compass/api/users/${user.id}/home`,
      `/api/v1/filesystem/users/${user.id}/home`,
    ];

    for (const path of userPaths) {
      try {
        const data = await request('GET', path);
        if (data?.rid) return data.rid;
      } catch (e) {
        // Continue
      }
    }
  } catch (e) {
    // Continue
  }

  return null;
}

async function createDataset(parentFolderRid: string): Promise<DatasetResponse> {
  console.log('\n=== Creating dataset ===\n');

  const payload = {
    name: 'atlas_division_table',
    parentFolderRid: parentFolderRid,
  };

  // Try v1 API first (as shown in user's example)
  try {
    return await request('POST', '/api/v1/datasets', payload);
  } catch (e) {
    // Try v2
    return await request('POST', '/api/v2/datasets', payload);
  }
}

async function uploadInitialData(datasetRid: string): Promise<void> {
  console.log('\n=== Uploading initial data ===\n');

  const csvContent = `divisionId,name,head,description
DIV-001,Energy Services,J. Martinez,Core energy business unit
DIV-002,Renewable Generation,S. Johnson,Solar and wind generation
DIV-003,Grid Solutions,M. Williams,Power grid infrastructure`;

  // Upload file to dataset
  const uploadPaths = [
    `/api/v1/datasets/${datasetRid}/files/data.csv`,
    `/api/v2/datasets/${datasetRid}/files:upload`,
  ];

  for (const path of uploadPaths) {
    try {
      const response = await fetch(host + path, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/csv',
        },
        body: csvContent,
      });

      console.log(`Upload to ${path}: ${response.status}`);

      if (response.ok) {
        console.log('Data uploaded successfully');
        return;
      }
    } catch (e) {
      // Continue
    }
  }
}

async function createObjectType(datasetRid: string): Promise<void> {
  console.log('\n=== Creating AtlasDivision object type ===\n');

  const payload = {
    apiName: 'AtlasDivision',
    displayName: '[Atlas] Division',
    description: 'Business Unit / Division / Segment',
    primaryKey: 'divisionId',
    properties: {
      divisionId: { type: 'string' },
      name: { type: 'string' },
      head: { type: 'string' },
      description: { type: 'string' },
    },
    dataSource: {
      type: 'dataset',
      datasetRid: datasetRid,
      columnMapping: {
        divisionId: 'divisionId',
        name: 'name',
        head: 'head',
        description: 'description',
      },
    },
  };

  await request('POST', `/api/v2/ontologies/${ontologyRid}/objectTypes`, payload);
  console.log('AtlasDivision object type created!');
}

async function createAction(): Promise<void> {
  console.log('\n=== Creating atlas-create-division action ===\n');

  const payload = {
    apiName: 'atlas-create-division',
    displayName: '[Atlas] Create Division',
    description: 'Create a new division',
    parameters: {
      division_id: { displayName: 'Division ID', dataType: { type: 'string' }, required: true },
      name: { displayName: 'Name', dataType: { type: 'string' }, required: true },
      head: { displayName: 'Head', dataType: { type: 'string' }, required: false },
      description: { displayName: 'Description', dataType: { type: 'string' }, required: false },
    },
    operations: [
      { type: 'createObject', objectTypeApiName: 'AtlasDivision' },
    ],
  };

  await request('POST', `/api/v2/ontologies/${ontologyRid}/actionTypes`, payload);
  console.log('atlas-create-division action created!');
}

async function main() {
  console.log('='.repeat(60));
  console.log('CREATE ATLAS DIVISION VIA DATASET API');
  console.log('='.repeat(60));

  try {
    // Step 1: Find a parent folder
    const parentFolderRid = await findParentFolder();

    if (!parentFolderRid) {
      console.log('\nNo parent folder found. Trying without parent...');

      // Try creating dataset without parent (some APIs allow this)
      try {
        const dataset = await request('POST', '/api/v1/datasets', {
          name: 'atlas_division_table',
        });

        console.log(`Dataset created: ${dataset.rid}`);
        await uploadInitialData(dataset.rid);
        await createObjectType(dataset.rid);
        await createAction();

        console.log('\n*** SUCCESS! AtlasDivision created! ***');
        return;
      } catch (e) {
        console.log('Failed to create dataset without parent');
      }
    } else {
      // Step 2: Create dataset
      const dataset = await createDataset(parentFolderRid);
      console.log(`Dataset created: ${dataset.rid}`);

      // Step 3: Upload initial data
      await uploadInitialData(dataset.rid);

      // Step 4: Create object type backed by dataset
      await createObjectType(dataset.rid);

      // Step 5: Create action
      await createAction();

      console.log('\n*** SUCCESS! AtlasDivision created! ***');
    }
  } catch (error: any) {
    console.error('\nFailed:', error.message);
  }
}

main();

export {};
