-- Geographic Analytics Dashboard - Hardening Steps
-- Project: cxzllzyxwpyptfretryc
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- ==========================================
-- STEP 1: Auto-populate region on store insert/update
-- ==========================================

-- First, let's check what the actual foreign key column is named
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stores' 
AND column_name LIKE '%region%';

-- Create the auto-population function
-- Note: Adjust column names based on your actual schema
CREATE OR REPLACE FUNCTION public.set_region_fk()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Find the region that contains this store's location
  NEW.region_admin2_id := (
    SELECT r.id  -- or r.admin2_id, r.gid - use actual primary key column
    FROM geo.admin2 r
    WHERE ST_Contains(
      r.geometry, 
      ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)
    )
    LIMIT 1
  );
  
  -- Enforce that every store must be within a region
  IF NEW.region_admin2_id IS NULL THEN
    RAISE EXCEPTION 'Store location (%, %) is outside any admin2 region polygon', 
      NEW.latitude, NEW.longitude;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set region on insert or location update
DROP TRIGGER IF EXISTS trg_set_region_fk ON public.stores;
CREATE TRIGGER trg_set_region_fk
BEFORE INSERT OR UPDATE OF latitude, longitude
ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.set_region_fk();

-- Test the trigger with a new store
-- This should automatically set the region_admin2_id
INSERT INTO public.stores (store_name, latitude, longitude, address, city, region)
VALUES ('Test Store Auto Region', 14.5995, 120.9842, 'Test Address', 'Manila', 'NCR');

-- Verify it worked
SELECT store_name, latitude, longitude, region_admin2_id
FROM public.stores
WHERE store_name = 'Test Store Auto Region';

-- ==========================================
-- STEP 2: Create convenience view for analysts
-- ==========================================

-- Create analytics schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS analytics;

-- Create the convenience view joining stores with regions
CREATE OR REPLACE VIEW analytics.v_store_region AS
SELECT 
    s.id AS store_id,
    s.store_name,
    s.address,
    s.city,
    s.region AS stated_region,
    r.region_name AS actual_region_name,
    r.region_code,
    r.population AS region_population,
    r.area_sq_km AS region_area_sq_km,
    s.latitude,
    s.longitude,
    s.created_at AS store_created_at
FROM public.stores s
JOIN geo.admin2 r ON r.id = s.region_admin2_id;  -- Adjust join column as needed

-- Grant access to the view
GRANT USAGE ON SCHEMA analytics TO anon, authenticated;
GRANT SELECT ON analytics.v_store_region TO anon, authenticated;

-- Test the view
SELECT * FROM analytics.v_store_region LIMIT 5;

-- Create additional analytical views
CREATE OR REPLACE VIEW analytics.v_regional_store_summary AS
SELECT 
    r.region_name,
    r.region_code,
    COUNT(DISTINCT s.id) AS store_count,
    r.population,
    CASE 
        WHEN r.population > 0 THEN 
            ROUND((COUNT(DISTINCT s.id) * 1000000.0 / r.population)::numeric, 2)
        ELSE 0
    END AS stores_per_million_pop,
    r.area_sq_km,
    CASE 
        WHEN r.area_sq_km > 0 THEN 
            ROUND((COUNT(DISTINCT s.id) / r.area_sq_km)::numeric, 4)
        ELSE 0
    END AS store_density_per_sq_km
FROM geo.admin2 r
LEFT JOIN public.stores s ON s.region_admin2_id = r.id
WHERE r.region_code LIKE 'PH-%'
GROUP BY r.region_name, r.region_code, r.population, r.area_sq_km
ORDER BY store_count DESC;

-- ==========================================
-- STEP 3: CI/CD Guardrails
-- ==========================================

-- Create a test function for CI/CD pipelines
CREATE OR REPLACE FUNCTION analytics.validate_spatial_integrity()
RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
BEGIN
    -- Test 1: No stores without regions
    RETURN QUERY
    SELECT 
        'All stores have regions'::TEXT,
        (SELECT COUNT(*) = 0 FROM public.stores WHERE region_admin2_id IS NULL),
        format('%s stores without regions', 
            (SELECT COUNT(*) FROM public.stores WHERE region_admin2_id IS NULL));

    -- Test 2: All regions are valid
    RETURN QUERY
    SELECT 
        'All store regions exist in admin2'::TEXT,
        (SELECT COUNT(*) = 0 
         FROM public.stores s 
         LEFT JOIN geo.admin2 r ON r.id = s.region_admin2_id 
         WHERE s.region_admin2_id IS NOT NULL AND r.id IS NULL),
        format('%s stores with invalid region references', 
            (SELECT COUNT(*) 
             FROM public.stores s 
             LEFT JOIN geo.admin2 r ON r.id = s.region_admin2_id 
             WHERE s.region_admin2_id IS NOT NULL AND r.id IS NULL));

    -- Test 3: Spatial consistency check
    RETURN QUERY
    WITH spatial_check AS (
        SELECT s.id, s.store_name
        FROM public.stores s
        JOIN geo.admin2 r ON r.id = s.region_admin2_id
        WHERE NOT ST_Contains(
            r.geometry, 
            ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)
        )
    )
    SELECT 
        'Spatial consistency (stores within their assigned regions)'::TEXT,
        (SELECT COUNT(*) = 0 FROM spatial_check),
        format('%s stores not contained within their assigned regions', 
            (SELECT COUNT(*) FROM spatial_check));

    -- Test 4: Coverage check
    RETURN QUERY
    SELECT 
        'All regions have at least one store'::TEXT,
        (SELECT COUNT(*) = 0 
         FROM geo.admin2 r 
         LEFT JOIN public.stores s ON s.region_admin2_id = r.id 
         WHERE r.region_code LIKE 'PH-%' 
         GROUP BY r.id 
         HAVING COUNT(s.id) = 0),
        format('%s regions without any stores', 
            (SELECT COUNT(*) 
             FROM geo.admin2 r 
             LEFT JOIN public.stores s ON s.region_admin2_id = r.id 
             WHERE r.region_code LIKE 'PH-%' 
             GROUP BY r.id 
             HAVING COUNT(s.id) = 0));
END;
$$ LANGUAGE plpgsql;

-- Run all validation tests
SELECT * FROM analytics.validate_spatial_integrity();

-- Create a simple pass/fail function for CI/CD
CREATE OR REPLACE FUNCTION analytics.ci_spatial_tests_pass()
RETURNS BOOLEAN AS $$
    SELECT bool_and(passed) FROM analytics.validate_spatial_integrity();
$$ LANGUAGE sql;

-- This should return TRUE if all tests pass
SELECT analytics.ci_spatial_tests_pass() as all_tests_pass;

-- ==========================================
-- BONUS: Performance optimization
-- ==========================================

-- Add spatial index on stores location for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_location 
ON public.stores 
USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Add index on foreign key for faster joins
CREATE INDEX IF NOT EXISTS idx_stores_region_fk 
ON public.stores(region_admin2_id);

-- Analyze tables for query planner
ANALYZE public.stores;
ANALYZE geo.admin2;

-- ==========================================
-- Final Summary
-- ==========================================
SELECT 
    'Spatial Integrity Summary' as report,
    json_build_object(
        'total_stores', (SELECT COUNT(*) FROM public.stores),
        'stores_with_regions', (SELECT COUNT(*) FROM public.stores WHERE region_admin2_id IS NOT NULL),
        'unique_regions_with_stores', (SELECT COUNT(DISTINCT region_admin2_id) FROM public.stores WHERE region_admin2_id IS NOT NULL),
        'total_regions', (SELECT COUNT(*) FROM geo.admin2 WHERE region_code LIKE 'PH-%'),
        'ci_tests_pass', (SELECT analytics.ci_spatial_tests_pass()),
        'trigger_active', (SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_region_fk')),
        'analytics_views_created', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'analytics')
    ) as status;