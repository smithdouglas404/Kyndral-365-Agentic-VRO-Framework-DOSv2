import { type ReactNode } from 'react';
import { SimulationProvider as Provider } from '@/contexts/SimulationContext';

interface SimulationProviderProps {
  children: ReactNode;
}

// Re-export for backward compatibility
export function SimulationProvider({ children }: SimulationProviderProps) {
  return <Provider>{children}</Provider>;
}
