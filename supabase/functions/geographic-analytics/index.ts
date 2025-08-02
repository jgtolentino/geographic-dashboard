import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    
    // Parse query parameters
    const startDate = url.searchParams.get('start_date') || '2025-06-01'
    const endDate = url.searchParams.get('end_date') || '2025-07-31'
    const brand = url.searchParams.get('brand')
    const category = url.searchParams.get('category')

    switch (path) {
      case 'choropleth': {
        const metric = url.searchParams.get('metric') || 'sales'
        
        const { data, error } = await supabaseClient
          .rpc('get_choropleth_data', {
            start_date: startDate,
            end_date: endDate,
            metric: metric
          })
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'dotstrip': {
        let query = supabaseClient
          .from('clean_events')
          .select(`
            id,
            event_ts,
            brand_name,
            product_category,
            sales_amount,
            quantity,
            stores!inner(region)
          `)
          .gte('event_ts', startDate)
          .lte('event_ts', endDate)
        
        if (brand) query = query.eq('brand_name', brand)
        if (category) query = query.eq('product_category', category)
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Process data for dot strip visualization
        const regionData = data.reduce((acc: any, event: any) => {
          const region = event.stores.region
          if (!acc[region]) acc[region] = []
          acc[region].push({
            sales: event.sales_amount,
            quantity: event.quantity,
            brand: event.brand_name,
            category: event.product_category,
            date: event.event_ts
          })
          return acc
        }, {})
        
        return new Response(
          JSON.stringify({ data: regionData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'brand-performance': {
        const { data, error } = await supabaseClient
          .rpc('get_brand_performance', {
            start_date: startDate,
            end_date: endDate
          })
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'category-performance': {
        let query = supabaseClient
          .from('clean_events')
          .select(`
            product_category,
            sales_amount,
            quantity,
            stores!inner(region)
          `)
          .gte('event_ts', startDate)
          .lte('event_ts', endDate)
        
        if (brand) query = query.eq('brand_name', brand)
        if (category) query = query.eq('product_category', category)
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Aggregate by region and category
        const aggregated = data.reduce((acc: any, event: any) => {
          const key = `${event.stores.region}-${event.product_category}`
          if (!acc[key]) {
            acc[key] = {
              region: event.stores.region,
              category: event.product_category,
              total_sales: 0,
              total_quantity: 0,
              event_count: 0
            }
          }
          acc[key].total_sales += parseFloat(event.sales_amount)
          acc[key].total_quantity += event.quantity
          acc[key].event_count += 1
          return acc
        }, {})
        
        return new Response(
          JSON.stringify({ data: Object.values(aggregated) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'time-series': {
        let query = supabaseClient
          .from('clean_events')
          .select(`
            event_ts,
            sales_amount,
            quantity,
            brand_name,
            product_category
          `)
          .gte('event_ts', startDate)
          .lte('event_ts', endDate)
          .order('event_ts')
        
        if (brand) query = query.eq('brand_name', brand)
        if (category) query = query.eq('product_category', category)
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Group by month
        const monthlyData = data.reduce((acc: any, event: any) => {
          const month = new Date(event.event_ts).toISOString().slice(0, 7)
          if (!acc[month]) {
            acc[month] = {
              month,
              sales: 0,
              events: 0,
              quantity: 0
            }
          }
          acc[month].sales += parseFloat(event.sales_amount)
          acc[month].events += 1
          acc[month].quantity += event.quantity
          return acc
        }, {})
        
        return new Response(
          JSON.stringify({ data: Object.values(monthlyData) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'filters': {
        // Get available filter options
        const [brands, categories, regions] = await Promise.all([
          supabaseClient
            .from('clean_events')
            .select('brand_name')
            .gte('event_ts', startDate)
            .lte('event_ts', endDate),
          supabaseClient
            .from('clean_events')
            .select('product_category')
            .gte('event_ts', startDate)
            .lte('event_ts', endDate),
          supabaseClient
            .from('stores')
            .select('region')
        ])
        
        const uniqueBrands = [...new Set(brands.data?.map(b => b.brand_name))]
        const uniqueCategories = [...new Set(categories.data?.map(c => c.product_category))]
        const uniqueRegions = [...new Set(regions.data?.map(r => r.region))]
        
        return new Response(
          JSON.stringify({
            data: {
              brands: uniqueBrands,
              categories: uniqueCategories,
              regions: uniqueRegions
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'summary': {
        let query = supabaseClient
          .from('clean_events')
          .select('sales_amount, quantity')
          .gte('event_ts', startDate)
          .lte('event_ts', endDate)
        
        if (brand) query = query.eq('brand_name', brand)
        if (category) query = query.eq('product_category', category)
        
        const { data, error } = await query
        
        if (error) throw error
        
        const summary = {
          total_sales: data.reduce((sum, e) => sum + parseFloat(e.sales_amount), 0),
          total_events: data.length,
          total_quantity: data.reduce((sum, e) => sum + e.quantity, 0),
          avg_sale_value: data.length > 0 ? 
            data.reduce((sum, e) => sum + parseFloat(e.sales_amount), 0) / data.length : 0
        }
        
        return new Response(
          JSON.stringify({ data: summary }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid endpoint',
            available_endpoints: [
              '/choropleth',
              '/dotstrip',
              '/brand-performance',
              '/category-performance',
              '/time-series',
              '/filters',
              '/summary'
            ]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})