-- =====================================================
-- SOCIAL MEDIA AUTOMATION PLATFORM - Full Schema
-- =====================================================

-- 1. Enhanced social_integrations table for OAuth/API connections
CREATE TABLE IF NOT EXISTS public.social_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  connection_type TEXT NOT NULL DEFAULT 'oauth' CHECK (connection_type IN ('oauth', 'api_key')),
  
  -- OAuth tokens (encrypted in production)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- API key based auth
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  
  -- Platform-specific data
  platform_user_id TEXT,
  platform_username TEXT,
  platform_display_name TEXT,
  platform_avatar_url TEXT,
  platform_metadata JSONB DEFAULT '{}',
  
  -- Connection status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'expired', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Permissions/scopes granted
  scopes TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, platform)
);

-- 2. Fetched posts from connected platforms
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_id UUID REFERENCES public.social_integrations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  -- Post identifiers
  platform_post_id TEXT NOT NULL,
  platform_permalink TEXT,
  
  -- Post content
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'audio', 'link', 'story', 'reel', 'article', 'poll', 'other')),
  content_text TEXT,
  content_preview TEXT,
  media_urls JSONB DEFAULT '[]',
  thumbnails JSONB DEFAULT '[]',
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2),
  
  -- Metadata
  posted_at TIMESTAMPTZ NOT NULL,
  hashtags TEXT[],
  mentions TEXT[],
  platform_metadata JSONB DEFAULT '{}',
  
  -- Sync tracking
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(integration_id, platform_post_id)
);

-- 3. Draft posts for publishing
CREATE TABLE IF NOT EXISTS public.social_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Content
  title TEXT,
  content_text TEXT NOT NULL,
  media_attachments JSONB DEFAULT '[]',
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'audio', 'link', 'article', 'poll')),
  
  -- Platform-specific content overrides
  platform_content JSONB DEFAULT '{}',
  
  -- Target platforms
  target_platforms TEXT[] NOT NULL DEFAULT '{}',
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  
  -- Workflow status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT,
  
  -- Preview
  preview_generated_at TIMESTAMPTZ,
  preview_data JSONB DEFAULT '{}',
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Published posts tracking
CREATE TABLE IF NOT EXISTS public.social_published (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  draft_id UUID REFERENCES public.social_drafts(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES public.social_integrations(id) ON DELETE SET NULL,
  
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  platform_permalink TEXT,
  
  -- Publishing details
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_snapshot TEXT,
  media_snapshot JSONB DEFAULT '[]',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Engagement tracking
  initial_metrics JSONB DEFAULT '{}',
  latest_metrics JSONB DEFAULT '{}',
  metrics_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Publishing queue for background jobs
CREATE TABLE IF NOT EXISTS public.social_publish_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  draft_id UUID NOT NULL REFERENCES public.social_drafts(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.social_integrations(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  
  -- Result
  published_id UUID REFERENCES public.social_published(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Platform API configuration (for admin/system use)
CREATE TABLE IF NOT EXISTS public.social_platform_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  
  -- Capabilities
  supports_oauth BOOLEAN DEFAULT false,
  supports_api_key BOOLEAN DEFAULT false,
  supports_read BOOLEAN DEFAULT true,
  supports_publish BOOLEAN DEFAULT false,
  supports_schedule BOOLEAN DEFAULT false,
  supports_media_types TEXT[] DEFAULT ARRAY['text'],
  
  -- OAuth config (non-sensitive)
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_scopes TEXT[],
  
  -- API docs
  api_docs_url TEXT,
  developer_portal_url TEXT,
  
  -- Limits
  rate_limit_requests INTEGER,
  rate_limit_window_seconds INTEGER,
  max_post_length INTEGER,
  max_media_size_mb INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default platform configurations
INSERT INTO public.social_platform_config (platform, display_name, icon, color, supports_oauth, supports_api_key, supports_read, supports_publish, supports_schedule, supports_media_types, max_post_length, oauth_scopes, developer_portal_url) VALUES
  ('linkedin', 'LinkedIn', 'Linkedin', '#0A66C2', true, false, true, true, true, ARRAY['text', 'image', 'video', 'article'], 3000, ARRAY['r_liteprofile', 'r_emailaddress', 'w_member_social'], 'https://developer.linkedin.com/'),
  ('twitter', 'Twitter / X', 'Twitter', '#1DA1F2', true, true, true, true, true, ARRAY['text', 'image', 'video', 'poll'], 280, ARRAY['tweet.read', 'tweet.write', 'users.read', 'offline.access'], 'https://developer.twitter.com/'),
  ('instagram', 'Instagram', 'Instagram', '#E4405F', true, false, true, true, true, ARRAY['image', 'video', 'reel', 'story'], 2200, ARRAY['instagram_basic', 'instagram_content_publish'], 'https://developers.facebook.com/'),
  ('facebook', 'Facebook', 'Facebook', '#1877F2', true, false, true, true, true, ARRAY['text', 'image', 'video', 'link'], 63206, ARRAY['pages_read_engagement', 'pages_manage_posts'], 'https://developers.facebook.com/'),
  ('youtube', 'YouTube', 'Youtube', '#FF0000', true, true, true, true, true, ARRAY['video'], 5000, ARRAY['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'], 'https://console.cloud.google.com/'),
  ('tiktok', 'TikTok', 'Music', '#000000', true, false, true, true, false, ARRAY['video'], 2200, ARRAY['user.info.basic', 'video.upload'], 'https://developers.tiktok.com/'),
  ('pinterest', 'Pinterest', 'Image', '#E60023', true, false, true, true, true, ARRAY['image', 'video', 'link'], 500, ARRAY['boards:read', 'pins:read', 'pins:write'], 'https://developers.pinterest.com/'),
  ('snapchat', 'Snapchat', 'Ghost', '#FFFC00', true, false, true, false, false, ARRAY['image', 'video'], 250, ARRAY['snapchat-marketing-api'], 'https://developers.snap.com/'),
  ('threads', 'Threads', 'MessageCircle', '#000000', true, false, true, true, false, ARRAY['text', 'image'], 500, ARRAY['threads_basic', 'threads_content_publish'], 'https://developers.facebook.com/'),
  ('whatsapp', 'WhatsApp Business', 'MessageCircle', '#25D366', false, true, true, true, false, ARRAY['text', 'image', 'video'], 4096, NULL, 'https://business.whatsapp.com/'),
  ('telegram', 'Telegram', 'Send', '#0088CC', false, true, true, true, false, ARRAY['text', 'image', 'video', 'audio'], 4096, NULL, 'https://core.telegram.org/bots'),
  ('reddit', 'Reddit', 'Chrome', '#FF4500', true, false, true, true, false, ARRAY['text', 'image', 'link'], 40000, ARRAY['identity', 'submit', 'read'], 'https://www.reddit.com/dev/api'),
  ('discord', 'Discord', 'MessageSquare', '#5865F2', false, true, false, true, false, ARRAY['text', 'image'], 2000, NULL, 'https://discord.com/developers'),
  ('tumblr', 'Tumblr', 'Bookmark', '#35465C', true, false, true, true, true, ARRAY['text', 'image', 'video', 'audio'], 4096, ARRAY['basic', 'write'], 'https://www.tumblr.com/docs/en/api/v2'),
  ('twitch', 'Twitch', 'Twitch', '#9146FF', true, false, true, false, false, ARRAY['video'], 500, ARRAY['channel:read:stream_key', 'user:read:email'], 'https://dev.twitch.tv/')
ON CONFLICT (platform) DO NOTHING;

-- Enable RLS
ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_platform_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_integrations
CREATE POLICY "Users can view own integrations" ON public.social_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own integrations" ON public.social_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON public.social_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON public.social_integrations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_posts
CREATE POLICY "Users can view own posts" ON public.social_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own posts" ON public.social_posts FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for social_drafts
CREATE POLICY "Users can view own drafts" ON public.social_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own drafts" ON public.social_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.social_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON public.social_drafts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_published
CREATE POLICY "Users can view own published" ON public.social_published FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own published" ON public.social_published FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for social_publish_queue
CREATE POLICY "Users can view own queue" ON public.social_publish_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own queue" ON public.social_publish_queue FOR ALL USING (auth.uid() = user_id);

-- Platform config is public read
CREATE POLICY "Anyone can read platform config" ON public.social_platform_config FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_integrations_user_platform ON public.social_integrations(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_platform ON public.social_posts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON public.social_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_drafts_user_status ON public.social_drafts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_drafts_scheduled ON public.social_drafts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_publish_queue_pending ON public.social_publish_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_social_publish_queue_user ON public.social_publish_queue(user_id, status);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_publish_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_drafts;