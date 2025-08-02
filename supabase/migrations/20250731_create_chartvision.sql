-- ChartVision AI Screenshot-to-Dashboard Agent
-- Database schema for usage tracking and analytics

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.chartvision_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    chart_count INTEGER DEFAULT 0,
    filter_count INTEGER DEFAULT 0,
    kpi_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    error_message TEXT,
    image_size_bytes INTEGER,
    output_size_bytes INTEGER,
    model_version TEXT DEFAULT 'gpt-4-vision-preview',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_chartvision_usage_created_at ON public.chartvision_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chartvision_usage_request_id ON public.chartvision_usage(request_id);

-- Create analytics view for monitoring
CREATE OR REPLACE VIEW public.chartvision_analytics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_requests,
    AVG(chart_count) as avg_charts_per_request,
    AVG(filter_count) as avg_filters_per_request,
    AVG(kpi_count) as avg_kpis_per_request,
    AVG(response_time_ms) as avg_response_time_ms,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY response_time_ms) as p90_response_time_ms,
    SUM(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END) as error_count,
    ROUND(100.0 * SUM(CASE WHEN error_message IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM public.chartvision_usage
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Grant permissions
GRANT INSERT ON public.chartvision_usage TO anon, authenticated, service_role;
GRANT SELECT ON public.chartvision_usage TO authenticated, service_role;
GRANT SELECT ON public.chartvision_analytics TO authenticated, service_role;

-- Enable RLS
ALTER TABLE public.chartvision_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for service role full access
CREATE POLICY "Service role can do everything" ON public.chartvision_usage
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policy for authenticated users to read their own requests
CREATE POLICY "Users can read usage stats" ON public.chartvision_usage
    FOR SELECT TO authenticated
    USING (true);