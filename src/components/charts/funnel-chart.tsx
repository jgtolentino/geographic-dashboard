'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FunnelStage {
  name: string
  value: number
  color?: string
}

interface FunnelChartProps {
  data: FunnelStage[]
  title?: string
  showPercentages?: boolean
}

export function FunnelChart({ 
  data, 
  title = "Funnel Analysis",
  showPercentages = true
}: FunnelChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  const getConversionRate = (index: number) => {
    if (index === 0) return 100
    return (data[index].value / data[0].value) * 100
  }
  
  const getDropoffRate = (index: number) => {
    if (index === 0) return 0
    return ((data[index - 1].value - data[index].value) / data[index - 1].value) * 100
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100
            const conversionRate = getConversionRate(index)
            const dropoffRate = getDropoffRate(index)
            
            return (
              <div key={stage.name} className="space-y-2">
                {/* Funnel Stage */}
                <div className="relative">
                  <div
                    className="h-16 flex items-center justify-between px-4 rounded transition-all hover:scale-[1.02]"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: stage.color || `hsl(199, 89%, ${50 + index * 10}%)`,
                      marginLeft: `${(100 - widthPercentage) / 2}%`
                    }}
                  >
                    <span className="text-sm font-medium text-white">
                      {stage.name}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Conversion Rate */}
                  {showPercentages && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full">
                      <Badge variant="outline" className="text-xs">
                        {conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Dropoff Indicator */}
                {index < data.length - 1 && dropoffRate > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 5v10m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{dropoffRate.toFixed(1)}% drop-off</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Conversion</p>
            <p className="text-lg font-semibold">
              {((data[data.length - 1].value / data[0].value) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Drop-off</p>
            <p className="text-lg font-semibold">
              {(data.slice(1).reduce((sum, _, i) => sum + getDropoffRate(i + 1), 0) / (data.length - 1)).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stages</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}