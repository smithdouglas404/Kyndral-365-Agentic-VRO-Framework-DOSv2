import { type ReactNode } from 'react';
import { SimulationContext, useSimulationState } from '@/lib/liveSimulationEngine';

interface SimulationProviderProps {
  children: ReactNode;
}

export function SimulationProvider({ children }: SimulationProviderProps) {
  const simulation = useSimulationState();
  
  return (
    <SimulationContext.Provider value={simulation}>
      {children}
    </SimulationContext.Provider>
  );
}
