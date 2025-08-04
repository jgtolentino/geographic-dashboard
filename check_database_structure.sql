-- Check all schemas
SELECT schema_name 
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;

-- Check tables in scout schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'scout'
ORDER BY table_name;

-- Check views in gold schema
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'gold'
ORDER BY table_name;

-- Check all functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;

-- Check for AI/ML or SuqiIntel related tables
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE tablename LIKE '%ai%' 
   OR tablename LIKE '%ml%' 
   OR tablename LIKE '%suqi%'
   OR tablename LIKE '%intel%'
   OR tablename LIKE '%llm%'
   OR tablename LIKE '%embed%'
   OR tablename LIKE '%vector%'
ORDER BY schemaname, tablename;