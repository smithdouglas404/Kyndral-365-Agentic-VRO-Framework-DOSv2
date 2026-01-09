import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { EXPANDED_PMO_PROJECTS, OKRS, calculateVROMetricsFromProjects, type VROAggregatedMetric, type OKR, type ProjectKPI, PROJECT_KPIS } from './unifiedMetrics';
import type { PMOProject } from './buPrograms';

export interface SimulationState {
  isLive: boolean;
  lastUpdate: Date;
  updateCount: number;
  projects: typeof EXPANDED_PMO_PROJECTS;
  okrs: OKR[];
  vroMetrics: VROAggregatedMetric[];
  kpis: Record<string, ProjectKPI[]>;
  recentChanges: DataChange[];
  pulsingMetrics: string[];
}

export interface DataChange {
  id: string;
  timestamp: Date;
  type: 'kpi' | 'okr' | 'project' | 'metric';
  entityName: string;
  field: string;
  oldValue: number;
  newValue: number;
  trend: 'up' | 'down';
}

type SimulationContextType = {
  state: SimulationState;
  toggleLive: () => void;
  forceUpdate: () => void;
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

function generateSmallChange(value: number, maxDelta: number = 2, isPositiveBias: boolean = true): number {
  const direction = isPositiveBias ? (Math.random() > 0.3 ? 1 : -1) : (Math.random() > 0.5 ? 1 : -1);
  const delta = random(0.1, maxDelta) * direction;
  return Math.max(0, Math.min(100, value + delta));
}

export function createInitialState(): SimulationState {
  return {
    isLive: true,
    lastUpdate: new Date(),
    updateCount: 0,
    projects: JSON.parse(JSON.stringify(EXPANDED_PMO_PROJECTS)),
    okrs: JSON.parse(JSON.stringify(OKRS)),
    vroMetrics: calculateVROMetricsFromProjects(),
    kpis: JSON.parse(JSON.stringify(PROJECT_KPIS)),
    recentChanges: [],
    pulsingMetrics: []
  };
}

export function simulateDataUpdate(prevState: SimulationState): SimulationState {
  const newChanges: DataChange[] = [];
  const pulsingMetrics: string[] = [];
  
  const newProjects = prevState.projects.map(project => {
    const updatedProject = { ...project };
    
    if (Math.random() > 0.7) {
      const oldVelocity = project.safe.velocity;
      const newVelocity = Math.round(generateSmallChange(oldVelocity, 3, true));
      updatedProject.safe = {
        ...project.safe,
        velocity: newVelocity
      };
      
      if (Math.abs(newVelocity - oldVelocity) >= 1) {
        newChanges.push({
          id: `change-${Date.now()}-${project.id}-vel`,
          timestamp: new Date(),
          type: 'project',
          entityName: project.name,
          field: 'Velocity',
          oldValue: oldVelocity,
          newValue: newVelocity,
          trend: newVelocity > oldVelocity ? 'up' : 'down'
        });
        pulsingMetrics.push(`project-${project.id}-velocity`);
      }
    }
    
    if (Math.random() > 0.8) {
      const oldPredictability = project.safe.predictability;
      const newPredictability = Math.round(generateSmallChange(oldPredictability, 2, true));
      updatedProject.safe = {
        ...updatedProject.safe,
        predictability: newPredictability
      };
      
      if (Math.abs(newPredictability - oldPredictability) >= 1) {
        newChanges.push({
          id: `change-${Date.now()}-${project.id}-pred`,
          timestamp: new Date(),
          type: 'project',
          entityName: project.name,
          field: 'Predictability',
          oldValue: oldPredictability,
          newValue: newPredictability,
          trend: newPredictability > oldPredictability ? 'up' : 'down'
        });
        pulsingMetrics.push(`project-${project.id}-predictability`);
      }
    }
    
    if (Math.random() > 0.85 && project.safe.okr) {
      const oldProgress = project.safe.okr.progress;
      const newProgress = Math.round(Math.min(100, generateSmallChange(oldProgress, 2, true)));
      updatedProject.safe = {
        ...updatedProject.safe,
        okr: {
          ...project.safe.okr,
          progress: newProgress
        }
      };
      
      if (Math.abs(newProgress - oldProgress) >= 1) {
        newChanges.push({
          id: `change-${Date.now()}-${project.id}-okr`,
          timestamp: new Date(),
          type: 'okr',
          entityName: project.name,
          field: 'OKR Progress',
          oldValue: oldProgress,
          newValue: newProgress,
          trend: newProgress > oldProgress ? 'up' : 'down'
        });
        pulsingMetrics.push(`project-${project.id}-okr`);
      }
    }
    
    return updatedProject;
  });
  
  const newOkrs = prevState.okrs.map(okr => {
    const updatedOkr = { ...okr };
    
    if (Math.random() > 0.6) {
      const krIndex = randomInt(0, okr.keyResults.length - 1);
      const kr = okr.keyResults[krIndex];
      const oldProgress = kr.progress;
      const newProgress = Math.round(Math.min(100, generateSmallChange(oldProgress, 1.5, true)));
      
      const newKeyResults = [...okr.keyResults];
      newKeyResults[krIndex] = { ...kr, progress: newProgress };
      updatedOkr.keyResults = newKeyResults;
      
      const avgProgress = Math.round(newKeyResults.reduce((s, k) => s + k.progress, 0) / newKeyResults.length);
      updatedOkr.overallProgress = avgProgress;
      
      if (Math.abs(newProgress - oldProgress) >= 1) {
        newChanges.push({
          id: `change-${Date.now()}-${okr.id}-kr${krIndex}`,
          timestamp: new Date(),
          type: 'okr',
          entityName: okr.objective.substring(0, 30),
          field: 'Key Result Progress',
          oldValue: oldProgress,
          newValue: newProgress,
          trend: newProgress > oldProgress ? 'up' : 'down'
        });
        pulsingMetrics.push(`okr-${okr.id}`);
      }
    }
    
    return updatedOkr;
  });
  
  const newKpis = { ...prevState.kpis };
  Object.keys(newKpis).forEach(projectId => {
    if (Math.random() > 0.7) {
      const kpiIndex = randomInt(0, newKpis[projectId].length - 1);
      const kpi = newKpis[projectId][kpiIndex];
      const oldValue = kpi.value;
      
      const isPositiveTrend = kpi.trend === 'up' || (kpi.trend === 'stable' && Math.random() > 0.5);
      const newValue = Number(generateSmallChange(oldValue, 1, isPositiveTrend).toFixed(1));
      
      newKpis[projectId] = [...newKpis[projectId]];
      newKpis[projectId][kpiIndex] = {
        ...kpi,
        value: newValue,
        lastUpdated: new Date(),
        trend: newValue > oldValue ? 'up' : newValue < oldValue ? 'down' : 'stable'
      };
      
      if (Math.abs(newValue - oldValue) >= 0.1) {
        newChanges.push({
          id: `change-${Date.now()}-${projectId}-kpi${kpiIndex}`,
          timestamp: new Date(),
          type: 'kpi',
          entityName: kpi.name,
          field: 'Value',
          oldValue,
          newValue,
          trend: newValue > oldValue ? 'up' : 'down'
        });
        pulsingMetrics.push(`kpi-${kpi.id}`);
      }
    }
  });
  
  const newVroMetrics = prevState.vroMetrics.map(metric => {
    const updatedMetric = { ...metric };
    
    if (Math.random() > 0.5) {
      const oldValue = metric.currentValue;
      const newValue = Math.round(generateSmallChange(oldValue, 1, true));
      updatedMetric.currentValue = newValue;
      updatedMetric.lastUpdated = new Date();
      
      if (Math.abs(newValue - oldValue) >= 1) {
        newChanges.push({
          id: `change-${Date.now()}-${metric.id}`,
          timestamp: new Date(),
          type: 'metric',
          entityName: metric.name,
          field: 'Current Value',
          oldValue,
          newValue,
          trend: newValue > oldValue ? 'up' : 'down'
        });
        pulsingMetrics.push(`vro-${metric.id}`);
      }
    }
    
    return updatedMetric;
  });
  
  const recentChanges = [...newChanges, ...prevState.recentChanges].slice(0, 20);
  
  return {
    ...prevState,
    lastUpdate: new Date(),
    updateCount: prevState.updateCount + 1,
    projects: newProjects,
    okrs: newOkrs,
    vroMetrics: newVroMetrics,
    kpis: newKpis,
    recentChanges,
    pulsingMetrics
  };
}

export const SimulationContext = createContext<SimulationContextType | null>(null);

export function useSimulation(): SimulationContextType {
  const context = useContext(SimulationContext);
  if (!context) {
    return {
      state: createInitialState(),
      toggleLive: () => {},
      forceUpdate: () => {}
    };
  }
  return context;
}

export function useSimulationState() {
  const [state, setState] = useState<SimulationState>(createInitialState);
  
  const toggleLive = useCallback(() => {
    setState(prev => ({ ...prev, isLive: !prev.isLive }));
  }, []);
  
  const forceUpdate = useCallback(() => {
    setState(prev => simulateDataUpdate(prev));
  }, []);
  
  useEffect(() => {
    if (!state.isLive) return;
    
    const interval = setInterval(() => {
      setState(prev => simulateDataUpdate(prev));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [state.isLive]);
  
  useEffect(() => {
    if (state.pulsingMetrics.length === 0) return;
    
    const timeout = setTimeout(() => {
      setState(prev => ({ ...prev, pulsingMetrics: [] }));
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [state.pulsingMetrics]);
  
  return { state, toggleLive, forceUpdate };
}
