# 🔐 Vercel Environment Variables Setup

## Add these to Vercel Dashboard

Go to: https://vercel.com/scout-db/geographic-dashboard/settings/environment-variables

### Required Variables:

```
VITE_SUPABASE_URL = https://cxzllzyxwpyptfretryc.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYzNjUsImV4cCI6MjA2ODI3MjM2NX0.cBREqVnVaXzTOJ2YfmJqUeB0I4_l1mdffNaEqDtKUe0
```

### For AI Features (Add if using API routes):
```
OPENAI_API_KEY = [Your OpenAI API key]
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5NjM2NSwiZXhwIjoyMDY4MjcyMzY1fQ.LhKKGp4A_cMBl-8uPR1x7tk-cXJE7VQXDJy8VvPGKJg
```

## Important Notes:
- The OpenAI key should NOT be exposed to the client (no VITE_ prefix)
- Service role key should ONLY be used in server-side functions
- After adding variables, redeploy your project

## Local Development:
Your `.env.local` is already configured with all necessary keys.