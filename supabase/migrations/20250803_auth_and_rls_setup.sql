-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for admin_users updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to verify admin user credentials
CREATE OR REPLACE FUNCTION public.verify_admin_user(
    p_email TEXT,
    p_password TEXT
) RETURNS TABLE (
    user_id UUID,
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
    
    -- Update last login timestamp if login successful
    IF FOUND THEN
        UPDATE public.admin_users 
        SET last_login_at = NOW() 
        WHERE admin_users.email = p_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create admin user
CREATE OR REPLACE FUNCTION public.create_admin_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'admin'
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO public.admin_users (email, password_hash, full_name, role)
    VALUES (p_email, crypt(p_password, gen_salt('bf')), p_full_name, p_role)
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a default admin user (you should change the password immediately)
SELECT public.create_admin_user(
    'admin@tbwa.com',
    'ChangeMeImmediately123!',
    'System Administrator',
    'super_admin'
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can only see their own data unless they're super_admin
CREATE POLICY "Admin users can view own data" ON public.admin_users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert admin users" ON public.admin_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Admin users can update own data" ON public.admin_users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can delete admin users" ON public.admin_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Enable RLS on Scout Dashboard tables
ALTER TABLE public.gold_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_transactions_cleaned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bronze_transactional_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_sub_media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bronze_campaign_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bronze_creative_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bronze_media_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bronze_performance_data ENABLE ROW LEVEL SECURITY;

-- Create public read access policies for analytics tables
-- Gold layer - full public read access
CREATE POLICY "Enable read access for all users on gold_daily_metrics" ON public.gold_daily_metrics
    FOR SELECT USING (true);

-- Silver layer - full public read access
CREATE POLICY "Enable read access for all users on silver_transactions_cleaned" ON public.silver_transactions_cleaned
    FOR SELECT USING (true);

-- Bronze layer - public read access
CREATE POLICY "Enable read access for all users on bronze_transactional_data" ON public.bronze_transactional_data
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on bronze_campaign_data" ON public.bronze_campaign_data
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on bronze_creative_data" ON public.bronze_creative_data
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on bronze_media_data" ON public.bronze_media_data
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on bronze_performance_data" ON public.bronze_performance_data
    FOR SELECT USING (true);

-- Dimension tables - public read access
CREATE POLICY "Enable read access for all users on dim_brands" ON public.dim_brands
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on dim_categories" ON public.dim_categories
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on dim_clients" ON public.dim_clients
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on dim_media_types" ON public.dim_media_types
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on dim_offices" ON public.dim_offices
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on dim_regions" ON public.dim_regions
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users on dim_sub_media_types" ON public.dim_sub_media_types
    FOR SELECT USING (true);

-- Write policies - only authenticated admin users
CREATE POLICY "Admin users can insert into gold_daily_metrics" ON public.gold_daily_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admin users can update gold_daily_metrics" ON public.gold_daily_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admin users can delete from gold_daily_metrics" ON public.gold_daily_metrics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Similar write policies for silver_transactions_cleaned
CREATE POLICY "Admin users can insert into silver_transactions_cleaned" ON public.silver_transactions_cleaned
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admin users can update silver_transactions_cleaned" ON public.silver_transactions_cleaned
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admin users can delete from silver_transactions_cleaned" ON public.silver_transactions_cleaned
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Create function to check if user is authenticated admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.admin_users 
    WHERE id = auth.uid() AND is_active = true;
    
    RETURN COALESCE(v_role, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO anon, authenticated;

-- Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gold_daily_metrics_date ON public.gold_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_gold_daily_metrics_client ON public.gold_daily_metrics(client_name);
CREATE INDEX IF NOT EXISTS idx_gold_daily_metrics_region ON public.gold_daily_metrics(region_name);
CREATE INDEX IF NOT EXISTS idx_gold_daily_metrics_composite ON public.gold_daily_metrics(date, client_name, region_name);

CREATE INDEX IF NOT EXISTS idx_silver_transactions_date ON public.silver_transactions_cleaned(transaction_date);
CREATE INDEX IF NOT EXISTS idx_silver_transactions_client ON public.silver_transactions_cleaned(client_id);
CREATE INDEX IF NOT EXISTS idx_silver_transactions_media ON public.silver_transactions_cleaned(media_type_id);

-- Add helpful comments
COMMENT ON TABLE public.admin_users IS 'Admin users table for Scout Dashboard authentication';
COMMENT ON FUNCTION public.verify_admin_user IS 'Verifies admin user credentials and returns user details if valid';
COMMENT ON FUNCTION public.create_admin_user IS 'Creates a new admin user with encrypted password';
COMMENT ON FUNCTION public.is_admin_user IS 'Checks if the current user is an authenticated admin';
COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of the current user or anonymous if not authenticated';

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, 
        action, 
        table_name, 
        record_id, 
        old_data, 
        new_data,
        ip_address,
        user_agent
    )
    VALUES (
        auth.uid(),
        p_action,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        current_setting('request.headers', true)::json->>'x-real-ip',
        current_setting('request.headers', true)::json->>'user-agent'
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on audit function
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Authentication and RLS setup completed successfully!';
    RAISE NOTICE 'Default admin user created: admin@tbwa.com';
    RAISE NOTICE 'IMPORTANT: Change the default password immediately!';
END $$;