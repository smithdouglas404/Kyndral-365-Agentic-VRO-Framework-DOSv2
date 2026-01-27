// ============================================================
// SAFe 6.0 DATA - STUBBED
// Fetch real SAFe hierarchy from API using hooks
// ============================================================

import type {
  SAFe6Portfolio,
  StrategicTheme,
  ValueStream,
  PortfolioEpic,
  PortfolioOKR,
  PortfolioKPI,
  AgileReleaseTrain,
  ProgramIncrement,
  Feature,
  Team,
  TeamMember,
  Iteration,
  Story,
  Task,
  Dependency,
  FinancialSnapshot,
  RiskRegisterEntry,
  OKRAlignment,
  ARTKPI
} from './safe6Model';

// DEPRECATED: Fetch from API using useStrategicThemes() hook
export const strategicThemes: StrategicTheme[] = [];

// DEPRECATED: Fetch from API using useValueStreams() hook
export const valueStreams: ValueStream[] = [];

// DEPRECATED: Fetch from API using usePortfolioOKRs() hook
export const portfolioOKRs: PortfolioOKR[] = [];

// DEPRECATED: Fetch from API using usePortfolioKPIs() hook
export const portfolioKPIs: PortfolioKPI[] = [];

// DEPRECATED: Fetch from API using usePortfolioEpics() hook
export const portfolioEpics: PortfolioEpic[] = [];

// DEPRECATED: Fetch from API using useARTs() hook
export const arts: AgileReleaseTrain[] = [];

// DEPRECATED: Fetch from API using useProgramIncrements() hook
export const programIncrements: ProgramIncrement[] = [];

// DEPRECATED: Fetch from API using useTeams() hook
export const teams: Team[] = [];

// DEPRECATED: Fetch from API using useTeamMembers() hook
export const teamMembers: TeamMember[] = [];

// DEPRECATED: Fetch from API using useIterations() hook
export const iterations: Iteration[] = [];

// DEPRECATED: Fetch from API using useFeatures() hook
export const features: Feature[] = [];

// DEPRECATED: Fetch from API using useStories() hook
export const stories: Story[] = [];

// DEPRECATED: Fetch from API using useTasks() hook
export const tasks: Task[] = [];

// DEPRECATED: Fetch from API using useDependencies() hook
export const dependencies: Dependency[] = [];

// DEPRECATED: Fetch from API using useFinancialSnapshots() hook
export const financialSnapshots: FinancialSnapshot[] = [];

// DEPRECATED: Fetch from API using useRiskRegister() hook
export const riskRegister: RiskRegisterEntry[] = [];

// DEPRECATED: Fetch from API using useOKRAlignments() hook
export const okrAlignments: OKRAlignment[] = [];

// DEPRECATED: Fetch from API using useSAFePortfolio() hook
export const safe6Portfolio: SAFe6Portfolio = {
  id: 'portfolio-stub',
  name: 'Portfolio',
  description: 'Fetch from API',
  strategicThemes: [],
  valueStreams: [],
  budgetTotal: 0,
  budgetAllocated: 0,
  epics: [],
  kpis: [],
  okrs: [],
  lpmCadence: 'quarterly',
  solutionContext: 'Fetch from API',
  guardrails: []
};
