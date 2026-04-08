import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
};

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: object) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastMessage: null,
  sendMessage: () => {},
});

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('[WebSocket] Connected to real-time notifications');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);

        if (message.type === 'agent:insight') {
          const dashboardKeys = [
            ['lpm-attributes'],
            ['portfolio-strategic-themes'],
            ['portfolio-flow-metrics'],
            ['dashboard-value-streams'],
            ['safe-value-streams-list'],
            ['value-stream-attributes'],
            ['art-attributes'],
            ['art-pi-objectives'],
            ['art-dora-metrics'],
            ['art-teams'],
            ['executive-insights'],
          ];

          dashboardKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }

        // Agent UI packets are handled by LiquidCanvasContext (listens to lastMessage)
        // Just invalidate relevant queries when packets arrive
        if (message.type === 'agent:ui_packet' || message.type === 'agent:ui_packets') {
          queryClient.invalidateQueries({ queryKey: ['liquid-canvas'] });
        }

        if (message.type === 'notification') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          if (message.data?.severity === 'critical' || message.data?.severity === 'high') {
            toast.error(message.data.title, {
              description: message.data.message,
              duration: 8000,
            });
          } else {
            toast.info(message.data.title, {
              description: message.data.message,
              duration: 5000,
            });
          }
        }

        if (message.type === 'critical_alert') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['interventions'] });
          
          toast.error(`🚨 ${message.data.title}`, {
            description: message.data.message,
            duration: 10000,
            action: message.data.projectName ? {
              label: 'View',
              onClick: () => {
                window.location.href = '/dashboard';
              }
            } : undefined,
          });
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[WebSocket] Disconnected, attempting reconnect...');
      
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoffDelay);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    wsRef.current = ws;
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}
