#!/bin/bash

# Scout Dashboard Deployment Validation Script
# Project: cxzllzyxwpyptfretryc

echo "🔍 Scout Dashboard System Validation"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ID="cxzllzyxwpyptfretryc"
BASE_URL="https://${PROJECT_ID}.supabase.co"
ANON_KEY="${VITE_SUPABASE_ANON_KEY:-your_anon_key_here}"

echo "1️⃣  Testing Edge Functions Health..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/functions/v1/server")
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Edge Functions: Healthy${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Edge Functions: Not responding${NC}"
fi

echo ""
echo "2️⃣  Testing Geographic Analytics API..."
CHOROPLETH_RESPONSE=$(curl -s "${BASE_URL}/functions/v1/geographic-analytics/choropleth?metric=sales" \
    -H "Authorization: Bearer $ANON_KEY")
if [[ $CHOROPLETH_RESPONSE == *"region_name"* ]] || [[ $CHOROPLETH_RESPONSE == *"data"* ]]; then
    echo -e "${GREEN}✅ Geographic Analytics: Working${NC}"
    echo "   Regions found in response"
else
    echo -e "${RED}❌ Geographic Analytics: Error${NC}"
    echo "   Response: $CHOROPLETH_RESPONSE"
fi

echo ""
echo "3️⃣  Testing Sari-Sari Expert Bot..."
SARI_RESPONSE=$(curl -s -X POST "${BASE_URL}/functions/v1/sari-sari-expert-advanced" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -d '{"message":"Test transaction analysis", "inference_mode":true}')
if [[ $SARI_RESPONSE == *"response"* ]] || [[ $SARI_RESPONSE == *"analysis"* ]]; then
    echo -e "${GREEN}✅ Sari-Sari Expert: Operational${NC}"
else
    echo -e "${YELLOW}⚠️  Sari-Sari Expert: May need deployment${NC}"
fi

echo ""
echo "4️⃣  Checking Available Endpoints..."
echo "   📍 Choropleth: ${BASE_URL}/functions/v1/geographic-analytics/choropleth"
echo "   📊 Dot Strip: ${BASE_URL}/functions/v1/geographic-analytics/dotstrip"
echo "   🏪 Brand Performance: ${BASE_URL}/functions/v1/geographic-analytics/brand-performance"
echo "   📈 Time Series: ${BASE_URL}/functions/v1/geographic-analytics/time-series"
echo "   🔍 Filters: ${BASE_URL}/functions/v1/geographic-analytics/filters"
echo "   📋 Summary: ${BASE_URL}/functions/v1/geographic-analytics/summary"

echo ""
echo "5️⃣  Database Check Commands..."
echo "   Run these in Supabase SQL Editor:"
echo ""
echo "   -- Check regions"
echo "   SELECT COUNT(*) as region_count FROM geo.admin2;"
echo ""
echo "   -- Check stores"
echo "   SELECT COUNT(*) as store_count FROM public.stores;"
echo ""
echo "   -- Check events"
echo "   SELECT COUNT(*) as event_count FROM silver.clean_events;"
echo ""
echo "   -- Check spatial integrity"
echo "   SELECT COUNT(*) as matched_stores"
echo "   FROM public.stores s"
echo "   JOIN geo.admin2 r ON s.region_fk = r.admin2_id;"

echo ""
echo "📊 Dashboard URLs:"
echo "   🔗 Supabase Dashboard: https://supabase.com/dashboard/project/${PROJECT_ID}"
echo "   🔗 Functions Monitor: https://supabase.com/dashboard/project/${PROJECT_ID}/functions"
echo "   🔗 SQL Editor: https://app.supabase.com/project/${PROJECT_ID}/sql/new"
echo "   🔗 API Docs: ${BASE_URL}/rest/v1/"

echo ""
echo "✨ Validation Complete!"
echo ""
echo "Next Steps:"
echo "1. Set VITE_SUPABASE_ANON_KEY environment variable"
echo "2. Run: npm run dev (in geographic-dashboard directory)"
echo "3. Open: http://localhost:3000"
echo ""