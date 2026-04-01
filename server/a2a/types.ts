/**
 * A2A PROTOCOL TYPES
 *
 * Type definitions for Agent-to-Agent (A2A) protocol implementation.
 * Based on A2A Protocol Specification v0.3
 *
 * @see https://a2a-protocol.org/latest/specification/
 */

/**
 * Agent Card - Published metadata describing an agent's capabilities
 */
export interface AgentCard {
  // Core identity
  id: string;
  name: string;
  description: string;
  version: string;

  // Provider information
  provider: {
    name: string;
    url?: string;
    contact?: string;
  };

  // Capabilities flags
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
    multiModal?: boolean;
    humanInTheLoop?: boolean;
  };

  // Available skills/functions
  skills: AgentSkill[];

  // Protocol bindings
  interfaces: AgentInterface[];

  // Security configuration
  securitySchemes: SecurityScheme[];

  // Optional metadata
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Agent Skill - A capability the agent can perform
 */
export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  examples?: SkillExample[];
}

export interface SkillExample {
  input: string;
  output: string;
  description?: string;
}

/**
 * Agent Interface - Protocol binding for communication
 */
export interface AgentInterface {
  type: 'http' | 'grpc' | 'jsonrpc';
  baseUrl: string;
  version?: string;
}

/**
 * Security Scheme - Authentication method
 */
export interface SecurityScheme {
  type: 'apiKey' | 'oauth2' | 'bearer' | 'basic';
  name?: string;
  in?: 'header' | 'query';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
}

export interface OAuthFlows {
  clientCredentials?: {
    tokenUrl: string;
    scopes: Record<string, string>;
  };
  authorizationCode?: {
    authorizationUrl: string;
    tokenUrl: string;
    scopes: Record<string, string>;
  };
}

/**
 * Task - A unit of work in the A2A protocol
 */
export interface A2ATask {
  id: string;
  contextId?: string;
  status: TaskStatus;
  messages: TaskMessage[];
  artifacts: TaskArtifact[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task Status - Current state of a task
 */
export interface TaskStatus {
  state: TaskState;
  message?: string;
  timestamp: string;
  progress?: number; // 0-100
}

export type TaskState =
  | 'pending'
  | 'working'
  | 'input-required'
  | 'auth-required'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'rejected';

/**
 * Task Message - Communication within a task
 */
export interface TaskMessage {
  role: 'user' | 'agent' | 'system';
  parts: MessagePart[];
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type MessagePart =
  | TextPart
  | DataPart
  | FilePart;

export interface TextPart {
  type: 'text';
  text: string;
}

export interface DataPart {
  type: 'data';
  mimeType: string;
  data: string; // base64 encoded
}

export interface FilePart {
  type: 'file';
  mimeType: string;
  url: string;
  name?: string;
}

/**
 * Task Artifact - Output produced by a task
 */
export interface TaskArtifact {
  id: string;
  name: string;
  mimeType: string;
  parts: MessagePart[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Send Message Request
 */
export interface SendMessageRequest {
  contextId?: string;
  message: TaskMessage;
  config?: {
    timeout?: number;
    maxTokens?: number;
    temperature?: number;
  };
}

/**
 * Send Message Response
 */
export interface SendMessageResponse {
  task: A2ATask;
}

/**
 * List Tasks Request
 */
export interface ListTasksRequest {
  contextId?: string;
  state?: TaskState;
  limit?: number;
  offset?: number;
}

/**
 * List Tasks Response
 */
export interface ListTasksResponse {
  tasks: A2ATask[];
  total: number;
  hasMore: boolean;
}

/**
 * A2A Error Response
 */
export interface A2AError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Agent Registration - Internal registry entry
 */
export interface AgentRegistration {
  agentId: string;
  agentCard: AgentCard;
  status: 'active' | 'inactive' | 'maintenance';
  lastHealthCheck?: string;
  registeredAt: string;
  updatedAt: string;
}

/**
 * Discovery Response - List of available agents
 */
export interface DiscoveryResponse {
  agents: AgentCard[];
  total: number;
}
