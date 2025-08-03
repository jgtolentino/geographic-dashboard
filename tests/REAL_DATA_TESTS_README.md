# 🔬 Unit Tests with Real Supabase Data

## Overview
These unit tests connect to the actual Supabase database and test all 8 data service hooks with real production data. This ensures our hooks work correctly with the actual data structure and volumes.

## Test Coverage

### 1. Executive Overview (`useExecutiveOverview`)
- ✅ Fetches actual KPIs from database
- ✅ Calculates month-over-month growth
- ✅ Validates all metrics are positive
- ✅ Tests load performance (< 2 seconds)

### 2. Revenue Trend (`useRevenueTrend`)
- ✅ Fetches 6 months of revenue data
- ✅ Verifies chronological order
- ✅ Validates date ranges
- ✅ Checks data completeness

### 3. Category Mix (`useCategoryMix`)
- ✅ Fetches from RPC function `get_category_performance`
- ✅ Verifies percentages sum to 100%
- ✅ Tests category ranking
- ✅ Validates positive values

### 4. Regional Performance (`useRegionalPerformance`)
- ✅ Groups transactions by region
- ✅ Calculates regional metrics
- ✅ Tests growth calculations
- ✅ Finds top performing regions

### 5. Transaction Trends (`useTransactionTrends`)
- ✅ Fetches hourly patterns from RPC
- ✅ Calculates today's transactions
- ✅ Identifies peak hours
- ✅ Weekly aggregations

### 6. Product Mix (`useProductMix`)
- ✅ Counts unique SKUs
- ✅ Counts brands and categories
- ✅ Identifies top products
- ✅ Tests diversity metrics

### 7. Consumer Behavior (`useConsumerBehavior`)
- ✅ Calculates branded request %
- ✅ Measures suggestion acceptance
- ✅ Analyzes dwell time
- ✅ Validates percentage bounds

### 8. Consumer Profiling (`useConsumerProfiling`)
- ✅ Analyzes gender distribution
- ✅ Age bracket analysis
- ✅ Economic class distribution
- ✅ Unique customer counts

## Running the Tests

```bash
# Run all unit tests with real data
npm run test:unit:real

# Run in watch mode for development
npm run test:unit:real -- --watch

# Run with coverage report
npm run test:unit:real -- --coverage

# Run specific test suite
npm run test:unit:real -- -t "useExecutiveOverview"
```

## Test Results Example

```
✅ Executive KPIs:
   revenue: ₱44.78M
   transactions: 127,138
   stores: 1,000
   avgBasket: 3.74

✅ Growth Rates:
   revenue: -8%
   transactions: -7%
   stores: 0%
   basket: -1%

✅ Top 5 Categories:
   1. Snacks - 18.5% (₱15.82M)
   2. Personal Care - 17.8% (₱15.22M)
   3. Beverages - 15.2% (₱13.01M)
   4. Home Care - 9.4% (₱8.04M)
   5. Frozen - 8.8% (₱7.53M)

✅ Top Region:
   name: Unknown
   revenue: ₱44.78M
   transactions: 127,138
   growth: -8%

✅ Transaction Patterns:
   today: 0
   thisWeek: 0
   peakHour: 11:00 (8,211 transactions)

✅ Product Mix:
   SKUs: 4,863
   brands: 451
   categories: 11
   topProduct: N/A

✅ Consumer Behavior:
   brandedRequests: 64.5%
   suggestionAcceptance: 66.2%
   avgDwellTime: 78s
   repeatCustomers: 0.0%

✅ Consumer Profile:
   topGender: Unknown
   topAgeGroup: Unknown
   uniqueCustomers: 8,846
```

## Data Validation Tests

### Consistency Checks
- Totals across different hooks match
- Date ranges are valid
- Percentages sum correctly
- No negative values for counts

### Performance Tests
- Executive Overview loads < 2 seconds
- Concurrent hooks load < 3 seconds
- RPC functions respond quickly

### Error Handling
- Network timeouts handled gracefully
- Missing data doesn't crash hooks
- Retry functionality works

## Environment Setup

The tests use these environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Common Issues

### 1. Connection Timeout
```
Error: Database connection failed: Failed to fetch
```
**Solution**: Check internet connection and Supabase status

### 2. RPC Function Not Found
```
Error: Could not find the function get_category_performance
```
**Solution**: Ensure RPC functions are deployed to Supabase

### 3. Empty Data
```
Expected: > 0
Received: 0
```
**Solution**: Verify data exists in the test date range

## Best Practices

1. **Run Before Deployment**: Always run real data tests before deploying
2. **Monitor Performance**: Watch for slow queries (> 2s)
3. **Check Data Quality**: Validate data completeness
4. **Test Edge Cases**: Handle empty results gracefully

## Integration with CI/CD

```yaml
# .github/workflows/test.yml
- name: Run Real Data Tests
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  run: npm run test:unit:real
```

## Debugging

Enable verbose logging:
```bash
DEBUG=* npm run test:unit:real
```

Check specific hook:
```bash
npm run test:unit:real -- -t "useRevenueTrend"
```

## Summary

These real data tests ensure:
- ✅ Hooks work with actual database
- ✅ Data calculations are correct
- ✅ Performance is acceptable
- ✅ Error handling works
- ✅ Data quality is maintained

Run these tests regularly to catch issues early!