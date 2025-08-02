'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ParetoChartProps {
  data: {
    name: string
    value: number
  }[]
  title?: string
  valueLabel?: string
}

export function ParetoChart({ 
  data, 
  title = "Pareto Analysis",
  valueLabel = "Value"
}: ParetoChartProps) {
  // Sort data by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  
  // Calculate cumulative percentage
  const total = sortedData.reduce((sum, item) => sum + item.value, 0)
  let cumulative = 0
  
  const chartData = sortedData.map((item) => {
    cumulative += item.value
    const cumulativePercentage = (cumulative / total) * 100
    return {
      ...item,
      percentage: (item.value / total) * 100,
      cumulative: cumulativePercentage
    }
  })

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: valueLabel, angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'cumulative') return `${value.toFixed(1)}%`
                return value.toLocaleString()
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="value" 
              fill="#0ea5e9" 
              name={valueLabel}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#dc2626', r: 4 }}
              name="Cumulative %"
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* 80/20 Rule Indicator */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">80/20 Analysis:</span> {' '}
            {chartData.findIndex(item => item.cumulative >= 80) + 1} items 
            ({((chartData.findIndex(item => item.cumulative >= 80) + 1) / chartData.length * 100).toFixed(0)}%) 
            account for 80% of total {valueLabel.toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}