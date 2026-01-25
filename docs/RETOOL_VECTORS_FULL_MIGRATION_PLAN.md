# Retool Vectors - Complete Migration Plan

## Executive Summary

Your document system is NOT just storage - it's an **intelligent agent knowledge system** with:
- 🏷️ **Agent tagging** - Which agents can access which documents
- ⚡ **Trigger conditions** - Automatic actions when agents detect issues (like the rules engine!)
- 📋 **Form schemas** - Fillable forms for compliance, RCAs
- 📊 **Usage tracking** - Per-agent document usage analytics
- 🎯 **Metadata filtering** - Country, industry, standard, phases

**Migration Strategy:** Hybrid architecture (Retool Vectors + PostgreSQL)

## Current System Architecture

### Components

```
┌────────────────────────────────────────────────────────┐
│  ENHANCED KNOWLEDGE BASE REPOSITORY                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  📦 PostgreSQL Table: enhanced_knowledge_base          │
│     - Document content                                  │
│     - Vector embeddings (pgvector)                     │
│     - relevantAgents: string[]                         │
│     - triggerConditions: TriggerCondition[]            │
│     - documentType: guideline|sop|policy|etc.          │
│     - formSchema: {...}                                │
│     - metadata: usage tracking, regulatory info        │
│                                                         │
│  🔍 Search Methods:                                     │
│     - searchArticles(agentId, query)                   │
│     - semanticSearchForAgent(agentId, query)           │
│     - getTriggeredArticles(agentId, condition)         │
│                                                         │
│  ⚡ Trigger System:                                     │
│     - executeTriggerActions(agentId, condition)        │
│     - Actions: notify, email, attach_document, escalate│
│                                                         │
│  📊 Usage Tracking:                                     │
│     - Track per-agent usage                            │
│     - Success rates                                    │
│     - Last used dates                                  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. Agent Tagging (`relevantAgents`)
```typescript
{
  title: "AI Corporate Policy",
  relevantAgents: ['governance', 'pm', 'risk'],
  // Only these agents can see/query this document
}
```

**Query:** `WHERE agentId = ANY(relevant_agents)`

#### 2. Trigger Conditions (Like Rules Engine!)
```typescript
{
  title: "AI Corporate Policy",
  documentType: 'policy',
  triggerConditions: [
    {
      agentId: 'governance',
      condition: 'ai_usage_detected',        // When this happens
      action: 'attach_document',             // Do this
      targetAgents: ['pm'],                  // Notify these agents
      priority: 'high',
      notificationMessage: 'Project uses AI - must comply with policy'
    }
  ]
}
```

**Flow:**
```
1. Governance agent scans Project X
2. Detects AI usage → condition: "ai_usage_detected"
3. System calls: executeTriggerActions('governance', 'ai_usage_detected', { projectId })
4. Finds documents with matching trigger
5. Executes actions:
   - attach_document → Attach AI policy to conversation
   - notify → Send notification to PM agent
   - email → Email project manager
   - escalate → Notify target agents
```

#### 3. Document Types
- **guideline** - Best practices
- **sop** - Standard Operating Procedures
- **policy** - Corporate policies (enforceable)
- **rca** - Root Cause Analysis templates
- **form** - Fillable forms
- **template** - Document templates
- **manual** - How-to guides

#### 4. Form Schemas
```typescript
{
  documentType: 'form',
  formSchema: {
    fields: [
      { name: 'rootCause', label: 'Root Cause', type: 'textarea', required: true },
      { name: 'correctiveAction', label: 'Corrective Action', type: 'text', required: true },
      { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] }
    ]
  }
}
```

#### 5. Regulatory Metadata
- `countryCode`: 'US', 'EU', 'UK', 'APAC', 'INTL'
- `industry`: 'financial', 'healthcare', 'technology', 'manufacturing', 'government'
- `standardName`: 'PMBOK', 'ISO 31000', 'GDPR', 'SOX', 'NIST CSF'
- `isRegulatoryDoc`: true/false
- `applicablePhases`: ['initiation', 'planning', 'execution', 'monitoring', 'closing']

#### 6. Usage Tracking
```typescript
metadata: {
  usageCount: 145,
  usedByAgents: {
    'governance': 87,
    'finops': 42,
    'risk': 16
  },
  lastUsed: Date,
  successRate: 0.92
}
```

## Services That Depend on Knowledge Base

### 1. AgentOrchestrator.ts
```typescript
// Executes trigger actions when agents detect conditions
await kb.executeTriggerActions(agentId, condition, context);
```

### 2. DeepAgentBase.ts
```typescript
// Enriches context with knowledge before planning
await enrichContextWithKnowledge(goal, context);
```

### 3. Admin Routes
- `server/routes/admin/enhanced-knowledge-base.ts`
- CRUD operations for articles
- Trigger condition management

### 4. Knowledge Base Routes
- `server/routes/knowledge-base.ts`
- Article search and retrieval
- Semantic search

### 5. Continuous Orchestrator (Potential)
- Could use trigger system for automatic issue detection

### 6. Deep Agents (All)
- Query documents based on their agentId
- Filtered by relevantAgents

## Why Retool Vectors Alone Won't Work

### Retool Vectors Supports:
- ✅ Document storage
- ✅ Automatic chunking & embeddings (OpenAI)
- ✅ Semantic search
- ✅ Basic metadata filtering

### Retool Vectors Does NOT Support:
- ❌ Complex trigger conditions with actions
- ❌ Agent-specific tagging & filtering
- ❌ Form schemas
- ❌ Usage tracking per agent
- ❌ Regulatory metadata with complex queries
- ❌ Per-document access control

## Migration Architecture: Hybrid System

### Strategy
**Keep both systems but change responsibilities:**

1. **Retool Vectors MCP** - Content storage & semantic search
   - Store document content
   - Generate embeddings (OpenAI)
   - Semantic similarity search
   - Basic metadata (tags, source, type)

2. **PostgreSQL** - Enhanced metadata & intelligence
   - `relevantAgents` - Agent tagging
   - `triggerConditions` - Trigger rules & actions
   - `formSchema` - Form definitions
   - `metadata` - Usage tracking
   - Regulatory metadata
   - Link to Retool document ID

3. **Sync Layer** - Keep both in sync
   - When document created → Upload to both
   - When document updated → Update both
   - When document deleted → Delete from both

### New Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ENHANCED KNOWLEDGE BASE REPOSITORY (Refactored)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔌 Retool Vectors MCP                                       │
│     - Document content (full text)                           │
│     - Embeddings (automatic, OpenAI)                         │
│     - Semantic search                                        │
│     - Basic metadata: tags, source, documentType            │
│                                                              │
│  💾 PostgreSQL: document_metadata                            │
│     - id (PK)                                                │
│     - retool_vector_id (FK to Retool)                       │
│     - title                                                  │
│     - relevantAgents: string[]                              │
│     - triggerConditions: JSONB                              │
│     - documentType                                           │
│     - formSchema: JSONB                                      │
│     - countryCode, industry, standardName                    │
│     - metadata: JSONB (usage tracking)                       │
│     - status: draft|published|archived                       │
│                                                              │
│  🔄 Sync Layer (New)                                         │
│     - Bidirectional sync                                     │
│     - Consistency checks                                     │
│     - Fallback to local if Retool unavailable               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Changes

### New Table: `document_metadata`

```sql
CREATE TABLE document_metadata (
  id TEXT PRIMARY KEY,
  retool_vector_id TEXT UNIQUE NOT NULL,   -- Link to Retool Vectors document

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
  relevant_agents TEXT[] DEFAULT '{}',      -- Which agents can access
  document_type TEXT NOT NULL,              -- guideline, sop, policy, etc.
  trigger_conditions JSONB,                 -- Trigger rules

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
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_retool_vector FOREIGN KEY (retool_vector_id) REFERENCES retool_vectors(id) ON DELETE CASCADE
);

CREATE INDEX idx_doc_meta_relevant_agents ON document_metadata USING GIN(relevant_agents);
CREATE INDEX idx_doc_meta_document_type ON document_metadata(document_type);
CREATE INDEX idx_doc_meta_tags ON document_metadata USING GIN(tags);
CREATE INDEX idx_doc_meta_trigger_conditions ON document_metadata USING GIN(trigger_conditions);
```

## Refactored Repository Methods

### 1. createArticle()
```typescript
async createArticle(article: ArticleInput): Promise<EnhancedKnowledgeArticle> {
  // 1. Upload to Retool Vectors MCP
  const retoolVectors = getRetoolVectorsMCP();
  const uploadResult = await retoolVectors.upload({
    content: `# ${article.title}\n\n${article.content}`,
    metadata: {
      source: article.source,
      type: article.documentType,
      tags: article.tags.join(','),
      category: article.category,
    },
  });

  // 2. Store metadata in PostgreSQL
  const id = `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await this.storage.db.execute(
    `INSERT INTO document_metadata (
      id, retool_vector_id, title, category, relevant_agents,
      document_type, trigger_conditions, metadata, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      uploadResult.documentId,
      article.title,
      article.category,
      article.relevantAgents,
      article.documentType,
      JSON.stringify(article.triggerConditions || []),
      JSON.stringify({ usageCount: 0, usedByAgents: {} }),
      'published',
    ]
  );

  return { id, ...article };
}
```

### 2. semanticSearchForAgent()
```typescript
async semanticSearchForAgent(
  agentId: string,
  query: string,
  options?: { limit?: number; documentTypes?: DocumentType[] }
): Promise<EnhancedKnowledgeArticle[]> {
  // 1. Query Retool Vectors MCP for semantic search
  const retoolVectors = getRetoolVectorsMCP();
  const vectorResults = await retoolVectors.query({
    text: query,
    topK: options?.limit || 10,
    filter: {
      type: options?.documentTypes?.join(','),
    },
  });

  // 2. Get metadata from PostgreSQL, filtered by agentId
  const retoolIds = vectorResults.map(r => r.id);
  const metadata = await this.storage.db.query(
    `SELECT * FROM document_metadata
     WHERE retool_vector_id = ANY($1)
       AND $2 = ANY(relevant_agents)
       AND status = 'published'`,
    [retoolIds, agentId]
  );

  // 3. Merge content + metadata
  return vectorResults.map(vectorDoc => {
    const meta = metadata.rows.find(m => m.retool_vector_id === vectorDoc.id);
    return {
      id: meta.id,
      content: vectorDoc.content,
      ...meta,
      relevance: vectorDoc.score,
    };
  });
}
```

### 3. getTriggeredArticles()
```typescript
async getTriggeredArticles(
  agentId: string,
  condition: string
): Promise<EnhancedKnowledgeArticle[]> {
  // Query PostgreSQL for documents with matching triggers
  const result = await this.storage.db.query(
    `SELECT * FROM document_metadata
     WHERE status = 'published'
       AND $1 = ANY(relevant_agents)
       AND trigger_conditions @> $2::jsonb`,
    [agentId, JSON.stringify([{ agentId, condition }])]
  );

  // Fetch full content from Retool Vectors MCP
  const retoolVectors = getRetoolVectorsMCP();
  const articles = [];

  for (const meta of result.rows) {
    const vectorDoc = await retoolVectors.getDocument(meta.retool_vector_id);
    articles.push({
      ...meta,
      content: vectorDoc.content,
    });
  }

  return articles;
}
```

### 4. executeTriggerActions()
```typescript
async executeTriggerActions(
  agentId: string,
  condition: string,
  context?: { userId?: string; projectId?: string; metadata?: any }
): Promise<{ success: boolean; actionsExecuted: number; errors: string[] }> {
  // Get triggered articles (from PostgreSQL metadata)
  const articles = await this.getTriggeredArticles(agentId, condition);

  // Execute actions (same as before)
  for (const article of articles) {
    for (const trigger of article.triggerConditions) {
      switch (trigger.action) {
        case 'notify':
          await notificationService.sendNotification(...);
          break;
        case 'email':
          await notificationService.sendEmail(...);
          break;
        case 'attach_document':
          // Document attached to conversation
          console.log(`Document attached: ${article.id}`);
          break;
        case 'escalate':
          // Notify target agents
          for (const targetAgent of trigger.targetAgents) {
            await this.notifyAgent(targetAgent, article, context);
          }
          break;
      }
    }
  }

  // Update usage tracking in PostgreSQL
  await this.incrementUsageCount(article.id, agentId);

  return { success: true, actionsExecuted, errors: [] };
}
```

## Migration Steps

### Phase 1: Setup (1 day)

1. **Configure Retool Vectors MCP**
   ```bash
   RETOOL_INSTANCE_URL=https://yourcompany.retool.com
   RETOOL_API_KEY=your_api_key
   RETOOL_VECTOR_ID=your_vector_database_id
   ```

2. **Create `document_metadata` table**
   ```bash
   npm run db:push
   ```

3. **Initialize Retool Vectors MCP**
   ```typescript
   // server/index.ts
   initializeRetoolVectorsMCP(storage, {
     instanceUrl: process.env.RETOOL_INSTANCE_URL!,
     apiKey: process.env.RETOOL_API_KEY!,
     vectorId: process.env.RETOOL_VECTOR_ID!,
   });
   ```

### Phase 2: Migrate Existing Documents (2-4 hours)

```bash
tsx scripts/migrate-kb-to-retool-vectors.ts
```

**Script:** Upload all existing documents from `enhanced_knowledge_base` table to Retool Vectors, create metadata entries.

### Phase 3: Refactor Repository (4-6 hours)

1. Update `EnhancedKnowledgeBaseRepository.ts` methods:
   - `createArticle()` - Upload to Retool + PostgreSQL
   - `searchArticles()` - Query both systems
   - `semanticSearchForAgent()` - Use Retool Vectors for search
   - `getTriggeredArticles()` - Query PostgreSQL, fetch content from Retool
   - `executeTriggerActions()` - No changes needed

2. Add sync layer:
   - `syncToRetoolVectors()` - Ensure consistency
   - `syncFromRetoolVectors()` - Pull updates
   - Health check - Verify both systems in sync

### Phase 4: Testing (2 hours)

1. Test document upload
2. Test semantic search filtered by agentId
3. Test trigger conditions
4. Test agent collaboration (governance → pm)
5. Test fallback when Retool unavailable

### Phase 5: Deploy & Monitor (Ongoing)

1. Deploy to production
2. Monitor sync status
3. Track Retool API usage
4. Measure search performance

## Benefits of Migration

### Performance
- ✅ **Better embeddings** - OpenAI's models (better than local)
- ✅ **Faster search** - Retool's optimized vector database
- ✅ **Scalability** - Managed infrastructure

### Features
- ✅ **Automatic chunking** - Long documents handled automatically
- ✅ **Managed infrastructure** - No vector database maintenance
- ✅ **Circuit breaker** - MCPBase provides production-grade safeguards

### Functionality Preserved
- ✅ **Agent tagging** - Still works (PostgreSQL)
- ✅ **Trigger conditions** - Still works (PostgreSQL)
- ✅ **Form schemas** - Still works (PostgreSQL)
- ✅ **Usage tracking** - Still works (PostgreSQL)
- ✅ **Regulatory metadata** - Still works (PostgreSQL)

## Rollback Plan

If migration fails:

1. **Stop using Retool Vectors MCP**
   - Remove env vars
   - System falls back to local embeddings

2. **Restore from backup**
   - PostgreSQL backup has all metadata
   - Documents never deleted from local system

3. **Continue with local system**
   - No data loss
   - Full functionality preserved

## Cost Estimate

### Retool Vectors Pricing
- Based on document count & query volume
- Typical: $50-200/month for 1000-10000 documents
- Check: https://retool.com/pricing

### Time Investment
- Setup: 1 day
- Migration: 4 hours
- Refactoring: 6 hours
- Testing: 2 hours
- **Total: ~2 days**

## Example: AI Corporate Policy Trigger

### Document Created
```typescript
await kb.createArticle({
  title: "AI Corporate Policy",
  content: "All AI usage must be approved...",
  documentType: 'policy',
  relevantAgents: ['governance', 'pm', 'risk'],
  triggerConditions: [
    {
      agentId: 'governance',
      condition: 'ai_usage_detected',
      action: 'attach_document',
      targetAgents: ['pm'],
      priority: 'high',
      notificationMessage: 'Project uses AI - must comply with AI Corporate Policy'
    }
  ],
});
```

**What happens:**
1. Content uploaded to Retool Vectors with metadata: `{ type: 'policy', tags: 'ai,compliance' }`
2. Metadata stored in PostgreSQL: `relevantAgents`, `triggerConditions`

### Governance Agent Scans Project X
```typescript
// Governance agent detects AI usage
const aiDetected = await detectAIUsage(projectX);

if (aiDetected) {
  // Execute trigger actions
  await kb.executeTriggerActions('governance', 'ai_usage_detected', {
    projectId: projectX.id,
    userId: projectManager.id,
  });
}
```

**What happens:**
1. `getTriggeredArticles('governance', 'ai_usage_detected')` queries PostgreSQL
2. Finds "AI Corporate Policy" document
3. Fetches full content from Retool Vectors
4. Executes actions:
   - **attach_document**: Attach policy to conversation
   - **notify**: Send in-app notification to PM agent
   - **targetAgents**: Notify PM and Risk agents
5. Updates usage tracking: `usedByAgents.governance++`

### PM Agent Receives Notification
```
🚨 Compliance Alert

Governance Agent has detected AI usage in Project X.

📄 Document Attached: AI Corporate Policy

Action Required:
- Review AI usage compliance
- Ensure proper approvals
- Document AI implementation

Priority: HIGH
```

PM agent now has the full AI policy document in context for their response.

## Summary

✅ **Migration preserves ALL functionality**
- Agent tagging via PostgreSQL
- Trigger conditions & actions via PostgreSQL
- Form schemas via PostgreSQL
- Usage tracking via PostgreSQL

✅ **Adds new capabilities**
- Better embeddings (OpenAI)
- Faster semantic search (Retool)
- Managed infrastructure
- Automatic chunking

✅ **Maintains intelligence**
- Trigger system works exactly the same
- Agents still filtered by relevantAgents
- Documents still ground agents in knowledge
- Compliance policies still enforced

✅ **Production-ready**
- Circuit breaker (MCPBase)
- Retry logic
- Rate limiting
- Graceful fallback

**Ready to proceed with migration?**

Next step: Review this plan, then execute Phase 1 (Setup).
