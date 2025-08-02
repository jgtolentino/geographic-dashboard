'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react'
import { AIRecommendation } from '@/types/scout-dashboard'

interface RecommendationPanelProps {
  module: string
  context?: any
  isCollapsed?: boolean
  onToggle?: () => void
}

export function RecommendationPanel({ 
  module, 
  context,
  isCollapsed = false,
  onToggle
}: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isMinimized, setIsMinimized] = useState(false)

  // Simulate AI recommendations based on module
  useEffect(() => {
    const mockRecommendations: AIRecommendation[] = [
      {
        id: '1',
        type: 'insight',
        title: 'Peak Transaction Time Detected',
        description: 'Transactions peak between 3-5 PM in Metro Manila. Consider increasing inventory during these hours.',
        module: 'transaction-trends',
        confidence: 0.92,
        timestamp: new Date(),
        actionable: {
          label: 'View Details',
          action: () => console.log('View peak times')
        }
      },
      {
        id: '2',
        type: 'action',
        title: 'SKU Substitution Pattern',
        description: 'Brand A shampoo is frequently substituted with Brand B (78% of cases). Stock both together.',
        module: 'product-mix',
        confidence: 0.85,
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'warning',
        title: 'Low Acceptance Rate',
        description: 'Store suggestions have 23% acceptance rate in Barangay X. Consider training intervention.',
        module: 'consumer-behavior',
        confidence: 0.79,
        timestamp: new Date()
      }
    ]

    // Filter recommendations by current module
    const filtered = module === 'home' 
      ? mockRecommendations 
      : mockRecommendations.filter(r => r.module === module)
    
    setRecommendations(filtered)
  }, [module])

  const getIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'insight': return Lightbulb
      case 'action': return TrendingUp
      case 'warning': return AlertCircle
    }
  }

  const getTypeColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'insight': return 'bg-blue-100 text-blue-800'
      case 'action': return 'bg-emerald-100 text-emerald-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (isCollapsed) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          onClick={onToggle}
          className="rounded-full h-14 w-14 bg-gradient-to-r from-azure-blue to-azure-blueDark shadow-elevation-3"
        >
          <Brain className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-azure-blue/20 to-azure-blueDark/20 rounded-lg">
              <Brain className="h-5 w-5 text-azure-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {recommendations.length} recommendations
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {recommendations.map((rec) => {
          const Icon = getIcon(rec.type)
          return (
            <Card key={rec.id} className="glass-panel hover:shadow-elevation-2 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className={getTypeColor(rec.type)}>
                      {rec.type}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(rec.confidence * 100)}% confidence
                  </Badge>
                </div>
                <CardTitle className="text-sm mt-2">{rec.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {rec.description}
                </CardDescription>
                {rec.actionable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full justify-between"
                    onClick={rec.actionable.action}
                  >
                    <span>{rec.actionable.label}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
        <Button variant="default" className="w-full bg-gradient-to-r from-azure-blue to-azure-blueDark">
          <Brain className="h-4 w-4 mr-2" />
          Ask AI Assistant
        </Button>
      </div>
    </div>
  )
}