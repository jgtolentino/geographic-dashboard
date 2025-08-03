// ====================================================================
// 🧠 SCOUT ANALYTICS AI INSIGHTS HOOKS
// ====================================================================
// React hooks for AI insights, alerts, and predictive analytics
// Production-ready integration with Supabase backend
// ====================================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ====================================================================
// TYPE DEFINITIONS
// ====================================================================

export interface AIInsight {
  id: string
  insight_type: 'trend' | 'anomaly' | 'prediction' | 'recommendation'
  title: string
  description: string
  confidence_score: number // 0.00 to 1.00
  impact_score: number // 0.00 to 1.00
  business_domain: 'sales' | 'marketing' | 'operations' | 'finance'
  entities: Record<string, any>
  metrics: Record<string, any>
  recommendations: string[]
  generated_by: string
  status: 'active' | 'acknowledged' | 'acted_upon' | 'expired'
  created_at: string
  valid_from: string
  valid_to?: string
}

export interface BusinessAlert {
  id: string
  alert_type: 'threshold' | 'anomaly' | 'trend' | 'opportunity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  affected_entities: Record<string, any>
  metric_values: Record<string, any>
  trigger_conditions: Record<string, any>
  recommended_actions: string[]
  assigned_to?: string
  acknowledged_at?: string
  resolved_at?: string
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  created_at: string
}

export interface CustomerSegment {
  id: string
  segment_name: string
  segment_description: string
  customer_count: number
  avg_recency_days: number
  avg_frequency: number
  avg_monetary_value: number
  segment_characteristics: Record<string, any>
  recommended_actions: string[]
  calculated_at: string
  valid_from: string
  valid_to?: string
}

// ====================================================================
// AI INSIGHTS HOOK
// ====================================================================

export function useAIInsights(filters?: {
  business_domain?: string
  insight_type?: string
  limit?: number
}) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('ai_insights.ai_insights')
        .select('*')
        .eq('status', 'active')
        .order('impact_score', { ascending: false })
        .order('confidence_score', { ascending: false })

      // Apply filters
      if (filters?.business_domain) {
        query = query.eq('business_domain', filters.business_domain)
      }
      if (filters?.insight_type) {
        query = query.eq('insight_type', filters.insight_type)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      } else {
        query = query.limit(10)
      }

      const { data, error } = await query

      if (error) throw error
      setInsights(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI insights')
      console.error('AI Insights fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const acknowledgeInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights.ai_insights')
        .update({ status: 'acknowledged' })
        .eq('id', insightId)

      if (error) throw error
      await fetchInsights() // Refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge insight')
    }
  }

  const markInsightActedUpon = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights.ai_insights')
        .update({ status: 'acted_upon' })
        .eq('id', insightId)

      if (error) throw error
      await fetchInsights() // Refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark insight as acted upon')
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return {
    insights,
    loading,
    error,
    refresh: fetchInsights,
    acknowledgeInsight,
    markInsightActedUpon
  }
}