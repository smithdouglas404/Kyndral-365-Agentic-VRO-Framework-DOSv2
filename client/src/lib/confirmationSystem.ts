export interface AuditTrailEntry {
  id: string;
  confirmationCode: string;
  actionType: 'approved' | 'dismissed' | 'escalated' | 'acknowledged' | 'created';
  actionStatus: 'completed' | 'failed' | 'pending';
  entityType: 'intervention' | 'recommendation' | 'discussion' | 'risk';
  entityId?: string;
  entityTitle?: string;
  agentSource?: string;
  projectId?: string;
  projectName?: string;
  userId?: string;
  userName?: string;
  componentSource?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function generateConfirmationCode(): string {
  const chars = '0123456789ABCDEF';
  let code = 'NEE-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function recordAuditTrail(entry: Omit<AuditTrailEntry, 'id' | 'confirmationCode' | 'createdAt'>): Promise<{ success: boolean; confirmationCode?: string; error?: string }> {
  const confirmationCode = generateConfirmationCode();
  
  try {
    const response = await fetch('/api/audit-trail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        confirmationCode,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to record audit trail');
    }
    
    const data = await response.json();
    return { success: true, confirmationCode: data.confirmationCode };
  } catch (error) {
    console.error('Failed to record audit trail:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAuditTrailByCode(confirmationCode: string): Promise<AuditTrailEntry | null> {
  try {
    const response = await fetch(`/api/audit-trail/${confirmationCode}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch audit trail:', error);
    return null;
  }
}

export async function getRecentAuditTrail(limit: number = 20): Promise<AuditTrailEntry[]> {
  try {
    const response = await fetch(`/api/audit-trail?limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Failed to fetch recent audit trail:', error);
    return [];
  }
}
