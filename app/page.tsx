'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import ScoutDashboardProduction with SUQI Intel integration
const ScoutDashboardProduction = dynamic(() => import('@/components/scout-dashboard-production'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading Scout Dashboard with SUQI Intel...</p>
      </div>
    </div>
  )
})

export default function ScoutDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading Scout Dashboard with SUQI Intel...</p>
        </div>
      </div>
    }>
      <ScoutDashboardProduction />
    </Suspense>
  )
}