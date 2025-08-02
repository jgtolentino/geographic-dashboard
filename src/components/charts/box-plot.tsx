'use client'

import { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BoxPlotProps {
  data: {
    label: string
    min: number
    q1: number
    median: number
    q3: number
    max: number
    outliers?: number[]
  }[]
  title?: string
  height?: number
}

export function BoxPlot({ data, title = "Box Plot", height = 300 }: BoxPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 40
    const boxWidth = 40
    const availableWidth = canvas.width - (padding * 2)
    const boxSpacing = availableWidth / data.length

    // Find min/max values for scaling
    const allValues = data.flatMap(d => [d.min, d.max, ...(d.outliers || [])])
    const minValue = Math.min(...allValues)
    const maxValue = Math.max(...allValues)
    const valueRange = maxValue - minValue

    // Draw each box plot
    data.forEach((item, index) => {
      const x = padding + (index * boxSpacing) + (boxSpacing / 2)
      const scale = (height - padding * 2) / valueRange
      
      const yMin = height - padding - ((item.min - minValue) * scale)
      const yQ1 = height - padding - ((item.q1 - minValue) * scale)
      const yMedian = height - padding - ((item.median - minValue) * scale)
      const yQ3 = height - padding - ((item.q3 - minValue) * scale)
      const yMax = height - padding - ((item.max - minValue) * scale)

      // Draw whiskers
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, yMin)
      ctx.lineTo(x, yQ1)
      ctx.moveTo(x, yQ3)
      ctx.lineTo(x, yMax)
      ctx.stroke()

      // Draw whisker caps
      ctx.beginPath()
      ctx.moveTo(x - 10, yMin)
      ctx.lineTo(x + 10, yMin)
      ctx.moveTo(x - 10, yMax)
      ctx.lineTo(x + 10, yMax)
      ctx.stroke()

      // Draw box
      ctx.fillStyle = '#0ea5e9'
      ctx.fillRect(x - boxWidth/2, yQ3, boxWidth, yQ1 - yQ3)
      ctx.strokeStyle = '#0284c7'
      ctx.lineWidth = 2
      ctx.strokeRect(x - boxWidth/2, yQ3, boxWidth, yQ1 - yQ3)

      // Draw median line
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x - boxWidth/2, yMedian)
      ctx.lineTo(x + boxWidth/2, yMedian)
      ctx.stroke()

      // Draw outliers
      if (item.outliers) {
        ctx.fillStyle = '#ef4444'
        item.outliers.forEach(outlier => {
          const yOutlier = height - padding - ((outlier - minValue) * scale)
          ctx.beginPath()
          ctx.arc(x, yOutlier, 3, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Draw label
      ctx.fillStyle = '#374151'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(item.label, x, height - 10)
    })

    // Draw y-axis
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange * i / 5)
      const y = height - padding - ((value - minValue) * scale)
      ctx.fillText(value.toFixed(0), padding - 10, y + 4)
    }
  }, [data, height])

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: `${height}px` }}
        />
      </CardContent>
    </Card>
  )
}