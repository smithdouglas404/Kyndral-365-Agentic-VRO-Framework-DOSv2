import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './log';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    log('WebSocket client connected', 'websocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (e) {
        log('Invalid WebSocket message received', 'websocket');
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      log('WebSocket client disconnected', 'websocket');
    });

    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`, 'websocket');
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'Real-time notifications active' }));
  });

  log('WebSocket server initialized on /ws', 'websocket');
  return wss;
}

export function broadcastNotification(notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  severity?: string;
  source?: string;
  sourceId?: string;
  actionUrl?: string;
  createdAt?: string;
}) {
  if (!wss) return;

  const payload = JSON.stringify({
    type: 'notification',
    data: notification
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

  log(`Broadcast notification: ${notification.title}`, 'websocket');
}

export function broadcastCriticalAlert(alert: {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  projectName?: string;
  agentSource?: string;
}) {
  if (!wss) return;

  const payload = JSON.stringify({
    type: 'critical_alert',
    data: alert
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

  log(`Broadcast critical alert: ${alert.title}`, 'websocket');
}

export function broadcastAgentInsight(insight: {
  id?: string;
  sourceAgent: string;
  agentName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentState?: any;
  rootCause?: any;
  recommendations?: any[];
  prediction?: any;
  relatedAgents?: any[];
  projectId?: string;
  projectName?: string;
}) {
  if (!wss) return;

  const payload = JSON.stringify({
    type: 'agent:insight',
    data: {
      ...insight,
      id: insight.id || `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

  log(`Broadcast agent insight from ${insight.agentName}: ${insight.title}`, 'websocket');
}

export function getConnectedClientCount(): number {
  return clients.size;
}
