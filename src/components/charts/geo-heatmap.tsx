'use client'

import { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface GeoPoint {
  lat: number
  lng: number
  value: number
  label?: string
}

interface GeoHeatmapProps {
  data: GeoPoint[]
  title?: string
  height?: number
  center?: { lat: number; lng: number }
  zoom?: number
}

export function GeoHeatmap({ 
  data, 
  title = "Geographic Distribution",
  height = 500,
  center = { lat: 14.5995, lng: 120.9842 }, // Manila
  zoom = 11
}: GeoHeatmapProps) {
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

    // Draw base map (simplified representation)
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Convert lat/lng to canvas coordinates
    const latRange = 0.2 // Approximate range for city view
    const lngRange = 0.3
    
    const getCanvasCoords = (lat: number, lng: number) => {
      const x = ((lng - center.lng + lngRange / 2) / lngRange) * canvas.width
      const y = ((center.lat + latRange / 2 - lat) / latRange) * canvas.height
      return { x, y }
    }

    // Find min/max values for color scaling
    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue

    // Draw heat points
    data.forEach(point => {
      const { x, y } = getCanvasCoords(point.lat, point.lng)
      
      // Normalize value for color intensity
      const intensity = (point.value - minValue) / range
      
      // Create radial gradient for heat effect
      const radius = 30 + (intensity * 20)
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      
      // Color based on intensity
      const r = Math.floor(255 * intensity)
      const g = Math.floor(100 * (1 - intensity))
      const b = Math.floor(50)
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.8 * intensity})`)
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.4 * intensity})`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    })

    // Draw location markers
    data.forEach(point => {
      const { x, y } = getCanvasCoords(point.lat, point.lng)
      
      // Draw pin
      ctx.fillStyle = '#1e40af'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw label if provided
      if (point.label) {
        ctx.fillStyle = '#374151'
        ctx.font = '12px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(point.label, x, y - 10)
      }
    })

    // Draw scale legend
    const legendWidth = 200
    const legendHeight = 20
    const legendX = canvas.width - legendWidth - 20
    const legendY = canvas.height - legendHeight - 20
    
    // Gradient legend
    const legendGradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0)
    legendGradient.addColorStop(0, 'rgba(100, 255, 50, 0.8)')
    legendGradient.addColorStop(0.5, 'rgba(255, 155, 50, 0.8)')
    legendGradient.addColorStop(1, 'rgba(255, 100, 50, 0.8)')
    
    ctx.fillStyle = legendGradient
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight)
    
    // Legend labels
    ctx.fillStyle = '#374151'
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(minValue.toString(), legendX, legendY - 5)
    ctx.textAlign = 'right'
    ctx.fillText(maxValue.toString(), legendX + legendWidth, legendY - 5)
    ctx.textAlign = 'center'
    ctx.fillText('Transaction Density', legendX + legendWidth / 2, legendY + legendHeight + 15)

  }, [data, center, zoom, height])

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {data.length} locations
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-border"
          style={{ height: `${height}px` }}
        />
        
        {/* Map Controls (placeholder) */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Zoom In
            </button>
            <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Zoom Out
            </button>
            <button className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90">
              Reset View
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            Click and drag to pan • Scroll to zoom
          </div>
        </div>
      </CardContent>
    </Card>
  )
}