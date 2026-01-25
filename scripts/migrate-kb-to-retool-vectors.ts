/**
 * MIGRATE KNOWLEDGE BASE TO RETOOL VECTORS
 *
 * Migrates all documents from enhanced_knowledge_base to hybrid architecture:
 * - Content → Retool Vectors MCP (with embeddings)
 * - Metadata → PostgreSQL document_metadata table
 *
 * Preserves ALL functionality:
 * - Agent tagging (relevantAgents)
 * - Trigger conditions & actions
 * - Form schemas
 * - Usage tracking
 * - Regulatory metadata
 */

import { storage } from '../server/storage.js';
import { getRetoolVectorsMCP, initializeRetoolVectorsMCP } from '../server/mcp/RetoolVectorsMCP.js';

interface LegacyArticle {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  content: string;
  summary?: string;
  tags: string[];
  source: string;
  version: string;
  author?: string;
  relevant_agents: string[];
  document_type: string;
  trigger_conditions: string; // JSON
  country_code?: string;
  industry?: string;
  standard_name?: string;
  is_regulatory_doc: boolean;
  is_predocumented: boolean;
  applicable_phases: string[];
  form_schema?: string; // JSON
  required_fields: string[];
  metadata: string; // JSON
  status: string;
  created_at: Date;
  updated_at: Date;
}

async function migrate() {
  console.log('🚀 Starting Knowledge Base Migration to Retool Vectors...\n');

  // 1. Verify Retool MCP is configured
  const retoolVectors = getRetoolVectorsMCP();
  if (!retoolVectors) {
    console.error('❌ Retool Vectors MCP not configured!');
    console.error('   Set RETOOL_INSTANCE_URL, RETOOL_API_KEY, RETOOL_VECTOR_ID in .env');
    process.exit(1);
  }

  // Test connection
  const isConnected = await retoolVectors.testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to Retool Vectors');
    process.exit(1);
  }

  console.log('✅ Connected to Retool Vectors\n');

  // 2. Create document_metadata table
  console.log('📋 Creating document_metadata table...');

  await storage.db.execute(`
    CREATE TABLE IF NOT EXISTS document_metadata (
      id TEXT PRIMARY KEY,
      retool_vector_id TEXT UNIQUE NOT NULL,

      -- Basic info
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      summary TEXT,
      tags TEXT[] DEFAULT '{}',
      source TEXT NOT NULL,
      version TEXT NOT NULL,
      author TEXT,

      -- Agent tagging & triggers
      relevant_agents TEXT[] DEFAULT '{}',
      document_type TEXT NOT NULL,
      trigger_conditions JSONB,

      -- Regulatory metadata
      country_code TEXT,
      industry TEXT,
      standard_name TEXT,
      is_regulatory_doc BOOLEAN DEFAULT false,
      is_predocumented BOOLEAN DEFAULT false,
      applicable_phases TEXT[] DEFAULT '{}',

      -- Form schema
      form_schema JSONB,
      required_fields TEXT[] DEFAULT '{}',

      -- Usage tracking
      metadata JSONB DEFAULT '{}',

      -- Status
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create indexes
  await storage.db.execute(`CREATE INDEX IF NOT EXISTS idx_doc_meta_relevant_agents ON document_metadata USING GIN(relevant_agents)`);
  await storage.db.execute(`CREATE INDEX IF NOT EXISTS idx_doc_meta_document_type ON document_metadata(document_type)`);
  await storage.db.execute(`CREATE INDEX IF NOT EXISTS idx_doc_meta_tags ON document_metadata USING GIN(tags)`);
  await storage.db.execute(`CREATE INDEX IF NOT EXISTS idx_doc_meta_trigger_conditions ON document_metadata USING GIN(trigger_conditions)`);
  await storage.db.execute(`CREATE INDEX IF NOT EXISTS idx_doc_meta_retool_vector_id ON document_metadata(retool_vector_id)`);

  console.log('✅ document_metadata table created\n');

  // 3. Get all documents from legacy table
  console.log('📚 Fetching documents from enhanced_knowledge_base...');

  const result = await storage.db.query<LegacyArticle>(
    'SELECT * FROM enhanced_knowledge_base WHERE status = $1 ORDER BY created_at ASC',
    ['published']
  );

  const articles = result.rows;
  console.log(`   Found ${articles.length} articles to migrate\n`);

  // 4. Migrate each document
  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ title: string; error: string }> = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];

    console.log(`[${i + 1}/${articles.length}] Migrating: ${article.title}`);

    try {
      // Upload to Retool Vectors
      const uploadResult = await retoolVectors.upload({
        content: `# ${article.title}\n\n${article.summary || ''}\n\n${article.content}`,
        metadata: {
          source: article.source,
          type: article.document_type,
          category: article.category,
          subcategory: article.subcategory || '',
          tags: article.tags.join(','),
          version: article.version,
          standard_name: article.standard_name || '',
          country_code: article.country_code || '',
          industry: article.industry || '',
        },
      });

      console.log(`   ✅ Uploaded to Retool Vectors: ${uploadResult.documentId} (${uploadResult.chunkCount} chunks)`);

      // Store metadata in PostgreSQL
      await storage.db.execute(
        `INSERT INTO document_metadata (
          id, retool_vector_id, title, category, subcategory, summary, tags, source, version, author,
          relevant_agents, document_type, trigger_conditions,
          country_code, industry, standard_name, is_regulatory_doc, is_predocumented, applicable_phases,
          form_schema, required_fields,
          metadata, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
        [
          article.id,
          uploadResult.documentId,
          article.title,
          article.category,
          article.subcategory || null,
          article.summary || null,
          article.tags,
          article.source,
          article.version,
          article.author || null,
          article.relevant_agents,
          article.document_type,
          article.trigger_conditions, // Already JSON string
          article.country_code || null,
          article.industry || null,
          article.standard_name || null,
          article.is_regulatory_doc,
          article.is_predocumented,
          article.applicable_phases,
          article.form_schema || null,
          article.required_fields,
          article.metadata, // Already JSON string
          article.status,
          article.created_at,
          article.updated_at,
        ]
      );

      console.log(`   ✅ Stored metadata in PostgreSQL\n`);

      successCount++;

    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failCount++;
      errors.push({ title: article.title, error: error.message });
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total Articles: ${articles.length}`);
  console.log(`✅ Migrated Successfully: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');

  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(e => console.log(`   - ${e.title}: ${e.error}`));
    console.log('');
  }

  // 6. Verify migration
  console.log('🔍 Verifying migration...');

  const metadataCount = await storage.db.query('SELECT COUNT(*) as count FROM document_metadata');
  const retoolStats = await retoolVectors.getStats();

  console.log(`   PostgreSQL metadata entries: ${metadataCount.rows[0].count}`);
  console.log(`   Retool Vectors documents: ${retoolStats.documentCount}`);
  console.log(`   Retool Vectors vectors: ${retoolStats.vectorCount}`);
  console.log('');

  if (parseInt(metadataCount.rows[0].count) === successCount) {
    console.log('✅ Migration verified - counts match!');
  } else {
    console.log('⚠️  Warning: Count mismatch. Review errors above.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Migration Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. Review errors (if any)');
  console.log('2. Test semantic search: tsx scripts/test-retool-vectors-search.ts');
  console.log('3. Test trigger conditions: tsx scripts/test-trigger-conditions.ts');
  console.log('4. Backup legacy table: pg_dump enhanced_knowledge_base > backup.sql');
  console.log('5. (Optional) Drop legacy table once verified: DROP TABLE enhanced_knowledge_base;');
  console.log('');
}

migrate()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
