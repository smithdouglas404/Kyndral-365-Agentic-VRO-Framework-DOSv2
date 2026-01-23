/**
 * RESOURCE MANAGEMENT API
 * Endpoints for resource allocation, capacity planning, and skill tracking
 */

import type { Express, Request, Response } from 'express';
import type { IStorage } from '../storage.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export function registerResourceRoutes(app: Express, storage: IStorage) {

  // GET /api/resources - List all resources with allocation data
  app.get('/api/resources', async (req: Request, res: Response) => {
    try {
      const { departmentId, skillSet, available } = req.query;

      // Create resources table if not exists
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS resources (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          email TEXT,
          role TEXT,
          department_id TEXT,
          skills JSONB,
          capacity_hours_per_week NUMERIC DEFAULT 40,
          cost_per_hour NUMERIC,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Add is_active column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE resources
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
      `);

      // Create allocations table if not exists
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS resource_allocations (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          resource_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          allocation_percent NUMERIC NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE,
          role TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      let query;

      if (departmentId) {
        query = sql`
          SELECT r.*,
                 COALESCE(SUM(ra.allocation_percent), 0) as total_allocated
          FROM resources r
          LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            AND (ra.end_date IS NULL OR ra.end_date >= CURRENT_DATE)
          WHERE r.is_active = true AND r.department_id = ${departmentId}
          GROUP BY r.id
          ORDER BY r.name
        `;
      } else {
        query = sql`
          SELECT r.*,
                 COALESCE(SUM(ra.allocation_percent), 0) as total_allocated
          FROM resources r
          LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
            AND (ra.end_date IS NULL OR ra.end_date >= CURRENT_DATE)
          WHERE r.is_active = true
          GROUP BY r.id
          ORDER BY r.name
        `;
      }

      const result = await db.execute(query);
      let resources = result.rows;

      // Filter by availability
      if (available === 'true') {
        resources = resources.filter((r: any) => parseFloat(r.total_allocated) < 100);
      }

      res.json({
        success: true,
        resources,
      });
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch resources',
        message: error.message,
      });
    }
  });

  // GET /api/resources/:id - Get resource details with allocations
  app.get('/api/resources/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const resourceResult = await db.execute(
        sql`SELECT * FROM resources WHERE id = ${id} LIMIT 1`
      );

      if (resourceResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
      }

      const allocationsResult = await db.execute(sql`
        SELECT ra.*, p.name as project_name
        FROM resource_allocations ra
        LEFT JOIN projects p ON ra.project_id = p.id
        WHERE ra.resource_id = ${id}
        ORDER BY ra.start_date DESC
      `);

      res.json({
        success: true,
        resource: resourceResult.rows[0],
        allocations: allocationsResult.rows,
      });
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch resource',
        message: error.message,
      });
    }
  });

  // POST /api/resources - Create new resource
  app.post('/api/resources', async (req: Request, res: Response) => {
    try {
      const { name, email, role, departmentId, skills, capacityHoursPerWeek, costPerHour } = req.body;

      const result = await db.execute(sql`
        INSERT INTO resources (
          name, email, role, department_id, skills,
          capacity_hours_per_week, cost_per_hour
        ) VALUES (
          ${name},
          ${email || null},
          ${role || null},
          ${departmentId || null},
          ${skills ? JSON.stringify(skills) : null},
          ${capacityHoursPerWeek || 40},
          ${costPerHour || null}
        )
        RETURNING *
      `);

      res.status(201).json({
        success: true,
        resource: result.rows[0],
        message: 'Resource created successfully',
      });
    } catch (error: any) {
      console.error('Error creating resource:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create resource',
        message: error.message,
      });
    }
  });

  // POST /api/resources/:id/allocate - Allocate resource to project
  app.post('/api/resources/:id/allocate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { projectId, allocationPercent, startDate, endDate, role } = req.body;

      // Check if resource exists
      const resourceCheck = await db.execute(
        sql`SELECT * FROM resources WHERE id = ${id} LIMIT 1`
      );

      if (resourceCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
      }

      // Check current allocation
      const allocationCheck = await db.execute(sql`
        SELECT COALESCE(SUM(allocation_percent), 0) as total
        FROM resource_allocations
        WHERE resource_id = ${id}
          AND (end_date IS NULL OR end_date >= ${startDate})
      `);

      const currentAllocation = parseFloat(allocationCheck.rows[0]?.total || '0');
      if (currentAllocation + allocationPercent > 100) {
        return res.status(400).json({
          success: false,
          error: 'Resource over-allocated',
          message: `Current allocation: ${currentAllocation}%, Requested: ${allocationPercent}%`,
        });
      }

      const result = await db.execute(sql`
        INSERT INTO resource_allocations (
          resource_id, project_id, allocation_percent,
          start_date, end_date, role
        ) VALUES (
          ${id},
          ${projectId},
          ${allocationPercent},
          ${startDate},
          ${endDate || null},
          ${role || null}
        )
        RETURNING *
      `);

      res.status(201).json({
        success: true,
        allocation: result.rows[0],
        message: 'Resource allocated successfully',
      });
    } catch (error: any) {
      console.error('Error allocating resource:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to allocate resource',
        message: error.message,
      });
    }
  });

  // GET /api/resources/capacity/analysis - Capacity analysis across portfolio
  app.get('/api/resources/capacity/analysis', async (req: Request, res: Response) => {
    try {
      const { departmentId } = req.query;

      let query = sql`
        SELECT
          r.id,
          r.name,
          r.role,
          r.department_id,
          r.capacity_hours_per_week,
          COALESCE(SUM(ra.allocation_percent), 0) as allocated_percent,
          100 - COALESCE(SUM(ra.allocation_percent), 0) as available_percent,
          COUNT(DISTINCT ra.project_id) as project_count
        FROM resources r
        LEFT JOIN resource_allocations ra ON r.id = ra.resource_id
          AND (ra.end_date IS NULL OR ra.end_date >= CURRENT_DATE)
        WHERE r.is_active = true
      `;

      if (departmentId) {
        query = sql`${query} AND r.department_id = ${departmentId}`;
      }

      query = sql`${query} GROUP BY r.id ORDER BY allocated_percent DESC`;

      const result = await db.execute(query);

      // Calculate aggregate metrics
      const resources = result.rows;
      const totalCapacity = resources.reduce((sum: number, r: any) =>
        sum + parseFloat(r.capacity_hours_per_week || 0), 0);
      const totalAllocated = resources.reduce((sum: number, r: any) =>
        sum + (parseFloat(r.capacity_hours_per_week || 0) * parseFloat(r.allocated_percent) / 100), 0);
      const utilizationRate = totalCapacity > 0 ? (totalAllocated / totalCapacity * 100) : 0;

      const overallocated = resources.filter((r: any) => parseFloat(r.allocated_percent) > 100);
      const fullyAllocated = resources.filter((r: any) =>
        parseFloat(r.allocated_percent) >= 90 && parseFloat(r.allocated_percent) <= 100);
      const underutilized = resources.filter((r: any) => parseFloat(r.allocated_percent) < 50);

      res.json({
        success: true,
        analysis: {
          totalResources: resources.length,
          totalCapacityHours: totalCapacity,
          totalAllocatedHours: totalAllocated,
          utilizationRate: utilizationRate.toFixed(1),
          overallocatedCount: overallocated.length,
          fullyAllocatedCount: fullyAllocated.length,
          underutilizedCount: underutilized.length,
        },
        resources,
      });
    } catch (error: any) {
      console.error('Error analyzing capacity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze capacity',
        message: error.message,
      });
    }
  });

  // GET /api/resources/skills/matrix - Skills matrix across resources
  app.get('/api/resources/skills/matrix', async (req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`
        SELECT id, name, role, skills
        FROM resources
        WHERE is_active = true AND skills IS NOT NULL
        ORDER BY name
      `);

      // Extract all unique skills
      const skillsSet = new Set<string>();
      result.rows.forEach((r: any) => {
        if (r.skills) {
          const skills = typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills;
          if (Array.isArray(skills)) {
            skills.forEach((skill: string) => skillsSet.add(skill));
          }
        }
      });

      const allSkills = Array.from(skillsSet).sort();

      // Build skills matrix
      const matrix = result.rows.map((r: any) => {
        const skills = typeof r.skills === 'string' ? JSON.parse(r.skills) : (r.skills || []);
        const skillMap: Record<string, boolean> = {};
        allSkills.forEach(skill => {
          skillMap[skill] = Array.isArray(skills) && skills.includes(skill);
        });

        return {
          resourceId: r.id,
          resourceName: r.name,
          role: r.role,
          skills: skillMap,
        };
      });

      res.json({
        success: true,
        allSkills,
        matrix,
      });
    } catch (error: any) {
      console.error('Error fetching skills matrix:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch skills matrix',
        message: error.message,
      });
    }
  });

  console.log('✅ Resource management routes registered');
}
