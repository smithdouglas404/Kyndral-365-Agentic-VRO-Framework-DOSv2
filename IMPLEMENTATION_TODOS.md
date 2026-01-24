# Implementation TODOs - Remaining Work

This document tracks all placeholder implementations and features that need to be completed.

## 🔴 CRITICAL - Authentication & Storage Layer

### 1. Session Management (authSystem.ts)
**Status**: Commented out - storage methods don't exist

**Lines**: 334, 359, 570
```typescript
// TODO: Implement session deletion when storage method is available
// await this.storage.deleteSession(token);

// TODO: Check session validity when storage method is available
// const session = await this.storage.getSession(token);

// TODO: Invalidate all user sessions
// await this.storage.deleteUserSessions(user.id);
```

**Required Storage Methods**:
- `storage.deleteSession(token: string): Promise<void>`
- `storage.getSession(token: string): Promise<Session | null>`
- `storage.deleteUserSessions(userId: string): Promise<void>`

**Impact**: Users can't properly log out, sessions aren't validated, multi-device logout doesn't work.

---

### 2. API Key Management (authSystem.ts)
**Status**: Commented out - storage methods don't exist

**Lines**: 474, 482, 795, 802
```typescript
// TODO: Implement API key verification when storage methods are available
// const apiKeys = await this.storage.getApiKeys();
// await this.storage.updateApiKey(apiKey.id, { lastUsedAt: new Date() });

// TODO: Implement when storage method is available
// const allKeys = await this.storage.getApiKeys();
// const apiKey = await this.storage.getApiKey(keyId);
```

**Required Storage Methods**:
- `storage.getApiKeys(): Promise<ApiKey[]>`
- `storage.getApiKey(id: string): Promise<ApiKey | null>`
- `storage.updateApiKey(id: string, updates: Partial<ApiKey>): Promise<void>`

**Impact**: API keys can't be verified or managed. Integrations won't work.

---

### 3. Password Reset System (authSystem.ts)
**Status**: Throws error - not implemented

**Lines**: 513-514, 533-580
```typescript
// TODO: Store reset token when passwordResetTokens table is used
// Relies on passwordResetTokens table from shared/models/auth.ts

async resetPassword(token: string, newPassword: string): Promise<void> {
  throw new Error('Password reset not implemented - use Firebase password reset flow');
}
```

**Solution**: Either:
- A) Implement using `passwordResetTokens` table (already defined in schema)
- B) Remove this code and rely entirely on Firebase password reset

**Impact**: Password reset flow doesn't work. Users with forgotten passwords are locked out.

---

### 4. Project Team Member Check (authSystem.ts)
**Status**: Always returns false

**Lines**: 890-894
```typescript
// TODO: Implement when storage method is available
// const teamMembers = await this.storage.getProjectTeamMembers(projectId);
return false;
```

**Required Storage Method**:
- `storage.getProjectTeamMembers(projectId: string): Promise<Array<{userId: string}>>`

**Impact**: Project-level permissions don't work. Team members can't access their projects.

---

## 🟡 MEDIUM Priority - Feature Implementations

### 5. Agent Manual Trigger (agent-config.ts)
**Status**: Simulates with setTimeout

**Lines**: 215-224
```typescript
// TODO: Actually trigger agent execution
// For now, just simulate it
setTimeout(async () => {
  await db.update(agentConfigs).set({ status: 'idle' }).where(eq(agentConfigs.id, agentId));
}, 5000);
```

**Required**: Integration with actual agent execution system.

**Impact**: "Run Now" button in Agent Configuration doesn't actually run agents.

---

### 6. Integration Sync Logic (server/routes/admin/integrations.js)
**Status**: Placeholder

**Description**: Sync button exists but doesn't perform actual data synchronization from external systems.

**Required**: Implement real sync logic for:
- Jira
- Azure DevOps
- ServiceNow
- Monday.com
- Asana
- Smartsheet
- SAP PPM
- Oracle Primavera
- Planview

**Impact**: Users can activate integrations but can't pull data from them.

---

### 7. Workflow Execution Engine (server/routes/admin/workflows.js)
**Status**: Placeholder

**Description**: Workflow builder exists but workflows don't actually execute.

**Required**: Runtime engine to execute workflow steps, handle conditions, loops, and triggers.

**Impact**: Workflows can be designed but don't automate anything.

---

### 8. Embeddings (Server-side AI)
**Status**: Using placeholder instead of actual AI

**Description**: Code generation, policy generation, and smart search use placeholder embeddings instead of real vector embeddings.

**Required**:
- Integrate OpenAI embeddings API
- Set up vector database (Pinecone, Qdrant, or ChromaDB)
- Implement semantic search

**Impact**: AI-powered features like smart search and code generation don't work properly.

---

### 9. Critical Path Calculation (server/routes/predictive.js)
**Status**: Not implemented

**Description**: Dashboard shows "Critical Path" but calculation is not implemented.

**Required**: Implement CPM (Critical Path Method) algorithm based on:
- Task dependencies
- Duration estimates
- Resource constraints

**Impact**: Critical path analysis doesn't show accurate bottlenecks.

---

## 🟢 LOW Priority - Enhancements

### 10. MFA TOTP Verification (authSystem.ts)
**Status**: Accepts any 6-digit code

**Lines**: 881-885
```typescript
// Simplified MFA verification (in production, use TOTP library)
// For now, accept any 6-digit code for demo purposes
return /^\d{6}$/.test(code);
```

**Required**: Implement proper TOTP verification using `speakeasy` or similar library.

**Impact**: MFA security is bypassed.

---

### 11. Audit Log Storage (authSystem.ts)
**Status**: Calls storage method but might not persist properly

**Lines**: 938-951
```typescript
await this.storage.createAuditLog({...});
```

**Required**: Verify audit logs are properly stored and queryable.

**Impact**: Security audit trail may be incomplete.

---

### 12. Project Ownership Check (authSystem.ts)
**Status**: Basic check, no team member validation

**Lines**: 408-423
```typescript
if (project && project.owner !== user.email) {
  const isTeamMember = await this.isProjectTeamMember(userId, resourceId);
  if (!isTeamMember) {
    return { allowed: false, reason: 'You do not have access to this project' };
  }
}
```

**Note**: Relies on `isProjectTeamMember` which currently returns false.

**Impact**: Team members can't access their assigned projects.

---

### 13. Threshold Settings Persistence
**Status**: Frontend UI exists, no backend API

**Location**: `client/src/pages/admin/ThresholdSettings.tsx`

**Required**: Create backend API at `/api/admin/threshold-settings` to:
- GET system-wide thresholds
- PATCH threshold updates
- Store in database table

**Impact**: Threshold changes in UI aren't saved or applied.

---

## Summary Statistics

- **Total TODOs**: 13
- **Critical (Blocks core functionality)**: 4
- **High (Significant features broken)**: 5
- **Medium (Features don't work as expected)**: 3
- **Low (Quality/security improvements)**: 1

## Recommended Implementation Order

1. **Session Management** (auth foundation)
2. **Password Reset** (user recovery)
3. **Project Team Member Check** (permissions)
4. **API Key Management** (integrations)
5. **Agent Manual Trigger** (admin features)
6. **Threshold Settings API** (admin features)
7. **Integration Sync Logic** (data ingestion)
8. **Embeddings & Vector Search** (AI features)
9. **Workflow Execution** (automation)
10. **Critical Path Calculation** (analytics)
11. **MFA TOTP** (security hardening)
12. **Audit Log Verification** (compliance)
13. **Workflow Builder** (advanced features)

---

## Next Steps

1. Prioritize critical authentication/session issues
2. Implement storage interface methods in `server/storage.ts`
3. Create database tables for missing entities (if not already present)
4. Test each feature after implementation
5. Update this document as items are completed

---

*Last Updated: 2026-01-24*
*Generated by: Claude Code during deep error scan and fix session*
