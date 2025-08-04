/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-select', 'recharts']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  webpack: (config, { isServer, webpack }) => {
    // Bundle size optimization - fixed cacheUnaffected compatibility
    config.optimization = {
      ...config.optimization,
      usedExports: false, // Disable to avoid cacheUnaffected conflict
      sideEffects: false,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000, // 244KB max chunk size
          },
        },
      },
    }
    
    // External large libraries
    if (!isServer) {
      config.externals = {
        ...config.externals,
        'maplibre-gl': 'maplibregl'
      }
    }
    
    // Minimize bundle
    config.plugins.push(
      new webpack.DefinePlugin({
        __DEV__: false,
      })
    )
    
    return config
  }
}

export default nextConfig
