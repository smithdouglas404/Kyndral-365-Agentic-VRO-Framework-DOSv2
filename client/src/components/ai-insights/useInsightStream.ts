/**
 * Real-time Insight Subscription Hook
 *
 * Provides WebSocket-based streaming of AI insights for live dashboard updates.
 * Supports filtering, prioritization, and automatic reconnection.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Insight, InsightSeverity } from '@/components/tremor-widgets';

// ============================================================================
// Types
// ============================================================================

export interface InsightStreamConfig {
  /** WebSocket endpoint URL */
  endpoint?: string;
  /** Filter insights by widget IDs */
  widgetIds?: string[];
  /** Filter insights by categories */
  categories?: string[];
  /** Minimum severity to receive */
  minSeverity?: InsightSeverity;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Max insights to keep in memory */
  maxInsights?: number;
}

export interface InsightStreamMessage {
  type: 'insight' | 'update' | 'dismiss' | 'clear' | 'heartbeat';
  insight?: StreamedInsight;
  insightId?: string;
  timestamp: string;
}

export interface StreamedInsight extends Insight {
  widgetId?: string;
  category?: string;
  expiresAt?: string;
  priority?: number;
  agentId?: string;
  agentName?: string;
}

export interface InsightStreamState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastHeartbeat: string | null;
  reconnectAttempts: number;
}

export interface UseInsightStreamReturn {
  insights: StreamedInsight[];
  state: InsightStreamState;
  connect: () => void;
  disconnect: () => void;
  dismissInsight: (id: string) => void;
  clearInsights: () => void;
  getInsightsForWidget: (widgetId: string) => StreamedInsight[];
  getInsightsByCategory: (category: string) => StreamedInsight[];
  getCriticalInsights: () => StreamedInsight[];
}

// ============================================================================
// Severity Priority Map
// ============================================================================

const SEVERITY_PRIORITY: Record<InsightSeverity, number> = {
  error: 4,
  warning: 3,
  ai: 2,
  success: 1,
  info: 0,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useInsightStream(
  config: InsightStreamConfig = {}
): UseInsightStreamReturn {
  const {
    endpoint = '/api/insights/stream',
    widgetIds,
    categories,
    minSeverity = 'info',
    autoReconnect = true,
    reconnectDelay = 3000,
    maxInsights = 100,
  } = config;

  const [insights, setInsights] = useState<StreamedInsight[]>([]);
  const [state, setState] = useState<InsightStreamState>({
    connected: false,
    connecting: false,
    error: null,
    lastHeartbeat: null,
    reconnectAttempts: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter function for incoming insights
  const shouldIncludeInsight = useCallback((insight: StreamedInsight): boolean => {
    // Check severity
    if (SEVERITY_PRIORITY[insight.severity] < SEVERITY_PRIORITY[minSeverity]) {
      return false;
    }

    // Check widget filter
    if (widgetIds && widgetIds.length > 0 && insight.widgetId) {
      if (!widgetIds.includes(insight.widgetId)) {
        return false;
      }
    }

    // Check category filter
    if (categories && categories.length > 0 && insight.category) {
      if (!categories.includes(insight.category)) {
        return false;
      }
    }

    return true;
  }, [widgetIds, categories, minSeverity]);

  // Process incoming message
  const handleMessage = useCallback((message: InsightStreamMessage) => {
    switch (message.type) {
      case 'insight':
        if (message.insight && shouldIncludeInsight(message.insight)) {
          setInsights(prev => {
            // Add new insight and sort by priority/time
            const updated = [message.insight!, ...prev]
              .slice(0, maxInsights)
              .sort((a, b) => {
                // Sort by priority first, then by timestamp
                const priorityDiff = (b.priority || 0) - (a.priority || 0);
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.timestamp || 0).getTime() -
                       new Date(a.timestamp || 0).getTime();
              });
            return updated;
          });
        }
        break;

      case 'update':
        if (message.insight) {
          setInsights(prev =>
            prev.map(i =>
              i.id === message.insight!.id ? { ...i, ...message.insight } : i
            )
          );
        }
        break;

      case 'dismiss':
        if (message.insightId) {
          setInsights(prev => prev.filter(i => i.id !== message.insightId));
        }
        break;

      case 'clear':
        setInsights([]);
        break;

      case 'heartbeat':
        setState(prev => ({
          ...prev,
          lastHeartbeat: message.timestamp,
        }));
        break;
    }
  }, [shouldIncludeInsight, maxInsights]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      // Build URL with filters
      const url = new URL(endpoint, window.location.origin);
      if (widgetIds?.length) {
        url.searchParams.set('widgets', widgetIds.join(','));
      }
      if (categories?.length) {
        url.searchParams.set('categories', categories.join(','));
      }

      // For development/demo, use mock data instead of actual WebSocket
      // In production, uncomment the WebSocket code below

      // Mock connection for demo
      setState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        reconnectAttempts: 0,
      }));

      // Simulate receiving insights periodically
      const mockInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          const mockInsight: StreamedInsight = {
            id: `insight-${Date.now()}`,
            title: ['Budget Alert', 'Risk Detected', 'Schedule Update', 'Resource Notice'][
              Math.floor(Math.random() * 4)
            ],
            description: 'This is a streamed insight from the AI system.',
            severity: ['info', 'warning', 'error', 'ai'][
              Math.floor(Math.random() * 4)
            ] as InsightSeverity,
            timestamp: new Date().toLocaleTimeString(),
            source: 'AI Stream',
            agentId: 'finops',
            agentName: 'FinOps Agent',
            priority: Math.floor(Math.random() * 5),
          };
          handleMessage({ type: 'insight', insight: mockInsight, timestamp: new Date().toISOString() });
        }
      }, 5000);

      // Store interval for cleanup
      (wsRef as any).mockInterval = mockInterval;

      /*
      // Production WebSocket code:
      const ws = new WebSocket(url.toString().replace('http', 'ws'));

      ws.onopen = () => {
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          reconnectAttempts: 0,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as InsightStreamMessage;
          handleMessage(message);
        } catch (e) {
          console.error('Failed to parse insight message:', e);
        }
      };

      ws.onerror = (event) => {
        setState(prev => ({
          ...prev,
          error: 'Connection error',
        }));
      };

      ws.onclose = () => {
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }));

        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1,
            }));
            connect();
          }, reconnectDelay * Math.min(state.reconnectAttempts + 1, 5));
        }
      };

      wsRef.current = ws;
      */
    } catch (e) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: e instanceof Error ? e.message : 'Failed to connect',
      }));
    }
  }, [endpoint, widgetIds, categories, autoReconnect, reconnectDelay, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Clean up mock interval
    if ((wsRef as any).mockInterval) {
      clearInterval((wsRef as any).mockInterval);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
    }));
  }, []);

  // Dismiss an insight
  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));

    // Notify server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'dismiss',
        insightId: id,
      }));
    }
  }, []);

  // Clear all insights
  const clearInsights = useCallback(() => {
    setInsights([]);
  }, []);

  // Get insights for a specific widget
  const getInsightsForWidget = useCallback((widgetId: string) => {
    return insights.filter(i => i.widgetId === widgetId);
  }, [insights]);

  // Get insights by category
  const getInsightsByCategory = useCallback((category: string) => {
    return insights.filter(i => i.category === category);
  }, [insights]);

  // Get critical insights
  const getCriticalInsights = useCallback(() => {
    return insights.filter(i => i.severity === 'error' || i.severity === 'warning');
  }, [insights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-connect if endpoint changes
  useEffect(() => {
    if (endpoint) {
      connect();
    }
    return () => disconnect();
  }, [endpoint]);

  // Remove expired insights
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setInsights(prev =>
        prev.filter(i => !i.expiresAt || new Date(i.expiresAt) > now)
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    insights,
    state,
    connect,
    disconnect,
    dismissInsight,
    clearInsights,
    getInsightsForWidget,
    getInsightsByCategory,
    getCriticalInsights,
  };
}

// ============================================================================
// Widget-specific hook
// ============================================================================

export function useWidgetInsights(widgetId: string) {
  const { insights, dismissInsight, state } = useInsightStream({
    widgetIds: [widgetId],
  });

  return {
    insights,
    count: insights.length,
    hasInsights: insights.length > 0,
    hasCritical: insights.some(i => i.severity === 'error'),
    hasWarning: insights.some(i => i.severity === 'warning'),
    dismiss: dismissInsight,
    isConnected: state.connected,
  };
}

export default useInsightStream;
