'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  X
} from 'lucide-react'

interface RecommendationPanelV2Props {
  isOpen: boolean
  onClose: () => void
  context?: any
}

interface Insight {
  type: 'revenue' | 'customer' | 'product' | 'trend' | 'general'
  content: string
  priority: 'high' | 'medium' | 'low'
}

interface Recommendation {
  action: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
}

export function RecommendationPanelV2({ isOpen, onClose, context }: RecommendationPanelV2Props) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchInsights()
    }
  }, [isOpen, context])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      // Import API client
      const { fetchInsights: getInsights } = await import('@/api/insights')
      const data = await getInsights({
        filters: context?.filters,
        context: {
          activeModule: context?.activeModule,
          visibleData: context?.visibleData
        },
        type: 'general'
      })

      setInsights((data.insights.insights || []) as Insight[])
      setRecommendations((data.insights.recommendations || []) as Recommendation[])
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      // Import API client
      const { sendChatMessage: sendMessage } = await import('@/api/chat')
      const aiResponse = await sendMessage(
        [...chatMessages, { role: 'user', content: userMessage }],
        {
          filters: context?.filters,
          activeModule: context?.activeModule,
          visibleData: context?.visibleData
        }
      )

      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <TrendingUp className="w-4 h-4" />
      case 'customer': return <MessageSquare className="w-4 h-4" />
      case 'product': return <AlertCircle className="w-4 h-4" />
      case 'trend': return <Sparkles className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-lg shadow-xl transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } z-50`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="m-4">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="flex-1 p-4 pt-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Key Insights</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchInsights}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-240px)]">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-20" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <Card key={index} className="glass-panel">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getTypeIcon(insight.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{insight.content}</p>
                            <Badge 
                              variant={getPriorityColor(insight.priority) as any}
                              className="mt-2"
                            >
                              {insight.priority} priority
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recommendations" className="flex-1 p-4 pt-0">
            <h3 className="text-sm font-medium mb-4">Recommended Actions</h3>
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="glass-panel">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-2">{rec.action}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          Impact: {rec.impact}
                        </Badge>
                        <Badge variant="outline">
                          Effort: {rec.effort}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-3"
                      >
                        View Details
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col p-4 pt-0">
            <ScrollArea className="flex-1 mb-4 h-[calc(100vh-320px)]">
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ask me about your data!</p>
                    <p className="text-xs mt-1">I can help analyze trends, explain metrics, and suggest improvements.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about your data..."
                className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
                disabled={chatLoading}
              />
              <Button 
                size="sm" 
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
              >
                Send
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}