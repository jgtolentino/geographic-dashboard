# 🚨 IMMEDIATE ACTION REQUIRED - Fix 401 Errors

## Quick Steps:

### 1. Click this link to open Supabase SQL Editor:
[**OPEN SQL EDITOR →**](https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new)

### 2. Copy and paste this SQL:

```sql
-- QUICK FIX: Disable RLS to allow public read access
ALTER TABLE IF EXISTS public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anonymous users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Verify the fix
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gold_daily_metrics', 'silver_transactions_cleaned');
```

### 3. Click "Run" (or press Cmd/Ctrl + Enter)

### 4. You should see:
```
tablename                    | RLS Enabled
-----------------------------+-------------
gold_daily_metrics          | f
silver_transactions_cleaned | f
```

### 5. Refresh your Scout Dashboard - the 401 errors will be gone! 🎉

---

## Alternative: If Tables Don't Exist

If you get an error that tables don't exist, run this first:

```sql
-- Check what tables actually exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Then let me know what tables are shown and I'll provide the correct fix.