/**
 * ONTOLOGY API ENDPOINTS
 *
 * Exposes ontology operations to Langflow flows.
 * Allows flows to use semantic reconciliation and entity mapping.
 */

import express from 'express';
import { ontologyService } from '../ontology/index.js';

const router = express.Router();

/**
 * Reconcile entity type across methodologies
 * POST /api/ontology/reconcile-entity
 *
 * Body: {
 *   sourceType: "epic",
 *   sourceSystem: "jira"
 * }
 *
 * Returns: "http://nextera.energy/ontology/safe#Epic"
 */
router.post('/reconcile-entity', async (req, res) => {
  try {
    const { sourceType, sourceSystem } = req.body;

    if (!sourceType || !sourceSystem) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceType, sourceSystem'
      });
    }

    const conceptURI = ontologyService.reconcileEntity(sourceType, sourceSystem);
    const label = ontologyService.getLabel(conceptURI);
    const comment = ontologyService.getComment(conceptURI);

    console.log(`[OntologyAPI] Reconciled: ${sourceSystem}.${sourceType} → ${conceptURI}`);

    res.json({
      success: true,
      sourceType,
      sourceSystem,
      conceptURI,
      label,
      comment
    });
  } catch (error: any) {
    console.error('[OntologyAPI] Error reconciling entity:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reconcile field name across systems
 * POST /api/ontology/reconcile-field
 *
 * Body: {
 *   fieldName: "assignee",
 *   sourceSystem: "jira"
 * }
 *
 * Returns: "http://nextera.energy/ontology/pm#assignee"
 */
router.post('/reconcile-field', async (req, res) => {
  try {
    const { fieldName, sourceSystem } = req.body;

    if (!fieldName || !sourceSystem) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fieldName, sourceSystem'
      });
    }

    const propertyURI = ontologyService.reconcileField(fieldName, sourceSystem);
    const label = ontologyService.getLabel(propertyURI);

    console.log(`[OntologyAPI] Reconciled field: ${sourceSystem}.${fieldName} → ${propertyURI}`);

    res.json({
      success: true,
      fieldName,
      sourceSystem,
      propertyURI,
      label
    });
  } catch (error: any) {
    console.error('[OntologyAPI] Error reconciling field:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get equivalent concepts across methodologies
 * GET /api/ontology/equivalents?concept=http://nextera.energy/ontology/safe%23Epic
 */
router.get('/equivalents', async (req, res) => {
  try {
    const { concept } = req.query;

    if (!concept) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameter: concept'
      });
    }

    const equivalents = ontologyService.getEquivalentConcepts(concept as string);

    console.log(`[OntologyAPI] Equivalents for ${concept}: ${equivalents.length} found`);

    res.json({
      success: true,
      concept,
      equivalents: equivalents.map(uri => ({
        uri,
        label: ontologyService.getLabel(uri)
      }))
    });
  } catch (error: any) {
    console.error('[OntologyAPI] Error getting equivalents:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all classes in ontology
 * GET /api/ontology/classes
 */
router.get('/classes', async (req, res) => {
  try {
    const classes = ontologyService.getClasses();

    res.json({
      success: true,
      count: classes.length,
      classes: classes.map(uri => ({
        uri,
        label: ontologyService.getLabel(uri),
        comment: ontologyService.getComment(uri)
      }))
    });
  } catch (error: any) {
    console.error('[OntologyAPI] Error getting classes:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all properties in ontology
 * GET /api/ontology/properties
 */
router.get('/properties', async (req, res) => {
  try {
    const properties = ontologyService.getProperties();

    res.json({
      success: true,
      objectProperties: properties.objectProperties.map(uri => ({
        uri,
        label: ontologyService.getLabel(uri)
      })),
      datatypeProperties: properties.datatypeProperties.map(uri => ({
        uri,
        label: ontologyService.getLabel(uri)
      }))
    });
  } catch (error: any) {
    console.error('[OntologyAPI] Error getting properties:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get ontology statistics
 * GET /api/ontology/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = ontologyService.getStatistics();

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('[OntologyAPI] Error getting stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
