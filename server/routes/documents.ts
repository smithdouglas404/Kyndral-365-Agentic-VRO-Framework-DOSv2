import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { documents, documentVersions, insertDocumentSchema } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { authenticateFirebase } from "../auth/firebaseMiddleware";
import { documentParsingService } from "../lib/DocumentParsingService";

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter to validate allowed file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common document types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: PDF, Word, Excel, PowerPoint, Text, CSV, Images`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// GET /api/documents - List all documents
router.get("/", authenticateFirebase, async (req, res) => {
  try {
    const { projectId, status } = req.query;

    let query = db.select().from(documents).orderBy(desc(documents.createdAt));

    // Apply filters if provided
    if (projectId) {
      query = query.where(eq(documents.projectId, projectId as string)) as any;
    }
    if (status) {
      query = query.where(eq(documents.status, status as string)) as any;
    }

    const docs = await query;
    res.json(docs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /api/documents/:id - Get document by ID
router.get("/:id", authenticateFirebase, async (req, res) => {
  try {
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, req.params.id))
      .limit(1);

    if (!doc.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(doc[0]);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// POST /api/documents/upload - Upload a new document
router.post("/upload", authenticateFirebase, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { projectId, name, description, tags, status, documentType, complianceFramework, autoExtractPolicy } = req.body;

    if (!projectId) {
      // Clean up uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "projectId is required" });
    }

    // Create document record
    const documentData = {
      projectId,
      name: name || req.file.originalname,
      description: description || null,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType: documentType || null, // "policy_compliance", "sop", "regulation", "general"
      version: 1,
      status: status || "draft",
      uploadedBy: req.user?.id,
      tags: tags || null,
    };

    const [newDoc] = await db.insert(documents)
      .values(documentData)
      .returning();

    // Create initial version record
    await db.insert(documentVersions).values({
      documentId: newDoc.id,
      version: 1,
      filePath: req.file.path,
      fileSize: req.file.size,
      changeNotes: "Initial upload",
      uploadedBy: req.user?.id,
    });

    // Auto-trigger policy extraction if document is tagged as policy_compliance
    let policyExtractionId = null;
    if (documentType === "policy_compliance" && autoExtractPolicy !== false) {
      try {
        // Import policy extraction service dynamically to avoid circular deps
        const { policyExtractionService } = await import("../lib/PolicyExtractionService.js");

        // Trigger extraction asynchronously (don't block response)
        policyExtractionService.extractPolicy(newDoc.id, {
          model: "gpt-4",
          complianceFramework: complianceFramework || "Unknown",
          createdBy: req.user?.id || "system",
        }).then((policyId) => {
          console.log(`[DocumentUpload] Auto-triggered policy extraction: ${policyId}`);
        }).catch((error) => {
          console.error(`[DocumentUpload] Policy extraction failed:`, error);
        });

        policyExtractionId = "pending"; // Indicate extraction was triggered
      } catch (error) {
        console.error("[DocumentUpload] Failed to trigger policy extraction:", error);
      }
    }

    res.status(201).json({
      ...newDoc,
      policyExtractionTriggered: !!policyExtractionId,
    });
  } catch (error) {
    console.error("Error uploading document:", error);

    // Clean up file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Failed to upload document" });
  }
});

// GET /api/documents/:id/download - Download document file
router.get("/:id/download", authenticateFirebase, async (req, res) => {
  try {
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, req.params.id))
      .limit(1);

    if (!doc.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    const filePath = doc[0].filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(filePath, doc[0].name);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

// PUT /api/documents/:id - Update document metadata
router.put("/:id", authenticateFirebase, async (req, res) => {
  try {
    const { name, description, status, tags } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) updates.tags = tags;
    updates.updatedAt = new Date();

    const [updated] = await db.update(documents)
      .set(updates)
      .where(eq(documents.id, req.params.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete("/:id", authenticateFirebase, async (req, res) => {
  try {
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, req.params.id))
      .limit(1);

    if (!doc.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete file from filesystem
    if (fs.existsSync(doc[0].filePath)) {
      fs.unlinkSync(doc[0].filePath);
    }

    // Delete document versions from filesystem
    const versions = await db.select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, req.params.id));

    for (const version of versions) {
      if (fs.existsSync(version.filePath)) {
        fs.unlinkSync(version.filePath);
      }
    }

    // Delete from database
    await db.delete(documents).where(eq(documents.id, req.params.id));

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// GET /api/documents/:id/versions - Get document versions
router.get("/:id/versions", authenticateFirebase, async (req, res) => {
  try {
    const versions = await db.select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, req.params.id))
      .orderBy(desc(documentVersions.version));

    res.json(versions);
  } catch (error) {
    console.error("Error fetching document versions:", error);
    res.status(500).json({ error: "Failed to fetch document versions" });
  }
});

// GET /api/documents/:id/parse - Parse document and extract text content
router.get("/:id/parse", authenticateFirebase, async (req, res) => {
  try {
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, req.params.id))
      .limit(1);

    if (!doc.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    const filePath = doc[0].filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    console.log(`[DocumentParsing] Parsing document ${doc[0].id}: ${doc[0].name}`);

    // Parse the document
    const parsed = await documentParsingService.parseDocument(filePath, doc[0].mimeType);

    // Extract additional metadata
    const extractedMetadata = documentParsingService.extractMetadata(parsed.text);

    // Optionally chunk the text for RAG
    const chunks = documentParsingService.chunkText(parsed.text, {
      chunkSize: 1000,
      overlap: 100,
    });

    res.json({
      documentId: doc[0].id,
      documentName: doc[0].name,
      parsed: {
        text: parsed.text,
        pageCount: parsed.pageCount,
        metadata: parsed.metadata,
      },
      extracted: extractedMetadata,
      chunks: chunks.length,
      previewChunks: chunks.slice(0, 3), // First 3 chunks for preview
    });
  } catch (error: any) {
    console.error("Error parsing document:", error);
    res.status(500).json({
      error: "Failed to parse document",
      message: error.message,
    });
  }
});

// POST /api/documents/:id/index - Parse document and add to knowledge base for RAG
router.post("/:id/index", authenticateFirebase, async (req, res) => {
  try {
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, req.params.id))
      .limit(1);

    if (!doc.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    const filePath = doc[0].filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    const { agentTypes, chunkSize = 1000, overlap = 100 } = req.body;

    console.log(`[DocumentIndexing] Indexing document ${doc[0].id} for knowledge base`);

    // Parse the document
    const parsed = await documentParsingService.parseDocument(filePath, doc[0].mimeType);

    // Chunk the text for RAG
    const chunks = documentParsingService.chunkText(parsed.text, {
      chunkSize,
      overlap,
    });

    console.log(`[DocumentIndexing] Created ${chunks.length} chunks from ${doc[0].name}`);

    // Import knowledge base service dynamically
    try {
      const { knowledgeBaseService } = await import("../lib/KnowledgeBaseService.js");

      // Add each chunk to the knowledge base
      const indexingResults = await Promise.all(
        chunks.map((chunk, index) =>
          knowledgeBaseService.addDocument({
            content: chunk,
            metadata: {
              documentId: doc[0].id,
              documentName: doc[0].name,
              chunkIndex: index,
              totalChunks: chunks.length,
              projectId: doc[0].projectId,
              documentType: doc[0].documentType,
              ...parsed.metadata,
            },
            agentTypes: agentTypes || ['all'],
          })
        )
      );

      // Update document status to indicate it's been indexed
      await db.update(documents)
        .set({
          status: 'indexed',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, req.params.id));

      res.json({
        success: true,
        documentId: doc[0].id,
        documentName: doc[0].name,
        chunksIndexed: chunks.length,
        indexingResults: indexingResults.map((r) => r.id),
      });
    } catch (error: any) {
      console.error("[DocumentIndexing] Knowledge base service not available:", error);
      res.status(500).json({
        error: "Knowledge base service unavailable",
        message: error.message,
      });
    }
  } catch (error: any) {
    console.error("Error indexing document:", error);
    res.status(500).json({
      error: "Failed to index document",
      message: error.message,
    });
  }
});

// GET /api/documents/:id/preview - Get text preview of document
router.get("/:id/preview", authenticateFirebase, async (req, res) => {
  try {
    const doc = await db.select()
      .from(documents)
      .where(eq(documents.id, req.params.id))
      .limit(1);

    if (!doc.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    const filePath = doc[0].filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Parse the document
    const parsed = await documentParsingService.parseDocument(filePath, doc[0].mimeType);

    // Return first 500 characters as preview
    const preview = parsed.text.substring(0, 500);

    res.json({
      documentId: doc[0].id,
      documentName: doc[0].name,
      preview: preview + (parsed.text.length > 500 ? '...' : ''),
      fullLength: parsed.text.length,
      pageCount: parsed.pageCount,
    });
  } catch (error: any) {
    console.error("Error generating document preview:", error);
    res.status(500).json({
      error: "Failed to generate preview",
      message: error.message,
    });
  }
});

export default router;
