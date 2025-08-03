import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxzllzyxwpyptfretryc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g'

// Validate environment variables
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable persistence for better SSR compatibility
  }
})

// Export a function to create new client instances
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
}

// Type definitions for Medallion pipeline tables
export interface GoldDailyMetrics {
  id: string
  date: string
  store_id: string
  store_name: string
  total_transactions: number
  total_revenue: number
  avg_transaction_value: number
  unique_customers: number
  top_category: string
  top_brand: string
  peak_hour: number
  created_at: string
}

export interface SilverTransaction {
  id: string
  transaction_id: string
  store_id: string
  customer_id: string
  product_id: string
  category: string
  brand: string
  quantity: number
  unit_price: number
  total_price: number
  transaction_date: string
  transaction_hour: number
  is_weekend: boolean
  is_holiday: boolean
  created_at: string
}

export interface ProductMaster {
  id: string
  product_id: string
  product_name: string
  category: string
  sub_category: string
  brand: string
  unit_price: number
  is_active: boolean
}

export interface StoreMaster {
  id: string
  store_id: string
  store_name: string
  region: string
  city: string
  store_type: string
  latitude: number
  longitude: number
  is_active: boolean
}