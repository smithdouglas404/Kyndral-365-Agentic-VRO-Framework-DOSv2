/**
 * Barrel export for the OpenProject UI kit (Kyndral-365 DOSv2 client).
 *
 * DROP-IN: copy the whole `openproject/` folder to <kyndral>/client/src/ and
 * import from "@/openproject" (or the relative path). Wiring per page:
 * docs/UI_BIDIRECTIONAL_WIRING_MAP.md in this connector folder.
 */
export {
  // hooks
  useOpenProjectLink,
  useOpenProjectStatus,
  // standalone fetchers
  pushToOpenProject,
  createWorkPackageInOpenProject,
  fetchOpenProjectStatus,
  // guards + utils
  isOpenProjectEntity,
  formatRelativeTime,
  // types
  type OpenProjectSyncedFields,
  type OpenProjectEntity,
  type OpenProjectPushChanges,
  type PushResult,
  type OpenProjectStatusResult,
  type CreateWorkPackageBody,
  type CreateWorkPackageResult,
  type UseOpenProjectLinkResult,
  type UseOpenProjectStatusResult,
} from "./useOpenProject";

export { SourceBadge, type SourceBadgeProps } from "./SourceBadge";

export {
  OpenProjectEditGuard,
  useBidirectionalSave,
  PushStatus,
  type OpenProjectEditGuardProps,
  type UseBidirectionalSaveOptions,
  type BidirectionalSaveApi,
  type PushStatusValue,
  type PushStatusProps,
} from "./OpenProjectEditGuard";

export {
  OpenProjectPanel,
  OpenProjectStatusDot,
  type OpenProjectPanelProps,
  type OpenProjectStatusDotProps,
} from "./OpenProjectPanel";

export {
  ApprovalQueue,
  type ApprovalQueueProps,
  type AgentFinding,
} from "./ApprovalQueue";

// Agent-runtime console (health, signal sources, computed metrics, project
// status, findings/HITL) embedded as a native Kyndral surface.
export { AgentConsole, type AgentConsoleProps } from "./AgentConsole";

// Ontology Mapping Studio (the universal mapper: source → ontology → widget).
export { MappingStudio, type MappingStudioProps } from "./MappingStudio";

// Widget registry that displays a mapped/ontology value with the chosen widget.
export {
  renderWidget,
  WIDGET_RENDERERS,
  FALLBACK_WIDGET,
  type WidgetProps,
  type WidgetValueType,
} from "./WidgetRenderer";

// Typed client the browser can use to reach the agent-runtime via the
// /api/agent proxy (server keeps the runtime token). Server-side agents use
// server/ai-sdk/agentRuntimeClient.ts instead.
export {
  AgentRuntimeClient,
  createAgentRuntimeClient,
  type AgentRuntimeClientOptions,
  type RuntimeMetric,
  type MetricsResult,
  type RuntimeRule,
  type RuntimeFinding,
  type PublishFindingInput,
} from "./agentRuntimeClient";
