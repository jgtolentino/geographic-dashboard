'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SuqiIntelChat } from '@/components/suqiintel-chat'
import { 
  useExecutiveOverview,
  useRegionalPerformance,
  useTransactionInsights,
  useBrandPerformance,
  useLocationIntelligence,
  useCustomerSegmentation,
  usePredictiveInsights,
  useProductCascadeFilter,
  useSuqiIntelQuery
} from '@/lib/scout-dashboard-service-gold'
import { 
  BarChart3, 
  Brain, 
  MessageSquare, 
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  MapPin,
  Star,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react'

// ====================================================================
// SCOUT DASHBOARD PRODUCTION - SUQI INTEL INTEGRATED
// ====================================================================

export default function ScoutDashboardProduction() {
  // State management
  const [isSuqiChatOpen, setIsSuqiChatOpen] = useState(false)
  const [suqiMinimized, setSuqiMinimized] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Gold layer data hooks
  const executive = useExecutiveOverview()
  const regions = useRegionalPerformance()
  const transactions = useTransactionInsights()
  const brands = useBrandPerformance()
  const locations = useLocationIntelligence()
  const customers = useCustomerSegmentation()
  const predictions = usePredictiveInsights()
  const productFilters = useProductCascadeFilter(sessionId)
  const suqiQuery = useSuqiIntelQuery()

  // Refresh all data
  const handleRefreshAll = () => {
    executive.refresh()
    regions.refresh()
    transactions.refresh()
    brands.refresh()
    locations.refresh()
    customers.refresh()
    predictions.refresh()
    productFilters.refresh()
    setRefreshTrigger(prev => prev + 1)
  }

  // SUQI Intel query success handler
  const handleSuqiQuerySuccess = (data: any) => {
    console.log('SUQI Intel query successful:', data)
    // Auto-refresh dashboard data when SUQI provides new insights
    handleRefreshAll()
  }

  // Loading state
  const isLoading = executive.loading || regions.loading || transactions.loading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Scout Analytics Platform</h1>
                  <p className="text-sm text-gray-500">SUQI Intel Powered • Real-time Intelligence</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefreshAll}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh All
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSuqiChatOpen(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Brain className="w-4 h-4 mr-2" />
                SUQI Intel
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-200" />
              <span className={`text-xs px-2 py-1 rounded-full ${
                (executive.data?.revenueGrowth ?? 0) > 0 
                  ? 'bg-green-400/30 text-green-100' 
                  : 'bg-red-400/30 text-red-100'
              }`}>
                {(executive.data?.revenueGrowth ?? 0) > 0 ? '+' : ''}{executive.data?.revenueGrowth ?? 0}%
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              ₱{((executive.data?.totalRevenue ?? 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-blue-200 text-sm">Total Revenue</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="w-8 h-8 text-green-200" />
              <span className={`text-xs px-2 py-1 rounded-full ${
                (executive.data?.transactionGrowth ?? 0) > 0 
                  ? 'bg-green-400/30 text-green-100' 
                  : 'bg-red-400/30 text-red-100'
              }`}>
                {(executive.data?.transactionGrowth ?? 0) > 0 ? '+' : ''}{executive.data?.transactionGrowth ?? 0}%
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {(executive.data?.totalTransactions ?? 0).toLocaleString()}
            </div>
            <div className="text-green-200 text-sm">Transactions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-200" />
              <span className="text-xs bg-purple-400/30 px-2 py-1 rounded-full text-purple-100">
                Active
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {executive.data?.activeStores ?? 0}
            </div>
            <div className="text-purple-200 text-sm">Active Stores</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-orange-200" />
              <span className="text-xs bg-orange-400/30 px-2 py-1 rounded-full text-orange-100">
                ₱{executive.data?.avgBasketSize ?? 0}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {executive.data?.suggestionAcceptanceRate ?? 0}%
            </div>
            <div className="text-orange-200 text-sm">Acceptance Rate</div>
          </motion.div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Regional Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Regional Performance</h3>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {regions.data?.slice(0, 5).map((region, index) => (
                <div key={region.region} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{region.region}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ₱{(region.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div className={`text-xs ${region.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {region.growth >= 0 ? '+' : ''}{region.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Brands */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Brands</h3>
              <Star className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {brands.data?.slice(0, 5).map((brand, index) => (
                <div key={brand.brandName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{brand.brandName}</div>
                      <div className="text-xs text-gray-500">{brand.companyName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ₱{(brand.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div className={`text-xs flex items-center ${
                      brand.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {brand.weeklyGrowth >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                      {Math.abs(brand.weeklyGrowth)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Predictive Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 xl:col-span-1"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Predictive Insights</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            {predictions.data && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-2">Next Week Projection</div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    ₱{(predictions.data.nextWeekProjection / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-gray-600">
                    Range: ₱{(predictions.data.projectionLowerBound / 1000000).toFixed(1)}M - ₱{(predictions.data.projectionUpperBound / 1000000).toFixed(1)}M
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {predictions.data.weeklyGrowthPct}%
                    </div>
                    <div className="text-xs text-gray-500">Weekly Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {predictions.data.monthlyGrowthPct}%
                    </div>
                    <div className="text-xs text-gray-500">Monthly Growth</div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${
                  predictions.data.growthTrend === 'Positive' ? 'bg-green-50 text-green-800' :
                  predictions.data.growthTrend === 'Negative' ? 'bg-red-50 text-red-800' :
                  'bg-yellow-50 text-yellow-800'
                }`}>
                  <div className="text-sm font-medium">Trend: {predictions.data.growthTrend}</div>
                  <div className="text-xs mt-1">Volatility: {predictions.data.volatilityAssessment}</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Customer Segments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {customers.data?.slice(0, 8).map((segment, index) => (
              <div key={`${segment.customerAge}-${segment.customerGender}`} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    {segment.customerGender} {segment.customerAge}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    segment.customerTier === 'Premium' ? 'bg-gold-100 text-gold-800' :
                    segment.customerTier === 'Standard' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {segment.customerTier}
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {segment.segmentSize.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  ₱{segment.avgTransactionValue} avg • {segment.acceptanceRate}% acceptance
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(segment.segmentSharePct * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* SUQI Intel Chat Integration */}
      <AnimatePresence>
        {isSuqiChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-6 top-6 bottom-6 w-96 z-50"
          >
            <div className="h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold">SUQI Intel Assistant</h3>
                        <p className="text-xs text-purple-100">Ask questions about your Scout data</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSuqiMinimized(!suqiMinimized)}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                      >
                        {suqiMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setIsSuqiChatOpen(false)}
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Content */}
                {!suqiMinimized && (
                  <div className="flex-1">
                    <SuqiIntelChat 
                      onQuerySuccess={handleSuqiQuerySuccess}
                      className="h-full border-none shadow-none rounded-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating SUQI Intel Button */}
      {!isSuqiChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSuqiChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center"
        >
          <Brain className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}