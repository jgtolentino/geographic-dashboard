import { useState, useEffect } from 'react'
import { supabase, SilverTransaction } from '@/lib/supabase'
import { FilterState } from '@/types/scout-dashboard'

export const useSilverTransactions = (filters: FilterState, limit = 1000) => {
  const [data, setData] = useState<SilverTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [filters, limit])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('silver_transactions_cleaned')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(limit)

      // Apply filters
      if (filters.dateRange?.startDate) {
        query = query.gte('transaction_date', filters.dateRange.startDate)
      }
      if (filters.dateRange?.endDate) {
        query = query.lte('transaction_date', filters.dateRange.endDate)
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.brand !== 'all') {
        query = query.eq('brand', filters.brand)
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

  return { data, loading, error, refetch: fetchTransactions }
}

export const useProductMix = (filters: FilterState) => {
  const [productMix, setProductMix] = useState<{
    categories: { name: string; value: number; percentage: number }[]
    brands: { name: string; value: number; percentage: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchProductMix()
  }, [filters])

  const fetchProductMix = async () => {
    try {
      setLoading(true)
      
      // Fetch aggregated data using SQL function or RPC
      const { data, error } = await supabase
        .rpc('get_product_mix_stats', {
          start_date: filters.dateRange?.startDate,
          end_date: filters.dateRange?.endDate,
          store_filter: filters.location === 'all' ? null : filters.location
        })

      if (error) throw error

      if (data) {
        // Process data into categories and brands
        const categories = data.filter((d: any) => d.type === 'category')
          .map((d: any) => ({
            name: d.name,
            value: d.total_revenue,
            percentage: d.percentage
          }))

        const brands = data.filter((d: any) => d.type === 'brand')
          .map((d: any) => ({
            name: d.name,
            value: d.total_revenue,
            percentage: d.percentage
          }))

        setProductMix({ categories, brands })
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { productMix, loading, error, refetch: fetchProductMix }
}

export const useTopSKUs = (filters: FilterState, limit = 20) => {
  const [topSKUs, setTopSKUs] = useState<{
    product_id: string
    product_name: string
    category: string
    brand: string
    total_quantity: number
    total_revenue: number
    transaction_count: number
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchTopSKUs()
  }, [filters, limit])

  const fetchTopSKUs = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_top_skus', {
          start_date: filters.dateRange?.startDate,
          end_date: filters.dateRange?.endDate,
          category_filter: filters.category === 'all' ? null : filters.category,
          brand_filter: filters.brand === 'all' ? null : filters.brand,
          result_limit: limit
        })

      if (error) throw error
      setTopSKUs(data || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { topSKUs, loading, error, refetch: fetchTopSKUs }
}