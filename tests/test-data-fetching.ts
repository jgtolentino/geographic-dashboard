// Direct data fetching tests without React hooks
import { supabaseFixed as supabase } from '../src/lib/fixed-supabase-api.js'

console.log('🔬 Testing Data Fetching with Real Supabase Data\n')
console.log('=' .repeat(60))

// Test 1: Executive Overview Data
async function testExecutiveOverviewData() {
  console.log('\n📈 Testing Executive Overview Data...')
  
  try {
    // Current month KPIs
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data: currentData, error: currentError } = await supabase
      .from('silver_transactions_cleaned')
      .select('peso_value, basket_size, store_id')
      .gte('timestamp', startOfMonth.toISOString())
    
    if (currentError) throw currentError
    
    const totalRevenue = currentData?.reduce((sum, t) => sum + (t.peso_value || 0), 0) || 0
    const totalTransactions = currentData?.length || 0
    const activeStores = new Set(currentData?.map(t => t.store_id).filter(Boolean)).size
    const avgBasketSize = totalTransactions > 0 
      ? currentData.reduce((sum, t) => sum + (t.basket_size || 0), 0) / totalTransactions 
      : 0
    
    console.log('✅ Current Month KPIs:')
    console.log(`   Total Revenue: ₱${(totalRevenue / 1000000).toFixed(2)}M`)
    console.log(`   Total Transactions: ${totalTransactions.toLocaleString()}`)
    console.log(`   Active Stores: ${activeStores}`)
    console.log(`   Avg Basket Size: ${avgBasketSize.toFixed(2)}`)
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 2: Revenue Trend Data
async function testRevenueTrendData() {
  console.log('\n📊 Testing Revenue Trend Data...')
  
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data, error } = await supabase
      .from('silver_transactions_cleaned')
      .select('timestamp, peso_value')
      .gte('timestamp', sixMonthsAgo.toISOString())
      .order('timestamp', { ascending: true })
    
    if (error) throw error
    
    // Group by month
    const monthlyData: Record<string, { revenue: number, count: number }> = {}
    
    data?.forEach(transaction => {
      const month = transaction.timestamp.substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, count: 0 }
      }
      monthlyData[month].revenue += transaction.peso_value || 0
      monthlyData[month].count += 1
    })
    
    console.log('✅ Revenue Trend (by month):')
    Object.entries(monthlyData).slice(-3).forEach(([month, data]) => {
      console.log(`   ${month}: ₱${(data.revenue / 1000000).toFixed(2)}M (${data.count} transactions)`)
    })
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 3: Category Performance RPC
async function testCategoryPerformance() {
  console.log('\n🥧 Testing Category Performance...')
  
  try {
    const { data, error } = await supabase.rpc('get_category_performance')
    
    if (error) throw error
    
    if (data && data.length > 0) {
      // Calculate percentages
      const totalSales = data.reduce((sum: number, cat: any) => sum + (cat.total_sales || 0), 0)
      
      console.log('✅ Top 5 Categories:')
      data.slice(0, 5).forEach((cat: any, i: number) => {
        const percentage = (cat.total_sales / totalSales) * 100
        console.log(`   ${i + 1}. ${cat.category} - ${percentage.toFixed(1)}% (₱${(cat.total_sales / 1000000).toFixed(2)}M)`)
      })
      
      // Verify percentages
      const totalPercentage = data.reduce((sum: number, cat: any) => 
        sum + ((cat.total_sales / totalSales) * 100), 0
      )
      console.log(`   Total percentage: ${totalPercentage.toFixed(1)}%`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 4: Hourly Transaction Pattern RPC
async function testHourlyPattern() {
  console.log('\n⏰ Testing Hourly Transaction Pattern...')
  
  try {
    const { data, error } = await supabase.rpc('get_hourly_transaction_pattern')
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const peakHour = data.reduce((max: any, hour: any) => 
        hour.transaction_count > (max?.transaction_count || 0) ? hour : max
      )
      
      console.log('✅ Hourly Pattern:')
      console.log(`   Hours with data: ${data.length}`)
      console.log(`   Peak hour: ${peakHour?.hour_of_day || 'N/A'}:00 (${peakHour?.transaction_count || 0} transactions)`)
      console.log(`   Peak hour avg value: ₱${peakHour?.avg_transaction_value?.toFixed(2) || 'N/A'}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 5: Regional Performance
async function testRegionalPerformance() {
  console.log('\n🗺️ Testing Regional Performance...')
  
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data, error } = await supabase
      .from('silver_transactions_cleaned')
      .select('location, peso_value')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .limit(1000)
    
    if (error) throw error
    
    // Group by region
    const regionalData: Record<string, { revenue: number, count: number }> = {}
    
    data?.forEach(transaction => {
      const region = transaction.location?.region || 
                    transaction.location?.province || 
                    transaction.location?.city || 
                    'Unknown'
      
      if (!regionalData[region]) {
        regionalData[region] = { revenue: 0, count: 0 }
      }
      regionalData[region].revenue += transaction.peso_value || 0
      regionalData[region].count += 1
    })
    
    console.log('✅ Regional Performance:')
    const topRegions = Object.entries(regionalData)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 3)
    
    topRegions.forEach(([region, data], i) => {
      console.log(`   ${i + 1}. ${region}: ₱${(data.revenue / 1000000).toFixed(2)}M (${data.count} transactions)`)
    })
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 6: Product Mix
async function testProductMix() {
  console.log('\n📦 Testing Product Mix...')
  
  try {
    const { data, error } = await supabase
      .from('silver_transactions_cleaned')
      .select('sku, brand_name, product_category')
      .limit(1000)
    
    if (error) throw error
    
    const uniqueSKUs = new Set(data?.map(t => t.sku).filter(Boolean))
    const uniqueBrands = new Set(data?.map(t => t.brand_name).filter(Boolean))
    const uniqueCategories = new Set(data?.map(t => t.product_category).filter(Boolean))
    
    console.log('✅ Product Mix:')
    console.log(`   Unique SKUs: ${uniqueSKUs.size}`)
    console.log(`   Unique Brands: ${uniqueBrands.size}`)
    console.log(`   Unique Categories: ${uniqueCategories.size}`)
    
    // Show top categories
    const categoryCount: Record<string, number> = {}
    data?.forEach(t => {
      if (t.product_category) {
        categoryCount[t.product_category] = (categoryCount[t.product_category] || 0) + 1
      }
    })
    
    console.log('   Top Categories in sample:')
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([cat, count], i) => {
        console.log(`     ${i + 1}. ${cat} (${count} transactions)`)
      })
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 7: Consumer Behavior
async function testConsumerBehavior() {
  console.log('\n🛒 Testing Consumer Behavior...')
  
  try {
    const { data, error } = await supabase
      .from('silver_transactions_cleaned')
      .select('brand_name, suggestion_accepted, duration_seconds')
      .limit(1000)
    
    if (error) throw error
    
    const totalCount = data?.length || 0
    const brandedCount = data?.filter(t => t.brand_name && t.brand_name !== '').length || 0
    const acceptedCount = data?.filter(t => t.suggestion_accepted === true).length || 0
    const avgDwellTime = totalCount > 0
      ? data.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / totalCount
      : 0
    
    console.log('✅ Consumer Behavior:')
    console.log(`   Branded Requests: ${((brandedCount / totalCount) * 100).toFixed(1)}%`)
    console.log(`   Suggestion Acceptance: ${((acceptedCount / totalCount) * 100).toFixed(1)}%`)
    console.log(`   Avg Dwell Time: ${avgDwellTime.toFixed(0)}s`)
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Test 8: Data Freshness
async function testDataFreshness() {
  console.log('\n📅 Testing Data Freshness...')
  
  try {
    const { data: latestData, error } = await supabase
      .from('silver_transactions_cleaned')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (latestData && latestData[0]) {
      const latestDate = new Date(latestData[0].timestamp)
      const daysSince = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log('✅ Data Freshness:')
      console.log(`   Latest transaction: ${latestDate.toISOString()}`)
      console.log(`   Days since last transaction: ${daysSince}`)
      console.log(`   Status: ${daysSince < 60 ? '✅ Fresh' : '⚠️ Stale'}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    { name: 'Executive Overview Data', fn: testExecutiveOverviewData },
    { name: 'Revenue Trend Data', fn: testRevenueTrendData },
    { name: 'Category Performance', fn: testCategoryPerformance },
    { name: 'Hourly Pattern', fn: testHourlyPattern },
    { name: 'Regional Performance', fn: testRegionalPerformance },
    { name: 'Product Mix', fn: testProductMix },
    { name: 'Consumer Behavior', fn: testConsumerBehavior },
    { name: 'Data Freshness', fn: testDataFreshness }
  ]
  
  let passed = 0
  let failed = 0
  const startTime = Date.now()
  
  for (const test of tests) {
    const success = await test.fn()
    if (success) {
      passed++
    } else {
      failed++
    }
  }
  
  const duration = Date.now() - startTime
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   ⏱️ Duration: ${(duration / 1000).toFixed(1)}s`)
  console.log(`   📈 Success Rate: ${((passed / tests.length) * 100).toFixed(0)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All data fetching tests passed!')
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above.')
  }
  
  process.exit(failed === 0 ? 0 : 1)
}

// Execute tests
runAllTests().catch(console.error)