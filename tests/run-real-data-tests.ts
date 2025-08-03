// Simple real data test runner
import {
  useExecutiveOverview,
  useRevenueTrend,
  useCategoryMix,
  useRegionalPerformance,
  useTransactionTrends,
  useProductMix,
  useConsumerBehavior,
  useConsumerProfiling
} from '../src/lib/scout-dashboard-service.js'

console.log('🔬 Running Unit Tests with Real Supabase Data\n')
console.log('=' .repeat(60))

// Helper to simulate hook execution
async function testHook(name: string, hookFn: Function) {
  console.log(`\n📊 Testing ${name}...`)
  const startTime = Date.now()
  
  try {
    // Call the hook function directly
    const result = await hookFn()
    const duration = Date.now() - startTime
    
    if (result.error) {
      console.log(`❌ ${name} - Error: ${result.error}`)
      return false
    }
    
    console.log(`✅ ${name} - Success (${duration}ms)`)
    console.log(`   Data:`, JSON.stringify(result.data, null, 2).slice(0, 200) + '...')
    return true
  } catch (error) {
    console.log(`❌ ${name} - Exception: ${error}`)
    return false
  }
}

// Test Executive Overview
async function testExecutiveOverview() {
  const hook = useExecutiveOverview()
  
  // Wait for initial load
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data) {
    console.log('\n📈 Executive KPIs:')
    console.log(`   Total Revenue: ₱${(hook.data.totalRevenue / 1000000).toFixed(2)}M`)
    console.log(`   Total Transactions: ${hook.data.totalTransactions.toLocaleString()}`)
    console.log(`   Active Stores: ${hook.data.activeStores}`)
    console.log(`   Avg Basket Size: ${hook.data.avgBasketSize.toFixed(2)}`)
    console.log(`   Revenue Growth: ${hook.data.revenueGrowth}%`)
    return true
  }
  return false
}

// Test Revenue Trend
async function testRevenueTrend() {
  const hook = useRevenueTrend()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data.length > 0) {
    console.log('\n📊 Revenue Trend (Last 3 months):')
    hook.data.slice(-3).forEach(month => {
      console.log(`   ${month.month}: ₱${(month.revenue / 1000000).toFixed(2)}M (${month.transactions} transactions)`)
    })
    return true
  }
  return false
}

// Test Category Mix
async function testCategoryMix() {
  const hook = useCategoryMix()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data.length > 0) {
    console.log('\n🥧 Top 5 Categories:')
    hook.data.slice(0, 5).forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat.category} - ${cat.percentage.toFixed(1)}% (₱${(cat.value / 1000000).toFixed(2)}M)`)
    })
    
    // Verify percentages sum to 100
    const totalPercentage = hook.data.reduce((sum, cat) => sum + cat.percentage, 0)
    console.log(`   Total percentage: ${totalPercentage.toFixed(1)}%`)
    return Math.abs(totalPercentage - 100) < 1
  }
  return false
}

// Test Regional Performance
async function testRegionalPerformance() {
  const hook = useRegionalPerformance()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data.length > 0) {
    console.log('\n🗺️ Regional Performance:')
    const topRegion = hook.data[0]
    console.log(`   Top Region: ${topRegion.region}`)
    console.log(`   Revenue: ₱${(topRegion.revenue / 1000000).toFixed(2)}M`)
    console.log(`   Transactions: ${topRegion.transactions.toLocaleString()}`)
    console.log(`   Growth: ${topRegion.growth}%`)
    return true
  }
  return false
}

// Test Transaction Trends
async function testTransactionTrends() {
  const hook = useTransactionTrends()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data) {
    console.log('\n📈 Transaction Trends:')
    console.log(`   Today: ${hook.data.todayTransactions} transactions`)
    console.log(`   This Week: ${hook.data.weekTransactions.toLocaleString()} transactions`)
    
    if (hook.data.hourlyPattern.length > 0) {
      const peakHour = hook.data.hourlyPattern.reduce((max, hour) => 
        hour.transactions > (max?.transactions || 0) ? hour : max
      )
      console.log(`   Peak Hour: ${peakHour.hour}:00 (${peakHour.transactions} transactions)`)
    }
    return true
  }
  return false
}

// Test Product Mix
async function testProductMix() {
  const hook = useProductMix()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data) {
    console.log('\n📦 Product Mix:')
    console.log(`   Total SKUs: ${hook.data.totalSKUs.toLocaleString()}`)
    console.log(`   Total Brands: ${hook.data.brandsCount}`)
    console.log(`   Total Categories: ${hook.data.categoriesCount}`)
    console.log(`   Top Category: ${hook.data.topCategory}`)
    if (hook.data.topProducts.length > 0) {
      console.log(`   Top Product: ${hook.data.topProducts[0].name}`)
    }
    return true
  }
  return false
}

// Test Consumer Behavior
async function testConsumerBehavior() {
  const hook = useConsumerBehavior()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data) {
    console.log('\n🛒 Consumer Behavior:')
    console.log(`   Branded Requests: ${hook.data.brandedRequestsPercentage.toFixed(1)}%`)
    console.log(`   Suggestion Acceptance: ${hook.data.suggestionAcceptanceRate.toFixed(1)}%`)
    console.log(`   Avg Dwell Time: ${hook.data.averageDwellTime.toFixed(0)}s`)
    console.log(`   Repeat Customers: ${hook.data.repeatCustomerRate.toFixed(1)}%`)
    return true
  }
  return false
}

// Test Consumer Profiling
async function testConsumerProfiling() {
  const hook = useConsumerProfiling()
  
  while (hook.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (!hook.error && hook.data) {
    console.log('\n👥 Consumer Profile:')
    console.log(`   Top Gender: ${hook.data.topGender}`)
    console.log(`   Top Age Group: ${hook.data.topAgeGroup}`)
    console.log(`   Unique Customers: ${hook.data.uniqueCustomers?.toLocaleString() || 'N/A'}`)
    
    // Show gender distribution
    if (hook.data.genderDistribution) {
      console.log('   Gender Distribution:')
      Object.entries(hook.data.genderDistribution).forEach(([gender, count]) => {
        console.log(`     ${gender}: ${count}`)
      })
    }
    return true
  }
  return false
}

// Run all tests
async function runAllTests() {
  const tests = [
    { name: 'Executive Overview', fn: testExecutiveOverview },
    { name: 'Revenue Trend', fn: testRevenueTrend },
    { name: 'Category Mix', fn: testCategoryMix },
    { name: 'Regional Performance', fn: testRegionalPerformance },
    { name: 'Transaction Trends', fn: testTransactionTrends },
    { name: 'Product Mix', fn: testProductMix },
    { name: 'Consumer Behavior', fn: testConsumerBehavior },
    { name: 'Consumer Profiling', fn: testConsumerProfiling }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const success = await test.fn()
    if (success) {
      passed++
    } else {
      failed++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${((passed / tests.length) * 100).toFixed(0)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed with real data!')
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above.')
  }
  
  process.exit(failed === 0 ? 0 : 1)
}

// Execute tests
runAllTests().catch(console.error)