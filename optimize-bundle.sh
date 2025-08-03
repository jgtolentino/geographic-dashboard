#!/bin/bash
# ====================================================================
# GEOGRAPHIC DASHBOARD - BUNDLE SIZE OPTIMIZATION
# ====================================================================

echo "🎯 Optimizing Scout Geographic Dashboard Bundle Size..."

# 1. Clean build artifacts and caches
echo "1️⃣ Cleaning build artifacts..."
rm -rf .next
rm -rf dist
rm -rf node_modules/.cache
rm -rf .vercel

# 2. Remove duplicate/redundant dependencies
echo "2️⃣ Removing redundant dependencies..."
npm uninstall react-router react-router-dom  # Using Next.js routing
npm uninstall mapbox-gl  # Keep only maplibre-gl

# 3. Optimize package.json for lighter bundle
echo "3️⃣ Installing optimized dependencies..."
npm install --production

# 4. Enable Next.js bundle optimization
echo "4️⃣ Applying Next.js optimizations..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-select'],
    bundlePagesRouterDependencies: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false
    }
    
    // External large libraries in production
    if (!isServer) {
      config.externals = {
        ...config.externals,
        'maplibre-gl': 'maplibregl'
      }
    }
    
    return config
  }
}

module.exports = nextConfig
EOF

# 5. Create optimized production build
echo "5️⃣ Building optimized production bundle..."
npm run build

# 6. Analyze bundle size
echo "6️⃣ Bundle analysis:"
npx @next/bundle-analyzer

echo "✅ Optimization complete!"
echo "📊 Check bundle size with: du -sh .next"
