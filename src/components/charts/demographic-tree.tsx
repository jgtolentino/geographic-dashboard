'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Users } from 'lucide-react'

interface DemographicNode {
  name: string
  value: number
  percentage?: number
  children?: DemographicNode[]
  color?: string
}

interface DemographicTreeProps {
  data: DemographicNode
  title?: string
}

function TreeNode({ node, depth = 0, totalValue }: { node: DemographicNode; depth: number; totalValue: number }) {
  const percentage = node.percentage || ((node.value / totalValue) * 100)
  const hasChildren = node.children && node.children.length > 0
  
  const getNodeColor = (depth: number) => {
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    return colors[depth % colors.length]
  }

  return (
    <div className={depth > 0 ? 'ml-6 mt-2' : ''}>
      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        {hasChildren && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        {!hasChildren && (
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: node.color || getNodeColor(depth) }} />
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{node.name}</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold">{node.value.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: node.color || getNodeColor(depth)
              }}
            />
          </div>
        </div>
      </div>
      
      {hasChildren && (
        <div className="border-l border-border ml-2">
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${child.name}-${index}`}
              node={child}
              depth={depth + 1}
              totalValue={totalValue}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DemographicTree({ data, title = "Demographic Breakdown" }: DemographicTreeProps) {
  const calculateTotal = (node: DemographicNode): number => {
    if (!node.children || node.children.length === 0) return node.value
    return node.children.reduce((sum, child) => sum + calculateTotal(child), 0)
  }

  const totalValue = calculateTotal(data)

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            Total: {totalValue.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TreeNode node={data} depth={0} totalValue={totalValue} />
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Color Legend</p>
          <div className="flex flex-wrap gap-3">
            {['Age Groups', 'Gender', 'Location', 'Income', 'Education'].map((label, index) => {
              const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
              return (
                <div key={label} className="flex items-center text-xs">
                  <div 
                    className="w-3 h-3 rounded-full mr-1" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}