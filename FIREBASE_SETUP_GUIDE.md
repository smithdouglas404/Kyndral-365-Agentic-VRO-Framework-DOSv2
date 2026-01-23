# Firebase Authentication Setup Guide
**Date:** January 23, 2026
**Status:** ✅ IMPLEMENTATION COMPLETE

---

## Overview

Firebase Authentication has been successfully integrated into the system, replacing the custom JWT-based authentication. This provides:
- Industry-standard authentication with Firebase Auth
- Role-based access control (8 user roles)
- Seamless user management
- Enhanced security with Firebase Admin SDK

---

## Architecture

### Backend (Firebase Admin SDK)
- **File:** `server/auth/firebaseAdmin.ts`
- **Purpose:** Server-side Firebase authentication and user management
- **Features:**
  - Verify Firebase ID tokens from clients
  - Manage user roles via custom claims
  - Create/delete Firebase users
  - Password reset email generation
  - User listing for admin

### Frontend (Firebase Client SDK)
- **File:** `client/src/lib/firebase.ts`
- **Purpose:** Client-side Firebase authentication
- **Features:**
  - Sign in with email/password
  - Sign up (create account)
  - Sign out
  - Get Firebase ID token for API requests
  - Listen for auth state changes
  - Get user role from custom claims

### Middleware
- **File:** `server/auth/firebaseMiddleware.ts`
- **Purpose:** Protect API routes with Firebase authentication
- **Features:**
  - `authenticateFirebase` - Require valid Firebase ID token
  - `requireRole` - Require specific role(s)
  - `authenticateOptional` - Optional authentication
  - Role-based workspace mapping (RBAC)

---

## User Roles

The system supports 8 distinct roles with workspace isolation:

| Role | ID | Description | Home Page |
|------|----|-----------| ----------|
| **Project Manager** | `pm` | Manages individual projects, sprints, and tasks | `/cop` |
| **Value Realization Office** | `vro` | Tracks ROI, benefits, and value delivery | `/dashboard` |
| **Timeline Management Office** | `tmo` | Monitors schedules, SPI, velocity | `/dashboard-tmo` |
| **Financial Operations** | `finops` | Manages budgets, EVM, cost control | `/dashboard-finops` |
| **Risk Management** | `risk` | Tracks risks, issues, mitigation | `/risk` |
| **Governance & Compliance** | `governance` | Ensures regulatory compliance | `/dashboard-governance` |
| **Organizational Change Mgmt** | `ocm` | Manages stakeholder engagement | `/dashboard-ocm` |
| **Executive Leadership** | `executive` | Strategic oversight (full access) | `/cop` |

---

## Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "Portfolio Management System")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firebase Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Click "Save"

### Step 3: Generate Service Account Key

1. In Firebase Console, go to **Project settings** (gear icon) → **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file (e.g., `firebase-service-account.json`)
4. **Keep this file secure** - it has admin access to your Firebase project

### Step 4: Get Firebase Client Configuration

1. In Firebase Console, go to **Project settings** → **General**
2. Scroll down to "Your apps"
3. Click "Web" (</>) icon
4. Register your app
5. Copy the `firebaseConfig` object

### Step 5: Set Environment Variables

#### Backend (Replit Secrets or .env)
Add these environment variables with values from your service account JSON:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Alternative:** Store the entire service account JSON file and set:
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

#### Frontend (.env.local or Replit Secrets)
Add these environment variables from your Firebase config:

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

**Important:** Use `VITE_` prefix for all frontend environment variables (Vite requirement).

---

## Database Schema

### Migration Applied
```sql
-- Add Firebase UID column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
```

**Column:** `firebase_uid`
- **Type:** VARCHAR(255)
- **Purpose:** Links local database user to Firebase authentication user
- **Constraint:** UNIQUE (one-to-one mapping)

---

## API Endpoints

### Firebase Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/firebase/verify` | Verify Firebase ID token and return user data | Yes (Firebase) |
| POST | `/api/auth/firebase/register` | Complete user registration after Firebase account creation | Yes (Firebase) |
| POST | `/api/auth/firebase/logout` | Logout current user | Yes (Firebase) |
| GET | `/api/auth/firebase/me` | Get current authenticated user | Yes (Firebase) |
| PATCH | `/api/auth/firebase/me` | Update current user profile | Yes (Firebase) |
| POST | `/api/auth/firebase/set-role` | Set user role (admin only) | Yes (Admin) |
| GET | `/api/auth/firebase/users` | List all users (admin only) | Yes (Admin) |

### How to Use

#### 1. Register New User (Frontend)
```typescript
import { signUp, getIdToken } from '@/lib/firebase';

// Create Firebase user
const userCredential = await signUp(email, password, firstName, lastName);

// Get ID token
const idToken = await getIdToken();

// Complete registration with backend
const response = await fetch('/api/auth/firebase/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    role: 'pm',
    firstName: 'John',
    lastName: 'Doe',
  }),
});
```

#### 2. Login (Frontend)
```typescript
import { signIn, getIdToken } from '@/lib/firebase';

// Sign in with Firebase
const userCredential = await signIn(email, password);

// Get ID token
const idToken = await getIdToken();

// Verify with backend
const response = await fetch('/api/auth/firebase/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
});

const data = await response.json();
// data.user contains user info
// data.homePage contains role-specific home page
```

#### 3. Make Authenticated API Requests
```typescript
import { getIdToken } from '@/lib/firebase';

const idToken = await getIdToken();

const response = await fetch('/api/projects', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
});
```

---

## Protecting Routes (Backend)

### Require Authentication
```typescript
import { authenticateFirebase } from '../auth/firebaseMiddleware.js';

app.get('/api/projects', authenticateFirebase, async (req, res) => {
  // req.user is populated with user data
  // req.firebaseUid contains Firebase UID
  const projects = await storage.getProjects();
  res.json({ projects });
});
```

### Require Specific Role(s)
```typescript
import { authenticateFirebase, requireRole } from '../auth/firebaseMiddleware.js';

// Only FinOps and Executives can access
app.get('/api/financial/reports',
  authenticateFirebase,
  requireRole('finops', 'executive'),
  async (req, res) => {
    const reports = await getFinancialReports();
    res.json({ reports });
  }
);
```

### Optional Authentication
```typescript
import { authenticateOptional } from '../auth/firebaseMiddleware.js';

// Public endpoint, but attaches user if authenticated
app.get('/api/public/data', authenticateOptional, async (req, res) => {
  const data = req.user
    ? await getPersonalizedData(req.user.id)
    : await getPublicData();
  res.json({ data });
});
```

---

## Role-Based Access Control (RBAC)

### Workspace Mapping

Each role has access to specific pages:

```typescript
const roleWorkspaces = {
  pm: {
    allowedPages: ['/cop', '/project/:id', '/issues', '/change-requests'],
    homePage: '/cop',
  },
  vro: {
    allowedPages: ['/dashboard', '/cop', '/vro-framework', '/analytics'],
    homePage: '/dashboard',
  },
  tmo: {
    allowedPages: ['/dashboard-tmo', '/cop', '/resources', '/programs'],
    homePage: '/dashboard-tmo',
  },
  finops: {
    allowedPages: ['/dashboard-finops', '/cop', '/financial', '/reports'],
    homePage: '/dashboard-finops',
  },
  risk: {
    allowedPages: ['/risk', '/risks', '/cop', '/analytics'],
    homePage: '/risk',
  },
  governance: {
    allowedPages: ['/dashboard-governance', '/cop', '/admin/workflows'],
    homePage: '/dashboard-governance',
  },
  ocm: {
    allowedPages: ['/dashboard-ocm', '/cop', '/collaboration'],
    homePage: '/dashboard-ocm',
  },
  executive: {
    allowedPages: ['*'], // Full access
    homePage: '/cop',
  },
};
```

### Check Page Access (Backend)
```typescript
import { canAccessPage, getHomePageForRole } from '../auth/firebaseMiddleware.js';

const canAccess = canAccessPage('pm', '/financial'); // false
const canAccess2 = canAccessPage('pm', '/cop'); // true

const homePage = getHomePageForRole('finops'); // '/dashboard-finops'
```

---

## Migration from Custom JWT Auth

### Dual Authentication Support

Both custom JWT auth and Firebase auth are currently supported:
- **Legacy routes:** `/api/auth/login`, `/api/auth/register` (JWT-based)
- **Firebase routes:** `/api/auth/firebase/*` (Firebase-based)

### Migration Steps

1. **Enable Firebase** - Set environment variables (see Configuration section)
2. **Update Frontend** - Login/Register pages now use Firebase
3. **Update API Calls** - Replace JWT tokens with Firebase ID tokens
4. **Migrate Users** - Existing users can create Firebase accounts with same email
5. **Deprecate JWT** - Once all users migrated, remove custom auth routes

### Testing Both Systems

**JWT Auth (Legacy):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123456"}'
```

**Firebase Auth (New):**
```bash
# Sign in with Firebase client SDK, get ID token, then:
curl -X POST http://localhost:5000/api/auth/firebase/verify \
  -H "Authorization: Bearer FIREBASE_ID_TOKEN"
```

---

## Security Considerations

### Firebase Admin SDK
- **Private key** must be kept secure (use Replit Secrets, not .env in version control)
- Service account has full admin access to Firebase project
- Use environment variables, never hardcode credentials

### Firebase ID Tokens
- Tokens expire after 1 hour
- Client SDK automatically refreshes tokens
- Always verify tokens on backend with Firebase Admin SDK
- Never trust client-provided role claims - verify with Firebase

### Role Assignment
- Only system admins can change user roles
- Roles are stored as Firebase custom claims
- Custom claims are cryptographically signed by Firebase
- Cannot be tampered with by clients

---

## Troubleshooting

### "Firebase not configured" Error
**Cause:** Missing environment variables
**Solution:** Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY

### "Invalid or expired token" Error
**Cause:** Firebase ID token expired or malformed
**Solution:** Client should refresh token using Firebase SDK

### "User account is inactive" Error
**Cause:** User exists in Firebase but not in local database
**Solution:** Firebase middleware automatically creates local user on first login

### "Private key must be a string" Error
**Cause:** FIREBASE_PRIVATE_KEY not properly formatted
**Solution:** Ensure private key includes `-----BEGIN PRIVATE KEY-----` header and uses `\n` for newlines

---

## Next Steps

1. ✅ Firebase authentication implemented
2. ✅ Role-based middleware created
3. ⏳ **Next:** Implement frontend role-based routing (hide pages based on role)
4. ⏳ **Next:** Create admin UI for user role management
5. ⏳ **Next:** Migrate existing users to Firebase

---

## Files Created/Modified

### Created
1. `server/auth/firebaseAdmin.ts` - Firebase Admin SDK service
2. `server/auth/firebaseMiddleware.ts` - Authentication middleware
3. `server/routes/firebase-auth.ts` - Firebase auth API routes
4. `client/src/lib/firebase.ts` - Firebase client configuration
5. `migrations/add_firebase_uid.sql` - Database migration

### Modified
1. `server/routes.ts` - Registered Firebase auth routes
2. `server/index.ts` - Initialize Firebase Auth Service on startup
3. `client/src/pages/LoginPage.tsx` - Updated to use Firebase
4. `client/src/pages/RegisterPage.tsx` - Updated to use Firebase with role selector
5. `package.json` - Added firebase and firebase-admin dependencies

---

## Status

✅ **Firebase Authentication:** COMPLETE
✅ **Role-Based Middleware:** COMPLETE
✅ **API Routes:** COMPLETE
✅ **Database Migration:** COMPLETE
✅ **Build:** SUCCESSFUL

**Ready for:** Frontend role-based routing implementation
