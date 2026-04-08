/**
 * OpenProject API Types — HAL+JSON resource definitions
 * Maps to SAFe 6.0 ontology via Palantir object types
 */

// ============================================================================
// HAL+JSON base types
// ============================================================================

export interface HALLink {
  href: string;
  title?: string;
  method?: string;
}

export interface HALResource {
  _type?: string;
  _links?: Record<string, HALLink | null>;
  _embedded?: Record<string, any>;
}

export interface HALCollection<T> extends HALResource {
  total: number;
  count: number;
  pageSize: number;
  offset: number;
  _embedded: { elements: T[] };
}

// ============================================================================
// Project (maps to SAFe Portfolio / Value Stream / ART)
// ============================================================================

export interface OPProject extends HALResource {
  id: number;
  identifier: string;
  name: string;
  description?: { raw: string; html?: string };
  public: boolean;
  active: boolean;
  statusExplanation?: { raw: string };
  createdAt: string;
  updatedAt: string;
  _links?: {
    self: HALLink;
    parent?: HALLink | null;
    status?: HALLink;
    [key: string]: HALLink | null | undefined;
  };
}

export interface OPCreateProject {
  name: string;
  identifier?: string;
  description?: { raw: string };
  public?: boolean;
  parent?: { href: string };
  status?: string;
  customField?: Record<string, any>;
}

// ============================================================================
// Work Package (maps to SAFe Epic / Feature / Story / Task / Risk)
// ============================================================================

export interface OPWorkPackage extends HALResource {
  id: number;
  lockVersion: number;
  subject: string;
  description?: { raw: string; html?: string };
  scheduleManually: boolean;
  startDate?: string | null;
  dueDate?: string | null;
  derivedStartDate?: string | null;
  derivedDueDate?: string | null;
  duration?: string | null;
  estimatedTime?: string | null;
  spentTime?: string;
  percentageDone: number;
  createdAt: string;
  updatedAt: string;
  position?: number;
  // Custom fields are flattened as customFieldN
  [key: string]: any;
  _links?: {
    self: HALLink;
    type: HALLink;
    status: HALLink;
    priority: HALLink;
    project: HALLink;
    assignee?: HALLink | null;
    responsible?: HALLink | null;
    version?: HALLink | null;
    parent?: HALLink | null;
    children?: HALLink;
    [key: string]: HALLink | null | undefined;
  };
}

export interface OPCreateWorkPackage {
  subject: string;
  description?: { raw: string };
  startDate?: string;
  dueDate?: string;
  estimatedTime?: string;
  percentageDone?: number;
  scheduleManually?: boolean;
  _links?: {
    type?: HALLink;
    status?: HALLink;
    priority?: HALLink;
    assignee?: HALLink | null;
    responsible?: HALLink | null;
    version?: HALLink | null;
    parent?: HALLink | null;
    [key: string]: HALLink | null | undefined;
  };
  // Custom fields
  [key: string]: any;
}

// ============================================================================
// Version (maps to SAFe PI / Sprint / Release)
// ============================================================================

export interface OPVersion extends HALResource {
  id: number;
  name: string;
  description?: { raw: string };
  startDate?: string;
  endDate?: string;
  status: string; // open, locked, closed
  sharing: string; // none, descendants, hierarchy, tree, system
  createdAt: string;
  updatedAt: string;
}

export interface OPCreateVersion {
  name: string;
  description?: { raw: string };
  startDate?: string;
  endDate?: string;
  status?: string;
  sharing?: string;
}

// ============================================================================
// Relation (maps to SAFe Dependency / AtlasDependency)
// ============================================================================

export interface OPRelation extends HALResource {
  id: number;
  name: string;
  type: 'follows' | 'precedes' | 'blocks' | 'blocked' | 'relates' | 'duplicates' | 'duplicated' | 'includes' | 'partof' | 'requires' | 'required';
  reverseType: string;
  description?: string;
  delay?: number; // lag days
  _links?: {
    from: HALLink;
    to: HALLink;
  };
}

export interface OPCreateRelation {
  type: OPRelation['type'];
  delay?: number;
  description?: string;
  _links: {
    from: HALLink;
    to: HALLink;
  };
}

// ============================================================================
// Time Entry (enables real EVM calculations)
// ============================================================================

export interface OPTimeEntry extends HALResource {
  id: number;
  hours: string; // ISO 8601 duration, e.g. "PT2H"
  comment?: { raw: string };
  spentOn: string; // date
  createdAt: string;
  updatedAt: string;
  _links?: {
    project: HALLink;
    workPackage: HALLink;
    user: HALLink;
    activity: HALLink;
  };
}

export interface OPCreateTimeEntry {
  hours: string;
  comment?: { raw: string };
  spentOn: string;
  _links: {
    project: HALLink;
    workPackage: HALLink;
    activity?: HALLink;
  };
}

// ============================================================================
// Budget (labor + material line items)
// ============================================================================

export interface OPBudget extends HALResource {
  id: number;
  subject: string;
  description?: { raw: string };
  spentUnits?: number;
  laborBudget?: string;
  materialBudget?: string;
  overallCosts?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Membership (maps to SAFe Team / AtlasTeam)
// ============================================================================

export interface OPMembership extends HALResource {
  id: number;
  createdAt: string;
  updatedAt: string;
  _links?: {
    project: HALLink;
    principal: HALLink;
    roles: HALLink[];
  };
}

// ============================================================================
// Activity / Journal (audit trail)
// ============================================================================

export interface OPActivity extends HALResource {
  id: number;
  comment?: { raw: string };
  details: Array<{ raw: string }>;
  createdAt: string;
  _links?: {
    user: HALLink;
    workPackage?: HALLink;
  };
}

// ============================================================================
// Notification
// ============================================================================

export interface OPNotification extends HALResource {
  id: number;
  subject: string;
  readIAN: boolean;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Webhook
// ============================================================================

export interface OPWebhook {
  id?: number;
  name: string;
  url: string;
  secret?: string;
  enabled: boolean;
  events: string[];
  projects?: number[];
}

// ============================================================================
// Custom Field
// ============================================================================

export interface OPCustomField extends HALResource {
  id: number;
  name: string;
  fieldFormat: string; // text, int, float, list, date, bool, user, version
  isRequired: boolean;
  isForAll: boolean;
  position: number;
}

// ============================================================================
// Meeting (maps to Governance Gate reviews)
// ============================================================================

export interface OPMeeting extends HALResource {
  id: number;
  title: string;
  startTime: string;
  duration: number; // minutes
  location?: string;
  _links?: {
    project: HALLink;
    author: HALLink;
  };
}

export interface OPCreateMeeting {
  title: string;
  startTime: string;
  duration: number;
  location?: string;
  _links: {
    project: HALLink;
  };
}

// ============================================================================
// Query (saved filters for agent dashboards)
// ============================================================================

export interface OPQuery extends HALResource {
  id: number;
  name: string;
  filters: any[];
  sortBy: any[];
  public: boolean;
}

// ============================================================================
// Type / Status / Priority (reference data)
// ============================================================================

export interface OPType {
  id: number;
  name: string;
  color?: string;
  position: number;
  isDefault: boolean;
  isMilestone: boolean;
}

export interface OPStatus {
  id: number;
  name: string;
  isClosed: boolean;
  isDefault: boolean;
  position: number;
  color?: string;
}

export interface OPPriority {
  id: number;
  name: string;
  position: number;
  isDefault: boolean;
  color?: string;
}

// ============================================================================
// User / Group
// ============================================================================

export interface OPUser extends HALResource {
  id: number;
  login: string;
  name: string;
  email?: string;
  admin: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OPGroup extends HALResource {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
