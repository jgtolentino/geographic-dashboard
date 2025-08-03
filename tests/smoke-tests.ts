// ====================================================================
// SMOKE TESTS - Critical Path Testing
// ====================================================================
// Quick tests to ensure core functionality is working

import { supabaseFixed as supabase } from '../src/lib/fixed-supabase-api'

export interface SmokeTestResult {
  testName: string
  status: 'PASS' | 'FAIL'
  duration: number
  error?: string
  details?: any
}

// ====================================================================
// SMOKE TEST SUITE
// ====================================================================
export class SmokeTestSuite {
  private results: SmokeTestResult[] = []
  
  async runAll(): Promise<SmokeTestResult[]> {
    console.log('🔥 Running Smoke Tests...\n')
    
    // Critical Path Tests
    await this.testDatabaseConnection()
    await this.testAuthenticationKey()
    await this.testCriticalTables()
    await this.testRPCFunctions()
    await this.testDataAvailability()
    await this.testDashboardLoad()
    
    this.printResults()
    return this.results
  }

  // Test 1: Database Connection
  private async testDatabaseConnection() {
    const start = Date.now()
    try {
      const { data, error } = await supabase
        .from('silver_transactions_cleaned')
        .select('id')
        .limit(1)
      
      this.results.push({
        testName: 'Database Connection',
        status: error ? 'FAIL' : 'PASS',
        duration: Date.now() - start,
        error: error?.message,
        details: { connected: !error, responseTime: Date.now() - start }
      })
    } catch (err) {
      this.results.push({
        testName: 'Database Connection',
        status: 'FAIL',
        duration: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Test 2: Authentication Key Valid
  private async testAuthenticationKey() {
    const start = Date.now()
    try {
      const { data, error } = await supabase
        .from('silver_transactions_cleaned')
        .select('COUNT(*)')
        .limit(1)
        .single()
      
      const hasAuth = !error || !error.message.includes('401')
      
      this.results.push({
        testName: 'Authentication Key',
        status: hasAuth ? 'PASS' : 'FAIL',
        duration: Date.now() - start,
        error: error?.message,
        details: { authenticated: hasAuth }
      })
    } catch (err) {
      this.results.push({
        testName: 'Authentication Key',
        status: 'FAIL',
        duration: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Test 3: Critical Tables Accessible
  private async testCriticalTables() {
    const start = Date.now()
    const tables = [
      'silver_transactions_cleaned',
      'gold_daily_metrics',
      'silver_master_stores',
      'silver_master_products'
    ]
    
    const results = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        return { table, accessible: !error }
      })
    )
    
    const allAccessible = results.every(r => r.accessible)
    
    this.results.push({
      testName: 'Critical Tables Access',
      status: allAccessible ? 'PASS' : 'FAIL',
      duration: Date.now() - start,
      details: results
    })
  }

  // Test 4: RPC Functions Working
  private async testRPCFunctions() {
    const start = Date.now()
    const functions = [
      { name: 'get_category_performance', expectedMin: 1 },
      { name: 'get_hourly_transaction_pattern', expectedMin: 1 }
    ]
    
    const results = await Promise.all(
      functions.map(async (func) => {
        try {
          const { data, error } = await supabase.rpc(func.name)
          return {
            function: func.name,
            working: !error && data && data.length >= func.expectedMin,
            rowCount: data?.length || 0,
            error: error?.message
          }
        } catch (err) {
          return {
            function: func.name,
            working: false,
            rowCount: 0,
            error: err instanceof Error ? err.message : 'Unknown error'
          }
        }
      })
    )
    
    const allWorking = results.every(r => r.working)
    
    this.results.push({
      testName: 'RPC Functions',
      status: allWorking ? 'PASS' : 'FAIL',
      duration: Date.now() - start,
      details: results
    })
  }

  // Test 5: Data Availability
  private async testDataAvailability() {
    const start = Date.now()
    try {
      const { data, error } = await supabase
        .from('silver_transactions_cleaned')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)
      
      const latestDate = data?.[0]?.timestamp
      const daysSinceLatest = latestDate
        ? Math.floor((Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Consider data fresh if within 60 days
      const isFresh = daysSinceLatest !== null && daysSinceLatest < 60
      
      this.results.push({
        testName: 'Data Availability',
        status: isFresh ? 'PASS' : 'FAIL',
        duration: Date.now() - start,
        details: {
          latestTransaction: latestDate,
          daysSinceLatest,
          dataFresh: isFresh
        }
      })
    } catch (err) {
      this.results.push({
        testName: 'Data Availability',
        status: 'FAIL',
        duration: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Test 6: Dashboard Critical Components Load
  private async testDashboardLoad() {
    const start = Date.now()
    try {
      // Simulate loading all critical dashboard data
      const [kpis, categories, hourly] = await Promise.all([
        // KPIs
        supabase
          .from('silver_transactions_cleaned')
          .select('peso_value, basket_size')
          .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100),
        
        // Categories
        supabase.rpc('get_category_performance'),
        
        // Hourly
        supabase.rpc('get_hourly_transaction_pattern')
      ])
      
      const allLoaded = !kpis.error && !categories.error && !hourly.error
      
      this.results.push({
        testName: 'Dashboard Load',
        status: allLoaded ? 'PASS' : 'FAIL',
        duration: Date.now() - start,
        details: {
          kpisLoaded: !kpis.error,
          categoriesLoaded: !categories.error,
          hourlyLoaded: !hourly.error,
          loadTime: Date.now() - start
        }
      })
    } catch (err) {
      this.results.push({
        testName: 'Dashboard Load',
        status: 'FAIL',
        duration: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Print Results Summary
  private printResults() {
    console.log('\n🔥 SMOKE TEST RESULTS\n')
    console.log('=' .repeat(60))
    
    this.results.forEach(result => {
      const emoji = result.status === 'PASS' ? '✅' : '❌'
      console.log(`${emoji} ${result.testName.padEnd(25)} ${result.status.padEnd(6)} ${result.duration}ms`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    console.log('=' .repeat(60))
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const total = this.results.length
    const passRate = Math.round((passed / total) * 100)
    
    console.log(`\nSummary: ${passed}/${total} tests passed (${passRate}%)`)
    console.log(passRate === 100 ? '\n✅ All smoke tests passed!' : '\n❌ Some tests failed!')
  }
}

// ====================================================================
// RUN SMOKE TESTS
// ====================================================================
export async function runSmokeTests(): Promise<boolean> {
  const suite = new SmokeTestSuite()
  const results = await suite.runAll()
  return results.every(r => r.status === 'PASS')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmokeTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}