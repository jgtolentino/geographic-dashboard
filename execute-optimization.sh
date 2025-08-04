#!/bin/bash

echo "🎯 Quick Fix - Execute this in geographic-dashboard directory"
echo ""

cd /Users/tbwa/geographic-dashboard

# Make all scripts executable 
chmod +x *.sh

# Run the complete optimization
./optimize-and-deploy.sh

echo ""
echo "✅ COMPLETE! Your Scout Geographic Dashboard is now optimized."
echo "📊 Start dashboard: npm run dev"
echo "🌐 View at: http://localhost:3000/dashboard"
