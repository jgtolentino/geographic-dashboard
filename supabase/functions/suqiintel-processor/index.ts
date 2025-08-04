// SuqiIntel Processor - Natural Language Query Processing for Scout Platform
// Handles AI-powered analytics queries with Gold layer optimization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface SuqiIntelRequest {
  query: string;
  session_id?: string;
  context?: {
    module?: string;
    previous_messages?: any[];
    filters?: Record<string, any>;
  };
}

interface SuqiIntelResponse {
  success: boolean;
  results?: any;
  explanation?: string;
  sql?: string;
  confidence?: number;
  metadata?: {
    execution_time: number;
    tables_used: string[];
    query_type: string;
  };
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI configuration (or your preferred LLM)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { query, session_id, context } = await req.json() as SuqiIntelRequest;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Process the query with Gold layer context
    const processedQuery = await processNaturalLanguageQuery(query, context);
    
    // Execute the generated SQL
    const results = await executeQuery(processedQuery.sql);
    
    // Save query history
    if (session_id) {
      await saveQueryToHistory({
        query,
        sql: processedQuery.sql,
        session_id,
        confidence: processedQuery.confidence,
        execution_time: Date.now() - startTime
      });
    }

    const response: SuqiIntelResponse = {
      success: true,
      results: results.data,
      explanation: processedQuery.explanation,
      sql: processedQuery.sql,
      confidence: processedQuery.confidence,
      metadata: {
        execution_time: Date.now() - startTime,
        tables_used: processedQuery.tables_used,
        query_type: processedQuery.query_type
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('SuqiIntel error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred processing your query'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function processNaturalLanguageQuery(query: string, context?: any) {
  const systemPrompt = `You are SuqiIntel, an AI assistant for the Scout Analytics Platform. 
You help users query business data using natural language and convert it to SQL.

You have access to these GOLD LAYER VIEWS optimized for analytics:

1. gold.scout_dashboard_executive - Executive KPIs and summary metrics
   - total_revenue, total_transactions, unique_customers, avg_transaction_value
   - growth_rate_7d, growth_rate_30d, top_region, top_brand

2. gold.scout_dashboard_regions - Regional performance metrics
   - region, city, total_revenue, transaction_count, unique_stores
   - avg_basket_size, growth_rate, market_tier

3. gold.scout_dashboard_transactions - Transaction-level analytics
   - transaction_date, hour_of_day, day_of_week, total_transactions
   - total_revenue, avg_transaction_value, peak_hour

4. gold.scout_dashboard_brands - Brand performance analysis
   - brand_name, revenue, transaction_count, market_share
   - growth_rate, avg_price_point, customer_count

5. gold.scout_dashboard_locations - Geographic intelligence
   - store_id, store_name, latitude, longitude, total_revenue
   - customer_count, performance_score, cluster_id

6. gold.scout_dashboard_customers - Customer behavior insights
   - customer_segment, age_group, gender, total_spent
   - transaction_frequency, favorite_brand, loyalty_score

7. gold.scout_dashboard_predictions - Predictive analytics
   - metric_type, prediction_date, predicted_value
   - confidence_interval, trend_direction

IMPORTANT SQL RULES:
- Always use the gold schema views when possible for better performance
- Include appropriate date filters based on user context
- Limit results to reasonable amounts (default 10-20 rows)
- Order results by relevance (revenue, count, etc.)
- Use proper aggregations and grouping
- Never use DELETE, UPDATE, INSERT, or DROP statements
- Format numbers for readability in output

Context: ${JSON.stringify(context || {})}`;

  const userPrompt = `Convert this natural language query to SQL: "${query}"`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        functions: [{
          name: 'generate_sql_query',
          description: 'Generate SQL query with metadata',
          parameters: {
            type: 'object',
            properties: {
              sql: {
                type: 'string',
                description: 'The generated SQL query'
              },
              explanation: {
                type: 'string',
                description: 'Plain English explanation of what the query does'
              },
              tables_used: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of tables/views used in the query'
              },
              query_type: {
                type: 'string',
                enum: ['aggregation', 'trend', 'comparison', 'detail', 'prediction'],
                description: 'Type of analytical query'
              },
              confidence: {
                type: 'number',
                description: 'Confidence score between 0 and 1'
              }
            },
            required: ['sql', 'explanation', 'tables_used', 'query_type', 'confidence']
          }
        }],
        function_call: { name: 'generate_sql_query' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const functionCall = data.choices[0].message.function_call;
    const result = JSON.parse(functionCall.arguments);

    // Validate the generated SQL
    validateSQL(result.sql);

    return result;

  } catch (error) {
    console.error('Error processing query:', error);
    throw new Error('Failed to process natural language query');
  }
}

async function executeQuery(sql: string) {
  try {
    // Use Supabase RPC for safe query execution
    const { data, error } = await supabase.rpc('execute_analytics_query', {
      query_sql: sql,
      user_role: 'analyst',
      department: null
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Query execution error:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

async function saveQueryToHistory(params: {
  query: string;
  sql: string;
  session_id: string;
  confidence: number;
  execution_time: number;
}) {
  try {
    const { error } = await supabase
      .from('suqiintel.queries')
      .insert({
        natural_language: params.query,
        generated_sql: params.sql,
        session_id: params.session_id,
        confidence_score: params.confidence,
        execution_time_ms: params.execution_time,
        query_type: 'analytics'
      });

    if (error) {
      console.error('Error saving query history:', error);
    }
  } catch (error) {
    console.error('Failed to save query history:', error);
  }
}

function validateSQL(sql: string): void {
  const forbidden = ['DELETE', 'DROP', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'TRUNCATE'];
  const upperSQL = sql.toUpperCase();
  
  for (const keyword of forbidden) {
    if (upperSQL.includes(keyword)) {
      throw new Error(`Forbidden SQL operation: ${keyword}`);
    }
  }
  
  // Ensure it's a SELECT query
  if (!upperSQL.trim().startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed');
  }
}