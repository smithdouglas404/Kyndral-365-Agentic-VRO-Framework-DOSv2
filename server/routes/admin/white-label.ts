/**
 * WHITE-LABEL & THEMING API (TIER 3)
 * Customizable branding, themes, and white-label configuration
 */

import type { Express, Request, Response } from "express";
import { db } from "../../db.js";
import { sql } from "drizzle-orm";

export function registerWhiteLabelRoutes(app: Express) {

  // Create white-label config table
  async function ensureWhiteLabelTable() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS white_label_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        company_name TEXT DEFAULT 'PPM Platform',
        logo_url TEXT,
        favicon_url TEXT,
        primary_color TEXT DEFAULT '#3b82f6',
        secondary_color TEXT DEFAULT '#10b981',
        accent_color TEXT DEFAULT '#8b5cf6',
        font_family TEXT DEFAULT 'Inter',
        custom_css TEXT,
        custom_domain TEXT,
        email_from_name TEXT,
        email_from_address TEXT,
        support_email TEXT,
        support_url TEXT,
        terms_url TEXT,
        privacy_url TEXT,
        features_enabled JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default config if not exists
    await db.execute(sql`
      INSERT INTO white_label_config (id)
      VALUES ('default')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  ensureWhiteLabelTable();

  // GET /api/admin/white-label - Get white-label configuration
  app.get("/api/admin/white-label", authenticate, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT * FROM white_label_config WHERE id = 'default' LIMIT 1
      `);

      res.json({
        success: true,
        config: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error fetching white-label config:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch configuration",
        message: error.message,
      });
    }
  });

  // PUT /api/admin/white-label - Update white-label configuration
  app.put("/api/admin/white-label", authenticate, async (req: Request, res: Response) => {
    try {
      const {
        companyName,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        customCss,
        customDomain,
        emailFromName,
        emailFromAddress,
        supportEmail,
        supportUrl,
        termsUrl,
        privacyUrl,
        featuresEnabled,
      } = req.body;

      const result = await db.execute(sql`
        UPDATE white_label_config SET
          company_name = ${companyName || 'PPM Platform'},
          logo_url = ${logoUrl || null},
          favicon_url = ${faviconUrl || null},
          primary_color = ${primaryColor || '#3b82f6'},
          secondary_color = ${secondaryColor || '#10b981'},
          accent_color = ${accentColor || '#8b5cf6'},
          font_family = ${fontFamily || 'Inter'},
          custom_css = ${customCss || null},
          custom_domain = ${customDomain || null},
          email_from_name = ${emailFromName || null},
          email_from_address = ${emailFromAddress || null},
          support_email = ${supportEmail || null},
          support_url = ${supportUrl || null},
          terms_url = ${termsUrl || null},
          privacy_url = ${privacyUrl || null},
          features_enabled = ${featuresEnabled ? JSON.stringify(featuresEnabled) : '{}'},
          updated_at = NOW()
        WHERE id = 'default'
        RETURNING *
      `);

      res.json({
        success: true,
        config: result.rows[0],
        message: 'White-label configuration updated successfully',
      });
    } catch (error: any) {
      console.error("Error updating white-label config:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update configuration",
        message: error.message,
      });
    }
  });

  // GET /api/white-label/theme - Public endpoint for theme (no auth required)
  app.get("/api/white-label/theme", authenticate, async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT
          company_name,
          logo_url,
          favicon_url,
          primary_color,
          secondary_color,
          accent_color,
          font_family,
          custom_css
        FROM white_label_config
        WHERE id = 'default'
        LIMIT 1
      `);

      res.json({
        success: true,
        theme: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error fetching theme:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch theme",
        message: error.message,
      });
    }
  });

  console.log('✅ White-label & theming routes registered (TIER 3)');
}
