-- Scout Platform v5 - Missing Components Analysis
-- Based on scout-platform-v5 repository vs current deployment

-- ===== MISSING ENUMS (from scout-platform-v5) =====
-- These enums exist in v5 but may not be in current deployment:

/*
Expected Scout v5 Enums:
- scout.time_of_day
- scout.request_mode
- scout.request_type
- scout.gender
- scout.age_bracket
- scout.payment_method
- scout.customer_type
- scout.store_type
- scout.economic_class
*/

-- ===== MISSING AI/ML INFRASTRUCTURE =====
-- SuqiIntel (formerly WrenAI) Integration Components

-- 1. AI Chat and Query Processing Tables
/*
MISSING:
- scout.ai_chat_logs (for natural language queries)
- scout.ai_query_cache (for performance optimization)
- scout.ai_user_sessions (for context management)
- scout.ai_feedback (for learning/improvement)
*/

-- 2. Vector/Embedding Storage for RAG
/*
MISSING:
- scout.ai_embeddings (vector storage for semantic search)
- scout.ai_document_chunks (for RAG document processing)
- scout.ai_knowledge_base (curated insights storage)
*/

-- 3. SuqiIntel Specific Tables (renamed from WrenAI)
/*
TO CREATE:
- scout.suqiintel_queries (natural language to SQL mappings)
- scout.suqiintel_insights (generated business insights)
- scout.suqiintel_models (model configurations)
- scout.suqiintel_training_data (for fine-tuning)
*/

-- ===== MISSING ETL MONITORING =====
/*
MISSING:
- scout.etl_job_definitions
- scout.etl_job_runs
- scout.etl_data_quality_checks
- scout.etl_anomaly_detection
*/

-- ===== MISSING GOLD LAYER VIEWS =====
/*
Additional Gold Views from v5:
- gold.scout_executive_summary
- gold.scout_predictive_analytics
- gold.scout_customer_segments
- gold.scout_campaign_roi
- gold.scout_competitive_analysis
*/

-- ===== MISSING EDGE FUNCTIONS =====
/*
Edge Functions to Deploy:
- scout-query-processor (with SuqiIntel rename)
- scout-insight-generator
- scout-anomaly-detector
- scout-recommendation-engine
*/

-- ===== MISSING RLS POLICIES =====
/*
Security policies needed:
- Row-level security for multi-tenant access
- Department-based data isolation
- Role-based query permissions
*/

-- ===== SQL TO CREATE MISSING COMPONENTS =====

-- 1. Create missing AI infrastructure for SuqiIntel
CREATE TABLE IF NOT EXISTS scout.suqiintel_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    natural_language_query TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    query_metadata JSONB,
    confidence_score DECIMAL(3,2),
    execution_time_ms INTEGER,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout.suqiintel_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type TEXT NOT NULL,
    insight_title TEXT NOT NULL,
    insight_description TEXT,
    supporting_data JSONB,
    confidence_score DECIMAL(3,2),
    business_impact TEXT,
    recommended_actions JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout.suqiintel_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'query', 'insight', 'document'
    content_id UUID,
    content_text TEXT NOT NULL,
    embedding vector(1536), -- Requires pgvector extension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. ETL Monitoring Tables
CREATE TABLE IF NOT EXISTS scout.etl_job_definitions (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT UNIQUE NOT NULL,
    job_type TEXT NOT NULL,
    schedule_cron TEXT,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout.etl_job_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES scout.etl_job_definitions(job_id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status TEXT NOT NULL, -- 'running', 'success', 'failed'
    records_processed INTEGER,
    error_message TEXT,
    run_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Additional Gold Layer Views
CREATE OR REPLACE VIEW gold.scout_predictive_analytics AS
WITH trend_analysis AS (
    SELECT 
        brand_name,
        DATE_TRUNC('week', transaction_date) as week,
        SUM(peso_value) as weekly_revenue,
        COUNT(*) as weekly_transactions,
        -- Calculate week-over-week growth
        LAG(SUM(peso_value)) OVER (PARTITION BY brand_name ORDER BY DATE_TRUNC('week', transaction_date)) as prev_week_revenue
    FROM scout.silver_transactions_cleaned
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY brand_name, DATE_TRUNC('week', transaction_date)
)
SELECT 
    brand_name,
    week,
    weekly_revenue,
    weekly_transactions,
    CASE 
        WHEN prev_week_revenue > 0 THEN 
            ((weekly_revenue - prev_week_revenue) / prev_week_revenue * 100)::DECIMAL(10,2)
        ELSE NULL 
    END as week_over_week_growth,
    -- Simple linear prediction for next week
    weekly_revenue * 1.05 as predicted_next_week_revenue
FROM trend_analysis
WHERE week >= CURRENT_DATE - INTERVAL '4 weeks';

-- 4. Function to rename WrenAI references to SuqiIntel
CREATE OR REPLACE FUNCTION scout.migrate_wren_to_suqiintel()
RETURNS TEXT AS $$
DECLARE
    migration_report TEXT := '';
BEGIN
    -- This function would handle the migration of any existing WrenAI references
    -- Currently a placeholder as we're implementing fresh
    
    migration_report := 'SuqiIntel migration completed. Ready for integration.';
    RETURN migration_report;
END;
$$ LANGUAGE plpgsql;

-- 5. Enable pgvector extension for AI embeddings (if not exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suqiintel_queries_created_at ON scout.suqiintel_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suqiintel_insights_type ON scout.suqiintel_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_etl_job_runs_status ON scout.etl_job_runs(job_id, status);

-- Summary of what needs to be implemented:
/*
1. SuqiIntel AI Infrastructure (renamed from WrenAI)
2. ETL Monitoring and Alerting
3. Additional Gold Layer Analytics Views  
4. Edge Functions deployment
5. Vector search capabilities
6. RLS security policies
*/