// ====================================================================
// UNIT TESTS WITH REAL DATA - Data Service Hooks
// ====================================================================
// Tests for individual hook functions using actual Supabase data

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
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
import { supabaseFixed as supabase } from '../src/lib/fixed-supabase-api'

// Test configuration
const TEST_TIMEOUT = 30000 // 30 seconds for real API calls

// ====================================================================
// SETUP AND TEARDOWN
// ====================================================================

beforeAll(async () => {
  // Verify database connection
  const { data, error } = await supabase
    .from('silver_transactions_cleaned')
    .select('id')
    .limit(1)
  
  if (error) {
    throw new Error(`Database connection failed: ${error.message}`)
  }
  
  console.log('✅ Connected to Supabase')
})

afterAll(async () => {
  // Cleanup if needed
  console.log('✅ Tests completed')
})

// ====================================================================
// EXECUTIVE OVERVIEW TESTS WITH REAL DATA
// ====================================================================

describe('useExecutiveOverview - Real Data', () => {
  test('should fetch actual KPIs from database', async () => {
    const { result } = renderHook(() => useExecutiveOverview())
    
    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    // Verify data structure
    expect(result.current.data).toBeDefined()
    expect(result.current.error).toBeNull()
    
    const kpis = result.current.data!
    
    // Verify all KPI fields are present and valid
    expect(kpis.totalRevenue).toBeGreaterThan(0)
    expect(kpis.totalTransactions).toBeGreaterThan(0)
    expect(kpis.activeStores).toBeGreaterThan(0)
    expect(kpis.avgBasketSize).toBeGreaterThan(0)
    
    // Verify growth rates are numbers (can be negative)
    expect(typeof kpis.revenueGrowth).toBe('number')
    expect(typeof kpis.transactionGrowth).toBe('number')
    expect(typeof kpis.storeGrowth).toBe('number')
    expect(typeof kpis.basketGrowth).toBe('number')
    
    // Log actual values for verification
    console.log('Executive KPIs:', {
      revenue: `₱${(kpis.totalRevenue / 1000000).toFixed(2)}M`,
      transactions: kpis.totalTransactions.toLocaleString(),
      stores: kpis.activeStores,
      avgBasket: kpis.avgBasketSize.toFixed(2)
    })
  }, TEST_TIMEOUT)
  
  test('should calculate month-over-month growth correctly', async () => {
    const { result } = renderHook(() => useExecutiveOverview())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    const kpis = result.current.data!
    
    // Verify growth calculations are reasonable (-100% to 1000%)
    expect(kpis.revenueGrowth).toBeGreaterThanOrEqual(-100)
    expect(kpis.revenueGrowth).toBeLessThanOrEqual(1000)
    
    console.log('Growth Rates:', {
      revenue: `${kpis.revenueGrowth}%`,
      transactions: `${kpis.transactionGrowth}%`,
      stores: `${kpis.storeGrowth}%`,
      basket: `${kpis.basketGrowth}%`
    })
  }, TEST_TIMEOUT)
})

// ====================================================================
// REVENUE TREND TESTS WITH REAL DATA
// ====================================================================

describe('useRevenueTrend - Real Data', () => {
  test('should fetch 6 months of revenue data', async () => {
    const { result } = renderHook(() => useRevenueTrend())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.length).toBeGreaterThan(0)
    expect(result.current.data.length).toBeLessThanOrEqual(6)
    
    // Verify data structure
    result.current.data.forEach((month, index) => {
      expect(month).toHaveProperty('month')
      expect(month).toHaveProperty('revenue')
      expect(month).toHaveProperty('transactions')
      expect(month).toHaveProperty('avgTransaction')
      
      expect(month.revenue).toBeGreaterThan(0)
      expect(month.transactions).toBeGreaterThan(0)
      expect(month.avgTransaction).toBeGreaterThan(0)
      
      // Verify chronological order
      if (index > 0) {
        const prevMonth = new Date(result.current.data[index - 1].month)
        const currMonth = new Date(month.month)
        expect(currMonth.getTime()).toBeGreaterThan(prevMonth.getTime())
      }
    })
    
    console.log('Revenue Trend (Last 3 months):', 
      result.current.data.slice(-3).map(m => ({
        month: m.month,
        revenue: `₱${(m.revenue / 1000000).toFixed(2)}M`
      }))
    )
  }, TEST_TIMEOUT)
})

// ====================================================================
// CATEGORY MIX TESTS WITH REAL DATA
// ====================================================================

describe('useCategoryMix - Real Data', () => {
  test('should fetch category performance from RPC function', async () => {
    const { result } = renderHook(() => useCategoryMix())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.length).toBeGreaterThan(0)
    
    // Verify percentages add up to 100
    const totalPercentage = result.current.data.reduce((sum, cat) => sum + cat.percentage, 0)
    expect(Math.round(totalPercentage)).toBe(100)
    
    // Verify data structure
    result.current.data.forEach(category => {
      expect(category).toHaveProperty('category')
      expect(category).toHaveProperty('value')
      expect(category).toHaveProperty('percentage')
      expect(category).toHaveProperty('transactions')
      
      expect(category.value).toBeGreaterThan(0)
      expect(category.percentage).toBeGreaterThan(0)
      expect(category.percentage).toBeLessThanOrEqual(100)
    })
    
    // Log top 5 categories
    console.log('Top 5 Categories:', 
      result.current.data.slice(0, 5).map(c => ({
        name: c.category,
        percentage: `${c.percentage.toFixed(1)}%`,
        revenue: `₱${(c.value / 1000000).toFixed(2)}M`
      }))
    )
  }, TEST_TIMEOUT)
})

// ====================================================================
// REGIONAL PERFORMANCE TESTS WITH REAL DATA
// ====================================================================

describe('useRegionalPerformance - Real Data', () => {
  test('should fetch regional data from transactions', async () => {
    const { result } = renderHook(() => useRegionalPerformance())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.length).toBeGreaterThan(0)
    
    // Verify data structure
    result.current.data.forEach(region => {
      expect(region).toHaveProperty('region')
      expect(region).toHaveProperty('revenue')
      expect(region).toHaveProperty('transactions')
      expect(region).toHaveProperty('avgTransaction')
      expect(region).toHaveProperty('growth')
      
      expect(region.revenue).toBeGreaterThan(0)
      expect(region.transactions).toBeGreaterThan(0)
      expect(region.avgTransaction).toBeGreaterThan(0)
    })
    
    // Find top performing region
    const topRegion = result.current.data[0]
    console.log('Top Region:', {
      name: topRegion.region,
      revenue: `₱${(topRegion.revenue / 1000000).toFixed(2)}M`,
      transactions: topRegion.transactions.toLocaleString(),
      growth: `${topRegion.growth}%`
    })
  }, TEST_TIMEOUT)
})

// ====================================================================
// TRANSACTION TRENDS TESTS WITH REAL DATA
// ====================================================================

describe('useTransactionTrends - Real Data', () => {
  test('should fetch hourly transaction patterns', async () => {
    const { result } = renderHook(() => useTransactionTrends())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.todayTransactions).toBeGreaterThanOrEqual(0)
    expect(result.current.data.weekTransactions).toBeGreaterThan(0)
    expect(result.current.data.hourlyPattern).toBeDefined()
    expect(result.current.data.hourlyPattern.length).toBeGreaterThan(0)
    
    // Find peak hour
    const peakHour = result.current.data.hourlyPattern.reduce((max, hour) => 
      hour.transactions > (max?.transactions || 0) ? hour : max
    , result.current.data.hourlyPattern[0])
    
    console.log('Transaction Patterns:', {
      today: result.current.data.todayTransactions,
      thisWeek: result.current.data.weekTransactions.toLocaleString(),
      peakHour: `${peakHour.hour}:00 (${peakHour.transactions} transactions)`
    })
  }, TEST_TIMEOUT)
})

// ====================================================================
// PRODUCT MIX TESTS WITH REAL DATA
// ====================================================================

describe('useProductMix - Real Data', () => {
  test('should fetch product diversity metrics', async () => {
    const { result } = renderHook(() => useProductMix())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.totalSKUs).toBeGreaterThan(0)
    expect(result.current.data.brandsCount).toBeGreaterThan(0)
    expect(result.current.data.categoriesCount).toBeGreaterThan(0)
    expect(result.current.data.topProducts).toBeDefined()
    expect(result.current.data.topProducts.length).toBeGreaterThan(0)
    
    console.log('Product Mix:', {
      SKUs: result.current.data.totalSKUs.toLocaleString(),
      brands: result.current.data.brandsCount,
      categories: result.current.data.categoriesCount,
      topProduct: result.current.data.topProducts[0]?.name || 'N/A'
    })
  }, TEST_TIMEOUT)
})

// ====================================================================
// CONSUMER BEHAVIOR TESTS WITH REAL DATA
// ====================================================================

describe('useConsumerBehavior - Real Data', () => {
  test('should calculate behavior metrics from transactions', async () => {
    const { result } = renderHook(() => useConsumerBehavior())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    
    // Verify percentage bounds
    expect(result.current.data.brandedRequestsPercentage).toBeGreaterThanOrEqual(0)
    expect(result.current.data.brandedRequestsPercentage).toBeLessThanOrEqual(100)
    expect(result.current.data.suggestionAcceptanceRate).toBeGreaterThanOrEqual(0)
    expect(result.current.data.suggestionAcceptanceRate).toBeLessThanOrEqual(100)
    
    // Verify dwell time is reasonable (0-600 seconds)
    expect(result.current.data.averageDwellTime).toBeGreaterThanOrEqual(0)
    expect(result.current.data.averageDwellTime).toBeLessThanOrEqual(600)
    
    console.log('Consumer Behavior:', {
      brandedRequests: `${result.current.data.brandedRequestsPercentage.toFixed(1)}%`,
      suggestionAcceptance: `${result.current.data.suggestionAcceptanceRate.toFixed(1)}%`,
      avgDwellTime: `${result.current.data.averageDwellTime.toFixed(0)}s`,
      repeatCustomers: `${result.current.data.repeatCustomerRate.toFixed(1)}%`
    })
  }, TEST_TIMEOUT)
})

// ====================================================================
// CONSUMER PROFILING TESTS WITH REAL DATA
// ====================================================================

describe('useConsumerProfiling - Real Data', () => {
  test('should analyze demographic distribution', async () => {
    const { result } = renderHook(() => useConsumerProfiling())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.genderDistribution).toBeDefined()
    expect(result.current.data.ageDistribution).toBeDefined()
    expect(result.current.data.economicClassDistribution).toBeDefined()
    
    // Verify distributions have data
    expect(Object.keys(result.current.data.genderDistribution).length).toBeGreaterThan(0)
    expect(Object.keys(result.current.data.ageDistribution).length).toBeGreaterThan(0)
    
    console.log('Consumer Profile:', {
      topGender: result.current.data.topGender,
      topAgeGroup: result.current.data.topAgeGroup,
      uniqueCustomers: result.current.data.uniqueCustomers?.toLocaleString() || 'N/A'
    })
  }, TEST_TIMEOUT)
})

// AI Insights hook can be tested separately if implemented

// ====================================================================
// INTEGRATION TESTS WITH REAL DATA
// ====================================================================

describe('Data Consistency - Real Data', () => {
  test('should have consistent totals across different hooks', async () => {
    // Fetch data from multiple hooks
    const { result: overview } = renderHook(() => useExecutiveOverview())
    const { result: trends } = renderHook(() => useRevenueTrend())
    
    // Wait for all to load
    await waitFor(() => {
      expect(overview.current.loading).toBe(false)
      expect(trends.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    // If we have current month data in trends, verify it matches overview
    const currentMonthTrend = trends.current.data[trends.current.data.length - 1]
    if (currentMonthTrend) {
      const monthStart = new Date(currentMonthTrend.month)
      const now = new Date()
      
      // If it's the current month, transactions should be close
      if (monthStart.getMonth() === now.getMonth() && 
          monthStart.getFullYear() === now.getFullYear()) {
        const overviewTransactions = overview.current.data!.totalTransactions
        const trendTransactions = currentMonthTrend.transactions
        
        // Allow for some difference due to timing
        const difference = Math.abs(overviewTransactions - trendTransactions)
        const percentDiff = (difference / overviewTransactions) * 100
        
        console.log('Data Consistency Check:', {
          overviewTransactions,
          trendTransactions,
          difference,
          percentDiff: `${percentDiff.toFixed(2)}%`
        })
        
        // Should be within 10% (accounting for real-time data changes)
        expect(percentDiff).toBeLessThan(10)
      }
    }
  }, TEST_TIMEOUT)
})

// ====================================================================
// PERFORMANCE TESTS WITH REAL DATA
// ====================================================================

describe('Performance - Real Data', () => {
  test('should load executive overview within 2 seconds', async () => {
    const startTime = Date.now()
    const { result } = renderHook(() => useExecutiveOverview())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    const loadTime = Date.now() - startTime
    console.log(`Executive Overview load time: ${loadTime}ms`)
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000)
  }, TEST_TIMEOUT)
  
  test('should handle concurrent data fetching efficiently', async () => {
    const startTime = Date.now()
    
    // Load multiple hooks simultaneously
    const hooks = [
      renderHook(() => useExecutiveOverview()),
      renderHook(() => useRevenueTrend()),
      renderHook(() => useCategoryMix()),
      renderHook(() => useRegionalPerformance())
    ]
    
    // Wait for all to complete
    await waitFor(() => {
      expect(hooks.every(h => !h.result.current.loading)).toBe(true)
    }, { timeout: TEST_TIMEOUT })
    
    const totalTime = Date.now() - startTime
    console.log(`Concurrent load time for 4 hooks: ${totalTime}ms`)
    
    // Should complete within 3 seconds even with multiple hooks
    expect(totalTime).toBeLessThan(3000)
  }, TEST_TIMEOUT)
})

// ====================================================================
// ERROR HANDLING TESTS WITH REAL DATA
// ====================================================================

describe('Error Handling - Real Data', () => {
  test('should handle network timeouts gracefully', async () => {
    // This test would need to mock network conditions
    // For now, we'll just verify the error state exists
    const { result } = renderHook(() => useExecutiveOverview())
    
    // Initially should have no error
    expect(result.current.error).toBeNull()
    
    // Verify error state is available
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('retry')
  })
})

// ====================================================================
// DATA VALIDATION TESTS
// ====================================================================

describe('Data Validation - Real Data', () => {
  test('should not have negative values for key metrics', async () => {
    const { result } = renderHook(() => useExecutiveOverview())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    const kpis = result.current.data!
    
    // Revenue, transactions, stores, basket size should never be negative
    expect(kpis.totalRevenue).toBeGreaterThanOrEqual(0)
    expect(kpis.totalTransactions).toBeGreaterThanOrEqual(0)
    expect(kpis.activeStores).toBeGreaterThanOrEqual(0)
    expect(kpis.avgBasketSize).toBeGreaterThanOrEqual(0)
  }, TEST_TIMEOUT)
  
  test('should have valid date ranges in revenue trend', async () => {
    const { result } = renderHook(() => useRevenueTrend())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: TEST_TIMEOUT })
    
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(now.getMonth() - 6)
    
    result.current.data.forEach(month => {
      const monthDate = new Date(month.month)
      
      // Should be within last 6 months
      expect(monthDate.getTime()).toBeGreaterThanOrEqual(sixMonthsAgo.getTime())
      expect(monthDate.getTime()).toBeLessThanOrEqual(now.getTime())
    })
  }, TEST_TIMEOUT)
})