import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SimulationEvent, simulationEngine } from '../lib/liveSimulation';

interface SimulationContextType {
  events: SimulationEvent[];
  latestEvent: SimulationEvent | null;
  unreadCount: number;
  isRunning: boolean;
  selectedEvent: SimulationEvent | null;
  setSelectedEvent: (event: SimulationEvent | null) => void;
  markAsRead: (eventId: string) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<SimulationEvent[]>(simulationEngine.getEvents());
  const [latestEvent, setLatestEvent] = useState<SimulationEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(simulationEngine.getUnreadCount());
  const [isRunning, setIsRunning] = useState(simulationEngine.getIsRunning());
  const [selectedEvent, setSelectedEvent] = useState<SimulationEvent | null>(null);

  useEffect(() => {
    simulationEngine.start(5000);
    setIsRunning(true);

    const unsubscribe = simulationEngine.subscribe((event) => {
      setEvents([...simulationEngine.getEvents()]);
      setLatestEvent(event);
      setUnreadCount(simulationEngine.getUnreadCount());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const markAsRead = useCallback((eventId: string) => {
    simulationEngine.markAsRead(eventId);
    setUnreadCount(simulationEngine.getUnreadCount());
    setEvents([...simulationEngine.getEvents()]);
  }, []);

  const startSimulation = useCallback(() => {
    simulationEngine.start(5000);
    setIsRunning(true);
  }, []);

  const stopSimulation = useCallback(() => {
    simulationEngine.stop();
    setIsRunning(false);
  }, []);

  return (
    <SimulationContext.Provider value={{
      events,
      latestEvent,
      unreadCount,
      isRunning,
      selectedEvent,
      setSelectedEvent,
      markAsRead,
      startSimulation,
      stopSimulation
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
