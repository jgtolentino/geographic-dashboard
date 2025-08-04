# SuqiIntel Deployment Guide
## AI-Powered Natural Language Analytics for Scout Platform

### Overview
SuqiIntel (formerly WrenAI) has been successfully integrated into the Scout Dashboard, providing natural language query capabilities that leverage the Gold layer architecture for optimal performance.

### What's Been Implemented

#### 1. Database Schema (`supabase/migrations/20250803_suqiintel_integration.sql`)
- **suqiintel schema** with complete table structure
- **Core tables**: queries, insights, chat_sessions, query_templates, feedback, embeddings
- **Vector search** capability with pgvector extension
- **Row Level Security** policies for multi-tenant access
- **Performance indexes** for fast query execution

#### 2. Frontend Components (`src/components/suqiintel-chat.tsx`)
- **Floating chat interface** with modern UI
- **Real-time query processing** with loading states
- **Sample queries** for user guidance
- **Session management** for context preservation
- **Results visualization** with expandable details

#### 3. Dashboard Integration (`src/components/scout-complete-7module-dashboard.tsx`)
- **SuqiIntel chat button** added to main dashboard
- **Query success callback** for data refresh
- **Context awareness** of current module and filters

#### 4. Edge Function (`supabase/functions/suqiintel-processor/`)
- **Natural language to SQL conversion** using GPT-4
- **Gold layer optimization** for query performance
- **Security validation** to prevent malicious queries
- **Query history tracking** for analytics
- **Error handling** with meaningful messages

### Deployment Steps

#### 1. Deploy Database Migration
```bash
cd /Users/tbwa/geographic-dashboard
supabase db push
```

#### 2. Deploy Edge Function
```bash
supabase functions deploy suqiintel-processor
```

#### 3. Set Environment Variables
In Supabase Dashboard > Edge Functions > suqiintel-processor > Settings:
```
OPENAI_API_KEY=your_openai_api_key
SUQIINTEL_MODEL=gpt-4
```

#### 4. Deploy Frontend Changes
```bash
npm run build
git add .
git commit -m "feat: Add SuqiIntel AI-powered analytics assistant"
git push origin main
```

### Gold Layer Views Utilized

SuqiIntel is configured to use these optimized Gold layer views:

1. **gold.scout_dashboard_executive** - KPIs and executive metrics
2. **gold.scout_dashboard_regions** - Regional performance data
3. **gold.scout_dashboard_transactions** - Transaction analytics
4. **gold.scout_dashboard_brands** - Brand performance metrics
5. **gold.scout_dashboard_locations** - Geographic intelligence
6. **gold.scout_dashboard_customers** - Customer insights
7. **gold.scout_dashboard_predictions** - Predictive analytics

### Example Natural Language Queries

Users can ask questions like:
- "Show me top 5 performing brands this month"
- "What's the average transaction value by region?"
- "Compare weekend vs weekday sales"
- "Which products have the highest growth rate?"
- "Show customer distribution by age group"
- "What are the busiest hours for transactions?"
- "Analyze brand performance in Metro Manila"

### API Usage

#### Direct API Call
```javascript
const { data, error } = await supabase.functions.invoke('suqiintel-processor', {
  body: {
    query: "Show me top brands by revenue",
    session_id: "optional-session-id",
    context: {
      module: "scout_dashboard",
      filters: {
        dateRange: { start: "2024-01-01", end: "2024-01-31" }
      }
    }
  }
});
```

#### Response Format
```typescript
{
  success: boolean;
  results?: any[];
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
```

### Security Features

1. **SQL Injection Prevention**: All queries validated for forbidden operations
2. **Row Level Security**: Users only see their authorized data
3. **Rate Limiting**: Built into Supabase Edge Functions
4. **Query Auditing**: All queries logged for security analysis

### Performance Optimizations

1. **Gold Layer First**: Queries prioritize pre-aggregated Gold views
2. **Query Caching**: Similar queries reuse cached results
3. **Embedding Search**: Vector similarity for finding related queries
4. **Indexed Tables**: All frequently accessed columns indexed

### Monitoring & Analytics

#### View Recent Queries
```sql
SELECT * FROM suqiintel.v_recent_queries 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Check Query Performance
```sql
SELECT 
  natural_language,
  execution_time_ms,
  confidence_score,
  created_at
FROM suqiintel.queries
WHERE execution_time_ms > 1000
ORDER BY execution_time_ms DESC;
```

#### User Engagement
```sql
SELECT 
  DATE(created_at) as query_date,
  COUNT(*) as query_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(confidence_score) as avg_confidence
FROM suqiintel.queries
GROUP BY DATE(created_at)
ORDER BY query_date DESC;
```

### Troubleshooting

#### Edge Function Logs
```bash
supabase functions logs suqiintel-processor --tail
```

#### Common Issues

1. **"No authorization header"**
   - Ensure user is authenticated
   - Check Supabase auth configuration

2. **"OpenAI API error"**
   - Verify OPENAI_API_KEY is set
   - Check API key has sufficient credits

3. **"Query execution failed"**
   - Check database permissions
   - Verify Gold layer views exist

4. **Slow responses**
   - Monitor Edge Function memory usage
   - Consider increasing function timeout

### Future Enhancements

1. **Multi-language Support**: Process queries in languages other than English
2. **Voice Input**: Add speech-to-text capabilities
3. **Custom Visualizations**: Generate charts based on query results
4. **Learning System**: Improve accuracy based on user feedback
5. **Collaboration**: Share insights between team members

### Quick Test

After deployment, test SuqiIntel with:
```bash
curl -X POST https://cxzllzyxwpyptfretryc.supabase.co/functions/v1/suqiintel-processor \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me total revenue"}'
```

### Support

For issues or questions:
1. Check Edge Function logs
2. Review error messages in browser console
3. Verify all environment variables are set
4. Ensure Gold layer views are accessible

### Success Metrics

Monitor these KPIs to track SuqiIntel adoption:
- Daily active users using natural language queries
- Query success rate (>90% target)
- Average response time (<3 seconds)
- User satisfaction ratings
- Most common query patterns

---

**Deployment Status**: Ready for production
**Last Updated**: August 3, 2025
**Version**: 1.0.0