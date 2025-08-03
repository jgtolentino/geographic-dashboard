-- Function to get product mix statistics
CREATE OR REPLACE FUNCTION get_product_mix_stats(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE,
  store_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  type TEXT,
  name TEXT,
  total_revenue DECIMAL,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH revenue_totals AS (
    SELECT 
      SUM(total_price) as grand_total
    FROM silver_transactions_cleaned
    WHERE transaction_date BETWEEN start_date AND end_date
      AND (store_filter IS NULL OR store_id = store_filter)
  ),
  category_stats AS (
    SELECT 
      'category' as type,
      category as name,
      SUM(total_price) as total_revenue
    FROM silver_transactions_cleaned
    WHERE transaction_date BETWEEN start_date AND end_date
      AND (store_filter IS NULL OR store_id = store_filter)
    GROUP BY category
  ),
  brand_stats AS (
    SELECT 
      'brand' as type,
      brand as name,
      SUM(total_price) as total_revenue
    FROM silver_transactions_cleaned
    WHERE transaction_date BETWEEN start_date AND end_date
      AND (store_filter IS NULL OR store_id = store_filter)
    GROUP BY brand
  )
  SELECT 
    type,
    name,
    total_revenue,
    ROUND((total_revenue / (SELECT grand_total FROM revenue_totals)) * 100, 2) as percentage
  FROM (
    SELECT * FROM category_stats
    UNION ALL
    SELECT * FROM brand_stats
  ) combined
  ORDER BY type, total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top SKUs
CREATE OR REPLACE FUNCTION get_top_skus(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE,
  category_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  total_quantity INT,
  total_revenue DECIMAL,
  transaction_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.product_id,
    pm.product_name,
    st.category,
    st.brand,
    SUM(st.quantity)::INT as total_quantity,
    SUM(st.total_price) as total_revenue,
    COUNT(DISTINCT st.transaction_id)::INT as transaction_count
  FROM silver_transactions_cleaned st
  LEFT JOIN product_master pm ON st.product_id = pm.product_id
  WHERE st.transaction_date BETWEEN start_date AND end_date
    AND (category_filter IS NULL OR st.category = category_filter)
    AND (brand_filter IS NULL OR st.brand = brand_filter)
  GROUP BY st.product_id, pm.product_name, st.category, st.brand
  ORDER BY total_revenue DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get category performance
CREATE OR REPLACE FUNCTION get_category_performance(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  category TEXT,
  total_revenue DECIMAL,
  total_quantity INT,
  transaction_count INT,
  avg_basket_size DECIMAL,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT SUM(total_price) as grand_total
    FROM silver_transactions_cleaned
    WHERE transaction_date BETWEEN start_date AND end_date
  )
  SELECT 
    category,
    SUM(total_price) as total_revenue,
    SUM(quantity)::INT as total_quantity,
    COUNT(DISTINCT transaction_id)::INT as transaction_count,
    ROUND(AVG(total_price), 2) as avg_basket_size,
    ROUND((SUM(total_price) / (SELECT grand_total FROM totals)) * 100, 2) as percentage
  FROM silver_transactions_cleaned
  WHERE transaction_date BETWEEN start_date AND end_date
  GROUP BY category
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer behavior patterns
CREATE OR REPLACE FUNCTION get_customer_behavior_patterns(
  time_window INT DEFAULT 7
)
RETURNS TABLE (
  peak_hour INT,
  weekend_ratio DECIMAL,
  avg_basket_size DECIMAL,
  repeat_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH hourly_stats AS (
    SELECT 
      transaction_hour,
      COUNT(*) as transaction_count
    FROM silver_transactions_cleaned
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 day' * time_window
    GROUP BY transaction_hour
    ORDER BY transaction_count DESC
    LIMIT 1
  ),
  weekend_stats AS (
    SELECT 
      COUNT(CASE WHEN is_weekend THEN 1 END) as weekend_count,
      COUNT(*) as total_count
    FROM silver_transactions_cleaned
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 day' * time_window
  ),
  basket_stats AS (
    SELECT 
      AVG(total_price) as avg_basket
    FROM silver_transactions_cleaned
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 day' * time_window
  ),
  repeat_stats AS (
    SELECT 
      COUNT(DISTINCT CASE WHEN transaction_count > 1 THEN customer_id END)::DECIMAL / 
      COUNT(DISTINCT customer_id) as repeat_rate
    FROM (
      SELECT 
        customer_id,
        COUNT(*) as transaction_count
      FROM silver_transactions_cleaned
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 day' * time_window
      GROUP BY customer_id
    ) customer_counts
  )
  SELECT 
    (SELECT transaction_hour FROM hourly_stats) as peak_hour,
    ROUND((SELECT weekend_count::DECIMAL / total_count * 100 FROM weekend_stats), 2) as weekend_ratio,
    ROUND((SELECT avg_basket FROM basket_stats), 2) as avg_basket_size,
    ROUND((SELECT repeat_rate FROM repeat_stats) * 100, 2) as repeat_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending products
CREATE OR REPLACE FUNCTION get_trending_products(
  days_back INT DEFAULT 7,
  min_growth_rate DECIMAL DEFAULT 0.1
)
RETURNS TABLE (
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  current_period_revenue DECIMAL,
  previous_period_revenue DECIMAL,
  growth_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      st.product_id,
      pm.product_name,
      st.category,
      st.brand,
      SUM(st.total_price) as revenue
    FROM silver_transactions_cleaned st
    LEFT JOIN product_master pm ON st.product_id = pm.product_id
    WHERE st.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY st.product_id, pm.product_name, st.category, st.brand
  ),
  previous_period AS (
    SELECT 
      product_id,
      SUM(total_price) as revenue
    FROM silver_transactions_cleaned
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 day' * (days_back * 2)
      AND transaction_date < CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY product_id
  )
  SELECT 
    cp.product_id,
    cp.product_name,
    cp.category,
    cp.brand,
    cp.revenue as current_period_revenue,
    COALESCE(pp.revenue, 0) as previous_period_revenue,
    CASE 
      WHEN pp.revenue IS NULL OR pp.revenue = 0 THEN 1.0
      ELSE ROUND((cp.revenue - pp.revenue) / pp.revenue, 2)
    END as growth_rate
  FROM current_period cp
  LEFT JOIN previous_period pp ON cp.product_id = pp.product_id
  WHERE (cp.revenue - COALESCE(pp.revenue, 0)) / GREATEST(pp.revenue, 1) >= min_growth_rate
  ORDER BY growth_rate DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get hourly transaction pattern
CREATE OR REPLACE FUNCTION get_hourly_transaction_pattern(
  days_back INT DEFAULT 7
)
RETURNS TABLE (
  hour INT,
  avg_transactions DECIMAL,
  avg_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    transaction_hour as hour,
    ROUND(AVG(transaction_count), 2) as avg_transactions,
    ROUND(AVG(revenue), 2) as avg_revenue
  FROM (
    SELECT 
      transaction_date,
      transaction_hour,
      COUNT(*) as transaction_count,
      SUM(total_price) as revenue
    FROM silver_transactions_cleaned
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY transaction_date, transaction_hour
  ) hourly_data
  GROUP BY transaction_hour
  ORDER BY transaction_hour;
END;
$$ LANGUAGE plpgsql;

-- Create tables for chat logging
CREATE TABLE IF NOT EXISTS scout_chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_message TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout_chat_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_response TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_silver_trans_date ON silver_transactions_cleaned(transaction_date);
CREATE INDEX IF NOT EXISTS idx_silver_trans_category ON silver_transactions_cleaned(category);
CREATE INDEX IF NOT EXISTS idx_silver_trans_brand ON silver_transactions_cleaned(brand);
CREATE INDEX IF NOT EXISTS idx_silver_trans_product ON silver_transactions_cleaned(product_id);
CREATE INDEX IF NOT EXISTS idx_gold_metrics_date ON gold_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_gold_metrics_store ON gold_daily_metrics(store_id);