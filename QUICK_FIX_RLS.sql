-- QUICK FIX FOR 401 ERRORS
-- Run this in Supabase SQL Editor to immediately fix the 401 errors

-- Enable RLS on the tables
ALTER TABLE IF EXISTS public.gold_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.silver_transactions_cleaned ENABLE ROW LEVEL SECURITY;

-- Create public read policies (allows anonymous access)
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.gold_daily_metrics
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.silver_transactions_cleaned
  FOR SELECT USING (true);

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.get_category_performance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_hourly_transaction_pattern TO anon, authenticated;

-- If the functions don't exist, they need to be created first
-- Check if they exist:
SELECT proname FROM pg_proc WHERE proname IN ('get_category_performance', 'get_hourly_transaction_pattern');

-- If the tables don't exist, check what tables are available:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;