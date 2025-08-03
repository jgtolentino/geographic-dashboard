import { useState, useEffect } from 'react'
import { supabase, GoldDailyMetrics } from '@/lib/supabase'
import { FilterState } from '@/types/scout-dashboard'

export const useGoldMetrics = (filters: FilterState) => {
  const [data, setData] = useState<GoldDailyMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchGoldMetrics()
  }, [filters])

  const fetchGoldMetrics = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('gold_daily_metrics')
        .select('*')
        .order('metric_date', { ascending: false })

      // Apply filters
      if (filters.dateRange.startDate) {
        query = query.gte('metric_date', filters.dateRange.startDate)
      }
      if (filters.dateRange.endDate) {
        query = query.lte('metric_date', filters.dateRange.endDate)
      }
      if (filters.location !== 'all') {
        query = query.eq('store_name', filters.location)
      }

      const { data, error } = await query

      if (error) throw error
      setData(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchGoldMetrics }
}

export const useLatestKPIs = () => {
  const [kpis, setKpis] = useState<{
    totalTransactions: number
    totalRevenue: number
    avgTransactionValue: number
    uniqueCustomers: number
    topCategory: string
    topBrand: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchLatestKPIs()
  }, [])

  const fetchLatestKPIs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('gold_daily_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(7) // Last 7 days

      if (error) throw error

      if (data && data.length > 0) {
        // Aggregate last 7 days
        const aggregated = data.reduce((acc, row) => ({
          totalTransactions: acc.totalTransactions + row.total_transactions,
          totalRevenue: acc.totalRevenue + row.total_revenue,
          uniqueCustomers: acc.uniqueCustomers + row.unique_customers,
          categories: [...acc.categories, row.top_category],
          brands: [...acc.brands, row.top_brand]
        }), {
          totalTransactions: 0,
          totalRevenue: 0,
          uniqueCustomers: 0,
          categories: [] as string[],
          brands: [] as string[]
        })

        // Find most common category and brand
        const topCategory = getMostFrequent(aggregated.categories)
        const topBrand = getMostFrequent(aggregated.brands)

        setKpis({
          totalTransactions: aggregated.totalTransactions,
          totalRevenue: aggregated.totalRevenue,
          avgTransactionValue: aggregated.totalRevenue / aggregated.totalTransactions,
          uniqueCustomers: aggregated.uniqueCustomers,
          topCategory,
          topBrand
        })
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const getMostFrequent = (arr: string[]): string => {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0] || ''
  }

  return { kpis, loading, error, refetch: fetchLatestKPIs }
}