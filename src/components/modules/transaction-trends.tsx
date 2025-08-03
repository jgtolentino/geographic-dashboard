'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BoxPlot } from '@/components/charts/box-plot'
import { Heatmap } from '@/components/charts/heatmap'
import { FilterState } from '@/types/scout-dashboard'
import { TrendingUp, TrendingDown, Clock, MapPin, DollarSign, Package } from 'lucide-react'

interface TransactionTrendsProps {
  filters: FilterState
}

// Mock data generation
const generateTimeSeriesData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return hours.map(hour => ({
    hour: `${hour}:00`,
    volume: Math.floor(Math.random() * 1000) + 200,
    value: Math.floor(Math.random() * 50000) + 10000,
    avgDuration: Math.floor(Math.random() * 300) + 60,
  }))
}

const generateBoxPlotData = () => {
  const categories = ['Beverages', 'Snacks', 'Personal Care', 'Household', 'Tobacco']
  return categories.map(cat => {
    // Generate values in ascending order to ensure valid box plot
    const min = 20 + Math.random() * 30 // 20-50
    const q1 = min + 50 + Math.random() * 50 // min+50 to min+100
    const median = q1 + 30 + Math.random() * 40 // q1+30 to q1+70
    const q3 = median + 30 + Math.random() * 40 // median+30 to median+70
    const max = q3 + 50 + Math.random() * 100 // q3+50 to q3+150
    const outliers = [max + 50 + Math.random() * 50, max + 120 + Math.random() * 50]
    
    return {
      label: cat,
      min,
      q1,
      median,
      q3,
      max,
      outliers
    }
  })
}

const generateHeatmapData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm']
  const data: any[] = []
  
  days.forEach(day => {
    hours.forEach(hour => {
      data.push({
        x: hour,
        y: day,
        value: Math.floor(Math.random() * 100)
      })
    })
  })
  
  return { data, xLabels: hours, yLabels: days }
}

export function TransactionTrends({ filters }: TransactionTrendsProps) {
  const [activeView, setActiveView] = useState('overview')
  const timeSeriesData = generateTimeSeriesData()
  const boxPlotData = generateBoxPlotData()
  const heatmapData = generateHeatmapData()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Transaction Trends</h2>
        <p className="text-muted-foreground">
          Analyze transaction patterns across time, location, and categories
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">15,842</div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                12.5%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Average Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">₱245</div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <TrendingDown className="h-3 w-3 mr-1" />
                3.2%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Peak Hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">3-5 PM</div>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Daily
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top Location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">Metro Manila</div>
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                42%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Time Series</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Transaction Volume Over Time</CardTitle>
              <CardDescription>Hourly transaction patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="volume"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    name="Transaction Volume"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Total Value (₱)"
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
              <CardTitle>Week vs Weekend Comparison</CardTitle>
              <CardDescription>Transaction patterns by day type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[
                  { category: 'Beverages', weekday: 2400, weekend: 3200 },
                  { category: 'Snacks', weekday: 1800, weekend: 2800 },
                  { category: 'Personal Care', weekday: 1200, weekend: 800 },
                  { category: 'Household', weekday: 900, weekend: 1100 },
                  { category: 'Tobacco', weekday: 600, weekend: 900 },
                ]}>
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

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Units per Transaction</CardTitle>
            <CardDescription>Average basket size over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { range: '1 item', count: 3421 },
                { range: '2 items', count: 4532 },
                { range: '3 items', count: 3214 },
                { range: '4-5 items', count: 2876 },
                { range: '6+ items', count: 1799 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Transaction Duration</CardTitle>
            <CardDescription>Average time spent per transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgDuration"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Duration (seconds)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}