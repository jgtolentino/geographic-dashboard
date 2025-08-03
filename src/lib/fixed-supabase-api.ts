import { createClient } from '@supabase/supabase-js'

// FIXED: Complete API key with signature
const supabaseUrl = 'https://cxzllzyxwpyptfretryc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'

export const supabaseFixed = createClient(supabaseUrl, supabaseKey)

// FIXED API CALLS

/**
 * Get Silver Transactions with correct schema reference
 * Fixes: 404 table not found error
 */
export async function getSilverTransactions(startDate: string, endDate: string, limit = 100) {
  try {
    const { data, error } = await supabaseFixed
      .from('silver_transactions_cleaned') // This works with the view in public schema
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Silver transactions error:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: err }
  }
}

/**
 * Get Gold Daily Metrics with correct column name
 * Fixes: 400 bad request - column 'date' does not exist
 */
export async function getGoldDailyMetrics(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabaseFixed
      .from('gold_daily_metrics')
      .select('*')
      .gte('metric_date', startDate) // FIXED: Use metric_date not date
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: false })

    if (error) {
      console.error('Gold metrics error:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: err }
  }
}

/**
 * Get Latest KPIs (last 7 days)
 * Fixes: 400 bad request and defensive coding
 */
export async function getLatestKPIs() {
  try {
    const { data, error } = await supabaseFixed
      .from('gold_daily_metrics')
      .select('*')
      .order('metric_date', { ascending: false }) // FIXED: Use metric_date
      .limit(7)

    if (error) {
      console.error('KPI error:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: err }
  }
}

/**
 * RPC: Get Category Performance
 * Fixes: 404 RPC not found (was auth issue)
 */
export async function getCategoryPerformance() {
  try {
    const { data, error } = await supabaseFixed
      .rpc('get_category_performance')

    if (error) {
      console.error('Category performance error:', error)
      return { data: [], error }
    }

    // Defensive: ensure data is array
    return { data: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: err }
  }
}

/**
 * RPC: Get Hourly Transaction Pattern
 * Fixes: 404 RPC not found (was auth issue)
 */
export async function getHourlyTransactionPattern() {
  try {
    const { data, error } = await supabaseFixed
      .rpc('get_hourly_transaction_pattern')

    if (error) {
      console.error('Hourly pattern error:', error)
      return { data: [], error }
    }

    // Defensive: ensure data is array
    return { data: Array.isArray(data) ? data : [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: err }
  }
}

/**
 * Get all dashboard data in one call
 * Handles all errors gracefully
 */
export async function getDashboardData(startDate: string, endDate: string) {
  const [
    goldMetrics,
    silverTransactions,
    categoryPerformance,
    hourlyPattern,
    latestKPIs
  ] = await Promise.all([
    getGoldDailyMetrics(startDate, endDate),
    getSilverTransactions(startDate, endDate),
    getCategoryPerformance(),
    getHourlyTransactionPattern(),
    getLatestKPIs()
  ])

  return {
    goldMetrics,
    silverTransactions,
    categoryPerformance,
    hourlyPattern,
    latestKPIs
  }
}

/**
 * Helper: Safe data processing with defensive coding
 */
export function processChartData(data: any[], slice?: number) {
  // FIXED: Defensive coding to prevent TypeError
  const safeData = data || []
  const slicedData = slice ? safeData.slice(0, slice) : safeData

  return slicedData.map((item: any) => ({
    name: item?.category || item?.name || 'Unknown',
    value: item?.total_sales || item?.value || 0,
    count: item?.transaction_count || item?.count || 0
  }))
}

/**
 * Helper: Format currency safely
 */
export function formatCurrency(value: any): string {
  const num = Number(value) || 0
  return `₱${num.toLocaleString()}`
}

/**
 * Helper: Safe date formatting
 */
export function formatDate(date: any): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return ''
  }
}