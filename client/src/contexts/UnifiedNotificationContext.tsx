import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useWebSocketContext } from './WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * UNIFIED NOTIFICATION SYSTEM
 *
 * Consolidates 4 previous notification systems into ONE source of truth:
 * 1. Agent insights (from WebSocket A2A messages)
 * 2. Interventions (from Command Center)
 * 3. System events (CRUD operations)
 * 4. Simulation events (for demo mode only)
 *
 * Replaces:
 * - AIAlertTicker (mock simulation data)
 * - AlertsFlyout (dead code)
 * - FloatingAlertBanner (polling)
 * - Scattered WebSocket handlers
 */

// ============================================================================
// TYPES
// ============================================================================

export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type NotificationType = 'agent_insight' | 'intervention' | 'system_event' | 'prediction' | 'recommendation';
export type AgentSource = 'finops' | 'tmo' | 'risk' | 'vro' | 'pmo' | 'ocm' | 'governance' | 'system';

export interface BaseNotification {
  id: string;
  timestamp: Date;
  severity: NotificationSeverity;
  read: boolean;
  dismissed: boolean;
  type: NotificationType;
}

export interface SystemEvent extends BaseNotification {
  type: 'system_event';
  title: string;
  message: string;
  actionUrl?: string;
}

export interface AgentInsight extends BaseNotification {
  type: 'agent_insight' | 'prediction' | 'recommendation';
  sourceAgent: AgentSource;
  agentName: string;
  title: string;
  description: string;

  // Rich content (competitive advantage)
  currentState?: {
    metric: string;
    value: number;
    threshold?: number;
    trend?: 'improving' | 'degrading' | 'stable';
    trendData?: number[];
  };

  rootCause?: {
    primary: string;
    contributing?: string[];
    confidence?: number;
    evidenceLinks?: Array<{ label: string; url: string }>;
  };

  recommendations?: Array<{
    action: string;
    priority: 'immediate' | 'soon' | 'consider';
    effort: 'low' | 'medium' | 'high';
    impact?: {
      type: 'financial' | 'schedule' | 'quality' | 'risk';
      estimated: number;
      unit: string;
    };
    confidence?: number;
  }>;

  prediction?: {
    scenario: string;
    if_action_taken?: {
      outcome: string;
      probability: number;
      timeframe: string;
      impact: number;
    };
    if_no_action?: {
      outcome: string;
      probability: number;
      timeframe: string;
      impact: number;
    };
  };

  relatedAgents?: Array<{
    agentId: string;
    relevance: string;
    sharedFacts?: string[];
  }>;

  // Context
  projectId?: string;
  projectName?: string;
  entityType?: string;
  entityId?: string;
}

export interface Intervention extends BaseNotification {
  type: 'intervention';
  sourceAgent: AgentSource;
  agentName: string;
  title: string;
  description: string;
  suggestedAction?: string;
  impact?: string;
  confidence?: string;
  projectId?: string;
  projectName?: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
}

export type UnifiedNotification = SystemEvent | AgentInsight | Intervention;

// ============================================================================
// CONTEXT
// ============================================================================

interface UnifiedNotificationContextValue {
  notifications: UnifiedNotification[];
  unreadCount: number;
  criticalCount: number;

  // Actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  addNotification: (notification: Omit<UnifiedNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => void;

  // Filters
  getByType: (type: NotificationType) => UnifiedNotification[];
  getByAgent: (agent: AgentSource) => UnifiedNotification[];
  getBySeverity: (severity: NotificationSeverity) => UnifiedNotification[];
  getUnread: () => UnifiedNotification[];
  getCritical: () => UnifiedNotification[];

  // State
  isConnected: boolean;
  lastUpdate: Date | null;
}

const UnifiedNotificationContext = createContext<UnifiedNotificationContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function UnifiedNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { isConnected, lastMessage } = useWebSocketContext();
  const queryClient = useQueryClient();

  // ============================================================================
  // WEBSOCKET LISTENERS - Real agent messages
  // ============================================================================

  useEffect(() => {
    if (!lastMessage) return;

    try {
      // Agent insight messages (from DeepAgents via A2A)
      if (lastMessage.type === 'agent:insight') {
        const insight: AgentInsight = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
          dismissed: false,
          type: 'agent_insight',
          severity: lastMessage.data?.severity || 'medium',
          sourceAgent: lastMessage.data?.sourceAgent || 'system',
          agentName: lastMessage.data?.agentName || 'System',
          title: lastMessage.data?.title || 'Agent Insight',
          description: lastMessage.data?.description || '',
          currentState: lastMessage.data?.currentState,
          rootCause: lastMessage.data?.rootCause,
          recommendations: lastMessage.data?.recommendations,
          prediction: lastMessage.data?.prediction,
          relatedAgents: lastMessage.data?.relatedAgents,
          projectId: lastMessage.data?.projectId,
          projectName: lastMessage.data?.projectName,
        };
        addNotification(insight);
      }

      // Prediction messages
      if (lastMessage.type === 'agent:prediction') {
        const prediction: AgentInsight = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
          dismissed: false,
          type: 'prediction',
          severity: lastMessage.data?.severity || 'medium',
          sourceAgent: lastMessage.data?.sourceAgent || 'system',
          agentName: lastMessage.data?.agentName || 'System',
          title: lastMessage.data?.title || 'Prediction',
          description: lastMessage.data?.description || '',
          prediction: lastMessage.data?.prediction,
          projectId: lastMessage.data?.projectId,
          projectName: lastMessage.data?.projectName,
        };
        addNotification(prediction);
      }

      // Intervention/alert messages
      if (lastMessage.type === 'critical_alert' || lastMessage.type === 'intervention') {
        const intervention: Intervention = {
          id: lastMessage.data?.id || crypto.randomUUID(),
          timestamp: new Date(lastMessage.data?.createdAt || Date.now()),
          read: false,
          dismissed: false,
          type: 'intervention',
          severity: lastMessage.data?.severity || 'high',
          sourceAgent: lastMessage.data?.agentSource || 'system',
          agentName: lastMessage.data?.agentSource || 'System',
          title: lastMessage.data?.title || 'Intervention Required',
          description: lastMessage.data?.description || lastMessage.data?.message || '',
          suggestedAction: lastMessage.data?.suggestedAction,
          impact: lastMessage.data?.impact,
          confidence: lastMessage.data?.confidence,
          projectId: lastMessage.data?.projectId,
          projectName: lastMessage.data?.projectName,
          status: lastMessage.data?.status || 'pending',
        };
        addNotification(intervention);
      }

      // System event messages (CRUD operations, etc.)
      if (lastMessage.type === 'notification' || lastMessage.type === 'system_event') {
        const systemEvent: SystemEvent = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
          dismissed: false,
          type: 'system_event',
          severity: lastMessage.data?.severity || 'info',
          title: lastMessage.data?.title || 'System Event',
          message: lastMessage.data?.message || lastMessage.message || '',
          actionUrl: lastMessage.data?.actionUrl,
        };
        addNotification(systemEvent);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('[UnifiedNotificationContext] Error processing WebSocket message:', error);
    }
  }, [lastMessage]);

  // ============================================================================
  // POLLING FALLBACK - For HITL interventions from Palantir
  // ============================================================================

  useEffect(() => {
    const fetchHITLInterventions = async () => {
      try {
        // Fetch from Palantir HITL endpoint
        const response = await fetch('/api/hitl/interventions/pending?limit=20');
        if (response.ok) {
          const data = await response.json();
          const hitlInterventions: any[] = data.interventions || [];

          // Only add NEW critical/high pending interventions
          const existingIds = new Set(notifications.map(n => n.id));
          const newInterventions = hitlInterventions
            .filter(i =>
              !existingIds.has(i.interventionId) &&
              (i.severity === 'critical' || i.severity === 'high')
            )
            .slice(0, 5); // Limit to 5 newest

          newInterventions.forEach(i => {
            const intervention: Intervention = {
              id: i.interventionId,
              timestamp: new Date(i.createdAt),
              read: false,
              dismissed: false,
              type: 'intervention',
              severity: i.severity,
              sourceAgent: i.agentSource || 'system',
              agentName: i.agentSource || 'System',
              title: i.title,
              description: i.description,
              suggestedAction: i.recommendation,
              impact: i.estimatedImpact,
              confidence: String(i.metadata?.confidence || '0.85'),
              projectId: i.projectId,
              projectName: i.projectId, // Use projectId as name fallback
              status: i.status,
            };
            addNotification(intervention);
          });
        }
      } catch (error) {
        console.error('[UnifiedNotificationContext] Error fetching interventions:', error);
      }
    };

    // Initial fetch
    fetchHITLInterventions();

    // Poll every 30 seconds for HITL (more responsive for approvals)
    const interval = setInterval(fetchHITLInterventions, 30000);
    return () => clearInterval(interval);
  }, []); // Empty deps - we check existing notifications inside

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const addNotification = useCallback((notification: Omit<UnifiedNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    const newNotification: UnifiedNotification = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      dismissed: false,
      ...notification,
    } as UnifiedNotification;

    setNotifications(prev => {
      // Check if already exists (by title + timestamp proximity)
      const isDuplicate = prev.some(n =>
        'title' in n && 'title' in newNotification &&
        n.title === newNotification.title &&
        Math.abs(n.timestamp.getTime() - newNotification.timestamp.getTime()) < 5000
      );

      if (isDuplicate) return prev;

      // Add to beginning, keep last 100
      return [newNotification, ...prev].slice(0, 100);
    });

    setLastUpdate(new Date());

    // Invalidate React Query caches
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, dismissed: true, read: true } : n)
    );
  }, []);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const getByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type && !n.dismissed);
  }, [notifications]);

  const getByAgent = useCallback((agent: AgentSource) => {
    return notifications.filter(n =>
      !n.dismissed &&
      ('sourceAgent' in n && n.sourceAgent === agent)
    );
  }, [notifications]);

  const getBySeverity = useCallback((severity: NotificationSeverity) => {
    return notifications.filter(n => n.severity === severity && !n.dismissed);
  }, [notifications]);

  const getUnread = useCallback(() => {
    return notifications.filter(n => !n.read && !n.dismissed);
  }, [notifications]);

  const getCritical = useCallback(() => {
    return notifications.filter(n =>
      n.severity === 'critical' && !n.dismissed
    );
  }, [notifications]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.read && !n.dismissed).length,
    [notifications]
  );

  const criticalCount = useMemo(() =>
    notifications.filter(n => n.severity === 'critical' && !n.dismissed).length,
    [notifications]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: UnifiedNotificationContextValue = useMemo(() => ({
    notifications: notifications.filter(n => !n.dismissed),
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    addNotification,
    getByType,
    getByAgent,
    getBySeverity,
    getUnread,
    getCritical,
    isConnected,
    lastUpdate,
  }), [
    notifications,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    addNotification,
    getByType,
    getByAgent,
    getBySeverity,
    getUnread,
    getCritical,
    isConnected,
    lastUpdate,
  ]);

  return (
    <UnifiedNotificationContext.Provider value={contextValue}>
      {children}
    </UnifiedNotificationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useUnifiedNotifications() {
  const context = useContext(UnifiedNotificationContext);
  if (!context) {
    throw new Error('useUnifiedNotifications must be used within UnifiedNotificationProvider');
  }
  return context;
}
