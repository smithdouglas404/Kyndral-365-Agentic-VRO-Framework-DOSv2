# 🚀 Post-Deployment Setup Guide

This guide covers all external services and configurations required to run the NextEra Energy ETO/VRO Platform.

---

## 📋 **Required Services** (Must Configure)

### 1. **Database - PostgreSQL** ✅ (Already Configured)
- **Status:** Already set up on Replit
- **URL:** `postgresql://postgres:password@helium/heliumdb`
- No action needed

### 2. **AI Services - Anthropic Claude** ✅ (Already Configured)
- **Status:** API key already configured
- **Purpose:** Powers all AI agents (FinOps, TMO, VRO, Risk, etc.)
- **Get API Key:** https://console.anthropic.com/
- **Environment Variable:** `ANTHROPIC_API_KEY`
- No action needed (already set)

### 3. **Firebase Authentication** ⚠️ **ACTION REQUIRED**

Firebase provides user authentication (sign-up, login, password reset).

#### **Setup Steps:**

**A. Create Firebase Project**
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: `nextera-eto` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

**B. Enable Email/Password Authentication**
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Email/Password**
3. Enable it and save

**C. Get Client Configuration (for Frontend)**
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app name: `NextEra ETO`
5. Copy the `firebaseConfig` object

**D. Add Environment Variables**

Add these to your `.env` file (client-side, prefixed with `VITE_`):

```bash
# Firebase Client Configuration (Frontend)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nextera-eto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nextera-eto
VITE_FIREBASE_STORAGE_BUCKET=nextera-eto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**E. Get Service Account (for Backend)**
1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file

**F. Add Server-Side Environment Variables**

**Option 1: Using JSON file**
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

**Option 2: Using individual environment variables (Recommended for Replit)**
```bash
FIREBASE_PROJECT_ID=nextera-eto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@nextera-eto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> **Note:** When adding `FIREBASE_PRIVATE_KEY` to Replit Secrets, use the actual multiline key with `\n` for newlines.

---

## 🔒 **Security Configuration** ⚠️ **ACTION REQUIRED**

### 4. **Encryption Key for Credentials**

The system encrypts integration credentials (Jira, Azure DevOps, etc.) before storing them.

**Generate a secure encryption key:**

```bash
# Run this in your terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to `.env`:**
```bash
ENCRYPTION_KEY=<your-generated-64-character-hex-string>
```

> **Critical:** Keep this key secure. If lost, you cannot decrypt stored credentials.

---

## 📧 **Optional Services** (Recommended for Production)

### 5. **LangSmith - Agent Observability** ✅ (Already Configured)
- **Status:** Already set up
- **Purpose:** Monitor and debug AI agent behavior
- **Dashboard:** https://smith.langchain.com/
- No action needed

### 6. **Email Notifications (SMTP)**

For sending email notifications about critical issues.

**Supported Services:**
- Gmail
- Office 365
- SendGrid
- AWS SES
- Any SMTP server

**Configuration (Gmail Example):**

1. **Enable App Password** (if using Gmail):
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password

2. **Add to `.env`:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_FROM_EMAIL=nextera-eto@company.com
```

### 7. **Application URL**

Set your application's public URL for links in notifications:

```bash
APP_URL=https://your-app-url.replit.dev
```

Or for production:
```bash
APP_URL=https://eto.yourcompany.com
```

---

## 🔗 **External Integrations** (Optional)

These integrations allow syncing data from external project management tools.

### 8. **Jira Integration**

**Setup:**
1. Get Jira API token: https://id.atlassian.com/manage-profile/security/api-tokens
2. Add to `.env`:

```bash
JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
```

### 9. **Azure DevOps Integration**

**Setup:**
1. Generate Personal Access Token (PAT) in Azure DevOps
2. Add to `.env`:

```bash
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PAT=your-personal-access-token
```

### 10. **Planview Integration**

```bash
PLANVIEW_URL=https://api.planview.com
PLANVIEW_API_KEY=your-planview-key
PLANVIEW_TENANT_ID=your-tenant-id
```

### 11. **ServiceNow Integration**

```bash
SERVICENOW_INSTANCE=your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
```

### 12. **Other Integrations**

The platform supports:
- **Asana:** `ASANA_ACCESS_TOKEN`
- **Monday.com:** `MONDAY_API_TOKEN`
- **Smartsheet:** `SMARTSHEET_ACCESS_TOKEN`
- **Rally:** `RALLY_API_KEY`
- **MS Project:** `MS_PROJECT_API_KEY`

All integrations are **optional** and can be configured later through the Admin → Integrations UI.

---

## 🚦 **Getting Started Checklist**

### Minimal Setup (Required to Run)
- [x] ✅ PostgreSQL Database (Already set up)
- [x] ✅ Anthropic API Key (Already set up)
- [ ] ⚠️ **Firebase Authentication** (Required for user login)
- [ ] ⚠️ **Encryption Key** (Required for secure credential storage)

### Recommended for Production
- [ ] 📧 Email/SMTP Configuration
- [ ] 🔗 Application URL
- [ ] 📊 External Integrations (Jira, Azure DevOps, etc.)

---

## 🧪 **Testing Your Setup**

### 1. Test Firebase Authentication
```bash
# Start the application
npm run dev

# Try to register a new user
# Navigate to: http://localhost:5000/register
```

### 2. Test Email Notifications (if configured)
Go to: **Admin → System Settings → Notifications**
- Click "Test Email"

### 3. Test Integrations
Go to: **Admin → Integrations**
- Add an integration
- Click "Test Connection"

---

## 📚 **Environment Variables Summary**

### **Required:**
```bash
# Database
DATABASE_URL=postgresql://...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Security
SESSION_SECRET=<random-secret>
ENCRYPTION_KEY=<64-char-hex-string>

# Firebase - Client (Frontend)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Firebase - Server (Backend)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **Optional:**
```bash
# Observability
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=nextera-eto
LANGCHAIN_TRACING_V2=true

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# Application
APP_URL=https://your-app.com
NODE_ENV=production

# External Integrations
JIRA_DOMAIN=...
JIRA_EMAIL=...
JIRA_API_TOKEN=...

AZURE_DEVOPS_ORG=...
AZURE_DEVOPS_PAT=...

# ... (other integrations)
```

---

## 🆘 **Troubleshooting**

### Firebase Authentication Not Working
- Check that all `VITE_FIREBASE_*` variables are set (client-side)
- Check that `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are set (server-side)
- Verify Email/Password authentication is enabled in Firebase Console
- Check browser console for errors

### Encryption Errors
- Ensure `ENCRYPTION_KEY` is set to a 64-character hex string
- If migrating data, use the same key

### Agent Errors
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota: https://console.anthropic.com/
- Review LangSmith traces for debugging

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is running: `npm run db:push`

---

## 📞 **Support**

For issues or questions:
1. Check the logs: `npm run dev` (look for `[Firebase]`, `[Agent]`, etc.)
2. Review LangSmith traces: https://smith.langchain.com/
3. Check environment variables are correctly set

---

## 🎉 **Next Steps**

Once setup is complete:
1. **Seed Demo Data**: `npm run seed` (optional)
2. **Create Admin User**: Use Firebase Console or registration page
3. **Configure Agents**: Admin → System Settings → Agent Configuration
4. **Add Projects**: Start adding your projects through the UI
5. **Set Up Integrations**: Admin → Integrations (optional)

---

**Last Updated:** 2026-01-24
