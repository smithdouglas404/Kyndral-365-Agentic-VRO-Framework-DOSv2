# Email & Notification Setup Guide

## Overview

Email, Slack, and Teams notifications are configured through the **MCP Marketplace**, just like any other integration. No environment variables needed!

---

## Email Providers

### 1. SendGrid (Recommended)

**Why**: Most reliable, great free tier (100 emails/day), easy API.

**Setup Steps**:

1. Go to **Admin → MCP Marketplace**
2. Find **SendGrid** in the Email Providers category
3. Click **Configure**
4. Enter:
   - **API Key**: Your SendGrid API key
   - **From Email**: `noreply@yourdomain.com`
   - **Base URL**: `https://api.sendgrid.com` (auto-filled)
5. Click **Test Connection** → Should show "✓ Connection successful"
6. Click **Save & Activate**

**Getting SendGrid API Key**:
```
1. Go to https://app.sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Settings → API Keys → Create API Key
4. Give it Full Access or Mail Send access
5. Copy the key (starts with "SG.")
```

**Example Configuration**:
```json
{
  "name": "sendgrid",
  "baseUrl": "https://api.sendgrid.com",
  "apiKey": "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "config": {
    "fromEmail": "noreply@yourcompany.com"
  }
}
```

---

### 2. Mailgun

**Why**: Good for transactional emails, generous free tier (5,000 emails/month for 3 months).

**Setup Steps**:

1. Go to **Admin → MCP Marketplace**
2. Find **Mailgun** in the Email Providers category
3. Click **Configure**
4. Enter:
   - **API Key**: Your Mailgun API key
   - **Domain**: Your Mailgun domain (e.g., `mg.yourdomain.com`)
   - **From Email**: `noreply@mg.yourdomain.com`
   - **Base URL**: `https://api.mailgun.net` (auto-filled)
5. Click **Test Connection**
6. Click **Save & Activate**

**Getting Mailgun API Key**:
```
1. Go to https://www.mailgun.com/
2. Sign up (free tier: 5,000 emails/month for 3 months)
3. Dashboard → Settings → API Keys
4. Copy the Private API key
5. Settings → Domains → Copy your domain name
```

**Example Configuration**:
```json
{
  "name": "mailgun",
  "baseUrl": "https://api.mailgun.net",
  "apiKey": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "config": {
    "domain": "mg.yourcompany.com",
    "fromEmail": "noreply@mg.yourcompany.com"
  }
}
```

---

### 3. AWS SES

**Why**: Enterprise-grade, extremely cheap ($0.10 per 1,000 emails), integrates with AWS.

**Setup Steps**:

1. Go to **Admin → MCP Marketplace**
2. Find **AWS SES** in the Email Providers category
3. Click **Configure**
4. Enter:
   - **Access Key ID**: AWS IAM access key
   - **Secret Access Key**: AWS IAM secret
   - **Region**: AWS region (e.g., `us-east-1`)
   - **From Email**: Verified sender email
5. Click **Test Connection**
6. Click **Save & Activate**

**Getting AWS SES Credentials**:
```
1. Go to AWS Console → SES
2. Verify your domain or email address
3. IAM → Create user with SES send permissions
4. Create access key
5. Copy Access Key ID and Secret Access Key
```

**Example Configuration**:
```json
{
  "name": "aws-ses",
  "baseUrl": "https://email-smtp.us-east-1.amazonaws.com",
  "apiKey": "ACCESS_KEY_ID:SECRET_ACCESS_KEY",
  "config": {
    "region": "us-east-1",
    "fromEmail": "noreply@yourcompany.com"
  }
}
```

---

### 4. SMTP (Generic - Gmail, Outlook, etc.)

**Why**: Use existing email provider (Gmail, Outlook, custom SMTP server).

**Setup Steps**:

1. Go to **Admin → MCP Marketplace**
2. Find **SMTP Email** in the Email Providers category
3. Click **Configure**
4. Enter:
   - **SMTP Host**: `smtp.gmail.com` (for Gmail)
   - **SMTP Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your email address
   - **Password**: App password (not your regular password!)
   - **From Email**: Your email address
5. Click **Test Connection**
6. Click **Save & Activate**

**Gmail Setup**:
```
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. App Passwords → Select "Mail" and "Other (Custom name)"
4. Generate password
5. Copy the 16-character password
```

**Outlook/Office 365 Setup**:
```
Host: smtp.office365.com
Port: 587
Username: your-email@company.com
Password: Your account password
```

**Example Configuration**:
```json
{
  "name": "smtp-email",
  "baseUrl": "smtp.gmail.com",
  "apiKey": "your-email@gmail.com:app-password",
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "your-email@gmail.com",
    "password": "xxxx xxxx xxxx xxxx",
    "fromEmail": "your-email@gmail.com"
  }
}
```

---

## Slack Setup

**Setup Steps**:

1. Go to **Admin → MCP Marketplace**
2. Find **Slack** in the Communication category
3. Click **Configure**
4. Enter:
   - **Webhook URL**: Your Slack incoming webhook URL
   - **Base URL**: Webhook URL (same as above)
5. Click **Test Connection** → Should post test message to Slack
6. Click **Save & Activate**

**Getting Slack Webhook**:
```
1. Go to https://api.slack.com/apps
2. Create New App → From scratch
3. Give it a name and select workspace
4. Incoming Webhooks → Activate
5. Add New Webhook to Workspace
6. Select channel (#notifications, #alerts, etc.)
7. Copy the Webhook URL
```

**Example Configuration**:
```json
{
  "name": "slack",
  "baseUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
  "apiKey": "none",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
  }
}
```

---

## Microsoft Teams Setup

**Setup Steps**:

1. Go to **Admin → MCP Marketplace**
2. Find **Microsoft Teams** in the Communication category
3. Click **Configure**
4. Enter:
   - **Webhook URL**: Your Teams incoming webhook URL
   - **Base URL**: Webhook URL (same as above)
5. Click **Test Connection** → Should post test message to Teams
6. Click **Save & Activate**

**Getting Teams Webhook**:
```
1. Open Teams → Go to channel
2. Click "..." → Connectors
3. Search for "Incoming Webhook" → Configure
4. Give it a name and optional icon
5. Copy the webhook URL
6. Done
```

**Example Configuration**:
```json
{
  "name": "microsoft-teams",
  "baseUrl": "https://outlook.office.com/webhook/xxxxxx",
  "apiKey": "none",
  "config": {
    "webhookUrl": "https://outlook.office.com/webhook/xxxxxx"
  }
}
```

---

## Assigning to Agents

After configuring email/notifications in the marketplace:

1. Go to **Admin → Agent Setup Wizard**
2. Select an agent (e.g., Risk Agent)
3. In **Step 2: Assign MCP Servers**, check:
   - ☑ SendGrid (or your email provider)
   - ☑ Slack (optional)
   - ☑ Microsoft Teams (optional)
4. Complete wizard and save

Now when that agent needs to send notifications:
- Email will be sent via SendGrid
- Slack messages will be posted
- Teams messages will be posted

---

## Testing

### Test Email:
```bash
POST /api/notifications/email
{
  "to": "test@example.com",
  "subject": "Test from PMO System",
  "body": "This is a test email."
}
```

### Test Slack:
```bash
POST /api/notifications/slack
{
  "text": "Test message from PMO System",
  "channel": "#notifications"
}
```

### Test Teams:
```bash
POST /api/notifications/teams
{
  "title": "Test Notification",
  "text": "This is a test message from PMO System"
}
```

---

## Comparison: Provider Selection

| Provider | Free Tier | Cost After | Best For | Setup Complexity |
|----------|-----------|------------|----------|------------------|
| **SendGrid** | 100/day | $14.95/mo (40k) | Transactional emails | ⭐ Easy |
| **Mailgun** | 5k/mo (3 months) | $35/mo (50k) | High volume | ⭐⭐ Medium |
| **AWS SES** | 62k/mo (if in EC2) | $0.10/1k | Enterprise/AWS users | ⭐⭐⭐ Complex |
| **SMTP** | Depends on provider | Depends | Existing email | ⭐ Easy |

**Recommendation**:
- **Small teams**: SendGrid (easiest setup)
- **AWS users**: AWS SES (cheapest at scale)
- **Quick start**: Gmail SMTP (use existing account)
- **High volume**: Mailgun

---

## Troubleshooting

### Email Not Sending

1. **Check marketplace config**:
   ```sql
   SELECT * FROM integrations WHERE name IN ('sendgrid', 'mailgun', 'aws-ses', 'smtp-email');
   ```

2. **Check notification logs**:
   ```bash
   GET /api/notifications/logs?channel=email&limit=10
   ```

3. **Test connection** in marketplace UI

4. **Check console logs** for errors

### Slack Not Posting

1. **Verify webhook URL** is correct and active
2. **Check channel** exists and bot has access
3. **Test webhook** directly:
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test"}'
   ```

### Teams Not Posting

1. **Verify webhook** wasn't deleted in Teams
2. **Check connector** is still configured in channel
3. **Test webhook** directly:
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test"}'
   ```

---

## Environment Variables (Legacy - No Longer Needed!)

~~The old way required environment variables:~~
```bash
# ❌ OLD WAY - DON'T USE
NOTIFICATION_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

**✅ NEW WAY - Use Marketplace!**
1. Go to MCP Marketplace
2. Configure provider
3. Assign to agents
4. Done!

---

## Summary

### Before (Environment Variables):
1. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env
2. Restart server
3. Hope it works
4. Can't change without redeploy

### After (Marketplace):
1. Go to MCP Marketplace
2. Add SendGrid integration
3. Enter API key
4. Test & activate
5. Assign to agents
6. Change anytime in UI

**Much better!** 🎉
