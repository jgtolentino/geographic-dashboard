# 📊 Scout Dashboard QA Audit System

## Overview
Complete Quality Assurance system for validating all Scout Dashboard pages and components with real-time data verification.

## Components Created

### 1. SQL Audit Query (`QA_AUDIT_SNAPSHOT.sql`)
Comprehensive SQL query that audits all dashboard components:
- Executive Overview KPIs with growth calculations
- Revenue Trend Chart data (6 months)
- Category Mix distribution
- Regional Performance metrics
- Transaction Trends analysis
- Product Mix statistics
- Consumer Behavior insights
- Consumer Profiling demographics
- Data Availability checks
- RPC Functions validation

### 2. React QA Dashboard (`QA_DASHBOARD_TEST.tsx`)
Interactive dashboard for running real-time QA tests with visual feedback.

## How to Use

### Option 1: Run SQL Audit Query

1. **Run in Supabase SQL Editor**:
   ```sql
   -- Copy contents of QA_AUDIT_SNAPSHOT.sql
   -- Execute in: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new
   ```

2. **Expected Output**:
   - 10 component audit results
   - Each with status (PASS/FAIL)
   - Detailed data for each component
   - Timestamp of audit

### Option 2: Use React QA Dashboard

1. **Add route to your app**:
   ```tsx
   import QADashboardTest from './QA_DASHBOARD_TEST'
   
   // Add to routes
   <Route path="/qa-audit" element={<QADashboardTest />} />
   ```

2. **Access the QA page**:
   - Development: http://localhost:3000/qa-audit
   - Production: https://geographic-dashboard.vercel.app/qa-audit

3. **Run audit**:
   - Click "Run Audit" button
   - View real-time test results
   - Check summary statistics

## QA Test Coverage

### 1. Executive Overview Tests
- ✅ Current month transactions count
- ✅ Total revenue calculation
- ✅ Active stores count
- ✅ Average basket size
- ✅ Month-over-month growth rates

### 2. Chart Data Tests
- ✅ Revenue trend (6 months of data)
- ✅ Category mix percentages
- ✅ Regional performance distribution
- ✅ Hourly transaction patterns

### 3. Module Tests
- ✅ Today's transaction count
- ✅ Product SKU diversity
- ✅ Consumer behavior metrics
- ✅ Demographic profiling

### 4. Data Integrity Tests
- ✅ Data freshness (latest transaction date)
- ✅ Record counts across tables
- ✅ RPC function availability
- ✅ Master data completeness

## Interpreting Results

### Pass Criteria
- **PASS**: Component has data and no errors
- **FAIL**: Component missing data or has errors

### Key Metrics to Monitor
1. **Data Freshness**: Days since last transaction
2. **Coverage**: Number of active stores/regions
3. **Completeness**: SKUs, brands, categories populated
4. **Performance**: RPC functions returning data

## Quick Audit Summary

Based on the executed audit:

| Component | Status | Key Finding |
|-----------|--------|-------------|
| Data Availability | ✅ PASS | 127,138 transactions available |
| Category Performance | ✅ PASS | 11 categories with revenue data |
| Hourly Pattern | ✅ PASS | 21 hours with transaction data |
| Current Month | ⚠️ WARN | No August 2025 data (expected - data ends July 30) |
| RPC Functions | ✅ PASS | Both functions working correctly |

## Automated Testing

### Run via Script
```bash
# Create a test script
cat > run-qa-audit.sh << 'EOF'
#!/bin/bash
echo "Running Scout Dashboard QA Audit..."

# Execute SQL audit
psql $DATABASE_URL -f QA_AUDIT_SNAPSHOT.sql > qa-results.json

# Check for failures
if grep -q "FAIL" qa-results.json; then
  echo "❌ QA Audit found failures"
  exit 1
else
  echo "✅ QA Audit passed"
  exit 0
fi
EOF

chmod +x run-qa-audit.sh
```

### CI/CD Integration
```yaml
# .github/workflows/qa-audit.yml
name: Dashboard QA Audit
on:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours
  workflow_dispatch:

jobs:
  qa-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run QA Audit
        run: ./run-qa-audit.sh
```

## Troubleshooting

### Common Issues

1. **No current month data**:
   - Expected if data doesn't extend to current month
   - Check `data_freshness` for latest available date

2. **RPC functions failing**:
   - Verify functions exist: `\df get_category_performance`
   - Check permissions: Functions need EXECUTE grant to anon

3. **Regional data missing**:
   - Location field may be null or incorrectly formatted
   - Check sample data structure in `location` JSONB field

### Debug Queries

```sql
-- Check data date range
SELECT 
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest,
  COUNT(*) as total_records
FROM scout.silver_transactions_cleaned;

-- Verify RPC functions
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('get_category_performance', 'get_hourly_transaction_pattern');

-- Sample location data
SELECT location, COUNT(*) 
FROM scout.silver_transactions_cleaned 
WHERE location IS NOT NULL 
GROUP BY location 
LIMIT 5;
```

## Success Metrics

Your dashboard QA should achieve:
- ✅ **90%+ Pass Rate** across all components
- ✅ **Data Freshness** within expected range
- ✅ **All RPC Functions** returning data
- ✅ **No Console Errors** in browser
- ✅ **Sub-3s Load Time** for dashboard

## Next Steps

1. Set up automated QA runs
2. Add performance benchmarks
3. Create alerts for failures
4. Expand test coverage as needed
5. Document baseline metrics

The QA system ensures your Scout Dashboard maintains data integrity and functionality across all components!