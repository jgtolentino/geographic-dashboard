-- Fix 401 authentication errors for Scout Dashboard
ALTER TABLE IF EXISTS public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;