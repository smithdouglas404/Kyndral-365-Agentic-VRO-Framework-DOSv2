#!/bin/bash
# START LANGFLOW - Fresh Docker Installation
# Run this on your local machine

echo "🚀 Starting Fresh Langflow Instance..."
echo ""

# Start Langflow container
docker-compose -f docker-compose.langflow.yml up -d

echo ""
echo "⏳ Waiting for Langflow to start (30 seconds)..."
sleep 5

# Show logs
echo ""
echo "📋 Langflow logs:"
docker logs langflow | tail -20

echo ""
echo "✅ NEXT STEPS:"
echo ""
echo "1. Open http://localhost:7860 in your browser"
echo "2. Create admin account (first time)"
echo "3. Go to Settings → API Keys"
echo "4. Click 'Create API Key'"
echo "5. Copy the key"
echo "6. Update .env file:"
echo "   LANGFLOW_API_KEY=<paste-key-here>"
echo ""
echo "7. Then run: npx tsx server/scripts/create-all-langflow-flows.ts"
echo ""
echo "That's it! All 12 flows will be created automatically."
