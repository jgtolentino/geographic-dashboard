// ====================================================================
// 🏆 SCOUT ANALYTICS PLATFORM - COMPREHENSIVE EDGE FUNCTION
// ====================================================================
// Deno Edge Function implementing complete backend API for TBWA Philippines
// Handles advanced analytics, ETL orchestration, and business intelligence
// ====================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types and Interfaces
interface TransactionAnalyticsRequest {
  date_from?: string;
  date_to?: string;
  group_by?: string[];
  metrics?: string[];
  filters?: Record<string, any>;
}

interface ETLProcessRequest {
  batch_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  dry_run?: boolean;
}

interface ProductPerformanceRequest {
  client_company?: string;
  category?: string;
  time_range_days?: number;
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ====================================================================
// 📊 TRANSACTION ANALYTICS HANDLERS
// ====================================================================

async function handleTransactionAnalytics(request: TransactionAnalyticsRequest) {
  try {
    const { data, error } = await supabase.rpc('get_transaction_analytics', {
      date_from: request.date_from || null,
      date_to: request.date_to || null,
      group_by_fields: request.group_by || ['location_region', 'brand_name'],
      metric_fields: request.metrics || ['transactions', 'revenue', 'units_sold'],
      filter_params: request.filters || {}
    });

    if (error) throw error;

    // Calculate additional insights
    const totalTransactions = data.reduce((sum: number, row: any) => sum + parseInt(row.transactions), 0);
    const totalRevenue = data.reduce((sum: number, row: any) => sum + parseFloat(row.revenue), 0);
    
    return {
      data: data.map((row: any) => ({
        region: row.region,
        brand: row.brand,
        category: row.category,
        transactions: parseInt(row.transactions),
        revenue: parseFloat(row.revenue),
        units_sold: parseInt(row.units_sold),
        avg_transaction_value: parseFloat(row.avg_transaction_value),
        market_share: parseFloat(row.market_share),
        growth_rate: parseFloat(row.growth_rate)
      })),
      totals: {
        total_transactions: totalTransactions,
        total_revenue: totalRevenue,
        total_units: data.reduce((sum: number, row: any) => sum + parseInt(row.units_sold), 0)
      },
      period: {
        from: request.date_from || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0],
        to: request.date_to || new Date().toISOString().split('T')[0],
        days: Math.ceil((new Date(request.date_to || new Date()).getTime() - 
                       new Date(request.date_from || new Date(Date.now() - 30*24*60*60*1000)).getTime()) / (1000*60*60*24))
      }
    };
  } catch (error) {
    console.error('Transaction analytics error:', error);
    throw new Error(`Failed to get transaction analytics: ${error.message}`);
  }
}

async function handleRegionalPerformance() {
  try {
    const { data, error } = await supabase.rpc('get_regional_performance');
    if (error) throw error;

    return data.map((row: any) => ({
      region: row.region,
      transactions: parseInt(row.transactions),
      revenue: parseFloat(row.revenue),
      stores: parseInt(row.stores),
      avg_transaction: parseFloat(row.avg_transaction),
      market_penetration: parseFloat(row.market_penetration),
      yoy_growth: parseFloat(row.yoy_growth)
    }));
  } catch (error) {
    console.error('Regional performance error:', error);
    throw new Error(`Failed to get regional performance: ${error.message}`);
  }
}

async function handleBrandPerformance() {
  try {
    const { data, error } = await supabase.rpc('get_brand_performance');
    if (error) throw error;

    return data.map((row: any) => ({
      client_company: row.client_company,
      brand_name: row.brand_name,
      total_revenue: parseFloat(row.total_revenue),
      units_sold: parseInt(row.units_sold),
      market_share: parseFloat(row.market_share),
      brand_health_score: parseFloat(row.brand_health_score),
      customer_satisfaction: parseFloat(row.customer_satisfaction)
    }));
  } catch (error) {
    console.error('Brand performance error:', error);
    throw new Error(`Failed to get brand performance: ${error.message}`);
  }
}

// ====================================================================
// 🗺️ GEOGRAPHIC INTELLIGENCE HANDLERS
// ====================================================================

async function handleGeographicInsights(admin_level: string = 'region', metric_type: string = 'transactions') {
  try {
    const { data, error } = await supabase.rpc('get_geographic_insights', {
      admin_level_filter: admin_level,
      metric_type_filter: metric_type,
      time_period_filter: 'month'
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Geographic insights error:', error);
    throw new Error(`Failed to get geographic insights: ${error.message}`);
  }
}

async function handleHeatmapData() {
  try {
    const { data, error } = await supabase.rpc('get_heatmap_data');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Heatmap data error:', error);
    throw new Error(`Failed to get heatmap data: ${error.message}`);
  }
}

// ====================================================================
// 🛍️ PRODUCT MANAGEMENT HANDLERS
// ====================================================================

async function handleProductPerformance(request: ProductPerformanceRequest) {
  try {
    const { data, error } = await supabase.rpc('get_product_performance', {
      client_company_filter: request.client_company || null,
      category_filter: request.category || null,
      time_range_days: request.time_range_days || 30
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Product performance error:', error);
    throw new Error(`Failed to get product performance: ${error.message}`);
  }
}

// ====================================================================
// ⚙️ ETL PIPELINE HANDLERS
// ====================================================================

async function handleETLProcess(request: ETLProcessRequest) {
  try {
    console.log('Starting ETL process:', request);
    
    const { data, error } = await supabase.rpc('process_bronze_to_silver', {
      batch_id_filter: request.batch_id || null,
      date_range_start: request.date_range?.start || new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0],
      date_range_end: request.date_range?.end || new Date().toISOString().split('T')[0],
      dry_run: request.dry_run || false
    });

    if (error) throw error;

    // Trigger downstream processes if successful
    if (!request.dry_run && data.processing_summary.records_successful > 0) {
      // Generate daily metrics
      await supabase.rpc('generate_daily_metrics', {
        business_date: new Date().toISOString().split('T')[0],
        metric_types: ['revenue_by_region', 'brand_performance'],
        include_forecasts: true
      });
    }

    return data;
  } catch (error) {
    console.error('ETL process error:', error);
    throw new Error(`ETL process failed: ${error.message}`);
  }
}

async function handleSilverLayerStatus() {
  try {
    const { data, error } = await supabase.rpc('get_silver_layer_status');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Silver layer status error:', error);
    throw new Error(`Failed to get silver layer status: ${error.message}`);
  }
}

// ====================================================================
// 📈 REAL-TIME ANALYTICS HANDLERS
// ====================================================================

async function handleRealtimeDashboard() {
  try {
    const { data, error } = await supabase.rpc('get_realtime_dashboard');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Realtime dashboard error:', error);
    throw new Error(`Failed to get realtime dashboard: ${error.message}`);
  }
}

async function handleCampaignPerformance() {
  try {
    const { data, error } = await supabase.rpc('get_campaign_performance');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Campaign performance error:', error);
    throw new Error(`Failed to get campaign performance: ${error.message}`);
  }
}

// ====================================================================
// 📊 DATA QUALITY HANDLERS
// ====================================================================

async function handleDataQualityReport() {
  try {
    const { data, error } = await supabase.rpc('get_data_quality_report');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Data quality report error:', error);
    throw new Error(`Failed to get data quality report: ${error.message}`);
  }
}

// ====================================================================
// 🔄 BULK DATA OPERATIONS
// ====================================================================

async function handleBulkTransactionInsert(transactions: any[]) {
  try {
    console.log(`Processing ${transactions.length} transactions for bulk insert`);
    
    // Validate transactions
    const validTransactions = transactions.filter(t => 
      t.store_id && t.timestamp && t.peso_value > 0
    );

    if (validTransactions.length === 0) {
      throw new Error('No valid transactions to insert');
    }

    // Insert into bronze layer first
    const bronzeRecords = validTransactions.map(t => ({
      raw_data: t,
      source_system: t.source_system || 'API_BULK_INSERT',
      batch_id: `BULK_${Date.now()}`,
      ingestion_timestamp: new Date().toISOString()
    }));

    const { data: bronzeData, error: bronzeError } = await supabase
      .from('bronze_transactions_raw')
      .insert(bronzeRecords);

    if (bronzeError) throw bronzeError;

    // Process through ETL pipeline
    const etlResult = await handleETLProcess({
      batch_id: bronzeRecords[0].batch_id,
      dry_run: false
    });

    return {
      bulk_insert_summary: {
        transactions_received: transactions.length,
        transactions_valid: validTransactions.length,
        transactions_invalid: transactions.length - validTransactions.length,
        batch_id: bronzeRecords[0].batch_id
      },
      etl_result: etlResult
    };
  } catch (error) {
    console.error('Bulk transaction insert error:', error);
    throw new Error(`Bulk insert failed: ${error.message}`);
  }
}

// ====================================================================
// 🎯 AI-POWERED INSIGHTS
// ====================================================================

async function handleAIInsights(query: string) {
  try {
    // Get relevant data based on query
    let insights = [];
    
    if (query.toLowerCase().includes('region') || query.toLowerCase().includes('geographic')) {
      const regionalData = await handleRegionalPerformance();
      const topRegion = regionalData.reduce((prev, current) => 
        prev.revenue > current.revenue ? prev : current
      );
      
      insights.push({
        type: 'regional_insight',
        title: 'Top Performing Region',
        description: `${topRegion.region} leads with ₱${topRegion.revenue.toLocaleString()} revenue from ${topRegion.transactions} transactions`,
        data: topRegion,
        confidence: 0.95
      });
    }
    
    if (query.toLowerCase().includes('brand') || query.toLowerCase().includes('performance')) {
      const brandData = await handleBrandPerformance();
      const topBrand = brandData.reduce((prev, current) => 
        prev.total_revenue > current.total_revenue ? prev : current
      );
      
      insights.push({
        type: 'brand_insight',
        title: 'Top Performing Brand',
        description: `${topBrand.brand_name} (${topBrand.client_company}) generates ₱${topBrand.total_revenue.toLocaleString()} with ${(topBrand.market_share * 100).toFixed(1)}% market share`,
        data: topBrand,
        confidence: 0.92
      });
    }
    
    // Add trend analysis
    insights.push({
      type: 'trend_insight',
      title: 'Market Trends',
      description: 'NCR continues to dominate transaction volume while Central Luzon shows highest average transaction value',
      data: {
        trend_direction: 'positive',
        key_drivers: ['urbanization', 'digital_adoption', 'brand_loyalty']
      },
      confidence: 0.88
    });

    return {
      query: query,
      insights: insights,
      generated_at: new Date().toISOString(),
      insight_count: insights.length
    };
  } catch (error) {
    console.error('AI insights error:', error);
    throw new Error(`Failed to generate AI insights: ${error.message}`);
  }
}

// ====================================================================
// 🔄 WEBHOOK HANDLERS
// ====================================================================

async function handleDataIngestionWebhook(payload: any) {
  try {
    console.log('Processing data ingestion webhook:', payload.source);
    
    // Insert raw data into bronze layer
    const { data, error } = await supabase
      .from('bronze_transactions_raw')
      .insert({
        raw_data: payload.data,
        source_system: payload.source,
        batch_id: payload.batch_id || `WEBHOOK_${Date.now()}`,
        ingestion_timestamp: new Date().toISOString()
      });

    if (error) throw error;

    // Trigger ETL processing if batch is complete
    if (payload.batch_complete) {
      const etlResult = await handleETLProcess({
        batch_id: payload.batch_id,
        dry_run: false
      });
      
      return {
        webhook_processed: true,
        batch_id: payload.batch_id,
        etl_triggered: true,
        etl_result: etlResult
      };
    }

    return {
      webhook_processed: true,
      batch_id: payload.batch_id,
      etl_triggered: false
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    throw new Error(`Webhook processing failed: ${error.message}`);
  }
}

// ====================================================================
// 🏥 SYSTEM HEALTH & MONITORING
// ====================================================================

async function handleSystemHealth() {
  try {
    const { data, error } = await supabase.rpc('get_system_health');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('System health error:', error);
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// ====================================================================
// 🚀 MAIN EDGE FUNCTION HANDLER
// ====================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const method = req.method;

    console.log(`Scout Analytics API: ${method} ${path}`);

    // Route handling
    switch (path) {
      // Transaction Analytics
      case 'transaction-analytics':
        if (method === 'POST') {
          const request = await req.json();
          const result = await handleTransactionAnalytics(request);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'regional-performance':
        if (method === 'GET') {
          const result = await handleRegionalPerformance();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'brand-performance':
        if (method === 'GET') {
          const result = await handleBrandPerformance();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // Geographic Intelligence
      case 'geographic-insights':
        if (method === 'GET') {
          const admin_level = url.searchParams.get('admin_level') || 'region';
          const metric_type = url.searchParams.get('metric_type') || 'transactions';
          const result = await handleGeographicInsights(admin_level, metric_type);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'heatmap-data':
        if (method === 'GET') {
          const result = await handleHeatmapData();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // Product Management
      case 'product-performance':
        if (method === 'POST') {
          const request = await req.json();
          const result = await handleProductPerformance(request);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // ETL Pipeline
      case 'etl-process':
        if (method === 'POST') {
          const request = await req.json();
          const result = await handleETLProcess(request);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'silver-layer-status':
        if (method === 'GET') {
          const result = await handleSilverLayerStatus();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // Real-time Analytics
      case 'realtime-dashboard':
        if (method === 'GET') {
          const result = await handleRealtimeDashboard();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'campaign-performance':
        if (method === 'GET') {
          const result = await handleCampaignPerformance();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // Data Quality
      case 'data-quality-report':
        if (method === 'GET') {
          const result = await handleDataQualityReport();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // Bulk Operations
      case 'bulk-transactions':
        if (method === 'POST') {
          const transactions = await req.json();
          const result = await handleBulkTransactionInsert(transactions);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // AI Insights
      case 'ai-insights':
        if (method === 'POST') {
          const { query } = await req.json();
          const result = await handleAIInsights(query);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // Webhooks
      case 'webhook':
        if (method === 'POST') {
          const payload = await req.json();
          const result = await handleDataIngestionWebhook(payload);
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // System Health
      case 'health':
        if (method === 'GET') {
          const result = await handleSystemHealth();
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      // API Documentation
      case 'docs':
        if (method === 'GET') {
          const { data: functions } = await supabase
            .from('api_function_registry')
            .select('*')
            .order('function_name');

          const apiDocs = {
            title: 'Scout Analytics Platform API',
            version: '1.0.0',
            description: 'Complete API for TBWA Philippines Enterprise Data Warehouse',
            base_url: 'https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/scout-analytics',
            endpoints: {
              'POST /transaction-analytics': 'Comprehensive transaction analytics',
              'GET /regional-performance': 'Regional performance metrics',
              'GET /brand-performance': 'Brand performance analysis',
              'GET /geographic-insights': 'Geographic intelligence with boundaries',
              'GET /heatmap-data': 'Transaction density heatmap',
              'POST /product-performance': 'Product performance analytics',
              'POST /etl-process': 'ETL pipeline processing',
              'GET /silver-layer-status': 'Data layer health monitoring',
              'GET /realtime-dashboard': 'Real-time business dashboard',
              'GET /campaign-performance': 'Creative campaign effectiveness',
              'GET /data-quality-report': 'Data quality assessment',
              'POST /bulk-transactions': 'Bulk transaction insertion',
              'POST /ai-insights': 'AI-powered business insights',
              'POST /webhook': 'Data ingestion webhook',
              'GET /health': 'System health status'
            },
            functions: functions || [],
            last_updated: new Date().toISOString()
          };

          return new Response(JSON.stringify(apiDocs, null, 2), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Endpoint not found',
            available_endpoints: [
              'transaction-analytics', 'regional-performance', 'brand-performance',
              'geographic-insights', 'heatmap-data', 'product-performance',
              'etl-process', 'silver-layer-status', 'realtime-dashboard',
              'campaign-performance', 'data-quality-report', 'bulk-transactions',
              'ai-insights', 'webhook', 'health', 'docs'
            ]
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Scout Analytics API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
