# 🔐 Scout Dashboard Authentication Setup Guide

## Quick Fix for 401 Errors

The 401 errors are happening because Row Level Security (RLS) is likely enabled on your tables without proper policies. Here's how to fix it:

### Option 1: Quick Fix (Immediate Solution)

1. **Open Supabase SQL Editor**: [Click here](https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql/new)

2. **Run this SQL to enable public read access**:
```sql
-- Disable RLS temporarily (quickest fix)
ALTER TABLE IF EXISTS public.gold_daily_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.silver_transactions_cleaned DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, add public read policies:
ALTER TABLE IF EXISTS public.gold_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.silver_transactions_cleaned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.gold_daily_metrics;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.silver_transactions_cleaned;

CREATE POLICY "Enable read access for all users" ON public.gold_daily_metrics
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.silver_transactions_cleaned
  FOR SELECT USING (true);

-- Grant permissions to anon role for RPC functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
```

### Option 2: Full Authentication Setup

1. **Run the full migration** (`20240803000000_auth_and_rls_setup.sql`) which includes:
   - Admin user management system
   - Proper RLS policies
   - Default admin account creation
   - Audit logging

2. **Default Admin Credentials**:
   - Email: `admin@tbwa.com`
   - Password: `ChangeMeImmediately123!`

### Option 3: Check Existing Tables

First, verify what tables exist in your database:

```sql
-- Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Setting Up Admin Authentication

### 1. Add Login Page to Your App

```tsx
// In your main App.tsx or a dedicated admin route
import { LoginForm } from '@/components/auth/login-form'
import { AuthProvider } from '@/hooks/use-auth'

function App() {
  return (
    <AuthProvider>
      {/* Your existing app */}
      <Routes>
        <Route path="/admin/login" element={<LoginForm />} />
        {/* Other routes */}
      </Routes>
    </AuthProvider>
  )
}
```

### 2. Protect Admin Routes

```tsx
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!user || !isAdmin) return <Navigate to="/admin/login" />
  
  return <>{children}</>
}

// Usage:
<Route path="/admin/*" element={
  <ProtectedRoute>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### 3. Add Admin UI Elements

```tsx
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LogOut, Shield } from 'lucide-react'

function AdminHeader() {
  const { user, userRole, signOut } = useAuth()
  
  if (!user) return null
  
  return (
    <div className="flex items-center gap-4">
      <Badge variant="secondary">
        <Shield className="w-3 h-3 mr-1" />
        {userRole}
      </Badge>
      <span className="text-sm">{user.email}</span>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  )
}
```

## Environment Variables

Make sure your environment variables are set correctly:

### Local Development (.env.local)
```env
VITE_SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenlod3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYzNjUsImV4cCI6MjA2ODI3MjM2NX0.cBREqVnVaXzTOJ2YfmJqUeB0I4_l1mdffNaEqDtKUe0
```

### Vercel Production
Add these in [Vercel Dashboard](https://vercel.com/scout-db/geographic-dashboard/settings/environment-variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Troubleshooting

### If you still get 401 errors:

1. **Check Supabase Dashboard Settings**:
   - Go to Authentication → Settings
   - Make sure "Enable anonymous sign-ins" is ON

2. **Verify API Keys**:
   - Make sure you're using the `anon` key, not the `service_role` key
   - The anon key should have `"role":"anon"` in its JWT payload

3. **Check Table Existence**:
   ```sql
   -- Run this to see what's actually in your database
   SELECT 
     table_name,
     (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
   FROM information_schema.tables t
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

4. **Create Missing Tables**:
   If the medallion tables don't exist, you need to run the medallion migration first.

## Next Steps

1. **For immediate fix**: Run the Quick Fix SQL above
2. **For production**: Implement the full authentication system
3. **Security**: Change the default admin password immediately after setup
4. **Monitoring**: Use the audit log to track admin actions

## Support

If you continue to have issues:
1. Check the Supabase logs in the Dashboard
2. Verify your project URL and keys are correct
3. Make sure you're not using the service role key in the client
4. Check browser console for detailed error messages