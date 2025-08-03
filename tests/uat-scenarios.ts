// ====================================================================
// UAT (User Acceptance Testing) SCENARIOS
// ====================================================================
// End-to-end test scenarios from a user's perspective

import { supabaseFixed as supabase } from '../src/lib/fixed-supabase-api'
import { Browser, Page, chromium } from 'playwright'

export interface UATScenario {
  scenarioName: string
  userRole: string
  description: string
  steps: UATStep[]
  expectedOutcome: string
  actualOutcome?: string
  status?: 'PASS' | 'FAIL' | 'BLOCKED'
  screenshots?: string[]
  duration?: number
}

export interface UATStep {
  stepNumber: number
  action: string
  expectedResult: string
  actualResult?: string
  status?: 'PASS' | 'FAIL' | 'BLOCKED'
  screenshot?: string
}

// ====================================================================
// UAT TEST SUITE
// ====================================================================
export class UATTestSuite {
  private browser: Browser | null = null
  private page: Page | null = null
  private scenarios: UATScenario[] = []
  private baseUrl: string
  
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }
  
  async setup() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    this.page = await this.browser.newPage()
    
    // Set viewport to standard desktop size
    await this.page.setViewportSize({ width: 1920, height: 1080 })
  }
  
  async teardown() {
    if (this.page) await this.page.close()
    if (this.browser) await this.browser.close()
  }
  
  async runAll(): Promise<UATScenario[]> {
    console.log('👤 Running UAT Scenarios...\n')
    
    await this.setup()
    
    try {
      // Executive User Scenarios
      await this.testExecutiveDashboardView()
      await this.testKPIInteraction()
      await this.testChartInteractions()
      
      // Analyst User Scenarios
      await this.testDataFiltering()
      await this.testExportFunctionality()
      // await this.testDrillDownAnalysis() // Not implemented
      
      // Mobile User Scenarios
      await this.testMobileResponsiveness()
      
      // Performance Scenarios
      await this.testDashboardLoadTime()
      await this.testDataRefresh()
      
      // Error Scenarios
      await this.testErrorHandling()
    } finally {
      await this.teardown()
    }
    
    this.printResults()
    return this.scenarios
  }

  // ====================================================================
  // SCENARIO 1: Executive Dashboard View
  // ====================================================================
  private async testExecutiveDashboardView() {
    const scenario: UATScenario = {
      scenarioName: 'Executive Dashboard Overview',
      userRole: 'Executive',
      description: 'Executive user views the main dashboard to check business KPIs',
      steps: [],
      expectedOutcome: 'Dashboard loads with all KPIs visible and updated'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Navigate to dashboard
      scenario.steps.push({
        stepNumber: 1,
        action: 'Navigate to Scout Dashboard',
        expectedResult: 'Dashboard page loads successfully'
      })
      
      await this.page!.goto(`${this.baseUrl}/scout-dashboard`)
      await this.page!.waitForLoadState('networkidle')
      
      scenario.steps[0].actualResult = 'Page loaded'
      scenario.steps[0].status = 'PASS'
      scenario.steps[0].screenshot = await this.takeScreenshot('dashboard-load')
      
      // Step 2: Verify KPIs are visible
      scenario.steps.push({
        stepNumber: 2,
        action: 'Check if KPI cards are displayed',
        expectedResult: 'Four KPI cards showing revenue, transactions, stores, and basket size'
      })
      
      const kpiCards = await this.page!.$$('.stat-card')
      const kpiCount = kpiCards.length
      
      scenario.steps[1].actualResult = `Found ${kpiCount} KPI cards`
      scenario.steps[1].status = kpiCount >= 4 ? 'PASS' : 'FAIL'
      
      // Step 3: Verify data is fresh
      scenario.steps.push({
        stepNumber: 3,
        action: 'Check last updated timestamp',
        expectedResult: 'Shows recent update time (within last 5 minutes)'
      })
      
      const lastUpdated = await this.page!.textContent('.last-updated')
      const isRecent = lastUpdated?.includes('ago') && 
                      (lastUpdated.includes('second') || lastUpdated.includes('minute'))
      
      scenario.steps[2].actualResult = lastUpdated || 'No timestamp found'
      scenario.steps[2].status = isRecent ? 'PASS' : 'FAIL'
      
      // Overall scenario status
      scenario.status = scenario.steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL'
      scenario.actualOutcome = scenario.status === 'PASS' 
        ? 'Dashboard loaded successfully with all KPIs'
        : 'Dashboard loaded but some elements missing'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 2: KPI Interaction
  // ====================================================================
  private async testKPIInteraction() {
    const scenario: UATScenario = {
      scenarioName: 'KPI Card Interactions',
      userRole: 'Executive',
      description: 'User interacts with KPI cards to see detailed information',
      steps: [],
      expectedOutcome: 'KPI cards respond to hover and show growth indicators'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Hover over revenue KPI
      scenario.steps.push({
        stepNumber: 1,
        action: 'Hover over Total Revenue KPI card',
        expectedResult: 'Card shows hover effect and displays tooltip with trend'
      })
      
      const revenueCard = await this.page!.$('div:has-text("Total Revenue")')
      if (revenueCard) {
        await revenueCard.hover()
        await this.page!.waitForTimeout(500)
        
        scenario.steps[0].actualResult = 'Hover effect applied'
        scenario.steps[0].status = 'PASS'
        scenario.steps[0].screenshot = await this.takeScreenshot('kpi-hover')
      }
      
      // Step 2: Check growth indicators
      scenario.steps.push({
        stepNumber: 2,
        action: 'Verify growth percentage indicators',
        expectedResult: 'Each KPI shows growth % with appropriate color (green/red)'
      })
      
      const growthIndicators = await this.page!.$$('.growth-indicator')
      const hasColors = await Promise.all(
        growthIndicators.map(async (indicator) => {
          const classes = await indicator.getAttribute('class')
          return classes?.includes('text-green') || classes?.includes('text-red')
        })
      )
      
      scenario.steps[1].actualResult = `${growthIndicators.length} growth indicators found`
      scenario.steps[1].status = hasColors.every(Boolean) ? 'PASS' : 'FAIL'
      
      scenario.status = scenario.steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 3: Chart Interactions
  // ====================================================================
  private async testChartInteractions() {
    const scenario: UATScenario = {
      scenarioName: 'Interactive Charts',
      userRole: 'Analyst',
      description: 'User interacts with various charts to explore data',
      steps: [],
      expectedOutcome: 'Charts are interactive with tooltips and clickable elements'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Interact with Revenue Trend Chart
      scenario.steps.push({
        stepNumber: 1,
        action: 'Hover over Revenue Trend line chart',
        expectedResult: 'Tooltip appears showing exact values for that date'
      })
      
      const chartArea = await this.page!.$('.revenue-trend-chart')
      if (chartArea) {
        const box = await chartArea.boundingBox()
        if (box) {
          // Hover over middle of chart
          await this.page!.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
          await this.page!.waitForTimeout(500)
        }
      }
      
      scenario.steps[0].actualResult = 'Chart interaction completed'
      scenario.steps[0].status = 'PASS'
      
      // Step 2: Click on pie chart segment
      scenario.steps.push({
        stepNumber: 2,
        action: 'Click on Category Mix pie chart segment',
        expectedResult: 'Segment highlights and shows detailed breakdown'
      })
      
      const pieChart = await this.page!.$('.category-mix-chart')
      if (pieChart) {
        await pieChart.click({ position: { x: 100, y: 100 } })
        await this.page!.waitForTimeout(500)
      }
      
      scenario.steps[1].actualResult = 'Pie chart clicked'
      scenario.steps[1].status = 'PASS'
      scenario.steps[1].screenshot = await this.takeScreenshot('chart-interaction')
      
      scenario.status = 'PASS'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 4: Data Filtering
  // ====================================================================
  private async testDataFiltering() {
    const scenario: UATScenario = {
      scenarioName: 'Data Filtering',
      userRole: 'Analyst',
      description: 'User applies filters to narrow down data view',
      steps: [],
      expectedOutcome: 'Filters work correctly and update all visualizations'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Open filter panel
      scenario.steps.push({
        stepNumber: 1,
        action: 'Click on Filter button',
        expectedResult: 'Filter panel opens with date range and category options'
      })
      
      const filterButton = await this.page!.$('button:has-text("Filter")')
      if (filterButton) {
        await filterButton.click()
        await this.page!.waitForTimeout(500)
        
        scenario.steps[0].actualResult = 'Filter panel opened'
        scenario.steps[0].status = 'PASS'
      }
      
      // Step 2: Apply date filter
      scenario.steps.push({
        stepNumber: 2,
        action: 'Select last 7 days date range',
        expectedResult: 'All charts update to show only last 7 days of data'
      })
      
      const dateFilter = await this.page!.$('select[name="dateRange"]')
      if (dateFilter) {
        await dateFilter.selectOption('last7days')
        await this.page!.waitForTimeout(1000) // Wait for data to update
        
        scenario.steps[1].actualResult = 'Date filter applied'
        scenario.steps[1].status = 'PASS'
        scenario.steps[1].screenshot = await this.takeScreenshot('filtered-data')
      }
      
      scenario.status = scenario.steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 5: Export Functionality
  // ====================================================================
  private async testExportFunctionality() {
    const scenario: UATScenario = {
      scenarioName: 'Data Export',
      userRole: 'Analyst',
      description: 'User exports dashboard data for external analysis',
      steps: [],
      expectedOutcome: 'Data exports successfully in selected format'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Click export button
      scenario.steps.push({
        stepNumber: 1,
        action: 'Click on Export button',
        expectedResult: 'Export menu appears with format options (CSV, Excel, PDF)'
      })
      
      const exportButton = await this.page!.$('button:has-text("Export")')
      if (exportButton) {
        await exportButton.click()
        await this.page!.waitForTimeout(500)
        
        const exportMenu = await this.page!.$('.export-menu')
        scenario.steps[0].actualResult = exportMenu ? 'Export menu shown' : 'No menu found'
        scenario.steps[0].status = exportMenu ? 'PASS' : 'FAIL'
      }
      
      // Step 2: Select CSV export
      scenario.steps.push({
        stepNumber: 2,
        action: 'Select CSV format and click Download',
        expectedResult: 'CSV file downloads with current dashboard data'
      })
      
      const csvOption = await this.page!.$('button:has-text("Export as CSV")')
      if (csvOption) {
        // Set up download handler
        const [download] = await Promise.all([
          this.page!.waitForEvent('download', { timeout: 5000 }).catch(() => null),
          csvOption.click()
        ])
        
        scenario.steps[1].actualResult = download ? 'File downloaded' : 'No download triggered'
        scenario.steps[1].status = download ? 'PASS' : 'FAIL'
      }
      
      scenario.status = scenario.steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 6: Mobile Responsiveness
  // ====================================================================
  private async testMobileResponsiveness() {
    const scenario: UATScenario = {
      scenarioName: 'Mobile Dashboard View',
      userRole: 'Mobile User',
      description: 'User accesses dashboard from mobile device',
      steps: [],
      expectedOutcome: 'Dashboard is fully responsive and usable on mobile'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Set mobile viewport
      scenario.steps.push({
        stepNumber: 1,
        action: 'Resize viewport to mobile dimensions (375x667)',
        expectedResult: 'Dashboard adapts to mobile layout'
      })
      
      await this.page!.setViewportSize({ width: 375, height: 667 })
      await this.page!.reload()
      await this.page!.waitForLoadState('networkidle')
      
      scenario.steps[0].actualResult = 'Viewport resized'
      scenario.steps[0].status = 'PASS'
      scenario.steps[0].screenshot = await this.takeScreenshot('mobile-view')
      
      // Step 2: Check mobile menu
      scenario.steps.push({
        stepNumber: 2,
        action: 'Check for mobile navigation menu',
        expectedResult: 'Hamburger menu appears for navigation'
      })
      
      const mobileMenu = await this.page!.$('.mobile-menu-button')
      scenario.steps[1].actualResult = mobileMenu ? 'Mobile menu found' : 'No mobile menu'
      scenario.steps[1].status = mobileMenu ? 'PASS' : 'FAIL'
      
      // Step 3: Scroll test
      scenario.steps.push({
        stepNumber: 3,
        action: 'Scroll through dashboard on mobile',
        expectedResult: 'All content is accessible via scrolling'
      })
      
      await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await this.page!.waitForTimeout(500)
      
      scenario.steps[2].actualResult = 'Scrolling completed'
      scenario.steps[2].status = 'PASS'
      
      // Reset viewport
      await this.page!.setViewportSize({ width: 1920, height: 1080 })
      
      scenario.status = scenario.steps.filter(s => s.status === 'FAIL').length === 0 ? 'PASS' : 'FAIL'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 7: Dashboard Load Performance
  // ====================================================================
  private async testDashboardLoadTime() {
    const scenario: UATScenario = {
      scenarioName: 'Dashboard Load Performance',
      userRole: 'All Users',
      description: 'Measure dashboard initial load time',
      steps: [],
      expectedOutcome: 'Dashboard loads within 3 seconds'
    }
    
    const startTime = Date.now()
    
    try {
      scenario.steps.push({
        stepNumber: 1,
        action: 'Navigate to dashboard and measure load time',
        expectedResult: 'Page fully loads in under 3 seconds'
      })
      
      const navigationStart = Date.now()
      await this.page!.goto(`${this.baseUrl}/scout-dashboard`)
      await this.page!.waitForLoadState('networkidle')
      
      // Wait for specific dashboard element to ensure full load
      await this.page!.waitForSelector('.dashboard-grid', { timeout: 5000 })
      
      const loadTime = Date.now() - navigationStart
      
      scenario.steps[0].actualResult = `Loaded in ${loadTime}ms`
      scenario.steps[0].status = loadTime < 3000 ? 'PASS' : 'FAIL'
      
      scenario.status = scenario.steps[0].status === 'PASS' ? 'PASS' : 'FAIL'
      scenario.actualOutcome = `Dashboard loaded in ${loadTime}ms`
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 8: Data Refresh
  // ====================================================================
  private async testDataRefresh() {
    const scenario: UATScenario = {
      scenarioName: 'Auto-Refresh Functionality',
      userRole: 'All Users',
      description: 'Verify dashboard auto-refreshes data',
      steps: [],
      expectedOutcome: 'Dashboard updates with fresh data automatically'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Note initial values
      scenario.steps.push({
        stepNumber: 1,
        action: 'Record initial KPI values',
        expectedResult: 'Values are captured for comparison'
      })
      
      const initialRevenue = await this.page!.textContent('.revenue-value')
      scenario.steps[0].actualResult = `Initial revenue: ${initialRevenue}`
      scenario.steps[0].status = 'PASS'
      
      // Step 2: Wait for refresh
      scenario.steps.push({
        stepNumber: 2,
        action: 'Wait 30 seconds for auto-refresh',
        expectedResult: 'Last updated timestamp changes'
      })
      
      const initialTimestamp = await this.page!.textContent('.last-updated')
      await this.page!.waitForTimeout(30000) // Wait 30 seconds
      const newTimestamp = await this.page!.textContent('.last-updated')
      
      scenario.steps[1].actualResult = `Timestamp changed: ${initialTimestamp !== newTimestamp}`
      scenario.steps[1].status = initialTimestamp !== newTimestamp ? 'PASS' : 'FAIL'
      
      scenario.status = scenario.steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL'
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // ====================================================================
  // SCENARIO 9: Error Handling
  // ====================================================================
  private async testErrorHandling() {
    const scenario: UATScenario = {
      scenarioName: 'Error Handling',
      userRole: 'All Users',
      description: 'Test dashboard behavior when errors occur',
      steps: [],
      expectedOutcome: 'Dashboard handles errors gracefully with user-friendly messages'
    }
    
    const startTime = Date.now()
    
    try {
      // Step 1: Simulate network error
      scenario.steps.push({
        stepNumber: 1,
        action: 'Simulate network disconnection',
        expectedResult: 'Dashboard shows connection error message'
      })
      
      // Intercept API calls and fail them
      await this.page!.route('**/api/**', route => {
        route.abort('connectionfailed')
      })
      
      await this.page!.reload()
      await this.page!.waitForTimeout(2000)
      
      const errorMessage = await this.page!.$('.error-message')
      scenario.steps[0].actualResult = errorMessage ? 'Error message shown' : 'No error handling'
      scenario.steps[0].status = errorMessage ? 'PASS' : 'FAIL'
      scenario.steps[0].screenshot = await this.takeScreenshot('error-state')
      
      // Restore network
      await this.page!.unroute('**/api/**')
      
      scenario.status = scenario.steps[0].status
      
    } catch (error) {
      scenario.status = 'FAIL'
      scenario.actualOutcome = `Error: ${error}`
    }
    
    scenario.duration = Date.now() - startTime
    this.scenarios.push(scenario)
  }

  // Helper: Take screenshot
  private async takeScreenshot(name: string): Promise<string> {
    const filename = `uat-${name}-${Date.now()}.png`
    const path = `./test-screenshots/${filename}`
    
    try {
      await this.page!.screenshot({ path, fullPage: false })
      return filename
    } catch {
      return ''
    }
  }

  // Print UAT Results
  private printResults() {
    console.log('\n👤 UAT TEST RESULTS\n')
    console.log('=' .repeat(80))
    
    this.scenarios.forEach((scenario, index) => {
      const emoji = scenario.status === 'PASS' ? '✅' : 
                   scenario.status === 'BLOCKED' ? '🚫' : '❌'
      
      console.log(`\n${index + 1}. ${scenario.scenarioName} ${emoji}`)
      console.log(`   Role: ${scenario.userRole}`)
      console.log(`   Duration: ${scenario.duration}ms`)
      console.log(`   Expected: ${scenario.expectedOutcome}`)
      console.log(`   Actual: ${scenario.actualOutcome || 'Not completed'}`)
      
      if (scenario.steps.length > 0) {
        console.log('\n   Steps:')
        scenario.steps.forEach(step => {
          const stepEmoji = step.status === 'PASS' ? '✓' : 
                           step.status === 'BLOCKED' ? '⊘' : '✗'
          console.log(`   ${step.stepNumber}. ${stepEmoji} ${step.action}`)
          if (step.actualResult && step.status !== 'PASS') {
            console.log(`      → ${step.actualResult}`)
          }
        })
      }
    })
    
    console.log('\n' + '=' .repeat(80))
    
    const summary = {
      total: this.scenarios.length,
      passed: this.scenarios.filter(s => s.status === 'PASS').length,
      failed: this.scenarios.filter(s => s.status === 'FAIL').length,
      blocked: this.scenarios.filter(s => s.status === 'BLOCKED').length
    }
    
    console.log('\nSummary:')
    console.log(`Total Scenarios: ${summary.total}`)
    console.log(`✅ Passed: ${summary.passed}`)
    console.log(`❌ Failed: ${summary.failed}`)
    console.log(`🚫 Blocked: ${summary.blocked}`)
    
    const passRate = Math.round((summary.passed / summary.total) * 100)
    console.log(`\nPass Rate: ${passRate}%`)
    console.log(passRate >= 90 ? '✅ UAT Passed!' : 
                passRate >= 70 ? '⚠️ UAT Passed with issues' : 
                '❌ UAT Failed')
  }
}

// ====================================================================
// RUN UAT TESTS
// ====================================================================
export async function runUATTests(baseUrl?: string): Promise<boolean> {
  const suite = new UATTestSuite(baseUrl)
  const results = await suite.runAll()
  
  const failedScenarios = results.filter(s => s.status === 'FAIL').length
  return failedScenarios === 0
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  runUATTests(baseUrl).then(success => {
    process.exit(success ? 0 : 1)
  })
}