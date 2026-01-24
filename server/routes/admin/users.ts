/**
 * USER MANAGEMENT API (ADMIN)
 * Admin endpoints for managing user accounts
 */

import type { Express, Request, Response } from "express";
import { authSystem, authenticate } from "../../auth/authMiddleware.js";
import { db } from "../../db.js";
import { users } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['system_admin', 'admin', 'pmo_lead', 'project_manager', 'team_member', 'executive', 'guest', 'pending_approval']).optional(),
  isActive: z.boolean().optional(),
});

export function registerUserManagementRoutes(app: Express) {

  // GET /api/users - List all users (admin only)
  app.get("/api/users", authenticate, async (req: Request, res: Response) => {
    try {
      // Admin role check
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only system administrators can access user management"
        });
      }

      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users);

      res.json(allUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        message: error.message,
      });
    }
  });

  // GET /api/users/:id - Get single user (admin only)
  app.get("/api/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      // Admin role check
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only system administrators can access user management"
        });
      }

      const { id } = req.params;

      const user = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user[0]);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        error: "Failed to fetch user",
        message: error.message,
      });
    }
  });

  // PUT /api/users/:id - Update user (admin only)
  app.put("/api/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      // Admin role check
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only system administrators can modify users"
        });
      }

      const { id } = req.params;
      const validated = UpdateUserSchema.parse(req.body);

      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user
      const updated = await db
        .update(users)
        .set({
          ...(validated.email && { email: validated.email }),
          ...(validated.firstName && { firstName: validated.firstName }),
          ...(validated.lastName && { lastName: validated.lastName }),
          ...(validated.role && { role: validated.role }),
          ...(validated.isActive !== undefined && { isActive: validated.isActive }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        });

      res.json({
        success: true,
        user: updated[0],
        message: "User updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({
        error: "Failed to update user",
        message: error.message,
      });
    }
  });

  // DELETE /api/users/:id - Delete user (admin only)
  app.delete("/api/users/:id", authenticate, async (req: Request, res: Response) => {
    try {
      // Admin role check
      if (req.user?.role !== 'system_admin') {
        return res.status(403).json({
          error: "Forbidden",
          message: "Only system administrators can delete users"
        });
      }

      const { id } = req.params;

      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete user
      await db.delete(users).where(eq(users.id, id));

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        error: "Failed to delete user",
        message: error.message,
      });
    }
  });
}
