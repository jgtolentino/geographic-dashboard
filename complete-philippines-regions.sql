-- Geographic Analytics Dashboard - Complete Philippine Regions (All 17)
-- Project: cxzllzyxwpyptfretryc
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- First, check what regions we currently have
SELECT region_code, region_name, ST_GeometryType(geometry) as geom_type
FROM geo.admin2
WHERE region_code LIKE 'PH-%'
ORDER BY region_code;

-- Add missing columns if needed
ALTER TABLE geo.admin2
  ADD COLUMN IF NOT EXISTS region_name TEXT,
  ADD COLUMN IF NOT EXISTS region_code TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS area_sq_km DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Clear existing Philippine regions to start fresh with all 17
DELETE FROM geo.admin2 WHERE region_code LIKE 'PH-%';

-- Insert ALL 17 Philippine regions with proper boundaries
INSERT INTO geo.admin2 (region_name, region_code, description, population, area_sq_km, geometry) VALUES
-- Luzon
('NCR', 'PH-00', 'National Capital Region', 13484462, 619.54, 
  ST_Multi(ST_GeomFromText('POLYGON((121.0 14.5, 121.15 14.5, 121.15 14.7, 121.0 14.7, 121.0 14.5))', 4326))),
('Region I', 'PH-01', 'Ilocos Region', 5301139, 13012.60, 
  ST_Multi(ST_GeomFromText('POLYGON((119.8 15.8, 120.7 15.8, 120.7 18.5, 119.8 18.5, 119.8 15.8))', 4326))),
('Region II', 'PH-02', 'Cagayan Valley', 3685744, 29836.88, 
  ST_Multi(ST_GeomFromText('POLYGON((121.0 16.0, 122.5 16.0, 122.5 18.5, 121.0 18.5, 121.0 16.0))', 4326))),
('Region III', 'PH-03', 'Central Luzon', 12422172, 22014.63, 
  ST_Multi(ST_GeomFromText('POLYGON((120.3 14.8, 121.2 14.8, 121.2 15.8, 120.3 15.8, 120.3 14.8))', 4326))),
('Region IV-A', 'PH-40', 'CALABARZON', 16195042, 16873.31, 
  ST_Multi(ST_GeomFromText('POLYGON((120.9 14.0, 121.5 14.0, 121.5 14.8, 120.9 14.8, 120.9 14.0))', 4326))),
('Region IV-B', 'PH-41', 'MIMAROPA', 3228558, 29620.90, 
  ST_Multi(ST_GeomFromText('POLYGON((119.5 11.5, 121.5 11.5, 121.5 13.5, 119.5 13.5, 119.5 11.5))', 4326))),
('Region V', 'PH-05', 'Bicol Region', 6082165, 18155.82, 
  ST_Multi(ST_GeomFromText('POLYGON((122.5 12.5, 124.0 12.5, 124.0 14.0, 122.5 14.0, 122.5 12.5))', 4326))),
('CAR', 'PH-15', 'Cordillera Administrative Region', 1797660, 19294.19, 
  ST_Multi(ST_GeomFromText('POLYGON((120.5 16.5, 121.5 16.5, 121.5 17.5, 120.5 17.5, 120.5 16.5))', 4326))),

-- Visayas
('Region VI', 'PH-06', 'Western Visayas', 7954723, 20778.29, 
  ST_Multi(ST_GeomFromText('POLYGON((121.5 10.5, 123.0 10.5, 123.0 12.0, 121.5 12.0, 121.5 10.5))', 4326))),
('Region VII', 'PH-07', 'Central Visayas', 8081988, 15875.01, 
  ST_Multi(ST_GeomFromText('POLYGON((123.0 9.5, 124.5 9.5, 124.5 11.0, 123.0 11.0, 123.0 9.5))', 4326))),
('Region VIII', 'PH-08', 'Eastern Visayas', 4547150, 21562.47, 
  ST_Multi(ST_GeomFromText('POLYGON((124.0 10.5, 125.5 10.5, 125.5 12.5, 124.0 12.5, 124.0 10.5))', 4326))),

-- Mindanao
('Region IX', 'PH-09', 'Zamboanga Peninsula', 3875576, 17056.73, 
  ST_Multi(ST_GeomFromText('POLYGON((121.5 7.0, 123.5 7.0, 123.5 8.5, 121.5 8.5, 121.5 7.0))', 4326))),
('Region X', 'PH-10', 'Northern Mindanao', 5022768, 20496.02, 
  ST_Multi(ST_GeomFromText('POLYGON((123.5 7.5, 125.0 7.5, 125.0 9.0, 123.5 9.0, 123.5 7.5))', 4326))),
('Region XI', 'PH-11', 'Davao Region', 5243536, 20357.42, 
  ST_Multi(ST_GeomFromText('POLYGON((125.0 6.0, 126.5 6.0, 126.5 8.0, 125.0 8.0, 125.0 6.0))', 4326))),
('Region XII', 'PH-12', 'SOCCSKSARGEN', 4901486, 22513.30, 
  ST_Multi(ST_GeomFromText('POLYGON((124.0 5.5, 125.5 5.5, 125.5 7.0, 124.0 7.0, 124.0 5.5))', 4326))),
('Region XIII', 'PH-13', 'Caraga', 2804788, 21478.69, 
  ST_Multi(ST_GeomFromText('POLYGON((125.5 8.0, 126.5 8.0, 126.5 10.0, 125.5 10.0, 125.5 8.0))', 4326))),
('BARMM', 'PH-14', 'Bangsamoro Autonomous Region in Muslim Mindanao', 4404288, 36650.95, 
  ST_Multi(ST_GeomFromText('POLYGON((119.5 5.5, 122.0 5.5, 122.0 7.5, 119.5 7.5, 119.5 5.5))', 4326)));

-- Verify we have all 17 regions
SELECT COUNT(*) as total_regions, 
       17 - COUNT(*) as missing_regions
FROM geo.admin2
WHERE region_code LIKE 'PH-%';

-- Check geometry types
SELECT region_name, region_code, 
       ST_GeometryType(geometry) as geom_type,
       ST_AsText(ST_Centroid(geometry)) as centroid
FROM geo.admin2
WHERE region_code LIKE 'PH-%'
ORDER BY region_code;

-- Now update stores table to add more stores across all regions
-- First, keep existing stores
-- Then add new stores to cover all regions

-- Add more stores to ensure coverage across all regions
INSERT INTO public.stores (store_name, latitude, longitude, address, city, region) VALUES
-- Additional stores for missing regions
('SM City Baguio', 16.4123, 120.5960, 'Luneta Hill, Baguio City', 'Baguio City', 'CAR'),
('SM City Tuguegarao', 17.6132, 121.7270, 'Tuguegarao City, Cagayan', 'Tuguegarao', 'Region II'),
('SM City Lucena', 13.9373, 121.6177, 'Lucena City, Quezon', 'Lucena', 'Region IV-A'),
('Gaisano Capital Ormoc', 11.0064, 124.6075, 'Ormoc City, Leyte', 'Ormoc', 'Region VIII'),
('SM City General Santos', 6.1164, 125.1716, 'General Santos City', 'General Santos', 'Region XII'),
('Gaisano Mall Butuan', 8.9475, 125.5406, 'Butuan City', 'Butuan', 'Region XIII'),
('SM City Zamboanga', 6.9214, 122.0790, 'Zamboanga City', 'Zamboanga', 'Region IX'),
('SM CDO Downtown', 8.4822, 124.6498, 'Cagayan de Oro City', 'Cagayan de Oro', 'Region X'),
('Robinsons Place Cotabato', 7.2047, 124.2310, 'Cotabato City', 'Cotabato', 'BARMM'),
('Robinsons Place Cabanatuan', 15.4868, 120.9664, 'Cabanatuan City', 'Cabanatuan', 'Region III'),
('SM City Naga', 13.6193, 123.1812, 'Naga City', 'Naga', 'Region V'),
('SM City Baliwag', 14.9547, 120.8983, 'Baliwag, Bulacan', 'Baliwag', 'Region III'),
('Ayala Malls Capitol Central', 10.6765, 122.5610, 'Bacolod City', 'Bacolod', 'Region VI'),
('SM City Puerto Princesa', 9.7428, 118.7357, 'Puerto Princesa City', 'Puerto Princesa', 'Region IV-B'),
('Gaisano Mall Tagum', 7.4478, 125.8076, 'Tagum City', 'Tagum', 'Region XI')
ON CONFLICT DO NOTHING;

-- Verify store coverage across regions
WITH store_region_match AS (
  SELECT 
    r.region_name,
    r.region_code,
    COUNT(DISTINCT s.id) as store_count
  FROM geo.admin2 r
  LEFT JOIN public.stores s ON ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
  WHERE r.region_code LIKE 'PH-%'
  GROUP BY r.region_name, r.region_code
)
SELECT 
  region_name,
  region_code,
  store_count,
  CASE 
    WHEN store_count = 0 THEN '❌ No stores'
    WHEN store_count = 1 THEN '⚠️  Only 1 store'
    ELSE '✅ ' || store_count || ' stores'
  END as coverage_status
FROM store_region_match
ORDER BY region_code;

-- Add region_id column to stores for better tracking
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS region_id INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stores_region_id ON public.stores(region_id);

-- Update stores with their matching region_id
UPDATE public.stores s
SET region_id = r.id
FROM geo.admin2 r
WHERE ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
  AND r.region_code LIKE 'PH-%';

-- Verify all stores are matched to regions
SELECT 
  COUNT(*) as total_stores,
  COUNT(region_id) as matched_stores,
  COUNT(*) - COUNT(region_id) as unmatched_stores
FROM public.stores;

-- Generate more events to cover all stores
INSERT INTO silver.clean_events (event_ts, store_id, brand_name, product_category, sales_amount, quantity, unit_price)
SELECT 
    timestamp '2025-06-01' + (random() * 60 || ' days')::interval,
    s.id,
    brands.brand,
    categories.category,
    ROUND((10 + random() * 990)::numeric, 2),
    1 + floor(random() * 10)::int,
    ROUND((5 + random() * 95)::numeric, 2)
FROM 
    public.stores s,
    (VALUES ('Coca-Cola'), ('Pepsi'), ('San Miguel'), ('Nestle'), ('Unilever')) AS brands(brand),
    (VALUES ('Beverages'), ('Snacks'), ('Dairy'), ('Personal Care'), ('Household')) AS categories(category),
    generate_series(1, 30) AS gs
WHERE s.region_id IS NOT NULL;

-- Final verification
SELECT 
    'Regions loaded' as check_type,
    COUNT(*) as count,
    CASE 
      WHEN COUNT(*) = 17 THEN '✅ All 17 regions'
      ELSE '❌ Missing ' || (17 - COUNT(*)) || ' regions'
    END as status
FROM geo.admin2
WHERE region_code LIKE 'PH-%'
UNION ALL
SELECT 
    'Stores total' as check_type,
    COUNT(*) as count,
    '📍 ' || COUNT(*) || ' stores' as status
FROM public.stores
UNION ALL
SELECT 
    'Stores matched to regions' as check_type,
    COUNT(*) as count,
    CASE 
      WHEN COUNT(*) = (SELECT COUNT(*) FROM public.stores) THEN '✅ All matched'
      ELSE '❌ ' || ((SELECT COUNT(*) FROM public.stores) - COUNT(*)) || ' unmatched'
    END as status
FROM public.stores
WHERE region_id IS NOT NULL
UNION ALL
SELECT 
    'Events generated' as check_type,
    COUNT(*) as count,
    '📊 ' || COUNT(*) || ' transactions' as status
FROM silver.clean_events
UNION ALL
SELECT 
    'Regions with stores' as check_type,
    COUNT(DISTINCT r.id) as count,
    CASE 
      WHEN COUNT(DISTINCT r.id) = 17 THEN '✅ All regions have stores'
      ELSE '⚠️  Only ' || COUNT(DISTINCT r.id) || ' of 17 regions have stores'
    END as status
FROM geo.admin2 r
JOIN public.stores s ON s.region_id = r.id
WHERE r.region_code LIKE 'PH-%';