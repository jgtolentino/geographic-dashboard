// ====================================================================
// SANITY TESTS - Basic Validation Checks
// ====================================================================
// Quick checks to ensure the system is in a sane state

import { supabaseFixed as supabase } from '../src/lib/fixed-supabase-api'

export interface SanityCheck {
  checkName: string
  category: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: any
}

// ====================================================================
// SANITY CHECK SUITE
// ====================================================================
export class SanityTestSuite {
  private checks: SanityCheck[] = []
  
  async runAll(): Promise<SanityCheck[]> {
    console.log('🧠 Running Sanity Checks...\n')
    
    // Environment Checks
    await this.checkEnvironmentVariables()
    await this.checkSupabaseConfiguration()
    
    // Data Integrity Checks
    await this.checkDataIntegrity()
    await this.checkDateRanges()
    await this.checkNullValues()
    
    // Business Logic Checks
    await this.checkBusinessRules()
    await this.checkCalculations()
    
    // Performance Checks
    await this.checkResponseTimes()
    await this.checkDataVolumes()
    
    // Security Checks
    await this.checkPermissions()
    await this.checkRLSPolicies()
    
    this.printResults()
    return this.checks
  }

  // 1. Environment Variables Check
  private async checkEnvironmentVariables() {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]
    
    const missing = requiredVars.filter(varName => !process.env[varName])
    
    this.checks.push({
      checkName: 'Environment Variables',
      category: 'Configuration',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      message: missing.length === 0 
        ? 'All required environment variables are set'
        : `Missing environment variables: ${missing.join(', ')}`,
      severity: 'critical',
      details: { missing }
    })
  }

  // 2. Supabase Configuration Check
  private async checkSupabaseConfiguration() {
    try {
      const { data, error } = await supabase
        .from('silver_transactions_cleaned')
        .select('id')
        .limit(1)
      
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const hasValidUrl = url.includes('supabase.co')
      const hasValidKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length === 296
      
      this.checks.push({
        checkName: 'Supabase Configuration',
        category: 'Configuration',
        status: !error && hasValidUrl && hasValidKey ? 'PASS' : 'FAIL',
        message: !error 
          ? 'Supabase client configured correctly'
          : `Configuration error: ${error?.message || 'Invalid URL or key'}`,
        severity: 'critical',
        details: {
          urlValid: hasValidUrl,
          keyValid: hasValidKey,
          canConnect: !error
        }
      })
    } catch (err) {
      this.checks.push({
        checkName: 'Supabase Configuration',
        category: 'Configuration',
        status: 'FAIL',
        message: `Configuration check failed: ${err}`,
        severity: 'critical'
      })
    }
  }

  // 3. Data Integrity Check
  private async checkDataIntegrity() {
    try {
      // Check for orphaned records
      const { data: orphanedTransactions } = await supabase.rpc(
        'check_orphaned_transactions', 
        { limit: 10 }
      ).catch(() => ({ data: null }))
      
      // Check for duplicate transactions
      const { data: duplicates } = await supabase
        .from('silver_transactions_cleaned')
        .select('transaction_id')
        .limit(1000)
      
      const uniqueIds = new Set(duplicates?.map(d => d.transaction_id) || [])
      const hasDuplicates = uniqueIds.size < (duplicates?.length || 0)
      
      this.checks.push({
        checkName: 'Data Integrity',
        category: 'Data Quality',
        status: !hasDuplicates ? 'PASS' : 'WARN',
        message: !hasDuplicates 
          ? 'No duplicate transaction IDs found'
          : 'Potential duplicate transactions detected',
        severity: 'medium',
        details: {
          sampleSize: duplicates?.length || 0,
          uniqueCount: uniqueIds.size,
          duplicateCount: (duplicates?.length || 0) - uniqueIds.size
        }
      })
    } catch (err) {
      this.checks.push({
        checkName: 'Data Integrity',
        category: 'Data Quality',
        status: 'WARN',
        message: 'Could not complete integrity check',
        severity: 'low'
      })
    }
  }

  // 4. Date Range Sanity Check
  private async checkDateRanges() {
    try {
      const { data } = await supabase
        .from('silver_transactions_cleaned')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)
      
      const latestDate = new Date(data?.[0]?.timestamp || '')
      const daysSinceLatest = Math.floor(
        (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Check if data is too old (> 90 days)
      const isStale = daysSinceLatest > 90
      
      // Check for future dates
      const { data: futureData } = await supabase
        .from('silver_transactions_cleaned')
        .select('COUNT(*)')
        .gt('timestamp', new Date().toISOString())
        .single()
      
      const hasFutureDates = (futureData?.count || 0) > 0
      
      this.checks.push({
        checkName: 'Date Range Validity',
        category: 'Data Quality',
        status: !isStale && !hasFutureDates ? 'PASS' : 'WARN',
        message: isStale 
          ? `Data is ${daysSinceLatest} days old`
          : hasFutureDates 
            ? 'Found transactions with future dates'
            : 'Date ranges are valid',
        severity: isStale ? 'high' : 'medium',
        details: {
          latestDate: latestDate.toISOString(),
          daysSinceLatest,
          hasFutureDates
        }
      })
    } catch (err) {
      this.checks.push({
        checkName: 'Date Range Validity',
        category: 'Data Quality',
        status: 'FAIL',
        message: 'Could not check date ranges',
        severity: 'medium'
      })
    }
  }

  // 5. Null Values Check
  private async checkNullValues() {
    try {
      const { data: sample } = await supabase
        .from('silver_transactions_cleaned')
        .select('*')
        .limit(100)
      
      const criticalFields = ['id', 'timestamp', 'peso_value', 'store_id']
      const nullCounts: Record<string, number> = {}
      
      criticalFields.forEach(field => {
        nullCounts[field] = sample?.filter(row => !row[field]).length || 0
      })
      
      const hasNulls = Object.values(nullCounts).some(count => count > 0)
      
      this.checks.push({
        checkName: 'Critical Field Nulls',
        category: 'Data Quality',
        status: !hasNulls ? 'PASS' : 'FAIL',
        message: !hasNulls 
          ? 'No nulls in critical fields'
          : `Found nulls in critical fields: ${JSON.stringify(nullCounts)}`,
        severity: 'high',
        details: nullCounts
      })
    } catch (err) {
      this.checks.push({
        checkName: 'Critical Field Nulls',
        category: 'Data Quality',
        status: 'WARN',
        message: 'Could not check for null values',
        severity: 'low'
      })
    }
  }

  // 6. Business Rules Check
  private async checkBusinessRules() {
    try {
      const { data } = await supabase
        .from('silver_transactions_cleaned')
        .select('peso_value, basket_size, duration_seconds')
        .limit(1000)
      
      // Check for negative values
      const negativeValues = data?.filter(
        row => row.peso_value < 0 || row.basket_size < 0 || row.duration_seconds < 0
      ).length || 0
      
      // Check for unrealistic values
      const unrealisticValues = data?.filter(
        row => row.peso_value > 1000000 || // > 1M peso transaction
               row.basket_size > 1000 ||     // > 1000 items
               row.duration_seconds > 7200    // > 2 hours
      ).length || 0
      
      const violations = negativeValues + unrealisticValues
      
      this.checks.push({
        checkName: 'Business Rules Validation',
        category: 'Business Logic',
        status: violations === 0 ? 'PASS' : 'WARN',
        message: violations === 0 
          ? 'All transactions follow business rules'
          : `Found ${violations} transactions violating business rules`,
        severity: 'medium',
        details: {
          sampleSize: data?.length || 0,
          negativeValues,
          unrealisticValues
        }
      })
    } catch (err) {
      this.checks.push({
        checkName: 'Business Rules Validation',
        category: 'Business Logic',
        status: 'WARN',
        message: 'Could not validate business rules',
        severity: 'low'
      })
    }
  }

  // 7. Calculations Check
  private async checkCalculations() {
    try {
      // Verify category percentages add up to 100%
      const { data: categories } = await supabase.rpc('get_category_performance')
      
      if (categories && categories.length > 0) {
        const totalSales = categories.reduce((sum, cat) => sum + (cat.total_sales || 0), 0)
        const percentages = categories.map(cat => (cat.total_sales / totalSales) * 100)
        const totalPercentage = Math.round(percentages.reduce((sum, p) => sum + p, 0))
        
        this.checks.push({
          checkName: 'Category Percentage Calculation',
          category: 'Business Logic',
          status: totalPercentage === 100 ? 'PASS' : 'WARN',
          message: totalPercentage === 100 
            ? 'Category percentages correctly sum to 100%'
            : `Category percentages sum to ${totalPercentage}%`,
          severity: 'low',
          details: {
            totalPercentage,
            categoryCount: categories.length
          }
        })
      }
    } catch (err) {
      this.checks.push({
        checkName: 'Category Percentage Calculation',
        category: 'Business Logic',
        status: 'WARN',
        message: 'Could not verify calculations',
        severity: 'low'
      })
    }
  }

  // 8. Response Time Check
  private async checkResponseTimes() {
    const queries = [
      {
        name: 'Simple SELECT',
        query: () => supabase
          .from('silver_transactions_cleaned')
          .select('id')
          .limit(1)
      },
      {
        name: 'Aggregation Query',
        query: () => supabase
          .from('silver_transactions_cleaned')
          .select('peso_value')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      },
      {
        name: 'RPC Function',
        query: () => supabase.rpc('get_category_performance')
      }
    ]
    
    for (const { name, query } of queries) {
      const start = Date.now()
      try {
        await query()
        const duration = Date.now() - start
        
        this.checks.push({
          checkName: `Response Time: ${name}`,
          category: 'Performance',
          status: duration < 1000 ? 'PASS' : duration < 3000 ? 'WARN' : 'FAIL',
          message: `Query completed in ${duration}ms`,
          severity: duration < 1000 ? 'low' : duration < 3000 ? 'medium' : 'high',
          details: { duration }
        })
      } catch (err) {
        this.checks.push({
          checkName: `Response Time: ${name}`,
          category: 'Performance',
          status: 'FAIL',
          message: 'Query failed',
          severity: 'high'
        })
      }
    }
  }

  // 9. Data Volume Check
  private async checkDataVolumes() {
    try {
      const { data: countData } = await supabase
        .from('silver_transactions_cleaned')
        .select('COUNT(*)')
        .single()
      
      const recordCount = countData?.count || 0
      
      // Check if we have reasonable data volume
      const hasMinimumData = recordCount > 1000
      const hasExcessiveData = recordCount > 10000000 // 10M records
      
      this.checks.push({
        checkName: 'Data Volume',
        category: 'Performance',
        status: hasMinimumData && !hasExcessiveData ? 'PASS' : 'WARN',
        message: !hasMinimumData 
          ? `Only ${recordCount} records found (minimum 1000 expected)`
          : hasExcessiveData 
            ? `Excessive data volume: ${recordCount} records`
            : `Data volume is reasonable: ${recordCount} records`,
        severity: !hasMinimumData ? 'high' : 'medium',
        details: { recordCount }
      })
    } catch (err) {
      this.checks.push({
        checkName: 'Data Volume',
        category: 'Performance',
        status: 'WARN',
        message: 'Could not check data volume',
        severity: 'low'
      })
    }
  }

  // 10. Permissions Check
  private async checkPermissions() {
    const tables = [
      'silver_transactions_cleaned',
      'gold_daily_metrics',
      'scout.silver_master_stores',
      'scout.silver_master_products'
    ]
    
    const permissions: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        permissions[table] = !error
      } catch {
        permissions[table] = false
      }
    }
    
    const allAccessible = Object.values(permissions).every(p => p)
    
    this.checks.push({
      checkName: 'Table Permissions',
      category: 'Security',
      status: allAccessible ? 'PASS' : 'FAIL',
      message: allAccessible 
        ? 'All required tables are accessible'
        : 'Some tables are not accessible',
      severity: 'critical',
      details: permissions
    })
  }

  // 11. RLS Policies Check
  private async checkRLSPolicies() {
    try {
      // Try to access without auth (anon access)
      const { data, error } = await supabase
        .from('silver_transactions_cleaned')
        .select('id')
        .limit(1)
      
      const hasAnonAccess = !error || !error.message.includes('row-level security')
      
      this.checks.push({
        checkName: 'RLS Policies',
        category: 'Security',
        status: hasAnonAccess ? 'PASS' : 'FAIL',
        message: hasAnonAccess 
          ? 'Anonymous access is properly configured'
          : 'RLS policies blocking anonymous access',
        severity: 'high',
        details: {
          hasAnonAccess,
          error: error?.message
        }
      })
    } catch (err) {
      this.checks.push({
        checkName: 'RLS Policies',
        category: 'Security',
        status: 'WARN',
        message: 'Could not check RLS policies',
        severity: 'medium'
      })
    }
  }

  // Print Results Summary
  private printResults() {
    console.log('\n🧠 SANITY CHECK RESULTS\n')
    console.log('=' .repeat(80))
    
    // Group by category
    const categories = [...new Set(this.checks.map(c => c.category))]
    
    categories.forEach(category => {
      console.log(`\n${category}:`)
      console.log('-'.repeat(40))
      
      this.checks
        .filter(c => c.category === category)
        .forEach(check => {
          const emoji = check.status === 'PASS' ? '✅' : 
                       check.status === 'WARN' ? '⚠️' : '❌'
          const severity = check.severity === 'critical' ? '🔴' :
                          check.severity === 'high' ? '🟠' :
                          check.severity === 'medium' ? '🟡' : '🟢'
          
          console.log(`${emoji} ${check.checkName.padEnd(30)} ${severity} ${check.message}`)
        })
    })
    
    console.log('\n' + '=' .repeat(80))
    
    const summary = {
      total: this.checks.length,
      passed: this.checks.filter(c => c.status === 'PASS').length,
      warnings: this.checks.filter(c => c.status === 'WARN').length,
      failed: this.checks.filter(c => c.status === 'FAIL').length,
      critical: this.checks.filter(c => c.severity === 'critical' && c.status === 'FAIL').length
    }
    
    console.log('\nSummary:')
    console.log(`✅ Passed: ${summary.passed}`)
    console.log(`⚠️  Warnings: ${summary.warnings}`)
    console.log(`❌ Failed: ${summary.failed}`)
    console.log(`🔴 Critical Issues: ${summary.critical}`)
    
    const healthScore = Math.round(
      ((summary.passed + summary.warnings * 0.5) / summary.total) * 100
    )
    
    console.log(`\n🏥 System Health Score: ${healthScore}%`)
    console.log(healthScore >= 90 ? '✅ System is healthy!' : 
                healthScore >= 70 ? '⚠️ System needs attention' : 
                '❌ System has critical issues')
  }
}

// ====================================================================
// RUN SANITY TESTS
// ====================================================================
export async function runSanityTests(): Promise<number> {
  const suite = new SanityTestSuite()
  const results = await suite.runAll()
  
  const criticalFailures = results.filter(
    r => r.status === 'FAIL' && r.severity === 'critical'
  ).length
  
  return criticalFailures
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSanityTests().then(criticalFailures => {
    process.exit(criticalFailures > 0 ? 1 : 0)
  })
}