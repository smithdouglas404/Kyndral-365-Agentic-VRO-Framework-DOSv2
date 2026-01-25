# Retool MCP Integration with Existing Document System

## Overview

This guide explains how the new Retool MCP connectors integrate with your existing document and knowledge base infrastructure.

## Your Current Architecture

```
┌─────────────────────────────────────────────────┐
│  EXISTING DOCUMENT SYSTEM                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  📁 Local Storage (uploads/documents/)          │
│  💾 PostgreSQL (documents table)                │
│  🧠 EmbeddingsService (your own embeddings)     │
│  📚 EnhancedKnowledgeBaseRepository             │
│     - PMBOK, PRINCE2, SAFe, PMI articles       │
│     - Agent tagging & trigger rules             │
│     - Form schemas                              │
│                                                  │
└─────────────────────────────────────────────────┘
```

## New MCP Architecture

```
┌──────────────────────────────────────────────────┐
│  MCP LAYER (Model Context Protocol)              │
├──────────────────────────────────────────────────┤
│                                                   │
│  🔌 RetoolVectorsMCP                             │
│     - Managed vector database (Retool)           │
│     - Automatic chunking & embeddings (OpenAI)   │
│     - Semantic search                            │
│                                                   │
│  🔌 RetoolWorkflowMCP                            │
│     - Workflow automation (notifications, ETL)   │
│     - Task offloading                            │
│                                                   │
│  🔌 All MCPBase features:                        │
│     - Circuit breaker                            │
│     - Retry logic                                │
│     - Rate limiting                              │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Integration Options

### Option 1: Hybrid (Recommended)

Use both systems for different purposes:

**Local System:**
- User-uploaded project documents
- Temporary/draft documents
- Small document collections
- Custom embeddings needs

**Retool Vectors MCP:**
- Pre-seeded knowledge base (PMBOK, PRINCE2, SAFe)
- Regulatory/compliance documents
- Large document collections
- Cross-project knowledge sharing
- Documents requiring advanced RAG

**Benefits:**
- ✅ Leverage existing infrastructure
- ✅ Add managed vector database for specific use cases
- ✅ Flexible architecture
- ✅ No migration required

### Option 2: Local Only (Status Quo)

Continue using your existing system, ignore Retool MCPs.

**When to use:**
- You're happy with current system
- Don't need managed vector database
- Want to avoid external dependencies

### Option 3: Full Migration

Migrate everything to Retool Vectors MCP.

**When to use:**
- Want managed infrastructure
- Need better scalability
- Want automatic embeddings via OpenAI
- Prefer external vector database

## Hybrid Implementation

### 1. Initialize Both Systems

```typescript
// server/index.ts

import { initializeRetoolVectorsMCP } from './mcp/RetoolVectorsMCP.js';
import { initializeRetoolWorkflowMCP } from './mcp/RetoolWorkflowMCP.js';
import { getEmbeddingsService } from './services/EmbeddingsService.js';
import { initKnowledgeBaseRepository } from './lib/EnhancedKnowledgeBaseRepository.js';

// Initialize local knowledge base (existing)
const localKB = initKnowledgeBaseRepository(storage);

// Initialize Retool MCPs (new - optional)
const retoolVectors = process.env.RETOOL_API_KEY
  ? initializeRetoolVectorsMCP(storage, {
      instanceUrl: process.env.RETOOL_INSTANCE_URL!,
      apiKey: process.env.RETOOL_API_KEY!,
      vectorId: process.env.RETOOL_VECTOR_ID!,
    })
  : null;

const retoolWorkflow = process.env.RETOOL_WORKFLOW_API_KEY
  ? initializeRetoolWorkflowMCP(storage, {
      instanceUrl: process.env.RETOOL_INSTANCE_URL!,
      apiKey: process.env.RETOOL_WORKFLOW_API_KEY!,
    })
  : null;
```

### 2. Deep Agent Knowledge Enrichment Strategy

Update `DeepAgentBase.ts` to query BOTH systems:

```typescript
protected async enrichContextWithKnowledge(goal: string, context: any): Promise<any> {
  const knowledgeSources = [];

  // Query local knowledge base
  try {
    const localDocs = await this.queryLocalKnowledgeBase(goal);
    knowledgeSources.push(...localDocs);
  } catch (error) {
    console.warn('[DeepAgent] Local KB query failed:', error);
  }

  // Query Retool Vectors if available
  const retoolVectors = getRetoolVectorsMCP();
  if (retoolVectors) {
    try {
      const retoolDocs = await retoolVectors.query({
        text: goal,
        topK: 3,
        filter: { domain: this.config.agentType },
      });
      knowledgeSources.push(...retoolDocs.map(doc => ({
        content: doc.content,
        source: `Retool: ${doc.metadata.source}`,
        relevance: doc.score,
      })));
    } catch (error) {
      console.warn('[DeepAgent] Retool Vectors query failed:', error);
    }
  }

  // Combine and deduplicate
  const topKnowledge = knowledgeSources
    .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
    .slice(0, 5);

  return {
    ...context,
    knowledgeContext: topKnowledge,
  };
}
```

### 3. Sync Existing Knowledge Base to Retool Vectors

Create a migration script:

```typescript
// scripts/sync-kb-to-retool-vectors.ts

import { storage } from '../server/storage.js';
import { initKnowledgeBaseRepository } from '../server/lib/EnhancedKnowledgeBaseRepository.js';
import { getRetoolVectorsMCP } from '../server/mcp/RetoolVectorsMCP.js';

async function syncKnowledgeBase() {
  const localKB = initKnowledgeBaseRepository(storage);
  const retoolVectors = getRetoolVectorsMCP();

  if (!retoolVectors) {
    console.error('Retool Vectors not configured');
    process.exit(1);
  }

  // Get all articles from local KB
  const articles = await localKB.searchArticles({ status: 'published' });

  console.log(`Syncing ${articles.length} articles to Retool Vectors...`);

  for (const article of articles) {
    try {
      await retoolVectors.upload({
        content: `# ${article.title}\n\n${article.content}`,
        metadata: {
          source: article.source,
          domain: article.category,
          type: 'knowledge_article',
          articleId: article.id,
          version: article.version,
          tags: article.tags.join(','),
        },
      });

      console.log(`✅ Synced: ${article.title}`);
    } catch (error: any) {
      console.error(`❌ Failed to sync ${article.title}:`, error.message);
    }
  }

  console.log('✨ Sync complete!');
}

syncKnowledgeBase();
```

### 4. Document Upload Strategy

When users upload documents:

```typescript
// server/routes/documents.ts

router.post("/upload", authenticateFirebase, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    // Save to local filesystem (existing)
    const doc = await storage.createDocument({
      filename: file.filename,
      originalName: file.originalname,
      // ... other fields
    });

    // OPTIONAL: Also upload to Retool Vectors for better RAG
    const retoolVectors = getRetoolVectorsMCP();
    if (retoolVectors && req.body.enableRAG === 'true') {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        await retoolVectors.upload({
          file: fileBuffer,
          metadata: {
            source: file.originalname,
            domain: req.body.projectId,
            type: 'user_upload',
            documentId: doc.id,
          },
        });
        console.log(`✅ Document uploaded to Retool Vectors: ${file.originalname}`);
      } catch (error) {
        console.warn(`⚠️ Retool Vectors upload failed (non-blocking):`, error);
        // Don't fail the request - local upload succeeded
      }
    }

    res.json(doc);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});
```

## Environment Variables

```bash
# Existing (your system)
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...

# New (Retool MCPs - optional)
RETOOL_INSTANCE_URL=https://yourcompany.retool.com
RETOOL_API_KEY=your_retool_api_key
RETOOL_VECTOR_ID=your_vector_database_id
RETOOL_WORKFLOW_API_KEY=your_workflow_api_key
```

If Retool env vars are not set, the system falls back to local-only mode.

## Decision Matrix

| Feature | Local System | Retool Vectors MCP |
|---------|-------------|-------------------|
| Document Storage | ✅ Filesystem | ❌ Cloud-hosted |
| Embeddings | ✅ Your service | ✅ OpenAI (automatic) |
| Chunking | ⚠️ Manual | ✅ Automatic |
| Scalability | ⚠️ Limited | ✅ Managed |
| Cost | ✅ Free (your infra) | 💰 Retool pricing |
| Latency | ✅ Local | ⚠️ Network call |
| Control | ✅ Full | ⚠️ Vendor-dependent |
| RAG Quality | ✅ Good | ✅ Excellent |
| Maintenance | ⚠️ You maintain | ✅ Retool maintains |

## Use Case Examples

### Use Case 1: Regulatory Documents

**Problem:** Need to query compliance documents frequently with high accuracy.

**Solution:** Upload regulatory docs to Retool Vectors MCP
- Better chunking for long documents
- Semantic search with OpenAI embeddings
- Managed infrastructure

```typescript
// Upload regulatory document
const retoolVectors = getRetoolVectorsMCP();
await retoolVectors.uploadUrl(
  'https://www.sec.gov/rules/final/2023/33-11234.pdf',
  {
    domain: 'governance',
    type: 'regulatory',
    source: 'SEC',
  }
);

// Governance Agent queries it automatically
const result = await governanceAgent.run('Check project compliance with SEC rules');
```

### Use Case 2: Project-Specific Documents

**Problem:** Each project has unique documents (SOWs, contracts, specs).

**Solution:** Store in local system
- Project-specific
- Temporary nature
- Full control

```typescript
// Upload via existing route
POST /api/documents/upload
{
  projectId: 'proj_123',
  file: sow.pdf
}

// Stored locally, queryable by agents
```

### Use Case 3: Cross-Project Knowledge

**Problem:** Best practices and lessons learned should be shared across all projects.

**Solution:** Upload to Retool Vectors MCP
- Available to all agents
- Better discoverability
- Managed lifecycle

```typescript
// After project completion
const retoolVectors = getRetoolVectorsMCP();
await retoolVectors.upload({
  content: lessonsLearnedReport,
  metadata: {
    source: `Project ${projectId} Lessons Learned`,
    domain: 'all',
    type: 'lessons_learned',
  },
});
```

## Migration Path

If you want to fully migrate to Retool Vectors:

### Phase 1: Parallel Run (1-2 months)
- Configure Retool MCP
- Sync existing knowledge base
- Upload new docs to both systems
- Compare results

### Phase 2: Gradual Transition (2-3 months)
- New docs → Retool only
- Keep existing docs in local system
- Monitor performance

### Phase 3: Full Migration (optional)
- Migrate remaining docs
- Deprecate local embeddings service
- Use Retool as single source of truth

## Rollback Plan

If Retool integration doesn't work:

1. Remove Retool env vars
2. System automatically falls back to local
3. No code changes needed (graceful degradation built-in)

## Summary

The Retool MCP integrations are **optional enhancements** to your existing document system:

- **No breaking changes** - Your current system continues to work
- **Graceful fallback** - If Retool not configured, uses local system
- **Flexible** - Use hybrid approach or pick one
- **Production-ready** - MCPBase provides circuit breaker, retry, rate limiting

You can start with Option 1 (Hybrid) and decide later whether to migrate fully or keep both systems.
