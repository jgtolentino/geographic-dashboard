# 🔧 Environment Variable Fix

## Problem Fixed
The error `Missing Supabase environment variables` was caused by using Next.js style env vars (`process.env`) in a Vite project.

## Solution Applied
1. Changed from `process.env.NEXT_PUBLIC_*` to `import.meta.env.VITE_*`
2. Updated `.env.local` to use `VITE_` prefix
3. Fixed the runtime error

## Add to Vercel Dashboard

Go to your [Vercel Project Settings](https://vercel.com/scout-db/geographic-dashboard/settings/environment-variables) and add:

```
VITE_SUPABASE_URL = https://cxzllzyxwpyptfretryc.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYzNjUsImV4cCI6MjA2ODI3MjM2NX0.cBREqVnVaXzTOJ2YfmJqUeB0I4_l1mdffNaEqDtKUe0
```

Then redeploy.

## Local Development
Your `.env.local` is already configured correctly. Just run:
```bash
npm run dev
```

The dashboard will now connect to Supabase properly! 🚀