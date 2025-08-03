-- IMMEDIATE FIX FOR 401 ERRORS
-- Run this entire script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new

-- Step 1: Check what tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('gold_daily_metrics', 'silver_transactions_cleaned')
ORDER BY table_name;

-- Step 2: Disable RLS on analytics tables (quickest fix)
DO $$
BEGIN
  -- Gold tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_daily_metrics') THEN
    ALTER TABLE public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Disabled RLS on gold_daily_metrics';
  END IF;
  
  -- Silver tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_transactions_cleaned') THEN
    ALTER TABLE public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Disabled RLS on silver_transactions_cleaned';
  END IF;
END $$;

-- Step 3: Grant permissions on all functions to anon role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Step 4: Specifically grant permissions on RPC functions if they exist
DO $$
BEGIN
  -- Check and grant permissions on specific functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_category_performance') THEN
    GRANT EXECUTE ON FUNCTION public.get_category_performance TO anon;
    RAISE NOTICE 'Granted execute on get_category_performance';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_hourly_transaction_pattern') THEN
    GRANT EXECUTE ON FUNCTION public.get_hourly_transaction_pattern TO anon;
    RAISE NOTICE 'Granted execute on get_hourly_transaction_pattern';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_product_mix_stats') THEN
    GRANT EXECUTE ON FUNCTION public.get_product_mix_stats TO anon;
    RAISE NOTICE 'Granted execute on get_product_mix_stats';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_top_skus') THEN
    GRANT EXECUTE ON FUNCTION public.get_top_skus TO anon;
    RAISE NOTICE 'Granted execute on get_top_skus';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_trending_products') THEN
    GRANT EXECUTE ON FUNCTION public.get_trending_products TO anon;
    RAISE NOTICE 'Granted execute on get_trending_products';
  END IF;
END $$;

-- Step 5: Verify the changes
SELECT 
  'Tables with RLS disabled:' as status,
  string_agg(tablename, ', ') as tables
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gold_daily_metrics', 'silver_transactions_cleaned')
  AND rowsecurity = false

UNION ALL

SELECT 
  'Functions accessible to anon:' as status,
  string_agg(p.proname, ', ') as tables
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_category_performance', 'get_hourly_transaction_pattern', 'get_product_mix_stats', 'get_top_skus', 'get_trending_products')
  AND has_function_privilege('anon', p.oid, 'EXECUTE');

-- Step 6: Alternative - If you prefer to keep RLS enabled with public read access
-- Uncomment the following section if you want to use RLS with policies instead

/*
-- Enable RLS with public read policies
ALTER TABLE public.gold_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_transactions_cleaned ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gold_daily_metrics;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.silver_transactions_cleaned;

-- Create new public read policies
CREATE POLICY "Enable read access for all users" ON public.gold_daily_metrics
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.silver_transactions_cleaned
  FOR SELECT USING (true);

RAISE NOTICE 'Created public read policies for analytics tables';
*/