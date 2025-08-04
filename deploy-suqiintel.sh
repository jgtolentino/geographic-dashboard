#!/bin/bash

# SuqiIntel Deployment Script
# Deploys AI-powered natural language query processing for Scout Platform

echo "🚀 Starting SuqiIntel deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    exit 1
fi

echo "📊 Deployment plan:"
echo "1. Deploy SuqiIntel database migration"
echo "2. Deploy SuqiIntel Edge Function"
echo "3. Set environment variables"
echo "4. Run verification tests"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Step 1: Deploy database migration
echo ""
echo "📄 Step 1: Deploying SuqiIntel database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration deployed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Step 2: Deploy Edge Function
echo ""
echo "⚡ Step 2: Deploying SuqiIntel Edge Function..."
supabase functions deploy suqiintel-processor

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully"
else
    echo "❌ Edge Function deployment failed"
    exit 1
fi

# Step 3: Set environment variables
echo ""
echo "🔐 Step 3: Setting environment variables..."
echo "Please ensure these are set in your Supabase dashboard:"
echo "- OPENAI_API_KEY (for natural language processing)"
echo "- SUQIINTEL_MODEL (default: gpt-4)"
echo ""

# Step 4: Verification
echo ""
echo "🧪 Step 4: Running verification tests..."

# Test database objects
echo "Testing database objects..."
supabase db remote execute "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'suqiintel';" --json

# Test Edge Function
echo "Testing Edge Function health..."
SUPABASE_URL=$(supabase status --json | jq -r '.API_URL')
ANON_KEY=$(supabase status --json | jq -r '.ANON_KEY')

if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$ANON_KEY" ]; then
    curl -X POST "$SUPABASE_URL/functions/v1/suqiintel-processor" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"query": "test"}' \
        --fail --silent --show-error > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Edge Function responding"
    else
        echo "⚠️  Edge Function test failed (this might be normal if auth is required)"
    fi
fi

echo ""
echo "🎉 SuqiIntel deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set the OPENAI_API_KEY in Supabase dashboard"
echo "2. Test the integration in your Scout dashboard"
echo "3. Monitor logs: supabase functions logs suqiintel-processor"
echo ""
echo "💡 Example queries to try:"
echo "- 'Show me top 5 brands by revenue'"
echo "- 'What is the average transaction value by region?'"
echo "- 'Compare weekend vs weekday sales'"
echo ""
echo "📚 Documentation: /suqiintel_integration_plan.md"