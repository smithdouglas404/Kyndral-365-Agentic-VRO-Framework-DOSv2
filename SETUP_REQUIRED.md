# Setup Required - Configuration Checklist
**Date:** January 23, 2026
**Status:** Implementation Complete - Configuration Needed

---

## 🔥 CRITICAL: Firebase Authentication Setup

**Status:** ⚠️ REQUIRED FOR AUTHENTICATION TO WORK

### Backend Configuration (Replit Secrets)

Add these environment variables with values from your Firebase project:

```bash
# Option 1: Use environment variables (Recommended for Replit)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Option 2: Use service account file path
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

**⚠️ Important:** The private key must include `\n` characters for line breaks and be wrapped in quotes.

### Frontend Configuration (Replit Secrets with VITE_ prefix)

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

### How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** → **Sign-in method** → **Email/Password**
4. Go to **Project settings** → **Service accounts**
5. Click "Generate new private key" (this is your service account JSON)
6. Go to **Project settings** → **General** → "Your apps" → Add web app
7. Copy the `firebaseConfig` object values

**See:** `FIREBASE_SETUP_GUIDE.md` for detailed instructions

---

## 📊 Data Ingestion Configuration

**Status:** ⏳ OPTIONAL - For Production Data Sync

### Jira Integration

```bash
JIRA_URL=https://your-company.atlassian.net
JIRA_API_TOKEN=your_jira_api_token
JIRA_EMAIL=your_email@company.com
```

**How to get:**
1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Copy the token (save it securely - shown only once)

**Usage:**
```bash
# Sync specific project
curl -X POST http://localhost:5000/api/data-ingestion/sync/jira \
  -H "Content-Type: application/json" \
  -d '{
    "jiraUrl": "https://your-company.atlassian.net",
    "authToken": "your_api_token",
    "projectKey": "PROJ"
  }'
```

### Azure DevOps Integration

```bash
AZURE_DEVOPS_URL=https://dev.azure.com/your-organization
AZURE_DEVOPS_PAT=your_personal_access_token
```

**How to get:**
1. Go to Azure DevOps → User settings → Personal access tokens
2. Click "New Token"
3. Select scopes: Work Items (Read), Code (Read)
4. Copy the PAT (save it securely)

**Usage:**
```bash
# Sync Azure DevOps iteration
curl -X POST http://localhost:5000/api/data-ingestion/sync/azure \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "your-organization",
    "project": "YourProject",
    "pat": "your_pat",
    "iterationPath": "YourProject\\Sprint 1"
  }'
```

### MS Project Integration

**How to use:**
1. Export MS Project as XML: File → Export → XML
2. Upload via API:

```bash
curl -X POST http://localhost:5000/api/data-ingestion/sync/msproject \
  -H "Content-Type: application/json" \
  -d '{
    "xmlContent": "<Project>...</Project>"
  }'
```

**See:** `DATA_INGESTION_MAPPINGS.md` for field mappings

---

## 🤖 LLM Configuration

**Status:** ⏳ OPTIONAL - System uses defaults if not configured

### Anthropic Claude (Default)

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to API Keys
3. Create new key
4. Copy and save securely

### OpenAI (Alternative)

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API keys
3. Create new secret key
4. Copy and save securely

### Google Gemini (Alternative)

```bash
GOOGLE_GENAI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**How to get:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy and save securely

**Current Default:** Anthropic Claude Sonnet 4.5

---

## 📚 LangSmith Tracing (Agent Observability)

**Status:** ⏳ OPTIONAL - For debugging agents

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LANGCHAIN_PROJECT=Portfolio-Management-Agents
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

**How to get:**
1. Go to [LangSmith](https://smith.langchain.com/)
2. Create account
3. Go to Settings → API Keys
4. Create new API key
5. Copy and save

**Benefits:**
- View agent execution traces
- Debug agent reasoning
- Monitor performance
- Track costs

---

## 🗄️ Database Configuration

**Status:** ✅ ALREADY CONFIGURED

Your database is already provisioned and connected:
- **Database:** postgresql://heliumdb
- **Projects:** 74 with EVM/Sprint data
- **Tables:** 20+ (includes RAG, Battle Rhythm, Compliance)

**Connection String:**
```bash
DATABASE_URL=postgresql://postgres:password@host/heliumdb
```

**Already applied migrations:**
- ✅ add_firebase_uid.sql (Firebase integration)
- ✅ add_industry_regulatory_fields.sql (Compliance)
- ✅ create_rag_tables.sql (Knowledge base)

---

## 📧 Email Configuration (Future)

**Status:** ⏳ NOT IMPLEMENTED YET - For notifications

When implementing email notifications, you'll need:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@your-company.com
```

**Gmail App Password:**
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → App passwords
3. Generate app password for "Mail"
4. Use this password (not your regular password)

---

## 🔔 Webhook Configuration (Future)

**Status:** ⏳ NOT IMPLEMENTED YET - For integrations

### Slack Webhooks

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**How to get:**
1. Go to your Slack workspace
2. Navigate to Apps → Incoming Webhooks
3. Add to Slack
4. Copy Webhook URL

### Microsoft Teams Webhooks

```bash
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

**How to get:**
1. In Teams channel, click ... → Connectors
2. Search for "Incoming Webhook"
3. Configure and copy URL

---

## 🔐 Security Configuration

**Status:** ⚠️ RECOMMENDED FOR PRODUCTION

### Session Secret (JWT Fallback)

```bash
SESSION_SECRET=your-super-secret-random-string-min-32-chars
```

**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

### CORS Configuration

```bash
CORS_ORIGIN=https://your-production-domain.com
```

---

## 📱 Application Configuration

**Status:** ✅ SET TO DEFAULTS - Can customize

### App Settings

```bash
APP_URL=https://your-production-domain.com
PORT=5000
NODE_ENV=production
```

### Agent Configuration

```bash
# Agent polling interval (Battle Rhythm uses 15 seconds)
AGENT_POLL_INTERVAL=15000

# Agent max iterations (prevents infinite loops)
AGENT_MAX_ITERATIONS=5
```

---

## 🎨 White Label Configuration (Future)

**Status:** ⏳ NOT IMPLEMENTED YET - For branding

```bash
WHITE_LABEL_COMPANY_NAME=Your Company Name
WHITE_LABEL_LOGO_URL=https://your-cdn.com/logo.png
WHITE_LABEL_PRIMARY_COLOR=#0066CC
WHITE_LABEL_SUPPORT_EMAIL=support@your-company.com
```

---

## 📊 Analytics Configuration (Future)

**Status:** ⏳ NOT IMPLEMENTED YET - For tracking

### Google Analytics

```bash
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Datadog (Application Monitoring)

```bash
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATADOG_APP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ Verification Commands

After setting up environment variables, verify configuration:

### Check Database Connection
```bash
psql "$DATABASE_URL" -c "SELECT current_database(), count(*) FROM projects;"
```

**Expected:** `heliumdb | 74`

### Check Firebase Configuration
```bash
# Backend will log on startup:
# ✅ Firebase Authentication initialized
# OR
# ⚠️ Firebase Authentication not configured
```

### Check Agent Status
```bash
curl http://localhost:5000/api/orchestration/status
```

**Expected:**
```json
{
  "isRunning": true,
  "agentCount": 9,
  "continuousOrchestration": {
    "isRunning": true,
    "cycleCount": 123
  }
}
```

### Check Compliance Service
```bash
curl http://localhost:5000/api/compliance/portfolio
```

**Expected:**
```json
{
  "success": true,
  "summary": {
    "totalProjects": 74,
    "compliantProjects": 65,
    "nonCompliantProjects": 9,
    "criticalViolations": 3
  }
}
```

---

## 📝 Configuration Priority

**DO FIRST (Critical):**
1. ✅ Firebase Authentication (Backend + Frontend) - **REQUIRED FOR LOGIN**
2. ✅ Database (Already configured)
3. ⏳ Anthropic API Key (Currently using demo mode)

**DO SOON (Important):**
4. ⏳ Data Ingestion (Jira/Azure DevOps) - For production data
5. ⏳ LangSmith Tracing - For debugging agents
6. ⏳ Session Secret - For JWT security

**DO LATER (Optional):**
7. ⏳ Email Configuration - For notifications
8. ⏳ Webhook Configuration - For Slack/Teams
9. ⏳ Analytics - For tracking
10. ⏳ White Label - For branding

---

## 🆘 Troubleshooting

### Firebase "Not configured" Error
**Problem:** Server logs show "Firebase Authentication not configured"
**Solution:** Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables

### Login "Invalid token" Error
**Problem:** Frontend shows "Invalid or expired token"
**Solution:**
1. Check VITE_FIREBASE_* variables are set correctly
2. Ensure Firebase project has Email/Password auth enabled
3. Clear browser cache and localStorage

### Database Connection Error
**Problem:** "ECONNREFUSED" or "database not found"
**Solution:** Verify DATABASE_URL environment variable matches your PostgreSQL connection string

### Agent "Max iterations" Error
**Problem:** Agents hitting max_iterations repeatedly
**Solution:** This is now handled gracefully - memory is cleared automatically. If persists, increase AGENT_MAX_ITERATIONS to 7-10.

---

## 📖 Additional Documentation

- **Firebase Setup:** See `FIREBASE_SETUP_GUIDE.md`
- **Data Ingestion:** See `DATA_INGESTION_MAPPINGS.md`
- **System Status:** See `COMPREHENSIVE_SYSTEM_STATUS.md`
- **Agent Fix:** See `AGENT_MESSAGE_HISTORY_FIX.md`
- **RAG Architecture:** See `AGENT_LEARNING_RAG_ARCHITECTURE.md`

---

## 🎯 Summary

**Minimum to Run:**
- ✅ Database (Already configured)
- ⚠️ Firebase Auth (NEEDS SETUP)
- ⏳ Anthropic API Key (Optional - has demo mode)

**All Other Config:** Optional enhancements for production

**Next Step:** Configure Firebase authentication using `FIREBASE_SETUP_GUIDE.md`
