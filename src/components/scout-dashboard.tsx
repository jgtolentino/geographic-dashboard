'use client'

import { useState, useEffect, useCallback } from 'react'
import { SidebarNavigation } from '@/components/layout/sidebar-navigation'
import { TopNavigation } from '@/components/layout/top-navigation'
import { FilterBar } from '@/components/layout/filter-bar'
import { RecommendationPanelV2 } from '@/components/ai/recommendation-panel-v2'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterState } from '@/types/scout-dashboard'
import { 
  useExecutiveOverview,
  useTransactionTrends,
  useProductMix,
  useConsumerBehavior,
  useRegionalPerformance,
  useConsumerProfiling,
  useBusinessHealth,
  usePerformanceMetrics,
  useCategoryMix
} from '@/lib/scout-dashboard-service-v2'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, MapPin, AlertCircle, CheckCircle } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

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
  const [refreshing, setRefreshing] = useState(false)

  // Data hooks with refresh intervals
  const { data: executiveData, loading: execLoading, error: execError, refresh: refetchExec } = useExecutiveOverview()
  const { data: trendsData, loading: trendsLoading, error: trendsError, refresh: refetchTrends } = useTransactionTrends()
  const { data: productData, loading: productLoading, error: productError, refresh: refetchProduct } = useProductMix()
  const { data: behaviorData, loading: behaviorLoading, error: behaviorError, refresh: refetchBehavior } = useConsumerBehavior()
  const { data: regionalData, loading: regionalLoading, error: regionalError, refresh: refetchRegional } = useRegionalPerformance()
  const { data: profilingData, loading: profilingLoading, error: profilingError, refresh: refetchProfiling } = useConsumerProfiling()
  const { data: healthData, loading: healthLoading, error: healthError, refresh: refetchHealth } = useBusinessHealth(filters)
  const { data: metricsData, loading: metricsLoading, error: metricsError, refresh: refetchMetrics } = usePerformanceMetrics(filters)
  const { data: categoryData, loading: categoryLoading, error: categoryError, refresh: refetchCategory } = useCategoryMix()

  // Auto-refresh functionality
  useEffect(() => {
    const kpiInterval = setInterval(() => {
      refetchExec()
      refetchHealth()
      refetchMetrics()
    }, 5 * 60 * 1000) // 5 minutes for KPIs

    const trendsInterval = setInterval(() => {
      refetchTrends()
      refetchProduct()
      refetchBehavior()
      refetchRegional()
      refetchProfiling()
    }, 2 * 60 * 1000) // 2 minutes for trends

    return () => {
      clearInterval(kpiInterval)
      clearInterval(trendsInterval)
    }
  }, [refetchExec, refetchTrends, refetchProduct, refetchBehavior, refetchRegional, refetchProfiling, refetchHealth, refetchMetrics])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refetchExec(),
        refetchTrends(),
        refetchProduct(),
        refetchBehavior(),
        refetchRegional(),
        refetchProfiling(),
        refetchHealth(),
        refetchMetrics(),
        refetchCategory()
      ])
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refetchExec, refetchTrends, refetchProduct, refetchBehavior, refetchRegional, refetchProfiling, refetchHealth, refetchMetrics])

  const renderModule = () => {
    switch (currentModule) {
      case 'home':
        return <HomeModule />
      case 'transaction-trends':
        return <TransactionTrendsModule />
      case 'product-mix':
        return <ProductMixModule />
      case 'consumer-behavior':
        return <ConsumerBehaviorModule />
      case 'consumer-profiling':
        return <ConsumerProfilingModule />
      case 'regional-performance':
        return <RegionalPerformanceModule />
      case 'business-health':
        return <BusinessHealthModule />
      default:
        return <HomeModule />
    }
  }

  // Component modules
  const HomeModule = () => (
    <div className="space-y-6">
      {/* Executive Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${executiveData?.totalRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {executiveData?.revenueGrowth && (
                <span className={`flex items-center ${executiveData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {executiveData.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(executiveData.revenueGrowth).toFixed(1)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executiveData?.totalTransactions?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              {executiveData?.transactionGrowth && (
                <span className={`flex items-center ${executiveData.transactionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {executiveData.transactionGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(executiveData.transactionGrowth).toFixed(1)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executiveData?.activeStores?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Active stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${executiveData?.avgBasketSize?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Average transaction value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Health Alerts */}
      {healthData?.alerts && healthData.alerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Business Health Alerts</h3>
          <div className="grid gap-4">
            {healthData.alerts.map((alert: any, index: number) => (
              <Alert key={index} className={alert.severity === 'high' ? 'border-red-500 bg-red-50' : alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  {alert.title}
                  <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'secondary' : 'default'}>
                    {alert.severity}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsData?.dailyData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData?.categories && categoryData.categories.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData.categories.slice(0, 4)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryData.categories.slice(0, 4).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value.toLocaleString()} transactions`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const TransactionTrendsModule = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Trends Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="space-y-4">
              {trendsData?.dailyData && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trendsData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#8884d8" />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            <TabsContent value="weekly" className="space-y-4">
              {trendsData?.weeklyData && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="transactions" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            <TabsContent value="monthly" className="space-y-4">
              {trendsData?.monthlyData && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trendsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#8884d8" />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  const ProductMixModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Mix Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold">{productData?.totalSKUs || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Category</p>
                <p className="text-xl font-medium">{productData?.topCategory || 'Loading...'}</p>
                <p className="text-sm text-muted-foreground">{productData?.topCategoryPercentage || 0}% of products</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Brands</p>
                <p className="text-2xl font-bold">{productData?.brandsCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {productData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: productData.topCategory, value: productData.topCategoryPercentage },
                      { name: 'Other Categories', value: 100 - productData.topCategoryPercentage }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS[0]} />
                    <Cell fill={COLORS[1]} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const ConsumerBehaviorModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branded Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {behaviorData?.brandedRequestsPercentage || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Of total requests</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggestion Acceptance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {behaviorData?.suggestionAcceptanceRate || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Acceptance rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Dwell Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {behaviorData?.averageDwellTime || 0}s
              </div>
              <p className="text-sm text-muted-foreground">Per transaction</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repeat Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {behaviorData?.repeatCustomerRate || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Return rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumer Behavior Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {behaviorData && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { metric: 'Branded Requests', value: behaviorData.brandedRequestsPercentage },
                { metric: 'Suggestion Accept', value: behaviorData.suggestionAcceptanceRate },
                { metric: 'Repeat Rate', value: behaviorData.repeatCustomerRate }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {behaviorData?.hourlyPatterns && (
        <Card>
          <CardHeader>
            <CardTitle>Hourly Transaction Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={behaviorData.hourlyPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'transactions') return [value.toLocaleString(), 'Transactions']
                    return [`₱${value}`, 'Avg Value']
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#8884d8" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avgValue" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const ConsumerProfilingModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumer Profile Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">New Segments Identified</p>
                <p className="text-2xl font-bold">{profilingData?.newSegments || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Age Group</p>
                <p className="text-xl font-medium">{profilingData?.topAgeGroup || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Gender</p>
                <p className="text-xl font-medium">{profilingData?.topGender || 'Loading...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Economic Class Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {profilingData?.economicClassDistribution && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(profilingData.economicClassDistribution).map(([className, percentage]) => ({
                      name: `Class ${className}`,
                      value: percentage
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(profilingData.economicClassDistribution).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          {profilingData?.topSegments && (
            <div className="space-y-4">
              {profilingData.topSegments.map((segment, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{segment.segment}</p>
                    <p className="text-sm text-muted-foreground">{segment.count.toLocaleString()} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{segment.acceptance}%</p>
                    <p className="text-sm text-muted-foreground">Suggestion acceptance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const RegionalPerformanceModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Region</CardTitle>
          </CardHeader>
          <CardContent>
            {regionalData && regionalData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Regions</CardTitle>
          </CardHeader>
          <CardContent>
            {regionalData && regionalData.length > 0 && (
              <div className="space-y-4">
                {regionalData.slice(0, 5).map((region, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{region.region}</p>
                        <p className="text-sm text-muted-foreground">{region.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₱{region.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Growth: {region.growth.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const BusinessHealthModule = () => (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                (healthData?.overallScore || 0) >= 80 ? 'text-green-600' :
                (healthData?.overallScore || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {healthData?.overallScore || 0}/100
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {(healthData?.overallScore || 0) >= 80 ? 'Excellent' :
                 (healthData?.overallScore || 0) >= 60 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{healthData?.revenueHealth || 0}%</p>
                <p className="text-sm text-muted-foreground">vs target</p>
              </div>
              {(healthData?.revenueHealth || 0) >= 90 ? 
                <CheckCircle className="h-8 w-8 text-green-600" /> :
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{healthData?.customerSatisfaction || 0}%</p>
                <p className="text-sm text-muted-foreground">satisfaction rate</p>
              </div>
              {(healthData?.customerSatisfaction || 0) >= 90 ? 
                <CheckCircle className="h-8 w-8 text-green-600" /> :
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {metricsData?.kpis && (
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricsData.kpis.map((kpi: any, index: number) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{kpi.name}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                  <p className={`text-sm ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {kpi.change}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

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
        {/* Top Navigation with refresh button */}
        <div className="flex items-center justify-between p-4 border-b">
          <TopNavigation />
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* Loading State */}
        {(execLoading || trendsLoading || productLoading || behaviorLoading || regionalLoading || profilingLoading || healthLoading || metricsLoading) && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        )}

        {/* Error States */}
        {(execError || trendsError || productError || behaviorError || regionalError || profilingError || healthError || metricsError) && (
          <Alert className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Loading Error</AlertTitle>
            <AlertDescription>
              There was an error loading some data. Please try refreshing or check your connection.
            </AlertDescription>
          </Alert>
        )}

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
          activeModule: currentModule,
          data: {
            executive: executiveData,
            trends: trendsData,
            product: productData,
            behavior: behaviorData,
            regional: regionalData,
            profiling: profilingData,
            health: healthData,
            metrics: metricsData
          }
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