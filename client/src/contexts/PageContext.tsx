import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

export interface PageContextData {
  pageType: 'dashboard' | 'division' | 'project' | 'portfolio' | 'tool' | 'framework' | 'overview' | 'other';
  entityId?: string;
  entityName?: string;
  businessUnit?: string;
  breadcrumb: string[];
}

interface PageContextValue {
  context: PageContextData;
  setPageContext: (context: Partial<PageContextData>) => void;
}

const defaultContext: PageContextData = {
  pageType: 'dashboard',
  breadcrumb: ['Dashboard']
};

const PageContext = createContext<PageContextValue>({
  context: defaultContext,
  setPageContext: () => {}
});

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [context, setContext] = useState<PageContextData>(defaultContext);
  const [lastLocation, setLastLocation] = useState<string>('');
  const [isExplicitlySet, setIsExplicitlySet] = useState(false);

  useEffect(() => {
    // Only auto-detect when location actually changes to a new route
    // If context was explicitly set by a page, preserve it until navigation
    if (location === lastLocation) {
      return;
    }
    
    // Reset explicit flag on navigation to new route
    setIsExplicitlySet(false);
    setLastLocation(location);
    
    // Auto-detect page context from route
    const path = location;
    
    if (path === '/' || path === '/dashboard') {
      setContext({
        pageType: 'dashboard',
        breadcrumb: ['Dashboard']
      });
    } else if (path.startsWith('/division/')) {
      const divisionId = path.split('/')[2];
      setContext({
        pageType: 'division',
        entityId: divisionId,
        breadcrumb: ['Dashboard', 'Division']
      });
    } else if (path.startsWith('/project/')) {
      const projectId = path.split('/')[2];
      setContext({
        pageType: 'project',
        entityId: projectId,
        breadcrumb: ['Dashboard', 'Project']
      });
    } else if (path.startsWith('/portfolio')) {
      setContext({
        pageType: 'portfolio',
        breadcrumb: ['Dashboard', 'Portfolio']
      });
    } else if (path.startsWith('/dashboard-tmo') || path.startsWith('/dashboard-finops') || 
               path.startsWith('/dashboard-okr') || path.startsWith('/dashboard-governance') ||
               path.startsWith('/dashboard-planning') || path.startsWith('/dashboard-ocm')) {
      // Agent dashboards - base context, pages will override with specifics
      setContext({
        pageType: 'dashboard',
        breadcrumb: ['Dashboard']
      });
    } else if (path === '/risk' || path === '/climate') {
      // Tool pages - base context, pages will override with specifics
      setContext({
        pageType: 'tool',
        breadcrumb: ['Dashboard']
      });
    } else if (path === '/vro-framework') {
      setContext({
        pageType: 'framework',
        breadcrumb: ['Dashboard', 'VRO Framework']
      });
    } else if (path === '/value-proposition') {
      setContext({
        pageType: 'overview',
        breadcrumb: ['Value Proposition']
      });
    } else if (path === '/policy-generator') {
      setContext({
        pageType: 'tool',
        breadcrumb: ['Tools', 'Policy Generator']
      });
    } else {
      // For unrecognized routes, set to 'other' but pages can override
      setContext({
        pageType: 'other',
        breadcrumb: ['Dashboard']
      });
    }
  }, [location, lastLocation]);

  const setPageContext = (newContext: Partial<PageContextData>) => {
    setIsExplicitlySet(true);
    setContext(prev => ({ ...prev, ...newContext }));
  };

  return (
    <PageContext.Provider value={{ context, setPageContext }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  return useContext(PageContext);
}

export function getSuggestedQuestions(context: PageContextData): string[] {
  const { pageType, entityId, entityName, businessUnit } = context;

  switch (pageType) {
    case 'dashboard':
      return [
        "What projects are at risk across the portfolio?",
        "Show me the top 5 projects by ROI",
        "Which projects have critical dependencies?",
        "What is the overall portfolio health?",
        "List projects that need immediate attention"
      ];
    
    case 'division':
      const divName = entityName || businessUnit || 'this division';
      return [
        `What projects in ${divName} are at risk?`,
        `Show me the dependencies for ${divName} projects`,
        `What's the total budget and ROI for ${divName}?`,
        `Which ${divName} projects need attention?`,
        "How do these projects relate to other divisions?"
      ];
    
    case 'project':
      return [
        "What are all the dependencies for this project?",
        "Show me the risk factors and recommendations",
        "What's the financial status and ROI forecast?",
        "Which other projects does this one impact?",
        "What are the key milestones and their status?"
      ];
    
    case 'portfolio':
      return [
        "What is the portfolio-wide ROI projection?",
        "Show me all cross-project dependencies",
        "Which projects are blocking others?",
        "What's the budget utilization across all projects?",
        "List the top risks across the portfolio"
      ];
    
    case 'tool':
      return [
        "How do I use this tool effectively?",
        "What are the key metrics shown here?",
        "Show me projects related to this analysis",
        "What actions can I take from these insights?",
        "How does this connect to the overall portfolio?"
      ];
    
    case 'framework':
      return [
        "How do the AI agents work together?",
        "What capabilities does each agent provide?",
        "How can these agents help with my projects?",
        "What integrations are available?",
        "How do I leverage the VRO framework?"
      ];
    
    case 'overview':
      return [
        "What are the key VRO benefits?",
        "How does VRO compare to traditional PMO?",
        "What value can I expect from VRO?",
        "How do I get started with VRO?",
        "What projects would benefit most from VRO?"
      ];
    
    default:
      return [
        "Show me all projects that are at risk",
        "What is the total portfolio ROI?",
        "Which projects have critical dependencies?",
        "What are the AI recommendations?",
        "List all projects in implementing stage"
      ];
  }
}
