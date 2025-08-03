#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 Fixing 401 authentication errors...\n')

async function executeSql(query, description) {
  console.log(`📝 ${description}...`)
  try {
    const { data, error } = await supabase.rpc('query', { query })
    if (error) {
      // If RPC doesn't work, try direct query
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
      console.log(`   ✓ ${description} - Success`)
    } else {
      console.log(`   ✓ ${description} - Success`)
    }
  } catch (error) {
    console.error(`   ✗ ${description} - Failed:`, error.message)
    return false
  }
  return true
}

async function fixAuthErrors() {
  // SQL commands to fix 401 errors
  const fixes = [
    {
      query: `ALTER TABLE IF EXISTS public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;`,
      description: 'Disable RLS on gold_daily_metrics'
    },
    {
      query: `ALTER TABLE IF EXISTS public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;`,
      description: 'Disable RLS on silver_transactions_cleaned'
    },
    {
      query: `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;`,
      description: 'Grant execute permissions on all functions to anon role'
    },
    {
      query: `GRANT USAGE ON SCHEMA public TO anon;`,
      description: 'Grant usage on public schema to anon role'
    },
    {
      query: `GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;`,
      description: 'Grant select on all tables to anon role'
    }
  ]

  let success = 0
  let failed = 0

  for (const fix of fixes) {
    if (await executeSql(fix.query, fix.description)) {
      success++
    } else {
      failed++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✓ Successful: ${success}`)
  console.log(`   ✗ Failed: ${failed}`)
  
  if (failed === 0) {
    console.log('\n✅ All fixes applied successfully!')
    console.log('🔄 Please refresh your Scout Dashboard to see the changes.')
  } else {
    console.log('\n⚠️  Some fixes failed. You may need to run them manually in Supabase SQL Editor.')
    console.log('📎 SQL file: FIX_401_ERRORS_NOW.sql')
  }
}

// Run the fix
fixAuthErrors().catch(console.error)