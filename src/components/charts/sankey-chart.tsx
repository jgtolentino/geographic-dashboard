'use client'

import { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SankeyNode {
  id: string
  label: string
  color?: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyChartProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  title?: string
  height?: number
}

export function SankeyChart({ 
  nodes, 
  links, 
  title = "Flow Analysis",
  height = 400 
}: SankeyChartProps) {
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
    const nodeWidth = 20
    const nodePadding = 20
    
    // Calculate node positions
    const nodeGroups: { [key: number]: SankeyNode[] } = {}
    const nodePositions: { [key: string]: { x: number, y: number, height: number } } = {}
    
    // Group nodes by their position (source, middle, target)
    nodes.forEach(node => {
      const isSource = links.some(l => l.source === node.id)
      const isTarget = links.some(l => l.target === node.id)
      
      let group = 1 // middle
      if (isSource && !isTarget) group = 0 // source only
      if (!isSource && isTarget) group = 2 // target only
      
      if (!nodeGroups[group]) nodeGroups[group] = []
      nodeGroups[group].push(node)
    })

    // Calculate positions
    const groupCount = Object.keys(nodeGroups).length
    const groupSpacing = (canvas.width - padding * 2 - nodeWidth * groupCount) / (groupCount - 1)
    
    Object.entries(nodeGroups).forEach(([groupIndex, groupNodes]) => {
      const x = padding + parseInt(groupIndex) * (nodeWidth + groupSpacing)
      const totalHeight = canvas.height - padding * 2
      const nodeHeight = (totalHeight - nodePadding * (groupNodes.length - 1)) / groupNodes.length
      
      groupNodes.forEach((node, index) => {
        const y = padding + index * (nodeHeight + nodePadding)
        nodePositions[node.id] = { x, y, height: nodeHeight }
      })
    })

    // Draw nodes
    Object.entries(nodePositions).forEach(([nodeId, pos]) => {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return
      
      ctx.fillStyle = node.color || '#0ea5e9'
      ctx.fillRect(pos.x, pos.y, nodeWidth, pos.height)
      
      // Draw label
      ctx.fillStyle = '#374151'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(node.label, pos.x + nodeWidth + 10, pos.y + pos.height / 2 + 4)
    })

    // Draw links
    links.forEach(link => {
      const sourcePos = nodePositions[link.source]
      const targetPos = nodePositions[link.target]
      if (!sourcePos || !targetPos) return
      
      // Calculate link thickness based on value
      const maxValue = Math.max(...links.map(l => l.value))
      const thickness = (link.value / maxValue) * 50
      
      // Draw curved path
      ctx.beginPath()
      ctx.moveTo(sourcePos.x + nodeWidth, sourcePos.y + sourcePos.height / 2)
      
      const controlPoint1X = sourcePos.x + nodeWidth + groupSpacing / 3
      const controlPoint2X = targetPos.x - groupSpacing / 3
      const midY = (sourcePos.y + sourcePos.height / 2 + targetPos.y + targetPos.height / 2) / 2
      
      ctx.bezierCurveTo(
        controlPoint1X, sourcePos.y + sourcePos.height / 2,
        controlPoint2X, targetPos.y + targetPos.height / 2,
        targetPos.x, targetPos.y + targetPos.height / 2
      )
      
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)'
      ctx.lineWidth = thickness
      ctx.stroke()
      
      // Draw flow value
      ctx.fillStyle = '#6b7280'
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        link.value.toString(), 
        (sourcePos.x + targetPos.x) / 2, 
        midY - thickness / 2 - 5
      )
    })
  }, [nodes, links, height])

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
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-primary rounded mr-2" />
            <span className="text-muted-foreground">Product Flow</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-2 bg-primary/30 rounded mr-2" />
            <span className="text-muted-foreground">Flow Volume</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}