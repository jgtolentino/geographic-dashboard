-- ====================================================================
-- GEO AGGREGATION RPC FOR GL MAP
-- Server-side aggregation for high-performance map visualization
-- ====================================================================

-- Create RPC function for aggregated geo points by zoom level
CREATE OR REPLACE FUNCTION get_gold_geo_agg(
  p_filters JSONB DEFAULT '{}',
  p_zoom_level INTEGER DEFAULT 6,
  p_metric TEXT DEFAULT 'transactions'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
  aggregation_level TEXT;
BEGIN
  -- Determine aggregation level based on zoom
  aggregation_level := CASE 
    WHEN p_zoom_level < 7 THEN 'region'     -- Country-wide view
    WHEN p_zoom_level < 10 THEN 'province'  -- Regional view
    WHEN p_zoom_level < 13 THEN 'city'      -- Provincial view
    ELSE 'barangay'                         -- City view
  END;
  
  -- Build aggregated result based on level
  WITH store_locations AS (
    -- Get store locations with transactions
    SELECT DISTINCT
      s.store_id,
      s.store_name,
      COALESCE(s.latitude, 14.5995) as lat,  -- Default to Manila if no coords
      COALESCE(s.longitude, 120.9842) as lng,
      COALESCE(s.location_region, 'NCR') as region,
      COALESCE(s.location_province, 'Metro Manila') as province,
      COALESCE(s.location_city, 'Manila') as city,
      COALESCE(s.location_barangay, '') as barangay
    FROM scout.silver_stores s
    WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
  ),
  transaction_aggregates AS (
    -- Aggregate transactions by store
    SELECT 
      t.store_id,
      COUNT(DISTINCT t.transaction_id) as transactions,
      SUM(t.peso_value) as revenue,
      COUNT(DISTINCT t.store_id) as stores,
      AVG(t.peso_value) as avg_transaction
    FROM scout.silver_transactions_cleaned t
    WHERE 
      -- Apply date filter if provided
      (p_filters->>'date_from' IS NULL OR t.timestamp >= (p_filters->>'date_from')::DATE) AND
      (p_filters->>'date_to' IS NULL OR t.timestamp <= (p_filters->>'date_to')::DATE) AND
      -- Apply region filter if provided
      (p_filters->>'region' IS NULL OR EXISTS (
        SELECT 1 FROM store_locations sl 
        WHERE sl.store_id = t.store_id AND sl.region = p_filters->>'region'
      ))
    GROUP BY t.store_id
  ),
  aggregated_points AS (
    SELECT 
      CASE aggregation_level
        WHEN 'region' THEN sl.region
        WHEN 'province' THEN sl.province
        WHEN 'city' THEN sl.city
        ELSE sl.barangay || ', ' || sl.city
      END as name,
      sl.region,
      CASE aggregation_level
        WHEN 'region' THEN 
          CASE sl.region
            WHEN 'NCR' THEN 14.5995
            WHEN 'Central Visayas' THEN 10.3157
            WHEN 'Davao Region' THEN 7.0644
            WHEN 'Central Luzon' THEN 15.4827
            WHEN 'Calabarzon' THEN 14.1008
            ELSE AVG(sl.lat)
          END
        ELSE AVG(sl.lat)
      END as lat,
      CASE aggregation_level
        WHEN 'region' THEN 
          CASE sl.region
            WHEN 'NCR' THEN 120.9842
            WHEN 'Central Visayas' THEN 123.8854
            WHEN 'Davao Region' THEN 125.4554
            WHEN 'Central Luzon' THEN 120.7120
            WHEN 'Calabarzon' THEN 121.0792
            ELSE AVG(sl.lng)
          END
        ELSE AVG(sl.lng)
      END as lng,
      SUM(COALESCE(ta.transactions, 0)) as transactions,
      SUM(COALESCE(ta.revenue, 0)) as revenue,
      COUNT(DISTINCT sl.store_id) as stores,
      AVG(COALESCE(ta.avg_transaction, 0)) as avg_transaction
    FROM store_locations sl
    LEFT JOIN transaction_aggregates ta ON sl.store_id = ta.store_id
    GROUP BY 
      CASE aggregation_level
        WHEN 'region' THEN sl.region
        WHEN 'province' THEN sl.province
        WHEN 'city' THEN sl.city
        ELSE sl.barangay || ', ' || sl.city
      END,
      sl.region
  )
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', 'Feature',
        'geometry', jsonb_build_object(
          'type', 'Point',
          'coordinates', ARRAY[lng, lat]
        ),
        'properties', jsonb_build_object(
          'id', name,
          'name', name,
          'region', region,
          'transactions', transactions,
          'revenue', revenue,
          'stores', stores,
          'avg_transaction', ROUND(avg_transaction::NUMERIC, 2),
          'lng', lng,
          'lat', lat
        )
      )
      ORDER BY 
        CASE p_metric
          WHEN 'transactions' THEN transactions
          WHEN 'revenue' THEN revenue
          WHEN 'stores' THEN stores
          ELSE transactions
        END DESC
    ), '[]'::JSONB),
    'metadata', jsonb_build_object(
      'metric', p_metric,
      'zoom_level', p_zoom_level,
      'aggregation_level', aggregation_level,
      'total_points', COUNT(*),
      'filters', p_filters,
      'generated_at', NOW()
    )
  ) INTO result
  FROM aggregated_points
  WHERE 
    CASE p_metric
      WHEN 'transactions' THEN transactions
      WHEN 'revenue' THEN revenue
      WHEN 'stores' THEN stores
      ELSE transactions
    END > 0;
  
  RETURN result;
END;
$function$;

-- Create RPC for getting barangay-level boundaries (if available)
CREATE OR REPLACE FUNCTION get_barangay_boundaries(
  p_city TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- This would return actual barangay boundaries if you have them
  -- For now, return empty GeoJSON
  result := jsonb_build_object(
    'type', 'FeatureCollection',
    'features', '[]'::JSONB
  );
  
  -- TODO: When barangay boundary data is available:
  -- SELECT jsonb_build_object(
  --   'type', 'FeatureCollection',
  --   'features', jsonb_agg(
  --     jsonb_build_object(
  --       'type', 'Feature',
  --       'geometry', ST_AsGeoJSON(geom)::JSONB,
  --       'properties', jsonb_build_object(
  --         'barangay', barangay_name,
  --         'city', city_name,
  --         'province', province_name
  --       )
  --     )
  --   )
  -- ) INTO result
  -- FROM ph_barangay_boundaries
  -- WHERE 
  --   (p_city IS NULL OR city_name = p_city) AND
  --   (p_province IS NULL OR province_name = p_province);
  
  RETURN result;
END;
$function$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_silver_stores_location 
ON scout.silver_stores(location_region, location_province, location_city, location_barangay);

CREATE INDEX IF NOT EXISTS idx_silver_stores_coords 
ON scout.silver_stores(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_gold_geo_agg TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_barangay_boundaries TO anon, authenticated;

-- Add comments
COMMENT ON FUNCTION get_gold_geo_agg IS 'Returns aggregated geo points for map visualization based on zoom level';
COMMENT ON FUNCTION get_barangay_boundaries IS 'Returns barangay-level boundaries for detailed drill-down';