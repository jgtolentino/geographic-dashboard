import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a dummy client for build time if environment variables are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, create a dummy client to avoid errors
    if (typeof window === 'undefined') {
      return createClient('https://dummy.supabase.co', 'dummy-key')
    }
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

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