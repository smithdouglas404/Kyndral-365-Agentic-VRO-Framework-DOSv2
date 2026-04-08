import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { useWebSocketContext } from './WebSocketContext';
import type { AgentUIPacket } from '@shared/agentUIPacket';

// ============================================================================
// State
// ============================================================================

interface LiquidCanvasState {
  /** All packets, keyed by ID for fast lookup */
  packets: Map<string, AgentUIPacket>;

  /** Ordered list by timestamp (newest first) */
  orderedIds: string[];
}

type Action =
  | { type: 'PUSH_PACKET'; packet: AgentUIPacket }
  | { type: 'PUSH_PACKETS'; packets: AgentUIPacket[] }
  | { type: 'REMOVE_PACKET'; packetId: string }
  | { type: 'CLEAR_AGENT'; agentId: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'EXPIRE_PACKETS' };

const MAX_PACKETS = 200;

function reducer(state: LiquidCanvasState, action: Action): LiquidCanvasState {
  switch (action.type) {
    case 'PUSH_PACKET': {
      const next = new Map(state.packets);
      next.set(action.packet.id, action.packet);
      const ids = [action.packet.id, ...state.orderedIds.filter(id => id !== action.packet.id)];
      // Trim to max
      if (ids.length > MAX_PACKETS) {
        const removed = ids.splice(MAX_PACKETS);
        removed.forEach(id => next.delete(id));
      }
      return { packets: next, orderedIds: ids };
    }

    case 'PUSH_PACKETS': {
      const next = new Map(state.packets);
      const newIds: string[] = [];
      action.packets.forEach(p => {
        next.set(p.id, p);
        newIds.push(p.id);
      });
      const existingSet = new Set(newIds);
      const ids = [...newIds, ...state.orderedIds.filter(id => !existingSet.has(id))];
      if (ids.length > MAX_PACKETS) {
        const removed = ids.splice(MAX_PACKETS);
        removed.forEach(id => next.delete(id));
      }
      return { packets: next, orderedIds: ids };
    }

    case 'REMOVE_PACKET': {
      const next = new Map(state.packets);
      next.delete(action.packetId);
      return {
        packets: next,
        orderedIds: state.orderedIds.filter(id => id !== action.packetId),
      };
    }

    case 'CLEAR_AGENT': {
      const next = new Map(state.packets);
      const toRemove: string[] = [];
      next.forEach((p, id) => {
        if (p.agentId === action.agentId) {
          toRemove.push(id);
        }
      });
      toRemove.forEach(id => next.delete(id));
      return {
        packets: next,
        orderedIds: state.orderedIds.filter(id => !toRemove.includes(id)),
      };
    }

    case 'CLEAR_ALL':
      return { packets: new Map(), orderedIds: [] };

    case 'EXPIRE_PACKETS': {
      const now = Date.now();
      const next = new Map(state.packets);
      const expired: string[] = [];
      next.forEach((p, id) => {
        if (p.expiresAt && new Date(p.expiresAt).getTime() < now) {
          expired.push(id);
        }
      });
      if (expired.length === 0) return state;
      expired.forEach(id => next.delete(id));
      return {
        packets: next,
        orderedIds: state.orderedIds.filter(id => !expired.includes(id)),
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

interface LiquidCanvasContextType {
  /** All packets as an array (for canvas components) */
  packets: AgentUIPacket[];

  /** Get packets for a specific agent */
  getAgentPackets: (agentId: string) => AgentUIPacket[];

  /** Get packets for a specific entity (project, initiative) */
  getEntityPackets: (entityId: string) => AgentUIPacket[];

  /** Get executive-level packets (high priority / critical) */
  getExecutivePackets: () => AgentUIPacket[];

  /** Push a packet (used by WebSocket handler or direct API calls) */
  pushPacket: (packet: AgentUIPacket) => void;

  /** Remove a packet */
  removePacket: (packetId: string) => void;

  /** Clear all packets from an agent */
  clearAgent: (agentId: string) => void;

  /** Total packet count */
  packetCount: number;
}

const LiquidCanvasContext = createContext<LiquidCanvasContextType>({
  packets: [],
  getAgentPackets: () => [],
  getEntityPackets: () => [],
  getExecutivePackets: () => [],
  pushPacket: () => {},
  removePacket: () => {},
  clearAgent: () => {},
  packetCount: 0,
});

export function useLiquidCanvas() {
  return useContext(LiquidCanvasContext);
}

// ============================================================================
// Provider — listens to WebSocket for agent:ui_packet messages
// ============================================================================

export function LiquidCanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    packets: new Map(),
    orderedIds: [],
  });

  const { lastMessage } = useWebSocketContext();

  // Listen for agent:ui_packet messages from WebSocket
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'agent:ui_packet' && lastMessage.data) {
      dispatch({ type: 'PUSH_PACKET', packet: lastMessage.data as AgentUIPacket });
    }

    // Also support batch pushes
    if (lastMessage.type === 'agent:ui_packets' && Array.isArray(lastMessage.data)) {
      dispatch({ type: 'PUSH_PACKETS', packets: lastMessage.data as AgentUIPacket[] });
    }
  }, [lastMessage]);

  // Expire packets every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'EXPIRE_PACKETS' });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ---- Derived arrays ----
  const packets = state.orderedIds.map(id => state.packets.get(id)!).filter(Boolean);

  const getAgentPackets = useCallback((agentId: string) => {
    return packets.filter(p => p.agentId === agentId);
  }, [packets]);

  const getEntityPackets = useCallback((entityId: string) => {
    return packets.filter(p => p.entityId === entityId);
  }, [packets]);

  const getExecutivePackets = useCallback(() => {
    return packets.filter(p =>
      (p.layout?.priority ?? 0) >= 7 ||
      p.blocks.some(b =>
        (b.type === 'insight' && (b.severity === 'critical' || b.severity === 'warning')) ||
        b.type === 'recommendation'
      )
    );
  }, [packets]);

  const pushPacket = useCallback((packet: AgentUIPacket) => {
    dispatch({ type: 'PUSH_PACKET', packet });
  }, []);

  const removePacket = useCallback((packetId: string) => {
    dispatch({ type: 'REMOVE_PACKET', packetId });
  }, []);

  const clearAgent = useCallback((agentId: string) => {
    dispatch({ type: 'CLEAR_AGENT', agentId });
  }, []);

  return (
    <LiquidCanvasContext.Provider
      value={{
        packets,
        getAgentPackets,
        getEntityPackets,
        getExecutivePackets,
        pushPacket,
        removePacket,
        clearAgent,
        packetCount: state.orderedIds.length,
      }}
    >
      {children}
    </LiquidCanvasContext.Provider>
  );
}
