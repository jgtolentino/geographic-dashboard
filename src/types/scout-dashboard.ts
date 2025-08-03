// Scout Dashboard Type Definitions - Canonical Requirements

export interface ScoutDashboardModule {
  id: string
  name: string
  icon?: string
  route: string
}

export const DASHBOARD_MODULES: ScoutDashboardModule[] = [
  { id: 'transaction-trends', name: 'Transaction Trends', route: '/transaction-trends' },
  { id: 'product-mix', name: 'Product Mix & SKU Info', route: '/product-mix' },
  { id: 'consumer-behavior', name: 'Consumer Behavior & Preference Signals', route: '/consumer-behavior' },
  { id: 'consumer-profiling', name: 'Consumer Profiling', route: '/consumer-profiling' },
]

export interface FilterState {
  timeOfDay?: string | string[]
  barangay?: string | string[]
  region?: string | string[]
  category?: string | string[]
  brand?: string | string[]
  skuName?: string | string[]
  weekVsWeekend?: 'week' | 'weekend' | 'all'
  location?: string | string[]
  basketSize?: number | number[]
  ageGroup?: string | string[]
  gender?: 'male' | 'female' | 'all'
  productCategory?: string | string[]
  // Additional fields for real data integration
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  priceRange?: {
    min: number
    max: number
  }
  customerSegment?: string
}

export interface TransactionData {
  id: string
  timestamp: Date
  location: string
  barangay: string
  region: string
  pesoValue: number
  duration: number // in seconds
  unitsPerTransaction: number
  category: string
  brand: string
  skuName: string
  basketComposition: string[]
  requestType: 'branded' | 'unbranded' | 'unsure'
  requestMethod: 'pointing' | 'verbal' | 'indirect'
  suggestionAccepted: boolean
  consumerGender?: 'male' | 'female'
  consumerAge?: number
  dayType: 'week' | 'weekend'
}

export interface ProductMixData {
  category: string
  brand: string
  skuName: string
  transactionCount: number
  basketSize: number
  substitutionFrom?: string
  substitutionTo?: string
  topSKUs: Array<{
    sku: string
    count: number
    percentage: number
  }>
}

export interface ConsumerBehaviorData {
  requestType: 'branded' | 'unbranded' | 'unsure'
  requestMethod: 'pointing' | 'verbal' | 'indirect'
  suggestionAcceptance: number // percentage
  category: string
  brand: string
  ageGroup: string
  gender: 'male' | 'female'
  count: number
}

export interface ConsumerProfileData {
  barangay: string
  gender: 'male' | 'female'
  ageGroup: string
  productCategory: string
  brand: string
  transactionCount: number
  avgPesoValue: number
  latitude?: number
  longitude?: number
}

export interface AIRecommendation {
  id: string
  type: 'insight' | 'action' | 'warning'
  title: string
  description: string
  module: string
  confidence: number
  timestamp: Date
  actionable?: {
    label: string
    action: () => void
  }
}