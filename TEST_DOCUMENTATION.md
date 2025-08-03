# 🧪 Scout Dashboard Test Suite Documentation

## Overview
Comprehensive testing framework for Scout Dashboard v5, covering smoke tests, sanity checks, unit tests, and user acceptance testing (UAT).

## Test Types

### 1. 🔥 Smoke Tests (`tests/smoke-tests.ts`)
**Purpose**: Quick validation of critical functionality
**Duration**: ~10 seconds

Tests include:
- Database Connection
- Authentication Key Validity
- Critical Tables Access
- RPC Functions
- Data Availability
- Dashboard Load

**Run**: `npm run test:smoke`

### 2. 🧠 Sanity Tests (`tests/sanity-tests.ts`)
**Purpose**: Verify system is in a sane state
**Duration**: ~30 seconds

Checks include:
- Environment Variables
- Supabase Configuration
- Data Integrity
- Date Range Validity
- Null Values in Critical Fields
- Business Rules Validation
- Calculation Accuracy
- Response Times
- Data Volumes
- Permissions
- RLS Policies

**Run**: `npm run test:sanity`

### 3. 🔬 Unit Tests (`tests/unit-tests.test.ts`)
**Purpose**: Test individual components and functions
**Duration**: ~20 seconds

Tests cover:
- `useExecutiveOverview` - KPI calculations
- `useRevenueTrend` - Monthly grouping
- `useCategoryMix` - Percentage calculations
- `useRegionalPerformance` - Regional grouping
- `useTransactionTrends` - Today's transactions
- `useProductMix` - SKU/Brand counting
- `useConsumerBehavior` - Behavior metrics
- `useConsumerProfiling` - Demographics analysis
- Data transformation utilities
- Error handling

**Run**: `npm run test:unit`

### 4. 👤 UAT Tests (`tests/uat-scenarios.ts`)
**Purpose**: End-to-end user scenarios
**Duration**: ~2 minutes
**Requirements**: Running application

Scenarios:
1. Executive Dashboard View
2. KPI Card Interactions
3. Interactive Charts
4. Data Filtering
5. Export Functionality
6. Mobile Responsiveness
7. Dashboard Load Performance
8. Auto-Refresh Functionality
9. Error Handling

**Run**: `npm run test:uat`

## Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm run test:smoke
npm run test:sanity
npm run test:unit
npm run test:uat
```

### Test Runner Options
```bash
# Run all tests
npm run test:all

# Skip specific test types
npm run test:all -- --no-uat

# Specify base URL for UAT
npm run test:all -- --url=https://staging.example.com

# Set environment
npm run test:all -- --env=staging

# CI mode
npm run test:ci
```

### Development Mode
```bash
# Watch unit tests
npm run test:unit:watch

# Run QA dashboard
npm run test:qa
```

## Test Results

### Output Location
- Test reports: `./test-results/test-report-[timestamp].json`
- Screenshots: `./test-screenshots/`
- Coverage: `./coverage/`

### Report Format
```json
{
  "timestamp": "2025-08-03T...",
  "duration": 120000,
  "environment": "development",
  "suites": [
    {
      "name": "Smoke Tests",
      "type": "smoke",
      "status": "PASS",
      "passCount": 6,
      "failCount": 0
    }
  ],
  "summary": {
    "overallStatus": "PASS",
    "confidence": 95
  },
  "recommendations": []
}
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run test:smoke
```

## Interpreting Results

### Status Indicators
- ✅ **PASS**: Test successful
- ⚠️ **WARN**: Test passed with warnings
- ❌ **FAIL**: Test failed
- 🚫 **BLOCKED**: Test couldn't run

### Confidence Score
- **90-100%**: Excellent - Ready for production
- **70-89%**: Good - Minor issues to address
- **50-69%**: Fair - Significant issues
- **Below 50%**: Poor - Critical issues

### Common Issues

#### Smoke Test Failures
```
❌ Database Connection FAIL
   Error: Invalid anon key
   
Solution: Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
```

#### Sanity Check Warnings
```
⚠️ Data Volume WARN
   Only 500 records found (minimum 1000 expected)
   
Solution: Ensure test data is properly seeded
```

#### Unit Test Failures
```
❌ useExecutiveOverview > should calculate KPIs correctly
   Expected: 1000000
   Received: 0
   
Solution: Check mock data setup
```

#### UAT Failures
```
❌ Dashboard Load Performance FAIL
   Loaded in 5234ms (expected < 3000ms)
   
Solution: Optimize queries and component rendering
```

## Best Practices

### Writing New Tests

#### Smoke Test
```typescript
private async testNewFeature() {
  const start = Date.now()
  try {
    const { data, error } = await supabase
      .from('new_table')
      .select('id')
      .limit(1)
    
    this.results.push({
      testName: 'New Feature Check',
      status: error ? 'FAIL' : 'PASS',
      duration: Date.now() - start,
      error: error?.message
    })
  } catch (err) {
    // Handle error
  }
}
```

#### Unit Test
```typescript
describe('useNewHook', () => {
  test('should return expected data', async () => {
    const { result } = renderHook(() => useNewHook())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBeDefined()
    expect(result.current.error).toBeNull()
  })
})
```

#### UAT Scenario
```typescript
private async testNewScenario() {
  const scenario: UATScenario = {
    scenarioName: 'New Feature Interaction',
    userRole: 'User',
    description: 'User interacts with new feature',
    steps: [],
    expectedOutcome: 'Feature works as expected'
  }
  
  // Add steps and validations
  this.scenarios.push(scenario)
}
```

### Test Data Management
1. Use consistent test data across all suites
2. Clean up test data after UAT runs
3. Mock external services in unit tests
4. Use realistic data volumes in performance tests

### Debugging Failed Tests
1. Check test logs in `./test-results/`
2. Review screenshots in `./test-screenshots/`
3. Run individual test suites for isolation
4. Use `--verbose` flag for detailed output
5. Check browser console for client-side errors

## Maintenance

### Regular Tasks
- Update test data monthly
- Review and update UAT scenarios quarterly
- Monitor test execution times
- Update dependencies regularly
- Archive old test results

### Adding New Tests
1. Identify test category (smoke/sanity/unit/UAT)
2. Add test to appropriate file
3. Update test counts in documentation
4. Run full test suite to verify
5. Update CI configuration if needed

## Quick Reference

```bash
# Development workflow
npm run dev                    # Start dev server
npm run test:unit:watch       # Watch unit tests
npm run test:smoke            # Quick validation

# Pre-deployment
npm run test:all              # Full test suite
npm run test:qa               # Visual QA check

# Debugging
npm run test:smoke -- --verbose
npm run test:uat -- --url=http://localhost:3001

# CI/CD
npm run test:ci               # Optimized for CI
```

## Support

For test-related issues:
1. Check test logs for detailed errors
2. Review this documentation
3. Check GitHub issues for known problems
4. Contact the development team

Remember: A passing test suite gives confidence in deployments!