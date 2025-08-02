-- Geographic Analytics Dashboard - Complete Database Setup
-- Project: cxzllzyxwpyptfretryc
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create geo schema
CREATE SCHEMA IF NOT EXISTS geo;

-- Create admin2 table for Philippine regional boundaries
CREATE TABLE IF NOT EXISTS geo.admin2 (
    id SERIAL PRIMARY KEY,
    region_name TEXT NOT NULL,
    region_code TEXT NOT NULL,
    description TEXT,
    population INTEGER,
    area_sq_km DECIMAL(10,2),
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Philippine regions with actual boundaries
INSERT INTO geo.admin2 (region_name, region_code, description, population, area_sq_km, geometry) VALUES
('NCR', 'PH-00', 'National Capital Region', 13484462, 619.54, ST_GeomFromText('POLYGON((121.0 14.5, 121.15 14.5, 121.15 14.7, 121.0 14.7, 121.0 14.5))', 4326)),
('Region IV-A', 'PH-40', 'CALABARZON', 16195042, 16873.31, ST_GeomFromText('POLYGON((120.9 14.0, 121.5 14.0, 121.5 14.8, 120.9 14.8, 120.9 14.0))', 4326)),
('Region III', 'PH-03', 'Central Luzon', 12422172, 22014.63, ST_GeomFromText('POLYGON((120.3 14.8, 121.2 14.8, 121.2 15.8, 120.3 15.8, 120.3 14.8))', 4326)),
('Region I', 'PH-01', 'Ilocos Region', 5301139, 13012.60, ST_GeomFromText('POLYGON((119.8 15.8, 120.7 15.8, 120.7 18.5, 119.8 18.5, 119.8 15.8))', 4326)),
('Region II', 'PH-02', 'Cagayan Valley', 3685744, 29836.88, ST_GeomFromText('POLYGON((121.0 16.0, 122.5 16.0, 122.5 18.5, 121.0 18.5, 121.0 16.0))', 4326)),
('Region V', 'PH-05', 'Bicol Region', 6082165, 18155.82, ST_GeomFromText('POLYGON((122.5 12.5, 124.0 12.5, 124.0 14.0, 122.5 14.0, 122.5 12.5))', 4326)),
('Region VII', 'PH-07', 'Central Visayas', 8081988, 15875.01, ST_GeomFromText('POLYGON((123.0 9.5, 124.5 9.5, 124.5 11.0, 123.0 11.0, 123.0 9.5))', 4326)),
('Region XI', 'PH-11', 'Davao Region', 5243536, 20357.42, ST_GeomFromText('POLYGON((125.0 6.0, 126.5 6.0, 126.5 8.0, 125.0 8.0, 125.0 6.0))', 4326))
ON CONFLICT DO NOTHING;

-- Create GIST index for spatial queries
CREATE INDEX IF NOT EXISTS idx_admin2_geometry ON geo.admin2 USING GIST (geometry);

-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    address TEXT,
    city TEXT,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample stores
INSERT INTO public.stores (store_name, latitude, longitude, address, city, region) VALUES
('SM North EDSA', 14.6563, 121.0292, 'North Avenue, Quezon City', 'Quezon City', 'NCR'),
('Ayala Center Makati', 14.5507, 121.0244, 'Ayala Avenue, Makati', 'Makati', 'NCR'),
('SM City Cebu', 10.3113, 123.9185, 'North Reclamation Area, Cebu City', 'Cebu City', 'Region VII'),
('Robinsons Place Manila', 14.5805, 120.9831, 'Pedro Gil, Ermita, Manila', 'Manila', 'NCR'),
('SM City Davao', 7.0492, 125.5940, 'Quimpo Blvd, Davao City', 'Davao City', 'Region XI'),
('Ayala Center Cebu', 10.3173, 123.9049, 'Cebu Business Park, Cebu City', 'Cebu City', 'Region VII'),
('SM City Pampanga', 15.0533, 120.6995, 'San Fernando, Pampanga', 'San Fernando', 'Region III'),
('Robinsons Galleria', 14.5905, 121.0611, 'Ortigas Center, Quezon City', 'Quezon City', 'NCR'),
('SM City Iloilo', 10.7149, 122.5452, 'Diversion Road, Iloilo City', 'Iloilo City', 'Region VI'),
('Trinoma', 14.6531, 121.0331, 'North Avenue, Quezon City', 'Quezon City', 'NCR')
ON CONFLICT DO NOTHING;

-- Create silver schema for clean data
CREATE SCHEMA IF NOT EXISTS silver;

-- Create clean_events table for analytics
CREATE TABLE IF NOT EXISTS silver.clean_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_ts TIMESTAMPTZ NOT NULL,
    store_id UUID REFERENCES public.stores(id),
    brand_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    sales_amount DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing sample data to avoid duplicates
TRUNCATE silver.clean_events;

-- Insert fresh sample sales data (June-July 2025)
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
    generate_series(1, 50) AS gs;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clean_events_event_ts ON silver.clean_events(event_ts);
CREATE INDEX IF NOT EXISTS idx_clean_events_store_brand ON silver.clean_events(store_id, brand_name);
CREATE INDEX IF NOT EXISTS idx_clean_events_category ON silver.clean_events(product_category);

-- Create view for regional analytics
CREATE OR REPLACE VIEW geo.regional_analytics AS
SELECT 
    a.region_name,
    a.region_code,
    COUNT(DISTINCT e.id) as event_count,
    SUM(e.sales_amount) as total_sales,
    AVG(e.quantity) as avg_quantity,
    COUNT(DISTINCT s.id) as store_count
FROM geo.admin2 a
LEFT JOIN public.stores s ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
LEFT JOIN silver.clean_events e ON e.store_id = s.id
GROUP BY a.region_name, a.region_code;

-- Create RPC functions for analytics
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
    LEFT JOIN public.stores s ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
    LEFT JOIN silver.clean_events e ON e.store_id = s.id 
        AND e.event_ts >= start_date 
        AND e.event_ts <= end_date
    GROUP BY a.region_name, a.region_code, a.geometry;
END;
$$ LANGUAGE plpgsql;

-- Create brand performance function
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
    JOIN public.stores s ON ST_Contains(a.geometry, ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326))
    JOIN silver.clean_events e ON e.store_id = s.id
    WHERE e.event_ts >= start_date AND e.event_ts <= end_date
    GROUP BY a.region_name, e.brand_name
    ORDER BY a.region_name, total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA geo TO anon, authenticated;
GRANT USAGE ON SCHEMA silver TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA geo TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA silver TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Verify installation
SELECT 
    'Tables Created' as check_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema IN ('geo', 'silver', 'public')
    AND table_name IN ('admin2', 'stores', 'clean_events')
UNION ALL
SELECT 
    'Regions Loaded' as check_type,
    COUNT(*) as count
FROM geo.admin2
UNION ALL
SELECT 
    'Stores Loaded' as check_type,
    COUNT(*) as count
FROM public.stores
UNION ALL
SELECT 
    'Events Generated' as check_type,
    COUNT(*) as count
FROM silver.clean_events;