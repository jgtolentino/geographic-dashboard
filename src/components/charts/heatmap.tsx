'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HeatmapProps {
  data: {
    x: string
    y: string
    value: number
  }[]
  xLabels: string[]
  yLabels: string[]
  title?: string
  colorScale?: {
    min: string
    mid?: string
    max: string
  }
}

export function Heatmap({ 
  data, 
  xLabels, 
  yLabels, 
  title = "Heatmap",
  colorScale = {
    min: '#f3f4f6',
    mid: '#60a5fa',
    max: '#1e40af'
  }
}: HeatmapProps) {
  // Find min/max values for color scaling
  const values = data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue

  const getColor = (value: number) => {
    const normalized = (value - minValue) / range
    
    // Simple linear interpolation
    if (normalized < 0.5 && colorScale.mid) {
      // Interpolate between min and mid
      const t = normalized * 2
      return interpolateColor(colorScale.min, colorScale.mid, t)
    } else if (colorScale.mid) {
      // Interpolate between mid and max
      const t = (normalized - 0.5) * 2
      return interpolateColor(colorScale.mid, colorScale.max, t)
    } else {
      // Direct interpolation between min and max
      return interpolateColor(colorScale.min, colorScale.max, normalized)
    }
  }

  const interpolateColor = (color1: string, color2: string, t: number) => {
    // Simple hex to RGB conversion and interpolation
    const hex2rgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 }
    }

    const c1 = hex2rgb(color1)
    const c2 = hex2rgb(color2)

    const r = Math.round(c1.r + (c2.r - c1.r) * t)
    const g = Math.round(c1.g + (c2.g - c1.g) * t)
    const b = Math.round(c1.b + (c2.b - c1.b) * t)

    return `rgb(${r}, ${g}, ${b})`
  }

  const getValue = (x: string, y: string) => {
    const item = data.find(d => d.x === x && d.y === y)
    return item?.value || 0
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Y-axis labels */}
            <div className="flex">
              <div className="flex flex-col justify-end pr-2">
                {yLabels.map((label) => (
                  <div
                    key={label}
                    className="h-10 flex items-center justify-end text-xs text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div>
                <div className="grid grid-flow-col gap-1">
                  {xLabels.map((xLabel) => (
                    <div key={xLabel} className="space-y-1">
                      {yLabels.map((yLabel) => {
                        const value = getValue(xLabel, yLabel)
                        return (
                          <div
                            key={`${xLabel}-${yLabel}`}
                            className="w-10 h-10 flex items-center justify-center text-xs font-medium rounded transition-all hover:scale-110"
                            style={{
                              backgroundColor: getColor(value),
                              color: value > (maxValue - minValue) / 2 ? 'white' : '#374151'
                            }}
                            title={`${xLabel}, ${yLabel}: ${value}`}
                          >
                            {value}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* X-axis labels */}
                <div className="grid grid-flow-col gap-1 mt-2">
                  {xLabels.map((label) => (
                    <div
                      key={label}
                      className="w-10 text-xs text-muted-foreground text-center truncate"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color scale legend */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <span className="text-xs text-muted-foreground">{minValue}</span>
          <div className="w-48 h-4 rounded" style={{
            background: `linear-gradient(to right, ${colorScale.min}, ${colorScale.mid || colorScale.max}, ${colorScale.max})`
          }} />
          <span className="text-xs text-muted-foreground">{maxValue}</span>
        </div>
      </CardContent>
    </Card>
  )
}