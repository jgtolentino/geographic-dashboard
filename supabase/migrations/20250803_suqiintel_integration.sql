-- SuqiIntel Integration Migration
-- Adds AI-powered natural language query capabilities to Scout Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text matching

-- Create SuqiIntel schema
CREATE SCHEMA IF NOT EXISTS suqiintel;

-- Grant permissions
GRANT USAGE ON SCHEMA suqiintel TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA suqiintel TO authenticated;

-- ============= CORE TABLES =============

-- Natural language queries and their SQL translations
CREATE TABLE suqiintel.queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    natural_language TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    query_type TEXT DEFAULT 'analytics', -- 'analytics', 'insight', 'prediction', 'exploration'
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    execution_time_ms INTEGER,
    result_count INTEGER,
    user_id TEXT,
    session_id UUID,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business insights generated from queries
CREATE TABLE suqiintel.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES suqiintel.queries(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'trend', 'anomaly', 'opportunity', 'risk', 'recommendation'
    title TEXT NOT NULL,
    description TEXT,
    supporting_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    visualization_type TEXT, -- 'chart', 'table', 'metric', 'map'
    visualization_config JSONB DEFAULT '{}'::jsonb,
    business_impact TEXT,
    confidence_score DECIMAL(3,2),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions for context management
CREATE TABLE suqiintel.chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    context JSONB DEFAULT '[]'::jsonb, -- Array of previous queries and responses
    preferences JSONB DEFAULT '{}'::jsonb, -- User preferences for this session
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Query templates for common patterns
CREATE TABLE suqiintel.query_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT UNIQUE NOT NULL,
    description TEXT,
    natural_language_pattern TEXT NOT NULL,
    sql_template TEXT NOT NULL,
    parameters JSONB DEFAULT '[]'::jsonb,
    category TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback for continuous improvement
CREATE TABLE suqiintel.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES suqiintel.queries(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT NOT NULL, -- 'accuracy', 'speed', 'relevance', 'clarity'
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector embeddings for semantic search
CREATE TABLE suqiintel.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL, -- 'query', 'insight', 'document', 'template'
    content_id UUID NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-large dimension
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= INDEXES =============

-- Performance indexes
CREATE INDEX idx_suqiintel_queries_created_at ON suqiintel.queries(created_at DESC);
CREATE INDEX idx_suqiintel_queries_user_session ON suqiintel.queries(user_id, session_id);
CREATE INDEX idx_suqiintel_queries_type ON suqiintel.queries(query_type);
CREATE INDEX idx_suqiintel_insights_type ON suqiintel.insights(insight_type);
CREATE INDEX idx_suqiintel_insights_query ON suqiintel.insights(query_id);
CREATE INDEX idx_suqiintel_sessions_user ON suqiintel.chat_sessions(user_id, is_active);
CREATE INDEX idx_suqiintel_embeddings_content ON suqiintel.embeddings(content_type, content_id);

-- Full text search indexes
CREATE INDEX idx_suqiintel_queries_natural_language ON suqiintel.queries USING gin(to_tsvector('english', natural_language));
CREATE INDEX idx_suqiintel_insights_title_desc ON suqiintel.insights USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============= VIEWS =============

-- Recent queries view for dashboard
CREATE OR REPLACE VIEW suqiintel.v_recent_queries AS
SELECT 
    q.id,
    q.natural_language,
    q.query_type,
    q.confidence_score,
    q.execution_time_ms,
    q.result_count,
    q.user_id,
    q.created_at,
    COUNT(f.id) as feedback_count,
    AVG(f.rating) as avg_rating
FROM suqiintel.queries q
LEFT JOIN suqiintel.feedback f ON q.id = f.query_id
WHERE q.created_at > NOW() - INTERVAL '7 days'
GROUP BY q.id
ORDER BY q.created_at DESC;

-- Top insights view
CREATE OR REPLACE VIEW suqiintel.v_top_insights AS
SELECT 
    i.*,
    q.natural_language as original_query,
    q.user_id
FROM suqiintel.insights i
JOIN suqiintel.queries q ON i.query_id = q.id
WHERE i.confidence_score > 0.7
ORDER BY i.created_at DESC
LIMIT 100;

-- ============= FUNCTIONS =============

-- Function to process natural language queries
CREATE OR REPLACE FUNCTION suqiintel.process_query(
    p_natural_language TEXT,
    p_user_id TEXT,
    p_session_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_query_id UUID;
    v_result JSON;
BEGIN
    -- Create query record
    INSERT INTO suqiintel.queries (
        natural_language,
        generated_sql,
        query_type,
        user_id,
        session_id
    ) VALUES (
        p_natural_language,
        '', -- Will be updated by Edge Function
        'analytics',
        p_user_id,
        p_session_id
    ) RETURNING id INTO v_query_id;
    
    -- Return query ID for Edge Function processing
    v_result := json_build_object(
        'query_id', v_query_id,
        'status', 'pending',
        'message', 'Query submitted for processing'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save query results
CREATE OR REPLACE FUNCTION suqiintel.save_query_results(
    p_query_id UUID,
    p_generated_sql TEXT,
    p_execution_time_ms INTEGER,
    p_result_count INTEGER,
    p_confidence_score DECIMAL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE suqiintel.queries
    SET 
        generated_sql = p_generated_sql,
        execution_time_ms = p_execution_time_ms,
        result_count = p_result_count,
        confidence_score = p_confidence_score,
        error_message = p_error_message,
        updated_at = NOW()
    WHERE id = p_query_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar queries
CREATE OR REPLACE FUNCTION suqiintel.find_similar_queries(
    p_embedding vector(1536),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    query_id UUID,
    natural_language TEXT,
    generated_sql TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.natural_language,
        q.generated_sql,
        1 - (e.embedding <=> p_embedding) as similarity
    FROM suqiintel.embeddings e
    JOIN suqiintel.queries q ON e.content_id = q.id
    WHERE e.content_type = 'query'
    ORDER BY e.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============= SEED DATA =============

-- Insert common query templates
INSERT INTO suqiintel.query_templates (template_name, description, natural_language_pattern, sql_template, category) VALUES
('Top Brands Analysis', 'Analyze top performing brands', 'show me top {n} brands by {metric}', 
 'SELECT brand_name, {metric} FROM gold.scout_dashboard_brands ORDER BY {metric} DESC LIMIT {n}', 'analytics'),
('Regional Performance', 'Compare regional performance', 'compare {metric} across regions', 
 'SELECT region, {metric} FROM gold.scout_dashboard_regions ORDER BY {metric} DESC', 'analytics'),
('Time Series Trend', 'Analyze trends over time', 'show {metric} trend for last {period}', 
 'SELECT DATE_TRUNC({period_unit}, timestamp) as period, {metric} FROM gold.scout_dashboard_transactions WHERE timestamp > NOW() - INTERVAL {period} GROUP BY period ORDER BY period', 'analytics'),
('Customer Insights', 'Customer behavior analysis', 'analyze customer {behavior} by {dimension}', 
 'SELECT {dimension}, COUNT(*) as customer_count, {metric} FROM gold.scout_dashboard_customers GROUP BY {dimension}', 'analytics');

-- ============= ROW LEVEL SECURITY =============

-- Enable RLS
ALTER TABLE suqiintel.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE suqiintel.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE suqiintel.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suqiintel.feedback ENABLE ROW LEVEL SECURITY;

-- Queries: Users can see their own queries
CREATE POLICY "Users can view own queries" ON suqiintel.queries
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own queries" ON suqiintel.queries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Insights: Users can see insights from their queries
CREATE POLICY "Users can view own insights" ON suqiintel.insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM suqiintel.queries q 
            WHERE q.id = insights.query_id 
            AND q.user_id = auth.uid()::text
        )
    );

-- Sessions: Users can manage their own sessions
CREATE POLICY "Users can view own sessions" ON suqiintel.chat_sessions
    FOR ALL USING (auth.uid()::text = user_id);

-- Feedback: Users can manage their own feedback
CREATE POLICY "Users can manage own feedback" ON suqiintel.feedback
    FOR ALL USING (auth.uid()::text = user_id);

-- ============= GRANTS =============

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION suqiintel.process_query TO authenticated;
GRANT EXECUTE ON FUNCTION suqiintel.save_query_results TO service_role;
GRANT EXECUTE ON FUNCTION suqiintel.find_similar_queries TO authenticated;

-- Grant select on views
GRANT SELECT ON suqiintel.v_recent_queries TO authenticated;
GRANT SELECT ON suqiintel.v_top_insights TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'SuqiIntel integration successfully created!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy the suqiintel-processor Edge Function';
    RAISE NOTICE '2. Configure API keys for LLM provider';
    RAISE NOTICE '3. Update frontend to include SuqiIntel chat component';
END $$;