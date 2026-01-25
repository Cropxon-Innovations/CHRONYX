-- =============================================
-- CHRONYX ADMIN PANEL INFRASTRUCTURE
-- =============================================

-- 1. Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 5. Admin activity logs (what admins do, not user private data)
CREATE TABLE public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'template', 'notification', etc.
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Admin-published templates (visible to all users)
CREATE TABLE public.admin_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'study', 'exam', 'finance', etc.
    template_type TEXT NOT NULL, -- 'syllabus', 'exam', 'workflow', etc.
    template_data JSONB NOT NULL DEFAULT '{}',
    cover_image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    published_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. System notifications (from admin to all users)
CREATE TABLE public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'update', 'promo'
    target_audience TEXT DEFAULT 'all', -- 'all', 'free', 'pro', 'premium'
    action_url TEXT,
    action_label TEXT,
    is_dismissible BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. User notification status (which notifications user has read/dismissed)
CREATE TABLE public.user_notification_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_id UUID REFERENCES public.system_notifications(id) ON DELETE CASCADE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    UNIQUE (user_id, notification_id)
);

-- 9. Platform analytics summary (aggregated, no PII)
CREATE TABLE public.platform_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    free_users INTEGER DEFAULT 0,
    pro_users INTEGER DEFAULT 0,
    premium_users INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    study_sessions INTEGER DEFAULT 0,
    library_views INTEGER DEFAULT 0,
    finance_transactions INTEGER DEFAULT 0,
    edge_function_calls INTEGER DEFAULT 0,
    storage_used_mb DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Service health monitoring
CREATE TABLE public.service_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'degraded', 'down'
    response_time_ms INTEGER,
    last_check_at TIMESTAMPTZ DEFAULT now(),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- 11. Feature usage tracking (aggregated by feature, not user-specific)
CREATE TABLE public.feature_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT NOT NULL,
    date DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_duration_seconds DECIMAL(10, 2),
    UNIQUE (feature_name, date)
);

-- 12. Admin pricing configuration
CREATE TABLE public.pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL,
    annual_price DECIMAL(10, 2),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_activity_logs (admin only)
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs
    FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can create activity logs" ON public.admin_activity_logs
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for admin_templates (read by all, write by admin)
CREATE POLICY "Anyone can view active templates" ON public.admin_templates
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON public.admin_templates
    FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for system_notifications (read by all, write by admin)
CREATE POLICY "Users can view active notifications" ON public.system_notifications
    FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins can manage notifications" ON public.system_notifications
    FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for user_notification_status
CREATE POLICY "Users can view their notification status" ON public.user_notification_status
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their notification status" ON public.user_notification_status
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for platform_analytics (admin only)
CREATE POLICY "Admins can view analytics" ON public.platform_analytics
    FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage analytics" ON public.platform_analytics
    FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for service_health (admin only)
CREATE POLICY "Admins can view service health" ON public.service_health
    FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage service health" ON public.service_health
    FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for feature_usage_stats (admin only)
CREATE POLICY "Admins can view usage stats" ON public.feature_usage_stats
    FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage usage stats" ON public.feature_usage_stats
    FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for pricing_config (read by all, write by admin)
CREATE POLICY "Anyone can view active pricing" ON public.pricing_config
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pricing" ON public.pricing_config
    FOR ALL USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_templates_category ON public.admin_templates(category);
CREATE INDEX idx_admin_templates_is_active ON public.admin_templates(is_active);
CREATE INDEX idx_system_notifications_active ON public.system_notifications(is_active, starts_at, expires_at);
CREATE INDEX idx_user_notification_status_user ON public.user_notification_status(user_id);
CREATE INDEX idx_platform_analytics_date ON public.platform_analytics(date DESC);
CREATE INDEX idx_feature_usage_date ON public.feature_usage_stats(date DESC);

-- Add updated_at triggers
CREATE TRIGGER update_admin_templates_updated_at
    BEFORE UPDATE ON public.admin_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at
    BEFORE UPDATE ON public.pricing_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin role for originxlabs@gmail.com (will be linked when user exists)
-- This is done via edge function for security