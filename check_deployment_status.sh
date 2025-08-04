#!/bin/bash

# SUQI Intel Deployment Status Checker
echo "🔍 Checking SUQI Intel deployment status..."

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    exit 1
fi

echo ""
echo "📊 Checking database deployment..."

# Run the validation SQL
supabase db remote execute --file validate_suqi_intel_deployment.sql --json > deployment_status.json

if [ $? -eq 0 ]; then
    echo "✅ Database query executed successfully"
    echo "📄 Results saved to deployment_status.json"
else
    echo "❌ Database query failed"
fi

echo ""
echo "⚡ Checking Edge Functions..."

# List deployed functions
supabase functions list

echo ""
echo "🎯 Current Supabase status:"
supabase status

echo ""
echo "📈 Next steps based on deployment status:"
echo "1. Review deployment_status.json for detailed results"
echo "2. If SUQI Intel tables don't exist, run: supabase db push"
echo "3. If Edge Function missing, run: supabase functions deploy suqiintel-processor"
echo "4. Test the frontend integration"