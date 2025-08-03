'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the choropleth dashboard to avoid SSR issues
const ScoutChoroplethDashboard = dynamic(() => import('@/components/scout-choropleth-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading Geographic Dashboard...</p>
      </div>
    </div>
  )
})

export default function GeographicDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scout Analytics Platform</h1>
          <p className="text-gray-600 mt-2">Philippines Regional Performance Dashboard</p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading Geographic Analytics...</p>
            </div>
          </div>
        }>
          <ScoutChoroplethDashboard />
        </Suspense>
      </div>
    </div>
  )
}