// ====================================================================
// SCOUT DASHBOARD COMPONENTS - COMPLETE UI WITH REAL DATA
// ====================================================================
// Replace all mock components with these real data-connected versions

import React from 'react'
import { 
  useScoutDashboard,
  useExecutiveOverview,
  useRevenueTrend,
  useCategoryMix,
  useRegionalPerformance,
  useTransactionTrends,
  useProductMix,
  useConsumerBehavior,
  useConsumerProfiling,
  useAIAssistant
} from './scout-dashboard-service'
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'

// ====================================================================
// MAIN SCOUT DASHBOARD COMPONENT
// ====================================================================
export function ScoutDashboard() {
  const { 
    kpis, revenueTrend, categoryMix, regionalPerformance, 
    transactionTrends, productMix, consumerBehavior, consumerProfiling,
    isLoading, hasError, refreshAll, lastUpdated 
  } = useScoutDashboard()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading Scout Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader lastUpdated={lastUpdated} onRefresh={refreshAll} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Executive Overview */}
        <ExecutiveOverview data={kpis} />
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevenueTrendChart data={revenueTrend} />
          <CategoryMixChart data={categoryMix} />
        </div>
        
        {/* Regional Performance */}
        <RegionalPerformanceTable data={regionalPerformance} />
        
        {/* Dashboard Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TransactionTrendsCard data={transactionTrends} />
          <ProductMixCard data={productMix} />
          <ConsumerBehaviorCard data={consumerBehavior} />
          <ConsumerProfilingCard data={consumerProfiling} />
        </div>
        
        {/* AI Assistant */}
        <AIAssistantPanel />
      </div>
    </div>
  )
}

// ====================================================================
// DASHBOARD HEADER
// ====================================================================
function DashboardHeader({ lastUpdated, onRefresh }: { lastUpdated: string, onRefresh: () => void }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scout Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time Analytics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={onRefresh}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
            <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
              Share
            </button>
            <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// EXECUTIVE OVERVIEW KPIs
// ====================================================================
function ExecutiveOverview({ data }: { data: any }) {
  const formatCurrency = (value: number) => `₱${(value / 1000000).toFixed(2)}M`
  const formatNumber = (value: number) => value.toLocaleString()
  const formatGrowth = (value: number) => `${value > 0 ? '+' : ''}${value}%`

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Executive Overview</h2>
      <p className="text-sm text-gray-600 mb-6">Real-time insights across all Scout Dashboard modules</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(data?.totalRevenue || 0)}</p>
              <p className="text-sm text-blue-700">
                <span className={`font-medium ${data?.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(data?.revenueGrowth || 0)}
                </span> vs last month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Transactions</p>
              <p className="text-2xl font-bold text-green-900">{formatNumber(data?.totalTransactions || 0)}</p>
              <p className="text-sm text-green-700">
                <span className={`font-medium ${data?.transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(data?.transactionGrowth || 0)}
                </span> vs last month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Stores */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Active Stores</p>
              <p className="text-2xl font-bold text-purple-900">{formatNumber(data?.activeStores || 0)}</p>
              <p className="text-sm text-purple-700">
                <span className="font-medium text-green-600">+{data?.newStores || 0}</span> new this month
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Avg Basket Size */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avg Basket Size</p>
              <p className="text-2xl font-bold text-orange-900">{data?.avgBasketSize || 0}</p>
              <p className="text-sm text-orange-700">
                <span className={`font-medium ${data?.basketGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(data?.basketGrowth || 0)}
                </span> items per transaction
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m5.5-5v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m8 0V9a1 1 0 00-1-1H9a1 1 0 00-1 1v4.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// REVENUE TREND CHART
// ====================================================================
function RevenueTrendChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <p className="text-sm text-gray-600">Monthly revenue performance</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800">View Details</button>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" tickFormatter={(value) => `₱${(value / 1000000).toFixed(1)}M`} />
            <Tooltip 
              formatter={(value: number) => [`₱${(value / 1000000).toFixed(2)}M`, 'Revenue']}
              labelStyle={{ color: '#374151' }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3B82F6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ====================================================================
// CATEGORY MIX PIE CHART
// ====================================================================
function CategoryMixChart({ data }: { data: any[] }) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Category Mix</h3>
      <p className="text-sm text-gray-600 mb-6">Product category distribution</p>
      
      <div className="flex items-center space-x-6">
        <div className="flex-1 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentage"
                label={({ name, percentage }) => `${name} ${percentage}%`}
              >
                {(data || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          {(data || []).slice(0, 5).map((category, index) => (
            <div key={category.category} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">{category.category}</span>
                <span className="text-gray-600 ml-2">{category.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// REGIONAL PERFORMANCE TABLE
// ====================================================================
function RegionalPerformanceTable({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Regional Performance</h3>
          <p className="text-sm text-gray-600">Transaction volume and revenue by region</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Live Data
          </span>
          <button className="text-sm text-blue-600 hover:text-blue-800">View Map</button>
        </div>
      </div>
      
      <div className="space-y-4">
        {(data || []).slice(0, 5).map((region, index) => (
          <div key={region.region} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{region.region}</h4>
              <p className="text-sm text-gray-600">{region.transactions.toLocaleString()} transactions</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">₱{(region.revenue / 1000000).toFixed(2)}M</p>
              <p className={`text-sm font-medium ${region.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {region.growth >= 0 ? '+' : ''}{region.growth.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ====================================================================
// DASHBOARD MODULE CARDS
// ====================================================================
function TransactionTrendsCard({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Transaction Trends</h4>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Live</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{data?.todayTransactions?.toLocaleString() || 0}</p>
      <p className="text-sm text-gray-600">transactions today</p>
    </div>
  )
}

function ProductMixCard({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Product Mix</h4>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">New</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{data?.totalSKUs || 0}</p>
      <p className="text-sm text-gray-600">SKUs</p>
      <p className="text-xs text-gray-500 mt-1">Top: {data?.topCategory} ({data?.topCategoryPercentage}%)</p>
    </div>
  )
}

function ConsumerBehaviorCard({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Consumer Behavior</h4>
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Active</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{data?.brandedRequestsPercentage || 0}%</p>
      <p className="text-sm text-gray-600">branded requests</p>
    </div>
  )
}

function ConsumerProfilingCard({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Consumer Profiling</h4>
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Active</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{data?.newSegments || 0}</p>
      <p className="text-sm text-gray-600">new segments identified</p>
    </div>
  )
}

// ====================================================================
// AI ASSISTANT PANEL
// ====================================================================
function AIAssistantPanel() {
  const { insights, loading, refresh } = useAIAssistant()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded">Insights</button>
          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">Actions</button>
          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">Chat</button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Key Insights</h4>
          <button onClick={refresh} className="text-sm text-blue-600 hover:text-blue-800">
            Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ====================================================================
// EXPORT MAIN COMPONENT
// ====================================================================
export default ScoutDashboard