import express, { type RequestHandler } from 'express';
import { getPalantirService } from '../mcp/MCPServiceFactory.js';

const router = express.Router();

router.get('/status', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) {
      return res.json({
        configured: false,
        connected: false,
        message: 'Palantir AIP not configured. Set PALANTIR_HOSTNAME and PALANTIR_TOKEN.',
      });
    }

    const result = await palantir.testConnection();
    res.json({ configured: true, ...result });
  } catch (error: any) {
    res.status(500).json({ configured: true, connected: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies', (async (_req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const ontologies = await palantir.listOntologies();
    res.json({ success: true, ontologies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/object-types', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const objectTypes = await palantir.listObjectTypes(req.params.rid);
    res.json({ success: true, objectTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/object-types/:objectType', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const objectType = await palantir.getObjectType(req.params.objectType, req.params.rid);
    res.json({ success: true, objectType });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/objects/:objectType', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const { objectType, rid } = req.params;
    const result = await palantir.listObjects(objectType, {
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      pageToken: req.query.pageToken as string,
      select: req.query.select ? (req.query.select as string).split(',') : undefined,
      ontologyRid: rid,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/objects/:objectType/:primaryKey', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const obj = await palantir.getObject(req.params.objectType, req.params.primaryKey, {
      ontologyRid: req.params.rid,
    });
    res.json({ success: true, object: obj });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/ontologies/:rid/objects/:objectType/search', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const { objectType, rid } = req.params;
    const { where, pageSize, pageToken, orderBy, select } = req.body;

    if (!where) {
      return res.status(400).json({ error: 'Search filter (where) is required' });
    }

    const result = await palantir.searchObjects(objectType, where, {
      pageSize,
      pageToken,
      orderBy,
      select,
      ontologyRid: rid,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/ontologies/:rid/actions/:actionApiName/apply', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const result = await palantir.applyAction(
      req.params.actionApiName,
      req.body.parameters || {},
      req.params.rid,
    );
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.post('/ontologies/:rid/queries/:queryApiName/execute', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const result = await palantir.executeQuery(
      req.params.queryApiName,
      req.body.parameters || {},
      req.params.rid,
    );
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

router.get('/ontologies/:rid/metadata', (async (req, res) => {
  try {
    const palantir = getPalantirService();
    if (!palantir) return res.status(503).json({ error: 'Palantir AIP not configured' });

    const metadata = await palantir.getOntologyFullMetadata(req.params.rid);
    res.json({ success: true, metadata });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}) as RequestHandler);

export function registerPalantirRoutes(app: express.Application): void {
  app.use('/api/palantir', router);
}

export default router;
