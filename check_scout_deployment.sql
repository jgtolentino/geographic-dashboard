-- Check Scout Schema Deployment Status
-- Focus on what's currently deployed in production

-- 1. Check if scout schema exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = 'scout'
) as scout_schema_exists;

-- 2. List all Scout schema enums
SELECT 
    n.nspname as schema_name,
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'scout'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- 3. List all Scout schema tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'scout' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'scout'
ORDER BY table_name;

-- 4. Check for AI/ML related tables (for SuqiIntel integration)
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'scout'
  AND (tablename LIKE '%ai%' 
       OR tablename LIKE '%ml%' 
       OR tablename LIKE '%wren%'
       OR tablename LIKE '%suqi%'
       OR tablename LIKE '%intel%'
       OR tablename LIKE '%llm%'
       OR tablename LIKE '%embed%'
       OR tablename LIKE '%vector%'
       OR tablename LIKE '%chat%'
       OR tablename LIKE '%insight%')
ORDER BY tablename;

-- 5. Check for Scout Edge Functions
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as result_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'scout'
ORDER BY p.proname;

-- 6. Check for existing WrenAI references (to rename to SuqiIntel)
SELECT 
    'Table' as object_type,
    tablename as object_name,
    schemaname as schema_name
FROM pg_tables
WHERE tablename ILIKE '%wren%'
UNION ALL
SELECT 
    'Column' as object_type,
    column_name || ' in ' || table_name as object_name,
    table_schema as schema_name
FROM information_schema.columns
WHERE column_name ILIKE '%wren%'
UNION ALL
SELECT 
    'Function' as object_type,
    proname as object_name,
    nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname ILIKE '%wren%'
ORDER BY object_type, object_name;

-- 7. Check Gold layer deployment (scout dashboard specific)
SELECT 
    table_name as view_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'gold' AND table_name = v.table_name) as column_count
FROM information_schema.views v
WHERE table_schema = 'gold' 
  AND table_name LIKE '%scout%'
ORDER BY table_name;

-- 8. Summary of Scout schema objects
SELECT 
    'Tables' as object_type,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'scout'
UNION ALL
SELECT 
    'Views' as object_type,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'scout'
UNION ALL
SELECT 
    'Functions' as object_type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'scout'
UNION ALL
SELECT 
    'Enums' as object_type,
    COUNT(DISTINCT t.typname) as count
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'scout';