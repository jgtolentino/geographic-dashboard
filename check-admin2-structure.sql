-- Check the actual structure of geo.admin2 table
-- Run this FIRST to see what columns exist

-- 1. List all columns in geo.admin2
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'geo' 
AND table_name = 'admin2'
ORDER BY ordinal_position;

-- 2. Check if there's a primary key or unique identifier
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'geo' 
AND tc.table_name = 'admin2'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- 3. Look at a sample row to understand the data
SELECT * 
FROM geo.admin2 
LIMIT 1;