-- Geographic Analytics Dashboard - Fix using GID column
-- Project: cxzllzyxwpyptfretryc
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- First, check the actual columns in geo.admin2
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'geo' AND table_name = 'admin2'
ORDER BY ordinal_position;

-- Add region tracking column to stores using the correct GID reference
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS region_gid INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stores_region_gid ON public.stores(region_gid);

-- Update stores with their matching region GID
UPDATE public.stores s
SET region_gid = r.gid
FROM geo.admin2 r
WHERE ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326));

-- Verify the update worked
SELECT 
  COUNT(*) as total_stores,
  COUNT(region_gid) as matched_stores,
  COUNT(*) - COUNT(region_gid) as unmatched_stores
FROM public.stores;

-- Check which stores matched to which regions
SELECT 
  s.store_name,
  s.city,
  s.region as region_name_text,
  r.gid,
  r.name_1 as gadm_region_name,
  ST_AsText(ST_Centroid(r.geometry)) as region_centroid
FROM public.stores s
LEFT JOIN geo.admin2 r ON s.region_gid = r.gid
ORDER BY r.gid, s.store_name;

-- If you need to add the missing columns for Philippine region data, 
-- add them to match your application needs while keeping GADM structure intact
ALTER TABLE geo.admin2
  ADD COLUMN IF NOT EXISTS region_name TEXT,
  ADD COLUMN IF NOT EXISTS region_code TEXT,
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS area_sq_km DECIMAL(10,2);

-- Update the custom columns based on GADM data
-- This assumes name_1 contains the region name in GADM
UPDATE geo.admin2
SET 
  region_name = name_1,
  region_code = CASE 
    WHEN name_1 LIKE '%NCR%' OR name_1 LIKE '%National Capital%' THEN 'PH-00'
    WHEN name_1 LIKE '%Ilocos%' THEN 'PH-01'
    WHEN name_1 LIKE '%Cagayan Valley%' THEN 'PH-02'
    WHEN name_1 LIKE '%Central Luzon%' THEN 'PH-03'
    WHEN name_1 LIKE '%CALABARZON%' OR name_1 LIKE '%IV-A%' THEN 'PH-40'
    WHEN name_1 LIKE '%MIMAROPA%' OR name_1 LIKE '%IV-B%' THEN 'PH-41'
    WHEN name_1 LIKE '%Bicol%' THEN 'PH-05'
    WHEN name_1 LIKE '%Western Visayas%' THEN 'PH-06'
    WHEN name_1 LIKE '%Central Visayas%' THEN 'PH-07'
    WHEN name_1 LIKE '%Eastern Visayas%' THEN 'PH-08'
    WHEN name_1 LIKE '%Zamboanga%' THEN 'PH-09'
    WHEN name_1 LIKE '%Northern Mindanao%' THEN 'PH-10'
    WHEN name_1 LIKE '%Davao%' THEN 'PH-11'
    WHEN name_1 LIKE '%SOCCSKSARGEN%' OR name_1 LIKE '%XII%' THEN 'PH-12'
    WHEN name_1 LIKE '%Caraga%' THEN 'PH-13'
    WHEN name_1 LIKE '%BARMM%' OR name_1 LIKE '%Bangsamoro%' THEN 'PH-14'
    WHEN name_1 LIKE '%CAR%' OR name_1 LIKE '%Cordillera%' THEN 'PH-15'
    ELSE 'PH-99'
  END
WHERE region_code IS NULL;

-- Update RPC functions to use GID
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
        COALESCE(a.region_name, a.name_1) as region_name,
        COALESCE(a.region_code, 'PH-' || a.gid::text) as region_code,
        ST_AsGeoJSON(a.geometry)::JSON as geometry,
        CASE 
            WHEN metric = 'sales' THEN COALESCE(SUM(e.sales_amount), 0)
            WHEN metric = 'events' THEN COALESCE(COUNT(e.id), 0)::DECIMAL
            WHEN metric = 'avg_qty' THEN COALESCE(AVG(e.quantity), 0)
        END as value,
        COUNT(DISTINCT s.id) as store_count
    FROM geo.admin2 a
    LEFT JOIN public.stores s ON s.region_gid = a.gid
    LEFT JOIN silver.clean_events e ON e.store_id = s.id 
        AND e.event_ts >= start_date 
        AND e.event_ts <= end_date
    GROUP BY a.gid, a.region_name, a.region_code, a.name_1, a.geometry;
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
        COALESCE(a.region_name, a.name_1) as region_name,
        e.brand_name,
        SUM(e.sales_amount) as total_sales,
        COUNT(e.id) as event_count,
        AVG(e.quantity) as avg_quantity
    FROM geo.admin2 a
    JOIN public.stores s ON s.region_gid = a.gid
    JOIN silver.clean_events e ON e.store_id = s.id
    WHERE e.event_ts >= start_date AND e.event_ts <= end_date
    GROUP BY a.gid, a.region_name, a.name_1, e.brand_name
    ORDER BY region_name, total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- Create or update the regional analytics view to use GID
CREATE OR REPLACE VIEW geo.regional_analytics AS
SELECT 
    a.gid,
    COALESCE(a.region_name, a.name_1) as region_name,
    COALESCE(a.region_code, 'PH-' || a.gid::text) as region_code,
    COUNT(DISTINCT e.id) as event_count,
    SUM(e.sales_amount) as total_sales,
    AVG(e.quantity) as avg_quantity,
    COUNT(DISTINCT s.id) as store_count
FROM geo.admin2 a
LEFT JOIN public.stores s ON s.region_gid = a.gid
LEFT JOIN silver.clean_events e ON e.store_id = s.id
GROUP BY a.gid, a.region_name, a.region_code, a.name_1;

-- Final verification
SELECT 
    'Regions in geo.admin2' as check_type,
    COUNT(*) as count,
    'Using GID as primary key' as note
FROM geo.admin2
UNION ALL
SELECT 
    'Stores with region_gid' as check_type,
    COUNT(*) as count,
    'Matched via spatial join' as note
FROM public.stores
WHERE region_gid IS NOT NULL
UNION ALL
SELECT 
    'Regions with stores' as check_type,
    COUNT(DISTINCT region_gid) as count,
    'Unique regions with stores' as note
FROM public.stores
WHERE region_gid IS NOT NULL
UNION ALL
SELECT 
    'Events by region' as check_type,
    COUNT(DISTINCT s.region_gid) as count,
    'Regions with sales data' as note
FROM silver.clean_events e
JOIN public.stores s ON e.store_id = s.id
WHERE s.region_gid IS NOT NULL;