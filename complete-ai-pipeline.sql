-- ====================================================================
-- 🤖 SCOUT ANALYTICS PLATFORM - COMPLETE AI-POWERED PIPELINE
-- ====================================================================
-- Complete Bronze→Silver→Gold medallion architecture with AI insights
-- Enterprise-grade data pipeline for TBWA Philippines
-- Includes company dimensions, AI analytics, and advanced ETL
-- ====================================================================

-- ====================================================================
-- 🏗️ FOUNDATIONAL SCHEMAS & ENUMS
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;
CREATE SCHEMA IF NOT EXISTS scout;
CREATE SCHEMA IF NOT EXISTS ai_insights;

-- Scout enums (from your specs)
DO $$ BEGIN
  CREATE TYPE scout.time_of_day AS ENUM ('morning','afternoon','evening','night');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.request_mode AS ENUM ('verbal','pointing','indirect');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.request_type AS ENUM ('branded','unbranded','point','indirect');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.gender AS ENUM ('male','female','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.age_bracket AS ENUM ('18-24','25-34','35-44','45-54','55+','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.payment_method AS ENUM ('cash','gcash','maya','credit','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.customer_type AS ENUM ('regular','occasional','new','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.store_type AS ENUM ('urban_high','urban_medium','residential','rural','transport','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.economic_class AS ENUM ('A','B','C','D','E','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scout.insight_type AS ENUM ('trend','anomaly','opportunity','risk','prediction','recommendation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ====================================================================
-- 🥉 BRONZE LAYER - RAW DATA INGESTION
-- ====================================================================

CREATE TABLE IF NOT EXISTS bronze.json_events (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  raw_body TEXT NOT NULL,
  content_hash TEXT GENERATED ALWAYS AS (encode(sha256(raw_body::bytea), 'hex')) STORED,
  body JSONB GENERATED ALWAYS AS (raw_body::jsonb) STORED,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_errors JSONB,
  data_quality_score NUMERIC CHECK (data_quality_score BETWEEN 0 AND 1),
  ai_classification JSONB
);

CREATE INDEX IF NOT EXISTS idx_bronze_events_source ON bronze.json_events(source);
CREATE INDEX IF NOT EXISTS idx_bronze_events_status ON bronze.json_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_bronze_events_received ON bronze.json_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_bronze_events_body_gin ON bronze.json_events USING GIN (body);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bronze_events_dedup ON bronze.json_events(content_hash);

-- ====================================================================
-- 🥈 SILVER LAYER - NORMALIZED & VALIDATED
-- ====================================================================

-- Companies & Brands (dimensional)
CREATE TABLE IF NOT EXISTS silver.companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT UNIQUE NOT NULL,
  is_client BOOLEAN DEFAULT TRUE,
  industry_sector TEXT,
  market_position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.brands (
  brand_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES silver.companies(company_id),
  is_client BOOLEAN DEFAULT TRUE,
  brand_tier TEXT CHECK (brand_tier IN ('premium', 'mainstream', 'value')),
  target_demographic JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores (dimensional)
CREATE TABLE IF NOT EXISTS silver.stores (
  store_id TEXT PRIMARY KEY,
  store_name TEXT,
  region_name TEXT NOT NULL,
  province_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  barangay_name TEXT NOT NULL,
  store_type scout.store_type,
  economic_zone scout.economic_class,
  coordinates POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core Transactions (fact table)
CREATE TABLE IF NOT EXISTS silver.transactions (
  txn_id TEXT PRIMARY KEY,
  bronze_id BIGINT REFERENCES bronze.json_events(id),
  txn_ts TIMESTAMPTZ NOT NULL,
  store_id TEXT REFERENCES silver.stores(store_id),
  time_of_day scout.time_of_day NOT NULL,
  region_name TEXT NOT NULL,
  province_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  barangay_name TEXT NOT NULL,
  basket_size INT,
  combo_basket JSONB,
  request_mode scout.request_mode,
  request_type scout.request_type,
  suggestion_accepted BOOLEAN,
  gender scout.gender,
  age_bracket scout.age_bracket,
  duration_seconds INT,
  campaign_influenced BOOLEAN,
  handshake_score NUMERIC CHECK (handshake_score BETWEEN 0 AND 1),
  payment_method scout.payment_method,
  customer_type scout.customer_type,
  store_type scout.store_type,
  economic_class scout.economic_class,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Items (fact table - item level)
CREATE TABLE IF NOT EXISTS silver.transaction_items (
  txn_id TEXT REFERENCES silver.transactions(txn_id) ON DELETE CASCADE,
  line_no INT,
  sku TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_id UUID REFERENCES silver.brands(brand_id),
  category_name TEXT NOT NULL,
  qty INT NOT NULL CHECK (qty > 0),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  unit_price NUMERIC GENERATED ALWAYS AS (amount / NULLIF(qty, 0)) STORED,
  is_tbwa_client BOOLEAN,
  margin_estimate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (txn_id, line_no)
);

-- Substitution Events (event table)
CREATE TABLE IF NOT EXISTS silver.substitution_events (
  txn_id TEXT REFERENCES silver.transactions(txn_id) ON DELETE CASCADE,
  occurred BOOLEAN NOT NULL,
  from_text TEXT,
  to_text TEXT,
  reason TEXT CHECK (reason IN ('stockout','suggestion','unknown')),
  impact_score NUMERIC,
  PRIMARY KEY (txn_id)
);

-- Strategic indexes for Silver layer
CREATE INDEX IF NOT EXISTS idx_silver_txn_ts ON silver.transactions (txn_ts DESC);
CREATE INDEX IF NOT EXISTS idx_silver_txn_geo ON silver.transactions (region_name, province_name, city_name);
CREATE INDEX IF NOT EXISTS idx_silver_txn_store ON silver.transactions (store_id, txn_ts DESC);
CREATE INDEX IF NOT EXISTS idx_silver_items_brand ON silver.transaction_items (brand_id, txn_id);
CREATE INDEX IF NOT EXISTS idx_silver_items_category ON silver.transaction_items (category_name);
CREATE INDEX IF NOT EXISTS idx_silver_items_amount ON silver.transaction_items (amount DESC);

-- ====================================================================
-- 🥇 GOLD LAYER - BUSINESS INTELLIGENCE & ANALYTICS
-- ====================================================================

-- Daily KPI aggregations
CREATE TABLE IF NOT EXISTS gold.daily_kpis (
  business_date DATE PRIMARY KEY,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_transactions BIGINT NOT NULL DEFAULT 0,
  total_units BIGINT NOT NULL DEFAULT 0,
  active_stores BIGINT NOT NULL DEFAULT 0,
  unique_brands BIGINT NOT NULL DEFAULT 0,
  avg_transaction_value NUMERIC,
  avg_basket_size NUMERIC,
  handshake_score_avg NUMERIC,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regional performance aggregations
CREATE TABLE IF NOT EXISTS gold.regional_performance (
  region_name TEXT,
  business_date DATE,
  revenue NUMERIC NOT NULL DEFAULT 0,
  transactions BIGINT NOT NULL DEFAULT 0,
  units BIGINT NOT NULL DEFAULT 0,
  stores BIGINT NOT NULL DEFAULT 0,
  market_share NUMERIC,
  penetration_rate NUMERIC,
  PRIMARY KEY (region_name, business_date)
);

-- Brand performance aggregations
CREATE TABLE IF NOT EXISTS gold.brand_performance (
  brand_id UUID REFERENCES silver.brands(brand_id),
  company_id UUID REFERENCES silver.companies(company_id),
  business_date DATE,
  revenue NUMERIC NOT NULL DEFAULT 0,
  transactions BIGINT NOT NULL DEFAULT 0,
  units BIGINT NOT NULL DEFAULT 0,
  market_share NUMERIC,
  velocity NUMERIC,
  PRIMARY KEY (brand_id, business_date)
);

-- Company performance aggregations
CREATE TABLE IF NOT EXISTS gold.company_performance (
  company_id UUID REFERENCES silver.companies(company_id),
  business_date DATE,
  revenue NUMERIC NOT NULL DEFAULT 0,
  transactions BIGINT NOT NULL DEFAULT 0,
  units BIGINT NOT NULL DEFAULT 0,
  brands_count BIGINT NOT NULL DEFAULT 0,
  market_share NUMERIC,
  portfolio_performance NUMERIC,
  PRIMARY KEY (company_id, business_date)
);

-- ====================================================================
-- 🤖 AI INSIGHTS LAYER
-- ====================================================================

-- AI-generated insights storage
CREATE TABLE IF NOT EXISTS ai_insights.insights (
  insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type scout.insight_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1),
  impact_score NUMERIC CHECK (impact_score BETWEEN 0 AND 1),
  data_sources TEXT[],
  filters_context JSONB,
  recommendations JSONB,
  supporting_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- AI model predictions
CREATE TABLE IF NOT EXISTS ai_insights.predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  target_date DATE NOT NULL,
  predicted_value NUMERIC NOT NULL,
  confidence_interval JSONB,
  input_features JSONB,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly detection results
CREATE TABLE IF NOT EXISTS ai_insights.anomalies (
  anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  anomaly_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  affected_dimensions JSONB,
  expected_value NUMERIC,
  actual_value NUMERIC,
  deviation_score NUMERIC,
  investigation_status TEXT DEFAULT 'new',
  resolution_notes TEXT
);

-- Strategic indexes for AI layer
CREATE INDEX IF NOT EXISTS idx_insights_type ON ai_insights.insights (insight_type, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_active ON ai_insights.insights (is_active, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_target ON ai_insights.predictions (target_date DESC, model_name);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON ai_insights.anomalies (severity, detected_at DESC);

-- ====================================================================
-- 🔄 ETL FUNCTIONS - BRONZE TO SILVER PROCESSING
-- ====================================================================

-- Process Bronze JSON events to Silver normalized tables
CREATE OR REPLACE FUNCTION process_bronze_to_silver()
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  batch_size INTEGER := 100;
  bronze_record RECORD;
  processing_errors JSONB := '[]'::JSONB;
BEGIN
  -- Process pending bronze records in batches
  FOR bronze_record IN
    SELECT * FROM bronze.json_events 
    WHERE processing_status = 'pending'
    ORDER BY received_at ASC
    LIMIT batch_size
  LOOP
    BEGIN
      -- Update processing status
      UPDATE bronze.json_events 
      SET processing_status = 'processing', processed_at = NOW()
      WHERE id = bronze_record.id;
      
      -- Validate and extract transaction data
      IF bronze_record.body ? 'id' AND bronze_record.body ? 'timestamp' THEN
        
        -- Insert/update store information
        INSERT INTO silver.stores (store_id, region_name, province_name, city_name, barangay_name, store_type)
        VALUES (
          bronze_record.body->>'store_id',
          COALESCE(bronze_record.body->'location'->>'region', bronze_record.body->>'region', 'Unknown'),
          COALESCE(bronze_record.body->'location'->>'province', bronze_record.body->>'province', 'Unknown'),
          COALESCE(bronze_record.body->'location'->>'city', bronze_record.body->>'city', 'Unknown'),
          COALESCE(bronze_record.body->'location'->>'barangay', bronze_record.body->>'barangay', 'Unknown'),
          COALESCE((bronze_record.body->>'store_type')::scout.store_type, 'other'::scout.store_type)
        )
        ON CONFLICT (store_id) DO UPDATE SET
          region_name = EXCLUDED.region_name,
          province_name = EXCLUDED.province_name,
          city_name = EXCLUDED.city_name,
          barangay_name = EXCLUDED.barangay_name,
          updated_at = NOW();
        
        -- Insert transaction
        INSERT INTO silver.transactions (
          txn_id, bronze_id, txn_ts, store_id, time_of_day,
          region_name, province_name, city_name, barangay_name,
          basket_size, combo_basket, request_mode, request_type,
          suggestion_accepted, gender, age_bracket, duration_seconds,
          campaign_influenced, handshake_score, payment_method,
          customer_type, store_type, economic_class
        ) VALUES (
          bronze_record.body->>'id',
          bronze_record.id,
          (bronze_record.body->>'timestamp')::TIMESTAMPTZ,
          bronze_record.body->>'store_id',
          COALESCE((bronze_record.body->>'time_of_day')::scout.time_of_day, 'morning'::scout.time_of_day),
          COALESCE(bronze_record.body->'location'->>'region', bronze_record.body->>'region', 'Unknown'),
          COALESCE(bronze_record.body->'location'->>'province', bronze_record.body->>'province', 'Unknown'),
          COALESCE(bronze_record.body->'location'->>'city', bronze_record.body->>'city', 'Unknown'),
          COALESCE(bronze_record.body->'location'->>'barangay', bronze_record.body->>'barangay', 'Unknown'),
          COALESCE((bronze_record.body->>'basket_size')::INTEGER, 1),
          bronze_record.body->'combo_basket',
          COALESCE((bronze_record.body->>'request_mode')::scout.request_mode, 'verbal'::scout.request_mode),
          COALESCE((bronze_record.body->>'request_type')::scout.request_type, 'branded'::scout.request_type),
          COALESCE((bronze_record.body->>'suggestion_accepted')::BOOLEAN, FALSE),
          COALESCE((bronze_record.body->>'gender')::scout.gender, 'unknown'::scout.gender),
          COALESCE((bronze_record.body->>'age_bracket')::scout.age_bracket, 'unknown'::scout.age_bracket),
          COALESCE((bronze_record.body->>'duration_seconds')::INTEGER, 0),
          COALESCE((bronze_record.body->>'campaign_influenced')::BOOLEAN, FALSE),
          COALESCE((bronze_record.body->>'handshake_score')::NUMERIC, 0.5),
          COALESCE((bronze_record.body->>'payment_method')::scout.payment_method, 'cash'::scout.payment_method),
          COALESCE((bronze_record.body->>'customer_type')::scout.customer_type, 'regular'::scout.customer_type),
          COALESCE((bronze_record.body->>'store_type')::scout.store_type, 'other'::scout.store_type),
          COALESCE((bronze_record.body->>'economic_class')::scout.economic_class, 'unknown'::scout.economic_class)
        )
        ON CONFLICT (txn_id) DO NOTHING;
        
        -- Insert transaction items (handle single item or combo basket)
        IF bronze_record.body ? 'sku' AND bronze_record.body ? 'brand_name' THEN
          -- Single item transaction
          INSERT INTO silver.transaction_items (
            txn_id, line_no, sku, brand_name, category_name, qty, amount, is_tbwa_client
          ) VALUES (
            bronze_record.body->>'id',
            1,
            bronze_record.body->>'sku',
            bronze_record.body->>'brand_name',
            COALESCE(bronze_record.body->>'product_category', 'Unknown'),
            COALESCE((bronze_record.body->>'units_per_transaction')::INTEGER, 1),
            COALESCE((bronze_record.body->>'peso_value')::NUMERIC, 0),
            COALESCE((bronze_record.body->>'is_tbwa_client')::BOOLEAN, TRUE)
          )
          ON CONFLICT (txn_id, line_no) DO NOTHING;
        END IF;
        
        -- Handle substitution events
        IF bronze_record.body ? 'substitution_event' THEN
          INSERT INTO silver.substitution_events (
            txn_id, occurred, from_text, to_text, reason
          ) VALUES (
            bronze_record.body->>'id',
            COALESCE((bronze_record.body->'substitution_event'->>'occurred')::BOOLEAN, FALSE),
            bronze_record.body->'substitution_event'->>'from',
            bronze_record.body->'substitution_event'->>'to',
            COALESCE(bronze_record.body->'substitution_event'->>'reason', 'unknown')
          )
          ON CONFLICT (txn_id) DO NOTHING;
        END IF;
        
        processed_count := processed_count + 1;
      END IF;
      
      -- Mark as completed
      UPDATE bronze.json_events 
      SET processing_status = 'completed'
      WHERE id = bronze_record.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Handle processing errors
      error_count := error_count + 1;
      processing_errors := processing_errors || jsonb_build_object(
        'bronze_id', bronze_record.id,
        'error', SQLERRM,
        'timestamp', NOW()
      );
      
      UPDATE bronze.json_events 
      SET processing_status = 'failed', processing_errors = jsonb_build_object('error', SQLERRM)
      WHERE id = bronze_record.id;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'error_count', error_count,
    'processing_errors', processing_errors,
    'timestamp', NOW()
  );
END;
$$;

-- ====================================================================
-- 🔄 ETL FUNCTIONS - SILVER TO GOLD PROCESSING
-- ====================================================================

-- Generate Gold layer daily aggregations
CREATE OR REPLACE FUNCTION process_silver_to_gold(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  records_processed INTEGER := 0;
BEGIN
  -- Generate daily KPIs
  INSERT INTO gold.daily_kpis (
    business_date, total_revenue, total_transactions, total_units,
    active_stores, unique_brands, avg_transaction_value, avg_basket_size, handshake_score_avg
  )
  SELECT 
    target_date,
    COALESCE(SUM(ti.amount), 0) as total_revenue,
    COUNT(DISTINCT t.txn_id) as total_transactions,
    COALESCE(SUM(ti.qty), 0) as total_units,
    COUNT(DISTINCT t.store_id) as active_stores,
    COUNT(DISTINCT ti.brand_name) as unique_brands,
    COALESCE(AVG(ti.amount), 0) as avg_transaction_value,
    COALESCE(AVG(t.basket_size), 0) as avg_basket_size,
    COALESCE(AVG(t.handshake_score), 0) as handshake_score_avg
  FROM silver.transactions t
  LEFT JOIN silver.transaction_items ti ON t.txn_id = ti.txn_id
  WHERE t.txn_ts::DATE = target_date
  ON CONFLICT (business_date) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_transactions = EXCLUDED.total_transactions,
    total_units = EXCLUDED.total_units,
    active_stores = EXCLUDED.active_stores,
    unique_brands = EXCLUDED.unique_brands,
    avg_transaction_value = EXCLUDED.avg_transaction_value,
    avg_basket_size = EXCLUDED.avg_basket_size,
    handshake_score_avg = EXCLUDED.handshake_score_avg,
    calculated_at = NOW();
  
  -- Generate regional performance
  INSERT INTO gold.regional_performance (
    region_name, business_date, revenue, transactions, units, stores
  )
  SELECT 
    t.region_name,
    target_date,
    COALESCE(SUM(ti.amount), 0) as revenue,
    COUNT(DISTINCT t.txn_id) as transactions,
    COALESCE(SUM(ti.qty), 0) as units,
    COUNT(DISTINCT t.store_id) as stores
  FROM silver.transactions t
  LEFT JOIN silver.transaction_items ti ON t.txn_id = ti.txn_id
  WHERE t.txn_ts::DATE = target_date
  GROUP BY t.region_name
  ON CONFLICT (region_name, business_date) DO UPDATE SET
    revenue = EXCLUDED.revenue,
    transactions = EXCLUDED.transactions,
    units = EXCLUDED.units,
    stores = EXCLUDED.stores;
  
  -- Generate brand performance
  INSERT INTO gold.brand_performance (
    brand_id, company_id, business_date, revenue, transactions, units
  )
  SELECT 
    b.brand_id,
    b.company_id,
    target_date,
    COALESCE(SUM(ti.amount), 0) as revenue,
    COUNT(DISTINCT t.txn_id) as transactions,
    COALESCE(SUM(ti.qty), 0) as units
  FROM silver.transactions t
  JOIN silver.transaction_items ti ON t.txn_id = ti.txn_id
  LEFT JOIN silver.brands b ON ti.brand_name = b.brand_name
  WHERE t.txn_ts::DATE = target_date
  GROUP BY b.brand_id, b.company_id
  ON CONFLICT (brand_id, business_date) DO UPDATE SET
    revenue = EXCLUDED.revenue,
    transactions = EXCLUDED.transactions,
    units = EXCLUDED.units;
  
  -- Generate company performance
  INSERT INTO gold.company_performance (
    company_id, business_date, revenue, transactions, units, brands_count
  )
  SELECT 
    c.company_id,
    target_date,
    COALESCE(SUM(ti.amount), 0) as revenue,
    COUNT(DISTINCT t.txn_id) as transactions,
    COALESCE(SUM(ti.qty), 0) as units,
    COUNT(DISTINCT b.brand_id) as brands_count
  FROM silver.transactions t
  JOIN silver.transaction_items ti ON t.txn_id = ti.txn_id
  LEFT JOIN silver.brands b ON ti.brand_name = b.brand_name
  LEFT JOIN silver.companies c ON b.company_id = c.company_id
  WHERE t.txn_ts::DATE = target_date
  GROUP BY c.company_id
  ON CONFLICT (company_id, business_date) DO UPDATE SET
    revenue = EXCLUDED.revenue,
    transactions = EXCLUDED.transactions,
    units = EXCLUDED.units,
    brands_count = EXCLUDED.brands_count;
  
  GET DIAGNOSTICS records_processed = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'target_date', target_date,
    'records_processed', records_processed,
    'timestamp', NOW()
  );
END;
$$;

-- ====================================================================
-- 🤖 AI INSIGHTS GENERATION FUNCTIONS
-- ====================================================================

-- Generate AI insights from Gold layer data
CREATE OR REPLACE FUNCTION generate_ai_insights()
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  insights_generated INTEGER := 0;
  insight_record RECORD;
BEGIN
  -- Clear expired insights
  DELETE FROM ai_insights.insights WHERE expires_at < NOW();
  
  -- Generate trend insights
  FOR insight_record IN
    SELECT 
      region_name,
      AVG(revenue) as avg_revenue,
      STDDEV(revenue) as revenue_stddev,
      COUNT(*) as days_count
    FROM gold.regional_performance 
    WHERE business_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY region_name
    HAVING COUNT(*) >= 7 -- At least a week of data
  LOOP
    -- Identify high-growth regions
    IF insight_record.avg_revenue > 50000 AND insight_record.revenue_stddev < insight_record.avg_revenue * 0.3 THEN
      INSERT INTO ai_insights.insights (
        insight_type, title, description, confidence_score, impact_score,
        data_sources, supporting_data, expires_at
      ) VALUES (
        'opportunity',
        'High-Performance Region Identified',
        format('Region %s shows consistent high revenue (₱%s avg) with low volatility. Consider expanding operations or increasing marketing investment.',
               insight_record.region_name, 
               ROUND(insight_record.avg_revenue)),
        0.85,
        0.75,
        ARRAY['gold.regional_performance'],
        jsonb_build_object(
          'region', insight_record.region_name,
          'avg_revenue', insight_record.avg_revenue,
          'volatility', insight_record.revenue_stddev / insight_record.avg_revenue,
          'days_analyzed', insight_record.days_count
        ),
        NOW() + INTERVAL '7 days'
      );
      insights_generated := insights_generated + 1;
    END IF;
  END LOOP;
  
  -- Generate brand performance insights
  INSERT INTO ai_insights.insights (
    insight_type, title, description, confidence_score, impact_score,
    data_sources, recommendations, expires_at
  )
  SELECT 
    'trend',
    'Top Performing Brand Portfolio',
    format('Company portfolio analysis shows %s brands driving %s%% of total revenue with strong market velocity.',
           COUNT(DISTINCT bp.brand_id),
           ROUND((SUM(bp.revenue) / (SELECT SUM(revenue) FROM gold.brand_performance WHERE business_date >= CURRENT_DATE - INTERVAL '7 days')) * 100, 1)),
    0.90,
    0.85,
    ARRAY['gold.brand_performance', 'silver.companies'],
    jsonb_build_array(
      'Focus marketing spend on top-performing portfolio',
      'Analyze success factors for replication across other brands',
      'Consider premium positioning opportunities'
    ),
    NOW() + INTERVAL '5 days'
  FROM gold.brand_performance bp
  JOIN silver.brands b ON bp.brand_id = b.brand_id
  JOIN silver.companies c ON b.company_id = c.company_id
  WHERE bp.business_date >= CURRENT_DATE - INTERVAL '7 days'
    AND c.is_client = TRUE
  GROUP BY c.company_id, c.company_name
  HAVING SUM(bp.revenue) > 100000
  ORDER BY SUM(bp.revenue) DESC
  LIMIT 1;
  
  insights_generated := insights_generated + 1;
  
  -- Anomaly detection for transaction patterns
  INSERT INTO ai_insights.anomalies (
    anomaly_type, severity, description, affected_dimensions,
    expected_value, actual_value, deviation_score
  )
  SELECT 
    'revenue_drop',
    CASE 
      WHEN deviation_score > 0.5 THEN 'high'
      WHEN deviation_score > 0.3 THEN 'medium' 
      ELSE 'low'
    END,
    format('Significant revenue deviation detected for %s: %s%% below expected', 
           region_name, ROUND(deviation_score * 100, 1)),
    jsonb_build_object('region', region_name, 'date', business_date),
    expected_revenue,
    actual_revenue,
    deviation_score
  FROM (
    SELECT 
      region_name,
      business_date,
      revenue as actual_revenue,
      LAG(revenue, 7) OVER (PARTITION BY region_name ORDER BY business_date) as expected_revenue,
      ABS(revenue - LAG(revenue, 7) OVER (PARTITION BY region_name ORDER BY business_date)) / 
        NULLIF(LAG(revenue, 7) OVER (PARTITION BY region_name ORDER BY business_date), 0) as deviation_score
    FROM gold.regional_performance 
    WHERE business_date >= CURRENT_DATE - INTERVAL '14 days'
  ) anomaly_check
  WHERE deviation_score > 0.2 AND expected_revenue IS NOT NULL;
  
  RETURN jsonb_build_object(
    'insights_generated', insights_generated,
    'anomalies_detected', (SELECT COUNT(*) FROM ai_insights.anomalies WHERE detected_at::DATE = CURRENT_DATE),
    'timestamp', NOW()
  );
END;
$$;

-- ====================================================================
-- 📊 GOLD LAYER VIEWS & RPCs (Your Enhanced API)
-- ====================================================================

-- Enhanced Gold views with company dimensions
CREATE OR REPLACE VIEW public.gold_recent_transactions AS
SELECT
  t.txn_id, t.txn_ts, t.store_id,
  t.region_name as region, t.province_name as province, t.city_name as city, t.barangay_name as barangay,
  ti.sku, ti.brand_name as brand, b.brand_id,
  c.company_id, c.company_name,
  ti.category_name as category,
  ti.qty, ti.amount, ti.unit_price,
  t.time_of_day, t.payment_method, t.handshake_score,
  t.customer_type, t.economic_class
FROM silver.transactions t
JOIN silver.transaction_items ti ON t.txn_id = ti.txn_id
LEFT JOIN silver.brands b ON ti.brand_name = b.brand_name
LEFT JOIN silver.companies c ON b.company_id = c.company_id;

CREATE OR REPLACE VIEW public.gold_kpi_overview AS
SELECT 
  business_date,
  total_revenue as revenue,
  total_transactions as transactions,
  active_stores as stores,
  avg_transaction_value,
  handshake_score_avg
FROM gold.daily_kpis
ORDER BY business_date DESC;

CREATE OR REPLACE VIEW public.gold_brand_performance AS
SELECT
  c.company_name as company,
  b.brand_name as brand,
  ti.category_name as category,
  SUM(ti.qty) as units,
  SUM(ti.amount) as revenue,
  AVG(ti.unit_price) as avg_unit_price,
  COUNT(DISTINCT t.txn_id) as transactions
FROM silver.transaction_items ti
LEFT JOIN silver.brands b ON ti.brand_name = b.brand_name
LEFT JOIN silver.companies c ON b.company_id = c.company_id
LEFT JOIN silver.transactions t ON ti.txn_id = t.txn_id
GROUP BY c.company_name, b.brand_name, ti.category_name;

CREATE OR REPLACE VIEW public.gold_geo_agg AS
SELECT 
  region_name,
  province_name,
  city_name,
  barangay_name,
  SUM(transactions) as txns,
  SUM(revenue) as revenue,
  AVG(revenue/NULLIF(transactions,0)) as avg_transaction_value,
  COUNT(DISTINCT business_date) as active_days
FROM gold.regional_performance 
GROUP BY region_name, province_name, city_name, barangay_name;

-- Enhanced master filters with companies (from your spec)
CREATE OR REPLACE FUNCTION public.get_master_filters(filters_json JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j JSONB := COALESCE(filters_json, '{}'::JSONB);
  out JSONB := '{}'::JSONB;
BEGIN
  -- Regions facet
  out := jsonb_set(out, '{regions}', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('code', t.region_name, 'name', t.region_name, 'count', COUNT(DISTINCT t.txn_id)))
    FROM silver.transactions t
    WHERE (j ? 'date_from' IS FALSE OR t.txn_ts::DATE >= (j->>'date_from')::DATE)
      AND (j ? 'date_to' IS FALSE OR t.txn_ts::DATE <= (j->>'date_to')::DATE)
    GROUP BY t.region_name
  ), '[]'::JSONB));

  -- Companies facet
  out := jsonb_set(out, '{companies}', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', c.company_id, 'name', c.company_name, 'count', cnt))
    FROM (
      SELECT c.company_id, c.company_name, COUNT(DISTINCT t.txn_id)::INT as cnt
      FROM silver.transaction_items ti
      LEFT JOIN silver.brands b ON ti.brand_name = b.brand_name
      LEFT JOIN silver.companies c ON b.company_id = c.company_id
      LEFT JOIN silver.transactions t ON ti.txn_id = t.txn_id
      WHERE (j ? 'date_from' IS FALSE OR t.txn_ts::DATE >= (j->>'date_from')::DATE)
        AND (j ? 'date_to' IS FALSE OR t.txn_ts::DATE <= (j->>'date_to')::DATE)
        AND (j ? 'region_code' IS FALSE OR t.region_name = j->>'region_code')
      GROUP BY c.company_id, c.company_name
    ) q
  ), '[]'::JSONB));

  -- Brands facet (scoped by companies)
  out := jsonb_set(out, '{brands}', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', b.brand_id, 'name', b.brand_name, 'company_id', b.company_id, 'count', cnt))
    FROM (
      SELECT b.brand_id, b.brand_name, b.company_id, COUNT(DISTINCT t.txn_id)::INT as cnt
      FROM silver.transaction_items ti
      LEFT JOIN silver.brands b ON ti.brand_name = b.brand_name
      LEFT JOIN silver.companies c ON b.company_id = c.company_id
      LEFT JOIN silver.transactions t ON ti.txn_id = t.txn_id
      WHERE (j ? 'company_ids' IS FALSE OR b.company_id::TEXT = ANY(SELECT jsonb_array_elements_text(j->'company_ids')))
        AND (j ? 'date_from' IS FALSE OR t.txn_ts::DATE >= (j->>'date_from')::DATE)
        AND (j ? 'date_to' IS FALSE OR t.txn_ts::DATE <= (j->>'date_to')::DATE)
        AND (j ? 'region_code' IS FALSE OR t.region_name = j->>'region_code')
      GROUP BY b.brand_id, b.brand_name, b.company_id
    ) q
  ), '[]'::JSONB));

  -- Categories facet
  out := jsonb_set(out, '{categories}', COALESCE((
    SELECT jsonb_agg(DISTINCT jsonb_build_object('name', ti.category_name))
    FROM silver.transaction_items ti
  ), '[]'::JSONB));

  RETURN out;
END;
$$;

-- AI Insights API
CREATE OR REPLACE FUNCTION public.get_ai_insights(
  insight_types TEXT[] DEFAULT ARRAY['trend', 'opportunity', 'risk'],
  limit_count INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'insights', jsonb_agg(
        jsonb_build_object(
          'id', insight_id,
          'type', insight_type,
          'title', title,
          'description', description,
          'confidence_score', confidence_score,
          'impact_score', impact_score,
          'recommendations', recommendations,
          'supporting_data', supporting_data,
          'generated_at', generated_at
        )
      ),
      'total_count', COUNT(*),
      'generated_at', NOW()
    )
    FROM ai_insights.insights
    WHERE is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND insight_type = ANY(insight_types)
    ORDER BY confidence_score DESC, impact_score DESC
    LIMIT limit_count
  );
END;
$$;

-- Anomaly Detection API
CREATE OR REPLACE FUNCTION public.get_anomalies(
  severity_levels TEXT[] DEFAULT ARRAY['high', 'medium'],
  days_back INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'anomalies', jsonb_agg(
        jsonb_build_object(
          'id', anomaly_id,
          'type', anomaly_type,
          'severity', severity,
          'description', description,
          'affected_dimensions', affected_dimensions,
          'deviation_score', deviation_score,
          'detected_at', detected_at
        )
      ),
      'total_count', COUNT(*)
    )
    FROM ai_insights.anomalies
    WHERE detected_at >= NOW() - INTERVAL '1 day' * days_back
      AND severity = ANY(severity_levels)
    ORDER BY detected_at DESC, deviation_score DESC
  );
END;
$$;

-- ====================================================================
-- 🚀 ORCHESTRATION FUNCTION - COMPLETE PIPELINE
-- ====================================================================

-- Master orchestration function for the entire pipeline
CREATE OR REPLACE FUNCTION run_complete_pipeline()
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  bronze_result JSONB;
  silver_result JSONB;
  gold_result JSONB;
  ai_result JSONB;
  pipeline_start TIMESTAMPTZ := NOW();
BEGIN
  -- Step 1: Process Bronze to Silver
  SELECT process_bronze_to_silver() INTO bronze_result;
  
  -- Step 2: Process Silver to Gold (for today)
  SELECT process_silver_to_gold() INTO silver_result;
  
  -- Step 3: Generate AI Insights
  SELECT generate_ai_insights() INTO ai_result;
  
  RETURN jsonb_build_object(
    'pipeline_id', encode(gen_random_bytes(8), 'hex'),
    'started_at', pipeline_start,
    'completed_at', NOW(),
    'duration_seconds', EXTRACT(EPOCH FROM (NOW() - pipeline_start)),
    'bronze_processing', bronze_result,
    'silver_processing', silver_result,
    'ai_insights', ai_result,
    'status', 'completed'
  );
END;
$$;

-- ====================================================================
-- 🔐 SECURITY & PERMISSIONS
-- ====================================================================

-- Grant permissions for API access
GRANT USAGE ON SCHEMA bronze, silver, gold, ai_insights TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA ai_insights TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant insert/update permissions for data ingestion
GRANT INSERT, UPDATE ON bronze.json_events TO authenticated;
GRANT INSERT, UPDATE ON silver.companies, silver.brands TO authenticated;

-- ====================================================================
-- 🌱 SAMPLE DATA SEEDING
-- ====================================================================

-- Insert sample companies (TBWA clients from your spec)
INSERT INTO silver.companies (company_name, is_client, industry_sector) VALUES
  ('Alaska Milk Corporation', TRUE, 'FMCG - Dairy'),
  ('Del Monte Pacific', TRUE, 'FMCG - Processed Foods'),
  ('Liwayway Marketing Corporation', TRUE, 'FMCG - Snacks'), -- Oishi
  ('Japan Tobacco International', TRUE, 'Tobacco'),
  ('Peerless Products Manufacturing Corporation', TRUE, 'FMCG - Personal Care')
ON CONFLICT (company_name) DO NOTHING;

-- Insert sample brands linked to companies
INSERT INTO silver.brands (brand_name, company_id, brand_tier, is_client) 
SELECT 'Alaska Milk', c.company_id, 'mainstream', TRUE FROM silver.companies c WHERE c.company_name = 'Alaska Milk Corporation'
UNION ALL
SELECT 'Del Monte', c.company_id, 'mainstream', TRUE FROM silver.companies c WHERE c.company_name = 'Del Monte Pacific'
UNION ALL  
SELECT 'Oishi', c.company_id, 'mainstream', TRUE FROM silver.companies c WHERE c.company_name = 'Liwayway Marketing Corporation'
ON CONFLICT (brand_name) DO NOTHING;

-- Create version tracking
CREATE OR REPLACE FUNCTION public.get_pipeline_version() 
RETURNS TEXT 
LANGUAGE SQL IMMUTABLE 
AS $$ SELECT 'Scout Analytics Pipeline v2.0 - Complete AI-Powered Bronze→Silver→Gold (2025-08-04)' $$;

-- Final status summary
SELECT 
  'Scout Analytics Pipeline Deployment Complete' as status,
  COUNT(*) FILTER (WHERE schemaname = 'bronze') as bronze_tables,
  COUNT(*) FILTER (WHERE schemaname = 'silver') as silver_tables,
  COUNT(*) FILTER (WHERE schemaname = 'gold') as gold_tables,
  COUNT(*) FILTER (WHERE schemaname = 'ai_insights') as ai_tables
FROM pg_tables 
WHERE schemaname IN ('bronze', 'silver', 'gold', 'ai_insights');
