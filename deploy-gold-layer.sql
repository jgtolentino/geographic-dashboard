-- ====================================================================
-- SCOUT DASHBOARD GOLD LAYER DEPLOYMENT
-- ====================================================================
-- Instructions:
-- 1. Go to https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new
-- 2. Copy and paste this entire SQL file
-- 3. Click "Run" to create all Gold layer views
-- ====================================================================

-- Create gold schema if not exists
CREATE SCHEMA IF NOT EXISTS gold;

-- Grant permissions
GRANT USAGE ON SCHEMA gold TO anon, authenticated;

-- ====================================================================
-- 1. EXECUTIVE SUMMARY - Real-time KPIs
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_executive AS
WITH current_period AS (
  SELECT 
    COUNT(*) as total_transactions,
    SUM(peso_value) as total_revenue,
    COUNT(DISTINCT store_id) as active_stores,
    COUNT(DISTINCT sku_name) as active_products,
    COUNT(DISTINCT brand_name) as active_brands,
    AVG(peso_value) as avg_transaction_value,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) as suggestion_acceptance_rate,
    AVG(duration_seconds) as avg_dwell_time
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
),
previous_period AS (
  SELECT 
    COUNT(*) as total_transactions,
    SUM(peso_value) as total_revenue
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '60 days' 
    AND transaction_date < CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  cp.total_transactions,
  cp.total_revenue,
  cp.active_stores,
  cp.active_products,
  cp.active_brands,
  cp.avg_transaction_value,
  cp.suggestion_acceptance_rate * 100 as suggestion_acceptance_pct,
  cp.avg_dwell_time,
  CASE 
    WHEN pp.total_revenue > 0 THEN 
      ((cp.total_revenue - pp.total_revenue) / pp.total_revenue * 100)
    ELSE 0 
  END as revenue_growth_pct,
  CASE 
    WHEN pp.total_transactions > 0 THEN 
      ((cp.total_transactions - pp.total_transactions)::FLOAT / pp.total_transactions * 100)
    ELSE 0 
  END as transaction_growth_pct,
  NOW() as last_updated
FROM current_period cp, previous_period pp;

-- ====================================================================
-- 2. REGIONAL PERFORMANCE - Market Intelligence
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_regions AS
WITH regional_stats AS (
  SELECT 
    COALESCE(
      (location->>'region')::TEXT, 
      (location->>'province')::TEXT,
      (location->>'city')::TEXT,
      'Unknown'
    ) as region_name,
    COUNT(*) as transactions,
    SUM(peso_value) as revenue,
    COUNT(DISTINCT store_id) as stores,
    AVG(peso_value) as avg_transaction_value,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as acceptance_rate
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY 1
),
regional_growth AS (
  SELECT 
    COALESCE(
      (location->>'region')::TEXT, 
      (location->>'province')::TEXT,
      (location->>'city')::TEXT,
      'Unknown'
    ) as region_name,
    SUM(CASE 
      WHEN transaction_date >= CURRENT_DATE - INTERVAL '7 days' THEN peso_value 
      ELSE 0 
    END) as last_7_days_revenue,
    SUM(CASE 
      WHEN transaction_date >= CURRENT_DATE - INTERVAL '14 days' 
        AND transaction_date < CURRENT_DATE - INTERVAL '7 days' THEN peso_value 
      ELSE 0 
    END) as prev_7_days_revenue
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '14 days'
  GROUP BY 1
)
SELECT 
  rs.region_name,
  rs.transactions,
  rs.revenue,
  rs.stores,
  rs.avg_transaction_value,
  rs.unique_customers,
  rs.acceptance_rate,
  CASE 
    WHEN rg.prev_7_days_revenue > 0 THEN 
      ((rg.last_7_days_revenue - rg.prev_7_days_revenue) / rg.prev_7_days_revenue * 100)
    ELSE 0 
  END as growth_rate_pct,
  CASE 
    WHEN rs.revenue > 100000 THEN 'Tier 1'
    WHEN rs.revenue > 50000 THEN 'Tier 2'
    ELSE 'Tier 3'
  END as market_tier,
  RANK() OVER (ORDER BY rs.revenue DESC) as revenue_rank
FROM regional_stats rs
LEFT JOIN regional_growth rg ON rs.region_name = rg.region_name
ORDER BY rs.revenue DESC;

-- ====================================================================
-- 3. TRANSACTION INSIGHTS - Time-based Analytics
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_transactions AS
WITH daily_metrics AS (
  SELECT 
    transaction_date,
    COUNT(*) as transactions,
    SUM(peso_value) as revenue,
    AVG(peso_value) as avg_value,
    COUNT(DISTINCT store_id) as active_stores,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as acceptance_rate
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY transaction_date
),
hourly_patterns AS (
  SELECT 
    EXTRACT(HOUR FROM timestamp) as hour_of_day,
    COUNT(*) as transactions,
    AVG(peso_value) as avg_value,
    SUM(peso_value) as revenue
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY 1
),
category_performance AS (
  SELECT 
    product_category,
    COUNT(*) as transactions,
    SUM(peso_value) as revenue,
    AVG(peso_value) as avg_value,
    COUNT(DISTINCT sku_name) as unique_products
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY product_category
)
SELECT 
  (SELECT json_agg(row_to_json(d)) FROM daily_metrics d) as daily_trends,
  (SELECT json_agg(row_to_json(h) ORDER BY h.hour_of_day) FROM hourly_patterns h) as hourly_patterns,
  (SELECT json_agg(row_to_json(c) ORDER BY c.revenue DESC) FROM category_performance c) as category_breakdown,
  NOW() as generated_at;

-- ====================================================================
-- 4. BRAND PERFORMANCE - Campaign Analytics
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_brands AS
WITH brand_metrics AS (
  SELECT 
    brand_name,
    company_name,
    COUNT(*) as transactions,
    SUM(peso_value) as revenue,
    COUNT(DISTINCT store_id) as store_reach,
    COUNT(DISTINCT customer_id) as customer_reach,
    AVG(peso_value) as avg_transaction_value,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as acceptance_rate
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    AND brand_name IS NOT NULL
  GROUP BY brand_name, company_name
),
brand_growth AS (
  SELECT 
    brand_name,
    SUM(CASE 
      WHEN transaction_date >= CURRENT_DATE - INTERVAL '7 days' THEN peso_value 
      ELSE 0 
    END) as last_week_revenue,
    SUM(CASE 
      WHEN transaction_date >= CURRENT_DATE - INTERVAL '14 days' 
        AND transaction_date < CURRENT_DATE - INTERVAL '7 days' THEN peso_value 
      ELSE 0 
    END) as prev_week_revenue
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '14 days'
    AND brand_name IS NOT NULL
  GROUP BY brand_name
)
SELECT 
  bm.brand_name,
  bm.company_name,
  bm.transactions,
  bm.revenue,
  bm.store_reach,
  bm.customer_reach,
  bm.avg_transaction_value,
  bm.acceptance_rate,
  CASE 
    WHEN bg.prev_week_revenue > 0 THEN 
      ((bg.last_week_revenue - bg.prev_week_revenue) / bg.prev_week_revenue * 100)
    ELSE 0 
  END as weekly_growth_pct,
  RANK() OVER (ORDER BY bm.revenue DESC) as revenue_rank,
  CASE 
    WHEN bm.acceptance_rate > 80 THEN 'High Engagement'
    WHEN bm.acceptance_rate > 60 THEN 'Medium Engagement'
    ELSE 'Low Engagement'
  END as engagement_level
FROM brand_metrics bm
LEFT JOIN brand_growth bg ON bm.brand_name = bg.brand_name
ORDER BY bm.revenue DESC;

-- ====================================================================
-- 5. LOCATION INTELLIGENCE - Store & Venue Analytics
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_locations AS
WITH location_metrics AS (
  SELECT 
    store_id,
    store_name,
    COALESCE(
      (location->>'city')::TEXT,
      (location->>'province')::TEXT,
      'Unknown'
    ) as city,
    COUNT(*) as transactions,
    SUM(peso_value) as revenue,
    COUNT(DISTINCT customer_id) as unique_customers,
    AVG(peso_value) as avg_transaction_value,
    COUNT(DISTINCT DATE(timestamp)) as active_days,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as acceptance_rate
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY store_id, store_name, city
),
location_segments AS (
  SELECT 
    *,
    CASE 
      WHEN revenue > 100000 THEN 'High Value'
      WHEN revenue > 50000 THEN 'Medium Value'
      ELSE 'Standard Value'
    END as value_segment,
    CASE 
      WHEN transactions > 1000 THEN 'High Volume'
      WHEN transactions > 500 THEN 'Medium Volume'
      ELSE 'Low Volume'
    END as volume_segment
  FROM location_metrics
)
SELECT 
  *,
  RANK() OVER (ORDER BY revenue DESC) as revenue_rank,
  RANK() OVER (PARTITION BY city ORDER BY revenue DESC) as city_rank,
  CASE 
    WHEN value_segment = 'High Value' AND volume_segment = 'High Volume' THEN 'Star Location'
    WHEN value_segment = 'High Value' OR volume_segment = 'High Volume' THEN 'Growth Location'
    ELSE 'Standard Location'
  END as location_type,
  CASE 
    WHEN acceptance_rate > 75 AND unique_customers > 100 THEN 'High'
    WHEN acceptance_rate > 60 OR unique_customers > 50 THEN 'Medium'
    ELSE 'Low'
  END as opportunity_score
FROM location_segments
ORDER BY revenue DESC;

-- ====================================================================
-- 6. CUSTOMER INTELLIGENCE - Behavioral Segments
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_customers AS
WITH customer_metrics AS (
  SELECT 
    customer_age,
    customer_gender,
    COUNT(*) as segment_size,
    AVG(peso_value) as avg_transaction_value,
    SUM(peso_value) as total_revenue,
    COUNT(DISTINCT store_id) as stores_visited,
    COUNT(DISTINCT brand_name) as brands_purchased,
    SUM(CASE WHEN suggestion_accepted THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as acceptance_rate,
    AVG(duration_seconds) as avg_dwell_time
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    AND customer_age IS NOT NULL
  GROUP BY customer_age, customer_gender
),
age_group_ranks AS (
  SELECT 
    customer_age,
    SUM(segment_size) as total_size,
    SUM(total_revenue) as total_revenue,
    AVG(acceptance_rate) as avg_acceptance_rate
  FROM customer_metrics
  GROUP BY customer_age
)
SELECT 
  cm.*,
  agr.total_size as age_group_size,
  (cm.segment_size::FLOAT / agr.total_size * 100) as segment_share_pct,
  RANK() OVER (ORDER BY cm.total_revenue DESC) as revenue_rank,
  CASE 
    WHEN cm.avg_transaction_value > 200 THEN 'Premium'
    WHEN cm.avg_transaction_value > 100 THEN 'Standard'
    ELSE 'Value'
  END as customer_tier,
  CASE 
    WHEN cm.acceptance_rate > 80 AND cm.brands_purchased > 5 THEN 'Brand Explorer'
    WHEN cm.acceptance_rate > 80 THEN 'Engaged Shopper'
    WHEN cm.brands_purchased > 5 THEN 'Brand Conscious'
    ELSE 'Traditional Shopper'
  END as behavior_segment
FROM customer_metrics cm
JOIN age_group_ranks agr ON cm.customer_age = agr.customer_age
ORDER BY cm.total_revenue DESC;

-- ====================================================================
-- 7. PREDICTIVE INSIGHTS - ML-Ready Features
-- ====================================================================
CREATE OR REPLACE VIEW gold.scout_dashboard_predictions AS
WITH weekly_trends AS (
  SELECT 
    DATE_TRUNC('week', transaction_date) as week_start,
    COUNT(*) as transactions,
    SUM(peso_value) as revenue,
    COUNT(DISTINCT customer_id) as unique_customers
  FROM silver_transactions_cleaned
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY 1
),
growth_rates AS (
  SELECT 
    week_start,
    transactions,
    revenue,
    unique_customers,
    LAG(revenue, 1) OVER (ORDER BY week_start) as prev_week_revenue,
    LAG(revenue, 4) OVER (ORDER BY week_start) as month_ago_revenue,
    (revenue - LAG(revenue, 1) OVER (ORDER BY week_start))::FLOAT / 
      NULLIF(LAG(revenue, 1) OVER (ORDER BY week_start), 0) * 100 as weekly_growth_pct,
    (revenue - LAG(revenue, 4) OVER (ORDER BY week_start))::FLOAT / 
      NULLIF(LAG(revenue, 4) OVER (ORDER BY week_start), 0) * 100 as monthly_growth_pct
  FROM weekly_trends
),
projections AS (
  SELECT 
    AVG(weekly_growth_pct) as avg_weekly_growth,
    AVG(monthly_growth_pct) as avg_monthly_growth,
    STDDEV(weekly_growth_pct) as growth_volatility,
    MAX(revenue) as peak_revenue,
    MIN(revenue) as trough_revenue
  FROM growth_rates
  WHERE weekly_growth_pct IS NOT NULL
)
SELECT 
  gr.*,
  p.avg_weekly_growth,
  p.avg_monthly_growth,
  p.growth_volatility,
  CASE 
    WHEN p.avg_weekly_growth > 5 THEN 'Strong Growth'
    WHEN p.avg_weekly_growth > 0 THEN 'Moderate Growth'
    WHEN p.avg_weekly_growth > -5 THEN 'Stable'
    ELSE 'Declining'
  END as growth_trend,
  CASE 
    WHEN p.growth_volatility < 10 THEN 'Low Risk'
    WHEN p.growth_volatility < 20 THEN 'Medium Risk'
    ELSE 'High Risk'
  END as volatility_assessment,
  -- Simple linear projection for next week
  gr.revenue * (1 + p.avg_weekly_growth/100) as next_week_projection,
  -- Confidence interval based on volatility
  gr.revenue * (1 + (p.avg_weekly_growth - p.growth_volatility)/100) as projection_lower_bound,
  gr.revenue * (1 + (p.avg_weekly_growth + p.growth_volatility)/100) as projection_upper_bound
FROM growth_rates gr, projections p
WHERE gr.week_start = (SELECT MAX(week_start) FROM growth_rates);

-- Grant permissions on all views
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO anon, authenticated;

-- Success message
SELECT 'Gold layer views created successfully! Your Scout Dashboard is now powered by business-ready analytics.' as status;