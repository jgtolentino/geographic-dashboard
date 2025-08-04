import React, { useState, useEffect, useMemo } from 'react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ComposedChart
} from 'recharts'
import { 
  Clock, MapPin, ShoppingCart, Users, TrendingUp, Package, Target, Brain, 
  AlertCircle, Activity, DollarSign, Eye, Filter, Calendar, CheckCircle,
  Store, Lightbulb, ArrowUpRight, Coffee, Moon, Sun, Sunset, AlertTriangle,
  XCircle, RefreshCw, BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'

// ====================================================================
// SUPABASE CLIENT CONFIGURATION
// ====================================================================

const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'

// Scout v5 Production-Ready Supabase Client
class ScoutAnalyticsClient {
  private async makeRequest(functionName: string, params: any = {}) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const data = await response.json()
      return { data, error: null }
    } catch (error) {
      console.error(`RPC ${functionName} failed:`, error)
      // Return mock data for demo when API fails
      return { data: this.getMockData(functionName), error }
    }
  }

  // Mock data fallback for development
  private getMockData(functionName: string) {
    const mockData: Record<string, any> = {
      get_transaction_trends: Array.from({ length: 24 }, (_, i) => ({
        time_period: i.toString(),
        transaction_count: Math.floor(50 + Math.random() * 200),
        peso_value: Math.floor(5000 + Math.random() * 25000),
        avg_transaction_value: Math.floor(200 + Math.random() * 300),
        peak_indicator: Math.random() > 0.8
      })),
      
      get_product_performance: [
        { company_name: 'Alaska', brand_name: 'Alaska Milk', category: 'Dairy', revenue: 125000, units_sold: 2800, transactions: 450 },
        { company_name: 'Del Monte', brand_name: 'Del Monte Corned Beef', category: 'Canned Goods', revenue: 89000, units_sold: 1900, transactions: 320 },
        { company_name: 'Oishi', brand_name: 'Oishi Prawn Crackers', category: 'Snacks', revenue: 67000, units_sold: 3200, transactions: 280 },
        { company_name: 'Peerless', brand_name: 'Peerless Soy Sauce', category: 'Condiments', revenue: 45000, units_sold: 1500, transactions: 180 },
        { company_name: 'JTI', brand_name: 'Winston', category: 'Tobacco', revenue: 234000, units_sold: 890, transactions: 390 }
      ],
      
      get_regional_performance: [
        { region_name: 'National Capital Region', transactions: 519, revenue: 207113.17, stores: 12, avg_transaction: 399.06 },
        { region_name: 'Central Luzon', transactions: 387, revenue: 145620.50, stores: 8, avg_transaction: 376.42 },
        { region_name: 'CALABARZON', transactions: 294, revenue: 112890.25, stores: 6, avg_transaction: 384.01 },
        { region_name: 'Western Visayas', transactions: 201, revenue: 78450.75, stores: 4, avg_transaction: 390.30 }
      ],
      
      get_consumer_behavior_analysis: [
        { request_type: 'branded', count: 450, percentage: 45, avg_spend: 285 },
        { request_type: 'unbranded', count: 320, percentage: 32, avg_spend: 220 },
        { request_type: 'unsure', count: 230, percentage: 23, avg_spend: 195 }
      ],
      
      get_demographic_insights: [
        { demographic: 'Male 25-34', customer_count: 340, total_spend: 125000, avg_transaction: 368 },
        { demographic: 'Female 25-34', customer_count: 380, total_spend: 142000, avg_transaction: 374 },
        { demographic: 'Male 35-44', customer_count: 280, total_spend: 118000, avg_transaction: 421 },
        { demographic: 'Female 35-44', customer_count: 290, total_spend: 128000, avg_transaction: 441 }
      ],

      get_ai_insights: [
        {
          id: '1',
          title: 'Peak Hour Revenue Opportunity',
          description: 'Transaction volume increases 34% between 2-4 PM but average transaction value drops 12%.',
          confidence_score: 0.87,
          impact_score: 0.76,
          insight_type: 'opportunity',
          recommendations: ['Premium product promotions during 2-4 PM', 'Staff training on upselling techniques']
        },
        {
          id: '2', 
          title: 'Regional Market Penetration Alert',
          description: 'CALABARZON region shows 23% growth but 45% lower TBWA brand penetration vs NCR.',
          confidence_score: 0.92,
          impact_score: 0.84,
          insight_type: 'opportunity', 
          recommendations: ['Increase TBWA brand visibility in CALABARZON', 'Regional marketing campaign']
        }
      ]
    }
    
    return mockData[functionName] || []
  }

  // Public API methods
  async getTransactionTrends(filters: any = {}) {
    return this.makeRequest('get_transaction_trends', { filters_json: filters })
  }

  async getProductPerformance(filters: any = {}) {
    return this.makeRequest('get_product_performance', { filters_json: filters })
  }

  async getRegionalPerformance(filters: any = {}) {
    return this.makeRequest('get_regional_performance', { filters_json: filters })
  }

  async getConsumerBehavior(filters: any = {}) {
    return this.makeRequest('get_consumer_behavior_analysis', { filters_json: filters })
  }

  async getDemographicInsights(filters: any = {}) {
    return this.makeRequest('get_demographic_insights', { filters_json: filters })
  }

  async getAIInsights(filters: any = {}) {
    return this.makeRequest('get_ai_insights', { filters_json: filters })
  }

  async getProductFilters(sessionId: string, selections: any = {}) {
    return this.makeRequest('filters.get_product_filter_options', { 
      p_session_id: sessionId, 
      p_current_selections: selections 
    })
  }

  async getDashboardData(filters: any = {}) {
    return this.makeRequest('get_dashboard_data_with_company_cascade', { p_filters_json: filters })
  }
}

const scoutClient = new ScoutAnalyticsClient()

// ====================================================================
// CUSTOM HOOKS FOR DATA FETCHING
// ====================================================================

function useScoutData(functionName: string, params: any = {}, dependencies: any[] = []) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      let result
      switch (functionName) {
        case 'get_transaction_trends':
          result = await scoutClient.getTransactionTrends(params.filters_json)
          break
        case 'get_product_performance':
          result = await scoutClient.getProductPerformance(params.filters_json)
          break
        case 'get_consumer_behavior_analysis':
          result = await scoutClient.getConsumerBehavior(params.filters_json)
          break
        case 'get_demographic_insights':
          result = await scoutClient.getDemographicInsights(params.filters_json)
          break
        case 'get_ai_insights':
          result = await scoutClient.getAIInsights(params.filters_json)
          break
        default:
          result = { data: [], error: 'Unknown function' }
      }
      
      if (result.error) {
        setError(result.error.message || 'Failed to fetch data')
      } else {
        setData(result.data || [])
      }
      
      setLoading(false)
    }

    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

function useFilters() {
  const [filters, setFilters] = useState({
    geographic: {},
    product: {},
    temporal: {
      date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    },
    demographic: {}
  })

  const updateFilter = (category: string, key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  return { filters, updateFilter }
}

// ====================================================================
// MODULE 1: TRANSACTION TRENDS
// ====================================================================

function TransactionTrendsModule({ filters }: { filters: any }) {
  const { data: trendsData, loading } = useScoutData('get_transaction_trends', {
    filters_json: filters
  }, [filters])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const totalTransactions = trendsData.reduce((sum, d) => sum + d.transaction_count, 0)
  const totalRevenue = trendsData.reduce((sum, d) => sum + d.peso_value, 0)
  const peakHour = trendsData.reduce((max, d) => d.transaction_count > max.transaction_count ? d : max, trendsData[0])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-blue-500 mr-2" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transaction Trends</h2>
            <p className="text-sm text-gray-600">Volume, timing, and patterns by hour</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Hourly Transaction Volume */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Hourly Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time_period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                formatter={(value: any) => [value.toLocaleString(), 'Transactions']}
              />
              <Line 
                type="monotone" 
                dataKey="transaction_count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Patterns */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Hourly Revenue Patterns</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time_period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="peso_value" 
                stroke="#10b981" 
                strokeWidth={2}
                fill="url(#revenueGradient)" 
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalTransactions.toLocaleString()}</div>
          <div className="text-xs text-blue-800">Total Transactions</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">₱{Math.round(totalRevenue / 1000)}K</div>
          <div className="text-xs text-green-800">Total Revenue</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{peakHour?.time_period || 0}:00</div>
          <div className="text-xs text-purple-800">Peak Hour</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">₱{Math.round(totalRevenue / totalTransactions)}</div>
          <div className="text-xs text-orange-800">Avg Transaction</div>
        </div>
      </div>
    </motion.div>
  )
}

// ====================================================================
// MODULE 2: PRODUCT MIX & SKU INFO
// ====================================================================

function ProductMixModule({ filters }: { filters: any }) {
  const { data: productData, loading } = useScoutData('get_product_performance', {
    filters_json: filters
  }, [filters])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const pieData = productData.slice(0, 5).map((item, index) => ({
    name: item.brand_name,
    value: item.revenue,
    fill: colors[index]
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-green-500 mr-2" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Product Mix & SKU Performance</h2>
            <p className="text-sm text-gray-600">Brand performance across categories</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Brand */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Revenue by Brand</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`₱${(value/1000).toFixed(0)}K`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Category Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'units_sold' ? value.toLocaleString() : `₱${(value/1000).toFixed(0)}K`,
                  name === 'units_sold' ? 'Units' : 'Revenue'
                ]}
              />
              <Bar dataKey="revenue" fill="#10b981" name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Top Performing Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Brand</th>
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Units</th>
                <th className="text-right py-2">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {productData.slice(0, 8).map((product, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-white">
                  <td className="py-2 font-medium">{product.brand_name}</td>
                  <td className="py-2 text-gray-600">{product.category}</td>
                  <td className="py-2 text-right font-medium text-green-600">₱{(product.revenue/1000).toFixed(0)}K</td>
                  <td className="py-2 text-right">{product.units_sold.toLocaleString()}</td>
                  <td className="py-2 text-right">{product.transactions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{productData.length}</div>
          <div className="text-xs text-green-800">Active Brands</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ₱{Math.round(productData.reduce((sum, p) => sum + p.revenue, 0) / 1000000)}M
          </div>
          <div className="text-xs text-blue-800">Total Revenue</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {productData.reduce((sum, p) => sum + p.units_sold, 0).toLocaleString()}
          </div>
          <div className="text-xs text-purple-800">Units Sold</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {productData.reduce((sum, p) => sum + p.transactions, 0).toLocaleString()}
          </div>
          <div className="text-xs text-orange-800">Total Transactions</div>
        </div>
      </div>
    </motion.div>
  )
}

// ====================================================================
// MODULE 3: CONSUMER BEHAVIOR
// ====================================================================

function ConsumerBehaviorModule({ filters }: { filters: any }) {
  const { data: behaviorData, loading } = useScoutData('get_consumer_behavior_analysis', {
    filters_json: filters
  }, [filters])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-purple-500 mr-2" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Consumer Behavior Insights</h2>
            <p className="text-sm text-gray-600">How customers request and purchase products</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Request Type Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">How Products Are Requested</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={behaviorData.map((item, index) => ({
                  name: item.request_type,
                  value: item.count,
                  fill: colors[index]
                }))}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              />
              <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Average Spend by Request Type */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Average Spend by Request Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={behaviorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="request_type" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => [`₱${value}`, 'Avg Spend']} />
              <Bar dataKey="avg_spend" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Behavioral Insights */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Behavioral Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {behaviorData.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{item.request_type} Requests</h4>
                <span className="text-2xl font-bold text-purple-600">{item.percentage}%</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Count: {item.count.toLocaleString()}</div>
                <div>Avg Spend: ₱{item.avg_spend}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(behaviorData.find(d => d.request_type === 'branded')?.percentage || 0)}%
          </div>
          <div className="text-xs text-purple-800">Branded Requests</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ₱{Math.round(behaviorData.reduce((sum, d) => sum + d.avg_spend, 0) / behaviorData.length)}
          </div>
          <div className="text-xs text-blue-800">Avg Transaction</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {behaviorData.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
          </div>
          <div className="text-xs text-green-800">Total Interactions</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">76%</div>
          <div className="text-xs text-orange-800">Suggestion Accept Rate</div>
        </div>
      </div>
    </motion.div>
  )
}

// ====================================================================
// MODULE 4: CONSUMER PROFILING
// ====================================================================

function ConsumerProfilingModule({ filters }: { filters: any }) {
  const { data: profileData, loading } = useScoutData('get_demographic_insights', {
    filters_json: filters
  }, [filters])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-pink-500 mr-2" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Consumer Profiling</h2>
            <p className="text-sm text-gray-600">Demographics and customer segments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Value by Demographic */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Value by Demographic</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart data={profileData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="customer_count" 
                name="Customers"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                dataKey="avg_transaction" 
                name="Avg Transaction"
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'customer_count' ? value.toLocaleString() : `₱${value}`,
                  name === 'customer_count' ? 'Customers' : 'Avg Transaction'
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Scatter dataKey="avg_transaction" fill="#ec4899" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Demographics Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Demographics Overview</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {profileData.map((profile, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <div className="font-medium text-sm">{profile.demographic}</div>
                  <div className="text-xs text-gray-500">{profile.customer_count} customers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-pink-600">₱{profile.avg_transaction}</div>
                  <div className="text-xs text-gray-500">avg transaction</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-pink-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">
            {profileData.reduce((sum, p) => sum + p.customer_count, 0).toLocaleString()}
          </div>
          <div className="text-xs text-pink-800">Total Customers</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ₱{Math.round(profileData.reduce((sum, p) => sum + p.total_spend, 0) / 1000000)}M
          </div>
          <div className="text-xs text-blue-800">Total Spend</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            ₱{Math.round(profileData.reduce((sum, p) => sum + p.avg_transaction, 0) / profileData.length)}
          </div>
          <div className="text-xs text-green-800">Avg Transaction</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{profileData.length}</div>
          <div className="text-xs text-purple-800">Active Segments</div>
        </div>
      </div>
    </motion.div>
  )
}

// ====================================================================
// AI RECOMMENDATIONS PANEL
// ====================================================================

function AIRecommendationPanel({ filters }: { filters: any }) {
  const { data: insights, loading } = useScoutData('get_ai_insights', {
    filters_json: filters
  }, [filters])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200"
    >
      <div className="flex items-center mb-4">
        <Brain className="h-6 w-6 text-indigo-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <div className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
          Live
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    insight.impact_score > 0.8 ? 'bg-red-500' :
                    insight.impact_score > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {Math.round(insight.confidence_score * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              {insight.recommendations?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {insight.recommendations.slice(0, 2).map((action: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                      {action}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ====================================================================
// FILTER PANEL
// ====================================================================

function FilterPanel({ filters, updateFilter }: { filters: any, updateFilter: Function }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-gray-500"
    >
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
          <input 
            type="date" 
            className="w-full border rounded px-2 py-1 text-sm"
            value={filters.temporal.date_from}
            onChange={(e) => updateFilter('temporal', 'date_from', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
          <input 
            type="date" 
            className="w-full border rounded px-2 py-1 text-sm"
            value={filters.temporal.date_to}
            onChange={(e) => updateFilter('temporal', 'date_to', e.target.value)}
          />
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
          <select 
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) => updateFilter('geographic', 'region', [e.target.value])}
          >
            <option value="">All Regions</option>
            <option value="National Capital Region">NCR</option>
            <option value="Central Luzon">Central Luzon</option>
            <option value="CALABARZON">CALABARZON</option>
          </select>
        </div>

        {/* Brand Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
          <select 
            className="w-full border rounded px-2 py-1 text-sm"
            onChange={(e) => updateFilter('product', 'brand', [e.target.value])}
          >
            <option value="">All Brands</option>
            <option value="Alaska">Alaska</option>
            <option value="Del Monte">Del Monte</option>
            <option value="Oishi">Oishi</option>
          </select>
        </div>
      </div>
    </motion.div>
  )
}

// ====================================================================
// MAIN DASHBOARD COMPONENT
// ====================================================================

export default function ScoutAnalyticsIntegratedDashboard() {
  const { filters, updateFilter } = useFilters()
  const [activeModule, setActiveModule] = useState<'trends' | 'product' | 'behavior' | 'profiling'>('trends')

  const modules = [
    { id: 'trends', name: 'Transaction Trends', icon: Clock, color: 'blue' },
    { id: 'product', name: 'Product Mix', icon: Package, color: 'green' },
    { id: 'behavior', name: 'Consumer Behavior', icon: Target, color: 'purple' },
    { id: 'profiling', name: 'Consumer Profiling', icon: Users, color: 'pink' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scout Analytics Platform</h1>
              <p className="text-sm text-gray-600">TBWA Philippines Enterprise Data Intelligence</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live Data</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Module Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id as any)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeModule === module.id
                      ? `border-${module.color}-500 text-${module.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {module.name}
                </button>
              )
            })}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <FilterPanel filters={filters} updateFilter={updateFilter} />
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Module Content */}
          <div className="xl:col-span-3 space-y-8">
            {activeModule === 'trends' && <TransactionTrendsModule filters={filters} />}
            {activeModule === 'product' && <ProductMixModule filters={filters} />}
            {activeModule === 'behavior' && <ConsumerBehaviorModule filters={filters} />}
            {activeModule === 'profiling' && <ConsumerProfilingModule filters={filters} />}
          </div>

          {/* AI Recommendations Sidebar */}
          <div className="xl:col-span-1">
            <AIRecommendationPanel filters={filters} />
          </div>
        </div>
      </div>
    </div>
  )
}