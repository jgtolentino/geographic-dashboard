import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co'
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key'

console.log('🔍 Verifying Geographic Analytics Deployment...\n')

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function verifyDeployment() {
  const checks = {
    database: false,
    functions: false,
    data: false
  }

  try {
    // Check database tables
    console.log('1. Checking database tables...')
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1)
    
    if (!storesError && stores) {
      console.log('   ✅ Stores table exists')
      checks.database = true
    } else {
      console.log('   ❌ Stores table not found:', storesError?.message)
    }

    // Check Edge Functions
    console.log('\n2. Checking Edge Functions...')
    const functionUrl = `${SUPABASE_URL}/functions/v1/server`
    
    try {
      const response = await fetch(functionUrl, {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ Server function is healthy:', data.status)
        checks.functions = true
      } else {
        console.log('   ❌ Server function returned error:', response.status)
      }
    } catch (error) {
      console.log('   ❌ Could not reach Edge Functions:', error.message)
    }

    // Check sample data
    console.log('\n3. Checking sample data...')
    const { data: events, error: eventsError } = await supabase
      .from('clean_events')
      .select('*')
      .limit(5)
    
    if (!eventsError && events && events.length > 0) {
      console.log(`   ✅ Found ${events.length} sample events`)
      checks.data = true
    } else {
      console.log('   ❌ No sample data found:', eventsError?.message)
    }

    // Summary
    console.log('\n📊 Deployment Summary:')
    console.log('   Database:', checks.database ? '✅' : '❌')
    console.log('   Functions:', checks.functions ? '✅' : '❌')
    console.log('   Sample Data:', checks.data ? '✅' : '❌')
    
    const allPassed = Object.values(checks).every(v => v)
    
    if (allPassed) {
      console.log('\n✅ All checks passed! Deployment is ready.')
    } else {
      console.log('\n⚠️  Some checks failed. Please run the deployment script.')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyDeployment()