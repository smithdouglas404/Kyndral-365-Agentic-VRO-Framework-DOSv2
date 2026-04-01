/**
 * A2A MODULE INDEX
 *
 * Exports all A2A (Agent-to-Agent) protocol components.
 */

// Types
export * from './types.js';

// Agent Card Generator
export {
  generateAgentCard,
  generateAllAgentCards,
  setA2ABaseUrl,
  serializeAgentCard,
  validateAgentCard,
} from './AgentCardGenerator.js';

// Registry
export {
  A2ARegistry,
  getA2ARegistry,
  initializeA2ARegistry,
} from './A2ARegistry.js';

// Task Executor
export {
  A2ATaskExecutor,
  getA2ATaskExecutor,
} from './A2ATaskExecutor.js';
