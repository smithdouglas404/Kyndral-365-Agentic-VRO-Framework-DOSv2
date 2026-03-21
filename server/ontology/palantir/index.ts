/**
 * PALANTIR ONTOLOGY AS CODE DEFINITIONS
 *
 * Export all SAFe object type definitions for Palantir Foundry.
 * These can be used to:
 * 1. Generate YAML for deployment via Ontology as Code
 * 2. Reference object type schemas in application code
 * 3. Validate data before syncing to Palantir
 *
 * @see https://www.palantir.com/docs/foundry/ontology/ontology-as-code/
 */

// SAFe Portfolio Structure
export * from './AtlasDivision.js';
export * from './AtlasFeature.js';
export * from './AtlasStory.js';
export * from './AtlasTask.js';

// Aggregated YAML for deployment
import { AtlasDivisionYAML } from './AtlasDivision.js';
import { AtlasFeatureYAML } from './AtlasFeature.js';
import { AtlasStoryYAML } from './AtlasStory.js';
import { AtlasTaskYAML } from './AtlasTask.js';

export const FULL_ONTOLOGY_YAML = `
# ============================================================================
# ATLAS PPM ONTOLOGY - SAFe Work Item Types
# Deploy via: palantir-ontology-as-code deploy
# ============================================================================

${AtlasDivisionYAML}

${AtlasFeatureYAML}

${AtlasStoryYAML}

${AtlasTaskYAML}
`;

// Object type registry for dynamic access
export const OBJECT_TYPE_REGISTRY = {
  AtlasDivision: 'AtlasDivision',
  AtlasFeature: 'AtlasFeature',
  AtlasStory: 'AtlasStory',
  AtlasTask: 'AtlasTask',
} as const;

export type OntologyObjectType = keyof typeof OBJECT_TYPE_REGISTRY;
