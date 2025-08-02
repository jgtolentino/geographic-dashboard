-- Fix Permissions for Geographic Analytics
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA geo TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA silver TO anon, authenticated, service_role;

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA geo TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA silver TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on specific tables
GRANT SELECT ON geo.admin2 TO anon, authenticated, service_role;
GRANT SELECT ON public.stores TO anon, authenticated, service_role;
GRANT SELECT ON silver.clean_events TO anon, authenticated, service_role;

-- Grant permissions on views
GRANT SELECT ON geo.regional_analytics TO anon, authenticated, service_role;

-- Make sure RLS is disabled for read access (or create appropriate policies)
ALTER TABLE geo.admin2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.clean_events ENABLE ROW LEVEL SECURITY;

-- Create permissive read policies
CREATE POLICY "Allow read access to admin2" ON geo.admin2
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow read access to stores" ON public.stores
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow read access to clean_events" ON silver.clean_events
    FOR SELECT TO anon, authenticated
    USING (true);

-- Verify permissions
SELECT 
    'Permissions fixed!' as status,
    current_user,
    has_schema_privilege('anon', 'geo', 'USAGE') as anon_can_use_geo,
    has_table_privilege('anon', 'geo.admin2', 'SELECT') as anon_can_read_admin2,
    has_table_privilege('anon', 'public.stores', 'SELECT') as anon_can_read_stores;