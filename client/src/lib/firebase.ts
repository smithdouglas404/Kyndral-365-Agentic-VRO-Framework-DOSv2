/**
 * FIREBASE CLIENT SDK CONFIGURATION
 *
 * Handles client-side Firebase authentication
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function initializeFirebase(): Auth {
  if (auth) {
    return auth;
  }

  // Check if configuration is available
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase] Configuration missing. Set VITE_FIREBASE_* environment variables.');
    throw new Error('Firebase configuration is missing');
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  console.log('[Firebase] Client SDK initialized');
  return auth;
}

/**
 * Get Firebase auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    return initializeFirebase();
  }
  return auth;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Create new user account
 */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`,
    });
  }

  return userCredential;
}

/**
 * Sign out current user
 */
export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  return sendPasswordResetEmail(auth, email);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

/**
 * Get Firebase ID token (for API requests)
 */
export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('[Firebase] Failed to get ID token:', error);
    return null;
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/**
 * Get user role from custom claims
 */
export async function getUserRole(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.role as string || null;
  } catch (error) {
    console.error('[Firebase] Failed to get user role:', error);
    return null;
  }
}
