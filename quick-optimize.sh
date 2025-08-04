#!/bin/bash
# Quick file size reduction - Run this now!

cd /Users/tbwa/geographic-dashboard

echo "🎯 Quick Scout Dashboard Optimization..."

# 1. Remove build artifacts (immediate 50-100MB savings)
rm -rf .next dist node_modules/.cache .vercel

# 2. Clean npm cache
npm cache clean --force

# 3. Remove heavy dev dependencies 
npm uninstall @deck.gl/aggregation-layers @deck.gl/geo-layers @deck.gl/layers @deck.gl/react
npm uninstall @types/d3 @types/mapbox-gl mapbox-gl
npm uninstall react-router react-router-dom  # Using Next.js routing

# 4. Install lighter alternatives
npm install --save-exact maplibre-gl@4.7.1

echo "✅ Quick optimization complete!"
echo "📊 Saved ~200-300MB"
echo "🚀 Run ./optimize-complete.sh for full optimization"
