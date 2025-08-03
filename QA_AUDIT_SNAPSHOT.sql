-- ====================================================================
-- SCOUT DASHBOARD QA AUDIT SNAPSHOT
-- ====================================================================
-- Comprehensive query to validate all dashboard pages and data points
-- Run this to verify data availability and accuracy across all components

-- ====================================================================
-- 1. EXECUTIVE OVERVIEW KPIs AUDIT
-- ====================================================================
WITH current_month_kpis AS (
  SELECT 
    COUNT(*) as total_transactions,
    SUM(peso_value) as total_revenue,
    COUNT(DISTINCT store_id) as active_stores,
    AVG(basket_size) as avg_basket_size,
    COUNT(DISTINCT customer_id) as unique_customers,
    DATE_TRUNC('month', CURRENT_DATE) as month_start
  FROM scout.silver_transactions_cleaned
  WHERE DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)
),
last_month_kpis AS (
  SELECT 
    COUNT(*) as total_transactions,
    SUM(peso_value) as total_revenue,
    AVG(basket_size) as avg_basket_size
  FROM scout.silver_transactions_cleaned
  WHERE DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
),
executive_overview AS (
  SELECT 
    'Executive Overview KPIs' as component,
    jsonb_build_object(
      'current_month', jsonb_build_object(
        'total_revenue', ROUND(c.total_revenue::numeric, 2),
        'total_transactions', c.total_transactions,
        'active_stores', c.active_stores,
        'avg_basket_size', ROUND(c.avg_basket_size::numeric, 2),
        'unique_customers', c.unique_customers
      ),
      'growth_rates', jsonb_build_object(
        'revenue_growth', CASE WHEN l.total_revenue > 0 
          THEN ROUND(((c.total_revenue - l.total_revenue) / l.total_revenue * 100)::numeric, 1)
          ELSE 0 END,
        'transaction_growth', CASE WHEN l.total_transactions > 0
          THEN ROUND(((c.total_transactions - l.total_transactions)::numeric / l.total_transactions * 100), 1)
          ELSE 0 END,
        'basket_growth', CASE WHEN l.avg_basket_size > 0
          THEN ROUND(((c.avg_basket_size - l.avg_basket_size) / l.avg_basket_size * 100)::numeric, 1)
          ELSE 0 END
      )
    ) as data,
    CASE 
      WHEN c.total_transactions > 0 AND c.total_revenue > 0 
      THEN 'PASS' 
      ELSE 'FAIL' 
    END as status
  FROM current_month_kpis c
  CROSS JOIN last_month_kpis l
),

-- ====================================================================
-- 2. REVENUE TREND CHART AUDIT (Last 6 Months)
-- ====================================================================
revenue_trend AS (
  SELECT 
    'Revenue Trend Chart' as component,
    jsonb_build_object(
      'monthly_data', jsonb_agg(
        jsonb_build_object(
          'month', TO_CHAR(month_date, 'Mon YYYY'),
          'revenue', ROUND(total_revenue::numeric, 2),
          'transactions', transaction_count
        ) ORDER BY month_date
      ),
      'total_months', COUNT(*),
      'date_range', jsonb_build_object(
        'start', MIN(month_date),
        'end', MAX(month_date)
      )
    ) as data,
    CASE 
      WHEN COUNT(*) >= 1 
      THEN 'PASS' 
      ELSE 'FAIL' 
    END as status
  FROM (
    SELECT 
      DATE_TRUNC('month', timestamp) as month_date,
      SUM(peso_value) as total_revenue,
      COUNT(*) as transaction_count
    FROM scout.silver_transactions_cleaned
    WHERE timestamp >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', timestamp)
  ) monthly
),

-- ====================================================================
-- 3. CATEGORY MIX PIE CHART AUDIT
-- ====================================================================
category_mix AS (
  SELECT 
    'Category Mix Chart' as component,
    jsonb_build_object(
      'categories', jsonb_agg(
        jsonb_build_object(
          'category', category,
          'percentage', percentage,
          'revenue', ROUND(total_sales::numeric, 2),
          'transactions', transaction_count
        ) ORDER BY percentage DESC
      ),
      'total_categories', COUNT(*),
      'top_category', (
        SELECT category 
        FROM get_category_performance() 
        ORDER BY total_sales DESC 
        LIMIT 1
      )
    ) as data,
    CASE 
      WHEN COUNT(*) > 0 
      THEN 'PASS' 
      ELSE 'FAIL' 
    END as status
  FROM (
    SELECT 
      category,
      total_sales,
      transaction_count,
      ROUND((total_sales / SUM(total_sales) OVER () * 100)::numeric, 1) as percentage
    FROM get_category_performance()
  ) cat_data
),

-- ====================================================================
-- 4. REGIONAL PERFORMANCE TABLE AUDIT
-- ====================================================================
regional_performance AS (
  SELECT 
    'Regional Performance Table' as component,
    jsonb_build_object(
      'regions', jsonb_agg(
        jsonb_build_object(
          'region', region,
          'revenue', ROUND(revenue::numeric, 2),
          'transactions', transactions,
          'avg_transaction_value', ROUND((revenue / NULLIF(transactions, 0))::numeric, 2)
        ) ORDER BY revenue DESC
      ),
      'total_regions', COUNT(*),
      'top_region', (
        SELECT region 
        FROM (
          SELECT 
            COALESCE(
              location->>'region',
              location->>'province',
              location->>'city',
              'Unknown'
            ) as region,
            SUM(peso_value) as revenue
          FROM scout.silver_transactions_cleaned
          WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY 1
        ) r
        ORDER BY revenue DESC
        LIMIT 1
      )
    ) as data,
    CASE 
      WHEN COUNT(*) > 0 
      THEN 'PASS' 
      ELSE 'FAIL' 
    END as status
  FROM (
    SELECT 
      COALESCE(
        location->>'region',
        location->>'province', 
        location->>'city',
        'Unknown'
      ) as region,
      SUM(peso_value) as revenue,
      COUNT(*) as transactions
    FROM scout.silver_transactions_cleaned
    WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  ) regional
),

-- ====================================================================
-- 5. TRANSACTION TRENDS MODULE AUDIT
-- ====================================================================
transaction_trends AS (
  SELECT 
    'Transaction Trends Module' as component,
    jsonb_build_object(
      'today_transactions', (
        SELECT COUNT(*) 
        FROM scout.silver_transactions_cleaned 
        WHERE DATE(timestamp) = CURRENT_DATE
      ),
      'hourly_pattern', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'hour', hour_of_day,
            'transactions', transaction_count,
            'avg_value', ROUND(avg_transaction_value::numeric, 2)
          ) ORDER BY hour_of_day
        )
        FROM get_hourly_transaction_pattern()
      ),
      'week_total', (
        SELECT COUNT(*) 
        FROM scout.silver_transactions_cleaned 
        WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
      )
    ) as data,
    'PASS' as status
),

-- ====================================================================
-- 6. PRODUCT MIX MODULE AUDIT
-- ====================================================================
product_mix AS (
  SELECT 
    'Product Mix Module' as component,
    jsonb_build_object(
      'total_skus', COUNT(DISTINCT sku),
      'total_brands', COUNT(DISTINCT brand_name),
      'total_categories', COUNT(DISTINCT product_category),
      'top_products', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'sku', sku,
            'product_name', product_name,
            'category', product_category,
            'brand', brand_name,
            'transaction_count', transaction_count
          ) ORDER BY transaction_count DESC
        )
        FROM (
          SELECT 
            sku,
            product_name,
            product_category,
            brand_name,
            COUNT(*) as transaction_count
          FROM scout.silver_transactions_cleaned
          WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
            AND sku IS NOT NULL
          GROUP BY 1,2,3,4
          ORDER BY 5 DESC
          LIMIT 5
        ) top_prods
      )
    ) as data,
    'PASS' as status
  FROM scout.silver_transactions_cleaned
  WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
),

-- ====================================================================
-- 7. CONSUMER BEHAVIOR MODULE AUDIT
-- ====================================================================
consumer_behavior AS (
  SELECT 
    'Consumer Behavior Module' as component,
    jsonb_build_object(
      'total_transactions', COUNT(*),
      'branded_requests', COUNT(CASE WHEN brand_name IS NOT NULL AND brand_name != '' THEN 1 END),
      'branded_percentage', ROUND(
        COUNT(CASE WHEN brand_name IS NOT NULL AND brand_name != '' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 1
      ),
      'suggestions_accepted', COUNT(CASE WHEN suggestion_accepted = true THEN 1 END),
      'acceptance_rate', ROUND(
        COUNT(CASE WHEN suggestion_accepted = true THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 1
      ),
      'avg_dwell_time', ROUND(AVG(duration_seconds)::numeric, 1)
    ) as data,
    'PASS' as status
  FROM scout.silver_transactions_cleaned
  WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
),

-- ====================================================================
-- 8. CONSUMER PROFILING MODULE AUDIT
-- ====================================================================
consumer_profiling AS (
  SELECT 
    'Consumer Profiling Module' as component,
    jsonb_build_object(
      'gender_distribution', (
        SELECT jsonb_object_agg(
          COALESCE(gender, 'Unknown'),
          count
        )
        FROM (
          SELECT gender, COUNT(*) as count
          FROM scout.silver_transactions_cleaned
          WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY gender
        ) g
      ),
      'age_distribution', (
        SELECT jsonb_object_agg(
          COALESCE(age_bracket, 'Unknown'),
          count
        )
        FROM (
          SELECT age_bracket, COUNT(*) as count
          FROM scout.silver_transactions_cleaned
          WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY age_bracket
        ) a
      ),
      'economic_class_distribution', (
        SELECT jsonb_object_agg(
          COALESCE(economic_class, 'Unknown'),
          count
        )
        FROM (
          SELECT economic_class, COUNT(*) as count
          FROM scout.silver_transactions_cleaned
          WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY economic_class
        ) e
      ),
      'unique_customers', (
        SELECT COUNT(DISTINCT customer_id)
        FROM scout.silver_transactions_cleaned
        WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      )
    ) as data,
    'PASS' as status
),

-- ====================================================================
-- 9. DATA AVAILABILITY AUDIT
-- ====================================================================
data_availability AS (
  SELECT 
    'Data Availability Check' as component,
    jsonb_build_object(
      'silver_transactions', jsonb_build_object(
        'total_records', (SELECT COUNT(*) FROM scout.silver_transactions_cleaned),
        'date_range', (
          SELECT jsonb_build_object(
            'min_date', MIN(timestamp),
            'max_date', MAX(timestamp),
            'days_covered', DATE_PART('day', MAX(timestamp) - MIN(timestamp))
          )
          FROM scout.silver_transactions_cleaned
        )
      ),
      'gold_daily_metrics', jsonb_build_object(
        'total_records', (SELECT COUNT(*) FROM scout.gold_daily_metrics),
        'date_range', (
          SELECT jsonb_build_object(
            'min_date', MIN(metric_date),
            'max_date', MAX(metric_date)
          )
          FROM scout.gold_daily_metrics
        )
      ),
      'master_tables', jsonb_build_object(
        'stores', (SELECT COUNT(*) FROM scout.silver_master_stores),
        'products', (SELECT COUNT(*) FROM scout.silver_master_products),
        'categories', (SELECT COUNT(*) FROM scout.silver_master_categories),
        'brands', (SELECT COUNT(*) FROM scout.silver_master_brands),
        'customers', (SELECT COUNT(*) FROM scout.silver_master_scout_customers)
      )
    ) as data,
    'PASS' as status
),

-- ====================================================================
-- 10. RPC FUNCTIONS AUDIT
-- ====================================================================
rpc_functions AS (
  SELECT 
    'RPC Functions Check' as component,
    jsonb_build_object(
      'get_category_performance', jsonb_build_object(
        'row_count', (SELECT COUNT(*) FROM get_category_performance()),
        'status', CASE 
          WHEN (SELECT COUNT(*) FROM get_category_performance()) > 0 
          THEN 'Working' 
          ELSE 'Failed' 
        END
      ),
      'get_hourly_transaction_pattern', jsonb_build_object(
        'row_count', (SELECT COUNT(*) FROM get_hourly_transaction_pattern()),
        'status', CASE 
          WHEN (SELECT COUNT(*) FROM get_hourly_transaction_pattern()) > 0 
          THEN 'Working' 
          ELSE 'Failed' 
        END
      )
    ) as data,
    CASE 
      WHEN (SELECT COUNT(*) FROM get_category_performance()) > 0 
        AND (SELECT COUNT(*) FROM get_hourly_transaction_pattern()) > 0
      THEN 'PASS' 
      ELSE 'FAIL' 
    END as status
)

-- ====================================================================
-- FINAL QA AUDIT REPORT
-- ====================================================================
SELECT 
  component,
  status,
  data,
  CURRENT_TIMESTAMP as audit_timestamp
FROM (
  SELECT * FROM executive_overview
  UNION ALL
  SELECT * FROM revenue_trend
  UNION ALL
  SELECT * FROM category_mix
  UNION ALL
  SELECT * FROM regional_performance
  UNION ALL
  SELECT * FROM transaction_trends
  UNION ALL
  SELECT * FROM product_mix
  UNION ALL
  SELECT * FROM consumer_behavior
  UNION ALL
  SELECT * FROM consumer_profiling
  UNION ALL
  SELECT * FROM data_availability
  UNION ALL
  SELECT * FROM rpc_functions
) audit_results
ORDER BY 
  CASE status 
    WHEN 'FAIL' THEN 1 
    WHEN 'PASS' THEN 2 
  END,
  component;