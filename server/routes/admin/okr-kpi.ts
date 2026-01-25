/**
 * OKR/KPI MANAGEMENT API
 *
 * Backend routes for managing Objectives and Key Results (OKRs)
 * and Key Performance Indicators (KPIs) at multiple organizational levels
 */

import type { Express, Request, Response } from 'express';
import { db } from '../../db.js';
import { okrs, keyResults, kpis, kpiHistory, type InsertOkr, type InsertKeyResult, type InsertKpi } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authenticate } from '../../auth/authMiddleware.js';
import { seedDefaultOKRs } from '../../scripts/seed-default-okrs.js';
import multer from 'multer';
import { ChatOpenAI } from '@langchain/openai';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ============================================================================
// OKR ROUTES
// ============================================================================

/**
 * GET /api/admin/okrs
 * Get all OKRs with optional filtering
 */
async function getAllOkrs(req: AuthRequest, res: Response) {
  try {
    // Check if user is admin
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { level, functionalArea, status } = req.query;

    let query = db.select().from(okrs);

    // Apply filters
    const conditions = [];
    if (level) conditions.push(eq(okrs.level, level as string));
    if (functionalArea) conditions.push(eq(okrs.functionalArea, functionalArea as string));
    if (status) conditions.push(eq(okrs.status, status as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allOkrs = await query;

    // Fetch key results for each OKR
    const okrsWithKeyResults = await Promise.all(
      allOkrs.map(async (okr) => {
        const kr = await db.select().from(keyResults).where(eq(keyResults.okrId, okr.id));
        return { ...okr, keyResults: kr };
      })
    );

    res.json({ okrs: okrsWithKeyResults });
  } catch (error: any) {
    console.error('Error fetching OKRs:', error);
    res.status(500).json({ error: 'Failed to fetch OKRs' });
  }
}

/**
 * POST /api/admin/okrs
 * Create a new OKR
 */
async function createOkr(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const okrData: InsertOkr = req.body;

    // Validate required fields
    if (!okrData.title || !okrData.level || !okrData.startDate || !okrData.endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newOkr] = await db.insert(okrs).values(okrData).returning();

    res.status(201).json({ okr: newOkr });
  } catch (error: any) {
    console.error('Error creating OKR:', error);
    res.status(500).json({ error: 'Failed to create OKR' });
  }
}

/**
 * GET /api/admin/okrs/:id
 * Get a specific OKR with its key results
 */
async function getOkrById(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    const [okr] = await db.select().from(okrs).where(eq(okrs.id, id));

    if (!okr) {
      return res.status(404).json({ error: 'OKR not found' });
    }

    const kr = await db.select().from(keyResults).where(eq(keyResults.okrId, id));

    res.json({ okr: { ...okr, keyResults: kr } });
  } catch (error: any) {
    console.error('Error fetching OKR:', error);
    res.status(500).json({ error: 'Failed to fetch OKR' });
  }
}

/**
 * PATCH /api/admin/okrs/:id
 * Update an OKR
 */
async function updateOkr(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if OKR exists
    const [existing] = await db.select().from(okrs).where(eq(okrs.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'OKR not found' });
    }

    // Update OKR
    const [updated] = await db
      .update(okrs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(okrs.id, id))
      .returning();

    res.json({ okr: updated });
  } catch (error: any) {
    console.error('Error updating OKR:', error);
    res.status(500).json({ error: 'Failed to update OKR' });
  }
}

/**
 * DELETE /api/admin/okrs/:id
 * Delete an OKR (cascade deletes key results)
 */
async function deleteOkr(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // Check if OKR exists
    const [existing] = await db.select().from(okrs).where(eq(okrs.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'OKR not found' });
    }

    // Delete OKR (key results cascade automatically)
    await db.delete(okrs).where(eq(okrs.id, id));

    res.json({ message: 'OKR deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting OKR:', error);
    res.status(500).json({ error: 'Failed to delete OKR' });
  }
}

/**
 * POST /api/admin/okrs/seed-defaults
 * Seed default OKRs for all agents (21 best-practice OKRs)
 */
async function seedDefaults(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('[OKR Routes] Seeding default OKRs...');

    await seedDefaultOKRs();

    res.json({
      success: true,
      message: 'Default OKRs seeded successfully',
    });
  } catch (error: any) {
    console.error('Error seeding default OKRs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed default OKRs',
      message: error.message,
    });
  }
}

// ============================================================================
// KEY RESULT ROUTES
// ============================================================================

/**
 * POST /api/admin/okrs/:okrId/key-results
 * Add a key result to an OKR
 */
async function createKeyResult(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { okrId } = req.params;
    const krData: InsertKeyResult = { ...req.body, okrId };

    // Validate required fields
    if (!krData.title || krData.targetValue === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newKr] = await db.insert(keyResults).values(krData).returning();

    res.status(201).json({ keyResult: newKr });
  } catch (error: any) {
    console.error('Error creating key result:', error);
    res.status(500).json({ error: 'Failed to create key result' });
  }
}

/**
 * PATCH /api/admin/key-results/:id
 * Update a key result
 */
async function updateKeyResult(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if key result exists
    const [existing] = await db.select().from(keyResults).where(eq(keyResults.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'Key result not found' });
    }

    // Calculate progress if currentValue changed
    if (updates.currentValue !== undefined && existing.targetValue) {
      const progress = Math.min(
        100,
        Math.max(0, Math.round((updates.currentValue / existing.targetValue) * 100))
      );
      updates.progress = progress;
    }

    // Update key result
    const [updated] = await db
      .update(keyResults)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(keyResults.id, id))
      .returning();

    res.json({ keyResult: updated });
  } catch (error: any) {
    console.error('Error updating key result:', error);
    res.status(500).json({ error: 'Failed to update key result' });
  }
}

/**
 * DELETE /api/admin/key-results/:id
 * Delete a key result
 */
async function deleteKeyResult(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // Check if key result exists
    const [existing] = await db.select().from(keyResults).where(eq(keyResults.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'Key result not found' });
    }

    await db.delete(keyResults).where(eq(keyResults.id, id));

    res.json({ message: 'Key result deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting key result:', error);
    res.status(500).json({ error: 'Failed to delete key result' });
  }
}

// ============================================================================
// KPI ROUTES
// ============================================================================

/**
 * GET /api/admin/kpis
 * Get all KPIs with optional filtering
 */
async function getAllKpis(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { level, functionalArea, category, status } = req.query;

    let query = db.select().from(kpis);

    // Apply filters
    const conditions = [];
    if (level) conditions.push(eq(kpis.level, level as string));
    if (functionalArea) conditions.push(eq(kpis.functionalArea, functionalArea as string));
    if (category) conditions.push(eq(kpis.category, category as string));
    if (status) conditions.push(eq(kpis.status, status as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allKpis = await query;

    res.json({ kpis: allKpis });
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
}

/**
 * POST /api/admin/kpis
 * Create a new KPI
 */
async function createKpi(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const kpiData: InsertKpi = req.body;

    // Validate required fields
    if (!kpiData.name || !kpiData.level || !kpiData.metric) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newKpi] = await db.insert(kpis).values(kpiData).returning();

    res.status(201).json({ kpi: newKpi });
  } catch (error: any) {
    console.error('Error creating KPI:', error);
    res.status(500).json({ error: 'Failed to create KPI' });
  }
}

/**
 * GET /api/admin/kpis/:id
 * Get a specific KPI with its history
 */
async function getKpiById(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    const [kpi] = await db.select().from(kpis).where(eq(kpis.id, id));

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    // Fetch history
    const history = await db
      .select()
      .from(kpiHistory)
      .where(eq(kpiHistory.kpiId, id))
      .orderBy(desc(kpiHistory.recordedAt))
      .limit(100);

    res.json({ kpi: { ...kpi, history } });
  } catch (error: any) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ error: 'Failed to fetch KPI' });
  }
}

/**
 * PATCH /api/admin/kpis/:id
 * Update a KPI
 */
async function updateKpi(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if KPI exists
    const [existing] = await db.select().from(kpis).where(eq(kpis.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    // Update KPI
    const [updated] = await db
      .update(kpis)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(kpis.id, id))
      .returning();

    // If currentValue changed, record in history
    if (updates.currentValue !== undefined && updates.currentValue !== existing.currentValue) {
      await db.insert(kpiHistory).values({
        kpiId: id,
        value: updates.currentValue,
        status: updates.status || existing.status,
        notes: updates.notes,
      });
    }

    res.json({ kpi: updated });
  } catch (error: any) {
    console.error('Error updating KPI:', error);
    res.status(500).json({ error: 'Failed to update KPI' });
  }
}

/**
 * DELETE /api/admin/kpis/:id
 * Delete a KPI
 */
async function deleteKpi(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // Check if KPI exists
    const [existing] = await db.select().from(kpis).where(eq(kpis.id, id));

    if (!existing) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    // Delete KPI (history cascades automatically)
    await db.delete(kpis).where(eq(kpis.id, id));

    res.json({ message: 'KPI deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({ error: 'Failed to delete KPI' });
  }
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|docx|md)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, TXT, and MD files are allowed.'));
    }
  },
});

/**
 * POST /api/admin/okrs/extract-from-document
 * Extract OKRs from uploaded strategy document using AI
 */
async function extractFromDocument(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'system_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // @ts-ignore - multer adds file to request
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text content from file
    let textContent = '';
    if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
      textContent = file.buffer.toString('utf-8');
    } else if (file.mimetype === 'application/pdf') {
      // For PDF, we would need pdf-parse or similar library
      // For now, return a helpful message
      return res.status(400).json({
        error: 'PDF extraction requires additional configuration',
        message: 'Please convert your PDF to text format or use TXT/MD files for now',
      });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX, we would need mammoth or similar library
      return res.status(400).json({
        error: 'DOCX extraction requires additional configuration',
        message: 'Please convert your DOCX to text format or use TXT/MD files for now',
      });
    }

    // Use AI to extract OKRs
    const llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.3,
    });

    const extractionPrompt = `You are an expert at extracting OKRs (Objectives and Key Results) from strategy documents.

Analyze the following document and extract all OKRs. For each OKR, provide:
- title: The objective statement
- description: A brief description of the objective
- level: One of "company", "project", or "functional"
- functionalArea: If applicable, one of "finops", "risk", "governance", "planning", "tmo", "pmo", "okr", "ocm"
- startDate: Start date in YYYY-MM-DD format (estimate current quarter start if not specified)
- endDate: End date in YYYY-MM-DD format (estimate current quarter end if not specified)
- status: "active"

Return ONLY a valid JSON array of OKRs, with no additional text or explanation.

Document content:
${textContent}

JSON array of OKRs:`;

    const result = await llm.invoke(extractionPrompt);
    const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);

    // Parse the AI response
    let extractedOKRs;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedOKRs = JSON.parse(jsonMatch[0]);
      } else {
        extractedOKRs = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('[OKR Extract] Failed to parse AI response:', content);
      return res.status(500).json({
        error: 'Failed to parse AI extraction results',
        message: 'The AI response was not in the expected format',
      });
    }

    console.log(`[OKR Extract] Extracted ${extractedOKRs.length} OKRs from ${file.originalname}`);

    res.json({
      success: true,
      okrs: extractedOKRs,
      filename: file.originalname,
    });
  } catch (error: any) {
    console.error('Error extracting OKRs from document:', error);
    res.status(500).json({
      error: 'Failed to extract OKRs',
      message: error.message,
    });
  }
}

// ============================================================================
// REGISTER ROUTES
// ============================================================================

export function registerOkrKpiRoutes(app: Express): void {
  // OKR routes
  app.get('/api/admin/okrs', authenticate, getAllOkrs);
  app.post('/api/admin/okrs', authenticate, createOkr);
  app.get('/api/admin/okrs/:id', authenticate, getOkrById);
  app.patch('/api/admin/okrs/:id', authenticate, updateOkr);
  app.delete('/api/admin/okrs/:id', authenticate, deleteOkr);
  app.post('/api/admin/okrs/seed-defaults', authenticate, seedDefaults);
  app.post('/api/admin/okrs/extract-from-document', authenticate, upload.single('file'), extractFromDocument);

  // Key result routes
  app.post('/api/admin/okrs/:okrId/key-results', authenticate, createKeyResult);
  app.patch('/api/admin/key-results/:id', authenticate, updateKeyResult);
  app.delete('/api/admin/key-results/:id', authenticate, deleteKeyResult);

  // KPI routes
  app.get('/api/admin/kpis', authenticate, getAllKpis);
  app.post('/api/admin/kpis', authenticate, createKpi);
  app.get('/api/admin/kpis/:id', authenticate, getKpiById);
  app.patch('/api/admin/kpis/:id', authenticate, updateKpi);
  app.delete('/api/admin/kpis/:id', authenticate, deleteKpi);

  console.log('✅ OKR/KPI routes registered');
}
