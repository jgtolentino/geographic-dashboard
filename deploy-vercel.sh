#!/bin/bash

echo "🚀 Deploying Geographic Dashboard to Vercel Production"

# Set environment variables
echo "Setting environment variables..."
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production < .env.local
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < .env.local

# Deploy to production
echo "Deploying to production..."
npx vercel --prod --yes

echo "✅ Deployment complete!"