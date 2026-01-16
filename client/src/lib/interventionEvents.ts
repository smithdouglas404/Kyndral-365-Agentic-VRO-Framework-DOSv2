type InterventionEventType = 'intervention:created' | 'intervention:approved' | 'intervention:dismissed' | 'intervention:updated';

interface InterventionEvent {
  type: InterventionEventType;
  interventionId?: string;
  data?: {
    title?: string;
    status?: string;
    agentSource?: string;
    projectName?: string;
  };
  timestamp: number;
}

type InterventionEventListener = (event: InterventionEvent) => void;

class InterventionEventBus {
  private listeners: Set<InterventionEventListener> = new Set();

  subscribe(listener: InterventionEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: Omit<InterventionEvent, 'timestamp'>): void {
    const fullEvent: InterventionEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    this.listeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('Intervention event listener error:', error);
      }
    });
  }

  emitApproved(interventionId: string, data?: InterventionEvent['data']): void {
    this.emit({ type: 'intervention:approved', interventionId, data });
  }

  emitDismissed(interventionId: string, data?: InterventionEvent['data']): void {
    this.emit({ type: 'intervention:dismissed', interventionId, data });
  }

  emitCreated(interventionId: string, data?: InterventionEvent['data']): void {
    this.emit({ type: 'intervention:created', interventionId, data });
  }

  emitUpdated(interventionId?: string, data?: InterventionEvent['data']): void {
    this.emit({ type: 'intervention:updated', interventionId, data });
  }
}

export const interventionEvents = new InterventionEventBus();
export type { InterventionEvent, InterventionEventType };
