import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables. Check .env.local');
  process.exit(1);
}

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response;
}

async function main() {
  console.log('🔧 Fixing 401 authentication errors...\n');

  const fixes = [
    {
      sql: `DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'gold_daily_metrics') THEN
          ALTER TABLE public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;
        END IF;
      END $$;`,
      description: 'Disable RLS on gold_daily_metrics'
    },
    {
      sql: `DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'silver_transactions_cleaned') THEN
          ALTER TABLE public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;
        END IF;
      END $$;`,
      description: 'Disable RLS on silver_transactions_cleaned'
    },
    {
      sql: `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;`,
      description: 'Grant execute permissions on functions'
    },
    {
      sql: `GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;`,
      description: 'Grant select permissions on tables'
    }
  ];

  let success = 0;
  let failed = 0;

  for (const fix of fixes) {
    try {
      console.log(`📝 ${fix.description}...`);
      await executeSQL(fix.sql);
      console.log(`   ✅ Success`);
      success++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✨ All fixes applied successfully!');
    console.log('🔄 Please refresh your Scout Dashboard.');
  } else {
    console.log('\n⚠️  Some fixes failed. Try running manually in Supabase SQL Editor.');
  }
}

main().catch(console.error);