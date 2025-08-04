'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SuqiIntelChat } from '@/components/suqiintel-chat'
import ScoutAnalyticsIntegratedDashboard from '@/components/scout-analytics-integrated'
import { 
  BarChart3, 
  Brain, 
  MessageSquare, 
  Settings, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Target
} from 'lucide-react'

// ====================================================================
// INTEGRATED SCOUT & SUQI INTEL DASHBOARD
// ====================================================================

export default function ScoutSuqiIntegratedDashboard() {
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'chat'>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const navigationItems = [
    { id: 'dashboard', name: 'Executive Dashboard', icon: Home, description: 'KPIs and overview' },
    { id: 'analytics', name: 'Analytics Modules', icon: BarChart3, description: 'Deep dive analytics' },
    { id: 'geography', name: 'Geographic Intel', icon: MapPin, description: 'Regional performance' },
    { id: 'products', name: 'Product Intelligence', icon: Package, description: 'SKU and brand analysis' },
    { id: 'consumers', name: 'Consumer Insights', icon: Users, description: 'Behavior and profiling' },
    { id: 'ai-insights', name: 'AI Recommendations', icon: Brain, description: 'Smart insights' },
  ]

  const handleQuerySuccess = (data: any) => {
    console.log('Query executed successfully:', data)
    // Handle successful query results
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isSidebarOpen ? 0 : -240 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-64 bg-white shadow-lg border-r flex flex-col relative z-10"
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Scout Platform</h1>
              <p className="text-sm text-gray-500">SUQI Intel Enabled</p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveView(item.id as any)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </nav>

        {/* SUQI Intel Chat Toggle */}
        <div className="p-4 border-t">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all ${
              isChatOpen
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <MessageSquare className={`w-5 h-5 mr-3 ${isChatOpen ? 'text-purple-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="font-medium text-sm">SUQI Intel</div>
              <div className="text-xs text-gray-500">AI Assistant</div>
            </div>
            {isChatOpen && (
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigationItems.find(item => item.id === activeView)?.name || 'Scout Dashboard'}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {/* Executive Dashboard Content */}
                <div className="p-6 h-full overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* KPI Cards */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 text-blue-200" />
                        <span className="text-xs bg-blue-400/30 px-2 py-1 rounded-full">+12.5%</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">₱14.5M</div>
                      <div className="text-blue-200 text-sm">Total Revenue</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <ShoppingCart className="w-8 h-8 text-green-200" />
                        <span className="text-xs bg-green-400/30 px-2 py-1 rounded-full">+8.3%</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">127,138</div>
                      <div className="text-green-200 text-sm">Transactions</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-purple-200" />
                        <span className="text-xs bg-purple-400/30 px-2 py-1 rounded-full">+15.2%</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">247</div>
                      <div className="text-purple-200 text-sm">Active Stores</div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Package className="w-8 h-8 text-orange-200" />
                        <span className="text-xs bg-red-400/30 px-2 py-1 rounded-full">-2.1%</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">₱114</div>
                      <div className="text-orange-200 text-sm">Avg Order Value</div>
                    </div>
                  </div>

                  {/* Quick Insights */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Intelligence</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Peak sales detected in NCR region</p>
                          <p className="text-xs text-gray-500">Transaction volume up 34% vs yesterday</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Winston brand performing above target</p>
                          <p className="text-xs text-gray-500">TBWA client showing strong market penetration</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Restock alert for Bicol region</p>
                          <p className="text-xs text-gray-500">Inventory levels dropping for key SKUs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ScoutAnalyticsIntegratedDashboard />
              </motion.div>
            )}

            {/* Other views would go here */}
            {activeView !== 'dashboard' && activeView !== 'analytics' && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {navigationItems.find(item => item.id === activeView)?.name}
                  </h3>
                  <p className="text-gray-500">Module coming soon</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SUQI Intel Chat - Floating */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-6 top-20 bottom-6 w-96 z-50"
          >
            <div className="h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">SUQI Intel Assistant</h3>
                      <p className="text-xs text-purple-100">Ask questions about your data</p>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <SuqiIntelChat 
                    onQuerySuccess={handleQuerySuccess}
                    className="h-full border-none shadow-none rounded-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button when closed */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center"
        >
          <Brain className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  )
}