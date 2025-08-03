-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES public.admin_users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to verify admin user credentials
CREATE OR REPLACE FUNCTION public.verify_admin_user(p_email TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.full_name,
    au.role,
    au.is_active
  FROM public.admin_users au
  WHERE au.email = p_email 
    AND au.password_hash = crypt(p_password, au.password_hash)
    AND au.is_active = true;
    
  -- Update last login if successful
  IF FOUND THEN
    UPDATE public.admin_users 
    SET last_login = NOW() 
    WHERE email = p_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin user
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO public.admin_users (email, password_hash, full_name, role)
  VALUES (p_email, crypt(p_password, gen_salt('bf')), p_full_name, p_role)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.admin_users 
    WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default admin user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'admin@tbwa.com') THEN
    PERFORM public.create_admin_user(
      'admin@tbwa.com',
      'ChangeMeImmediately123!',
      'TBWA Admin',
      'super_admin'
    );
  END IF;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Scout Dashboard tables if they exist
DO $$
BEGIN
  -- Gold tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_daily_metrics') THEN
    ALTER TABLE public.gold_daily_metrics ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_product_performance') THEN
    ALTER TABLE public.gold_product_performance ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_customer_segments') THEN
    ALTER TABLE public.gold_customer_segments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Silver tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_transactions_cleaned') THEN
    ALTER TABLE public.silver_transactions_cleaned ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_products_enriched') THEN
    ALTER TABLE public.silver_products_enriched ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_customers_deduplicated') THEN
    ALTER TABLE public.silver_customers_deduplicated ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Bronze tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bronze_transactions_raw') THEN
    ALTER TABLE public.bronze_transactions_raw ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bronze_products_raw') THEN
    ALTER TABLE public.bronze_products_raw ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bronze_customers_raw') THEN
    ALTER TABLE public.bronze_customers_raw ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Dimension tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_locations') THEN
    ALTER TABLE public.dim_locations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_time') THEN
    ALTER TABLE public.dim_time ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_categories') THEN
    ALTER TABLE public.dim_categories ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- RLS Policies for admin tables
-- Admin users can only see their own data (except super_admins)
CREATE POLICY "Admin users select own data" ON public.admin_users
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email 
    OR public.get_user_role() = 'super_admin'
  );

CREATE POLICY "Super admins can insert users" ON public.admin_users
  FOR INSERT WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "Super admins can update users" ON public.admin_users
  FOR UPDATE USING (public.get_user_role() = 'super_admin');

-- Audit log policies
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "System can insert audit logs" ON public.admin_audit_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for Scout Dashboard tables (PUBLIC READ ACCESS)
-- Gold tables - Allow public read access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_daily_metrics') THEN
    CREATE POLICY "Public read access" ON public.gold_daily_metrics
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.gold_daily_metrics
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_product_performance') THEN
    CREATE POLICY "Public read access" ON public.gold_product_performance
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.gold_product_performance
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gold_customer_segments') THEN
    CREATE POLICY "Public read access" ON public.gold_customer_segments
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.gold_customer_segments
      FOR ALL USING (public.is_admin_user());
  END IF;
END;
$$;

-- Silver tables - Allow public read access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_transactions_cleaned') THEN
    CREATE POLICY "Public read access" ON public.silver_transactions_cleaned
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.silver_transactions_cleaned
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_products_enriched') THEN
    CREATE POLICY "Public read access" ON public.silver_products_enriched
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.silver_products_enriched
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silver_customers_deduplicated') THEN
    CREATE POLICY "Public read access" ON public.silver_customers_deduplicated
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.silver_customers_deduplicated
      FOR ALL USING (public.is_admin_user());
  END IF;
END;
$$;

-- Bronze tables - Allow public read access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bronze_transactions_raw') THEN
    CREATE POLICY "Public read access" ON public.bronze_transactions_raw
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.bronze_transactions_raw
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bronze_products_raw') THEN
    CREATE POLICY "Public read access" ON public.bronze_products_raw
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.bronze_products_raw
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bronze_customers_raw') THEN
    CREATE POLICY "Public read access" ON public.bronze_customers_raw
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.bronze_customers_raw
      FOR ALL USING (public.is_admin_user());
  END IF;
END;
$$;

-- Dimension tables - Allow public read access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_locations') THEN
    CREATE POLICY "Public read access" ON public.dim_locations
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.dim_locations
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_time') THEN
    CREATE POLICY "Public read access" ON public.dim_time
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.dim_time
      FOR ALL USING (public.is_admin_user());
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_categories') THEN
    CREATE POLICY "Public read access" ON public.dim_categories
      FOR SELECT USING (true);
    
    CREATE POLICY "Admin write access" ON public.dim_categories
      FOR ALL USING (public.is_admin_user());
  END IF;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.verify_admin_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;

-- Grant permissions for RPC functions if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_category_performance') THEN
    GRANT EXECUTE ON FUNCTION public.get_category_performance TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_hourly_transaction_pattern') THEN
    GRANT EXECUTE ON FUNCTION public.get_hourly_transaction_pattern TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_product_mix_stats') THEN
    GRANT EXECUTE ON FUNCTION public.get_product_mix_stats TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_top_skus') THEN
    GRANT EXECUTE ON FUNCTION public.get_top_skus TO anon, authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_trending_products') THEN
    GRANT EXECUTE ON FUNCTION public.get_trending_products TO anon, authenticated;
  END IF;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();