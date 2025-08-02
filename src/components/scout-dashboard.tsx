'use client'

import { useState } from 'react'
import { SidebarNavigation } from '@/components/layout/sidebar-navigation'
import { TopNavigation } from '@/components/layout/top-navigation'
import { FilterBar } from '@/components/layout/filter-bar'
import { RecommendationPanel } from '@/components/ai/recommendation-panel'
import { TransactionTrends } from '@/components/modules/transaction-trends'
import { ProductMix } from '@/components/modules/product-mix'
import { ConsumerBehavior } from '@/components/modules/consumer-behavior'
import { ConsumerProfiling } from '@/components/modules/consumer-profiling'
import { Overview } from '@/components/modules/overview'
import { FilterState } from '@/types/scout-dashboard'

export function ScoutDashboard() {
  const [currentModule, setCurrentModule] = useState('home')
  const [filters, setFilters] = useState<FilterState>({})
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false)

  const renderModule = () => {
    switch (currentModule) {
      case 'home':
        return <Overview filters={filters} />
      case 'transaction-trends':
        return <TransactionTrends filters={filters} />
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
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {renderModule()}
          </main>

          {/* AI Recommendation Panel */}
          {!isAIPanelCollapsed && (
            <aside className="w-80 flex-shrink-0 overflow-hidden">
              <RecommendationPanel
                module={currentModule}
                context={filters}
                isCollapsed={isAIPanelCollapsed}
                onToggle={() => setIsAIPanelCollapsed(!isAIPanelCollapsed)}
              />
            </aside>
          )}
        </div>
      </div>

      {/* Collapsed AI Panel Button */}
      {isAIPanelCollapsed && (
        <RecommendationPanel
          module={currentModule}
          context={filters}
          isCollapsed={true}
          onToggle={() => setIsAIPanelCollapsed(false)}
        />
      )}
    </div>
  )
}