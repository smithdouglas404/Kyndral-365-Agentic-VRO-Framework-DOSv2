/**
 * EXPRESS TYPE DECLARATIONS
 *
 * Global type augmentations for Express Request
 */

import type { User } from '../../shared/models/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      firebaseUid?: string;
      apiKey?: { userId: string; permissions: string[] };
    }
  }
}

// Export empty object to make this a module
export {};
