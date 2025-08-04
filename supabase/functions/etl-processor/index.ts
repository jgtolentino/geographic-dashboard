// ====================================================================
// ⚙️ ETL PROCESSOR - ADVANCED DATA PIPELINE ORCHESTRATION
// ====================================================================
// Deno Edge Function for complex ETL operations in Scout Analytics Platform
// Handles batch processing, data validation, and pipeline orchestration
// ====================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client with service role key
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

// Types and Interfaces
interface ETLJobConfig {
  job_id: string;
  source_type: string;
  target_layer: 'bronze' | 'silver' | 'gold';
  transformation_rules: Record<string, any>;
  validation_rules: Record<string, any>;
  schedule?: string;
  retry_config?: {
    max_retries: number;
    retry_delay: number;
  };
}

interface BatchProcessingResult {
  job_id: string;
  records_processed: number;
  records_successful: number;
  records_failed: number;
  processing_time_ms: number;
  errors: any[];
  data_quality_score: number;
}

// ====================================================================
// 📋 DATA VALIDATION UTILITIES
// ====================================================================

function validateTransactionRecord(record: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields validation
  if (!record.store_id) errors.push('Missing store_id');
  if (!record.timestamp) errors.push('Missing timestamp');
  if (!record.peso_value || record.peso_value <= 0) errors.push('Invalid peso_value');
  
  // Data type validation
  if (record.timestamp && isNaN(Date.parse(record.timestamp))) {
    errors.push('Invalid timestamp format');
  }
  
  if (record.peso_value && (typeof record.peso_value !== 'number' && isNaN(parseFloat(record.peso_value)))) {
    errors.push('peso_value must be numeric');
  }
  
  // Business rules validation
  if (record.peso_value && parseFloat(record.peso_value) > 100000) {
    errors.push('Unusually high transaction value (>100k)');
  }
  
  if (record.units_per_transaction && parseInt(record.units_per_transaction) > 100) {
    errors.push('Unusually high unit count (>100)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

async function validateSKUExists(sku: string): Promise<boolean> {
  if (!sku) return false;
  
  const { data, error } = await supabase
    .from('master_product_hierarchy')
    .select('sku_code')
    .eq('sku_code', sku)
    .single();
    
  return !error && !!data;
}

// ====================================================================
// 🔄 DATA TRANSFORMATION UTILITIES
// ====================================================================

function transformBronzeToSilver(bronzeRecord: any): any {
  const rawData = bronzeRecord.raw_data;
  
  return {
    id: rawData.transaction_id || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    store_id: rawData.store_id,
    timestamp: new Date(rawData.timestamp).toISOString(),
    location_region: rawData.region || rawData.location_region,
    location_city: rawData.city || rawData.location_city,
    location_province: rawData.province || rawData.location_province,
    brand_name: rawData.brand || rawData.brand_name,
    product_category: rawData.category || rawData.product_category,
    sku: rawData.sku || rawData.product_sku,
    units_per_transaction: parseInt(rawData.quantity || rawData.units_per_transaction || '1'),
    peso_value: parseFloat(rawData.amount || rawData.peso_value || '0'),
    payment_method: rawData.payment_method || 'Unknown',
    customer_type: rawData.customer_type || 'Regular',
    is_tbwa_client: rawData.is_tbwa_client !== undefined ? rawData.is_tbwa_client : true,
    processed_at: new Date().toISOString()
  };
}

function calculateDataQualityScore(validationResults: any[]): number {
  if (validationResults.length === 0) return 1.0;
  
  const validRecords = validationResults.filter(r => r.valid).length;
  const totalRecords = validationResults.length;
  
  return validRecords / totalRecords;
}

// ====================================================================
// 📊 BRONZE LAYER PROCESSING
// ====================================================================

async function processBronzeLayer(config: ETLJobConfig): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const result: BatchProcessingResult = {
    job_id: config.job_id,
    records_processed: 0,
    records_successful: 0,
    records_failed: 0,
    processing_time_ms: 0,
    errors: [],
    data_quality_score: 0
  };

  try {
    console.log(`Starting Bronze layer processing for job: ${config.job_id}`);
    
    // Get unprocessed bronze records
    const { data: bronzeRecords, error: fetchError } = await supabase
      .from('bronze_transactions_raw')
      .select('*')
      .eq('processed', false)
      .order('ingestion_timestamp', { ascending: true })
      .limit(1000); // Process in batches of 1000

    if (fetchError) throw fetchError;
    if (!bronzeRecords || bronzeRecords.length === 0) {
      console.log('No unprocessed bronze records found');
      return result;
    }

    result.records_processed = bronzeRecords.length;
    console.log(`Processing ${bronzeRecords.length} bronze records`);

    // Validate and transform records
    const transformedRecords = [];
    const validationResults = [];
    const processingErrors = [];

    for (const bronzeRecord of bronzeRecords) {
      try {
        // Transform bronze to silver format
        const silverRecord = transformBronzeToSilver(bronzeRecord);
        
        // Validate transformed record
        const validation = validateTransactionRecord(silverRecord);
        validationResults.push(validation);
        
        if (validation.valid) {
          // Additional SKU validation
          if (silverRecord.sku) {
            const skuExists = await validateSKUExists(silverRecord.sku);
            if (!skuExists) {
              validation.valid = false;
              validation.errors.push('SKU not found in product hierarchy');
            }
          }
        }
        
        if (validation.valid) {
          transformedRecords.push(silverRecord);
          result.records_successful++;
        } else {
          result.records_failed++;
          processingErrors.push({
            bronze_id: bronzeRecord.id,
            errors: validation.errors
          });
        }
      } catch (error) {
        result.records_failed++;
        processingErrors.push({
          bronze_id: bronzeRecord.id,
          errors: [`Transformation error: ${error.message}`]
        });
      }
    }

    // Insert successful records into silver layer
    if (transformedRecords.length > 0) {
      console.log(`Inserting ${transformedRecords.length} records into silver layer`);
      
      const { error: insertError } = await supabase
        .from('scout_transactions')
        .insert(transformedRecords);

      if (insertError) {
        console.error('Silver layer insert error:', insertError);
        throw insertError;
      }
    }

    // Update bronze records as processed
    const bronzeIds = bronzeRecords.map(r => r.id);
    const { error: updateError } = await supabase
      .from('bronze_transactions_raw')
      .update({ 
        processed: true,
        processing_errors: processingErrors
          .filter(e => bronzeIds.includes(e.bronze_id))
          .map(e => e.errors.join(', '))
      })
      .in('id', bronzeIds);

    if (updateError) {
      console.error('Bronze layer update error:', updateError);
      throw updateError;
    }

    // Calculate data quality score
    result.data_quality_score = calculateDataQualityScore(validationResults);
    result.errors = processingErrors;
    
    console.log(`Bronze processing completed: ${result.records_successful} successful, ${result.records_failed} failed`);
    
  } catch (error) {
    console.error('Bronze layer processing error:', error);
    result.errors.push({
      type: 'processing_error',
      message: error.message
    });
  }

  result.processing_time_ms = Date.now() - startTime;
  return result;
}

// ====================================================================
// 🥈 SILVER LAYER PROCESSING
// ====================================================================

async function processSilverLayer(config: ETLJobConfig): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const result: BatchProcessingResult = {
    job_id: config.job_id,
    records_processed: 0,
    records_successful: 0,
    records_failed: 0,
    processing_time_ms: 0,
    errors: [],
    data_quality_score: 0
  };

  try {
    console.log(`Starting Silver layer processing for job: ${config.job_id}`);
    
    // Apply data enrichment and quality improvements
    const { data: silverRecords, error: fetchError } = await supabase
      .from('scout_transactions')
      .select('*')
      .is('data_quality_score', null)
      .order('processed_at', { ascending: true })
      .limit(500);

    if (fetchError) throw fetchError;
    if (!silverRecords || silverRecords.length === 0) {
      console.log('No silver records requiring processing');
      return result;
    }

    result.records_processed = silverRecords.length;

    // Enrich records with additional data
    for (const record of silverRecords) {
      try {
        // Calculate handshake score (business logic)
        let handshakeScore = 5.0; // Base score
        
        if (record.peso_value > 1000) handshakeScore += 1.5;
        if (record.units_per_transaction > 3) handshakeScore += 1.0;
        if (record.payment_method === 'Card') handshakeScore += 0.5;
        if (record.is_tbwa_client) handshakeScore += 2.0;
        
        // Estimate margin (simplified calculation)
        const marginEstimate = record.peso_value * 0.35; // 35% average margin
        
        // Calculate data quality score
        let qualityScore = 1.0;
        if (!record.customer_type) qualityScore -= 0.1;
        if (!record.location_province) qualityScore -= 0.05;
        if (!record.brand_name) qualityScore -= 0.15;
        
        // Update record with enriched data
        const { error: updateError } = await supabase
          .from('scout_transactions')
          .update({
            handshake_score: Math.min(handshakeScore, 10.0),
            margin_estimate: marginEstimate,
            data_quality_score: Math.max(qualityScore, 0.0)
          })
          .eq('id', record.id);

        if (updateError) {
          result.records_failed++;
          result.errors.push({
            record_id: record.id,
            error: updateError.message
          });
        } else {
          result.records_successful++;
        }
      } catch (error) {
        result.records_failed++;
        result.errors.push({
          record_id: record.id,
          error: error.message
        });
      }
    }

    result.data_quality_score = result.records_successful / result.records_processed;
    console.log(`Silver processing completed: ${result.records_successful} successful, ${result.records_failed} failed`);
    
  } catch (error) {
    console.error('Silver layer processing error:', error);
    result.errors.push({
      type: 'processing_error',
      message: error.message
    });
  }

  result.processing_time_ms = Date.now() - startTime;
  return result;
}

// ====================================================================
// 🥇 GOLD LAYER PROCESSING
// ====================================================================

async function processGoldLayer(config: ETLJobConfig): Promise<BatchProcessingResult> {
  const startTime = Date.now();
  const result: BatchProcessingResult = {
    job_id: config.job_id,
    records_processed: 0,
    records_successful: 0,
    records_failed: 0,
    processing_time_ms: 0,
    errors: [],
    data_quality_score: 1.0
  };

  try {
    console.log(`Starting Gold layer processing for job: ${config.job_id}`);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Generate daily metrics
    const metrics = [
      'revenue_by_region',
      'brand_performance',
      'product_category_analysis',
      'customer_segment_analysis',
      'store_performance'
    ];

    for (const metricType of metrics) {
      try {
        let metricData = [];
        
        switch (metricType) {
          case 'revenue_by_region':
            const { data: regionData } = await supabase
              .from('scout_transactions')
              .select('location_region, peso_value')
              .not('location_region', 'is', null);
            
            if (regionData) {
              const regionSummary = regionData.reduce((acc: any, row: any) => {
                if (!acc[row.location_region]) acc[row.location_region] = 0;
                acc[row.location_region] += parseFloat(row.peso_value);
                return acc;
              }, {});
              
              metricData = Object.entries(regionSummary).map(([region, revenue]) => ({
                business_date: today,
                metric_type: metricType,
                dimension_values: { region },
                metric_value: revenue,
                aggregation_method: 'sum'
              }));
            }
            break;
            
          case 'brand_performance':
            const { data: brandData } = await supabase
              .from('scout_transactions')
              .select('brand_name, peso_value')
              .not('brand_name', 'is', null);
            
            if (brandData) {
              const brandSummary = brandData.reduce((acc: any, row: any) => {
                if (!acc[row.brand_name]) acc[row.brand_name] = { count: 0, revenue: 0 };
                acc[row.brand_name].count += 1;
                acc[row.brand_name].revenue += parseFloat(row.peso_value);
                return acc;
              }, {});
              
              metricData = Object.entries(brandSummary).map(([brand, data]: [string, any]) => ({
                business_date: today,
                metric_type: metricType,
                dimension_values: { brand },
                metric_value: data.revenue,
                aggregation_method: 'sum'
              }));
            }
            break;
        }
        
        if (metricData.length > 0) {
          // Clear existing metrics for today
          await supabase
            .from('gold_daily_metrics')
            .delete()
            .eq('business_date', today)
            .eq('metric_type', metricType);
          
          // Insert new metrics
          const { error: insertError } = await supabase
            .from('gold_daily_metrics')
            .insert(metricData);
          
          if (insertError) {
            result.records_failed += metricData.length;
            result.errors.push({
              metric_type: metricType,
              error: insertError.message
            });
          } else {
            result.records_successful += metricData.length;
          }
        }
        
        result.records_processed += metricData.length;
        
      } catch (error) {
        result.errors.push({
          metric_type: metricType,
          error: error.message
        });
      }
    }

    console.log(`Gold processing completed: ${result.records_successful} metrics generated`);
    
  } catch (error) {
    console.error('Gold layer processing error:', error);
    result.errors.push({
      type: 'processing_error',
      message: error.message
    });
  }

  result.processing_time_ms = Date.now() - startTime;
  return result;
}

// ====================================================================
// 🚀 MAIN ETL ORCHESTRATOR
// ====================================================================

async function orchestrateETLPipeline(layers: string[] = ['bronze', 'silver', 'gold']): Promise<any> {
  const pipelineStart = Date.now();
  const results = {
    pipeline_id: `ETL_${Date.now()}`,
    started_at: new Date().toISOString(),
    layers_processed: [],
    total_processing_time_ms: 0,
    overall_success: true,
    summary: {
      total_records_processed: 0,
      total_records_successful: 0,
      total_records_failed: 0,
      overall_data_quality_score: 0
    }
  };

  for (const layer of layers) {
    try {
      console.log(`Processing ${layer} layer...`);
      
      const config: ETLJobConfig = {
        job_id: `${layer.toUpperCase()}_${Date.now()}`,
        source_type: 'scheduled_batch',
        target_layer: layer as any,
        transformation_rules: {},
        validation_rules: {}
      };

      let layerResult: BatchProcessingResult;
      
      switch (layer) {
        case 'bronze':
          layerResult = await processBronzeLayer(config);
          break;
        case 'silver':
          layerResult = await processSilverLayer(config);
          break;
        case 'gold':
          layerResult = await processGoldLayer(config);
          break;
        default:
          throw new Error(`Unknown layer: ${layer}`);
      }

      results.layers_processed.push({
        layer,
        ...layerResult
      });

      // Update summary
      results.summary.total_records_processed += layerResult.records_processed;
      results.summary.total_records_successful += layerResult.records_successful;
      results.summary.total_records_failed += layerResult.records_failed;

      if (layerResult.errors.length > 0) {
        results.overall_success = false;
      }

    } catch (error) {
      console.error(`Error processing ${layer} layer:`, error);
      results.overall_success = false;
      results.layers_processed.push({
        layer,
        error: error.message,
        records_processed: 0,
        records_successful: 0,
        records_failed: 0,
        processing_time_ms: 0
      });
    }
  }

  // Calculate overall data quality score
  if (results.summary.total_records_processed > 0) {
    results.summary.overall_data_quality_score = 
      results.summary.total_records_successful / results.summary.total_records_processed;
  }

  results.total_processing_time_ms = Date.now() - pipelineStart;
  results.completed_at = new Date().toISOString();

  return results;
}

// ====================================================================
// 🎯 EDGE FUNCTION HANDLER
// ====================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'full-pipeline';
    
    console.log(`ETL Processor: ${req.method} ${action}`);

    switch (action) {
      case 'full-pipeline':
        if (req.method === 'POST') {
          const { layers } = await req.json().catch(() => ({ layers: ['bronze', 'silver', 'gold'] }));
          const result = await orchestrateETLPipeline(layers);
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'bronze-only':
        if (req.method === 'POST') {
          const config: ETLJobConfig = {
            job_id: `BRONZE_${Date.now()}`,
            source_type: 'api_request',
            target_layer: 'bronze',
            transformation_rules: {},
            validation_rules: {}
          };
          
          const result = await processBronzeLayer(config);
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'silver-only':
        if (req.method === 'POST') {
          const config: ETLJobConfig = {
            job_id: `SILVER_${Date.now()}`,
            source_type: 'api_request',
            target_layer: 'silver',
            transformation_rules: {},
            validation_rules: {}
          };
          
          const result = await processSilverLayer(config);
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'gold-only':
        if (req.method === 'POST') {
          const config: ETLJobConfig = {
            job_id: `GOLD_${Date.now()}`,
            source_type: 'api_request',
            target_layer: 'gold',
            transformation_rules: {},
            validation_rules: {}
          };
          
          const result = await processGoldLayer(config);
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      case 'status':
        if (req.method === 'GET') {
          // Get ETL pipeline status
          const { data: silverStatus } = await supabase.rpc('get_silver_layer_status');
          
          const status = {
            etl_processor_status: 'operational',
            last_pipeline_run: new Date().toISOString(),
            layers: {
              bronze: {
                status: 'healthy',
                unprocessed_records: 0 // Would need to query actual count
              },
              silver: silverStatus,
              gold: {
                status: 'healthy',
                metrics_count: 0 // Would need to query actual count
              }
            }
          };
          
          return new Response(JSON.stringify(status), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action',
            available_actions: [
              'full-pipeline', 'bronze-only', 'silver-only', 'gold-only', 'status'
            ]
          }),
          { 
            status: 400, 
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
    console.error('ETL Processor Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'ETL processing failed',
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
