/**
 * FIREBASE ADMIN SDK CONFIGURATION
 *
 * Handles server-side Firebase authentication and user management
 * Replaces the custom JWT-based auth system
 */

import * as admin from 'firebase-admin';
import type { IStorage } from '../storage.js';

export type FirebaseUserRole =
  | 'pm'              // Project Manager
  | 'vro'             // Value Realization Office
  | 'tmo'             // Timeline Management Office
  | 'finops'          // Financial Operations
  | 'risk'            // Risk Management
  | 'governance'      // Governance & Compliance
  | 'ocm'             // Organizational Change Management
  | 'executive'       // Executive Leadership
  | 'system_admin';   // System Administrator

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebaseAdmin(): admin.app.App {
  // Check if already initialized
  if (admin.apps.length > 0) {
    console.log('[Firebase] Admin SDK already initialized');
    return admin.apps[0]!;
  }

  // Initialize from service account JSON file (if available)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    try {
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      console.log('[Firebase] Admin SDK initialized from service account file');
      return admin.app();
    } catch (error) {
      console.error('[Firebase] Failed to load service account file:', error);
      throw new Error('Firebase service account file not found or invalid');
    }
  }

  // Initialize from environment variables (Replit Secrets)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  // Replace escaped newlines in private key
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
    projectId,
  });

  console.log(`[Firebase] Admin SDK initialized for project: ${projectId}`);
  return admin.app();
}

/**
 * Firebase Authentication Service
 */
export class FirebaseAuthService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;

    // Ensure Firebase Admin is initialized
    try {
      initializeFirebaseAdmin();
    } catch (error: any) {
      console.error('[Firebase] Initialization error:', error.message);
      console.warn('[Firebase] Auth service will not be functional until credentials are configured');
    }
  }

  /**
   * Verify Firebase ID token from client
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error: any) {
      console.error('[Firebase] Token verification error:', error.message);
      return null;
    }
  }

  /**
   * Get or create user in local database from Firebase token
   */
  async getOrCreateUser(decodedToken: admin.auth.DecodedIdToken) {
    const { uid, email, name, email_verified } = decodedToken;

    if (!email) {
      throw new Error('Email is required');
    }

    // Check if user exists in local database
    let user = await this.storage.getUserByEmail(email);

    if (!user) {
      // Create new user in local database
      const [firstName = '', lastName = ''] = (name || '').split(' ', 2);
      const role = (decodedToken.role as FirebaseUserRole) || 'pm'; // Default to PM role

      user = await this.storage.createUser({
        email,
        passwordHash: '', // Not used with Firebase
        firstName: firstName || 'User',
        lastName: lastName || '',
        role,
        isActive: true,
        emailVerified: email_verified || false,
        firebaseUid: uid, // Store Firebase UID for reference
      });

      console.log(`[Firebase] Created new user: ${email} (${role})`);
    }

    // Update Firebase UID if missing
    if (!user.firebaseUid) {
      await this.storage.updateUser(user.id, { firebaseUid: uid });
    }

    return user;
  }

  /**
   * Set custom claims (role) for a user
   */
  async setUserRole(uid: string, role: FirebaseUserRole): Promise<void> {
    try {
      await admin.auth().setCustomUserClaims(uid, { role });
      console.log(`[Firebase] Set custom claims for ${uid}: role=${role}`);
    } catch (error: any) {
      console.error('[Firebase] Set custom claims error:', error.message);
      throw new Error('Failed to set user role');
    }
  }

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseUid(uid: string): Promise<any | null> {
    try {
      const users = await this.storage.getUsers();
      return users.find(u => u.firebaseUid === uid) || null;
    } catch (error) {
      console.error('[Firebase] Get user by UID error:', error);
      return null;
    }
  }

  /**
   * Create Firebase user (for admin user management)
   */
  async createFirebaseUser(email: string, password: string, displayName: string): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      console.log(`[Firebase] Created Firebase user: ${email}`);
      return userRecord;
    } catch (error: any) {
      console.error('[Firebase] Create user error:', error.message);
      throw new Error(`Failed to create Firebase user: ${error.message}`);
    }
  }

  /**
   * Delete Firebase user
   */
  async deleteFirebaseUser(uid: string): Promise<void> {
    try {
      await admin.auth().deleteUser(uid);
      console.log(`[Firebase] Deleted Firebase user: ${uid}`);
    } catch (error: any) {
      console.error('[Firebase] Delete user error:', error.message);
      throw new Error('Failed to delete Firebase user');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<string> {
    try {
      const link = await admin.auth().generatePasswordResetLink(email);
      console.log(`[Firebase] Generated password reset link for ${email}`);
      return link;
    } catch (error: any) {
      console.error('[Firebase] Password reset error:', error.message);
      throw new Error('Failed to generate password reset link');
    }
  }

  /**
   * Update user email
   */
  async updateUserEmail(uid: string, newEmail: string): Promise<void> {
    try {
      await admin.auth().updateUser(uid, { email: newEmail });
      console.log(`[Firebase] Updated email for ${uid} to ${newEmail}`);
    } catch (error: any) {
      console.error('[Firebase] Update email error:', error.message);
      throw new Error('Failed to update user email');
    }
  }

  /**
   * List all Firebase users (for admin)
   */
  async listFirebaseUsers(maxResults: number = 1000): Promise<admin.auth.UserRecord[]> {
    try {
      const listUsersResult = await admin.auth().listUsers(maxResults);
      return listUsersResult.users;
    } catch (error: any) {
      console.error('[Firebase] List users error:', error.message);
      throw new Error('Failed to list Firebase users');
    }
  }

  /**
   * Check if Firebase Admin SDK is available
   */
  isAvailable(): boolean {
    try {
      return admin.apps.length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance (will be initialized with storage in routes)
export let firebaseAuthService: FirebaseAuthService | null = null;

export function initializeFirebaseAuthService(storage: IStorage): FirebaseAuthService {
  if (!firebaseAuthService) {
    firebaseAuthService = new FirebaseAuthService(storage);
  }
  return firebaseAuthService;
}

export function getFirebaseAuthService(): FirebaseAuthService {
  if (!firebaseAuthService) {
    throw new Error('Firebase Auth Service not initialized. Call initializeFirebaseAuthService first.');
  }
  return firebaseAuthService;
}
