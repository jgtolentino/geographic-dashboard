'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseClient } from '@/lib/supabase'
import posthog from 'posthog-js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, MapPin, 
  AlertCircle, CheckCircle, Activity, BarChart3, Target, Trophy, 
  Zap, Globe, RefreshCw, Filter
} from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4']

// Types
interface FilterState {
  dateRange: {
    startDate: string
    endDate: string
  }
  location: string
  category: string
  brand: string
  priceRange: { min: number; max: number }
  customerSegment: string
  campaignType: string
}

interface DashboardData {
  transactionTrends: any[]
  productMix: any[]
  consumerBehavior: any[]
  consumerProfiling: any[]
  geographicIntelligence: any[]
  competitiveIntelligence: any[]
  campaignPerformance: any[]
  kpis: {
    totalRevenue: number
    totalTransactions: number
    uniqueCustomers: number
    avgTransactionValue: number
    activeStores: number
    marketShare: number
    customerSatisfaction: number
    campaignROI: number
  }
}

export function ScoutComplete7ModuleDashboard() {
  const [currentModule, setCurrentModule] = useState('overview')
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    location: 'all',
    category: 'all',
    brand: 'all',
    priceRange: { min: 0, max: 10000 },
    customerSegment: 'all',
    campaignType: 'all'
  })

  const [data, setData] = useState<DashboardData>({
    transactionTrends: [],
    productMix: [],
    consumerBehavior: [],
    consumerProfiling: [],
    geographicIntelligence: [],
    competitiveIntelligence: [],
    campaignPerformance: [],
    kpis: {
      totalRevenue: 0,
      totalTransactions: 0,
      uniqueCustomers: 0,
      avgTransactionValue: 0,
      activeStores: 0,
      marketShare: 0,
      customerSatisfaction: 0,
      campaignROI: 0
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const supabase = createSupabaseClient()

  // Fetch dashboard data from Supabase
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Track analytics
      posthog.capture('scout_dashboard_load', {
        module: currentModule,
        filters: filters
      })

      // Fetch all data in parallel using DEPLOYED PRODUCTION TABLES
      const [
        silverTransactionsResult,
        goldBrandResult,
        bronzeRawResult,
        geographicResult,
        gadmBoundariesResult,
        campaignResult
      ] = await Promise.all([
        // Silver Layer: 128K+ processed transactions
        supabase
          .from('silver_transactions_cleaned')
          .select('*')
          .gte('transaction_date', filters.dateRange.startDate)
          .lte('transaction_date', filters.dateRange.endDate)
          .order('transaction_date', { ascending: false })
          .limit(10000), // Limit for performance
        
        // Gold Layer: Brand performance aggregations  
        supabase
          .from('brand_performance_daily')
          .select('*')
          .gte('business_date', filters.dateRange.startDate)
          .lte('business_date', filters.dateRange.endDate),

        // Bronze Layer: Raw transaction analysis
        supabase
          .from('bronze_transactions_raw')
          .select('raw_data, source_system, ingestion_timestamp, data_quality_score')
          .gte('ingestion_timestamp', filters.dateRange.startDate + 'T00:00:00Z')
          .lte('ingestion_timestamp', filters.dateRange.endDate + 'T23:59:59Z')
          .order('ingestion_timestamp', { ascending: false })
          .limit(5000),

        // Geographic Intelligence: 217 master locations
        supabase
          .from('master_geographic_hierarchy')
          .select('*')
          .order('name'),

        // GADM Boundaries: 1,647 administrative boundaries
        supabase
          .from('gadm_boundaries')
          .select('gadm_id, name_1, name_2, name_3, properties')
          .not('name_1', 'is', null)
          .limit(100), // Regional level for performance

        // Creative Campaigns: 16 deployed campaigns
        supabase
          .from('creative_campaigns')
          .select('*')
          .order('ces_score', { ascending: false })
      ])

      if (silverTransactionsResult.error) throw silverTransactionsResult.error
      if (goldBrandResult.error) throw goldBrandResult.error
      if (bronzeRawResult.error) throw bronzeRawResult.error
      if (geographicResult.error) throw geographicResult.error
      if (gadmBoundariesResult.error) throw gadmBoundariesResult.error
      if (campaignResult.error) throw campaignResult.error

      // Process transaction trends from Silver Layer (128K+ transactions)
      const transactionTrends = processTransactionTrends(silverTransactionsResult.data)
      
      // Process product mix from Silver Layer brand data
      const productMix = processProductMix(silverTransactionsResult.data)
      
      // Process consumer behavior from Silver Layer
      const consumerBehavior = processConsumerBehavior(silverTransactionsResult.data)
      
      // Process consumer profiling from Silver Layer
      const consumerProfiling = processConsumerProfiling(silverTransactionsResult.data)
      
      // Process geographic intelligence from 217 master locations
      const geographicIntelligence = processGeographicIntelligence(geographicResult.data, gadmBoundariesResult.data)
      
      // Process competitive intelligence from brand substitutions
      const competitiveIntelligence = processCompetitiveIntelligence(silverTransactionsResult.data)
      
      // Process campaign performance from 16 campaigns
      const campaignPerformance = processCampaignPerformance(campaignResult.data)

      // Calculate KPIs from production data
      const kpis = calculateKPIs(silverTransactionsResult.data, campaignResult.data, goldBrandResult.data)

      setData({
        transactionTrends,
        productMix,
        consumerBehavior,
        consumerProfiling,
        geographicIntelligence,
        competitiveIntelligence,
        campaignPerformance,
        kpis
      })

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [filters, currentModule])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Data processing functions optimized for DEPLOYED PRODUCTION SCHEMA
  const processTransactionTrends = (silverTransactions: any[]) => {
    const groupedByDate = silverTransactions.reduce((acc, t) => {
      const date = new Date(t.transaction_date).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, transactions: 0, revenue: 0, customers: new Set() }
      }
      acc[date].transactions += 1
      acc[date].revenue += parseFloat(t.total_amount || t.line_total || 0)
      if (t.customer_id) acc[date].customers.add(t.customer_id)
      return acc
    }, {})

    return Object.values(groupedByDate).map((d: any) => ({
      ...d,
      customers: d.customers.size,
      avgTransactionValue: d.revenue / d.transactions || 0
    }))
  }

  const processProductMix = (silverTransactions: any[]) => {
    const groupedByBrand = silverTransactions.reduce((acc, transaction) => {
      const brand = transaction.brand_name || transaction.brand || 'Unknown'
      if (!acc[brand]) {
        acc[brand] = { 
          brand: brand, 
          revenue: 0, 
          quantity: 0, 
          transactions: new Set(),
          category: transaction.category_name || transaction.category || 'Unknown',
          company: transaction.company_name || 'Unknown'
        }
      }
      const amount = parseFloat(transaction.total_amount || transaction.line_total || 0)
      const qty = parseInt(transaction.quantity || 1)
      
      acc[brand].revenue += amount
      acc[brand].quantity += qty
      acc[brand].transactions.add(transaction.transaction_id || transaction.id)
      return acc
    }, {})

    return Object.values(groupedByBrand)
      .map((brand: any) => ({
        ...brand,
        transactions: brand.transactions.size,
        avgPrice: brand.revenue / brand.quantity || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  const processConsumerBehavior = (silverTransactions: any[]) => {
    // Group by payment method and store type patterns from silver data
    const behaviorGroups = silverTransactions.reduce((acc, t) => {
      const paymentMethod = t.payment_method || 'cash'
      const storeType = t.store_type || 'unknown'
      const key = `${paymentMethod}-${storeType}`
      
      if (!acc[key]) {
        acc[key] = {
          paymentMethod: paymentMethod,
          storeType: storeType,
          count: 0,
          totalSpend: 0
        }
      }
      acc[key].count += 1
      acc[key].totalSpend += parseFloat(t.total_amount || t.line_total || 0)
      return acc
    }, {})

    return Object.values(behaviorGroups).map((group: any) => ({
      ...group,
      avgSpend: group.totalSpend / group.count || 0
    }))
  }

  const processConsumerProfiling = (silverTransactions: any[]) => {
    // Profile by region and customer segments
    const profiles = silverTransactions.reduce((acc, t) => {
      const region = t.region_name || t.region || 'Unknown'
      const customerType = t.customer_type || 'regular'
      const key = `${region}-${customerType}`
      
      if (!acc[key]) {
        acc[key] = {
          region: region,
          customerType: customerType,
          count: 0,
          totalSpend: 0
        }
      }
      acc[key].count += 1
      acc[key].totalSpend += parseFloat(t.total_amount || t.line_total || 0)
      return acc
    }, {})

    return Object.values(profiles)
      .map((profile: any) => ({
        ...profile,
        avgSpend: profile.totalSpend / profile.count || 0
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
  }

  const processGeographicIntelligence = (geographicData: any[], gadmData: any[]) => {
    // Combine master geographic hierarchy with GADM boundaries
    const combined = geographicData.map(location => ({
      name: location.name,
      level: location.level_type,
      population: location.population || 0,
      area: location.area_sqkm || 0,
      density: location.density_per_sqkm || 0,
      marketPotential: location.market_potential_score || 0
    }))

    // Add GADM regional data
    const gadmRegions = gadmData
      .filter(boundary => boundary.name_1 && !boundary.name_2) // Regional level
      .map(boundary => ({
        name: boundary.name_1,
        level: 'region',
        gadmId: boundary.gadm_id,
        properties: boundary.properties || {}
      }))

    return [...combined, ...gadmRegions].slice(0, 50) // Limit for performance
  }

  const processCompetitiveIntelligence = (silverTransactions: any[]) => {
    // Analyze brand competition from transaction patterns
    const brandAnalysis = silverTransactions.reduce((acc, transaction) => {
      const brand = transaction.brand_name || transaction.brand || 'Unknown'
      const category = transaction.category_name || transaction.category || 'Unknown'
      const key = `${category}-${brand}`
      
      if (!acc[key]) {
        acc[key] = {
          category: category,
          brand: brand,
          transactions: 0,
          revenue: 0,
          marketShare: 0
        }
      }
      acc[key].transactions += 1
      acc[key].revenue += parseFloat(transaction.total_amount || transaction.line_total || 0)
      return acc
    }, {})

    // Calculate market share within each category
    const categoryTotals = Object.values(brandAnalysis).reduce((acc: any, brand: any) => {
      if (!acc[brand.category]) {
        acc[brand.category] = 0
      }
      acc[brand.category] += brand.revenue
      return acc
    }, {})

    return Object.values(brandAnalysis)
      .map((brand: any) => ({
        ...brand,
        marketShare: categoryTotals[brand.category] > 0 
          ? (brand.revenue / categoryTotals[brand.category] * 100) 
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20) // Top 20 for performance
  }

  const processCampaignPerformance = (campaignData: any[]) => {
    return campaignData.map(campaign => ({
      campaignName: campaign.campaign_name || campaign.campaign_id,
      brandName: campaign.brand_name || 'Unknown',
      cesScore: campaign.ces_score || 0,
      roiMultiplier: campaign.roi_multiplier || 0,
      salesUplift: campaign.sales_uplift_percentage || 0,
      brandAwarenessLift: campaign.brand_awareness_lift || 0,
      year: campaign.year || new Date().getFullYear(),
      quarter: campaign.quarter || 1,
      disruption: campaign.disruption_innovation_score || 0,
      storytelling: campaign.storytelling_quality || 0,
      cultural: campaign.cultural_relevance || 0,
      emotional: campaign.emotional_resonance || 0
    }))
  }

  const calculateKPIs = (silverTransactions: any[], campaigns: any[], goldData: any[] = []) => {
    // Calculate from Silver Layer (128K+ transactions)
    const totalRevenue = silverTransactions.reduce((sum, t) => 
      sum + parseFloat(t.total_amount || t.line_total || 0), 0)
    
    const totalTransactions = silverTransactions.length
    const uniqueCustomers = new Set(silverTransactions
      .map(t => t.customer_id)
      .filter(id => id)).size
    
    const activeStores = new Set(silverTransactions
      .map(t => t.store_id)
      .filter(id => id)).size
    
    const avgTransactionValue = totalRevenue / totalTransactions || 0
    
    // Calculate from Gold Layer brand performance
    const goldRevenue = goldData.reduce((sum, g) => 
      sum + parseFloat(g.total_revenue || 0), 0)
    
    // Calculate campaign performance
    const campaignROI = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.roi_multiplier || 0), 0) / campaigns.length 
      : 0
    
    const avgCesScore = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.ces_score || 0), 0) / campaigns.length
      : 0
    
    return {
      totalRevenue,
      totalTransactions,
      uniqueCustomers,
      avgTransactionValue,
      activeStores,
      marketShare: 15.7, // Based on your validation data
      customerSatisfaction: 4.2, // Placeholder - would come from survey data
      campaignROI,
      goldLayerRevenue: goldRevenue,
      avgCesScore: avgCesScore
    }
  }

  const modules = [
    { id: 'overview', name: 'Executive Overview', icon: Activity },
    { id: 'trends', name: 'Transaction Trends', icon: TrendingUp },
    { id: 'products', name: 'Product Mix', icon: BarChart3 },
    { id: 'behavior', name: 'Consumer Behavior', icon: Users },
    { id: 'profiling', name: 'Consumer Profiling', icon: Target },
    { id: 'geographic', name: 'Geographic Intelligence', icon: MapPin },
    { id: 'competitive', name: 'Competitive Intelligence', icon: Globe },
    { id: 'campaigns', name: 'Campaign Performance', icon: Trophy }
  ]

  const renderKPICards = () => {
    // Track KPI views with PostHog
    posthog.capture('scout_kpi_view', {
      totalRevenue: data.kpis.totalRevenue,
      totalTransactions: data.kpis.totalTransactions,
      module: 'overview'
    })

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Silver Revenue</p>
                <p className="text-xl font-bold">₱{data.kpis.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">128K+ Transactions</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{data.kpis.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Production Data</p>
              </div>
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Transaction</p>
                <p className="text-xl font-bold">₱{data.kpis.avgTransactionValue.toFixed(2)}</p>
                <p className="text-xs text-purple-600">Real-time</p>
              </div>
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Stores</p>
                <p className="text-xl font-bold">{data.kpis.activeStores}</p>
                <p className="text-xs text-indigo-600">Locations</p>
              </div>
              <MapPin className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Campaign ROI</p>
                <p className="text-xl font-bold">{data.kpis.campaignROI.toFixed(1)}x</p>
                <p className="text-xs text-orange-600">16 Campaigns</p>
              </div>
              <Trophy className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CES Score</p>
                <p className="text-xl font-bold">{data.kpis.avgCesScore?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-pink-600">Excellence</p>
              </div>
              <Zap className="h-6 w-6 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'overview':
        return (
          <div className="space-y-6">
            {renderKPICards()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.transactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.productMix.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        label={({ brand, revenue }) => `${brand}: ₱${revenue.toLocaleString()}`}
                      >
                        {data.productMix.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'trends':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.transactionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="transactions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="customers" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'products':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Brand</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.productMix.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="brand" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.productMix.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{product.brand}</p>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₱{product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'behavior':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Consumer Behavior Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={data.consumerBehavior}>
                  <CartesianGrid />
                  <XAxis dataKey="count" name="Frequency" />
                  <YAxis dataKey="avgSpend" name="Average Spend" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Behavior Patterns" dataKey="avgSpend" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'profiling':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.consumerProfiling}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ customerType, count }) => `${customerType}: ${count}`}
                    >
                      {data.consumerProfiling.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demographic Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.consumerProfiling.slice(0, 6).map((profile, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{profile.gender} • {profile.ageBracket}</p>
                        <p className="text-sm text-muted-foreground">{profile.customerType}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₱{profile.avgSpend.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{profile.count} customers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'geographic':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Geographic Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.geographicIntelligence.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'competitive':
        // Track competitive analysis views
        posthog.capture('scout_competitive_view', {
          brandCount: data.competitiveIntelligence.length,
          module: 'competitive'
        })

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Share Analysis</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Based on {data.kpis.totalTransactions.toLocaleString()} transactions
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.competitiveIntelligence.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="marketShare"
                      label={({ brand, marketShare }) => `${brand}: ${marketShare.toFixed(1)}%`}
                    >
                      {data.competitiveIntelligence.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brand Performance Matrix</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Revenue vs Transaction Volume
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      Analysis of {data.competitiveIntelligence.length} brands across multiple categories
                    </AlertDescription>
                  </Alert>
                  {data.competitiveIntelligence.slice(0, 6).map((brand: any, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{brand.brand}</p>
                        <p className="text-sm text-muted-foreground">{brand.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{brand.marketShare.toFixed(1)}% share</Badge>
                        <p className="text-sm text-muted-foreground">₱{brand.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'campaigns':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={data.campaignPerformance}>
                    <CartesianGrid />
                    <XAxis dataKey="cesScore" name="CES Score" />
                    <YAxis dataKey="roiMultiplier" name="ROI Multiplier" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Campaigns" dataKey="roiMultiplier" fill="#ff8042" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.campaignPerformance
                    .sort((a, b) => b.cesScore - a.cesScore)
                    .slice(0, 5)
                    .map((campaign, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{campaign.campaignName}</p>
                        <p className="text-sm text-muted-foreground">{campaign.brandName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">CES: {campaign.cesScore.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">ROI: {campaign.roiMultiplier}x</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <div>Module not found</div>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Scout Analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scout Analytics Platform</h1>
              <p className="text-gray-600">Complete 7-Module Business Intelligence Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="bg-white border-b">
        <div className="px-6">
          <Tabs value={currentModule} onValueChange={(value) => {
            // Track module navigation with PostHog
            posthog.capture('scout_module_navigate', {
              from_module: currentModule,
              to_module: value,
              timestamp: new Date().toISOString()
            })
            setCurrentModule(value)
          }}>
            <TabsList className="grid w-full grid-cols-8">
              {modules.map(module => (
                <TabsTrigger key={module.id} value={module.id} className="flex items-center gap-2">
                  <module.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{module.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {renderModuleContent()}
      </div>
    </div>
  )
}