// ====================================================================
// UNIT TESTS - Data Service Hooks
// ====================================================================
// Tests for individual hook functions and data transformations

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useExecutiveOverview,
  useRevenueTrend,
  useCategoryMix,
  useRegionalPerformance,
  useTransactionTrends,
  useProductMix,
  useConsumerBehavior,
  useConsumerProfiling
} from '../src/lib/scout-dashboard-service'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({
            data: mockTransactionData,
            error: null
          }))
        }))
      }))
    })),
    rpc: vi.fn((functionName) => {
      if (functionName === 'get_category_performance') {
        return Promise.resolve({ data: mockCategoryData, error: null })
      }
      if (functionName === 'get_hourly_transaction_pattern') {
        return Promise.resolve({ data: mockHourlyData, error: null })
      }
      return Promise.resolve({ data: [], error: null })
    })
  }))
}))

// Mock Data
const mockTransactionData = [
  {
    id: '1',
    peso_value: 1000,
    basket_size: 5,
    store_id: 'store1',
    timestamp: '2025-08-01T10:00:00',
    location: { region: 'Metro Manila' },
    sku: 'SKU001',
    product_category: 'Electronics',
    brand_name: 'Brand A',
    suggestion_accepted: true,
    duration_seconds: 120,
    gender: 'M',
    age_bracket: '25-34'
  },
  {
    id: '2',
    peso_value: 2000,
    basket_size: 3,
    store_id: 'store2',
    timestamp: '2025-08-01T11:00:00',
    location: { region: 'Cebu' },
    sku: 'SKU002',
    product_category: 'Snacks',
    brand_name: 'Brand B',
    suggestion_accepted: false,
    duration_seconds: 90,
    gender: 'F',
    age_bracket: '35-44'
  }
]

const mockCategoryData = [
  { category: 'Electronics', total_sales: 50000, transaction_count: 100 },
  { category: 'Snacks', total_sales: 30000, transaction_count: 150 },
  { category: 'Beverages', total_sales: 20000, transaction_count: 200 }
]

const mockHourlyData = [
  { hour_of_day: 9, transaction_count: 50, avg_transaction_value: 500 },
  { hour_of_day: 10, transaction_count: 75, avg_transaction_value: 600 },
  { hour_of_day: 11, transaction_count: 100, avg_transaction_value: 550 }
]

// ====================================================================
// TEST SUITES
// ====================================================================

describe('useExecutiveOverview', () => {
  test('should calculate KPIs correctly', async () => {
    const { result } = renderHook(() => useExecutiveOverview())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeTruthy()
    expect(result.current.data?.totalRevenue).toBeGreaterThan(0)
    expect(result.current.data?.totalTransactions).toBeGreaterThan(0)
    expect(result.current.data?.avgBasketSize).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  test('should handle errors gracefully', async () => {
    // Mock error scenario
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          gte: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      }))
    }))

    const { result } = renderHook(() => useExecutiveOverview())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeNull()
  })
})

describe('useRevenueTrend', () => {
  test('should group revenue by month', async () => {
    const { result } = renderHook(() => useRevenueTrend())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeInstanceOf(Array)
    expect(result.current.data.length).toBeGreaterThan(0)
    
    const firstMonth = result.current.data[0]
    expect(firstMonth).toHaveProperty('month')
    expect(firstMonth).toHaveProperty('revenue')
    expect(firstMonth).toHaveProperty('transactions')
  })
})

describe('useCategoryMix', () => {
  test('should calculate category percentages', async () => {
    const { result } = renderHook(() => useCategoryMix())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeInstanceOf(Array)
    expect(result.current.data.length).toBe(3)
    
    const totalPercentage = result.current.data.reduce((sum, cat) => sum + cat.percentage, 0)
    expect(totalPercentage).toBe(100)
    
    const electronics = result.current.data.find(c => c.category === 'Electronics')
    expect(electronics?.percentage).toBe(50) // 50000/100000 * 100
  })
})

describe('useRegionalPerformance', () => {
  test('should group data by region', async () => {
    const { result } = renderHook(() => useRegionalPerformance())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeInstanceOf(Array)
    
    const metroManila = result.current.data.find(r => r.region === 'Metro Manila')
    expect(metroManila).toBeTruthy()
    expect(metroManila?.revenue).toBeGreaterThan(0)
    expect(metroManila?.transactions).toBeGreaterThan(0)
  })
})

describe('useTransactionTrends', () => {
  test('should calculate today transactions', async () => {
    const { result } = renderHook(() => useTransactionTrends())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toHaveProperty('todayTransactions')
    expect(result.current.data).toHaveProperty('hourlyPattern')
    expect(result.current.data.hourlyPattern).toBeInstanceOf(Array)
  })
})

describe('useProductMix', () => {
  test('should count unique SKUs and brands', async () => {
    const { result } = renderHook(() => useProductMix())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeTruthy()
    expect(result.current.data?.totalSKUs).toBeGreaterThan(0)
    expect(result.current.data?.brandsCount).toBeGreaterThan(0)
    expect(result.current.data?.topCategory).toBeTruthy()
  })
})

describe('useConsumerBehavior', () => {
  test('should calculate behavior metrics', async () => {
    const { result } = renderHook(() => useConsumerBehavior())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeTruthy()
    expect(result.current.data?.brandedRequestsPercentage).toBeGreaterThanOrEqual(0)
    expect(result.current.data?.brandedRequestsPercentage).toBeLessThanOrEqual(100)
    expect(result.current.data?.suggestionAcceptanceRate).toBeGreaterThanOrEqual(0)
    expect(result.current.data?.averageDwellTime).toBeGreaterThan(0)
  })
})

describe('useConsumerProfiling', () => {
  test('should analyze demographics', async () => {
    const { result } = renderHook(() => useConsumerProfiling())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeTruthy()
    expect(result.current.data?.topGender).toMatch(/^(M|F|Unknown)$/)
    expect(result.current.data?.topAgeGroup).toBeTruthy()
    expect(result.current.data?.economicClassDistribution).toBeTruthy()
  })
})

// ====================================================================
// UTILITY FUNCTION TESTS
// ====================================================================

describe('Data Transformation Utilities', () => {
  test('should handle null/undefined data gracefully', () => {
    const nullData = null
    const undefinedData = undefined
    const emptyData: any[] = []
    
    // Test array operations
    expect((nullData || []).slice(0, 5)).toEqual([])
    expect((undefinedData || []).slice(0, 5)).toEqual([])
    expect((emptyData || []).slice(0, 5)).toEqual([])
  })

  test('should format currency correctly', () => {
    const formatCurrency = (value: number) => `₱${(value / 1000000).toFixed(2)}M`
    
    expect(formatCurrency(1000000)).toBe('₱1.00M')
    expect(formatCurrency(1500000)).toBe('₱1.50M')
    expect(formatCurrency(500000)).toBe('₱0.50M')
  })

  test('should calculate growth rates correctly', () => {
    const calculateGrowth = (current: number, previous: number) => {
      if (!previous) return 0
      return Math.round(((current - previous) / previous) * 100)
    }
    
    expect(calculateGrowth(120, 100)).toBe(20)
    expect(calculateGrowth(80, 100)).toBe(-20)
    expect(calculateGrowth(100, 0)).toBe(0)
  })
})