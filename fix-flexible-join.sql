-- Geographic Analytics Dashboard - Flexible Fix for Any Primary Key
-- Project: cxzllzyxwpyptfretryc
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- STEP 1: First run this to see what columns we have
SELECT 
    column_name, 
    data_type,
    CASE 
        WHEN column_name = 'id' THEN 'Likely primary key'
        WHEN column_name = 'gid' THEN 'GADM primary key'
        WHEN column_name = 'objectid' THEN 'ArcGIS primary key'
        WHEN column_name LIKE '%_id' THEN 'Possible ID column'
        ELSE 'Data column'
    END as column_purpose
FROM information_schema.columns
WHERE table_schema = 'geo' 
AND table_name = 'admin2'
ORDER BY ordinal_position;

-- STEP 2: Based on what you see above, use the appropriate fix below

-- ==========================================
-- OPTION A: If the table has an 'id' column
-- ==========================================
-- Add region tracking column to stores
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS region_admin2_id INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stores_region_admin2_id ON public.stores(region_admin2_id);

-- Update stores with their matching region ID using spatial join
UPDATE public.stores s
SET region_admin2_id = r.id  -- Use whatever the actual ID column is named
FROM geo.admin2 r
WHERE ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326));

-- ==========================================
-- OPTION B: If you need to use region_code or region_name as the key
-- ==========================================
-- If there's no numeric ID, use region_code as the foreign key
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS matched_region_code TEXT;

UPDATE public.stores s
SET matched_region_code = r.region_code
FROM geo.admin2 r
WHERE ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
  AND r.region_code IS NOT NULL;

-- ==========================================
-- VERIFICATION - This works regardless of column names
-- ==========================================
-- Check how many stores matched to regions
WITH store_matches AS (
    SELECT 
        s.store_name,
        s.city,
        s.region as stated_region,
        r.*
    FROM public.stores s
    LEFT JOIN geo.admin2 r 
        ON ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
)
SELECT 
    COUNT(*) as total_stores,
    COUNT(CASE WHEN region_name IS NOT NULL THEN 1 END) as matched_stores,
    COUNT(CASE WHEN region_name IS NULL THEN 1 END) as unmatched_stores
FROM store_matches;

-- Show which stores matched to which regions
SELECT 
    s.store_name,
    s.city,
    s.region as stated_region,
    r.region_name as matched_region_name,
    r.region_code as matched_region_code,
    CASE 
        WHEN r.region_name IS NOT NULL THEN '✅ Matched'
        ELSE '❌ No match'
    END as match_status
FROM public.stores s
LEFT JOIN geo.admin2 r 
    ON ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
ORDER BY match_status DESC, s.store_name;

-- ==========================================
-- UPDATE RPC FUNCTIONS to use spatial joins directly
-- ==========================================
-- This version doesn't rely on foreign keys, just spatial relationships
CREATE OR REPLACE FUNCTION get_choropleth_data(
    start_date TIMESTAMPTZ DEFAULT '2025-06-01',
    end_date TIMESTAMPTZ DEFAULT '2025-07-31',
    metric TEXT DEFAULT 'sales'
)
RETURNS TABLE (
    region_name TEXT,
    region_code TEXT,
    geometry JSON,
    value DECIMAL,
    store_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.region_name,
        a.region_code,
        ST_AsGeoJSON(a.geometry)::JSON as geometry,
        CASE 
            WHEN metric = 'sales' THEN COALESCE(SUM(e.sales_amount), 0)
            WHEN metric = 'events' THEN COALESCE(COUNT(e.id), 0)::DECIMAL
            WHEN metric = 'avg_qty' THEN COALESCE(AVG(e.quantity), 0)
        END as value,
        COUNT(DISTINCT s.id) as store_count
    FROM geo.admin2 a
    LEFT JOIN public.stores s 
        ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
    LEFT JOIN silver.clean_events e 
        ON e.store_id = s.id 
        AND e.event_ts >= start_date 
        AND e.event_ts <= end_date
    GROUP BY a.region_name, a.region_code, a.geometry;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_brand_performance(
    start_date TIMESTAMPTZ DEFAULT '2025-06-01',
    end_date TIMESTAMPTZ DEFAULT '2025-07-31'
)
RETURNS TABLE (
    region_name TEXT,
    brand_name TEXT,
    total_sales DECIMAL,
    event_count BIGINT,
    avg_quantity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.region_name,
        e.brand_name,
        SUM(e.sales_amount) as total_sales,
        COUNT(e.id) as event_count,
        AVG(e.quantity) as avg_quantity
    FROM geo.admin2 a
    JOIN public.stores s 
        ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
    JOIN silver.clean_events e 
        ON e.store_id = s.id
    WHERE e.event_ts >= start_date 
        AND e.event_ts <= end_date
    GROUP BY a.region_name, e.brand_name
    ORDER BY a.region_name, total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- Create regional analytics view using spatial joins
CREATE OR REPLACE VIEW geo.regional_analytics AS
SELECT 
    a.region_name,
    a.region_code,
    COUNT(DISTINCT e.id) as event_count,
    SUM(e.sales_amount) as total_sales,
    AVG(e.quantity) as avg_quantity,
    COUNT(DISTINCT s.id) as store_count
FROM geo.admin2 a
LEFT JOIN public.stores s 
    ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
LEFT JOIN silver.clean_events e 
    ON e.store_id = s.id
GROUP BY a.region_name, a.region_code;

-- Final verification
SELECT 
    'Regions loaded' as check_type,
    COUNT(*) as count
FROM geo.admin2
WHERE region_code LIKE 'PH-%'
UNION ALL
SELECT 
    'Stores with spatial match' as check_type,
    COUNT(DISTINCT s.id) as count
FROM public.stores s
JOIN geo.admin2 r 
    ON ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
UNION ALL
SELECT 
    'Regions with stores' as check_type,
    COUNT(DISTINCT r.region_code) as count
FROM geo.admin2 r
JOIN public.stores s 
    ON ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
WHERE r.region_code LIKE 'PH-%';