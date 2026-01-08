import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SimulationEvent, simulationEngine } from '../lib/liveSimulation';

export type DataMode = "VRO" | "PMO";

export interface SimulationMultipliers {
  forecastEfficiency: number;
  savingsRate: number;
  confidenceBoost: number;
  completionBoost: number;
  adoptionBoost: number;
  readinessBoost: number;
  progressBoost: number;
}

const VRO_MULTIPLIERS: SimulationMultipliers = {
  forecastEfficiency: 0.96,
  savingsRate: 0.08,
  confidenceBoost: 35,
  completionBoost: 30,
  adoptionBoost: 25,
  readinessBoost: 20,
  progressBoost: 15
};

const PMO_MULTIPLIERS: SimulationMultipliers = {
  forecastEfficiency: 1.15,
  savingsRate: 0.02,
  confidenceBoost: 0,
  completionBoost: 0,
  adoptionBoost: 0,
  readinessBoost: 0,
  progressBoost: -15
};

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
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  multipliers: SimulationMultipliers;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<SimulationEvent[]>(simulationEngine.getEvents());
  const [latestEvent, setLatestEvent] = useState<SimulationEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(simulationEngine.getUnreadCount());
  const [isRunning, setIsRunning] = useState(simulationEngine.getIsRunning());
  const [selectedEvent, setSelectedEvent] = useState<SimulationEvent | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>("VRO");
  
  const multipliers = dataMode === "VRO" ? VRO_MULTIPLIERS : PMO_MULTIPLIERS;

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
      stopSimulation,
      dataMode,
      setDataMode,
      multipliers
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
