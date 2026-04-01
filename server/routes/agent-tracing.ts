import { Router, Request, Response } from 'express';
import {
  getAgentMetrics,
  getTraces,
  getTraceSummary,
  clearTraces,
  setTracingEnabled,
  isTracingEnabled,
} from '../services/AgentTracing.js';

const router = Router();

router.get('/summary', (_req: Request, res: Response) => {
  try {
    const summary = getTraceSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', (req: Request, res: Response) => {
  try {
    const agentKey = req.query.agentKey as string | undefined;
    const metrics = getAgentMetrics(agentKey);
    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/traces', (req: Request, res: Response) => {
  try {
    const options: any = {};
    if (req.query.agentKey) options.agentKey = req.query.agentKey;
    if (req.query.traceId) options.traceId = req.query.traceId;
    if (req.query.eventType) options.eventType = req.query.eventType;
    if (req.query.limit) options.limit = parseInt(req.query.limit as string, 10);
    if (req.query.since) options.since = new Date(req.query.since as string);

    const traces = getTraces(options);
    res.json({ traces, count: traces.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    setTracingEnabled(!!enabled);
    res.json({ enabled: isTracingEnabled() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.json({ enabled: isTracingEnabled() });
});

router.delete('/clear', (req: Request, res: Response) => {
  try {
    const agentKey = req.query.agentKey as string | undefined;
    clearTraces(agentKey);
    res.json({ success: true, message: agentKey ? `Cleared traces for ${agentKey}` : 'All traces cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
