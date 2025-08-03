'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'

// Dynamically import the competitive intelligence module to avoid SSR issues
const CompetitiveIntelligence = dynamic(
  () => import('@/components/modules/competitive-intelligence').then(mod => ({ default: mod.CompetitiveIntelligence })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading Competitive Intelligence...</p>
        </div>
      </div>
    )
  }
)

export default function CompetitiveIntelligencePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                Competitive Intelligence
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time market analysis and competitive insights from Scout v5 data
              </p>
            </div>
            
            {/* Info Badge */}
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                100% Real Data
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                No Mock Services
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Scout v5 Competitive Intelligence Features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Brand Analysis</strong>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Market share calculation</li>
                <li>• Growth trending</li>
                <li>• Regional penetration</li>
              </ul>
            </div>
            <div>
              <strong>Market Intelligence</strong>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Category performance</li>
                <li>• Competitive positioning</li>
                <li>• Store reach analysis</li>
              </ul>
            </div>
            <div>
              <strong>Consumer Insights</strong>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Purchase behavior</li>
                <li>• Brand switching</li>
                <li>• Engagement scores</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-gray-600">Analyzing competitive data...</p>
            </div>
          </div>
        }>
          <CompetitiveIntelligence />
        </Suspense>

        {/* Data Source Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data sourced from Scout gold layer views and RPCs</p>
          <p>Updates every 5 minutes • Powered by Supabase real-time subscriptions</p>
        </div>
      </div>
    </div>
  )
}