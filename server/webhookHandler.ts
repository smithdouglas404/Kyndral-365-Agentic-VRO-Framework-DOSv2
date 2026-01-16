import { Request, Response } from "express";
import { storage } from "./storage";
import { createJiraClientFromAdapter } from "./jiraClient";
import crypto from "crypto";

export interface WebhookPayload {
  webhookEvent: string;
  timestamp: number;
  user?: { displayName: string; emailAddress: string };
  issue?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      issuetype: { name: string };
      status: { name: string };
      project: { key: string };
    };
  };
  changelog?: {
    items: Array<{
      field: string;
      fromString: string;
      toString: string;
    }>;
  };
}

function verifyJiraWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string | null
): { valid: boolean; error?: string } {
  if (!secret) {
    return { valid: true };
  }
  
  if (!signature) {
    return { valid: false, error: "Signature required but not provided" };
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Invalid signature length" };
    }
    
    const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    return { valid: isValid, error: isValid ? undefined : "Signature mismatch" };
  } catch (e) {
    return { valid: false, error: "Signature verification failed" };
  }
}

export async function handleJiraWebhook(req: Request, res: Response): Promise<void> {
  const endpointId = req.params.endpointId;
  
  try {
    const endpoints = await storage.getWebhookEndpoints();
    const endpoint = endpoints.find(e => e.id === endpointId);
    
    if (!endpoint) {
      res.status(404).json({ error: "Webhook endpoint not found" });
      return;
    }

    if (endpoint.isEnabled !== "true") {
      res.status(403).json({ error: "Webhook endpoint is disabled" });
      return;
    }

    const signature = req.headers['x-atlassian-webhook-signature'] as string | undefined;
    const rawPayload = JSON.stringify(req.body);
    
    const signatureResult = verifyJiraWebhookSignature(rawPayload, signature, endpoint.secretToken);
    if (!signatureResult.valid) {
      res.status(401).json({ error: signatureResult.error || "Invalid webhook signature" });
      return;
    }

    const payload = req.body as WebhookPayload;
    
    await storage.createWebhookEvent({
      webhookEndpointId: endpointId,
      eventType: payload.webhookEvent,
      payload: rawPayload,
      status: 'received',
    });

    switch (payload.webhookEvent) {
      case 'jira:issue_created':
      case 'jira:issue_updated':
        await handleJiraIssueEvent(endpoint.mcpAdapterId || '', payload);
        break;
      case 'jira:issue_deleted':
        console.log(`[Webhook] Issue deleted: ${payload.issue?.key}`);
        break;
      default:
        console.log(`[Webhook] Unhandled event type: ${payload.webhookEvent}`);
    }

    res.status(200).json({ 
      success: true, 
      message: "Webhook processed",
      event: payload.webhookEvent 
    });

  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    
    await storage.createWebhookEvent({
      webhookEndpointId: endpointId,
      eventType: req.body?.webhookEvent || 'unknown',
      payload: JSON.stringify(req.body),
      status: 'failed',
      processingError: error.message,
    });

    res.status(500).json({ error: "Failed to process webhook" });
  }
}

async function handleJiraIssueEvent(adapterId: string, payload: WebhookPayload): Promise<void> {
  if (!payload.issue) {
    console.log("[Webhook] No issue in payload, skipping");
    return;
  }

  const { issue, changelog } = payload;
  const projectKey = issue.fields.project.key;
  
  console.log(`[Webhook] Processing ${payload.webhookEvent} for ${issue.key}`);

  if (changelog) {
    const statusChange = changelog.items.find(item => item.field === 'status');
    if (statusChange) {
      console.log(`[Webhook] Status changed: ${statusChange.fromString} -> ${statusChange.toString}`);
      
      await storage.createNotification({
        type: 'info',
        title: `Jira Issue Updated: ${issue.key}`,
        message: `Status changed from "${statusChange.fromString}" to "${statusChange.toString}"`,
        severity: 'info',
        source: 'jira_webhook',
        sourceId: issue.id,
      });
    }
  }

  if (payload.webhookEvent === 'jira:issue_created') {
    await storage.createNotification({
      type: 'info',
      title: `New Jira Issue: ${issue.key}`,
      message: `"${issue.fields.summary}" was created in project ${projectKey}`,
      severity: 'info',
      source: 'jira_webhook',
      sourceId: issue.id,
    });
  }
}

export function registerWebhookRoutes(app: any): void {
  app.post("/api/webhooks/jira/:endpointId", handleJiraWebhook);

  app.post("/api/webhooks/test/:endpointId", async (req: Request, res: Response) => {
    try {
      const endpoints = await storage.getWebhookEndpoints();
      const endpoint = endpoints.find(e => e.id === req.params.endpointId);
      
      if (!endpoint) {
        return res.status(404).json({ error: "Endpoint not found" });
      }

      await storage.createWebhookEvent({
        webhookEndpointId: req.params.endpointId,
        eventType: 'test',
        payload: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        status: 'processed',
      });

      res.json({ success: true, message: "Test webhook received" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/webhooks/:endpointId/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getWebhookEvents();
      const filteredEvents = events.filter(e => e.webhookEndpointId === req.params.endpointId);
      res.json(filteredEvents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
