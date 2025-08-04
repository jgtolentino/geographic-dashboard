# SuqiIntel Integration Plan
## Seamless Integration with Current Scout Dashboard Deployment

### Overview
SuqiIntel (formerly WrenAI) is the AI-powered natural language query processor for Scout Platform. This plan ensures seamless integration with the existing deployment.

### Current State Analysis

#### Already Deployed:
1. **Gold Layer Views** (7 views in `gold` schema):
   - `gold.scout_dashboard_executive`
   - `gold.scout_dashboard_regions`
   - `gold.scout_dashboard_transactions`
   - `gold.scout_dashboard_brands`
   - `gold.scout_dashboard_locations`
   - `gold.scout_dashboard_customers`
   - `gold.scout_dashboard_predictions`

2. **Scout Dashboard UI**:
   - 7-module dashboard using Gold layer
   - Real-time data from Supabase
   - Production deployment at Vercel

3. **Database Structure**:
   - Bronze, Silver, Gold medallion architecture
   - 128K+ transaction records
   - Master data tables for brands, stores, products

### SuqiIntel Integration Components

#### 1. Database Schema Extensions
```sql
-- Add to existing scout schema without breaking current functionality
CREATE SCHEMA IF NOT EXISTS suqiintel;

-- Core SuqiIntel tables
CREATE TABLE suqiintel.queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    natural_language TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    query_type TEXT DEFAULT 'analytics', -- 'analytics', 'insight', 'prediction'
    confidence_score DECIMAL(3,2),
    execution_time_ms INTEGER,
    user_id TEXT,
    session_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE suqiintel.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES suqiintel.queries(id),
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    data_snapshot JSONB,
    visualization_config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE suqiintel.chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    context JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);
```

#### 2. Edge Function Implementation
```typescript
// supabase/functions/suqiintel-processor/index.ts
// Rename from scout-query-processor to suqiintel-processor

const SUQIINTEL_CONFIG = {
  modelEndpoint: Deno.env.get('SUQIINTEL_ENDPOINT'),
  apiKey: Deno.env.get('SUQIINTEL_API_KEY'),
  maxTokens: 4000,
  temperature: 0.7
};

// Main processing function with Gold layer awareness
async function processSuqiIntelQuery(query: string, context: any) {
  // Enhance query with Gold layer context
  const enhancedPrompt = `
    You have access to these Gold layer views for business intelligence:
    - gold.scout_dashboard_executive: KPIs and executive metrics
    - gold.scout_dashboard_regions: Regional performance data
    - gold.scout_dashboard_transactions: Transaction analytics
    - gold.scout_dashboard_brands: Brand performance metrics
    - gold.scout_dashboard_locations: Geographic intelligence
    - gold.scout_dashboard_customers: Customer insights
    - gold.scout_dashboard_predictions: Predictive analytics
    
    User Query: ${query}
    
    Generate SQL that leverages these Gold views for optimal performance.
  `;
  
  // Process with AI model
  const sqlGenerated = await generateSQL(enhancedPrompt);
  
  // Execute and return results
  return await executeQuery(sqlGenerated);
}
```

#### 3. Frontend Integration Components

```typescript
// src/components/suqiintel-chat.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function SuqiIntelChat() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suqiintel-processor', {
        body: { 
          query,
          context: {
            module: 'scout_dashboard',
            user_role: 'analyst'
          }
        }
      });
      
      if (error) throw error;
      setResults(data);
    } catch (error) {
      console.error('SuqiIntel query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="suqiintel-chat-container">
      <div className="chat-header">
        <h3>SuqiIntel Analytics Assistant</h3>
        <p>Ask questions about your Scout data in natural language</p>
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show me top performing brands this month"
          className="w-full p-3 border rounded"
        />
        <button 
          onClick={handleQuery}
          disabled={loading}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Processing...' : 'Ask SuqiIntel'}
        </button>
      </div>
      
      {results && (
        <div className="results-container mt-4">
          <ResultsVisualization data={results} />
        </div>
      )}
    </div>
  );
}
```

#### 4. Integration Points with Current Dashboard

1. **Add SuqiIntel Chat to Dashboard Header**:
```typescript
// In scout-complete-7module-dashboard.tsx
import { SuqiIntelChat } from './suqiintel-chat';

// Add toggle for AI assistant
const [showSuqiIntel, setShowSuqiIntel] = useState(false);

// In the header section
<button onClick={() => setShowSuqiIntel(!showSuqiIntel)}>
  🤖 AI Assistant
</button>
```

2. **Context-Aware Queries**:
```typescript
// Pass current dashboard context to SuqiIntel
const suqiContext = {
  currentModule: activeModule,
  dateRange: filters.dateRange,
  selectedBrands: filters.brands,
  region: filters.region
};
```

### Migration Steps

#### Phase 1: Database Setup (No Downtime)
```bash
# 1. Create SuqiIntel schema and tables
psql $DATABASE_URL < suqiintel_schema.sql

# 2. Create Edge Function
supabase functions new suqiintel-processor
supabase functions deploy suqiintel-processor

# 3. Set environment variables
supabase secrets set SUQIINTEL_API_KEY=your_key
supabase secrets set SUQIINTEL_ENDPOINT=your_endpoint
```

#### Phase 2: Frontend Integration (Incremental)
1. Add SuqiIntel components to existing dashboard
2. Deploy with feature flag (disabled by default)
3. Test with select users
4. Enable for all users

#### Phase 3: Rename WrenAI References
```sql
-- Update any existing references
UPDATE scout.ai_chat_logs 
SET llm_provider = 'suqiintel' 
WHERE llm_provider = 'wrenai';

-- Update function names
ALTER FUNCTION IF EXISTS scout.process_wren_query 
RENAME TO process_suqiintel_query;
```

### Configuration Updates

#### 1. Environment Variables
```env
# .env.production
NEXT_PUBLIC_SUQIINTEL_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### 2. Supabase Functions Config
```json
{
  "suqiintel-processor": {
    "memory": 1024,
    "timeout": 30,
    "env": {
      "SUQIINTEL_MODEL": "gpt-4",
      "ENABLE_CACHING": "true"
    }
  }
}
```

### Testing Plan

1. **Unit Tests**:
   - SQL generation accuracy
   - Query parsing
   - Context enhancement

2. **Integration Tests**:
   - End-to-end query processing
   - Gold layer view access
   - Performance benchmarks

3. **User Acceptance Tests**:
   - Natural language understanding
   - Result accuracy
   - Response time

### Rollback Plan

If issues arise:
1. Disable SuqiIntel feature flag
2. Queries continue working with existing Gold layer
3. No impact on current dashboard functionality

### Success Metrics

1. **Query Success Rate**: >90% of queries return valid results
2. **Response Time**: <3 seconds for 95% of queries
3. **User Adoption**: 50% of users try SuqiIntel within first week
4. **Accuracy**: 85% of generated SQL queries are correct

### Timeline

- **Week 1**: Database schema and Edge Function setup
- **Week 2**: Frontend integration and testing
- **Week 3**: Beta rollout to select users
- **Week 4**: Full production rollout

This plan ensures SuqiIntel integrates seamlessly with the existing Scout Dashboard without disrupting current functionality.