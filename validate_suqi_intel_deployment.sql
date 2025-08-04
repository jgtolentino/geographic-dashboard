-- SUQI Intel Deployment Validation Script
-- Check what's actually deployed in production

-- 1. Check if SUQI Intel schema exists
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'suqiintel'
    ) as suqiintel_schema_exists;

-- 2. List all SUQI Intel tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'suqiintel' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'suqiintel'
ORDER BY table_name;

-- 3. Check for scout_suqi tables (alternative naming)
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables
WHERE tablename LIKE '%suqi%' 
   OR tablename LIKE '%scout_suqi%'
ORDER BY schemaname, tablename;

-- 4. Check for SUQI Intel views
SELECT 
    table_name as view_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = v.table_name) as column_count
FROM information_schema.views v
WHERE table_schema = 'public' 
  AND table_name LIKE '%suqi%'
ORDER BY table_name;

-- 5. Check for SUQI Intel functions
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as result_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%suqi%' 
   OR p.proname LIKE '%scout_suqi%'
ORDER BY p.proname;

-- 6. Check Edge Functions deployment
SELECT 
    'Check Supabase Dashboard for Edge Functions' as note,
    'Expected: suqiintel-processor' as edge_function_name;

-- 7. Sample data from SUQI tables (if they exist)
-- Check alerts
SELECT 
    'scout_suqi_alerts' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    MAX(created_at) as latest_record
FROM scout_suqi_alerts
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'scout_suqi_alerts'
);

-- Check predictions
SELECT 
    'scout_suqi_predictions' as table_name,
    COUNT(*) as record_count,
    AVG(confidence_score) as avg_confidence,
    MAX(created_at) as latest_record
FROM scout_suqi_predictions
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'scout_suqi_predictions'
);

-- 8. Check API views
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = v.table_name) as column_count
FROM information_schema.views v
WHERE table_schema = 'public' 
  AND table_name LIKE 'suqi_api_%'
ORDER BY table_name;

-- 9. System health check
SELECT 
    'System Health' as check_type,
    COUNT(*) as scout_transactions,
    MIN(transaction_date) as earliest_transaction,
    MAX(transaction_date) as latest_transaction,
    COUNT(DISTINCT store_id) as unique_stores,
    COUNT(DISTINCT brand_name) as unique_brands
FROM silver_transactions_cleaned
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days';

-- 10. Gold layer check (for SUQI Intel integration)
SELECT 
    'Gold Layer Views' as check_type,
    COUNT(*) as gold_view_count
FROM information_schema.views
WHERE table_schema = 'gold' 
  AND table_name LIKE '%scout%';

-- Summary of deployment
SELECT 
    'SUQI Intel Deployment Status' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'suqiintel') 
        THEN '✅ Schema exists'
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename LIKE '%scout_suqi%')
        THEN '✅ Tables exist (public schema)'
        ELSE '❌ Not found'
    END as status,
    NOW() as checked_at;