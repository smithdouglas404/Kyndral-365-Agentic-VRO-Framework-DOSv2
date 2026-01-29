# Remote Langflow Setup Options

**Problem**: Can't access Docker Langflow from Replit environment
**Solution**: Deploy Langflow to a cloud service accessible from your browser

---

## Option 1: Railway.app (RECOMMENDED - Free tier, 5 mins)

**Why**: Free $5 credit, persistent storage, public URL, easiest setup

### Steps:

1. **Go to https://railway.app**
   - Sign up with GitHub (free)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from Docker Image"
   - Enter: `langflowai/langflow:latest`

3. **Add Environment Variables**
   ```
   LANGFLOW_DATABASE_URL=sqlite:///./langflow.db
   LANGFLOW_AUTO_LOGIN=false
   ```

4. **Expose Port**
   - Settings → Networking
   - Generate Domain (will give you something like `langflow-production-xxxx.up.railway.app`)
   - Port: 7860

5. **Deploy**
   - Railway will build and deploy automatically
   - Wait 2-3 minutes for deployment

6. **Access Langflow**
   - Open the generated URL (e.g., `https://langflow-production-xxxx.up.railway.app`)
   - Create admin account
   - Settings → API Keys → Create API Key

7. **Update .env**
   ```bash
   LANGFLOW_API_URL=https://langflow-production-xxxx.up.railway.app/api/v1
   LANGFLOW_API_KEY=<your-api-key>
   ```

8. **Create Flows**
   ```bash
   npx tsx server/scripts/create-all-langflow-flows.ts
   ```

**Cost**: Free for first 500 hours/month ($5 credit)

---

## Option 2: Render.com (Free tier, 10 mins)

**Why**: Generous free tier, no credit card required

### Steps:

1. **Go to https://render.com**
   - Sign up with GitHub (free)

2. **New Web Service**
   - Dashboard → New → Web Service
   - Connect your GitHub or use Public Git URL

3. **Configure Service**
   - Name: `langflow`
   - Region: Choose closest to you
   - Branch: `main` (if using repo) or skip
   - Runtime: Docker
   - Docker Image: `langflowai/langflow:latest`
   - Instance Type: Free

4. **Environment Variables**
   ```
   LANGFLOW_DATABASE_URL=sqlite:///./langflow.db
   LANGFLOW_AUTO_LOGIN=false
   PORT=7860
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deploy

6. **Access**
   - Your URL: `https://langflow-xxxx.onrender.com`
   - Create account → Get API key

7. **Update .env**
   ```bash
   LANGFLOW_API_URL=https://langflow-xxxx.onrender.com/api/v1
   LANGFLOW_API_KEY=<your-api-key>
   ```

**Cost**: Free (spins down after 15 mins of inactivity, takes 30s to wake up)

---

## Option 3: Hugging Face Spaces (Free, 15 mins)

**Why**: Always free, good for demos

### Steps:

1. **Go to https://huggingface.co/spaces**
   - Sign up (free)
   - Click "Create new Space"

2. **Configure Space**
   - Name: `langflow-instance`
   - License: MIT
   - SDK: Docker
   - Hardware: CPU basic (free)

3. **Create Dockerfile**
   ```dockerfile
   FROM langflowai/langflow:latest

   ENV LANGFLOW_DATABASE_URL=sqlite:///./langflow.db
   ENV LANGFLOW_AUTO_LOGIN=false

   EXPOSE 7860

   CMD ["langflow", "run", "--host", "0.0.0.0", "--port", "7860"]
   ```

4. **Push to Space**
   - Upload Dockerfile to your space
   - Wait for build

5. **Access**
   - Your URL: `https://huggingface.co/spaces/YOUR_USERNAME/langflow-instance`
   - Create account → Get API key

6. **Update .env**
   ```bash
   LANGFLOW_API_URL=https://YOUR_USERNAME-langflow-instance.hf.space/api/v1
   LANGFLOW_API_KEY=<your-api-key>
   ```

**Cost**: Free forever

---

## Option 4: Use DataStax Astra (Already Setup, 2 mins)

**Why**: You already have an account with token

### What We Know:
- ✅ You have account at https://astra.datastax.com
- ✅ You have admin token in docs/ai.json
- ❌ API doesn't support programmatic flow creation
- ✅ **BUT**: We can create flows manually in UI, then use them

### Steps:

1. **Go to https://astra.datastax.com**
   - Log in with your account

2. **Open Langflow**
   - Find your Langflow instance
   - Click "Open Langflow"

3. **Manually Import Flows**
   - Click "+ New Flow"
   - Click "Import" (top right)
   - Upload each JSON file:
     - `langflow-flows/scenario-a-budget-overrun.json`
     - `langflow-flows/scenario-b-burnout-brake.json`
     - `langflow-flows/scenario-c-regulatory-deadbolt.json`
     - `langflow-flows/scenario-d-maturity-governor.json`
   - Import takes 30 seconds per flow

4. **Get Flow IDs**
   - After importing, open each flow
   - Copy the Flow ID from the URL:
     ```
     https://astra.datastax.com/.../flows/FLOW_ID_HERE
     ```
   - Save these IDs

5. **I'll Update Agent Code**
   - Provide me with the 4 Flow IDs
   - I'll update the hardcoded IDs in the agent files

6. **Test**
   ```bash
   # Test executing a flow
   curl -X POST https://api.langflow.astra.datastax.com/lf/.../api/v1/run/FLOW_ID \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"input_value": "test"}'
   ```

**Cost**: Free tier includes 1M operations/month

---

## Quick Comparison

| Service | Setup Time | Always On? | Free Tier | Best For |
|---------|------------|------------|-----------|----------|
| **Railway** | 5 min | Yes | $5/month credit | Production use |
| **Render** | 10 min | No (spins down) | Unlimited | Development |
| **Hugging Face** | 15 min | Yes | Unlimited | Demos |
| **DataStax Astra** | 2 min | Yes | 1M ops/month | Quick start (manual flows) |

---

## My Recommendation

**If you need it NOW (2 minutes):**
→ Use DataStax Astra with manual flow import
→ Just import the 4 scenario JSONs via UI
→ Give me the Flow IDs and I'll wire them up

**If you have 5 minutes:**
→ Use Railway.app
→ Full API access, no manual work
→ Script will create all 12 flows automatically

**If no credit card:**
→ Use Render.com (free, no card needed)
→ Spins down after 15 mins but wakes up fast

---

## What Do You Want To Do?

**Option A**: Use DataStax Astra (you already have account) - 2 minutes, manual import
**Option B**: Deploy to Railway - 5 minutes, fully automated
**Option C**: Deploy to Render - 10 minutes, free forever
**Option D**: Deploy to Hugging Face - 15 minutes, always free

Let me know which option and I'll help you through it step by step.
