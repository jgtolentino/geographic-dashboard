// ====================================================================
// SCOUT DASHBOARD GOLD LAYER SERVICE - BUSINESS INTELLIGENCE
// ====================================================================
// Executive-ready, pre-aggregated analytics from Gold layer views
// Optimized for performance and business decision-making
// ====================================================================

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FilterState } from '@/types/scout-dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxzllzyxwpyptfretryc.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'
)

// ====================================================================
// TYPE DEFINITIONS
// ====================================================================

interface ExecutiveKPIs {
  totalRevenue: number
  revenueGrowth: number
  totalTransactions: number
  transactionGrowth: number
  activeStores: number
  activeProducts: number
  activeBrands: number
  avgBasketSize: number
  suggestionAcceptanceRate: number
  avgDwellTime: number
  lastUpdated: string
}

interface RegionalPerformance {
  region: string
  revenue: number
  transactions: number
  stores: number
  avgTransactionValue: number
  uniqueCustomers: number
  acceptanceRate: number
  growth: number
  marketTier: string
  revenueRank: number
}

interface BrandPerformance {
  brandName: string
  companyName: string
  transactions: number
  revenue: number
  storeReach: number
  customerReach: number
  avgTransactionValue: number
  acceptanceRate: number
  weeklyGrowth: number
  revenueRank: number
  engagementLevel: string
}

interface LocationPerformance {
  storeId: string
  storeName: string
  city: string
  transactions: number
  revenue: number
  uniqueCustomers: number
  avgTransactionValue: number
  activeDays: number
  acceptanceRate: number
  valueSegment: string
  volumeSegment: string
  revenueRank: number
  cityRank: number
  locationType: string
  opportunityScore: string
}

interface CustomerSegment {
  customerAge: string
  customerGender: string
  segmentSize: number
  avgTransactionValue: number
  totalRevenue: number
  storesVisited: number
  brandsPurchased: number
  acceptanceRate: number
  avgDwellTime: number
  ageGroupSize: number
  segmentSharePct: number
  revenueRank: number
  customerTier: string
  behaviorSegment: string
}

interface TransactionInsights {
  dailyTrends: Array<{
    transaction_date: string
    transactions: number
    revenue: number
    avg_value: number
    active_stores: number
    unique_customers: number
    acceptance_rate: number
  }>
  hourlyPatterns: Array<{
    hour_of_day: number
    transactions: number
    avg_value: number
    revenue: number
  }>
  categoryBreakdown: Array<{
    product_category: string
    transactions: number
    revenue: number
    avg_value: number
    unique_products: number
  }>
  generatedAt: string
}

interface PredictiveInsights {
  weekStart: string
  transactions: number
  revenue: number
  uniqueCustomers: number
  weeklyGrowthPct: number
  monthlyGrowthPct: number
  avgWeeklyGrowth: number
  avgMonthlyGrowth: number
  growthVolatility: number
  growthTrend: string
  volatilityAssessment: string
  nextWeekProjection: number
  projectionLowerBound: number
  projectionUpperBound: number
}

// ====================================================================
// 1. EXECUTIVE OVERVIEW - GOLD LAYER
// ====================================================================
export function useExecutiveOverview() {
  const [data, setData] = useState<ExecutiveKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: kpis, error: fetchError } = await supabase
        .from('gold.scout_dashboard_executive')
        .select('*')
        .single()

      if (fetchError) throw fetchError

      setData({
        totalRevenue: Math.round(kpis.total_revenue || 0),
        revenueGrowth: Math.round(kpis.revenue_growth_pct || 0),
        totalTransactions: kpis.total_transactions || 0,
        transactionGrowth: Math.round(kpis.transaction_growth_pct || 0),
        activeStores: kpis.active_stores || 0,
        activeProducts: kpis.active_products || 0,
        activeBrands: kpis.active_brands || 0,
        avgBasketSize: Math.round(kpis.avg_transaction_value * 100) / 100 || 0,
        suggestionAcceptanceRate: Math.round(kpis.suggestion_acceptance_pct || 0),
        avgDwellTime: Math.round(kpis.avg_dwell_time || 0),
        lastUpdated: new Date(kpis.last_updated).toISOString()
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch executive KPIs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKPIs()
  }, [fetchKPIs])

  return { data, loading, error, refresh: fetchKPIs }
}

// ====================================================================
// 2. REGIONAL PERFORMANCE - GOLD LAYER
// ====================================================================
export function useRegionalPerformance() {
  const [data, setData] = useState<RegionalPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRegionalData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: regions, error: fetchError } = await supabase
        .from('gold.scout_dashboard_regions')
        .select('*')
        .order('revenue', { ascending: false })

      if (fetchError) throw fetchError

      const regionalData = regions?.map(r => ({
        region: r.region_name,
        revenue: Math.round(r.revenue || 0),
        transactions: r.transactions || 0,
        stores: r.stores || 0,
        avgTransactionValue: Math.round(r.avg_transaction_value * 100) / 100 || 0,
        uniqueCustomers: r.unique_customers || 0,
        acceptanceRate: Math.round(r.acceptance_rate || 0),
        growth: Math.round(r.growth_rate_pct || 0),
        marketTier: r.market_tier,
        revenueRank: r.revenue_rank
      })) || []

      setData(regionalData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch regional data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegionalData()
  }, [fetchRegionalData])

  return { data, loading, error, refresh: fetchRegionalData }
}

// ====================================================================
// 3. TRANSACTION INSIGHTS - GOLD LAYER
// ====================================================================
export function useTransactionInsights() {
  const [data, setData] = useState<TransactionInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: insights, error: fetchError } = await supabase
        .from('gold.scout_dashboard_transactions')
        .select('*')
        .single()

      if (fetchError) throw fetchError

      setData({
        dailyTrends: insights.daily_trends || [],
        hourlyPatterns: insights.hourly_patterns || [],
        categoryBreakdown: insights.category_breakdown || [],
        generatedAt: insights.generated_at
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return { data, loading, error, refresh: fetchInsights }
}

// ====================================================================
// 4. BRAND PERFORMANCE - GOLD LAYER
// ====================================================================
export function useBrandPerformance() {
  const [data, setData] = useState<BrandPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBrandData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: brands, error: fetchError } = await supabase
        .from('gold.scout_dashboard_brands')
        .select('*')
        .order('revenue', { ascending: false })
        .limit(20) // Top 20 brands

      if (fetchError) throw fetchError

      const brandData = brands?.map(b => ({
        brandName: b.brand_name,
        companyName: b.company_name,
        transactions: b.transactions || 0,
        revenue: Math.round(b.revenue || 0),
        storeReach: b.store_reach || 0,
        customerReach: b.customer_reach || 0,
        avgTransactionValue: Math.round(b.avg_transaction_value * 100) / 100 || 0,
        acceptanceRate: Math.round(b.acceptance_rate || 0),
        weeklyGrowth: Math.round(b.weekly_growth_pct || 0),
        revenueRank: b.revenue_rank,
        engagementLevel: b.engagement_level
      })) || []

      setData(brandData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brand performance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrandData()
  }, [fetchBrandData])

  return { data, loading, error, refresh: fetchBrandData }
}

// ====================================================================
// 5. LOCATION INTELLIGENCE - GOLD LAYER
// ====================================================================
export function useLocationIntelligence() {
  const [data, setData] = useState<LocationPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocationData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: locations, error: fetchError } = await supabase
        .from('gold.scout_dashboard_locations')
        .select('*')
        .order('revenue', { ascending: false })
        .limit(50) // Top 50 locations

      if (fetchError) throw fetchError

      const locationData = locations?.map(l => ({
        storeId: l.store_id,
        storeName: l.store_name,
        city: l.city,
        transactions: l.transactions || 0,
        revenue: Math.round(l.revenue || 0),
        uniqueCustomers: l.unique_customers || 0,
        avgTransactionValue: Math.round(l.avg_transaction_value * 100) / 100 || 0,
        activeDays: l.active_days || 0,
        acceptanceRate: Math.round(l.acceptance_rate || 0),
        valueSegment: l.value_segment,
        volumeSegment: l.volume_segment,
        revenueRank: l.revenue_rank,
        cityRank: l.city_rank,
        locationType: l.location_type,
        opportunityScore: l.opportunity_score
      })) || []

      setData(locationData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch location intelligence')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocationData()
  }, [fetchLocationData])

  return { data, loading, error, refresh: fetchLocationData }
}

// ====================================================================
// 6. CUSTOMER SEGMENTATION - GOLD LAYER
// ====================================================================
export function useCustomerSegmentation() {
  const [data, setData] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: customers, error: fetchError } = await supabase
        .from('gold.scout_dashboard_customers')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(30) // Top 30 segments

      if (fetchError) throw fetchError

      const customerData = customers?.map(c => ({
        customerAge: c.customer_age,
        customerGender: c.customer_gender,
        segmentSize: c.segment_size || 0,
        avgTransactionValue: Math.round(c.avg_transaction_value * 100) / 100 || 0,
        totalRevenue: Math.round(c.total_revenue || 0),
        storesVisited: c.stores_visited || 0,
        brandsPurchased: c.brands_purchased || 0,
        acceptanceRate: Math.round(c.acceptance_rate || 0),
        avgDwellTime: Math.round(c.avg_dwell_time || 0),
        ageGroupSize: c.age_group_size || 0,
        segmentSharePct: Math.round(c.segment_share_pct * 10) / 10 || 0,
        revenueRank: c.revenue_rank,
        customerTier: c.customer_tier,
        behaviorSegment: c.behavior_segment
      })) || []

      setData(customerData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer segmentation')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomerData()
  }, [fetchCustomerData])

  return { data, loading, error, refresh: fetchCustomerData }
}

// ====================================================================
// 7. PREDICTIVE INSIGHTS - GOLD LAYER
// ====================================================================
export function usePredictiveInsights() {
  const [data, setData] = useState<PredictiveInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: predictions, error: fetchError } = await supabase
        .from('gold.scout_dashboard_predictions')
        .select('*')
        .single()

      if (fetchError) throw fetchError

      setData({
        weekStart: predictions.week_start,
        transactions: predictions.transactions || 0,
        revenue: Math.round(predictions.revenue || 0),
        uniqueCustomers: predictions.unique_customers || 0,
        weeklyGrowthPct: Math.round(predictions.weekly_growth_pct * 10) / 10 || 0,
        monthlyGrowthPct: Math.round(predictions.monthly_growth_pct * 10) / 10 || 0,
        avgWeeklyGrowth: Math.round(predictions.avg_weekly_growth * 10) / 10 || 0,
        avgMonthlyGrowth: Math.round(predictions.avg_monthly_growth * 10) / 10 || 0,
        growthVolatility: Math.round(predictions.growth_volatility * 10) / 10 || 0,
        growthTrend: predictions.growth_trend,
        volatilityAssessment: predictions.volatility_assessment,
        nextWeekProjection: Math.round(predictions.next_week_projection || 0),
        projectionLowerBound: Math.round(predictions.projection_lower_bound || 0),
        projectionUpperBound: Math.round(predictions.projection_upper_bound || 0)
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictive insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return { data, loading, error, refresh: fetchPredictions }
}

// ====================================================================
// PRODUCT CASCADE FILTERING SYSTEM - RPC FUNCTIONS
// ====================================================================

interface ProductFilterOptions {
  companies: Array<{ company_name: string; brand_count: number; sku_count: number }>
  brands: Array<{ brand_name: string; company_name: string; category_count: number; sku_count: number }>
  categories: Array<{ category_name: string; brand_count: number; sku_count: number }>
  skus: Array<{ sku_name: string; brand_name: string; category_name: string; company_name: string }>
  currentLevel: 'company' | 'brand' | 'category' | 'sku'
}

// Product Cascade Filtering Hook
export function useProductCascadeFilter(sessionId: string, currentSelections: any = {}) {
  const [data, setData] = useState<ProductFilterOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFilterOptions = useCallback(async (selections: any = currentSelections) => {
    try {
      setLoading(true)
      setError(null)

      const { data: filterData, error: fetchError } = await supabase
        .rpc('get_product_filter_options', {
          p_session_id: sessionId,
          p_current_selections: selections
        })

      if (fetchError) throw fetchError

      setData(filterData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchFilterOptions()
  }, [fetchFilterOptions])

  return { 
    data, 
    loading, 
    error, 
    refresh: fetchFilterOptions,
    updateFilters: fetchFilterOptions
  }
}

// Smart Product Recommendations
export function useProductRecommendations(sessionId: string, filters: any = {}) {
  const [data, setData] = useState<Array<{
    sku_name: string
    brand_name: string
    category_name: string
    company_name: string
    recommendation_score: number
    reason: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: recommendations, error: fetchError } = await supabase
        .rpc('get_smart_product_recommendations', {
          p_session_id: sessionId,
          p_filters: filters,
          p_limit: 10
        })

      if (fetchError) throw fetchError

      setData(recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }, [sessionId, filters])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return { data, loading, error, refresh: fetchRecommendations }
}

// Performance Analytics with Filtering
export function useFilteredPerformanceAnalytics(sessionId: string, filters: any = {}) {
  const [data, setData] = useState<{
    totalRevenue: number
    totalTransactions: number
    avgTransactionValue: number
    uniqueCustomers: number
    topPerformingBrands: Array<{ brand_name: string; revenue: number; growth: number }>
    regionalBreakdown: Array<{ region: string; revenue: number; transactions: number }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: analytics, error: fetchError } = await supabase
        .rpc('get_filtered_performance_analytics', {
          p_session_id: sessionId,
          p_filters: filters
        })

      if (fetchError) throw fetchError

      setData(analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [sessionId, filters])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { data, loading, error, refresh: fetchAnalytics }
}

// SUQI Intel Query Integration
export function useSuqiIntelQuery() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = useCallback(async (naturalLanguageQuery: string, sessionId?: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: result, error: queryError } = await supabase.functions.invoke('suqiintel-processor', {
        body: {
          query: naturalLanguageQuery,
          session_id: sessionId || `session_${Date.now()}`,
          context: 'scout_dashboard'
        }
      })

      if (queryError) throw queryError

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute SUQI Intel query'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { executeQuery, loading, error }
}

// ====================================================================
// BUSINESS HEALTH & PERFORMANCE METRICS (Legacy Support)
// ====================================================================
export function useBusinessHealth(filters: FilterState) {
  const executive = useExecutiveOverview()
  const predictions = usePredictiveInsights()
  
  const [data, setData] = useState<{
    overallScore: number
    revenueHealth: number
    customerSatisfaction: number
    alerts: Array<{
      title: string
      description: string
      severity: 'high' | 'medium' | 'low'
    }>
  } | null>(null)
  
  useEffect(() => {
    if (executive.data && predictions.data) {
      // Calculate health scores based on Gold layer data
      const revenueHealth = executive.data.revenueGrowth > 0 ? 95 : 85
      const customerSatisfaction = executive.data.suggestionAcceptanceRate
      const overallScore = Math.round((revenueHealth + customerSatisfaction) / 2)
      
      const alerts = []
      
      // Generate alerts based on insights
      if (predictions.data.volatilityAssessment === 'High Risk') {
        alerts.push({
          title: 'High Revenue Volatility',
          description: `Revenue volatility at ${predictions.data.growthVolatility}% indicates unstable growth patterns`,
          severity: 'high' as const
        })
      }
      
      if (executive.data.activeStores < 20) {
        alerts.push({
          title: 'Limited Store Coverage',
          description: `Only ${executive.data.activeStores} active stores in the network`,
          severity: 'medium' as const
        })
      }
      
      setData({
        overallScore,
        revenueHealth,
        customerSatisfaction,
        alerts
      })
    }
  }, [executive.data, predictions.data])
  
  return { 
    data, 
    loading: executive.loading || predictions.loading,
    error: executive.error || predictions.error,
    refresh: () => {
      executive.refresh()
      predictions.refresh()
    }
  }
}

export function usePerformanceMetrics(filters: FilterState) {
  const executive = useExecutiveOverview()
  
  const [data, setData] = useState<{
    kpis: Array<{
      name: string
      value: string
      change: string
      trend: 'up' | 'down' | 'stable'
    }>
  } | null>(null)
  
  useEffect(() => {
    if (executive.data) {
      const kpis = [
        {
          name: 'Total Revenue',
          value: `₱${(executive.data.totalRevenue / 1000000).toFixed(2)}M`,
          change: `${executive.data.revenueGrowth > 0 ? '+' : ''}${executive.data.revenueGrowth}%`,
          trend: (executive.data.revenueGrowth > 0 ? 'up' : executive.data.revenueGrowth < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
        },
        {
          name: 'Transactions',
          value: executive.data.totalTransactions.toLocaleString(),
          change: `${executive.data.transactionGrowth > 0 ? '+' : ''}${executive.data.transactionGrowth}%`,
          trend: (executive.data.transactionGrowth > 0 ? 'up' : executive.data.transactionGrowth < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
        },
        {
          name: 'Avg Transaction',
          value: `₱${executive.data.avgBasketSize}`,
          change: '0%',
          trend: 'stable' as 'up' | 'down' | 'stable'
        },
        {
          name: 'Active Stores',
          value: executive.data.activeStores.toString(),
          change: '0%',
          trend: 'stable' as 'up' | 'down' | 'stable'
        }
      ]
      
      setData({ kpis })
    }
  }, [executive.data])
  
  return { 
    data, 
    loading: executive.loading,
    error: executive.error,
    refresh: executive.refresh
  }
}

// ====================================================================
// LEGACY HOOKS ADAPTERS (For backward compatibility)
// ====================================================================
export function useTransactionTrends() {
  const insights = useTransactionInsights()
  
  const [data, setData] = useState<{
    dailyData: any[]
    weeklyData: any[]
    monthlyData: any[]
  } | null>(null)
  
  useEffect(() => {
    if (insights.data) {
      // Transform daily trends
      const dailyData = insights.data.dailyTrends.map(d => ({
        date: d.transaction_date,
        revenue: Math.round(d.revenue),
        transactions: d.transactions
      }))
      
      // Generate weekly aggregation from daily data
      const weeklyMap = new Map<string, { revenue: number; transactions: number }>()
      insights.data.dailyTrends.forEach(d => {
        const date = new Date(d.transaction_date)
        const week = `W${Math.floor((date.getDate() - 1) / 7) + 1} ${date.toLocaleDateString('en-US', { month: 'short' })}`
        const existing = weeklyMap.get(week) || { revenue: 0, transactions: 0 }
        weeklyMap.set(week, {
          revenue: existing.revenue + d.revenue,
          transactions: existing.transactions + d.transactions
        })
      })
      
      const weeklyData = Array.from(weeklyMap.entries()).map(([week, data]) => ({
        date: week,
        revenue: Math.round(data.revenue),
        transactions: data.transactions
      }))
      
      setData({ dailyData, weeklyData, monthlyData: [] })
    }
  }, [insights.data])
  
  return { data, loading: insights.loading, error: insights.error, refresh: insights.refresh }
}

export function useProductMix() {
  const insights = useTransactionInsights()
  
  const [data, setData] = useState<{
    totalSKUs: number
    topCategory: string
    topCategoryPercentage: number
    brandsCount: number
    categoryBreakdown: any[]
  } | null>(null)
  
  useEffect(() => {
    if (insights.data && insights.data.categoryBreakdown.length > 0) {
      const topCategory = insights.data.categoryBreakdown[0]
      const totalTransactions = insights.data.categoryBreakdown.reduce((sum, c) => sum + c.transactions, 0)
      
      setData({
        totalSKUs: insights.data.categoryBreakdown.reduce((sum, c) => sum + c.unique_products, 0),
        topCategory: topCategory.product_category,
        topCategoryPercentage: Math.round((topCategory.transactions / totalTransactions) * 100),
        brandsCount: 0, // Would need separate query
        categoryBreakdown: insights.data.categoryBreakdown.map(c => ({
          name: c.product_category,
          value: c.transactions,
          percentage: Math.round((c.transactions / totalTransactions) * 100)
        }))
      })
    }
  }, [insights.data])
  
  return { data, loading: insights.loading, error: insights.error, refresh: insights.refresh }
}

export function useConsumerBehavior() {
  const executive = useExecutiveOverview()
  const insights = useTransactionInsights()
  
  const [data, setData] = useState<{
    brandedRequestsPercentage: number
    suggestionAcceptanceRate: number
    averageDwellTime: number
    repeatCustomerRate: number
    hourlyPatterns: any[]
  } | null>(null)
  
  useEffect(() => {
    if (executive.data && insights.data) {
      setData({
        brandedRequestsPercentage: 65, // Would need separate calculation
        suggestionAcceptanceRate: executive.data.suggestionAcceptanceRate,
        averageDwellTime: executive.data.avgDwellTime,
        repeatCustomerRate: executive.data.suggestionAcceptanceRate, // Using as proxy
        hourlyPatterns: insights.data.hourlyPatterns
      })
    }
  }, [executive.data, insights.data])
  
  return { 
    data, 
    loading: executive.loading || insights.loading,
    error: executive.error || insights.error,
    refresh: () => {
      executive.refresh()
      insights.refresh()
    }
  }
}

export function useConsumerProfiling() {
  const segments = useCustomerSegmentation()
  
  const [data, setData] = useState<{
    newSegments: number
    topAgeGroup: string
    topGender: string
    economicClassDistribution: { [key: string]: number }
    topSegments: any[]
  } | null>(null)
  
  useEffect(() => {
    if (segments.data && segments.data.length > 0) {
      // Find top age group and gender
      const ageGroups = new Map<string, number>()
      const genders = new Map<string, number>()
      
      segments.data.forEach(s => {
        ageGroups.set(s.customerAge, (ageGroups.get(s.customerAge) || 0) + s.segmentSize)
        genders.set(s.customerGender, (genders.get(s.customerGender) || 0) + s.segmentSize)
      })
      
      const topAgeGroup = Array.from(ageGroups.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
      const topGender = Array.from(genders.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
      
      // Calculate economic class distribution based on customer tiers
      const tierCounts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0 }
      segments.data.forEach(s => {
        if (s.customerTier === 'Premium') tierCounts['A'] += s.segmentSize
        else if (s.customerTier === 'Standard') tierCounts['C'] += s.segmentSize
        else tierCounts['E'] += s.segmentSize
      })
      
      const total = Object.values(tierCounts).reduce((sum, count) => sum + count, 0)
      const economicClassDistribution = Object.fromEntries(
        Object.entries(tierCounts).map(([key, count]) => [
          key, Math.round((count / total) * 100)
        ])
      )
      
      setData({
        newSegments: new Set(segments.data.map(s => s.behaviorSegment)).size,
        topAgeGroup,
        topGender,
        economicClassDistribution,
        topSegments: segments.data.slice(0, 5).map(s => ({
          segment: `${s.customerGender} ${s.customerAge}`,
          count: s.segmentSize,
          acceptance: s.acceptanceRate
        }))
      })
    }
  }, [segments.data])
  
  return { data, loading: segments.loading, error: segments.error, refresh: segments.refresh }
}

export function useCategoryMix() {
  const insights = useTransactionInsights()
  
  const [data, setData] = useState<{
    categories: Array<{ name: string; count: number; revenue: number; percentage: number }>
  } | null>(null)
  
  useEffect(() => {
    if (insights.data) {
      const totalTransactions = insights.data.categoryBreakdown.reduce((sum, c) => sum + c.transactions, 0)
      
      setData({
        categories: insights.data.categoryBreakdown.map(c => ({
          name: c.product_category,
          count: c.transactions,
          revenue: c.revenue,
          percentage: Math.round((c.transactions / totalTransactions) * 100)
        }))
      })
    }
  }, [insights.data])
  
  return { data, loading: insights.loading, error: insights.error, refresh: insights.refresh }
}

// Export all hooks for dashboard use
export default {
  // Gold Layer hooks
  useExecutiveOverview,
  useRegionalPerformance,
  useTransactionInsights,
  useBrandPerformance,
  useLocationIntelligence,
  useCustomerSegmentation,
  usePredictiveInsights,
  
  // Product Cascade & SUQI Intel hooks
  useProductCascadeFilter,
  useProductRecommendations,
  useFilteredPerformanceAnalytics,
  useSuqiIntelQuery,
  
  // Legacy compatibility hooks
  useTransactionTrends,
  useProductMix,
  useConsumerBehavior,
  useConsumerProfiling,
  useBusinessHealth,
  usePerformanceMetrics,
  useCategoryMix
}