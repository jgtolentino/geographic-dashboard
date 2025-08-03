'use client'

import ProductionChoroplethMap from '@/components/maps/production-choropleth-map'

export default function ChoroplethDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Production Choropleth Map Demo
        </h1>
        
        <div className="space-y-8">
          {/* Full width choropleth */}
          <ProductionChoroplethMap 
            title="Scout Analytics – Regional Performance"
            metric="transactions"
            className="mb-8"
            width={1200}
            height={800}
          />
          
          {/* Additional info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>✅ Real PostGIS geographic boundaries</li>
              <li>✅ D3.js Mercator projection fitted to Philippines</li>
              <li>✅ Quantile color scaling (5 bins, no alpha)</li>
              <li>✅ Fixed Tailwind classes (no purging issues)</li>
              <li>✅ Interactive hover tooltips</li>
              <li>✅ Metric selector (transactions, revenue, stores, growth)</li>
              <li>✅ Summary statistics grid</li>
              <li>✅ Single RPC call for optimized performance</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is using mock data. To use real data, replace the 
                mock supabaseClient in the component with the actual Supabase client from 
                <code className="bg-blue-100 px-1 rounded">@/lib/supabase-choropleth</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}