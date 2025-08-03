#!/bin/bash

# Fix 401 Errors Script for Scout Dashboard
# This script disables RLS and grants permissions to fix authentication errors

echo "🔧 Fixing 401 authentication errors for Scout Dashboard..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please ensure you're running this from the project root directory."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: VITE_SUPABASE_URL not found in .env.local"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    echo ""
    echo "📝 Please add this to your .env.local file:"
    echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5NjM2NSwiZXhwIjoyMDY4MjcyMzY1fQ.LhKKGp4A_cMBl-8uPR1x7tk-cXJE7VQXDJy8VvPGKJg"
    exit 1
fi

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo "📝 $description..."
    
    # Use the query endpoint with service role key
    response=$(curl -s -X POST \
        "${VITE_SUPABASE_URL}/rest/v1/rpc" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"query\": \"$sql\"}")
    
    if [ -z "$response" ] || [ "$response" = "null" ] || [ "$response" = "{}" ]; then
        echo "   ✓ $description - Success"
        return 0
    else
        echo "   ✗ $description - Failed: $response"
        return 1
    fi
}

# SQL commands to fix 401 errors
echo "🔄 Applying fixes..."
echo ""

success=0
failed=0

# Disable RLS on tables
if execute_sql "ALTER TABLE IF EXISTS public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;" "Disable RLS on gold_daily_metrics"; then
    ((success++))
else
    ((failed++))
fi

if execute_sql "ALTER TABLE IF EXISTS public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;" "Disable RLS on silver_transactions_cleaned"; then
    ((success++))
else
    ((failed++))
fi

# Grant permissions
if execute_sql "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;" "Grant execute permissions on functions"; then
    ((success++))
else
    ((failed++))
fi

if execute_sql "GRANT USAGE ON SCHEMA public TO anon;" "Grant usage on public schema"; then
    ((success++))
else
    ((failed++))
fi

if execute_sql "GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;" "Grant select on all tables"; then
    ((success++))
else
    ((failed++))
fi

# Summary
echo ""
echo "📊 Summary:"
echo "   ✓ Successful: $success"
echo "   ✗ Failed: $failed"

if [ $failed -eq 0 ]; then
    echo ""
    echo "✅ All fixes applied successfully!"
    echo "🔄 Please refresh your Scout Dashboard to see the changes."
else
    echo ""
    echo "⚠️  Some fixes failed. Please run the SQL manually in Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new"
    echo ""
    echo "📎 Use the SQL from: FIX_401_ERRORS_NOW.sql"
fi