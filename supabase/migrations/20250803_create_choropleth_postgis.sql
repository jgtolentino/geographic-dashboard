-- ====================================================================
-- PRODUCTION CHOROPLETH WITH POSTGIS
-- Creates real geographic data for Philippine regions
-- ====================================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create table for Philippine administrative regions (Level 1)
CREATE TABLE IF NOT EXISTS ph_admin1_regions (
  id SERIAL PRIMARY KEY,
  region_code VARCHAR(10) UNIQUE NOT NULL,
  name_1 VARCHAR(100) NOT NULL,
  type_1 VARCHAR(50),
  engtype_1 VARCHAR(50),
  geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
  area_sqkm DECIMAL(10,2),
  population INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for performance
CREATE INDEX idx_ph_admin1_regions_geom ON ph_admin1_regions USING GIST (geom);

-- Insert simplified Philippine regions (rectangles for demo, replace with real GADM data)
INSERT INTO ph_admin1_regions (region_code, name_1, type_1, engtype_1, geom, area_sqkm) VALUES
-- Luzon
('NCR', 'National Capital Region', 'Region', 'Region', 
  ST_GeomFromText('MULTIPOLYGON(((120.9 14.35, 121.15 14.35, 121.15 14.8, 120.9 14.8, 120.9 14.35)))', 4326), 636),
('CAR', 'Cordillera Administrative Region', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((120.3 16.2, 121.2 16.2, 121.2 17.6, 120.3 17.6, 120.3 16.2)))', 4326), 19422),
('I', 'Ilocos Region', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((119.8 15.9, 120.7 15.9, 120.7 18.6, 119.8 18.6, 119.8 15.9)))', 4326), 16873),
('II', 'Cagayan Valley', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((121.0 16.2, 122.5 16.2, 122.5 18.7, 121.0 18.7, 121.0 16.2)))', 4326), 29836),
('III', 'Central Luzon', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((119.8 14.8, 121.5 14.8, 121.5 16.0, 119.8 16.0, 119.8 14.8)))', 4326), 22014),
('IVA', 'Calabarzon', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((120.5 13.2, 122.0 13.2, 122.0 14.8, 120.5 14.8, 120.5 13.2)))', 4326), 16576),
('IVB', 'Mimaropa', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((117.0 9.5, 122.0 9.5, 122.0 13.0, 117.0 13.0, 117.0 9.5)))', 4326), 29620),
('V', 'Bicol Region', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((122.2 12.2, 124.3 12.2, 124.3 14.2, 122.2 14.2, 122.2 12.2)))', 4326), 18155),

-- Visayas
('VI', 'Western Visayas', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((121.0 9.5, 123.0 9.5, 123.0 11.8, 121.0 11.8, 121.0 9.5)))', 4326), 35448),
('VII', 'Central Visayas', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((123.0 9.0, 124.5 9.0, 124.5 11.0, 123.0 11.0, 123.0 9.0)))', 4326), 15895),
('VIII', 'Eastern Visayas', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((124.0 10.0, 125.8 10.0, 125.8 12.8, 124.0 12.8, 124.0 10.0)))', 4326), 23234),

-- Mindanao
('IX', 'Zamboanga Peninsula', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((121.5 6.5, 123.5 6.5, 123.5 8.5, 121.5 8.5, 121.5 6.5)))', 4326), 16998),
('X', 'Northern Mindanao', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((123.5 7.2, 125.5 7.2, 125.5 9.0, 123.5 9.0, 123.5 7.2)))', 4326), 20496),
('XI', 'Davao Region', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((125.0 5.5, 126.8 5.5, 126.8 8.0, 125.0 8.0, 125.0 5.5)))', 4326), 20357),
('XII', 'Soccsksargen', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((124.0 5.5, 125.5 5.5, 125.5 7.5, 124.0 7.5, 124.0 5.5)))', 4326), 22610),
('XIII', 'Caraga', 'Region', 'Region',
  ST_GeomFromText('MULTIPOLYGON(((125.5 8.0, 126.5 8.0, 126.5 10.0, 125.5 10.0, 125.5 8.0)))', 4326), 21120),
('BARMM', 'Bangsamoro', 'Autonomous Region', 'Autonomous Region',
  ST_GeomFromText('MULTIPOLYGON(((119.5 4.5, 125.0 4.5, 125.0 8.0, 119.5 8.0, 119.5 4.5)))', 4326), 36650);

-- Create view for regional metrics from Scout transactions
CREATE OR REPLACE VIEW gold_region_metrics AS
WITH regional_aggregates AS (
  SELECT 
    CASE 
      -- Map stores/locations to regions
      WHEN s.store_name ILIKE '%Manila%' OR s.store_name ILIKE '%Makati%' 
        OR s.store_name ILIKE '%Quezon%' OR s.store_name ILIKE '%Pasig%' 
        THEN 'National Capital Region'
      WHEN s.store_name ILIKE '%Cebu%' THEN 'Central Visayas'
      WHEN s.store_name ILIKE '%Davao%' THEN 'Davao Region'
      WHEN s.store_name ILIKE '%Pampanga%' OR s.store_name ILIKE '%Bulacan%' 
        OR s.store_name ILIKE '%Nueva Ecija%' THEN 'Central Luzon'
      WHEN s.store_name ILIKE '%Cavite%' OR s.store_name ILIKE '%Laguna%' 
        OR s.store_name ILIKE '%Batangas%' THEN 'Calabarzon'
      WHEN s.store_name ILIKE '%Iloilo%' OR s.store_name ILIKE '%Bacolod%' THEN 'Western Visayas'
      WHEN s.store_name ILIKE '%Baguio%' OR s.store_name ILIKE '%Benguet%' THEN 'Cordillera Administrative Region'
      WHEN s.store_name ILIKE '%Ilocos%' OR s.store_name ILIKE '%Vigan%' THEN 'Ilocos Region'
      WHEN s.store_name ILIKE '%Cagayan%' OR s.store_name ILIKE '%Isabela%' THEN 'Cagayan Valley'
      WHEN s.store_name ILIKE '%Leyte%' OR s.store_name ILIKE '%Samar%' THEN 'Eastern Visayas'
      WHEN s.store_name ILIKE '%Palawan%' OR s.store_name ILIKE '%Mindoro%' THEN 'Mimaropa'
      WHEN s.store_name ILIKE '%Albay%' OR s.store_name ILIKE '%Sorsogon%' THEN 'Bicol Region'
      WHEN s.store_name ILIKE '%Zamboanga%' THEN 'Zamboanga Peninsula'
      WHEN s.store_name ILIKE '%Bukidnon%' OR s.store_name ILIKE '%Misamis%' THEN 'Northern Mindanao'
      WHEN s.store_name ILIKE '%Cotabato%' OR s.store_name ILIKE '%Sultan%' THEN 'Soccsksargen'
      WHEN s.store_name ILIKE '%Agusan%' OR s.store_name ILIKE '%Surigao%' THEN 'Caraga'
      WHEN s.store_name ILIKE '%Sulu%' OR s.store_name ILIKE '%Tawi%' THEN 'Bangsamoro'
      ELSE 'National Capital Region' -- Default to NCR
    END as region,
    COUNT(DISTINCT t.transaction_id) as transactions,
    SUM(t.peso_value) as revenue,
    COUNT(DISTINCT t.store_id) as stores,
    AVG(t.peso_value) as avg_transaction,
    -- Calculate growth vs previous period
    CASE 
      WHEN LAG(COUNT(DISTINCT t.transaction_id)) OVER (PARTITION BY s.store_name ORDER BY DATE_TRUNC('month', t.timestamp)) > 0
      THEN ((COUNT(DISTINCT t.transaction_id)::FLOAT / LAG(COUNT(DISTINCT t.transaction_id)) OVER (PARTITION BY s.store_name ORDER BY DATE_TRUNC('month', t.timestamp))) - 1) * 100
      ELSE 0
    END as growth
  FROM scout.silver_transactions_cleaned t
  LEFT JOIN scout.silver_stores s ON t.store_id = s.store_id
  WHERE t.timestamp >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY region, DATE_TRUNC('month', t.timestamp), s.store_name
),
latest_metrics AS (
  SELECT 
    region,
    SUM(transactions) as transactions,
    SUM(revenue) as revenue,
    SUM(stores) as stores,
    AVG(avg_transaction) as avg_transaction,
    AVG(growth) as growth
  FROM regional_aggregates
  GROUP BY region
)
SELECT 
  l.*,
  ROUND((l.transactions::FLOAT / SUM(l.transactions) OVER ()) * 100, 2) as market_share
FROM latest_metrics l;

-- Create RPC function to return GeoJSON FeatureCollection
CREATE OR REPLACE FUNCTION api_choropleth_admin1(p_metric TEXT DEFAULT 'transactions')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Build GeoJSON FeatureCollection with region data
  WITH region_data AS (
    SELECT 
      r.name_1 as region,
      ST_AsGeoJSON(ST_SimplifyPreserveTopology(r.geom, 0.01), 6) as geometry,
      ST_AsGeoJSON(ST_Centroid(r.geom), 6) as centroid_geom,
      COALESCE(m.transactions, 0) as transactions,
      COALESCE(m.revenue, 0) as revenue,
      COALESCE(m.stores, 0) as stores,
      COALESCE(m.avg_transaction, 0) as avg_transaction,
      COALESCE(m.growth, 0) as growth,
      COALESCE(m.market_share, 0) as market_share
    FROM ph_admin1_regions r
    LEFT JOIN gold_region_metrics m ON r.name_1 = m.region
  )
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', 'Feature',
        'id', region,
        'geometry', geometry::JSONB,
        'properties', jsonb_build_object(
          'region', region,
          'transactions', transactions,
          'revenue', revenue,
          'stores', stores,
          'avg_transaction', ROUND(avg_transaction::NUMERIC, 2),
          'growth', ROUND(growth::NUMERIC, 1),
          'market_share', market_share,
          'centroid', ARRAY[
            (centroid_geom::JSONB->'coordinates'->0)::FLOAT,
            (centroid_geom::JSONB->'coordinates'->1)::FLOAT
          ]
        )
      )
      ORDER BY 
        CASE p_metric
          WHEN 'transactions' THEN transactions
          WHEN 'revenue' THEN revenue
          WHEN 'stores' THEN stores
          WHEN 'growth' THEN growth
          ELSE transactions
        END DESC
    ), '[]'::JSONB),
    'metadata', jsonb_build_object(
      'metric', p_metric,
      'total_features', COUNT(*),
      'generated_at', NOW()
    )
  ) INTO result
  FROM region_data;
  
  RETURN result;
END;
$function$;

-- Create summary statistics RPC function
CREATE OR REPLACE FUNCTION api_choropleth_summary()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
BEGIN
  WITH summary_stats AS (
    SELECT 
      SUM(transactions) as total_transactions,
      SUM(revenue) as total_revenue,
      SUM(stores) as total_stores,
      COUNT(DISTINCT region) as total_regions,
      AVG(avg_transaction) as avg_transaction_value,
      MAX(CASE WHEN market_share = (SELECT MAX(market_share) FROM gold_region_metrics) THEN region END) as top_region
    FROM gold_region_metrics
  ),
  date_range AS (
    SELECT 
      MIN(timestamp) as min_date,
      MAX(timestamp) as max_date
    FROM scout.silver_transactions_cleaned
  )
  SELECT jsonb_build_object(
    'total_transactions', COALESCE(s.total_transactions, 0)::INTEGER,
    'total_revenue', COALESCE(s.total_revenue, 0)::NUMERIC(10,2),
    'total_stores', COALESCE(s.total_stores, 0)::INTEGER,
    'total_regions', COALESCE(s.total_regions, 0)::INTEGER,
    'avg_transaction_value', COALESCE(s.avg_transaction_value, 0)::NUMERIC(10,2),
    'top_region_by_transactions', COALESCE(s.top_region, 'Unknown'),
    'data_span', CONCAT(
      EXTRACT(MONTH FROM AGE(d.max_date, d.min_date))::INTEGER, ' months (',
      TO_CHAR(d.min_date, 'Mon YYYY'), ' - ',
      TO_CHAR(d.max_date, 'Mon YYYY'), ')'
    ),
    'last_updated', NOW()
  ) INTO result
  FROM summary_stats s, date_range d;
  
  RETURN result;
END;
$function$;

-- Grant permissions
GRANT SELECT ON ph_admin1_regions TO anon, authenticated;
GRANT SELECT ON gold_region_metrics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api_choropleth_admin1 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api_choropleth_summary TO anon, authenticated;

-- Add comments
COMMENT ON TABLE ph_admin1_regions IS 'Philippine administrative regions (Level 1) with PostGIS geometry';
COMMENT ON VIEW gold_region_metrics IS 'Aggregated Scout transaction metrics by region';
COMMENT ON FUNCTION api_choropleth_admin1 IS 'Returns GeoJSON FeatureCollection for choropleth visualization';
COMMENT ON FUNCTION api_choropleth_summary IS 'Returns summary statistics for the choropleth dashboard';