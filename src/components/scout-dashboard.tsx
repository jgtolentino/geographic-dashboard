'use client'

import { useState } from 'react'
import { SidebarNavigation } from '@/components/layout/sidebar-navigation'
import { TopNavigation } from '@/components/layout/top-navigation'
import { FilterBar } from '@/components/layout/filter-bar'
import { RecommendationPanelV2 } from '@/components/ai/recommendation-panel-v2'
import { TransactionTrendsV2 } from '@/components/modules/transaction-trends-v2'
import { ProductMix } from '@/components/modules/product-mix'
import { ConsumerBehavior } from '@/components/modules/consumer-behavior'
import { ConsumerProfiling } from '@/components/modules/consumer-profiling'
import { Overview } from '@/components/modules/overview'
import { FilterState } from '@/types/scout-dashboard'

export function ScoutDashboard() {
  const [currentModule, setCurrentModule] = useState('home')
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    location: 'all',
    category: 'all',
    brand: 'all',
    priceRange: { min: 0, max: 1000 },
    customerSegment: 'all'
  })
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)

  const renderModule = () => {
    switch (currentModule) {
      case 'home':
        return <Overview filters={filters} />
      case 'transaction-trends':
        return <TransactionTrendsV2 filters={filters} />
      case 'product-mix':
        return <ProductMix filters={filters} />
      case 'consumer-behavior':
        return <ConsumerBehavior filters={filters} />
      case 'consumer-profiling':
        return <ConsumerProfiling filters={filters} />
      default:
        return <Overview filters={filters} />
    }
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <SidebarNavigation
        currentModule={currentModule}
        onModuleChange={setCurrentModule}
        className="w-64 flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* Module Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderModule()}
        </main>
      </div>

      {/* AI Recommendation Panel */}
      <RecommendationPanelV2
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        context={{
          filters,
          activeModule: currentModule
        }}
      />

      {/* Floating AI Button */}
      {!isAIPanelOpen && (
        <button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
      )}
    </div>
  )
}