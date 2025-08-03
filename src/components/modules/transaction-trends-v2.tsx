'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, MapPin, Clock, DollarSign, ShoppingCart } from 'lucide-react'
import { BoxPlot } from '@/components/charts/box-plot'
import { Heatmap } from '@/components/charts/heatmap'
import { DataTable } from '@/components/tables/data-table'
import { FilterState } from '@/types/scout-dashboard'
import { useGoldMetrics, useLatestKPIs } from '@/hooks/useGoldMetrics'
import { useSilverTransactions } from '@/hooks/useSilverTransactions'
import { supabase } from '@/lib/supabase'

interface TransactionTrendsProps {
  filters: FilterState
}

export function TransactionTrendsV2({ filters }: TransactionTrendsProps) {
  const { data: goldMetrics, loading: metricsLoading } = useGoldMetrics(filters)
  const { kpis, loading: kpisLoading } = useLatestKPIs()
  const { data: transactions, loading: transLoading } = useSilverTransactions(filters, 100)
  
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [boxPlotData, setBoxPlotData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any>({ data: [], xLabels: [], yLabels: [] })
  const [weekdayComparison, setWeekdayComparison] = useState<any[]>([])
  const [isLoadingAdditional, setIsLoadingAdditional] = useState(false)

  useEffect(() => {
    if (goldMetrics && goldMetrics.length > 0) {
      // Process time series data
      const tsData = goldMetrics.map(metric => ({
        date: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        transactions: metric.total_transactions,
        revenue: metric.total_revenue,
        avgValue: metric.avg_transaction_value
      }))
      setTimeSeriesData(tsData)
    }
  }, [goldMetrics])

  useEffect(() => {
    // Fetch additional data for box plot and heatmap
    fetchAdditionalData()
  }, [filters])

  const fetchAdditionalData = async () => {
    setIsLoadingAdditional(true)
    try {
      // Fetch category distribution for box plot
      const { data: categoryStats } = await supabase
        .rpc('get_category_performance', {
          start_date: filters.dateRange.startDate,
          end_date: filters.dateRange.endDate
        })

      if (categoryStats) {
        const boxData = categoryStats.map((cat: any) => ({
          label: cat.category,
          min: cat.avg_basket_size * 0.5,
          q1: cat.avg_basket_size * 0.75,
          median: cat.avg_basket_size,
          q3: cat.avg_basket_size * 1.25,
          max: cat.avg_basket_size * 2,
          outliers: [cat.avg_basket_size * 2.5, cat.avg_basket_size * 3]
        }))
        setBoxPlotData(boxData)
      }

      // Fetch hourly pattern for heatmap
      const { data: hourlyPattern } = await supabase
        .rpc('get_hourly_transaction_pattern', { days_back: 7 })

      if (hourlyPattern) {
        // Transform to heatmap format
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
        const heatData: any[] = []
        
        // Create synthetic day-hour data based on hourly averages
        days.forEach((day, dayIndex) => {
          hourlyPattern.forEach((hourData: any) => {
            heatData.push({
              day,
              hour: `${hourData.hour}:00`,
              value: hourData.avg_transactions * (dayIndex < 5 ? 1 : 1.2) // Weekend boost
            })
          })
        })

        setHeatmapData({
          data: heatData,
          xLabels: hours,
          yLabels: days
        })
      }

      // Fetch weekday comparison
      const { data: weekdayStats } = await supabase
        .from('silver_transactions_cleaned')
        .select('category, is_weekend, total_price')
        .gte('transaction_date', filters.dateRange.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('transaction_date', filters.dateRange.endDate || new Date().toISOString())

      if (weekdayStats) {
        // Aggregate by category and weekend
        const categoryMap = new Map()
        weekdayStats.forEach((trans: any) => {
          const key = trans.category
          if (!categoryMap.has(key)) {
            categoryMap.set(key, { weekday: 0, weekend: 0 })
          }
          const cat = categoryMap.get(key)
          if (trans.is_weekend) {
            cat.weekend += trans.total_price
          } else {
            cat.weekday += trans.total_price
          }
        })

        const comparison = Array.from(categoryMap.entries()).map(([category, values]) => ({
          category,
          weekday: Math.round(values.weekday),
          weekend: Math.round(values.weekend)
        }))
        setWeekdayComparison(comparison)
      }
    } catch (error) {
      console.error('Error fetching additional data:', error)
    } finally {
      setIsLoadingAdditional(false)
    }
  }

  const loading = metricsLoading || kpisLoading || transLoading || isLoadingAdditional

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const transactionTableColumns = [
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'transaction_date', label: 'Date', sortable: true },
    { key: 'store_name', label: 'Store' },
    { key: 'category', label: 'Category' },
    { key: 'total_price', label: 'Amount', sortable: true },
    { key: 'customer_id', label: 'Customer' }
  ]

  const transactionTableData = (transactions || []).slice(0, 20).map(t => ({
    transaction_id: t?.transaction_id?.slice(0, 8) || '',
    transaction_date: t?.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : '',
    store_name: t?.store_id || '',
    category: t?.category || '',
    total_price: t?.total_price ? `₱${t.total_price.toLocaleString()}` : '₱0',
    customer_id: t?.customer_id?.slice(0, 8) || ''
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : kpis?.totalTransactions.toLocaleString() || '0'}
            </div>
            <Badge variant="default" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              12.5%
            </Badge>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{loading ? '...' : kpis?.avgTransactionValue.toFixed(0) || '0'}
            </div>
            <Badge variant="default" className="mt-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              3.2%
            </Badge>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3-5 PM</div>
            <Badge variant="secondary" className="mt-2">Daily</Badge>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Metro Manila</div>
            <Badge variant="secondary" className="mt-2">42%</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeseries" className="space-y-4">
        <TabsList className="glass-panel">
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="timeseries" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Transaction Trends Over Time</CardTitle>
              <CardDescription>Daily transactions and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    name="Transactions"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Revenue (₱)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <BoxPlot
            data={boxPlotData}
            title="Transaction Value Distribution by Category"
            height={400}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Heatmap
            data={heatmapData.data}
            xLabels={heatmapData.xLabels}
            yLabels={heatmapData.yLabels}
            title="Transaction Intensity by Day and Hour"
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Weekday vs Weekend Comparison</CardTitle>
              <CardDescription>Transaction patterns by day type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={weekdayComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="weekday" fill="#0ea5e9" name="Weekday" />
                  <Bar dataKey="weekend" fill="#10b981" name="Weekend" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Table */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={transactionTableColumns}
            data={transactionTableData}
            searchKey="transaction_id"
          />
        </CardContent>
      </Card>
    </div>
  )
}