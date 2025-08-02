#!/bin/bash

echo "🚀 Geographic Analytics Dashboard Deployment"
echo "==========================================\n"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="cxzllzyxwpyptfretryc"

echo "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

echo "\n${YELLOW}Step 2: Linking to Supabase project...${NC}"
supabase link --project-ref $PROJECT_REF

echo "\n${YELLOW}Step 3: Applying database migrations...${NC}"
supabase db push

echo "\n${YELLOW}Step 4: Deploying Edge Functions...${NC}"
echo "Deploying geographic-analytics function..."
supabase functions deploy geographic-analytics --no-verify-jwt

echo "Deploying server health check function..."
supabase functions deploy server --no-verify-jwt

echo "\n${YELLOW}Step 5: Building frontend...${NC}"
npm run build

echo "\n${GREEN}✅ Deployment Complete!${NC}"
echo "\nProject Details:"
echo "- Project ID: $PROJECT_REF"
echo "- API URL: https://$PROJECT_REF.supabase.co"
echo "- Functions URL: https://$PROJECT_REF.supabase.co/functions/v1"

echo "\nTest the deployment:"
echo "1. Run locally: npm run dev"
echo "2. Test API: curl https://$PROJECT_REF.supabase.co/functions/v1/server"

echo "\n${YELLOW}Remember to set environment variables:${NC}"
echo "- VITE_SUPABASE_URL=https://$PROJECT_REF.supabase.co"
echo "- VITE_SUPABASE_ANON_KEY=your_anon_key"