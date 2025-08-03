import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cxzllzyxwpyptfretryc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'
)

// QA Dashboard Test Component
export function QADashboardTest() {
  const [auditResults, setAuditResults] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    runQAAudit()
  }, [])

  const runQAAudit = async () => {
    setLoading(true)
    const results: any = {}
    
    try {
      // 1. Test Executive Overview Data
      const { data: kpiData, error: kpiError } = await supabase
        .from('silver_transactions_cleaned')
        .select('peso_value, basket_size, store_id')
        .gte('timestamp', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .limit(1000)

      results.executiveOverview = {
        status: kpiError ? 'FAIL' : 'PASS',
        error: kpiError,
        data: {
          sampleRecords: kpiData?.length || 0,
          totalRevenue: kpiData?.reduce((sum, t) => sum + (t.peso_value || 0), 0) || 0,
          avgBasketSize: kpiData?.length ? 
            kpiData.reduce((sum, t) => sum + (t.basket_size || 0), 0) / kpiData.length : 0
        }
      }

      // 2. Test Category Performance RPC
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('get_category_performance')

      results.categoryPerformance = {
        status: categoryError ? 'FAIL' : 'PASS',
        error: categoryError,
        data: {
          categoryCount: categoryData?.length || 0,
          topCategory: categoryData?.[0] || null
        }
      }

      // 3. Test Hourly Pattern RPC
      const { data: hourlyData, error: hourlyError } = await supabase
        .rpc('get_hourly_transaction_pattern')

      results.hourlyPattern = {
        status: hourlyError ? 'FAIL' : 'PASS',
        error: hourlyError,
        data: {
          hoursWithData: hourlyData?.length || 0,
          peakHour: hourlyData?.reduce((max: any, h: any) => 
            h.transaction_count > (max?.transaction_count || 0) ? h : max, hourlyData[0])
        }
      }

      // 4. Test Regional Data
      const { data: regionalData, error: regionalError } = await supabase
        .from('silver_transactions_cleaned')
        .select('location, peso_value')
        .limit(100)

      results.regionalPerformance = {
        status: regionalError ? 'FAIL' : 'PASS',
        error: regionalError,
        data: {
          recordsWithLocation: regionalData?.filter(r => r.location).length || 0,
          sampleLocations: regionalData?.slice(0, 3).map(r => r.location)
        }
      }

      // 5. Test Today's Transactions
      const today = new Date().toISOString().split('T')[0]
      const { data: todayData, error: todayError } = await supabase
        .from('silver_transactions_cleaned')
        .select('id')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)

      results.todayTransactions = {
        status: todayError ? 'FAIL' : 'PASS',
        error: todayError,
        data: {
          count: todayData?.length || 0,
          date: today
        }
      }

      // 6. Test Product Mix
      const { data: productData, error: productError } = await supabase
        .from('silver_transactions_cleaned')
        .select('sku, product_category, brand_name')
        .limit(500)

      const uniqueSKUs = new Set(productData?.map(p => p.sku).filter(Boolean))
      const uniqueBrands = new Set(productData?.map(p => p.brand_name).filter(Boolean))
      const uniqueCategories = new Set(productData?.map(p => p.product_category).filter(Boolean))

      results.productMix = {
        status: productError ? 'FAIL' : 'PASS',
        error: productError,
        data: {
          uniqueSKUs: uniqueSKUs.size,
          uniqueBrands: uniqueBrands.size,
          uniqueCategories: uniqueCategories.size
        }
      }

      // 7. Test Data Freshness
      const { data: freshData, error: freshError } = await supabase
        .from('silver_transactions_cleaned')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)

      results.dataFreshness = {
        status: freshError ? 'FAIL' : 'PASS',
        error: freshError,
        data: {
          latestTransaction: freshData?.[0]?.timestamp,
          daysSinceLastTransaction: freshData?.[0]?.timestamp ? 
            Math.floor((Date.now() - new Date(freshData[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)) : null
        }
      }

      // 8. Test Gold Daily Metrics
      const { data: goldData, error: goldError } = await supabase
        .from('gold_daily_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(7)

      results.goldDailyMetrics = {
        status: goldError ? 'FAIL' : 'PASS',
        error: goldError,
        data: {
          recordCount: goldData?.length || 0,
          latestDate: goldData?.[0]?.metric_date,
          hasRevenue: goldData?.some(g => g.total_revenue > 0)
        }
      }

    } catch (error) {
      console.error('QA Audit Error:', error)
    }

    setAuditResults(results)
    setTimestamp(new Date().toISOString())
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    return status === 'PASS' ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    return status === 'PASS' 
      ? '✅ PASS' 
      : '❌ FAIL'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Scout Dashboard QA Audit</h1>
            <button 
              onClick={runQAAudit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Run Audit
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Last run: {timestamp || 'Never'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(auditResults).map(([key, result]: [string, any]) => (
              <div key={key} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <span className={`font-bold ${getStatusColor(result.status)}`}>
                    {getStatusBadge(result.status)}
                  </span>
                </div>
                
                {result.error && (
                  <div className="mb-4 p-3 bg-red-50 rounded text-red-700 text-sm">
                    Error: {result.error.message}
                  </div>
                )}
                
                <div className="space-y-2">
                  {Object.entries(result.data || {}).map(([dataKey, value]) => (
                    <div key={dataKey} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {dataKey.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-medium text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {Object.values(auditResults).filter((r: any) => r.status === 'PASS').length}
              </p>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {Object.values(auditResults).filter((r: any) => r.status === 'FAIL').length}
              </p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {Object.keys(auditResults).length}
              </p>
              <p className="text-sm text-gray-600">Total Tests</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(
                  (Object.values(auditResults).filter((r: any) => r.status === 'PASS').length / 
                   Object.keys(auditResults).length) * 100
                )}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QADashboardTest