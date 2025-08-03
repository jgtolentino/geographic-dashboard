// ====================================================================
// TEST RUNNER - Orchestrates All Test Suites
// ====================================================================
// Central test execution and reporting system

import { runSmokeTests } from './smoke-tests'
import { runSanityTests } from './sanity-tests'
import { runUATTests } from './uat-scenarios'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

export interface TestRunReport {
  timestamp: string
  duration: number
  environment: string
  suites: TestSuiteResult[]
  summary: TestSummary
  recommendations: string[]
}

export interface TestSuiteResult {
  name: string
  type: 'smoke' | 'sanity' | 'unit' | 'uat'
  status: 'PASS' | 'FAIL' | 'PARTIAL'
  duration: number
  passCount: number
  failCount: number
  skipCount?: number
  details?: any
}

export interface TestSummary {
  totalSuites: number
  passedSuites: number
  failedSuites: number
  totalTests: number
  passedTests: number
  failedTests: number
  overallStatus: 'PASS' | 'FAIL' | 'PARTIAL'
  confidence: number // 0-100
}

// ====================================================================
// TEST RUNNER CLASS
// ====================================================================
export class TestRunner {
  private report: TestRunReport
  private startTime: number = 0
  
  constructor(environment: string = 'development') {
    this.report = {
      timestamp: new Date().toISOString(),
      duration: 0,
      environment,
      suites: [],
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallStatus: 'PASS',
        confidence: 0
      },
      recommendations: []
    }
  }
  
  async runAll(options: {
    smoke?: boolean
    sanity?: boolean
    unit?: boolean
    uat?: boolean
    baseUrl?: string
  } = {}) {
    // Default to running all tests
    const runOptions = {
      smoke: options.smoke !== false,
      sanity: options.sanity !== false,
      unit: options.unit !== false,
      uat: options.uat !== false,
      baseUrl: options.baseUrl || 'http://localhost:3000'
    }
    
    console.log('🧪 SCOUT DASHBOARD TEST SUITE')
    console.log('=' .repeat(80))
    console.log(`Environment: ${this.report.environment}`)
    console.log(`Base URL: ${runOptions.baseUrl}`)
    console.log(`Started: ${new Date().toLocaleString()}`)
    console.log('=' .repeat(80) + '\n')
    
    this.startTime = Date.now()
    
    try {
      // Create test results directory
      await this.ensureTestDirectory()
      
      // Run test suites in order
      if (runOptions.smoke) {
        await this.runSmokeTestSuite()
      }
      
      if (runOptions.sanity) {
        await this.runSanityTestSuite()
      }
      
      if (runOptions.unit) {
        await this.runUnitTestSuite()
      }
      
      if (runOptions.uat) {
        await this.runUATTestSuite(runOptions.baseUrl)
      }
      
      // Calculate summary
      this.calculateSummary()
      
      // Generate recommendations
      this.generateRecommendations()
      
      // Save report
      await this.saveReport()
      
      // Print final report
      this.printFinalReport()
      
    } catch (error) {
      console.error('❌ Test runner error:', error)
      this.report.summary.overallStatus = 'FAIL'
    }
    
    this.report.duration = Date.now() - this.startTime
    
    return this.report
  }

  // ====================================================================
  // SMOKE TESTS
  // ====================================================================
  private async runSmokeTestSuite() {
    console.log('\n🔥 SMOKE TESTS\n' + '-'.repeat(40))
    const suiteStart = Date.now()
    
    try {
      const success = await runSmokeTests()
      
      this.report.suites.push({
        name: 'Smoke Tests',
        type: 'smoke',
        status: success ? 'PASS' : 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: success ? 6 : 0, // 6 smoke tests
        failCount: success ? 0 : 6
      })
    } catch (error) {
      this.report.suites.push({
        name: 'Smoke Tests',
        type: 'smoke',
        status: 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: 0,
        failCount: 6,
        details: { error: String(error) }
      })
    }
  }

  // ====================================================================
  // SANITY TESTS
  // ====================================================================
  private async runSanityTestSuite() {
    console.log('\n🧠 SANITY TESTS\n' + '-'.repeat(40))
    const suiteStart = Date.now()
    
    try {
      const criticalFailures = await runSanityTests()
      
      this.report.suites.push({
        name: 'Sanity Tests',
        type: 'sanity',
        status: criticalFailures === 0 ? 'PASS' : 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: criticalFailures === 0 ? 11 : 11 - criticalFailures, // 11 sanity checks
        failCount: criticalFailures
      })
    } catch (error) {
      this.report.suites.push({
        name: 'Sanity Tests',
        type: 'sanity',
        status: 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: 0,
        failCount: 11,
        details: { error: String(error) }
      })
    }
  }

  // ====================================================================
  // UNIT TESTS
  // ====================================================================
  private async runUnitTestSuite() {
    console.log('\n🔬 UNIT TESTS\n' + '-'.repeat(40))
    const suiteStart = Date.now()
    
    try {
      // Run vitest
      const { stdout, stderr } = await execAsync('npm run test:unit', {
        cwd: process.cwd()
      })
      
      // Parse vitest output
      const passMatch = stdout.match(/(\d+) passed/)
      const failMatch = stdout.match(/(\d+) failed/)
      const skipMatch = stdout.match(/(\d+) skipped/)
      
      const passed = passMatch ? parseInt(passMatch[1]) : 0
      const failed = failMatch ? parseInt(failMatch[1]) : 0
      const skipped = skipMatch ? parseInt(skipMatch[1]) : 0
      
      this.report.suites.push({
        name: 'Unit Tests',
        type: 'unit',
        status: failed === 0 ? 'PASS' : 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: passed,
        failCount: failed,
        skipCount: skipped,
        details: { stdout: stdout.slice(-500) } // Last 500 chars
      })
      
      console.log(stdout)
      
    } catch (error) {
      // Test command failed
      this.report.suites.push({
        name: 'Unit Tests',
        type: 'unit',
        status: 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: 0,
        failCount: 1,
        details: { error: String(error) }
      })
      console.error('Unit tests failed:', error)
    }
  }

  // ====================================================================
  // UAT TESTS
  // ====================================================================
  private async runUATTestSuite(baseUrl: string) {
    console.log('\n👤 UAT TESTS\n' + '-'.repeat(40))
    const suiteStart = Date.now()
    
    try {
      const success = await runUATTests(baseUrl)
      
      this.report.suites.push({
        name: 'UAT Tests',
        type: 'uat',
        status: success ? 'PASS' : 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: success ? 9 : 0, // 9 UAT scenarios
        failCount: success ? 0 : 9
      })
    } catch (error) {
      this.report.suites.push({
        name: 'UAT Tests',
        type: 'uat',
        status: 'FAIL',
        duration: Date.now() - suiteStart,
        passCount: 0,
        failCount: 9,
        details: { error: String(error) }
      })
    }
  }

  // ====================================================================
  // HELPERS
  // ====================================================================
  private async ensureTestDirectory() {
    const dirs = ['./test-results', './test-screenshots']
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true })
    }
  }
  
  private calculateSummary() {
    const summary = this.report.summary
    
    summary.totalSuites = this.report.suites.length
    summary.passedSuites = this.report.suites.filter(s => s.status === 'PASS').length
    summary.failedSuites = this.report.suites.filter(s => s.status === 'FAIL').length
    
    summary.totalTests = this.report.suites.reduce((sum, s) => sum + s.passCount + s.failCount, 0)
    summary.passedTests = this.report.suites.reduce((sum, s) => sum + s.passCount, 0)
    summary.failedTests = this.report.suites.reduce((sum, s) => sum + s.failCount, 0)
    
    // Overall status
    if (summary.failedSuites === 0) {
      summary.overallStatus = 'PASS'
    } else if (summary.passedSuites === 0) {
      summary.overallStatus = 'FAIL'
    } else {
      summary.overallStatus = 'PARTIAL'
    }
    
    // Confidence score (0-100)
    const testPassRate = summary.totalTests > 0 
      ? (summary.passedTests / summary.totalTests) * 100 
      : 0
      
    const suitePassRate = summary.totalSuites > 0
      ? (summary.passedSuites / summary.totalSuites) * 100
      : 0
      
    summary.confidence = Math.round((testPassRate * 0.7 + suitePassRate * 0.3))
  }
  
  private generateRecommendations() {
    const { summary, suites } = this.report
    const recommendations = this.report.recommendations
    
    // Check smoke test failures
    const smokeTests = suites.find(s => s.type === 'smoke')
    if (smokeTests && smokeTests.status === 'FAIL') {
      recommendations.push('🚨 CRITICAL: Smoke tests failed. Fix database connection and authentication issues first.')
    }
    
    // Check sanity test failures
    const sanityTests = suites.find(s => s.type === 'sanity')
    if (sanityTests && sanityTests.failCount > 0) {
      recommendations.push('⚠️ Sanity checks failed. Review data integrity and configuration.')
    }
    
    // Check unit test coverage
    const unitTests = suites.find(s => s.type === 'unit')
    if (unitTests && unitTests.failCount > 0) {
      recommendations.push('🔬 Unit tests failing. Review component logic and data transformations.')
    }
    
    // Check UAT results
    const uatTests = suites.find(s => s.type === 'uat')
    if (uatTests && uatTests.failCount > 0) {
      recommendations.push('👤 UAT scenarios failing. Focus on user experience and UI interactions.')
    }
    
    // Performance recommendations
    if (summary.confidence < 50) {
      recommendations.push('📊 Low confidence score. Consider adding more test coverage.')
    }
    
    // Success recommendations
    if (summary.overallStatus === 'PASS') {
      recommendations.push('✅ All tests passing! Consider adding edge case tests.')
      recommendations.push('🚀 Ready for deployment to staging environment.')
    }
  }
  
  private async saveReport() {
    const reportPath = path.join(
      'test-results',
      `test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    )
    
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2))
    console.log(`\n📄 Report saved to: ${reportPath}`)
  }
  
  private printFinalReport() {
    console.log('\n' + '=' .repeat(80))
    console.log('📊 FINAL TEST REPORT')
    console.log('=' .repeat(80))
    
    const { summary } = this.report
    
    // Overall status with emoji
    const statusEmoji = summary.overallStatus === 'PASS' ? '✅' :
                       summary.overallStatus === 'PARTIAL' ? '⚠️' : '❌'
    
    console.log(`\nOverall Status: ${statusEmoji} ${summary.overallStatus}`)
    console.log(`Confidence Score: ${summary.confidence}%`)
    console.log(`Duration: ${Math.round(this.report.duration / 1000)}s`)
    
    // Suite results
    console.log('\nTest Suites:')
    this.report.suites.forEach(suite => {
      const emoji = suite.status === 'PASS' ? '✅' : '❌'
      console.log(`  ${emoji} ${suite.name.padEnd(20)} ${suite.passCount}/${suite.passCount + suite.failCount} passed (${Math.round(suite.duration / 1000)}s)`)
    })
    
    // Summary stats
    console.log('\nSummary:')
    console.log(`  Suites: ${summary.passedSuites}/${summary.totalSuites} passed`)
    console.log(`  Tests: ${summary.passedTests}/${summary.totalTests} passed`)
    
    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log('\nRecommendations:')
      this.report.recommendations.forEach(rec => {
        console.log(`  ${rec}`)
      })
    }
    
    console.log('\n' + '=' .repeat(80))
  }
}

// ====================================================================
// CLI INTERFACE
// ====================================================================
async function main() {
  const args = process.argv.slice(2)
  
  // Parse command line arguments
  const options = {
    smoke: !args.includes('--no-smoke'),
    sanity: !args.includes('--no-sanity'),
    unit: !args.includes('--no-unit'),
    uat: !args.includes('--no-uat'),
    baseUrl: args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000',
    environment: args.find(a => a.startsWith('--env='))?.split('=')[1] || 'development'
  }
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Scout Dashboard Test Runner

Usage: npm run test:all [options]

Options:
  --no-smoke      Skip smoke tests
  --no-sanity     Skip sanity tests
  --no-unit       Skip unit tests
  --no-uat        Skip UAT tests
  --url=<url>     Base URL for UAT tests (default: http://localhost:3000)
  --env=<env>     Environment name (default: development)
  --help, -h      Show this help message

Examples:
  npm run test:all                    # Run all tests
  npm run test:all --no-uat          # Skip UAT tests
  npm run test:all --url=https://staging.example.com --env=staging
    `)
    process.exit(0)
  }
  
  // Run tests
  const runner = new TestRunner(options.environment)
  const report = await runner.runAll(options)
  
  // Exit with appropriate code
  process.exit(report.summary.overallStatus === 'PASS' ? 0 : 1)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default TestRunner